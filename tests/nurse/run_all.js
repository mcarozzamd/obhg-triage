// LIVE CANDIDATE single entry point (2026-11-12): syntax checks, the live repo's own test suite (npm test), then the nurse-section suites.
// No holdout/blind files are used. The browser check (tests/nurse/nurse_nc_browser.js, nurse_en_browser.js) runs separately against a local serve.
const {spawnSync}=require('child_process'),path=require('path');
const root=path.resolve(__dirname,'../..');
const steps=[];
for(const f of ['sw.js','js/app.js','js/engine.js','js/content.js','js/display-names.js','js/nurse-safety-vocabulary.js','js/nurse-red-flags.js','js/nurse-engine.js','js/nurse-flow.js','js/nurse-cards.js','js/nurse-protocols.js','js/nurse-ui.js'])steps.push([process.execPath,['--check',f]]);
steps.push(['npm',['test','--silent']]);
for(const f of ['nurse_en_only','nurse_flow_contracts','nurse_ui','nurse_bypass','nurse_cards_nb','nurse_nc','nurse_nd','nurse_ne'])steps.push([process.execPath,['tests/nurse/'+f+'.js']]);
for(const [cmd,args] of steps){
 const r=spawnSync(cmd,args,{cwd:root,stdio:'inherit',env:{...process.env,TZ:'America/Chicago'}});
 if(r.status!==0){console.error('FAILED: '+cmd+' '+args.join(' '));process.exit(r.status||1);}
}
console.log('All live-candidate checks passed. Michael\'s go still required before any push.');
