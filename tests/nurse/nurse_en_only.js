// LIVE CANDIDATE (2026-11-12): English-only nurse section. Loads nurse.html exactly as shipped (no NURSE_UI_LANGS override).
// Synthetic inputs only; no holdout/blind cases read.
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..');let pass=0,total=0;
function test(name,fn){total++;try{fn();pass++;console.log('PASS '+name);}catch(e){console.log('FAIL '+name+': '+e.message);process.exitCode=1;}}
function load(){
 const els=new Map();
 function element(id){if(!els.has(id))els.set(id,{id,value:'',innerHTML:'',textContent:'',hidden:false,dataset:{},attributes:{},handlers:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){this.handlers[k]=fn;},scrollIntoView(){},focus(){}});return els.get(id);}
 const box={document:{getElementById:element,addEventListener:()=>{},documentElement:element('html'),title:''},navigator:{},location:{protocol:'file:'},confirm:()=>true};
 box.self=box;vm.createContext(box);
 const html=fs.readFileSync(path.join(root,'nurse.html'),'utf8');
 for(const m of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g))vm.runInContext(fs.readFileSync(path.join(root,m[1]),'utf8'),box,{filename:m[1]});
 const click=(act,o={})=>element('nurse-app').handlers.click({target:{closest:()=>({dataset:{act,...o},textContent:''})}});
 const type=(k,v)=>element('nurse-app').handlers.input({target:{id:'nf-'+k,value:String(v),dataset:{num:k}}});
 return {$:element,click,type,UI:box.NurseUI,html,box};
}
const ES=/Sí\b|Español|Triaje|Siguiente|Atrás|Urgencia|Secciones|active el rescate|Confirmar|Protocolos|Indicar estado|Terminar|PRUEBA|enfermería/;
const html=fs.readFileSync(path.join(root,'nurse.html'),'utf8');
test('nurse.html has no language picker and no Spanish text; main is visible',()=>{assert.doesNotMatch(html,/data-act="lang"|id="nurse-lang"/);assert.doesNotMatch(html,ES);assert.match(html,/<main id="nurse-main">/);assert.match(html,/<html lang="en">/);});
test('page opens straight into English on load (no tap): gate screen rendered, lang en, ES notice hidden',()=>{const {$,UI}=load();assert.deepEqual([...UI.LANGS],['en']);assert.equal($('html').lang,'en');assert.match($('nurse-screen').innerHTML,/Act now/);assert.equal($('nurse-prov').hidden,true);assert.doesNotMatch($('nurse-screen').innerHTML+$('nurse-banner').innerHTML+$('nurse-test').textContent,ES);});
test('a forced "lang es" click is ignored: UI stays English',()=>{const {$,click}=load();click('lang',{val:'es'});assert.equal($('html').lang,'en');assert.doesNotMatch($('nurse-screen').innerHTML+$('nurse-banner').innerHTML,ES);});
test('no TEST/PRACTICE wording on the live page; decision-support line kept',()=>{const {$}=load();assert.doesNotMatch($('nurse-test').textContent+$('nurse-title').textContent,/TEST|PRACTICE|not for patient care/);assert.match($('nurse-test').textContent,/Decision support only/);assert.equal($('nurse-title').textContent,'Nurse triage');});
test('every screen and the bradycardia/anaphylaxis pinned bars are English-only',()=>{const {$,click,type,UI}=load();click('ans',{id:'anaphylaxis',val:'yes'});click('go',{val:'vitals'});type('hr',45);let all='';for(const sc of UI.screens(UI.last.s,UI.last.r)){click('go',{val:sc});all+=$('nurse-screen').innerHTML+$('nurse-banner').innerHTML+$('nurse-nav').innerHTML;}assert.doesNotMatch(all,ES);assert.match(all,/Confirm pulse 45/);});
test('patient-language question (clinical, not UI language) is still asked; Spanish-speaking patient still needs an interpreter',()=>{const {$,click,UI}=load();click('go',{val:'vitals'});assert.match($('nurse-screen').innerHTML,/Patient’s preferred language/);click('plang',{val:'es'});assert.ok(UI.last.r.holds.includes('interpreter'),'interpreter required');});
test('PROVISIONAL dose tag kept on the anaphylaxis card (English)',()=>{const {UI}=load();const h=UI.protocolHTML('NC-ANAPH','en');assert.match(h,/<span class="nf-provtag">PROVISIONAL — doses to be checked against the CSM pharmacy build\.<\/span>/);assert.match(h,/Epinephrine 1 mg\/mL: give 0\.5 mg = 0\.5 mL IM/);});
test('opening a house protocol card works with the live display-names.js (no D.html) and shows the card body',()=>{const {$,click}=load();click('ans',{id:'hemorrhage',val:'yes'});click('proto',{val:'FD-PP-01'});assert.equal($('nurse-protocol').hidden,false);assert.ok($('nurse-protocol').innerHTML.length>500);assert.match($('nurse-protocol').innerHTML,/cardtext/);});
test('nurse section uses its own engine copy; physician index.html does not load any nurse file',()=>{assert.match(html,/js\/nurse-engine\.js/);assert.doesNotMatch(html,/src="js\/engine\.js"/);const idx=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.doesNotMatch(idx,/nurse-[a-z-]+\.js|nurse\.css/);assert.match(idx,/<a href="nurse\.html">Nurse triage section →<\/a>/);assert.doesNotMatch(idx,/English \/ Español\) →/);});
test('service worker precaches every nurse file and caches the nurse page under its own key',()=>{const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');for(const m of html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g))assert.ok(sw.includes("'./"+m[1]+"'"),m[1]);assert.ok(sw.includes("'./nurse.html'"));assert.match(sw,/endsWith\('\/nurse\.html'\) \? '\.\/nurse\.html' : '\.\/index\.html'/);assert.match(sw,/v25-2026-11-12-nurse-en/);});
console.log(`${pass}/${total} English-only live-candidate contracts`);
