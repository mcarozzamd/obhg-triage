// Nurse page UI contracts: one language per page, wiring, read-only duplicates, tap counts.
// Minimal DOM fixture (no layout/real-browser validation is claimed). Synthetic inputs only.
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..');let pass=0,total=0;
function load(){
 const els=new Map(),docEvents={};
 function element(id){if(!els.has(id))els.set(id,{id,value:'',innerHTML:'',textContent:'',hidden:false,dataset:{},attributes:{},handlers:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){this.handlers[k]=fn;},scrollIntoView(){},focus(){}});return els.get(id);}
 const box={document:{getElementById:element,addEventListener:(n,fn)=>docEvents[n]=fn,documentElement:element('html'),title:''},navigator:{},location:{protocol:'file:'},confirm:()=>true,NURSE_UI_LANGS:['en','es']}; // dormant-ES regression only; live nurse.html is English-only (see nurse_en_only.js)
 box.self=box;vm.createContext(box);
 const html=fs.readFileSync(path.join(root,'nurse.html'),'utf8');
 for(const m of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g))vm.runInContext(fs.readFileSync(path.join(root,m[1]),'utf8'),box,{filename:m[1]});
 let taps=0;
 const click=(act,o={})=>{taps++;element('nurse-app').handlers.click({target:{closest:()=>({dataset:{act,...o},textContent:''})}});};
 const type=(k,v)=>{taps++;element('nurse-app').handlers.input({target:{id:'nf-'+k,value:String(v),dataset:{num:k}}});};
 return {box,$:element,docEvents,click,type,html,UI:box.NurseUI,N:box.NurseFlow,taps:()=>taps};
}
function test(name,fn){total++;try{fn();pass++;console.log('PASS '+name);}catch(e){console.log('FAIL '+name+': '+e.message);process.exitCode=1;}}
const strip=h=>h.replace(/<textarea id="nf-sbar"[\s\S]*?<\/textarea>/g,'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
function dict(UI,N,lang){const L=UI.STR[lang],out=[];for(const [k,v] of Object.entries(L)){if(typeof v==='string')out.push(v);else if(v&&typeof v==='object')out.push(...Object.values(v));}for(const it of Object.values(N.ITEMS))out.push(it[lang]);for(const t of Object.values(N.TREES))out.push(t[lang]);if(lang==='es')out.push(...Object.values(UI.ALERT_ES));return out;}
// Render every screen in many states to check single-language pages.
function allPages(UI,N,lang){
 const pages=[];
 const states=[];
 const mk=f=>{const s=N.create(lang);s.where={};f(s);states.push(s);};
 mk(()=>{});
 mk(s=>{N.setAnswer(s,'hemorrhage','yes');});
 mk(s=>{s.patientLanguage='es';s.status='lt20';s.text='at 32 weeks';s.tree='T3';N.setAnswer(s,'trauma_ipv','yes');N.setAnswer(s,'fall','yes');s.privateScreen='no';N.setAnswer(s,'ipv_safety','unsure');});
 mk(s=>{s.patientLanguage='other';s.interpreter='family';s.status='postpartum';s.tree='T4';s.bp={sbp:170,dbp:112};s.hr=120;s.spo2=92;N.setAnswer(s,'intrusive_thoughts','yes');N.setAnswer(s,'hdr_T3','yes');s.text='HR 125, leaking fluid';});
 mk(s=>{s.patientLanguage='en';s.status='ge20';s.tree='T2';s.bp={sbp:118,dbp:72};s.hr=80;s.spo2=99;s.privateScreen='yes';for(const id of Object.keys(N.ITEMS))N.setAnswer(s,id,'no');});
 for(const s of states){const r=N.evaluate(s);for(const sc of ['gate','vitals','status','universal','pick','tree','safety','addon','catch','result'])pages.push(UI.screenHTML(s,r,sc,lang)+UI.bannerHTML(r,lang)+UI.navHTML(s,r,sc,lang));}
 return pages;
}
for(const [lang,other] of [['es','en'],['en','es']])test(`${lang.toUpperCase()} pages never contain ${other.toUpperCase()} strings (SBAR copy text excepted, NF17)`,()=>{
 const {UI,N}=load();const own=new Set(dict(UI,N,lang));
 const foreign=dict(UI,N,other).filter(x=>x&&x.length>3&&!own.has(x));
 for(const p of allPages(UI,N,lang)){const t=strip(p);for(const f of foreign)assert.ok(!new RegExp('(^|[^\\p{L}])'+f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'($|[^\\p{L}])','u').test(t),'found "'+f+'"');}
});
test('ES alert texts never fall back to English engine text',()=>{const {UI,N}=load();const s=N.create('es');s.text='HR 125, leaking fluid, sangrado abundante, fell, hit by partner';N.setAnswer(s,'hemorrhage','yes');const r=N.evaluate(s);for(const a of r.alerts){const t=UI.alertText(a,'es');assert.notEqual(t,a.text);assert.doesNotMatch(t,/IMMEDIATE|assessment|clinician/i);}});
test('LIVE: no language picker (opens straight into English); no document-level listeners (keeps main app wiring intact)',()=>{const {$,docEvents,html}=load();assert.deepEqual(Object.keys(docEvents),[]);assert.doesNotMatch(html,/data-act="lang"/);assert.doesNotMatch(html,/Español|Triaje/);assert.match(html,/<main id="nurse-main">/);});
test('Spanish start: page lang es, provisional review notice shown, test banner Spanish only',()=>{const {$,click}=load();click('lang',{val:'es'});assert.equal($('html').lang,'es');assert.equal($('nurse-prov').hidden,false);assert.match($('nurse-prov').textContent,/pendiente de revisión por un clínico bilingüe/);assert.match($('nurse-test').textContent,/SITIO DE PRUEBA/);assert.doesNotMatch($('nurse-test').textContent,/TEST SITE/);});
test('gate tap shows EMERGENT with go-to-result and optional continue',()=>{const {$,click}=load();click('lang',{val:'en'});click('ans',{id:'cord_prolapse',val:'yes'});assert.match($('nurse-screen').innerHTML,/EMERGENT: activate rescue now/);assert.match($('nurse-screen').innerHTML,/data-val="result"/);assert.match($('nurse-banner').innerHTML,/IMMEDIATE/);});
test('positive answer disables No (NF15); shared item is shown read-only in the second tree',()=>{const {UI,N}=load();const s=N.create('en');s.where={};s.tree='T2';s.addedTrees=['T4'];N.setAnswer(s,'leg_clot','yes');s.where.leg_clot='tree';const r=N.evaluate(s);const tree=UI.screenHTML(s,r,'tree','en');assert.match(tree,/data-id="leg_clot" data-val="no" aria-pressed="false" disabled/);const t4=tree.slice(tree.indexOf('Fever / infection'));assert.match(t4,/data-row="leg_clot"><div class="nf-q">[^<]*<\/div><div class="nf-ans"><span class="nf-ro">Already answered: Yes/);assert.equal((tree.match(/data-id="leg_clot" data-val="yes"/g)||[]).length,1);});
test('safety screen and mechanism list have no group None button (NF9)',()=>{const {UI,N}=load();const s=N.create('en');s.where={};N.setAnswer(s,'trauma_ipv','yes');const r=N.evaluate(s);assert.doesNotMatch(UI.screenHTML(s,r,'safety','en'),/data-act="none"/);assert.doesNotMatch(UI.screenHTML(s,r,'addon','en'),/data-ids="[^"]*mech_/);assert.match(UI.screenHTML(s,r,'gate','en'),/None of these \(11\)/);});
test('status labels per NF10',()=>{const {UI,N}=load();const s=N.create('en');const h=UI.screenHTML(s,N.evaluate(s),'status','en');assert.match(h,/Postpartum = delivered at ≥20 weeks/);assert.match(h,/Pregnancy loss\/abortion &lt;20 weeks → choose/);assert.match(h,/data-val="unknown" aria-pressed="true"/);});
test('free-text box is outside the re-rendered screen (NF16: available on every screen)',()=>{const {html}=load();const i=html.indexOf('id="nurse-hpi"'),j=html.indexOf('id="nurse-screen"');assert.ok(i>0&&i<j);});
// Typical (all-negative) click-through per tree, counting taps (4 vitals fields = 4 taps; keystrokes not counted).
const tapCounts={};
for(const t of ['T1','T2','T3','T4'])test(`click-through ${t} to result (English, ≥20 wk, all negative)`,()=>{
 const {$,click,type,box,taps}=load();const UI=box.NurseUI;
 click('lang',{val:'en'});
 const none=()=>{const m=$('nurse-screen').innerHTML.match(/data-act="none" data-ids="([^"]*)"/);assert.ok(m,'no None button');click('none',{ids:m[1]});};
 none();// gate → vitals
 type('sbp',118);type('dbp',72);type('hr',84);type('spo2',99);click('plang',{val:'en'});click('nav',{val:'1'});
 click('status',{val:'ge20'});// → universal
 none();// → pick
 click('tree',{val:t});none();// tree → safety
 for(const id of ['harm_intent','intrusive_thoughts','psychosis','trauma_ipv','ipv_safety'])click('ans',{id,val:'no'});click('priv',{val:'yes'});click('nav',{val:'1'});
 none();click('nav',{val:'1'});
 const last=UI.last;assert.equal(last.screen,'result');assert.equal(last.r.disposition,'PROMPT_CLINICIAN_REVIEW',last.r.holds.join());
 assert.match($('nurse-screen').innerHTML,/Copy SBAR \(English, for the chart\)/);
 click('copy',{});tapCounts[t]=taps();
});
test('purity check is live (negative control: EN page contains EN strings)',()=>{const {UI,N}=load();const f='Act now: is any of these happening?';const p=strip(allPages(UI,N,'en')[0]);assert.ok(new RegExp('(^|[^\\p{L}])'+f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'($|[^\\p{L}])','u').test(p));const ps=strip(allPages(UI,N,'es').join(' '));assert.ok(!/\bYes\b|\bUnsure\b|\bNext\b/.test(ps));});
process.on('beforeExit',()=>{if(pass===-1)return;console.log(`${pass}/${total} nurse UI contracts; typical taps (incl. language choice and SBAR copy): `+Object.entries(tapCounts).map(([k,v])=>k+'='+v).join(' '));if(pass!==total)process.exitCode=1;pass=-1;});
