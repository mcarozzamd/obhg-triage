/* Nurse complaint-tree flow (LIVE CANDIDATE, English-only UI). Implements Doc verdict NF1-NF18
 * (doc-nurse-flow-trees-verdict-2026-11-12.md). Decision support only; no diagnosis/orders.
 * Answers are stored as language-neutral item IDs (NF18). UI language never changes
 * acuity except the explicit Spanish-path downgrade locks required by NF17. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const RF=node?require('./nurse-red-flags.js'):root.RedFlagChecklist;
 const E=node?require('./nurse-engine.js'):root.TriageEngine;
 const rank={routine:0,prompt:1,urgent:2,immediate:3};
 const max=(a,b)=>rank[a]>=rank[b]?a:b;
 const rf=Object.fromEntries(RF.items.map(q=>[q.id,q]));
 const P=' [ES provisional — pending bilingual clinician review]';
 // ---------- item catalog (existing items reuse js/red-flags.js labels/acuity/reasons) ----------
 const NEW={
  collapse_maternal:{acuity:'immediate',en:'Patient not breathing, blue, unresponsive or pulseless',es:'La paciente no respira, está azulada, no responde o no tiene pulso',reason:'Activate the maternal code / resuscitation response immediately (left uterine displacement if ≥20 wk; perimortem cesarean per SYS-01); do not finish the form first.',signal:'COLLAPSE'},
  collapse_baby:{acuity:'immediate',en:'Baby (newborn) not breathing, blue, limp or unresponsive',es:'El bebé (recién nacido) no respira, está azulado, flácido o no responde',reason:'Call the neonatal resuscitation (NRP) team immediately: warm, dry, stimulate; PPV if apneic or HR <100. Do not finish the form first.',signal:'COLLAPSE'},
  critical_shock:{acuity:'immediate',en:'Known critical vital/lab result or shock',es:'Signo vital o resultado de laboratorio crítico conocido, o choque (shock)',reason:'Immediate clinician/emergency assessment of the reported critical condition; this flow does not diagnose or treat it.',signal:'CRITICAL_CONDITION'},
  ipv_safety:{acuity:'immediate',en:'Afraid or not safe to go home, or partner controlling / won’t leave / answers for her',es:'Tiene miedo o no está segura de regresar a casa, o la pareja la controla, no se retira o contesta por ella',reason:'IMMEDIATE, with social work/advocate and safety planning now (ACOG CO 518). Ask alone, without the partner or family present; use a professional interpreter, never family.',signal:'IPV_SAFETY'},
  mech_crash:{acuity:'immediate',en:'Vehicle crash at ≥40 mph or on a highway',es:'Choque de vehículo a 40 mph (65 km/h) o más, o en carretera',reason:'High-risk trauma mechanism: immediate maternal/fetal assessment.',signal:'TRAUMA_MECHANISM'},
  mech_vehicle:{acuity:'immediate',en:'Intrusion, ejection, rollover, airbag deployment, extrication, unrestrained, or a death in the vehicle',es:'Deformación hacia adentro del vehículo, salió expulsada, volcadura, bolsa de aire activada, tuvo que ser sacada del vehículo, sin cinturón, o alguien murió en el vehículo',reason:'High-risk trauma mechanism: immediate maternal/fetal assessment.',signal:'TRAUMA_MECHANISM'},
  mech_pedestrian:{acuity:'immediate',en:'Pedestrian or rider struck, or thrown/separated from a bike, motorcycle, ATV or horse',es:'Atropellada como peatón o ciclista, o salió despedida de bicicleta, motocicleta, cuatrimoto o caballo',reason:'High-risk trauma mechanism: immediate maternal/fetal assessment.',signal:'TRAUMA_MECHANISM'},
  mech_abdomen:{acuity:'immediate',en:'Blow to or fall onto the abdomen, steering wheel/dashboard impact, or seat-belt sign',es:'Golpe o caída sobre el abdomen, golpe con el volante o el tablero, o marca del cinturón de seguridad',reason:'High-risk trauma mechanism: immediate maternal/fetal assessment.',signal:'TRAUMA_MECHANISM'},
  mech_penetrating:{acuity:'immediate',en:'Penetrating injury (stab, gunshot, impalement)',es:'Herida penetrante (cuchillo, bala u objeto clavado)',reason:'High-risk trauma mechanism: immediate assessment.',signal:'TRAUMA_MECHANISM'},
  mech_strangulation:{acuity:'immediate',en:'Strangulation or neck compression, ever',es:'Estrangulación o presión en el cuello, alguna vez',reason:'Strangulation ever: IMMEDIATE, with social work/advocate and safety planning.',signal:'TRAUMA_MECHANISM'},
  mech_sexual_assault:{acuity:'immediate',en:'Sexual assault',es:'Agresión sexual',reason:'Sexual assault: immediate assessment; route to SANE/forensic examination.',signal:'TRAUMA_MECHANISM'},
  mech_intoxication:{acuity:'immediate',en:'Intoxication or unreliable history',es:'Bajo efectos de alcohol o drogas, o historia no confiable',reason:'Impaired or unreliable history after trauma: immediate assessment.',signal:'TRAUMA_MECHANISM'},
  fall:{acuity:'prompt',en:'Was this a fall?',es:'¿Fue una caída?',reason:'Fall: record the height. Fall >10 ft or height unknown is IMMEDIATE.',signal:'TRAUMA_MECHANISM'},
  hdr_T1:{acuity:'prompt',en:'Vaginal bleeding?',es:'¿Sangrado vaginal?',header:'T1'},
  hdr_T2:{acuity:'prompt',en:'One-sided leg swelling or pain?',es:'¿Hinchazón o dolor de una sola pierna?',header:'T2'},
  hdr_T3:{acuity:'prompt',en:'Contractions / leaking fluid?',es:'¿Contracciones o salida de líquido?',header:'T3'},
  hdr_T4:{acuity:'prompt',en:'Fever / chills / infection?',es:'¿Fiebre, escalofríos o infección?',header:'T4'},
 };
 const ITEMS={};
 for(const q of RF.items)if(q.id!=='severe_bp'&&q.id!=='critical_condition'&&q.id!=='collapse_infant')ITEMS[q.id]={id:q.id,acuity:q.acuity,en:q.labels.en,es:q.labels.es,reason:q.reason,signal:q.signals[0]};
 for(const [id,v] of Object.entries(NEW))ITEMS[id]={id,...v};
 // Doc G8: uncertain intent = Unsure on harm_intent.
 ITEMS.harm_intent.hint={en:'Uncertain intent: answer Unsure here.',es:'Si la intención es incierta: responda No estoy segura aquí.'};
 Object.values(ITEMS).forEach(Object.freeze);Object.freeze(ITEMS);
 // ---------- structure ----------
 const GATE=Object.freeze(['collapse_maternal','collapse_baby','cord_prolapse','birth_imminent','hemorrhage','seizure_ams','breathing_chest','stroke','anaphylaxis','syncope','critical_shock']); // NF4 10 tiles + NB11 collapse split = 11; NC11 order: collapse (maternal, baby), cord prolapse, imminent birth first
 const UNIVERSAL=Object.freeze(['headache_vision','sepsis','severe_abdominal','ectopic','fetal_movement']); // NF1/NF2
 const SAFETY=Object.freeze(['harm_intent','intrusive_thoughts','psychosis','trauma_ipv','ipv_safety']); // NF6/NF9 (+ privateScreen NF7)
 const MECH=Object.freeze(['mech_crash','mech_vehicle','mech_pedestrian','mech_abdomen','mech_penetrating','mech_strangulation','mech_sexual_assault','mech_intoxication']); // NF8 (+ fall/height)
 const TREES=Object.freeze({
  T1:Object.freeze({en:'Pain / bleeding',es:'Dolor / sangrado',items:['vaginal_bleeding'],shown:['severe_abdominal','ectopic','hemorrhage']}),
  T2:Object.freeze({en:'BP / headache / breathing / leg',es:'Presión / dolor de cabeza / respiración / pierna',items:['leg_clot'],shown:['headache_vision','breathing_chest','stroke','seizure_ams']}),
  T3:Object.freeze({en:'Labor / fluid / baby movement',es:'Trabajo de parto / líquido / movimientos del bebé',items:['labor','membranes'],shown:['fetal_movement','cord_prolapse','birth_imminent']}),
  T4:Object.freeze({en:'Fever / infection / postpartum / other',es:'Fiebre / infección / posparto / otro',items:['fever','vaginal_bleeding','leg_clot'],shown:['sepsis']}),
 });
 // Trauma downgrade needs every one of these No (current TRAUMA_DANGER with critical_condition split per Doc ruling 5).
 const TRAUMA_DANGER=Object.freeze([...RF.TRAUMA_DANGER.filter(k=>k!=='critical_condition'),'critical_shock',...MECH,'ipv_safety']); // collapse_* are gate items (lock EMERGENT)
 const ADDON_ITEMS=Object.freeze(['vaginal_bleeding','labor','membranes']);
 const STATUSES=Object.freeze(['unknown','lt20','ge20','postpartum']);
 const INTERPRETERS=Object.freeze(['professional','qualified_bilingual','family','none']);
 const TEXT_TREE={ROM:'T3',PRETERM_LABOR:'T3',FETAL_MOVEMENT:'T3',OB_BLEEDING:'T1',ABRUPTION:'T1',DVT_EVALUATION:'T2',POSTPARTUM_FEVER:'T4',FEVER_EVALUATION:'T4',UTI_EVALUATION:'T4'};
 const TREES_ITEMS_FROM=ts=>ts.flatMap(t=>TREES[t].items);
 function create(uiLang){return {uiLang:uiLang==='es'?'es':'en',answers:{},audit:{},blocked:[],bp:'not_measured',hr:'not_measured',spo2:'not_measured',patientLanguage:'',interpreter:'',status:'unknown',tree:null,addedTrees:[],fallHeight:undefined,privateScreen:'',text:'',confirmed:{},deferred:{}};}
 // NF15: one stored answer per item; Yes/Unsure can never be lowered to No by re-answering anywhere.
 function setAnswer(s,id,v,via){
  if(!ITEMS[id]||!['yes','no','unsure'].includes(v))return {ok:false,reason:'invalid'};
  const old=s.answers[id];
  if((old==='yes'||old==='unsure')&&v==='no'){s.blocked.push(id);return {ok:false,reason:'positive_locked'};}
  if(old==='yes'&&v==='unsure')return {ok:false,reason:'positive_locked'};
  s.answers[id]=v;s.audit[id]=via==='group_no'?'group_no':'item';return {ok:true};
 }
 // NF9: "None of these (n)" records an explicit No only for the visible unanswered items given; never on safety/mechanism lists.
 const NO_GROUP=new Set([...SAFETY,...MECH,'fall']);
 function groupNo(s,ids){
  if(ids.some(id=>NO_GROUP.has(id)))return {ok:false,reason:'per_item_required'};
  const set=[];for(const id of ids)if(s.answers[id]===undefined){setAnswer(s,id,'no','group_no');set.push(id);}
  return {ok:true,set};
 }
 const pos=a=>a==='yes'||a==='unsure';
 function mapLanguage(s){return {preferred:['en','es','other'].includes(s.patientLanguage)?s.patientLanguage:'',interpreter:s.interpreter==='qualified_bilingual'?'professional':['professional','family','none'].includes(s.interpreter)?s.interpreter:''};}
 function textLayer(s){
  const opts={language:mapLanguage(s),bp:s.bp,hr:s.hr,spo2:s.spo2};
  const f=E.parse(s.text||'',opts),safety=E.safetyAssessment(f,{language:opts.language});
  const alerts=safety.alerts.filter(a=>a.source!=='checklist'&&!/^RF_/.test(a.id)).map(a=>({...a,source:a.source||'text',text:String(a.text).replace(/\s*Spanish return precautions \(provisional\):[\s\S]*$/,'')})); // NF17: patient-facing Spanish hidden
  // NF16: free-text vitals escalate in the nurse (always OB) context: HR >=110, SpO2 <95, SBP <90, severe BP.
  const ft=E.parse(s.text||'',{language:opts.language});
  const tv=[];if(ft.hr>=110)tv.push('HR '+ft.hr);if(ft.spo2!==undefined&&ft.spo2<95)tv.push('SpO2 '+ft.spo2+'%');if(ft.sbpMin!==undefined&&ft.sbpMin<90)tv.push('SBP '+ft.sbpMin);if(ft.severeBP)tv.push('severe-range BP');
  if(tv.length)alerts.push({id:'TEXT_ABNORMAL_VITALS',urgency:'immediate',level:'red',source:'text',text:'Free text reports '+tv.join(', ')+' (CMQCC): immediate clinician assessment of stability now; enter the measured value in the vitals screen.'});
  const lang=f.language||{},ev=f.evidence||{};
  return {f,alerts,spanishText:lang.code==='es'||!!ev.spanishOnly||!!lang.interpreterRecommended};
 }
 function statusConflict(s,f){
  const st=s.status,ga=f.ga>0?f.ga:undefined,pp=!!f.postpartum;
  if(st==='unknown')return false;
  if(st==='lt20')return (ga!==undefined&&ga>=20)||pp&&ga===undefined&&/deliver|birth|cesarean|c-?section/i.test(s.text||'');
  if(st==='ge20')return (ga!==undefined&&ga<20&&!pp)||pp;
  if(st==='postpartum')return ga!==undefined&&!pp;
  return false;
 }
 function visibleByStatus(id,st){
  if(id==='ectopic')return st==='lt20'||st==='unknown';
  if(id==='fetal_movement')return st==='ge20'||st==='unknown';
  if(id==='labor'||id==='membranes')return st!=='postpartum';
  return true;
 }
 // NB9: physiologically implausible entries need one "confirm value" tap before they count (and can latch the lock).
const PLAUS={hr:v=>v<30||v>200,spo2:v=>v<70,sbp:v=>v<50||v>250,dbp:v=>v>150};
function implausible(s){
 const out=[],c=s.confirmed||{};const chk=(k,v)=>{if(Number.isFinite(v)&&PLAUS[k](v)&&c[k]!==v)out.push({k,v});};
 chk('hr',s.hr);chk('spo2',s.spo2);if(s.bp&&typeof s.bp==='object'){chk('sbp',s.bp.sbp);chk('dbp',s.bp.dbp);}
 return out;
}
function effective(s){
 const imp=implausible(s);if(!imp.length)return s;const e={...s};
 for(const {k} of imp){if(k==='hr'||k==='spo2')e[k]='not_measured';else{const bp={...s.bp};delete bp[k];e.bp=Object.keys(bp).length?bp:'not_measured';}}
 return e;
}
function parseVitals(s){
  const bp=RF.parseBP(s.bp==='not_measured'||s.bp===undefined?'not_measured':s.bp);
  const v=RF.parseVitals({hr:s.hr===undefined?'not_measured':s.hr,spo2:s.spo2===undefined?'not_measured':s.spo2});
  return {bp,v};
 }
 function evaluate(s0,prior){
  const imp=implausible(s0),s=effective(s0);
  const T=textLayer(s),f=T.f,a=s.answers;
  const conflict=statusConflict(s,f);
  const st=conflict?'unknown':(STATUSES.includes(s.status)?s.status:'unknown'); // NF10/NF11
  const vis=id=>visibleByStatus(id,st);
  const gateTapped=GATE.some(id=>pos(a[id]));
  // Active trees: picked + added + text-opened (NF16) + header Yes/Unsure.
  const textTrees=[...new Set(T.alerts.map(x=>TEXT_TREE[x.id]).filter(Boolean))];
  const baseTrees=[...new Set([s.tree,...s.addedTrees,...textTrees].filter(t=>TREES[t]))];
  const textTrauma=T.alerts.some(x=>x.id==='TRAUMA_IPV');
  const traumaOn=pos(a.trauma_ipv)||textTrauma;
  const req=new Set([...GATE,...UNIVERSAL.filter(vis),...SAFETY]);
  for(const t of baseTrees)TREES[t].items.filter(vis).forEach(i=>req.add(i));
  if(traumaOn){ADDON_ITEMS.filter(vis).forEach(i=>req.add(i));MECH.forEach(i=>req.add(i));req.add('fall');}
  const headers=Object.keys(TREES).filter(t=>!baseTrees.includes(t)&&TREES[t].items.filter(vis).some(i=>!req.has(i))).map(t=>'hdr_'+t);
  headers.forEach(h=>req.add(h));req.add('other_concern');
  const headerTrees=headers.filter(h=>pos(a[h])).map(h=>h.slice(4));
  for(const t of headerTrees)TREES[t].items.filter(vis).forEach(i=>req.add(i));
  const activeTrees=[...baseTrees,...headerTrees];
  // ---------- bypass (Nov 12) ----------
  // Any positive Act-now item, positive IMMEDIATE universal emergency, or immediate measured vital locks EMERGENT
  // (extends NF12 beyond the gate). The nurse can open the protocol and is not forced through more questions.
  const {bp:bp0,v:v0}=parseVitals(s);
  const vitalsImmediate=(bp0.valid&&bp0.measured&&bp0.severe)||(!bp0.valid&&bp0.severeEvidence)||(bp0.measured&&bp0.sbp<90)||(!bp0.measured&&bp0.evidence&&bp0.evidence.sbp<90)||v0.abnormal;
  const bypassBy=[...GATE.filter(id=>pos(a[id])),...UNIVERSAL.filter(id=>pos(a[id])&&ITEMS[id].acuity==='immediate'&&vis(id)),...(vitalsImmediate?['vitals']:[])];
  let lockedNow=bypassBy.length>0||!!(prior&&prior.locked);
  // ---------- item states ----------
  const states={};
  const deriveStates=()=>{for(const id of Object.keys(ITEMS)){
   if(a[id]!==undefined)states[id]=s.audit[id]==='group_no'&&a[id]==='no'?'group_no':a[id];
   else if(ITEMS[id].header&&!req.has(id))states[id]='na_header';
   else if(!vis(id))states[id]='na_status';
   else if(req.has(id))states[id]=lockedNow?'not_assessed':'unanswered';
   else if(!traumaOn&&(MECH.includes(id)||id==='fall'))states[id]='na_trauma';
   else states[id]='not_asked';
  }};
  deriveStates();
  const answered=id=>a[id]!==undefined;
  const unanswered=[...req].filter(id=>!answered(id));
  // ---------- vitals (NF13) ----------
  const {bp,v}=parseVitals(s);
  const alerts=[];
  const add=(id,urgency,text,extra)=>alerts.push({id,urgency,level:urgency==='immediate'?'red':'amber',text,source:'nurse',...extra});
  if(bp.valid&&bp.measured&&bp.severe||!bp.valid&&bp.severeEvidence)add('RF_SEVERE_BP','immediate',bp.measured?'Measured BP '+bp.sbp+'/'+bp.dbp+': SBP ≥160 OR DBP ≥110. Immediate clinician assessment and repeat BP per the adopted severe-hypertension pathway; symptoms are not required.':'A measured BP component is severe (SBP ≥160 OR DBP ≥110): immediate clinician assessment now; do not await the other component.');
  const sbpLow=bp.measured&&bp.sbp<90||!bp.measured&&bp.evidence&&bp.evidence.sbp<90;
  if(sbpLow)add('RF_SBP_LOW','immediate','Measured SBP <90: possible shock. Immediate clinician assessment of stability now.');
  // NC1 (Doc re-verdict; MEWC HR <50, Mhyre 2014): maternal bradycardia from measured/confirmed or free-text HR.
  const bradySx=pos(a.syncope)||pos(a.breathing_chest)||pos(a.seizure_ams)||sbpLow||(Number.isFinite(v.spo2)&&v.spo2<95)||/dizz|faint|syncop|pass(?:ed)? out|light[- ]?headed|presyncop|near[- ]?faint|mare(?:o|ad[ao])|desmay|chest pain|confus|altered/i.test(E.parse(s.text||'',{}).positiveText||'') /* NE3: + lightheaded/presyncope/near-faint/mareo/mareada/casi me desmayo */; // ND7: the text engine's negation scope ('denies dizziness' is not dizziness; 'but fainted' still counts)
  const bradyFrom=(hr,src)=>{if(!Number.isFinite(hr)||hr>=50)return;const imm=hr<40||bradySx;
   add(src==='text'?'TEXT_BRADY':'RF_BRADY',imm?'immediate':'urgent',(src==='text'?'Free text reports maternal HR ':'Maternal HR ')+hr+(imm?(hr<40?' (<40)':' (<50 with syncope/dizziness, chest pain, SBP <90, SpO2 <95 or altered mental status)')+': IMMEDIATE clinician assessment now; 12-lead ECG; review medicines (labetalol, magnesium, beta-blockers, opioids).':' (40–49, MEWC <50): clinician at the bedside within 15 min, 12-lead ECG, review medicines (labetalol, magnesium, beta-blockers, opioids), check temperature and symptoms.')+(src==='text'?' Enter the measured maternal pulse in the vitals screen.':''),{source:src==='text'?'text':'nurse'});};
  bradyFrom(v.hr,'nurse');
  {const tx=E.parse(s.text||'',{}).hr;if(Number.isFinite(tx)&&tx!==v.hr)bradyFrom(tx,'text');}
  // NC1/ND2: HR <50 needs a required "confirm maternal pulse (radial palpation)" tap (maternal vs fetal confusion). Never delays an alert.
  // HR 110–160 at ≥20 wk / labor: non-blocking "palpate radial pulse" hint only (no hold, no section item).
  const pulseConfirmNeeded=Number.isFinite(v.hr)&&v.hr<50&&!(s.confirmed&&s.confirmed.pulse===v.hr);
  const pulseHint=Number.isFinite(v.hr)&&v.hr>=110&&v.hr<=160&&(st==='ge20'||pos(a.labor));
  if(pulseConfirmNeeded)add('PULSE_CONFIRM','prompt','Confirm maternal pulse (radial palpation): HR '+v.hr+' could be a fetal heart rate entered by mistake (or the reverse). Alerts already apply; confirm or re-measure now.',{task:true,level:'red'});
  if(v.abnormal)add('RF_ABNORMAL_VITALS','immediate','Measured HR ≥110 or SpO2 <95% (CMQCC): immediate clinician assessment of stability now.');
  if(imp.length)add('VITAL_CONFIRM','prompt','Implausible value entered ('+imp.map(x=>({hr:'HR',spo2:'SpO2',sbp:'SBP',dbp:'DBP'}[x.k])+' '+x.v).join(', ')+'): recheck, then tap “Confirm value” if correct. Not counted until confirmed; never delays other IMMEDIATE alerts.',{task:true,level:'red'});
  const vitalsHold=!(bp.mode==='measured'&&bp.valid)||!v.measured;
  const stable=bp.measured&&bp.valid&&!bp.severe&&bp.sbp>=90&&v.stable&&v.hr>=50; // NC1: HR <50 is never stable
  // ---------- language / interpreter (NF14, NF17, NF18) ----------
  const interpreterNeeded=(s.patientLanguage&&s.patientLanguage!=='en')||(T.spanishText); // B2 carryover: Spanish text with English patient language asks the interpreter question
  const interpreterMissing=interpreterNeeded&&!INTERPRETERS.includes(s.interpreter);
  const languageMissing=!['en','es','other'].includes(s.patientLanguage);
  const r5Lock=interpreterNeeded&&!['professional','qualified_bilingual'].includes(s.interpreter);
  const spanishPathLock=s.uiLang==='es';
  const downgradeLock=r5Lock||spanishPathLock;
  const familyInterp=interpreterNeeded&&s.interpreter==='family';
  // ---------- structured item alerts ----------
  for(const id of Object.keys(ITEMS)){
   const it=ITEMS[id];if(!pos(a[id])||it.header||id==='fall')continue;
   add('RF_'+id.toUpperCase(),it.acuity,it.en+' — '+(a[id]==='unsure'?'Unsure is treated as Yes. ':'Yes. ')+it.reason,{itemId:id,signals:[it.signal]});
  }
  // NF8 fall height
  if(pos(a.fall)){
   const h=s.fallHeight;
   if(h==='unknown'||Number.isFinite(h)&&h>10||a.fall==='unsure')add('RF_FALL_HIGH','immediate','Fall >10 ft or height unknown: high-risk mechanism, immediate maternal/fetal assessment.',{itemId:'fall'});
   else if(!Number.isFinite(h))add('FALL_HEIGHT_REQUIRED','prompt','Required step: document the fall height and whether she landed on her abdomen. IMMEDIATE if >10 ft or the height cannot be obtained.',{itemId:'fall'});
  }
  // NF7 private screening
  const privateEff=familyInterp&&s.privateScreen==='yes'?'no':s.privateScreen;
  if(privateEff==='cannot_separate')add('IPV_SAFETY','immediate','Cannot separate her from partner/family for private screening: IMMEDIATE, with social work/advocate and private safety screening (ACOG CO 518).');
  else if(privateEff==='no')add('PARTNER_RESCREEN','prompt','Open task (non-escalating): not screened privately'+(familyInterp?' (family/friend interpreter counts as not private)':'')+'. Separate her from partner/family (for example, for a urine sample or exam) and rescreen privately with a professional interpreter if needed. If she cannot be separated: IMMEDIATE.',{task:true});
  // NF5 trauma downgrade
  const naOk=id=>!conflict&&states[id]==='na_status'&&((id==='fetal_movement'&&(st==='lt20'||st==='postpartum'))||((id==='labor'||id==='membranes')&&st==='postpartum'));
  const fallResolved=a.fall==='no'||(a.fall==='yes'&&Number.isFinite(s.fallHeight)&&s.fallHeight<=10);
  const traumaDenied=TRAUMA_DANGER.every(k=>a[k]==='no'||naOk(k))&&fallResolved&&stable&&privateEff==='yes'&&!downgradeLock&&!T.alerts.some(x=>x.id==='TRAUMA_IPV'&&x.traumaBasis==='danger');
  if(traumaOn&&!traumaDenied)add('RF_TRAUMA_DANGER','immediate','Trauma/IPV without every danger item and mechanism answered No, private screening, and measured stable BP/HR/SpO2'+(downgradeLock?' (downgrade locked: '+(spanishPathLock?'Spanish path, pending validation':'')+(spanishPathLock&&r5Lock?'; ':'')+(r5Lock?'non-English patient without professional/qualified bilingual interpreter (R5)':'')+')':'')+': IMMEDIATE maternal/fetal assessment and monitoring now. Ask privately; complete a safety assessment.',{signals:['TRAUMA_IPV']});
  if(traumaOn&&traumaDenied)add('TRAUMA_WORKUP','prompt',(st==='lt20'||st==='postpartum'?'Under 20 weeks/postpartum: maternal evaluation now; document fetal heart tones when gestational age permits; Rh status if pregnant.':'≥20 weeks (or unknown): continuous fetal heart rate and contraction monitoring for at least 4 hours, even after minor trauma. Extend for contractions, uterine tenderness, bleeding, ROM, abnormal tracing or high-risk mechanism. Check Rh type; anti-D if Rh-negative per protocol. Consider Kleihauer-Betke.'),{task:true});
  // NF14/NF17 passive-SI and PUL locks
  const textIds=new Set(T.alerts.map(x=>x.id));
  if(downgradeLock&&(pos(a.intrusive_thoughts)||textIds.has('PASSIVE_SI')))add('RF_INTERPRETER_SI','immediate','Passive suicidal/intrusive thoughts with downgrade locked ('+(spanishPathLock?'Spanish path, pending validation':'R5: no professional/qualified bilingual interpreter')+'): IMMEDIATE until risk is assessed through a professional interpreter.',{signals:['MENTAL_HEALTH']});
  if(r5Lock&&textIds.has('ECTOPIC_STABLE_PUL'))add('RF_PUL_LOCK','immediate','Stable PUL downgrade locked (R5: non-English patient without professional/qualified bilingual interpreter): immediate OB/GYN assessment.');
  // Text alerts: text can only raise (NF16). Unconfirmed text trauma downgrades only with structured denial.
  const textAlerts=T.alerts.map(x=>x.id==='TRAUMA_IPV'&&x.urgency==='immediate'&&x.traumaBasis==='unconfirmed'&&traumaDenied?{...x,urgency:'urgent',level:'amber',traumaBasis:'structured-denied'}:x);
  if(downgradeLock)for(const x of textAlerts)if(x.id==='TRAUMA_IPV'&&x.urgency!=='immediate'&&!alerts.some(y=>y.id==='RF_TRAUMA_DANGER'))add('RF_TRAUMA_DANGER','immediate','Trauma with downgrade locked (Spanish path or R5): IMMEDIATE.');
  // ---------- merge with latched prior alerts (NF15, G9) ----------
  const current=[...alerts,...textAlerts];
  const present=new Set(current.map(x=>x.id)),all=new Map();
  const priorAlerts=prior&&Array.isArray(prior.alerts)?prior.alerts:[];
  for(const x of [...priorAlerts,...current]){
   if(!x||!rank[x.urgency]&&x.urgency!=='prompt')continue;
   const old=all.get(x.id);if(!old||rank[x.urgency]>=rank[old.urgency])all.set(x.id,{...x,retained:!present.has(x.id)});
  }
  // ROM + labor wherever answered (G10/NF15), including text/latched sources.
  const has=(...ids)=>ids.some(i=>all.has(i));
  if(has('RF_MEMBRANES','ROM')&&has('RF_LABOR','PRETERM_LABOR')&&!all.has('RF_ROM_LABOR'))all.set('RF_ROM_LABOR',{id:'RF_ROM_LABOR',urgency:'immediate',level:'red',source:'nurse',signals:['OB_EMERGENCY'],text:'Membrane rupture with labor / contractions: immediate obstetric assessment; contact the obstetric team now.'});
  const out=[...all.values()].map(x=>x.urgency==='urgent'&&!String(x.text).startsWith(RF.URGENT_DEFINITION.en)?{...x,text:RF.URGENT_DEFINITION.en+' '+x.text}:x);
  const urgency=out.filter(x=>!x.task).reduce((u,x)=>max(u,x.urgency),'prompt');
  // NB7: any IMMEDIATE alert from any source locks EMERGENT, except the alerts that await a structured trauma answer.
  const lockAlerts=out.filter(x=>x.urgency==='immediate'&&!x.task&&x.id!=='RF_TRAUMA_DANGER'&&!(x.id==='TRAUMA_IPV'&&x.traumaBasis==='unconfirmed'));
  for(const x of lockAlerts)if(!bypassBy.includes(x.itemId||x.id)&&!(x.itemId&&bypassBy.includes(x.itemId))&&!['RF_SEVERE_BP','RF_SBP_LOW','RF_ABNORMAL_VITALS'].includes(x.id))bypassBy.push(x.itemId||x.id);
  if(lockAlerts.length&&!lockedNow){lockedNow=true;deriveStates();}
  // ---------- holds / disposition ----------
  const holds=[];
  if(!s.tree)holds.push('pick_complaint');
  if(unanswered.length)holds.push('unanswered');
  if(vitalsHold)holds.push('vitals');
  if(languageMissing)holds.push('patient_language');
  if(interpreterMissing)holds.push('interpreter');
  if(!['yes','no','cannot_separate'].includes(s.privateScreen))holds.push('private_screen');
  if(conflict)holds.push('status_conflict');
  if(pulseConfirmNeeded)holds.push('pulse_confirm');
  const locked=lockedNow; // NF12 (+ bypass extension)
  let held=!locked&&holds.length>0;
  const lockedUrgency=locked?'immediate':urgency;
  let disposition=locked?'EMERGENT':held?null:(urgency==='immediate'?'EMERGENT':urgency==='urgent'?'URGENT':'PROMPT_CLINICIAN_REVIEW');
  const followUp=locked?['Emergency transfer to L&D/OR/ICU/ED: never delay; hand off open screening items']:[];
  // ---------- sections / finish-screening reminders / discharge gate ----------
  const ans=id=>a[id]!==undefined;
  const remainingOf=ids=>ids.filter(id=>req.has(id)&&!ans(id));
  const treeItems=[...new Set(activeTrees.flatMap(t=>TREES[t].items.filter(vis)))];
  const sections=[
   {id:'safety',remaining:[...remainingOf(SAFETY),...(['yes','no','cannot_separate'].includes(s.privateScreen)?[]:['private_screen'])]},
   {id:'vitals',remaining:[...(bp.mode==='measured'&&bp.valid?[]:['bp']),...(Number.isFinite(v.hr)?[]:['hr']),...(Number.isFinite(v.spo2)?[]:['spo2']),...(languageMissing?['patient_language']:[]),...(interpreterMissing?['interpreter']:[]),...(pulseConfirmNeeded?['pulse_confirm']:[])]},
   {id:'gate',remaining:gateTapped?[]:remainingOf(GATE)},
   {id:'universal',remaining:remainingOf(UNIVERSAL)},
   {id:'complaint',remaining:[...(s.tree?[]:['pick_complaint']),...remainingOf(treeItems)]},
   ...(traumaOn?[{id:'addon',remaining:remainingOf([...ADDON_ITEMS,...MECH,'fall'])}]:[]),
   {id:'catch',remaining:remainingOf([...headers,'other_concern',...TREES_ITEMS_FROM(headerTrees)])},
  ].map(x=>({...x,done:x.remaining.length===0,deferred:x.remaining.length&&s.deferred&&DEFER_REASONS.includes(s.deferred[x.id])?s.deferred[x.id]:null}));
  if(conflict)sections.push({id:'status',remaining:['status_conflict'],done:false,deferred:s.deferred&&DEFER_REASONS.includes(s.deferred.status)?s.deferred.status:null});
  // NC8: documented deferral releases a held non-locked disposition with a floor of URGENT, only if every hold is covered by a deferred section.
  // Deferred items never count toward any downgrade (they stay unanswered); discharge home stays blocked below.
  const defSec=new Set(sections.filter(x=>x.deferred).map(x=>x.id));
  const holdSec={pick_complaint:['complaint'],vitals:['vitals'],patient_language:['vitals'],interpreter:['vitals'],pulse_confirm:['vitals'],private_screen:['safety'],status_conflict:['status']};
  const covered=h=>h==='unanswered'?unanswered.every(id=>sections.some(x=>defSec.has(x.id)&&x.remaining.includes(id))):(holdSec[h]||[]).some(x=>defSec.has(x));
  const deferRelease=held&&defSec.size>0&&holds.every(covered);
  if(deferRelease){held=false;disposition=urgency==='immediate'?'EMERGENT':'URGENT';}
  // NB5: discharge home / non-emergency transfer needs vitals, safety, other emergencies (incl. fetal movement), trauma add-on and no status conflict.
  // NB8: a deferral never sets an answer and never opens this gate.
  const GATE_SECTIONS=['vitals','safety','universal','addon','status'];
  const dischargeOpen=sections.filter(x=>GATE_SECTIONS.includes(x.id)&&!x.done);
  const dischargeBlocked=dischargeOpen.length>0;
  const r={version:1,deferRelease,pulseConfirmNeeded,pulseHint,bypassBy,sections,dischargeBlocked,dischargeOpen:dischargeOpen.map(x=>x.id),implausible:imp,uiLang:s.uiLang,status:st,statusChosen:s.status,statusConflict:conflict,gateTapped,locked:!!locked,urgency:lockedUrgency,disposition,held,holds,unanswered,states,requiredItems:[...req],activeTrees,headers,traumaOn,traumaDenied,downgradeLock,r5Lock,spanishPathLock,interpreterNeeded,privateEffective:privateEff,vitals:{bp,v,stable},alerts:out,tasks:out.filter(x=>x.task||x.urgency==='prompt'),followUp,facts:{ga:f.ga,postpartum:!!f.postpartum},blocked:[...s.blocked]};
  r.sbar=sbar(s,r);
  return r;
 }
 const SECTION_EN={safety:'Safety screen',vitals:'Vitals/language',gate:'Act now',universal:'Other emergencies',complaint:'Complaint questions',addon:'Trauma add-on',catch:'Anything else',status:'Pregnancy status conflict'};
const DEFER_REASONS=Object.freeze(['unstable','transferred','declined','no_interpreter']);
const DEFER_EN={unstable:'patient unstable/sedated',transferred:'transferred to higher care',declined:'patient declined',no_interpreter:'interpreter unavailable'};
// NB8: documented deferral of an open section. Never sets any answer.
function defer(s,section,reason){if(!DEFER_REASONS.includes(reason))return {ok:false,reason:'invalid'};s.deferred=s.deferred||{};s.deferred[section]=reason;return {ok:true};}
// NB9: confirm a currently entered implausible vital.
function confirmVital(s,k){const v=k==='sbp'||k==='dbp'?(s.bp&&s.bp[k]):s[k==='pulse'?'hr':k];if(!Number.isFinite(v))return {ok:false};s.confirmed=s.confirmed||{};if(k==='hr'||k==='pulse'){s.confirmed.hr=v;s.confirmed.pulse=v;}else s.confirmed[k]=v;return {ok:true};} // NC1: one tap confirms the maternal pulse (and an implausible HR)
const openList=r=>r.sections.filter(x=>!x.done).map(x=>SECTION_EN[x.id]+' ('+x.remaining.map(id=>ITEMS[id]?ITEMS[id].en:FIELD_EN[id]||id).join('; ')+')').join('; ');
 const FIELD_EN={pulse_confirm:'confirm maternal pulse (radial palpation)',status_conflict:'free text conflicts with status',bp:'BP',hr:'HR',spo2:'SpO2',patient_language:'patient language',interpreter:'interpreter',private_screen:'screened privately',pick_complaint:'pick a complaint'};
 const label=id=>ITEMS[id]?ITEMS[id].en:id;
 // NF3/NF12/NF17: SBAR in English for the chart, listing positives, not asked, not assessed and N/A items by name.
 function sbar(s,r){
  const by=k=>Object.keys(r.states).filter(id=>r.states[id]===k&&!ITEMS[id].header);
  const posIds=Object.keys(r.states).filter(id=>(r.states[id]==='yes'||r.states[id]==='unsure')&&!ITEMS[id].header);
  const bp=r.vitals.bp,v=r.vitals.v;
  const vit='BP '+(bp.measured?bp.sbp+'/'+bp.dbp:'not measured')+', HR '+(Number.isFinite(v.hr)?v.hr:'not measured')+', SpO2 '+(Number.isFinite(v.spo2)?v.spo2+'%':'not measured');
  const stat={unknown:'unknown',lt20:'<20 wk (incl. loss/abortion <20 wk)',ge20:'≥20 wk',postpartum:'postpartum (delivered ≥20 wk)'}[r.status];
  const lang={en:'English',es:'Spanish',other:'Other'}[s.patientLanguage]||'not recorded';
  const interp=!r.interpreterNeeded?'not needed (English)':{professional:'professional interpreter',qualified_bilingual:'qualified bilingual clinician',family:'family/friend (not valid for IPV/SI screening)',none:'none'}[s.interpreter]||'NOT RECORDED';
  const parts=[
   'S: OB nurse triage (decision support only). Acuity '+r.urgency.toUpperCase()+'; disposition '+(r.disposition?r.disposition.replace(/_/g,' '):'HELD ('+r.holds.join(', ')+')')+'. Complaint: '+(r.activeTrees.map(t=>TREES[t].en).join(' + ')||'not selected')+'.',
   'B: Status '+stat+(r.statusConflict?' (CONFLICT with free text; all items shown)':'')+'. Patient language '+lang+'; interpreter '+interp+'. App path '+(s.uiLang==='es'?'Spanish (provisional)':'English')+'.',
   'A: '+vit+'. Positive: '+(posIds.map(id=>label(id)+(r.states[id]==='unsure'?' (Unsure)':'')).join('; ')||'none')+'. Alerts: '+(r.alerts.filter(x=>!x.task).map(x=>x.id).join(', ')||'none')+'.',
   'R: '+(r.urgency==='immediate'?'Immediate clinician/team response now; never wait for form completion.':r.urgency==='urgent'?RF.URGENT_DEFINITION.en:'Accountable clinician review required; all-No is not clearance.')+(r.followUp.length?' '+r.followUp.join('. ')+'.':'')+(r.tasks.length?' Open tasks: '+r.tasks.map(x=>x.id).join(', ')+'.':''),
   'Discharge home / non-emergency transfer: '+(r.dischargeBlocked?'BLOCKED until '+r.dischargeOpen.map(id=>SECTION_EN[id]).join(' + ')+' complete':'allowed by screening (vitals, safety screen, other emergencies'+(r.traumaOn?', trauma add-on':'')+' complete)')+'. Emergency transfer to L&D/OR/ICU/ED: never delay; hand off open screening items.'+(r.locked?' Open screening at transfer: '+(openList(r)||'none')+'.':' Not yet screened: '+(openList(r)||'none')+'.')+(r.sections.some(x=>x.deferred)?' Deferred (open task): '+r.sections.filter(x=>x.deferred).map(x=>SECTION_EN[x.id]+' — reason: '+DEFER_EN[x.deferred]).join('; ')+'.'+(r.deferRelease?' Disposition released by documented deferral (floor URGENT): admit, transfer to L&D/higher care, or clinician bedside evaluation allowed; discharge home stays blocked.':''):'')+(r.bypassBy.length?' Bypass to protocol triggered by: '+r.bypassBy.map(id=>ITEMS[id]?ITEMS[id].en:id==='vitals'?'measured vital sign':id).join('; ')+'.':'')+(r.implausible.length?' Unconfirmed implausible vitals: '+r.implausible.map(x=>x.k+' '+x.v).join(', ')+'.':''),
   'Not asked: '+(by('not_asked').map(label).join('; ')||'none')+'. Not assessed: '+(by('not_assessed').map(label).join('; ')||'none')+'. N/A by status: '+(by('na_status').map(label).join('; ')||'none')+'. Trauma add-on: '+(r.traumaOn?'asked':'not triggered')+'. Group No: '+(by('group_no').map(label).join('; ')||'none')+'.'
  ];
  return parts.join(' | ');
 }
 const api=Object.freeze({version:1,SECTION_EN,FIELD_EN,DEFER_REASONS,DEFER_EN,defer,confirmVital,implausible,PLAUS,ITEMS,GATE,UNIVERSAL,SAFETY,MECH,TREES,TRAUMA_DANGER,ADDON_ITEMS,STATUSES,INTERPRETERS,create,setAnswer,groupNo,evaluate,sbar,visibleByStatus,PROVISIONAL:P});
 if(node)module.exports=api;else root.NurseFlow=api;
})(typeof self!=='undefined'?self:this);
