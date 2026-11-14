// Doc re-verdict NE1–NE4 (doc-nurse-nd-reverdict-2026-11-12.md). Synthetic inputs only; no holdout/blind cases read.
// Synthetic inputs only; no holdout/blind cases read.
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..');let pass=0,total=0;const per={};
const N=require('../../js/nurse-flow.js'),PR=require('../../js/nurse-protocols.js'),NC=require('../../js/nurse-cards.js');
global.self=global;require('../../js/content.js');const C=global.CONTENT;const IDS=new Set([...C.items.map(i=>i.id),...NC.ids()]);
const FORM=C.items.find(i=>i.id==='FORMULARY');const formText=(FORM.html||'').replace(/<[^>]+>/g,' ');
function test(tag,name,fn){total++;per[tag]=(per[tag]||0)+1;try{fn();pass++;console.log('PASS '+tag+' '+name);}catch(e){console.log('FAIL '+tag+' '+name+': '+e.message);process.exitCode=1;}}
function load(){
 const els=new Map();
 function element(id){if(!els.has(id))els.set(id,{id,value:'',innerHTML:'',textContent:'',hidden:false,dataset:{},attributes:{},handlers:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){this.handlers[k]=fn;},scrollIntoView(){},focus(){}});return els.get(id);}
 const box={document:{getElementById:element,addEventListener:()=>{},documentElement:element('html'),title:''},navigator:{},location:{protocol:'file:'},confirm:()=>true,NURSE_UI_LANGS:['en','es']}; // dormant-ES regression only; live nurse.html is English-only (see nurse_en_only.js)
 box.self=box;vm.createContext(box);
 const html=fs.readFileSync(path.join(root,'nurse.html'),'utf8');
 for(const m of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g))vm.runInContext(fs.readFileSync(path.join(root,m[1]),'utf8'),box,{filename:m[1]});
 const click=(act,o={})=>element('nurse-app').handlers.click({target:{closest:()=>({dataset:{act,...o},textContent:''})}});
 const type=(k,v)=>element('nurse-app').handlers.input({target:{id:'nf-'+k,value:String(v),dataset:{num:k}}});
 return {$:element,click,type,UI:box.NurseUI,N:box.NurseFlow};
}
const {UI}=load();
// complete = answer every item No (then overrides); partial = only overrides
const flow=(o={})=>{const s=N.create(o.ui||'en');s.status=o.status||'unknown';s.patientLanguage=o.plang===undefined?'en':o.plang;s.interpreter=o.interp||'';s.bp=o.bp===undefined?{sbp:118,dbp:72}:o.bp;s.hr=o.hr===undefined?84:o.hr;s.spo2=o.spo2===undefined?99:o.spo2;s.tree=o.tree===undefined?'T1':o.tree;s.privateScreen=o.priv===undefined?'yes':o.priv;s.text=o.text||'';s.where={};
 for(const [k,v] of Object.entries(o.ans||{}))N.setAnswer(s,k,v);if(o.complete)for(const id of Object.keys(N.ITEMS))if(!(o.skip||[]).includes(id)&&s.answers[id]===undefined)N.setAnswer(s,id,'no');return s;};
const trig=(r,k)=>PR.forResult(r).find(x=>x.key===k);
const cardText=id=>(NC.CARDS[id].html).replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/\s+/g,' ');
const strip=h=>h.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"');
const ev=o=>N.evaluate(flow({complete:true,...o}));
const HIT={en:'EMERGENT: activate rescue now.',es:'EMERGENTE: active el rescate ahora.'};
const FULL={en:'Confirm maternal pulse (not FHR): 45. Palpate the radial pulse — this could be the fetal heart rate entered by mistake.',es:'Confirme el pulso materno (no la FCF): 45. Palpe el pulso radial — podría ser la frecuencia cardiaca fetal anotada por error.'};
// ---------------- NE1 ----------------
for(const lang of ['en','es'])for(const [name,extra] of [['URGENT HR 45',[]],['locked HR 45 + syncope',[['ans',{id:'syncope',val:'yes'}]]]])test('NE1',`${lang} ${name}: one tap on the pinned chip does NOT confirm; full wording visible with separate Confirm and Re-measure`,()=>{
 const {$,click,type}=load();click('lang',{val:lang});for(const [a,o] of extra)click(a,o);click('go',{val:'vitals'});type('hr',45);click('go',{val:'gate'});
 let b=$('nurse-banner').innerHTML;assert.match(b,/data-act="pulseopen"/);assert.doesNotMatch(b,/data-act="confirm" data-id="pulse"/,'chip never confirms');if(extra.length)assert.ok(b.includes(HIT[lang]),'rescue text stays');
 click('pulseopen',{val:'1'});b=$('nurse-banner').innerHTML;assert.match(b,/data-act="pulseopen"/,'still unconfirmed after one tap');
 const sc=$('nurse-screen').innerHTML;assert.ok(strip(sc).includes(FULL[lang]),'full text visible (not only title/aria)');assert.match(sc,/data-act="confirm" data-id="pulse" data-val="1"[^>]*>(Confirm|Confirmar)</);assert.match(sc,/data-act="remeasure" data-id="hr"[^>]*>(Re-measure|Volver a medir)</);
 click('remeasure',{id:'hr',val:'1'});assert.match($('nurse-banner').innerHTML,/data-act="pulseopen"/,'re-measure does not confirm');
 click('confirm',{id:'pulse',val:'1'});assert.doesNotMatch($('nurse-banner').innerHTML,/data-act="pulseopen"/,'explicit Confirm clears it');});
test('NE1','state-level: pulseopen leaves s.confirmed.pulse unset (evaluate still needs the confirm)',()=>{const s=flow({complete:true,hr:45});const r=N.evaluate(s);assert.equal(r.pulseConfirmNeeded,true);assert.ok(!(s.confirmed&&s.confirmed.pulse));const pin=UI.pinnedHTML(s,r,'en');assert.match(pin,/aria-label="Confirm maternal pulse \(not FHR\): 45\./);assert.match(UI.screenHTML(s,r,'vitals','en'),/data-pulsefull="1">Confirm maternal pulse \(not FHR\): 45\. Palpate the radial pulse/);});
test('NE1','opening from a protocol view closes it and keeps answers',()=>{const {$,click,type}=load();click('lang',{val:'en'});click('ans',{id:'cord_prolapse',val:'yes'});click('go',{val:'vitals'});type('hr',45);click('proto',{val:'NC-CORD'});assert.equal($('nurse-protocol').hidden,false);click('pulseopen',{val:'1'});assert.equal($('nurse-protocol').hidden,true);assert.match($('nurse-screen').innerHTML,/data-pulsefull/);assert.match($('nurse-banner').innerHTML,/NC-CORD/);});
// ---------------- NE2 ----------------
for(const lang of ['en','es'])test('NE2',`${lang} URGENT HR 45: EA-BRADY pinned as an ordinary link; not locked; no rescue banner`,()=>{const s=flow({complete:true,hr:45});N.confirmVital(s,'pulse');const r=N.evaluate(s);assert.equal(r.locked,false);assert.equal(r.disposition,'URGENT');assert.deepEqual(PR.urgentLinks(r).map(t=>t.ids[0]),['EA-BRADY']);assert.equal(PR.forResult(r).length,0,'not a bypass');const pin=UI.pinnedHTML(s,r,lang);assert.match(pin,/data-urgentlinks="1"[\s\S]*data-act="proto" data-val="EA-BRADY"/);assert.ok(!pin.includes(HIT[lang]));assert.doesNotMatch(pin,/class="nf-proto"/,'no full-width bypass button');const ps=UI.screenHTML(s,r,'protocols',lang);assert.match(ps,/data-urgenttrig="RF_BRADY"/);});
test('NE2','free-text URGENT bradycardia ("HR 45") also pins EA-BRADY; IMMEDIATE bradycardia keeps the rescue banner and bypass',()=>{const r=ev({text:'HR 45'});assert.equal(r.locked,false);assert.deepEqual(PR.urgentLinks(r).map(t=>t.ids[0]),['EA-BRADY']);const s2=flow({complete:true,hr:38});const r2=N.evaluate(s2);assert.equal(r2.locked,true);assert.equal(PR.urgentLinks(r2).length,0);assert.ok(UI.pinnedHTML(s2,r2,'en').includes(HIT.en));assert.match(UI.pinnedHTML(s2,r2,'en'),/data-val="EA-BRADY"/);});
test('NE2','only bradycardia is pinned this way (other URGENT alerts unchanged)',()=>{assert.deepEqual([...PR.URGENT_PIN],['RF_BRADY']);});
// ---------------- NE3 ----------------
for(const [txt,exp] of [['HR 45, lightheaded','immediate'],['HR 45, light-headed','immediate'],['HR 45, presyncope','immediate'],['HR 45, near-faint','immediate'],['HR 45, about to pass out','immediate'],['FC 45, mareo','immediate'],['FC 45, mareada','immediate'],['FC 45, casi me desmayo','immediate'],
 ['HR 45, not lightheaded','urgent'],['HR 45, denies lightheadedness','urgent'],['HR 45, denies near-faint','urgent'],['FC 45, no mareo','urgent'],['FC 45, sin mareo','urgent'],['FC 45, niega mareo','urgent'],['HR 45, denies lightheadedness but near-faint now','immediate']])
 test('NE3',`free text "${txt}" with structured HR 45 → ${exp}`,()=>{const s=flow({complete:true,hr:45,text:txt.replace(/^(HR|FC) 45, /,'')});N.confirmVital(s,'pulse');const r=N.evaluate(s);assert.equal(r.alerts.find(x=>x.id==='RF_BRADY').urgency,exp);});
// ---------------- NE4 ----------------
const UNIT=/\b\d+(?:[.,]\d+)?(?:\s?[–-]\s?\d+(?:[.,]\d+)?)?\s?(?:mg\/kg|mcg\/kg|µg\/kg|mg|mcg|µg|g|IU|U|units?|unidades|mEq|mmol|mL)\b|\b\d+(?:[.,]\d+)?\s?%/gi;
const PCT_OK=[/100\s?% O2/g,/oxígeno al 100\s?%/g,/SpO2\s?(?:≥|<|>|≤)?\s?\d+\s?%/g,/SpO2 %/g];
const ALLOWED=new Set(['0.1 mg','0.5 mg','0.5 mL','1 mg','1 g','10 U','10 g','1–2 g','4–6 g','5 g','500–750 mL']); // all present at test commit 6d48175/ea51606 (formulary + house-approved epinephrine; 1 mg/mL, 0.1 mg/mL concentrations)
function doseFindings(texts){const out=[];for(const [where,t0] of texts){let t=t0;for(const re of PCT_OK)t=t.replace(re,' ');for(const m of t.matchAll(UNIT))out.push([where,m[0].replace(/\s+/g,' ')]);}return out;}
const allTexts=(ACTION,CARDS,GEN)=>[...Object.entries(ACTION).flatMap(([id,a])=>['en','es'].flatMap(l=>[[id+' '+l+' title',a.title[l]],...a.lines[l].map((x,i)=>[id+' '+l+' line '+i,x])])),...['en','es'].flatMap(l=>GEN[l].map((x,i)=>['GENERIC '+l+' '+i,x])),...Object.entries(CARDS).flatMap(([id,c])=>[[id+' html',strip(c.html)],[id+' title en',c.title.en],[id+' title es',c.title.es]])];
test('NE4','dose scan covers EA action cards EN+ES, generic lines and NC cards with IU/mEq/mmol/per-kg/% units; current text passes',()=>{const f=doseFindings(allTexts(NC.ACTION,NC.CARDS,NC.GENERIC));const bad=f.filter(([w,d])=>!ALLOWED.has(d)||(/^(0\.1 mg|0\.5 mg|0\.5 mL|1 mg)$/.test(d)&&!/^NC-ANAPH/.test(w)));assert.deepEqual(bad,[]);assert.ok(f.length>5,'scanner actually finds the approved doses');assert.ok(!f.some(([w])=>/^EA-/.test(w)),'no doses at all on emergency action cards');});
for(const inj of ['atropine 1 mg','atropina 1 mg','potassium 20 mEq','insulin 10 IU','0.01 mg/kg','10 mcg/kg','23.4% saline','bicarbonate 50 mmol','2 units of PRBC'])test('NE4',`injected "${inj}" in EA-BRADY is caught`,()=>{const A=JSON.parse(JSON.stringify(NC.ACTION));A['EA-BRADY'].lines[/atropina/.test(inj)?'es':'en'].push('Give '+inj+'.');const f=doseFindings(allTexts(A,NC.CARDS,NC.GENERIC));const bad=f.filter(([w,d])=>/^EA-/.test(w));assert.ok(bad.length>=1,JSON.stringify(f.slice(-3)));});
test('NE4','percent allowlist is explicit: "100% O2" and "SpO2 ≥95%" pass, "100% O2" elsewhere-phrased dose does not',()=>{assert.deepEqual(doseFindings([['x','100% O2 and SpO2 ≥95% and SpO2 ≥95 % and oxígeno al 100 %']]),[]);assert.equal(doseFindings([['x','give 3% saline']]).length,1);});
console.log(`${pass}/${total} NE1–NE4 contracts`);console.log('per tag: '+Object.entries(per).map(([k,v])=>k+'='+v).join(' '));
