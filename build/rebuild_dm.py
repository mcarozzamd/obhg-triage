# One-command rebuild after any change to js/dm-intrapartum.js (incl. the decision switches):
#   python3 build/rebuild_dm.py && npm test
# Re-renders the FD-ANT-05 diagram, regenerates the FD-ANT-05 text companion and ANT-05 card embedded in js/content.js,
# refreshes display names and title-band images, and verifies the embedded copy equals a fresh render.
import json,subprocess,re,hashlib,os,shutil,sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
run=lambda *a:subprocess.run(a,cwd=ROOT,check=True)
out=lambda *a:subprocess.check_output(a,cwd=ROOT,text=True)
run('python3','build/build_DM_INTRAPARTUM_FLOW_2026-11-11.py')
png='assets/diagrams/DM_INTRAPARTUM_FLOW_2026-11-11.png'
shutil.copy2(os.path.join(ROOT,'build/DM_INTRAPARTUM_FLOW_2026-11-11.png'),os.path.join(ROOT,png))
T=json.loads(out('node','-e',"console.log(JSON.stringify(require('./js/dm-intrapartum.js').TEXT))"))
fd_html=out('node','build/dm_html.js','fd'); ant_html=out('node','build/dm_html.js','ant05')
strip=lambda h:re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',h)).replace('&gt;','>').replace('&lt;','<').replace('&amp;','&')
p=os.path.join(ROOT,'js/content.js');s=open(p,encoding='utf-8').read()
i=s.index('self.CONTENT = ')+len('self.CONTENT = ');j=s.rindex('};\nif (typeof module')+1
obj=json.loads(s[i:j]);items=obj['items']
fd=next(x for x in items if x['id']=='FD-ANT-05');a=next(x for x in items if x['id']=='ANT-05')
fd.update(title=T['title'],img=png,html=fd_html,text=T['title']+' '+strip(fd_html),sha=hashlib.sha256(open(os.path.join(ROOT,'build/DM_INTRAPARTUM_FLOW_2026-11-11.pdf'),'rb').read()).hexdigest()[:12])
a.update(html=ant_html,text=strip(ant_html))
a['source_note']='ANT-05 landing card revised 11 Nov 2026 per ALG-DM-INTRAPARTUM spec DM-0 and review verdict F10 (generated from js/dm-intrapartum.js).'
open(p,'w',encoding='utf-8').write(s[:i]+json.dumps(obj,ensure_ascii=False)+s[j:])
run('python3','build/build_display_names.py')
run('python3','build/build_display_images.py')
# verify embedded copy == fresh render
chk=out('node','-e',"global.self=global;const C=require('./js/content.js'),cp=require('child_process');const f=C.items.find(i=>i.id==='FD-ANT-05'),a=C.items.find(i=>i.id==='ANT-05');const fd=cp.execFileSync('node',['build/dm_html.js','fd'],{encoding:'utf8'}),an=cp.execFileSync('node',['build/dm_html.js','ant05'],{encoding:'utf8'});console.log(f.html===fd&&a.html===an?'embedded copy matches fresh render':'MISMATCH')")
print(chk.strip()); sys.exit(0 if 'matches' in chk else 1)
