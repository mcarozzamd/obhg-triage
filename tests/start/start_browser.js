// Start page browser check (13 Nov 2026): phone 390x844 (mobile emulation) and desktop 1280x900, with screenshots.
// Run: BASE=http://127.0.0.1:8891/ SHOTS=/path NODE_PATH=$(npm root -g) node tests/start/start_browser.js   (playwright-core + /usr/bin/google-chrome)
const {chromium}=require('playwright-core');const fs=require('fs');
const BASE=(process.env.BASE||'http://127.0.0.1:8891/').replace(/\/?$/,'/');const SHOTS=process.env.SHOTS||'/tmp/start-shots';fs.mkdirSync(SHOTS,{recursive:true});
const CACHE=process.env.CACHE||'v32-2026-11-13-trauma-sti-uti';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});let n=0,f=0;const ok=(c,m)=>{n++;if(!c)f++;console.log((c?'PASS ':'FAIL ')+m);};
for(const [dev,opt] of [['phone',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}],['desktop',{viewport:{width:1280,height:900}}]]){
 const ctx=await b.newContext(opt);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('pageerror '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});const bad=[];p.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});
 const W=opt.viewport.width;const fits=async(label)=>{const w=await p.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth,innerWidth));ok(w<=W,`${dev} ${label}: no horizontal overflow (${w} ≤ ${W})`);};
 const shot=async name=>{await p.waitForTimeout(150);await p.screenshot({path:`${SHOTS}/${dev}-${name}.png`});};
 const startShown=async()=>await p.locator('#view-start').isVisible()&&!(await p.locator('#section-bar').isVisible());
 await p.goto(BASE);await p.waitForLoadState('load');
 ok(await startShown(),`${dev} fresh open shows the start page`);
 const tiles=await p.$$eval('#view-start .start-tile',ts=>ts.map(t=>{const r=t.getBoundingClientRect();return {id:t.id,name:t.querySelector('.st-name').textContent,w:Math.round(r.width),h:Math.round(r.height),top:Math.round(r.top),bottom:Math.round(r.bottom)};}));
 console.log(dev,'tiles',JSON.stringify(tiles));
 ok(tiles.map(t=>t.name).join('|')==='Clinician|Nurse|Browse Guidelines|Patient log',`${dev} four choices in order`);
 ok(tiles.every(t=>t.h>=96&&t.w>=(dev==='phone'?340:300)),`${dev} every tile is large and thumb-friendly (≥96 px tall${dev==='phone'?', ≥340 px wide':''})`);
 ok(tiles.every(t=>t.bottom<=opt.viewport.height),`${dev} all four tiles visible without scrolling`);
 const nurseFont=await p.$eval('#start-nurse .st-name',e=>parseFloat(getComputedStyle(e).fontSize));ok(nurseFont>=22,`${dev} Nurse label ${nurseFont}px (was a 16 px text link)`);
 ok(await p.locator('#view-start .foot').isVisible(),`${dev} disclaimer visible on the start page`);
 await fits('start page');await shot('01-start');
 // Clinician
 await p.click('#start-clinician');ok(await p.locator('#hpi-form').isVisible()&&!(await p.locator('#view-start').isVisible())&&!(await p.locator('#view-browse').isVisible())&&!(await p.locator('#view-log').isVisible()),`${dev} Clinician landing shows only the clinician triage view`);
 ok(p.url().endsWith('#clinician'),`${dev} URL is #clinician`);await fits('clinician landing');await shot('02-clinician');
 await p.fill('#hpi','20 yo G2P1 at 37 weeks with blood pressure 150/100 and headache');await p.click('#go');await p.locator('#coding').waitFor({state:'visible'});ok((await p.locator('#top').innerText()).length>50,`${dev} clinician triage still returns a top card and codes`);await fits('clinician result');await shot('03-clinician-result');
 await p.click('#go-start');ok(await startShown(),`${dev} ← Start returns to the start page`);ok(await p.locator('#start-clinician .st-last').isVisible(),`${dev} last choice badge on Clinician`);
 // Browse
 await p.click('#start-browse');ok(await p.locator('#view-browse').isVisible()&&!(await p.locator('#hpi-form').isVisible()),`${dev} Browse Guidelines landing shows only the browse/search view`);await fits('browse landing');await shot('04-browse');
 await p.fill('#q','magnesium');await p.waitForTimeout(100);ok(await p.locator('#list [data-open]').count()>0,`${dev} browse search finds magnesium`);await p.locator('#list [data-open]').first().click();await p.waitForTimeout(150);
 ok(await p.locator('#result').isVisible()&&!(await p.locator('#hpi-form').isVisible())&&await p.locator('#sec-back').isVisible(),`${dev} opened card shows with "Back to guideline list" and no HPI form`);await fits('browse card');await shot('05-browse-card');
 await p.click('#sec-back');ok(await p.locator('#view-browse').isVisible()&&(await p.inputValue('#q'))==='magnesium',`${dev} back to list keeps the search`);
 await p.click('#go-start');
 // Patient log
 await p.click('#start-log');ok(await p.locator('#view-log').isVisible()&&!(await p.locator('#view-triage').isVisible()),`${dev} Patient log landing shows only the shift patient log`);
 ok(await p.locator('#profile-box').isVisible(),`${dev} first use asks for the on-device provider profile`);await fits('patient log (profile)');await shot('06-patientlog-profile');
 await p.fill('#pf-name','Synthetic Provider');await p.fill('#pf-title','MD');await p.click('#pf-save');await p.waitForTimeout(150);ok(await p.locator('#lg-add').isVisible(),`${dev} log form shown after profile`);await fits('patient log');await shot('07-patientlog');
 // Browser back goes to start
 await p.goBack();await p.waitForTimeout(150);ok(await startShown(),`${dev} browser Back from a section returns to the start page`);
 // Nurse
 await p.click('#start-nurse');await p.waitForLoadState('load');await p.waitForTimeout(300);
 ok(p.url()===BASE+'nurse.html'&&await p.locator('#nurse-main').isVisible()&&!(await p.locator('[data-act=lang]').count()),`${dev} Nurse opens nurse.html straight into the English flow`);
 ok(/Decision support only: not unit policy/.test(await p.locator('#nurse-test').innerText()),`${dev} nurse banner unchanged`);await fits('nurse landing');await shot('08-nurse');
 const nb=await p.$eval('#nurse-banner',e=>Math.round(e.getBoundingClientRect().height));ok(nb<=160,`${dev} nurse pinned bar ${nb}px ≤160`);
 await p.click('#nurse-home');await p.waitForLoadState('load');ok(await startShown(),`${dev} nurse ← Start returns to the start page`);ok(await p.locator('#start-nurse .st-last').isVisible(),`${dev} last choice badge on Nurse`);
 // Deep links
 for(const [h,v] of [['#browse','#view-browse'],['#log','#view-log'],['#clinician','#hpi-form']]){const q=await ctx.newPage();q.on('pageerror',e=>errs.push('pageerror '+e.message));await q.goto(BASE+h);await q.waitForTimeout(200);ok(await q.locator(v).isVisible()&&!(await q.locator('#view-start').isVisible()),`${dev} deep link ${h} opens directly`);await q.close();}
 {const q=await ctx.newPage();await q.goto(BASE+'nurse.html');await q.waitForTimeout(200);ok(await q.locator('#nurse-main').isVisible()&&await q.locator('#nurse-home').isVisible(),`${dev} nurse.html opened directly still works and has ← Start`);await q.close();}
 // Service worker
 await p.goto(BASE);await p.waitForFunction(()=>navigator.serviceWorker&&navigator.serviceWorker.controller,null,{timeout:15000}).catch(()=>{});
 const keys=await p.evaluate(()=>caches.keys());ok(keys.some(k=>k.endsWith(CACHE)),`${dev} service worker cache ${CACHE} (${keys.join(',')})`);
 await ctx.setOffline(true);await p.reload().catch(()=>{});await p.waitForTimeout(300);ok(await p.locator('#view-start').isVisible().catch(()=>false),`${dev} start page loads offline`);
 await p.click('#start-browse').catch(()=>{});ok(await p.locator('#view-browse').isVisible().catch(()=>false),`${dev} Browse works offline`);await ctx.setOffline(false);
 ok(!errs.length,`${dev} no console errors ${errs.join(' | ')}`);ok(!bad.length,`${dev} no 4xx/5xx ${bad.join(' | ')}`);await ctx.close();}
console.log(`${n-f}/${n} start-page browser checks; screenshots in ${SHOTS}`);await b.close();process.exitCode=f?1:0;})();
