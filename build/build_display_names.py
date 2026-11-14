import json,subprocess,os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R=json.load(open('/workspace/obhg-triage-stage-redflag-2026-11-11/DISPLAY_TITLE_MAPPING.json'))
items=json.loads(subprocess.check_output(['node',os.path.join(ROOT,'build/items.js')],text=True))
by={i['id']:i for i in items}
new={'LND-09':'Umbilical cord prolapse','LND-10':'Uterine rupture','ANT-11':'Eclampsia','SYS-04':'Maternal cardiac arrest','SYS-05':'Amniotic fluid embolism',
'FD-ANT-02':'Preterm labor assessment and treatment','FD-LND-05':'Group B strep: who gets antibiotics and which drug','FD-LND-02':'Suspected labor arrest','FD-ANT-08':'Nausea and vomiting of pregnancy: treatment steps',
'FD-SYS-04':'Maternal cardiac arrest response','FD-ANT-11':'Eclamptic seizure response','FD-SYS-05':'Amniotic fluid embolism response','FD-LND-09':'Umbilical cord prolapse emergency','FD-LND-10':'Suspected uterine rupture',
'FD-ANT-05':'Diabetes in labor: insulin and IV fluids'}
# Doc verdict 11 Nov 2026 (Q8): 10 approved as proposed, 5 changed (above). Earlier proposed names stay searchable as aliases.
PREV={'FD-ANT-08':['Hyperemesis treatment steps','hyperemesis'],'FD-SYS-04':['Cardiac arrest in pregnancy response'],'FD-LND-09':['Cord prolapse emergency'],'FD-LND-10':['Uterine rupture emergency'],'FD-ANT-05':['Diabetes in labor: insulin and dextrose','insulin drip','insulin infusion','ALG-DM-INTRAPARTUM']}
rows=[]
for r in R:
    if r['id'] not in by: continue
    x={'id':r['id'],'old':by[r['id']]['title'],'name':r['name'],'review':'Doc naming review (11 Nov 2026)'}
    if r.get('aliases'):x['aliases']=r['aliases']
    rows.append(x)
for k,v in new.items():
    assert k in by,k
    rows.append(dict({'id':k,'old':by[k]['title'],'name':v,'review':'Doc naming review 11 Nov 2026 (Q8)'},**({'aliases':PREV[k]} if k in PREV else {})))
# Title decisions (11 Nov 2026). Previous display names stay searchable as hidden aliases.
TITLE_DECISIONS={'LND-05':'Group B streptococcus','FD-LND-05':'Group B streptococcus','FD-SYS-02':'Postpartum VTE prophylaxis','FD-GYNB-04':'Adnexal torsion and ovarian mass'}
for r in rows:
    if r['id'] in TITLE_DECISIONS:
        prev=r['name'];r['name']=TITLE_DECISIONS[r['id']];r['review']='Title decision 11 Nov 2026'
        r['aliases']=list(dict.fromkeys((r.get('aliases') or [])+[prev]+(['GBS','group B strep'] if 'LND-05' in r['id'] else ['postpartum thrombosis prevention','VTE prevention','VTE prophylaxis'] if r['id']=='FD-SYS-02' else ['adnexal mass','ovarian torsion'])))
assert len(rows)==len(items),(len(rows),len(items))
# names unique within each kind (a card and its algorithm may share a name; the UI labels them CARD / ALGORITHM)
assert len({(by[r['id']]['kind'],r['name'].casefold()) for r in rows})==len(rows)
for r in rows:
    it=by[r['id']];codes=[r['id']]+([it['display_id']] if it['display_id'] else [])
    if r['id'].startswith('FD-'):codes.append(r['id'][3:])
    if r['id']=='FD-ANT-05':codes.append('ALG-DM-INTRAPARTUM')
    r['codes']=sorted(set(codes))
json.dump(rows,open(os.path.join(ROOT,'DISPLAY_TITLE_MAPPING.json'),'w'),indent=2,ensure_ascii=False)
js='''/* Plain-condition display names (11 Nov 2026). Internal ids, content, source titles and links are unchanged; old codes and titles stay searchable. */
(function (root) {
  'use strict';
  const rows = %s;
  const byId = Object.fromEntries(rows.map(r => [r.id, Object.freeze(r)]));
  function title(item) { const id = typeof item === 'string' ? item : item && item.id; return (byId[id] && byId[id].name) || (item && item.title) || 'Clinical reference'; }
  function topic(id) { return (byId[id] || byId['FD-' + id] || {}).name || 'Clinical reference'; }
  function image(item) { return item.kind === 'diagram' ? 'assets/display-diagrams/' + item.id + '.png' : item.img; }
  function searchText(item) { const r = byId[item.id] || {}; return [title(item), item.id, item.display_id || '', item.card || '', item.title || '', (r.codes || []).join(' '), (r.aliases || []).join(' '), r.old || '', item.text || ''].join(' ').toLowerCase(); }
  const api = Object.freeze({ rows: Object.freeze(rows.map(Object.freeze)), byId: Object.freeze(byId), title, topic, image, searchText });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DisplayNames = api;
})(typeof self !== 'undefined' ? self : this);
'''%json.dumps(rows,indent=1,ensure_ascii=False)
open(os.path.join(ROOT,'js/display-names.js'),'w').write(js)
print(len(rows),'display names')
