// LIVE CANDIDATE English-only browser check (derived from the staging nurse_nc_browser.js; ES runs removed).
// Real-browser check (manual; needs Chrome + a local server on :8768 serving this dir): NB12 160 px pinned-bar limit with the
// NC7 status chip and NC9/NC1 confirm chips (ND1: never replacing the rescue text), ND5 jump chip, plus the Act-now "Relevant protocols" section (Michael t1993u), EN + ES, no console errors.
const {chromium}=require('playwright-core');const BASE=process.env.BASE||'http://127.0.0.1:8881/nurse.html';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});let fail=0,n=0;const ok=(c,m)=>{n++;if(!c){fail++;console.log('FAIL '+m);}else console.log('PASS '+m);};
const cases=[['unknown-hem',['hemorrhage']],['hemorrhage-ge20',['status:ge20','hemorrhage']],['cord',['cord_prolapse']],['stroke+sepsis',['stroke','u:sepsis']],['collapse+cord+birth+hem',['collapse_maternal','cord_prolapse','birth_imminent','hemorrhage']],['cord+birth+hem',['cord_prolapse','birth_imminent','hemorrhage']],['collapse_baby',['collapse_baby']],['hr220+hem',['hr:220','hemorrhage']],['hr45',['hr:45']],['hr45+syncope',['hr:45','syncope']],['hr120-ge20',['status:ge20','hr:120']],['spo2-65+anaph',['spo2:65','anaphylaxis']]];
const HIT={en:'EMERGENT: activate rescue now.',es:'EMERGENTE: active el rescate ahora.'};
for(const lang of ['en'])for(const [name,acts] of cases){const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto(BASE);ok(!(await p.$('[data-act=lang]'))&&await p.$eval('#nurse-main',e=>!e.hidden)&&await p.$eval('html',e=>e.lang)==='en',`${lang} ${typeof name!=='undefined'?name:'NE'}: opens straight into English, no language picker`);
 const nav=async v=>{if(await p.$eval('#nurse-banner [data-act=qnav]',e=>e.getAttribute('aria-expanded'))!=='true')await p.click('#nurse-banner [data-act=qnav]');await p.click(`#nurse-banner [data-act=go][data-val=${v}]`);if(await p.$eval('#nurse-banner [data-act=qnav]',e=>e.getAttribute('aria-expanded'))==='true')await p.click('#nurse-banner [data-act=qnav]');};
 for(const a of acts){if(a.startsWith('status:')){await nav('status');await p.click(`[data-act=status][data-val=${a.slice(7)}]`);await nav('gate');}
  else if(a.startsWith('u:')){await nav('universal');await p.click(`[data-act=ans][data-id=${a.slice(2)}][data-val=yes]`);await nav('gate');}
  else if(a.startsWith('hr:')||a.startsWith('spo2:')){const [k,v]=a.split(':');await nav('vitals');await p.fill('#nf-'+k,v);await nav('gate');}
  else await p.click(`#nurse-screen [data-act=ans][data-id=${a}][data-val=yes]`);}
 const h=await p.$eval('#nurse-banner',e=>Math.round(e.getBoundingClientRect().height));ok(h<=160,`${lang} ${name}: pinned bar ${h}px ≤160`);
 const btxt=await p.$eval('#nurse-banner',e=>e.innerText);const locked=await p.$eval('#nurse-banner',e=>e.dataset.urgency==='immediate');const cf=await p.$('#nurse-banner [data-cfnow]');
 ok(!locked||btxt.includes(HIT[lang].toUpperCase())||btxt.includes(HIT[lang]),`${lang} ${name}: ND1 rescue text visible in the banner${cf?' alongside the confirm chip':''}`);
 if(acts.some(a=>/^hr:(45|220)|^spo2:65/.test(a)))ok(!!cf&&await cf.isVisible(),`${lang} ${name}: confirm chip visible`);
 const tileTop=await p.$eval('#nurse-screen [data-id=collapse_maternal]',e=>e.getBoundingClientRect().top).catch(()=>null);ok(tileTop!==null&&tileTop<844,`${lang} ${name}: ND5 tiles first and above the fold (first tile top ${Math.round(tileTop)}px)`);
 const jump=await p.$('#nurse-screen [data-act=jump]');if(jump){await jump.click();await p.waitForTimeout(150);const rt=await p.$eval('#nf-relproto',e=>e.getBoundingClientRect().top);ok(rt>=0&&rt<844,`${lang} ${name}: ND5 jump chip scrolls to Relevant protocols (top ${Math.round(rt)}px)`);await p.evaluate(()=>window.scrollTo(0,0));}
 const rel=await p.$('#nf-relproto');ok(!!rel,`${lang} ${name}: Relevant protocols section on the gate screen`);
 const keys=await p.$$eval('#nf-relproto [data-reltrig]',es=>es.map(e=>e.dataset.reltrig));const pinFirst=await p.$eval('#nurse-banner .nf-bypass [data-act=proto]',e=>e.dataset.val).catch(()=>null);
 const relFirst=await p.$eval('#nf-relproto [data-act=proto]',e=>e.dataset.val).catch(()=>null);ok(!pinFirst||pinFirst===relFirst,`${lang} ${name}: first relevant protocol ${relFirst} = pinned bypass ${pinFirst} (keys ${keys})`);
 if(relFirst){const before=await p.$$eval('#nurse-screen [aria-pressed=true]',es=>es.map(e=>e.dataset.id+':'+e.dataset.val).join());await p.click('#nf-relproto [data-act=proto]');await p.waitForTimeout(100);
  const vis=await p.$eval('#nurse-protocol',e=>!e.hidden);const pin=await p.$eval('#nurse-banner',e=>e.innerHTML);ok(vis&&/data-remind="1"|nf-finish/.test(pin),`${lang} ${name}: protocol open with pinned finish-screening bar`);
  await p.click('[data-act=protoclose]');const after=await p.$$eval('#nurse-screen [aria-pressed=true]',es=>es.map(e=>e.dataset.id+':'+e.dataset.val).join());ok(before===after&&!!(await p.$('#nf-relproto')),`${lang} ${name}: answers and gate screen preserved after closing`);}
 const txt=await p.$eval('#nf-relproto',e=>e.innerText);ok(lang==='en'?/Relevant protocols/i.test(txt)&&/All protocols/i.test(txt):/Protocolos relevantes/i.test(txt)&&/Todos los protocolos/i.test(txt)&&!/Relevant protocols|All protocols|if delivered|Interim card|Pregnancy status/i.test(txt),`${lang} ${name}: section chrome in page language`+(process.env.DBG?' '+txt.replace(/\n/g,' | '):''));
 await p.screenshot({path:`/tmp/pw/cand-nc-${lang}-${name}.png`,fullPage:false});
 ok(!errs.length,`${lang} ${name}: no console errors ${errs.join('|')}`);await p.close();}
// NE1/NE2 real-browser: chip opens full wording without confirming; URGENT HR 45 pins EA-BRADY without rescue text
for(const lang of ['en'])for(const lock of [false,true]){const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto(BASE);ok(!(await p.$('[data-act=lang]'))&&await p.$eval('#nurse-main',e=>!e.hidden)&&await p.$eval('html',e=>e.lang)==='en',`${lang} ${typeof name!=='undefined'?name:'NE'}: opens straight into English, no language picker`);if(lock)await p.click('#nurse-screen [data-act=ans][data-id=syncope][data-val=yes]');
 await p.click('#nurse-banner [data-act=qnav]');await p.click('#nurse-banner [data-act=go][data-val=vitals]');await p.fill('#nf-hr','45');await p.click('#nurse-banner [data-act=go][data-val=gate]');await p.click('#nurse-banner [data-act=qnav]');
 const h=await p.$eval('#nurse-banner',e=>Math.round(e.getBoundingClientRect().height));ok(h<=160,`${lang} NE ${lock?'locked':'URGENT'} HR 45: pinned bar ${h}px ≤160`);
 const bt=await p.$eval('#nurse-banner',e=>e.innerText);ok(lock?bt.includes(HIT[lang]):!bt.includes(HIT[lang]),`${lang} NE2 ${lock?'locked shows':'URGENT has no'} rescue text`);
 if(!lock)ok(await p.$eval('#nurse-banner [data-urgentlinks] [data-val=EA-BRADY]',e=>e.offsetParent!==null).catch(()=>false),`${lang} NE2 EA-BRADY link visible`);
 await p.click('#nurse-banner [data-act=pulseopen]');await p.waitForTimeout(150);const still=!!(await p.$('#nurse-banner [data-act=pulseopen]'));const full=await p.$eval('[data-pulsefull]',e=>{const r=e.getBoundingClientRect();return {t:e.innerText,vis:r.top>=0&&r.bottom<=844};}).catch(()=>null);
 ok(still&&full&&full.vis&&/45/.test(full.t)&&(lang==='en'?/Confirm maternal pulse \(not FHR\)/:/Confirme el pulso materno \(no la FCF\)/).test(full.t),`${lang} NE1 ${lock?'locked':'URGENT'}: one tap → unconfirmed, full wording visible on screen`);
 const h2=await p.$eval('#nurse-banner',e=>Math.round(e.getBoundingClientRect().height));ok(h2<=160,`${lang} NE1 bar after opening ${h2}px ≤160`);
 await p.screenshot({path:`/tmp/pw/cand-ne-${lang}-${lock?'locked':'urgent'}.png`});await p.click('[data-act=confirm][data-id=pulse]');ok(!(await p.$('#nurse-banner [data-act=pulseopen]')),`${lang} NE1 explicit Confirm clears the chip`);
 ok(!errs.length,`${lang} NE no console errors ${errs.join('|')}`);await p.close();}
const LANGS_W=['en'],PICK_W=false;
// Doc C1: no horizontal overflow on any nurse screen at 375, 390 and 430 px
for(const lang of LANGS_W)for(const vw of [375,390,430]){const p=await b.newPage({viewport:{width:vw,height:844},isMobile:true,hasTouch:true});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(BASE);if(PICK_W)await p.click(`[data-act=lang][data-val=${lang}]`);
 await p.click('#nurse-screen [data-act=ans][data-id=hemorrhage][data-val=yes]');
 const go=v=>p.evaluate(v=>{self.NurseUI.click({target:{closest:()=>({dataset:{act:'go',val:v},textContent:''})}});},v);
 await go('vitals');await p.fill('#nf-sbp','150');await p.fill('#nf-hr','45');await p.waitForTimeout(80);
 const inView=(sel)=>p.$eval(sel,(e,vw)=>{const r=e.getBoundingClientRect();return r.right<=vw+0.5&&r.left>=0;},vw);const dbp=await inView('#nf-dbp');const spo=await inView('#nf-spo2');ok(dbp&&spo,`${lang} ${vw}px vitals: DBP and SpO2 inputs fully on screen`);
 const scr=await p.evaluate(()=>self.NurseUI.screens(self.NurseUI.last.s,self.NurseUI.last.r));const bad=[];
 for(const sc of [...scr,'protocols']){await go(sc);await p.waitForTimeout(60);const w=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,bw:document.body.scrollWidth,iw:innerWidth}));if(Math.max(w.sw,w.bw,w.iw)>vw)bad.push(sc+':'+Math.max(w.sw,w.bw,w.iw));}
 await p.evaluate(()=>self.NurseUI.click({target:{closest:()=>({dataset:{act:'proto',val:'FD-PP-01'},textContent:''})}}));await p.waitForTimeout(80);{const w=await p.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth,innerWidth))-vw;if(w>0)bad.push('protocol FD-PP-01:+'+w);}
 ok(!bad.length,`${lang} ${vw}px: no horizontal overflow on ${scr.length+2} views (scrollWidth and layout viewport ≤ ${vw}px, mobile emulation) ${bad.join(' ')}`);
 const h=await p.$eval('#nurse-banner',e=>Math.round(e.getBoundingClientRect().height));ok(h<=160,`${lang} ${vw}px: pinned bar ${h}px ≤160`);
 ok(!errs.length,`${lang} ${vw}px width check: no page errors ${errs.join('|')}`);await p.close();}
{const ROOT=BASE.replace(/nurse\.html.*$/,'');const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const ES=/\b(Sí|Español|Triaje|Siguiente|Atrás|Urgencia|Secciones|Confirmar|Protocolos|Terminar|enfermería|PRUEBA)\b/;
 await p.goto(ROOT);await p.waitForFunction(()=>navigator.serviceWorker&&navigator.serviceWorker.controller,null,{timeout:15000}).catch(()=>{});
 if(!(await p.evaluate(()=>!!(navigator.serviceWorker&&navigator.serviceWorker.controller)))){await p.reload();await p.waitForTimeout(800);}
 const link=await p.$('a[href="nurse.html"]');ok(!!link&&(await link.innerText()).trim()==='Nurse triage section →','index.html shows the English nurse link');
 await link.click();await p.waitForLoadState('load');await p.waitForTimeout(400);
 ok(/nurse\.html$/.test(p.url())&&await p.$eval('#nurse-main',e=>!e.hidden),'link opens the nurse page straight into the English flow');
 let all='';for(const sc of ['gate','vitals','status','universal','pick']){await p.click(`#nurse-banner [data-act=qnav]`).catch(()=>{});const t=await p.$(`[data-act=go][data-val=${sc}]`);if(t){await t.click();await p.waitForTimeout(80);}all+=await p.$eval('body',e=>e.innerText);}
 ok(!ES.test(all),'no Spanish UI text on any visited nurse screen'+(ES.test(all)?' ('+all.match(ES)[0]+')':''));
 ok(!(await p.$('[data-act=lang]')),'no language picker anywhere');
 const cached=await p.evaluate(async()=>{const ks=await caches.keys();const k=ks.find(x=>x.startsWith('obhg-triage-'));if(!k)return null;const c=await caches.open(k);const i=await c.match('./index.html'),n=await c.match('./nurse.html');return {k,i:i?await i.text():'',n:n?await n.text():''};});
 ok(cached&&cached.k==='obhg-triage-v25-2026-11-12-nurse-en','service worker cache v25 installed ('+(cached&&cached.k)+')');
 ok(cached&&/OBHG CLINICAL TRIAGE/.test(cached.i)&&!/id="nurse-app"/.test(cached.i),'after visiting nurse.html the cached index.html is still the physician app');
 ok(cached&&/id="nurse-app"/.test(cached.n),'nurse.html cached under its own key');
 await ctx.setOffline(true);await p.goto(ROOT+'nurse.html').catch(()=>{});ok(await p.$('#nurse-app').then(Boolean).catch(()=>false),'nurse page loads offline');await p.goto(ROOT).catch(()=>{});ok(await p.$('#tab-triage').then(Boolean).catch(()=>false),'physician app still loads offline');await ctx.setOffline(false);
 ok(!errs.length,'index→nurse: no console errors '+errs.join('|'));await ctx.close();}
console.log(`${n-fail}/${n} English-only live-candidate browser checks`);await b.close();process.exitCode=fail?1:0;})();
