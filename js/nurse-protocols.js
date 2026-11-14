/* Emergent item → protocol map for the nurse bypass (TEST build). Doc bypass verdict NB1–NB14 applied.
 * IDs are existing app content (js/content.js), new nurse cards (NC-*, js/nurse-cards.js)
 * or bilingual NB4 emergency action cards (EA-*). Tested: every id exists; no trigger is a dead end.
 * level: mapped (existing protocol) · card (new nurse card) · partial (nearest content, gap note shown)
 *        · gap (interim emergency action card, gap note shown). Lookup never changes acuity. */
(function(root){
 'use strict';
 const NC=typeof module!=='undefined'&&module.exports?require('./nurse-cards.js'):root.NurseCards;
 const NAMES={
  'FD-PP-01':{en:'Postpartum hemorrhage response',es:'Respuesta a la hemorragia posparto'},
  'PP-01':{en:'Postpartum hemorrhage (card)',es:'Hemorragia posparto (tarjeta)'},
  'FD-GYNB-02':{en:'Acute uterine bleeding',es:'Sangrado uterino agudo'},
  'GYN-02':{en:'Early pregnancy loss',es:'Pérdida temprana del embarazo'},
  'ANT-07':{en:'Placenta accreta spectrum',es:'Espectro de placenta acreta'},
  'FD-ANT-04':{en:'Severe hypertension',es:'Hipertensión grave'},
  'ANT-04':{en:'Hypertensive disorders of pregnancy (magnesium)',es:'Trastornos hipertensivos del embarazo (magnesio)'},
  'FORMULARY':{en:'Obstetric medicines (magnesium dosing)',es:'Medicamentos obstétricos (dosis de magnesio)'},
  'FD-SYS-03':{en:'Maternal sepsis',es:'Sepsis materna'},
  'SYS-01':{en:'Maternal critical illness (incl. cardiac arrest)',es:'Enfermedad materna crítica (incluye paro cardiaco)'},
  'SYS-02-EXP':{en:'Pregnancy-related blood clots: diagnosis (PE/DVT)',es:'Coágulos relacionados con el embarazo: diagnóstico (TEP/TVP)'},
  'FD-GYN-01':{en:'Suspected ectopic pregnancy or PUL',es:'Sospecha de embarazo ectópico o de ubicación desconocida'},
  'FD-GYNB-04':{en:'Adnexal torsion and mass assessment',es:'Torsión anexial y evaluación de masa'},
  'FD-ANT-01':{en:'Prelabor membrane rupture',es:'Ruptura de membranas antes del trabajo de parto'},
  'FD-LND-06':{en:'Shoulder dystocia emergency',es:'Emergencia por distocia de hombros'},
  'FD-LND-01':{en:'Category II fetal heart rate',es:'Frecuencia cardiaca fetal categoría II'},
  'FD-LND-04':{en:'Suspected intraamniotic infection',es:'Sospecha de infección intraamniótica'},
  'ANT-02':{en:'Preterm labor',es:'Trabajo de parto prematuro'},
  'FD-ED-OB':{en:'Emergency department–OB triage and handoff',es:'Triaje y entrega de urgencias a obstetricia'},
 };
 if(NC){for(const [id,c] of Object.entries(NC.CARDS))NAMES[id]={en:c.title.en,es:c.title.es};for(const [id,c] of Object.entries(NC.ACTION))NAMES[id]={en:c.title.en,es:c.title.es};}
 // Per-link condition labels (Doc Q9 / NB1 / NB2 / NB11), bilingual (ES provisional).
 const COND={
  if_mag:{en:'if on magnesium',es:'si recibe magnesio'},
  if_delivered:{en:'if delivered',es:'si ya tuvo el parto'},
  if_lt20_test:{en:'if <20 wk / positive test',es:'si <20 semanas / prueba positiva'}, // NC7
  if_shoulder:{en:'if shoulder dystocia',es:'si hay distocia de hombros'},
  if_lt20:{en:'if <20 weeks',es:'si <20 semanas'},
  if_ipv:{en:'if violence/IPV',es:'si hay violencia de pareja'},
  mother:{en:'mother',es:'madre'},baby:{en:'baby',es:'bebé'},
  if_accreta:{en:'if prior cesarean / accreta risk',es:'si cesárea previa o riesgo de acretismo'},
 };
 const STATUS_LBL={unknown:{en:'status unknown',es:'estado desconocido'},lt20:{en:'for <20 wk',es:'para <20 semanas'},ge20:{en:'for ≥20 wk',es:'para ≥20 semanas'},postpartum:{en:'for postpartum',es:'para posparto'}};
 const L=(id,cond)=>cond?{id,cond}:{id};
 const st=(byStatus,dflt)=>s=>byStatus[s]||dflt;
 const PROV={en:'New protocol card.',es:'Tarjeta de protocolo nueva.'}; // NC10
 const MAP={
  // NB1: ≥20 wk / unknown never opens PPH first; antepartum card first. <20 wk adds the ectopic algorithm.
  hemorrhage:{links:st({lt20:[L('FD-GYN-01'),L('FD-GYNB-02'),L('GYN-02')],ge20:[L('NC-APH'),L('ANT-07','if_accreta')],postpartum:[L('FD-PP-01'),L('PP-01')]},[L('NC-APH'),L('FD-GYN-01','if_lt20_test'),L('FD-PP-01','if_delivered')]),level:'card',note:PROV}, // NC7 unknown order
  breathing_chest:{links:()=>[L('SYS-02-EXP'),L('SYS-01')],level:'partial',note:{en:'Interim card — No dedicated dyspnea/chest-pain or amniotic-fluid-embolism algorithm: PE diagnosis card + critical illness.',es:'Tarjeta interina — No hay algoritmo específico de falta de aire, dolor de pecho o embolia de líquido amniótico: tarjeta de TEP y enfermedad crítica.'}},
  seizure_ams:{links:()=>[L('NC-ECL'),L('FD-ANT-04'),L('ANT-04'),L('FORMULARY')],level:'card',note:PROV}, // NB13
  stroke:{links:()=>[L('EA-STROKE'),L('SYS-01'),L('FD-ANT-04')],level:'gap',note:{en:'Interim card — No stroke protocol in this app: the hospital stroke code is the protocol (interim card).',es:'Tarjeta interina — No hay protocolo de derrame cerebral en esta aplicación: el código de ictus del hospital es el protocolo (tarjeta provisional).'}}, // NB3
  cord_prolapse:{links:()=>[L('NC-CORD')],level:'card',note:PROV},
  birth_imminent:{links:()=>[L('NC-BIRTH'),L('FD-LND-06','if_shoulder')],level:'card',note:PROV}, // NB2
  anaphylaxis:{links:()=>[L('NC-ANAPH')],level:'card',note:PROV},
  syncope:{links:st({lt20:[L('FD-GYN-01'),L('SYS-01')],ge20:[L('SYS-01'),L('NC-APH')],postpartum:[L('FD-PP-01'),L('SYS-01'),L('SYS-02-EXP')]},[L('SYS-01'),L('NC-APH'),L('FD-GYN-01','if_lt20')]),level:'partial',note:{en:'Interim card — No syncope algorithm: nearest content by status; ≥20 wk think abruption, keep left lateral.',es:'Tarjeta interina — No hay algoritmo de síncope: contenido más cercano según el estado; ≥20 semanas piense en desprendimiento, mantenga decúbito lateral izquierdo.'}},
  // NB11: collapse split; a baby trigger never opens SYS-01 alone.
  collapse_maternal:{links:()=>[L('SYS-01')],level:'mapped'},
  collapse_baby:{links:()=>[L('EA-NEO'),L('NC-BIRTH')],level:'gap',note:{en:'Interim card — No neonatal resuscitation protocol in this app: the hospital NRP team/algorithm is the standard (interim card).',es:'Tarjeta interina — No hay protocolo de reanimación neonatal en esta aplicación: el equipo y el algoritmo NRP del hospital son el estándar (tarjeta provisional).'}},
  collapse_any:{links:()=>[L('SYS-01','mother'),L('EA-NEO','baby')],level:'partial',note:{en:'Interim card — Free text did not say who collapsed: mother → SYS-01; baby → newborn card.',es:'Tarjeta interina — El texto no indica quién colapsó: madre → SYS-01; bebé → tarjeta del recién nacido.'}},
  critical_shock:{links:st({postpartum:[L('SYS-01'),L('FD-PP-01'),L('FD-SYS-03')]},[L('SYS-01'),L('FD-SYS-03')]),level:'mapped'},
  headache_vision:{links:()=>[L('FD-ANT-04'),L('ANT-04')],level:'mapped'},
  sepsis:{links:()=>[L('FD-SYS-03'),L('SYS-01')],level:'mapped'},
  severe_abdominal:{links:st({lt20:[L('FD-GYN-01'),L('FD-GYNB-04')],unknown:[L('FD-GYN-01'),L('EA-ABD'),L('FD-GYNB-04')],ge20:[L('EA-ABD'),L('NC-APH')],postpartum:[L('FD-PP-01'),L('SYS-01'),L('FD-SYS-03')]},[L('FD-GYNB-04')]),level:'gap',note:{en:'Interim card — No acute obstetric abdomen protocol at ≥20 wk (interim card).',es:'Tarjeta interina — No hay protocolo de abdomen agudo obstétrico a las ≥20 semanas (tarjeta provisional).'}},
  ectopic:{links:()=>[L('FD-GYN-01')],level:'mapped'},
  harm_intent:{links:()=>[L('NC-SI')],level:'card',note:PROV},
  psychosis:{links:()=>[L('NC-PSY'),L('NC-SI')],level:'card',note:PROV},
  ipv_safety:{links:()=>[L('NC-IPV')],level:'card',note:PROV},
  trauma:{links:()=>[L('EA-TRAUMA'),L('NC-IPV','if_ipv')],level:'gap',note:{en:'Interim card — No trauma-in-pregnancy protocol in this app (interim card; workup text is in the flow).',es:'Tarjeta interina — No hay protocolo de trauma en el embarazo en esta aplicación (tarjeta provisional; el estudio está en el flujo).'}},
  RF_SEVERE_BP:{links:()=>[L('FD-ANT-04'),L('ANT-04')],level:'mapped'},
  // NB10: postpartum SBP <90 / HR / SpO2 also links sepsis and critical illness (+ PE for HR/SpO2); ≥20 wk SBP <90 adds the antepartum card.
  RF_SBP_LOW:{links:st({postpartum:[L('FD-PP-01'),L('FD-SYS-03'),L('SYS-01')],ge20:[L('SYS-01'),L('FD-SYS-03'),L('NC-APH')],unknown:[L('SYS-01'),L('FD-SYS-03'),L('NC-APH')]},[L('SYS-01'),L('FD-SYS-03')]),level:'mapped'},
  RF_ABNORMAL_VITALS:{links:st({postpartum:[L('FD-PP-01'),L('FD-SYS-03'),L('SYS-01'),L('SYS-02-EXP')]},[L('SYS-01'),L('FD-SYS-03'),L('SYS-02-EXP')]),level:'mapped'},
  RF_ROM_LABOR:{links:()=>[L('FD-ANT-01'),L('ANT-02')],level:'mapped'},
  RF_BRADY:{links:()=>[L('EA-BRADY'),L('SYS-01'),L('FORMULARY','if_mag')],level:'gap',note:{en:'Interim card — no maternal bradycardia algorithm in this app: bradycardia action card, then critical illness + magnesium toxicity in the formulary.',es:'Tarjeta interina — no hay algoritmo de bradicardia materna en esta aplicación: tarjeta de acción de bradicardia, luego enfermedad crítica + toxicidad por magnesio en el formulario.'}}, // NC1 + ND6
  generic:{links:()=>[L('EA-GENERIC')],level:'gap',note:{en:'Interim card — No specific protocol mapped for this alert.',es:'Tarjeta interina — No hay protocolo específico para esta alerta.'}},
 };
 for(const m of Object.values(MAP))m.ids=s=>m.links(s).map(x=>x.id);
 const ALERT_KEY={TEXT_BRADY:'RF_BRADY',RF_TRAUMA_DANGER:'trauma',RF_FALL_HIGH:'trauma',IPV_SAFETY:'ipv_safety',RF_INTERPRETER_SI:'harm_intent',TEXT_ABNORMAL_VITALS:'RF_ABNORMAL_VITALS',RF_PUL_LOCK:'ectopic',
  HEMORRHAGE:'hemorrhage',CARDIOPULMONARY:'breathing_chest',SEIZURE:'seizure_ams',STROKE:'stroke',SEVERE_BP:'RF_SEVERE_BP',NEURO_OB_WARNING:'headache_vision',CORD_PROLAPSE:'cord_prolapse',SEPSIS:'sepsis',SHOCK:'critical_shock',ANAPHYLAXIS:'anaphylaxis',COLLAPSE:'collapse_any',ECTOPIC:'ectopic',MENTAL_HEALTH:'harm_intent',OVERDOSE:'harm_intent',TRAUMA_IPV:'trauma',OB_EMERGENCY:'birth_imminent',ABRUPTION:'severe_abdominal'};
 function keyFor(alert){if(alert.itemId&&MAP[alert.itemId])return alert.itemId;if(alert.itemId&&String(alert.itemId).startsWith('mech_'))return 'trauma';if(MAP[alert.id]&&alert.id!=='generic')return alert.id;return ALERT_KEY[alert.id]||null;}
 // NB12: trigger order — cord prolapse, collapse and birth-imminent first, then the gate order, vitals, universals, safety, trauma.
 const ORDER=['collapse_maternal','collapse_baby','collapse_any','cord_prolapse','birth_imminent','hemorrhage','anaphylaxis','seizure_ams','breathing_chest','stroke','critical_shock','syncope','RF_SEVERE_BP','RF_SBP_LOW','RF_ABNORMAL_VITALS','RF_BRADY','headache_vision','sepsis','severe_abdominal','ectopic','RF_ROM_LABOR','harm_intent','psychosis','ipv_safety','trauma','generic'];
 // Protocol buttons for the current IMMEDIATE alerts. Pure; never changes acuity. Unmapped IMMEDIATE alerts get the generic card (NB4: no dead end).
 function forResult(r){
  const out=[],seen=new Set(),stat=r.status||'unknown';
  for(const a of r.alerts){if(a.urgency!=='immediate'||a.task)continue;const k=keyFor(a)||'generic';if(seen.has(k))continue;seen.add(k);const m=MAP[k];const links=m.links(stat);
   out.push({key:k,alertId:a.id,status:stat,links,ids:links.map(x=>x.id),level:m.level,note:m.note||null,gap:m.note&&m.level!=='mapped'?m.note.en:null});}
  out.sort((x,y)=>ORDER.indexOf(x.key)-ORDER.indexOf(y.key));
  return out;
 }
 const LIBRARY=Object.freeze(['NC-CORD','NC-BIRTH','NC-APH','NC-ECL','NC-ANAPH','NC-SI','NC-PSY','NC-IPV','EA-NEO','EA-BRADY','EA-STROKE','EA-TRAUMA','EA-ABD','FD-PP-01','FD-ANT-04','FD-SYS-03','SYS-01','SYS-02-EXP','FD-GYN-01','FD-GYNB-02','FD-GYNB-04','FD-ANT-01','FD-LND-06','FD-LND-01','FD-LND-04','ANT-04','FORMULARY','ANT-02','ANT-07','GYN-02','PP-01','FD-ED-OB']);
 // NE2: URGENT alerts that pin an ordinary (non-bypass) protocol link. Never locks; never shows the rescue banner.
 const URGENT_PIN=Object.freeze(['RF_BRADY']);
 function urgentLinks(r){const out=[],seen=new Set();for(const a of r.alerts||[]){if(a.urgency!=='urgent'||a.task)continue;const k=keyFor(a);if(!k||!URGENT_PIN.includes(k)||seen.has(k))continue;seen.add(k);const m=MAP[k];const links=m.links(r.status||'unknown');out.push({key:k,alertId:a.id,status:r.status||'unknown',links,ids:links.map(x=>x.id),level:m.level,note:m.note||null,urgent:true});}return out;}
 const api=Object.freeze({NAMES,COND,STATUS_LBL,MAP,ALERT_KEY,ORDER,LIBRARY,URGENT_PIN,keyFor,forResult,urgentLinks});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NurseProtocols=api;
})(typeof self!=='undefined'?self:this);
