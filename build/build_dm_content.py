import json,subprocess,re,hashlib,os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p=os.path.join(ROOT,'js/content.js');s=open(p,encoding='utf-8').read()
i=s.index('self.CONTENT = ')+len('self.CONTENT = ');j=s.rindex('};\nif (typeof module')+1
obj=json.loads(s[i:j]);items=obj['items']
assert not any(x['id']=='FD-ANT-05' for x in items),'already built'
html=subprocess.check_output(['node',os.path.join(ROOT,'build/dm_html.js')],text=True)
strip=lambda h:re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',h)).replace('&gt;','>').replace('&lt;','<').replace('&amp;','&')
png='assets/diagrams/DM_INTRAPARTUM_FLOW_2026-11-11.png'
pdf=os.path.join(ROOT,'build/DM_INTRAPARTUM_FLOW_2026-11-11.pdf')
sha=hashlib.sha256(open(pdf,'rb').read()).hexdigest()[:12]
title='Diabetes in labor: insulin and dextrose'
d={"id":"FD-ANT-05","kind":"diagram","card":"ANT-05","title":title,"img":png,"source":"/workspace/director/drafts/ALG-DM-INTRAPARTUM_spec_2026-11-11.md","sha":sha,"flags":[],"book":"OB","html":html,"text":title+' '+strip(html),"topics":["ANT-05"],"algorithm_id":"ALG-DM-INTRAPARTUM"}
# insert after the last diagram to keep diagram ordering
last=max(k for k,x in enumerate(items) if x['kind']=='diagram');items.insert(last+1,d)
a=next(x for x in items if x['id']=='ANT-05')
a['html']=('<ul><li>GDM A1 = diet-controlled. GDM A2 = medication. Pregestational = type 1 or type 2 diagnosed before pregnancy (or overt diabetes in early pregnancy).</li>'
 '<li>Delivery timing (CO 831): GDM A1 39+0–40+6. GDM A2 well controlled 39+0–39+6. Poorly controlled GDM individualize. Pregestational, well controlled, no vascular disease 39+0–39+6. Vascular disease, poor control, or prior stillbirth 36+0–38+6.</li>'
 '<li><strong>Labor, induction or scheduled cesarean: use the intrapartum algorithm.</strong> CSM labor target 61–90 mg/dL; the CSM nomogram sets the insulin rate and D5LR or LR by each FSBG; hourly FSBG while the drip runs; type 1 never goes without basal. <button type="button" class="linkbtn" data-open="FD-ANT-05">Open: Diabetes in labor — insulin and dextrose</button></li>'
 '<li>Shoulder counseling: consider scheduled cesarean at EFW ≥4500 g with diabetes, ≥5000 g without (LND-06). Counseling threshold, not an absolute safety cutoff.</li>'
 '<li>Steroids: do not withhold indicated steroids solely for hyperglycemia; glucose can rise for up to 5 days. SMFM Consult #58 recommends against late-preterm steroids in pregestational diabetes (ANT-06).</li>'
 '<li>Postpartum: notify the provider at delivery to start the CSM Postpartum Diabetes Management Order Set (doses there). Screen A1/A2 with a 75-g 2-hour OGTT at 4–12 weeks postpartum.</li></ul>\n'
 '<p class="bottomline">BOTTOM LINE. A1 can wait to 40+6. A2 and well-controlled pregestational diabetes: 39 weeks. In labor: CSM nomogram, hourly FSBG on the drip, type 1 never zero basal. EFW ≥4500 g with diabetes: consider cesarean (counseling, not a limit).</p>')
a['text']=strip(a['html'])
a['source_note']='ANT-05 landing card revised 11 Nov 2026 per ALG-DM-INTRAPARTUM spec DM-0 (replaces 70–110 target, categorical drip wording and the 4500 g "limit" sentence).'
open(p,'w',encoding='utf-8').write(s[:i]+json.dumps(obj,ensure_ascii=False)+s[j:])
print('ok',sha)
