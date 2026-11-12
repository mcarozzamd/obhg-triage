// 11 Nov 2026 release candidate: ALG-DM-INTRAPARTUM dose/branch tests + plain-name display tests. Synthetic values only.
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path');
global.self=global;const root=path.resolve(__dirname,'..');
const M=require('../js/dm-intrapartum.js'),C=require('../js/content.js'),E=require('../js/engine.js'),D=require('../js/display-names.js');
// Independent expectation table (CSM chart as transcribed in the spec + the Type 1 floor clinician override).
const EXP=[[[-1,0,1,40,59,60],'le60',0,/^D5LR 125/],[[61,62,69,70,75,89,90],'61-90',0,/^D5LR 125/],[[91,100,119,120],'91-120',0.5,/^D5LR 125/],
 [[121,135,150],'121-150',1,/^LR 125/],[[151,170,180],'151-180',2,/^LR 125/],[[181,200,220],'181-220',3,/^LR 125/],[[221,240,250],'221-250',4,/^LR 125/],[[251,300,400,600],'gt250',5,/^LR 125/]];
let n=0;
for(const [vals,band,rate,fluid] of EXP)for(const type of ['A1','A2','T2','T1'])for(const g of vals){if(g<0)continue;
 test(`FSBG ${g} type ${type} -> ${band}`,()=>{const a=M.action(type,g);n++;assert.equal(M.band(g).id,band);assert.equal(a.band,band);assert.match(a.fluid,fluid);
  const want=(band==='61-90'&&type==='T1')?0.5:rate;assert.equal(a.insulinUnitsPerHour,want);assert.ok(a.insulinUnitsPerHour<=M.MAX_RATE);
  if(band==='le60'){assert.equal(a.notifyProvider,true);assert.equal(a.hypoglycemiaProtocol,true);assert.equal(a.recheckMinutes,15);if(type==='T1')assert.match(a.insulin,/EMERGENCY PAUSE/);}
  if(band==='61-90'&&type==='T1'){assert.match(a.override,/Clinician override of the CSM chart/);assert.deepEqual(a.providerRange,[0.5,1]);assert.equal(a.notifyProvider,true);}
  if(band==='61-90'&&type!=='T1'){assert.equal(a.override,null);assert.equal(a.insulinUnitsPerHour,0);}
  if(band==='61-90'&&g<=69)assert.ok(a.flags.includes('HYPO_CONTINGENCY_OVERLAP_61_69'));
  if(band==='gt250')assert.equal(a.notifyProvider,true);
  if(type==='T1'&&/^LR/.test(a.fluid))assert.ok(a.flags.includes('T1_LR_KETOSIS_WATCH'));});}
test('type 1 with effective SC basal or pump: no IV floor, no stacking',()=>{const a=M.action('T1',75,{effectiveBasal:true});assert.equal(a.insulinUnitsPerHour,0);assert.match(a.insulin,/Do not stack/);});
test('non-integer FSBG rejected (decimal rounding rule not set by spec)',()=>{for(const g of [60.5,90.4,120.1,NaN])assert.throws(()=>M.band(g));});
test('unknown diabetes type rejected',()=>assert.throws(()=>M.action('X',100)));
test('D50 questionable consciousness split (CSM pharmacy): <50 -> 50 mL, 50-69 -> 25 mL, >=70 none',()=>{assert.match(M.d50QuestionableConsciousness(49),/50 mL/);assert.match(M.d50QuestionableConsciousness(50),/25 mL/);assert.match(M.d50QuestionableConsciousness(69),/25 mL/);assert.equal(M.d50QuestionableConsciousness(70),null);});
test('dose table rows and rendered text companion agree with the module',()=>{const fd=C.items.find(i=>i.id==='FD-ANT-05');assert.ok(fd);assert.equal(fd.card,'ANT-05');assert.equal(fd.algorithm_id,'ALG-DM-INTRAPARTUM');const rows=M.table();assert.equal(rows.length,8);
 for(const r of rows){assert.ok(fd.html.includes(String(r.byType.T2.insulinUnitsPerHour))||r.byType.T2.insulinUnitsPerHour===0);}assert.match(fd.html,/dm-table/);assert.match(fd.text,/Doses to be checked against CSM pharmacy build/);assert.match(fd.html,/Clinician override of the CSM chart/);});
test('ANT-05 card is the entry point and the engine attaches the new algorithm',()=>{const c=C.items.find(i=>i.id==='ANT-05');assert.match(c.html,/data-open="FD-ANT-05"/);const r=E.triage('G2P1 at 38 weeks type 1 diabetes in labor on insulin drip',C,require('../codes/code_tables.js'),require('../codes/validation.js'));assert.equal(r.top.id,'ANT-05');assert.equal(r.top.diagram&&r.top.diagram.id,'FD-ANT-05');});
test('algorithm image present, display copy present and precached; cache bumped',()=>{const fd=C.items.find(i=>i.id==='FD-ANT-05');assert.ok(fs.existsSync(path.join(root,fd.img)));assert.ok(fs.existsSync(path.join(root,'assets/display-diagrams/FD-ANT-05.png')));const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');assert.ok(sw.includes('v24-2026-11-11-dm-titles'));assert.ok(sw.includes('./js/display-names.js'));
 for(const i of C.items.filter(i=>i.kind==='diagram')){assert.ok(sw.includes('./assets/display-diagrams/'+i.id+'.png'),i.id);assert.ok(fs.existsSync(path.join(root,'assets/display-diagrams/'+i.id+'.png')),i.id);}});
// Display names
const code=/\b(?:FD|ANT|LND|SYS|GYN|GYNB|PP|ED|ALG)-[A-Z0-9]/;
test('every item has one unique plain-condition name with no visible code',()=>{assert.equal(D.rows.length,C.items.length);const names=new Set();for(const i of C.items){const t=D.title(i);assert.ok(D.byId[i.id],i.id);assert.ok(!code.test(t),t);assert.ok(!/\bflow\b|\bv\d/i.test(t),t);assert.ok(!names.has(t.toLowerCase()),t);names.add(t.toLowerCase());}});
test('example rename: Sys-03 Maternal Sepsis Flow -> Maternal sepsis',()=>assert.equal(D.title('FD-SYS-03'),'Maternal sepsis'));
let searches=0;const match=(q)=>{const terms=q.toLowerCase().split(/\s+/).filter(Boolean);return C.items.filter(it=>terms.every(t=>D.searchText(it).includes(t))).map(i=>i.id);};
for(const r of D.rows){const it=C.items.find(i=>i.id===r.id);for(const q of [...r.codes,r.old,r.name,...(r.aliases||[])])test(`search "${q}" finds ${r.id}`,()=>{searches++;assert.ok(match(q).includes(r.id));});}
test('internal ids, card links and source titles unchanged',()=>{for(const i of C.items){assert.ok(i.title&&i.id);}const refs=[...C.items.map(i=>i.html).join(' ').matchAll(/data-open="([^"]+)"/g)].map(m=>m[1]);for(const id of refs)assert.ok(C.items.some(i=>i.id===id),id);});
process.on('exit',()=>console.log(`DM band x type checks: ${n}; display-name search checks: ${searches}`));
