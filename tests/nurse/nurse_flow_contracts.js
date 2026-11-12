// Contracts for Doc verdict NF1-NF18 (doc-nurse-flow-trees-verdict-2026-11-12.md) + language parity.
// Synthetic inputs only; no holdout/blind cases are read.
const assert=require('node:assert/strict');
const N=require('../../js/nurse-flow.js'),RF=require('../../js/nurse-red-flags.js');
let pass=0,total=0;const by={};
function test(nf,name,fn){total++;by[nf]=(by[nf]||0)+1;try{fn();pass++;console.log('PASS '+nf+' '+name);}catch(e){console.log('FAIL '+nf+' '+name+': '+e.message);process.exitCode=1;}}
const POS=new Set(['yes','no','unsure','group_no']);
// Complete flow with every visible required item No unless overridden.
function flow(o={}){
 const s=N.create(o.ui||'en');
 s.status=o.status||'unknown';s.patientLanguage=o.plang===undefined?'en':o.plang;s.interpreter=o.interp||'';
 s.bp=o.bp===undefined?{sbp:118,dbp:72}:o.bp;s.hr=o.hr===undefined?84:o.hr;s.spo2=o.spo2===undefined?99:o.spo2;
 s.tree=o.tree===undefined?'T1':o.tree;s.text=o.text||'';s.privateScreen=o.priv===undefined?'yes':o.priv;
 if(o.fallHeight!==undefined)s.fallHeight=o.fallHeight;
 for(const [k,v] of Object.entries(o.ans||{}))N.setAnswer(s,k,v,'item');
 if(o.stopAfterSet)return s;
 for(let i=0;i<6;i++){const r=N.evaluate(s);for(const id of r.unanswered)if(!(o.skip||[]).includes(id))N.setAnswer(s,id,'no','item');}
 return s;
}
const ev=(o,prior)=>N.evaluate(flow(o),prior);
const TREES=['T1','T2','T3','T4'],STAT=['unknown','lt20','ge20','postpartum'];
// ---------------- mapping coverage ----------------
test('MAP','every one of the 26 current red-flag items maps to the gate, vitals, universal, safety, a tree or the add-on',()=>{
 const homes=new Set([...N.GATE,...N.UNIVERSAL,...N.SAFETY,...N.ADDON_ITEMS,'other_concern',...Object.values(N.TREES).flatMap(t=>t.items)]);
 for(const q of RF.items){if(q.id==='severe_bp'){const r=ev({bp:{sbp:170,dbp:90}});assert.ok(r.alerts.some(a=>a.id==='RF_SEVERE_BP'));continue;}
  if(q.id==='critical_condition'){assert.ok(homes.has('critical_shock')&&N.MECH.length===8);continue;}
  if(q.id==='collapse_infant'){assert.ok(homes.has('collapse_maternal')&&homes.has('collapse_baby'));continue;} // NB11 split (Doc bypass verdict)
  assert.ok(homes.has(q.id),q.id);}
 assert.equal(RF.items.length,26);
});
// ---------------- NF1 ----------------
const IMM=[...N.GATE,'headache_vision','sepsis','severe_abdominal','ectopic','harm_intent','psychosis'];
for(const t of TREES)for(const st of STAT)test('NF1',`tree ${t} status ${st}: every IMMEDIATE item answered, never not_asked`,()=>{
 const r=ev({tree:t,status:st});
 for(const id of IMM){if(id==='ectopic'&&(st==='ge20'||st==='postpartum')){assert.equal(r.states[id],'na_status');continue;}assert.ok(POS.has(r.states[id]),id+'='+r.states[id]);}
 assert.equal(r.held,false);assert.equal(r.disposition,'PROMPT_CLINICIAN_REVIEW');
});
test('NF1','every immediate-acuity question (non-mechanism) is in the required set for every tree',()=>{
 for(const t of TREES){const r=N.evaluate(Object.assign(N.create('en'),{tree:t}));for(const [id,it] of Object.entries(N.ITEMS))if(it.acuity==='immediate'&&!N.MECH.includes(id)&&id!=='ectopic')assert.ok(r.requiredItems.includes(id),t+' '+id);}
});
test('NF1','an unanswered IMMEDIATE item holds disposition and is "unanswered", not "not asked"',()=>{
 for(const id of IMM.filter(i=>i!=='ectopic')){const r=ev({skip:[id]});assert.equal(r.states[id],'unanswered',id);assert.equal(r.held,true);assert.equal(r.disposition,null);}
});
// ---------------- NF2 ----------------
for(const t of ['T1','T2','T4'])for(const st of ['ge20','unknown'])test('NF2',`${t} at ${st} records a fetal_movement answer`,()=>{const r=ev({tree:t,status:st});assert.ok(POS.has(r.states.fetal_movement));assert.ok(r.requiredItems.includes('fetal_movement'));});
test('NF2','fetal_movement is N/A by status at <20 wk and postpartum (never No)',()=>{for(const st of ['lt20','postpartum']){const r=ev({status:st});assert.equal(r.states.fetal_movement,'na_status');assert.equal(flow({status:st}).answers.fetal_movement,undefined);}});
// ---------------- NF3 ----------------
test('NF3','catch-all headers name symptoms, not tree names',()=>{const h=['hdr_T1','hdr_T2','hdr_T3','hdr_T4'].map(id=>N.ITEMS[id].en);assert.deepEqual(h,['Vaginal bleeding?','One-sided leg swelling or pain?','Contractions / leaking fluid?','Fever / chills / infection?']);for(const x of h)assert.doesNotMatch(x,/\bT[1-4]\b|tree/i);});
test('NF3','headers show only for trees not picked; SBAR lists every not-asked item by name',()=>{const r=ev({tree:'T1'});assert.deepEqual(r.headers,['hdr_T2','hdr_T3','hdr_T4']);const na=Object.keys(r.states).filter(id=>r.states[id]==='not_asked');assert.ok(na.length>0);for(const id of na)assert.ok(r.sbar.includes(N.ITEMS[id].en),id);});
test('NF3','header Yes opens that complaint: its items become required (not asked → asked)',()=>{const s=flow({tree:'T1',stopAfterSet:true});N.setAnswer(s,'hdr_T3','yes');const r=N.evaluate(s);assert.ok(r.activeTrees.includes('T3'));assert.equal(r.states.labor,'unanswered');assert.equal(r.held,true);});
// ---------------- NF4 ----------------
test('NF4','gate has 10 tiles (11 after the NB11 collapse split) including known critical vital/lab result or shock; tap = EMERGENT',()=>{assert.equal(N.GATE.length,11);assert.ok(N.GATE.includes('critical_shock'));assert.match(N.ITEMS.critical_shock.en,/Known critical vital\/lab result or shock/);const s=N.create('en');N.setAnswer(s,'critical_shock','yes');const r=N.evaluate(s);assert.equal(r.disposition,'EMERGENT');assert.equal(r.urgency,'immediate');});
// ---------------- NF5 ----------------
test('NF5','postpartum trauma, all other items No, stable measured vitals → URGENT',()=>{const r=ev({status:'postpartum',ans:{trauma_ipv:'yes'}});assert.equal(r.traumaDenied,true);assert.equal(r.disposition,'URGENT');assert.equal(r.states.fetal_movement,'na_status');assert.equal(r.states.labor,'na_status');});
test('NF5','same case with status Unknown and fetal_movement unanswered → IMMEDIATE',()=>{const r=ev({status:'unknown',ans:{trauma_ipv:'yes'},skip:['fetal_movement']});assert.equal(r.urgency,'immediate');assert.ok(r.alerts.some(a=>a.id==='RF_TRAUMA_DANGER'));assert.equal(r.states.fetal_movement,'unanswered');});
test('NF5','<20 wk trauma: fetal_movement N/A substitutes for No; labor/membranes do not (must be answered)',()=>{const r=ev({status:'lt20',ans:{trauma_ipv:'yes'}});assert.equal(r.disposition,'URGENT');assert.ok(POS.has(r.states.labor)&&POS.has(r.states.membranes));const r2=ev({status:'lt20',ans:{trauma_ipv:'yes'},skip:['labor']});assert.equal(r2.urgency,'immediate');});
test('NF5','N/A never substitutes when free text contradicts status (postpartum + "at 30 weeks")',()=>{const s=flow({status:'postpartum',ans:{trauma_ipv:'yes'}});const r1=N.evaluate(s);assert.equal(r1.disposition,'URGENT');s.text='G2P1 at 30 weeks';const r=N.evaluate(s,r1);assert.equal(r.statusConflict,true);assert.equal(r.states.fetal_movement,'unanswered');assert.equal(r.urgency,'immediate');assert.ok(r.alerts.some(a=>a.id==='RF_TRAUMA_DANGER'));assert.equal(r.disposition,null);});
test('NF5','na_status is never stored as an answer',()=>{for(const st of STAT){const s=flow({status:st});const r=N.evaluate(s);for(const [id,v] of Object.entries(r.states))if(v==='na_status')assert.equal(s.answers[id],undefined,id);}});
// ---------------- NF6 ----------------
for(const v of ['yes','unsure'])test('NF6',`afraid/not safe/partner controlling = ${v} → IMMEDIATE without trauma`,()=>{const r=ev({ans:{ipv_safety:v}});assert.equal(r.disposition,'EMERGENT');assert.ok(r.alerts.some(a=>a.id==='RF_IPV_SAFETY'));assert.equal(r.states.trauma_ipv,'no');});
test('NF6','safety item text covers afraid / not safe / controlling / won’t leave / answers for her',()=>{assert.match(N.ITEMS.ipv_safety.en,/Afraid.*not safe to go home.*controlling.*won’t leave.*answers for her/);assert.ok(N.SAFETY.includes('ipv_safety'));});
// ---------------- NF7 ----------------
test('NF7','private screening is required (blank holds)',()=>{const r=ev({priv:''});assert.ok(r.holds.includes('private_screen'));assert.equal(r.disposition,null);});
test('NF7','not private → PARTNER_RESCREEN open task in result and SBAR; acuity not raised',()=>{const r=ev({priv:'no'});assert.ok(r.alerts.some(a=>a.id==='PARTNER_RESCREEN'&&a.task));assert.equal(r.disposition,'PROMPT_CLINICIAN_REVIEW');assert.match(r.sbar,/Open tasks: .*PARTNER_RESCREEN/);});
test('NF7','cannot separate → IMMEDIATE',()=>{const r=ev({priv:'cannot_separate'});assert.equal(r.disposition,'EMERGENT');assert.ok(r.alerts.some(a=>a.id==='IPV_SAFETY'));});
test('NF7','partner/family interpreter counts as not private',()=>{const r=ev({plang:'es',interp:'family',priv:'yes'});assert.equal(r.privateEffective,'no');assert.ok(r.alerts.some(a=>a.id==='PARTNER_RESCREEN'));});
// ---------------- NF8 ----------------
for(const m of N.MECH)for(const v of ['yes','unsure'])test('NF8',`mechanism ${m}=${v} → IMMEDIATE`,()=>{const r=ev({ans:{trauma_ipv:'yes',[m]:v}});assert.equal(r.disposition,'EMERGENT');assert.ok(r.alerts.some(a=>a.id==='RF_'+m.toUpperCase()));});
test('NF8','mechanisms are shown individually only when trauma is on (8 + fall)',()=>{const r=ev({ans:{trauma_ipv:'yes'}});for(const m of [...N.MECH,'fall'])assert.ok(r.requiredItems.includes(m),m);const r0=ev({});for(const m of N.MECH)assert.equal(r0.states[m],'na_trauma');});
test('NF8','fall with no height → FALL_HEIGHT_REQUIRED and no downgrade',()=>{const r=ev({status:'ge20',ans:{trauma_ipv:'yes',fall:'yes'}});assert.ok(r.alerts.some(a=>a.id==='FALL_HEIGHT_REQUIRED'));assert.equal(r.urgency,'immediate');});
test('NF8','fall >10 ft or height unknown → IMMEDIATE; ≤10 ft can downgrade',()=>{assert.ok(ev({ans:{trauma_ipv:'yes',fall:'yes'},fallHeight:12}).alerts.some(a=>a.id==='RF_FALL_HIGH'));assert.ok(ev({ans:{trauma_ipv:'yes',fall:'yes'},fallHeight:'unknown'}).alerts.some(a=>a.id==='RF_FALL_HIGH'));assert.equal(ev({status:'ge20',ans:{trauma_ipv:'yes',fall:'yes'},fallHeight:4}).disposition,'URGENT');});
test('NF8','downgraded trauma shows ≥4 h monitoring / Rh / KB workup (≥20 wk) and maternal evaluation (postpartum)',()=>{const r=ev({status:'ge20',ans:{trauma_ipv:'yes'}});const w=r.alerts.find(a=>a.id==='TRAUMA_WORKUP');assert.match(w.text,/at least 4 hours/);assert.match(w.text,/Rh/);assert.match(w.text,/Kleihauer-Betke/);assert.match(ev({status:'postpartum',ans:{trauma_ipv:'yes'}}).alerts.find(a=>a.id==='TRAUMA_WORKUP').text,/maternal evaluation/);});
test('NF8','free-text fall from a ladder without height raises FALL_HEIGHT_REQUIRED (text layer kept)',()=>{const r=ev({text:'fell off a ladder at 28 weeks'});assert.ok(r.alerts.some(a=>a.id==='FALL_HEIGHT_REQUIRED'));});
// ---------------- NF9 ----------------
test('NF9','no group None on safety screen or mechanism list',()=>{const s=N.create('en');for(const ids of [N.SAFETY,N.MECH,['fall']]){const g=N.groupNo(s,ids);assert.equal(g.ok,false);}assert.deepEqual(s.answers,{});});
test('NF9','group None sets explicit No only for given unanswered items and logs group_no',()=>{const s=N.create('en');N.setAnswer(s,'hemorrhage','yes');const g=N.groupNo(s,N.GATE);assert.ok(!g.set.includes('hemorrhage'));assert.equal(s.answers.hemorrhage,'yes');for(const id of g.set){assert.equal(s.answers[id],'no');assert.equal(s.audit[id],'group_no');}const r=N.evaluate(s);assert.equal(r.states.stroke,'group_no');assert.equal(r.states.sepsis,'not_assessed');assert.equal(s.answers.sepsis,undefined);});
test('NF9','status-hidden items are never set by group None',()=>{const s=N.create('en');s.status='postpartum';const r=N.evaluate(s);const vis=N.UNIVERSAL.filter(id=>r.states[id]!=='na_status');N.groupNo(s,vis);assert.equal(s.answers.ectopic,undefined);assert.equal(s.answers.fetal_movement,undefined);});
// ---------------- NF10 ----------------
test('NF10','default status is Unknown and hides nothing',()=>{const s=N.create('en');assert.equal(s.status,'unknown');const r=N.evaluate(s);assert.ok(!Object.values(r.states).includes('na_status'));});
// ---------------- NF11 ----------------
for(const [st,text] of [['lt20','G1 at 32 weeks with cramping'],['ge20','8 weeks pregnant'],['postpartum','at 28 weeks'],['ge20','2 days postpartum after vaginal delivery']])test('NF11',`status ${st} vs text "${text}" → conflict banner, all items un-hidden`,()=>{const s=N.create('en');s.status=st;s.text=text;const r=N.evaluate(s);assert.equal(r.statusConflict,true);assert.ok(!Object.values(r.states).includes('na_status'));assert.ok(r.holds.includes('status_conflict'));});
// ---------------- NF12 ----------------
test('NF12','gate tap locks EMERGENT; unanswered items "not assessed"; SBAR requires safety screen and vitals',()=>{const s=N.create('en');N.setAnswer(s,'hemorrhage','yes');const r=N.evaluate(s);assert.equal(r.locked,true);assert.equal(r.disposition,'EMERGENT');assert.equal(r.states.harm_intent,'not_assessed');assert.match(r.sbar,/Discharge home \/ non-emergency transfer: BLOCKED until .*Safety screen/);assert.match(r.sbar,/Emergency transfer to L&D\/OR\/ICU\/ED: never delay/);assert.match(r.sbar,/Not assessed: .*Self-harm/);});
test('NF12','changing a gate answer is blocked; lock persists through later evaluations',()=>{const s=N.create('en');N.setAnswer(s,'hemorrhage','yes');const r=N.evaluate(s);assert.equal(N.setAnswer(s,'hemorrhage','no').ok,false);delete s.answers.hemorrhage;const r2=N.evaluate(s,r);assert.equal(r2.disposition,'EMERGENT');assert.ok(r2.alerts.some(a=>a.id==='RF_HEMORRHAGE'&&a.retained));});
// ---------------- NF13 ----------------
for(const k of ['bp','hr','spo2'])test('NF13',`${k} not measured holds disposition on the non-gate path`,()=>{const r=ev({[k]:'not_measured'});assert.ok(r.holds.includes('vitals'));assert.equal(r.disposition,null);});
test('NF13','invalid BP (SBP ≤ DBP) holds',()=>{assert.ok(ev({bp:{sbp:70,dbp:90}}).holds.includes('vitals'));});
for(const [name,o,id] of [['SBP 160',{bp:{sbp:160,dbp:80}},'RF_SEVERE_BP'],['DBP 110',{bp:{sbp:140,dbp:110}},'RF_SEVERE_BP'],['SBP 88',{bp:{sbp:88,dbp:50}},'RF_SBP_LOW'],['HR 110',{hr:110},'RF_ABNORMAL_VITALS'],['SpO2 94',{spo2:94},'RF_ABNORMAL_VITALS'],['partial DBP 112 only',{bp:{dbp:112}},'RF_SEVERE_BP'],['partial SBP 85 only',{bp:{sbp:85}},'RF_SBP_LOW']])test('NF13',`${name} → IMMEDIATE`,()=>{const r=ev(o);assert.equal(r.urgency,'immediate');assert.ok(r.alerts.some(a=>a.id===id),id);});
test('NF13','SBP 159/109, HR 109, SpO2 95 is not auto-flagged',()=>{const r=ev({bp:{sbp:159,dbp:109},hr:109,spo2:95});assert.equal(r.urgency,'prompt');});
// ---------------- NF14 ----------------
test('NF14','four interpreter options',()=>{assert.deepEqual([...N.INTERPRETERS],['professional','qualified_bilingual','family','none']);});
for(const interp of ['family','none',''])test('NF14',`non-English patient with interpreter "${interp||'blank'}": trauma and passive-SI downgrades locked`,()=>{const t=ev({plang:'es',interp,ans:{trauma_ipv:'yes'}});assert.equal(t.urgency,'immediate');const si=ev({plang:'es',interp,ans:{intrusive_thoughts:'yes'}});assert.equal(si.urgency,'immediate');assert.ok(si.alerts.some(a=>a.id==='RF_INTERPRETER_SI'));});
for(const interp of ['professional','qualified_bilingual'])test('NF14',`non-English patient with ${interp}: trauma and passive SI can be URGENT`,()=>{assert.equal(ev({plang:'es',interp,ans:{trauma_ipv:'yes'},status:'ge20'}).disposition,'URGENT');assert.equal(ev({plang:'other',interp,ans:{intrusive_thoughts:'yes'}}).disposition,'URGENT');});
test('NF14','stable-PUL text downgrade locked without professional/qualified interpreter',()=>{const txt='6 weeks, PUL, light spotting, hemodynamically stable, mild cramping';const ok=ev({text:txt,status:'lt20',plang:'es',interp:'professional'});assert.ok(ok.alerts.some(a=>a.id==='ECTOPIC_STABLE_PUL'));assert.equal(ok.disposition,'URGENT');const lk=ev({text:txt,status:'lt20',plang:'es',interp:'none'});assert.equal(lk.urgency,'immediate');});
test('NF14','interpreter is required for a non-English patient',()=>{const r=ev({plang:'es',interp:''});assert.ok(r.holds.includes('interpreter'));});
// ---------------- NF15 ----------------
test('NF15','one stored answer: Yes/Unsure can never be lowered to No (group or item)',()=>{const s=N.create('en');N.setAnswer(s,'leg_clot','unsure');assert.equal(N.setAnswer(s,'leg_clot','no').ok,false);N.groupNo(s,['leg_clot']);assert.equal(s.answers.leg_clot,'unsure');N.setAnswer(s,'vaginal_bleeding','yes');assert.equal(N.setAnswer(s,'vaginal_bleeding','unsure').ok,false);});
test('NF15','leg_clot answered in T2 is the same answer in T4 (no second question)',()=>{const s=flow({tree:'T2',ans:{leg_clot:'yes'},stopAfterSet:true});s.addedTrees=['T4'];const r=N.evaluate(s);assert.equal(r.states.leg_clot,'yes');assert.ok(r.unanswered.every(i=>i!=='leg_clot'));});
test('NF15','retained alerts persist across tree navigation, add tree and back (text removed)',()=>{const s=flow({text:'leaking fluid at 34 weeks'});const r1=N.evaluate(s);assert.ok(r1.alerts.some(a=>a.id==='ROM'));s.text='';s.tree='T2';s.addedTrees=['T4'];const r2=N.evaluate(s,r1);assert.ok(r2.alerts.some(a=>a.id==='ROM'&&a.retained));s.tree='T1';s.addedTrees=[];const r3=N.evaluate(s,r2);assert.ok(r3.alerts.some(a=>a.id==='ROM'));});
test('NF15','ROM + labor fires when answered in different places (tree vs trauma add-on)',()=>{const s=flow({tree:'T3',status:'ge20',ans:{membranes:'yes'},stopAfterSet:true});const r1=N.evaluate(s);N.setAnswer(s,'trauma_ipv','yes');N.setAnswer(s,'labor','yes');const r=N.evaluate(s,r1);assert.ok(r.alerts.some(a=>a.id==='RF_ROM_LABOR'&&a.urgency==='immediate'));});
test('NF15','ROM + labor across text and structured answers',()=>{const r=ev({text:'leaking fluid at 34 weeks',tree:'T3',ans:{labor:'yes'}});assert.ok(r.alerts.some(a=>a.id==='RF_ROM_LABOR'));});
// ---------------- NF16 ----------------
for(const [t,id] of [['HR 120','TEXT_ABNORMAL_VITALS'],['sat 91% on room air','TEXT_ABNORMAL_VITALS'],['sangrado abundante','HEMORRHAGE'],['convulsiones','SEIZURE'],['partner answers for her','IPV_SAFETY'],['she wishes she would not wake up, denies plan, denies intent, denies prior attempts, no firearm','PASSIVE_SI']])test('NF16',`free text "${t}" runs the full text engine (${id})`,()=>{const r=ev({text:t});assert.ok(r.alerts.some(a=>a.id===id),r.alerts.map(a=>a.id).join());});
test('NF16','free text can only raise: "denies bleeding" never lowers a structured Yes',()=>{const r=ev({ans:{vaginal_bleeding:'yes'},text:'denies bleeding'});assert.ok(r.alerts.some(a=>a.id==='RF_VAGINAL_BLEEDING'));assert.equal(r.disposition,'URGENT');});
test('NF16','free text opens a tree (leaking fluid → Labor/fluid) and the trauma add-on',()=>{const r=ev({tree:'T1',text:'leaking fluid at 34 weeks'});assert.ok(r.activeTrees.includes('T3'));const r2=ev({text:'fell, hit by partner'});assert.equal(r2.traumaOn,true);assert.ok(r2.requiredItems.includes('mech_crash'));});
test('NF16','free text raising acuity after result changes the result',()=>{const s=flow({});const r1=N.evaluate(s);assert.equal(r1.disposition,'PROMPT_CLINICIAN_REVIEW');s.text='HR 125';const r2=N.evaluate(s,r1);assert.equal(r2.disposition,'EMERGENT');});
// ---------------- NF17 ----------------
test('NF17','Spanish path: trauma downgrade disabled even with professional interpreter',()=>{assert.equal(ev({ui:'es',plang:'es',interp:'professional',ans:{trauma_ipv:'yes'},status:'ge20'}).urgency,'immediate');assert.equal(ev({ui:'en',plang:'es',interp:'professional',ans:{trauma_ipv:'yes'},status:'ge20'}).disposition,'URGENT');});
test('NF17','Spanish path: passive-SI downgrade disabled (structured and text)',()=>{assert.equal(ev({ui:'es',ans:{intrusive_thoughts:'yes'}}).urgency,'immediate');assert.equal(ev({ui:'es',text:'she wishes she would not wake up, denies plan, denies intent, denies prior attempts, no firearm'}).urgency,'immediate');});
test('NF17','patient-facing Spanish (PATIENT_ES) never appears in nurse alerts or SBAR',()=>{const r=ev({text:'6 weeks, PUL, light spotting, hemodynamically stable, mild cramping',status:'lt20'});const all=r.alerts.map(a=>a.text).join(' ')+r.sbar;for(const v of Object.values(RF.PATIENT_ES))if(typeof v==='string')assert.ok(!all.includes(v.slice(0,30)));assert.doesNotMatch(all,/Regrese de inmediato/);});
test('NF17','SBAR is English on the Spanish path',()=>{const r=ev({ui:'es',plang:'es',interp:'professional',ans:{fever:'yes'},tree:'T4'});assert.match(r.sbar,/^S: OB nurse triage/);assert.doesNotMatch(r.sbar,/[¿¡]|Sí\b|Fiebre/);assert.match(r.sbar,/App path Spanish \(provisional\)/);});
test('NF17','every Spanish label exists, differs from English and the ES path is marked provisional',()=>{for(const [id,it] of Object.entries(N.ITEMS)){assert.ok(it.es&&it.es.length>2,id);assert.notEqual(it.es,it.en,id);}assert.match(N.PROVISIONAL,/pending bilingual clinician review/);});
// ---------------- NF18 parity ----------------
function rng(seed){return ()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;}
test('NF18','identical answers → identical acuity, alerts and disposition in EN and ES paths (300 random cases without trauma/SI downgrades)',()=>{
 const R=rng(42),ids=Object.keys(N.ITEMS).filter(id=>!N.ITEMS[id].header&&id!=='trauma_ipv'&&id!=='intrusive_thoughts'&&!N.MECH.includes(id)&&id!=='fall');
 for(let i=0;i<300;i++){
  const ans={};for(const id of ids){const x=R();if(x<0.06)ans[id]='yes';else if(x<0.09)ans[id]='unsure';}
  const o={ans,tree:TREES[Math.floor(R()*4)],status:STAT[Math.floor(R()*4)],plang:['en','es','other'][Math.floor(R()*3)],interp:['professional','qualified_bilingual','family','none'][Math.floor(R()*4)],priv:['yes','no','cannot_separate'][Math.floor(R()*3)],hr:R()<0.1?115:84};
  const a=ev({...o,ui:'en'}),b=ev({...o,ui:'es'});
  assert.equal(a.urgency,b.urgency,'case '+i);assert.equal(a.disposition,b.disposition,'case '+i);assert.deepEqual(a.alerts.map(x=>x.id).sort(),b.alerts.map(x=>x.id).sort(),'case '+i);assert.deepEqual(a.states,b.states);
 }
});
test('NF18','trauma/SI cases differ only by the NF17 lock (ES never lower than EN)',()=>{const rk={prompt:1,urgent:2,immediate:3};for(const st of STAT)for(const ans of [{trauma_ipv:'yes'},{intrusive_thoughts:'yes'},{trauma_ipv:'unsure',intrusive_thoughts:'yes'}]){const a=ev({ans,status:st,plang:'es',interp:'professional'}),b=ev({ans,status:st,plang:'es',interp:'professional',ui:'es'});assert.ok(rk[b.urgency]>=rk[a.urgency]);assert.equal(b.urgency,'immediate');}});
test('NF18','answers are stored as language-neutral item IDs',()=>{const s=flow({ui:'es'});for(const k of Object.keys(s.answers))assert.ok(N.ITEMS[k],k);for(const v of Object.values(s.answers))assert.ok(['yes','no','unsure'].includes(v));});
test('NF18','structured patient language overrides text heuristics (professional recorded → no R5 lock)',()=>{const r=ev({plang:'es',interp:'professional',text:'speaks only Spanish',ans:{trauma_ipv:'yes'},status:'ge20'});assert.equal(r.r5Lock,false);assert.equal(r.disposition,'URGENT');});
test('NF18','Spanish free text with patient language English triggers the interpreter question (B2)',()=>{const r=ev({plang:'en',text:'dolor de cabeza'});assert.equal(r.interpreterNeeded,true);assert.ok(r.holds.includes('interpreter'));const r2=ev({plang:'en',text:'speaks only Spanish'});assert.ok(r2.holds.includes('interpreter'));});
test('NF18','patient language is required and never inferred from UI language',()=>{const s=N.create('es');const r=N.evaluate(s);assert.equal(s.patientLanguage,'');assert.ok(r.holds.includes('patient_language'));});
console.log(`${pass}/${total} nurse-flow NF1-NF18 + parity contracts`+(pass===total?'':' — FAILURES'));
console.log('per NF: '+Object.entries(by).map(([k,v])=>k+'='+v).join(' '));
if(pass!==total)process.exitCode=1;
