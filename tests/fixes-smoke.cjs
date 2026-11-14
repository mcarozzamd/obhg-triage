// Fresh disposable phone-sized browser; external lookups/clipboard are mocked.
const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path');
const target=process.env.TARGET_URL||'http://127.0.0.1:8879/';const label=process.env.RUN_LABEL||'local';const out=process.env.ARTIFACTS||path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
let passed=0;const check=(s)=>{passed++;console.log('PASS '+s);};
(async()=>{const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,timezoneId:'America/Chicago',acceptDownloads:true});const errors=[];
 await context.route('**/*',route=>{if(route.request().url().startsWith(target))return route.continue();return route.fulfill({status:200,body:'',contentType:'application/javascript'});});
 await context.addInitScript(()=>{
  window._opened=[];window._clipboard=[];window._trace=[];window._syncCopy=true;window._copyFails=false;
  window.open=(url,_,features)=>{_trace.push('open');_opened.push({url,features});return {};};
  document.execCommand=cmd=>{if(cmd!=='copy'||!_syncCopy)return false;const ta=document.activeElement;const text=ta.value.slice(ta.selectionStart,ta.selectionEnd);_trace.push('sync-copy');_clipboard.push(text);return true;};
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{_trace.push('async-copy');if(_copyFails)throw new Error('Denied');_clipboard.push(text);}}});
  localStorage.setItem('shiftlog_profile',JSON.stringify({name:'Synthetic Provider',site:'Synthetic Site',retention:30}));
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 try{
  await page.goto(target+'?fixes='+Date.now());await page.waitForLoadState('networkidle');assert.equal(await page.locator('.testbanner').count(),0);assert.ok(!(await page.locator('body').innerText()).includes('STAGED TEST'));check('production banner removed');
  await page.screenshot({path:path.join(out,'00-banner-gone-'+label+'-phone.png')});
  await (await page.locator('#start-log').isVisible() ? page.locator('#start-log').click() : page.evaluate(()=>{location.hash='log';}));await page.locator('#view-log').waitFor();
  await page.locator('#lg-hpi').fill('AB. 22 yo G1P0 at 32 weeks with leaking fluid, admit antepartum');
  await page.waitForFunction(()=>document.querySelector('#lg-initials').value==='AB'&&document.querySelector('#lg-ga').value==='32w0d');
  assert.equal(await page.locator('#lg-age').inputValue(),'22');assert.equal(await page.locator('#lg-gp').inputValue(),'G1P0');check('summary initials, age, G/P and GA auto-fill together, including dictation punctuation');
  await page.locator('#lg-hpi').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'01-initials-'+label+'-phone.png')});
  await page.locator('#lg-initials').fill('XY');await page.locator('#lg-hpi2').fill('CD. leaking fluid');await page.waitForTimeout(850);assert.equal(await page.locator('#lg-initials').inputValue(),'XY');check('manual Initials value is not overwritten by HPI auto-fill');
  await page.reload();await (await page.locator('#start-log').isVisible() ? page.locator('#start-log').click() : page.evaluate(()=>{location.hash='log';}));await page.locator('#view-log').waitFor();await page.locator('#lg-hpi2').fill('CD. leaking fluid');await page.waitForFunction(()=>document.querySelector('#lg-initials').value==='CD');check('leading initials in structured HPI also fill Initials');
  await page.locator('#lg-hpi2').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'01b-hpi-initials-'+label+'-phone.png')});
  await page.reload();await (await page.locator('#start-log').isVisible() ? page.locator('#start-log').click() : page.evaluate(()=>{location.hash='log';}));await page.locator('#view-log').waitFor();
  await page.locator('#lg-hpi').fill('EF 29 yo G2P1 at 38 weeks with maternal sepsis, BP 80/40, HR 140, fever 39.5 C, lactate 5');await page.waitForFunction(()=>document.querySelector('#lg-ap').value.includes('A1 · ANTIBIOTICS BY SOURCE'));
  const ap=await page.locator('#lg-ap').inputValue();assert.ok(ap.includes('blood cultures x2'));assert.ok(ap.includes('E · NOTIFY AND ESCALATE'));assert.ok(ap.includes('Doses to be checked against CSM pharmacy build.'));assert.ok(await page.locator('#lg-flow-reference').isVisible());check('SYS-03 actual match contains source bundle, antibiotics, later actions and warning');
  fs.writeFileSync(path.join(out,'sepsis-ap-'+label+'.txt'),ap);
  const scrollDraftTo = async needle => page.locator('#lg-ap').evaluate((el,needle)=>{
    const cs=getComputedStyle(el),mirror=document.createElement('div');
    Object.assign(mirror.style,{position:'absolute',left:'-9999px',top:'0',visibility:'hidden',whiteSpace:'pre-wrap',overflowWrap:'break-word',wordBreak:'break-word',boxSizing:'border-box',width:el.clientWidth+'px',padding:cs.padding,fontFamily:cs.fontFamily,fontSize:cs.fontSize,fontWeight:cs.fontWeight,lineHeight:cs.lineHeight,letterSpacing:cs.letterSpacing});
    const i=el.value.indexOf(needle);mirror.textContent=el.value.slice(0,i);const marker=document.createElement('span');marker.textContent=el.value.slice(i,i+needle.length);mirror.appendChild(marker);document.body.appendChild(mirror);el.scrollTop=marker.getBoundingClientRect().top-mirror.getBoundingClientRect().top-parseFloat(cs.paddingTop);mirror.remove();
  },needle);
  await scrollDraftTo('PLAN (from flow');
  await page.locator('#lg-ap').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'02-sepsis-plan-'+label+'-phone.png')});
  await scrollDraftTo('SCREEN POSITIVE = TIME ZERO');await page.screenshot({path:path.join(out,'02b-sepsis-bundle-'+label+'-phone.png')});
  await scrollDraftTo('A1 · ANTIBIOTICS BY SOURCE');await page.screenshot({path:path.join(out,'02c-sepsis-antibiotics-'+label+'-phone.png')});
  await page.locator('#lg-ap-insert').click();assert.equal(await page.locator('#lg-plan').inputValue(),'');check('conditional flow branches do not auto-become simultaneous short Plan orders');
  await page.locator('#lg-plan').fill('Review source bundle; reassess monitoring');await page.locator('#lg-disposition').selectOption('Admitted L&D');await page.locator('#lg-add').click();assert.equal(await page.locator('#log-table [data-amend]').count(),1);check('entry save and existing 11-column log preserved');
  assert.equal(await page.locator('#lg-closeout').innerText(),'Close shift log');assert.equal(await page.locator('#lg-new').innerText(),'Start new shift log');check('both requested button labels exact');
  await page.locator('#lg-closeout').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'03-button-labels-'+label+'-phone.png')});
  const card=page.locator('#row-actions [data-row="1"]');await card.locator('summary').click();await card.locator('[data-lookup-question]').fill('Recommended%20antibiotics%20for%20sepsis%20in%20labor');await card.locator('[data-lookup-review]').click();await card.locator('[data-lookup-confirm]').check();
  const query=await card.locator('[data-lookup-preview]').inputValue();assert.ok(query.includes('Maternal sepsis'));assert.ok(!query.includes('%20'));assert.ok(!query.includes('EF'));assert.ok(!query.includes('29'));check('lookup preview decodes accidental percent encoding and excludes demographics');
  await page.evaluate(()=>{_trace=[];});await card.locator('[data-lookup-open="oe"]').click();await page.waitForFunction(()=>_clipboard.length===1);
  assert.equal(await page.evaluate(()=>_clipboard[0]),query);assert.deepEqual(await page.evaluate(()=>_trace),['sync-copy','open']);assert.equal(await page.evaluate(()=>_opened[0].url),'https://www.openevidence.com/');check('iPhone-compatible synchronous plain-text copy occurs BEFORE opening OpenEvidence');
  await card.locator('[data-lookup-preview]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'04-oe-plain-text-'+label+'-phone.png')});
  const opensBefore=await page.evaluate(()=>_opened.length);await card.locator('[data-lookup-copy]').click();assert.equal(await page.evaluate(()=>_opened.length),opensBefore);assert.equal(await page.evaluate(()=>_clipboard[1]),query);check('copy-only recovery button copies readable text without opening any tab');
  await page.evaluate(()=>{_syncCopy=false;_trace=[];});await card.locator('[data-lookup-open="oe"]').click();await page.waitForFunction(()=>_clipboard.length===3);assert.deepEqual(await page.evaluate(()=>_trace),['async-copy','open']);assert.equal(await page.evaluate(()=>_clipboard[2]),query);check('async Clipboard API fallback also receives RAW text before navigation');
  await card.locator('[data-lookup-open="grok"]').click();const last=await page.evaluate(()=>_opened.at(-1));assert.equal(new URL(last.url).searchParams.get('q'),query);assert.ok(last.url.includes('%20'));assert.equal(last.features,'noopener,noreferrer');check('only the Grok URL is encoded; reviewed de-identified text is unchanged');
  await page.evaluate(()=>{_copyFails=true;});await card.locator('[data-lookup-copy]').click();await page.waitForFunction(()=>document.querySelector('[data-row-status]').textContent.includes('Clipboard unavailable'));check('clipboard denial retains manual-copy recovery');
  await card.locator('[data-lookup-question]').fill('MRN%2012345678');await card.locator('[data-lookup-review]').click();assert.equal(await card.locator('[data-lookup-panel]').isVisible(),false);check('encoded identifiers are blocked AFTER decoding');
  const sw=await page.request.get(new URL('sw.js?check='+Date.now(),target).href);assert.ok((await sw.text()).includes('v33-2026-11-13-unprovisional'));check('new v23 service-worker version served');
  assert.deepEqual(errors,[]);check('no browser runtime or console errors');
  fs.writeFileSync(path.join(out,'fixes-browser-'+label+'.json'),JSON.stringify({target,passed,errors,viewport:{width:390,height:844},clipboard:'Mocks only; no clinical query sent externally.'},null,2));console.log(passed+' fixes phone checks passed ('+label+').');
 }catch(e){fs.writeFileSync(path.join(out,'failure-'+label+'-details.json'),JSON.stringify({errors},null,2));await page.screenshot({path:path.join(out,'failure-'+label+'-phone.png'),fullPage:true});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
