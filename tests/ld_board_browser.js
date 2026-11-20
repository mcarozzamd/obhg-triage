// L&D board browser check: add a room, edit, persist on reload, export, import.
// Run: BASE=http://127.0.0.1:8899/ NODE_PATH=... node tests/ld_board_browser.js
const {chromium}=require('playwright-core');
const fs=require('fs');
const path=require('path');
const BASE=(process.env.BASE||'http://127.0.0.1:8899/').replace(/\/?$/,'/');
const SHOTS=process.env.SHOTS||'/workspace/medical/meddir/site-director/ld-board/app-preview';
const CACHE=process.env.CACHE||'v44-2026-11-20-sys02-vte';
const DISCLAIMER='only use encrypted, hospital-approved email or Bluetooth functions like iPhone AirDrop';
fs.mkdirSync(SHOTS,{recursive:true});

(async()=>{
  const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
  let n=0,f=0; const ok=(c,m)=>{n++; if(!c){f++; console.log('FAIL '+m);} else console.log('PASS '+m);};
  const exportDir=fs.mkdtempSync('/tmp/ld-board-export-');

  // Functional flow on a phone-sized page, then screenshots at both sizes
  {
    const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
    await ctx.grantPermissions([]).catch(()=>{});
    const p=await ctx.newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    p.on('console',m=>{if(m.type()==='error') errs.push(m.text());});
    await p.goto(BASE+'board.html');
    await p.waitForSelector('#shareDisclaimer');
    const disc=await p.locator('#shareDisclaimer').innerText();
    ok(disc===DISCLAIMER||disc.includes(DISCLAIMER), 'verbatim disclaimer on the Share section: '+JSON.stringify(disc));
    ok(await p.locator('#loadSharedBtn').isVisible(), 'Load shared board button is visible');
    ok(await p.locator('#board-home').isVisible(), '← Start is visible');

    // Empty board: All rooms, add a patient to 212, edit a note, persist
    await p.click('#viewAll');
    await p.waitForSelector('article.card.empty[data-room="212"]');
    await p.click('article.card.empty[data-room="212"] .card-head');
    await p.waitForSelector('article.card.empty[data-room="212"].open form.add-patient');
    await p.fill('article[data-room="212"] form.add-patient input[name="initials"]','AA');
    await p.selectOption('article[data-room="212"] form.add-patient select[name="mode"]','labor');
    await p.click('article[data-room="212"] form.add-patient button[type="submit"]');
    await p.waitForSelector('article.card[data-room="212"]:not(.empty)');
    ok(await p.locator('article[data-room="212"] .ident .name').innerText().then(t=>t.includes('AA')), 'added room 212 with initials AA');

    // Open card and edit cervical exam + a notes-style field
    if(!await p.locator('article[data-room="212"].open').count()) await p.click('article[data-room="212"] .card-head');
    await p.waitForSelector('article[data-room="212"].open input[data-field="exam"]');
    await p.fill('article[data-room="212"] input[data-field="exam"]','6 cm');
    await p.locator('article[data-room="212"] input[data-field="exam"]').blur();
    // also next_step (full-width notes)
    const note=p.locator('article[data-room="212"] textarea[data-core="next_step"]');
    if(await note.count()){ await note.fill('Labor curve; recheck in 2 h'); await note.blur(); }
    await p.waitForTimeout(200);
    ok(await p.locator('article[data-room="212"] input[data-field="exam"]').inputValue().then(v=>v==='6 cm'), 'exam edited to 6 cm');

    // Persist across reload
    await p.reload({waitUntil:'load'});
    await p.waitForSelector('#board');
    await p.click('#viewAll');
    await p.waitForSelector('article.card[data-room="212"]:not(.empty)');
    ok(await p.locator('article[data-room="212"] .ident .name').innerText().then(t=>t.includes('AA')), 'initials AA persist after reload');
    if(!await p.locator('article[data-room="212"].open').count()) await p.click('article[data-room="212"] .card-head');
    await p.waitForSelector('article[data-room="212"] input[data-field="exam"]');
    ok(await p.locator('article[data-room="212"] input[data-field="exam"]').inputValue().then(v=>v==='6 cm'), 'exam 6 cm persists after reload');

    // Export via share confirm (download fallback when Web Share is unavailable)
    const [download]=await Promise.all([
      p.waitForEvent('download',{timeout:8000}),
      (async()=>{ await p.click('#shareBtn'); await p.waitForSelector('#shareMask.show'); ok((await p.locator('#shareDlgText').innerText()).includes(DISCLAIMER),'confirm dialog repeats the disclaimer'); await p.click('#shareConfirm'); })()
    ]).catch(e=>{ ok(false,'export did not produce a file: '+e.message); return [null]; });
    let exported=null;
    if(download){
      const dest=path.join(exportDir, download.suggestedFilename()||'board.json');
      await download.saveAs(dest);
      exported=dest;
      const raw=fs.readFileSync(dest,'utf8');
      const data=JSON.parse(raw);
      ok(data.type==='obhg-ld-board' && data.patients && data.patients['212'] && data.patients['212'].initials==='AA', 'exported JSON has room 212 AA');
      ok(data.patients['212'].fields && data.patients['212'].fields.exam && data.patients['212'].fields.exam.value==='6 cm', 'exported exam is 6 cm');
    }

    // Clear, then import
    await p.click('#clearBtn');
    await p.click('#clearYes');
    await p.waitForTimeout(200);
    await p.click('#viewAll');
    ok(await p.locator('article.card.empty[data-room="212"]').count().then(c=>c===1), 'room 212 empty after clear');

    if(exported){
      await p.setInputFiles('#loadShared', exported);
      await p.waitForSelector('article.card[data-room="212"]:not(.empty)',{timeout:5000});
      ok(await p.locator('article[data-room="212"] .ident .name').innerText().then(t=>t.includes('AA')), 'import restores initials AA');
      if(!await p.locator('article[data-room="212"].open').count()) await p.click('article[data-room="212"] .card-head');
      await p.waitForSelector('article[data-room="212"] input[data-field="exam"]');
      ok(await p.locator('article[data-room="212"] input[data-field="exam"]').inputValue().then(v=>v==='6 cm'), 'import restores exam 6 cm');
    }

    // No duplicate NT when example is loaded (antepartum patient is only on the room card)
    await p.click('#loadExample');
    await p.waitForTimeout(300);
    await p.click('#viewOcc');
    const ntCount=await p.evaluate(()=>{
      const text=document.body.innerText;
      // Count visible "NT" as a name, not substrings of other words
      const nodes=[...document.querySelectorAll('.ident .name, .room, .strip .row strong')];
      return nodes.filter(n=>/\bNT\b/.test(n.textContent)).length;
    });
    ok(ntCount<=1, 'example antepartum NT appears once on the occupied view, not twice (count='+ntCount+')');
    ok(!(await p.locator('#anteWrap .strip').count()), 'no duplicate antepartum strip on the occupied view');

    ok(!errs.length, 'no console errors: '+errs.join(' | '));
    await ctx.close();
  }

  // Screenshots: iPhone 390x844 and desktop 1280x800, example census (matches approved mock-ups)
  for(const [name, opt] of [
    ['iphone-390x844', {viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}],
    ['desktop-1280x800', {viewport:{width:1280,height:800}}]
  ]){
    const ctx=await b.newContext(opt);
    const p=await ctx.newPage();
    await p.goto(BASE+'board.html?example=1');
    await p.waitForSelector('#board article.card');
    await p.waitForTimeout(200);
    const out=path.join(SHOTS, name+'.png');
    await p.screenshot({path:out, fullPage:false});
    ok(fs.existsSync(out)&&fs.statSync(out).size>1000, 'screenshot '+out);
    // also a start-page shot for context
    await p.goto(BASE);
    await p.waitForSelector('#start-board');
    await p.screenshot({path:path.join(SHOTS, name+'-start.png'), fullPage:false});
    await ctx.close();
  }

  // Existing card checks still matter; this file only covers the board.
  console.log((n-f)+'/'+n+' L&D board browser checks; screenshots in '+SHOTS);
  await b.close();
  process.exitCode=f?1:0;
})();
