/* Nurse protocol cards (TEST build). New nurse protocol cards.
 * NC-*: 8 new protocol cards (Doc bypass verdict gap table). Body is English clinician content
 *       (Nov 12: all nurses read English); titles are bilingual (ES provisional).
 * EA-*: NB4 emergency action cards, bilingual (ES provisional, NB14), shown in the page language.
 * Doses: only doses already approved in this app (js/content.js FORMULARY) are printed, plus the epinephrine
 * anaphylaxis dose set Nov 12 (pending CSM pharmacy sign-off); all others
 * say "per CSM pharmacy/order set". Sources: only guidelines verified by title/number on Nov 12 2026. */
(function(root){
 'use strict';
 const PROV_EN='Not unit policy. Check every dose against the CSM pharmacy build.';
 const PROV_ES='No es política de la unidad. Verifique cada dosis con la farmacia de CSM.';
 const ul=a=>'<ul>'+a.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
 const sec=(h,a)=>'<h3>'+h+'</h3>'+ul(a);
 const CARDS={
  'NC-CORD':{title:{en:'Umbilical cord prolapse',es:'Prolapso del cordón umbilical'},
   sources:['Note: no ACOG/SMFM guideline on umbilical cord prolapse exists; the RCOG guideline is the available guideline','Supplementary (international): RCOG Green-top Guideline No. 50, Umbilical Cord Prolapse (2014)'], // ND4
   html:sec('First actions (seconds)',['Call for help now: OB provider and the emergency cesarean team. Say “cord prolapse”. Note the time.',
     '<b>Stop oxytocin</b> if running.',
     'Elevate the presenting part off the cord with two fingers / a gloved hand in the vagina and keep it there until delivery (or continuous upward suprapubic pressure once the presenting part is above the brim). Avoid excessive displacement.',
     'Position: knee–chest, or left lateral with head down and a pillow under the left hip.',
     'Minimal handling of cord loops outside the vagina (vasospasm). Do not try to replace the cord.',
     'Confirm FHR now; keep your hand in during transfer to the OR.'])+
    sec('While preparing for birth',['Continuous EFM; IV access; prepare for immediate birth (cesarean unless the provider judges vaginal birth imminent and quicker).',
     'If birth will be delayed (e.g., transfer): bladder filling — Foley catheter, instill 500–750 mL saline, clamp. EMPTY the bladder again just before any delivery attempt.',
     'Tocolysis may be considered by the provider for persistent FHR abnormalities while preparing for cesarean: agent and dose per CSM pharmacy/order set.',
     'None of these measures may delay birth.'])},
  'NC-ANAPH':{title:{en:'Anaphylaxis in pregnancy / postpartum',es:'Anafilaxia en el embarazo o posparto'},
   sources:['House card: SYS-01 (maternal critical illness / cardiac arrest)','Golden DBK et al. Anaphylaxis: A 2023 practice parameter update (AAAAI/ACAAI Joint Task Force on Practice Parameters). Ann Allergy Asthma Immunol 2024','Jeejeebhoy FM et al. Cardiac Arrest in Pregnancy: A Scientific Statement From the American Heart Association. Circulation 2015;132:1747–1773','Supplementary (international): ASCIA Guidelines: Acute Management of Anaphylaxis in Pregnancy (Australasian Society of Clinical Immunology and Allergy)','Supplementary (international): Dribin TE et al. Anaphylaxis definition, overview, and clinical support tool: 2024 consensus report — a GA2LEN project. J Allergy Clin Immunol 2025'], // ND4
   html:sec('First actions',['Stop the suspected trigger (infusion, antibiotic, latex). Call for help: rapid response/code and the OB provider.',
     '<b>Epinephrine IM FIRST. Epinephrine 1 mg/mL: give 0.5 mg = 0.5 mL IM, anterolateral mid-thigh; repeat every 5–15 min if no improvement. Do not use the 0.1 mg/mL (IV/code) syringe for IM.</b> <span class="nf-provtag">Doses to be checked against the CSM pharmacy build.</span> Do not withhold or delay epinephrine because of pregnancy.', // ND3 (house approved)
     'Airway and breathing: high-flow oxygen; prepare for airway support.',
     'Position: lie flat with legs raised if hypotensive (left lateral tilt if ≥20 wk); sitting if short of breath. Do not let her stand or walk.'])+
    sec('Then',['IV access; rapid isotonic fluid bolus if hypotensive — volume per order set.','Continuous maternal vitals and SpO2; continuous EFM if ≥20 wk once the mother is being resuscitated.',
     'Antihistamines and steroids are adjuncts only and never replace epinephrine.','Refractory hypotension or airway compromise: escalate per code team (anesthesia/ICU).',
     '<b>Cardiac arrest: start CPR with manual left uterine displacement — open SYS-01.</b>','Observe for biphasic reaction per provider.'])},
  'NC-BIRTH':{title:{en:'Imminent / precipitous birth',es:'Parto inminente o precipitado'},
   sources:['House card: FD-LND-06 (shoulder dystocia), FD-PP-01 (postpartum hemorrhage)','App FORMULARY (oxytocin) — already approved in this app','ACOG Committee Opinion No. 814, Delayed Umbilical Cord Clamping After Birth (2020)','Aziz K et al. Part 5: Neonatal Resuscitation. 2020 American Heart Association Guidelines for CPR and ECC (with AAP). Circulation 2020;142(suppl 2):S524–S550'], // ND4
   html:sec('First actions',['Do not leave her. Call for help: OB provider, a delivery nurse, and the neonatal/NRP team. Open the delivery (precip) kit; turn on the radiant warmer; note the time.',
     'Gloves; position of comfort (semi-recumbent or side-lying). Warm blankets/towels ready.',
     'Controlled delivery: support the perineum and gently control the head; do not pull. Check for a nuchal cord — slip it over the head if loose.',
     'If the shoulders do not deliver with gentle downward guidance: shoulder dystocia — call for help and open the shoulder dystocia algorithm (FD-LND-06).'])+
    sec('Baby',['Dry, warm, stimulate; assess breathing and tone. Skin-to-skin if vigorous.','Apneic, gasping, or HR &lt;100 after initial steps: start positive-pressure ventilation within 60 seconds of birth and call the NRP team (AHA/AAP 2020). Open the newborn emergency card.',
     'Record the time of birth. Vigorous baby: delay cord clamping 30–60 s (ACOG CO 814), then clamp and cut per unit policy.',
     'Confirm you are hearing the baby/maternal pulse, not each other’s.'])+
    sec('Mother',['After the baby is born (and a second baby is excluded): oxytocin per CSM order set (FORMULARY lists 10 U IM).','Watch for postpartum hemorrhage: quantify blood loss; open the PPH algorithm (FD-PP-01) if bleeding is heavy.',
     'Do not pull on the cord to deliver the placenta; await the provider or follow unit policy.'])},
  'NC-ECL':{title:{en:'Eclampsia / seizure — magnesium first',es:'Eclampsia o convulsión — primero magnesio'},
   sources:['House card: FD-ANT-04 / ANT-04 (severe hypertension)','App FORMULARY (magnesium, calcium gluconate, antihypertensive ladders) — already approved in this app','ACOG Practice Bulletin No. 222, Gestational Hypertension and Preeclampsia (2020)','ACOG Committee Opinion No. 767, Emergent Therapy for Acute-Onset, Severe Hypertension During Pregnancy and the Postpartum Period (2019)'], // ND4
   html:sec('During the seizure',['Call for help: OB provider, anesthesia, rapid response. Do not leave her. Note the time.','Protect from injury; turn her on her side (left lateral). Do not restrain her and put nothing in her mouth. Suction and oxygen ready.'])+
    sec('Immediately after',['Airway, breathing, SpO2; oxygen as needed; left lateral; IV access.','<b>Check point-of-care glucose</b> (hypoglycemia mimics eclampsia).',
     'Seizure &gt;5 min or recurrent despite magnesium: anesthesia now for airway/benzodiazepine per provider.',
     '<b>Magnesium sulfate (FORMULARY): 4–6 g IV load over 20–30 min, then 1–2 g/h. If no IV: 5 g IM in each buttock (10 g).</b> Continue 24 h after birth / last seizure. Recurrent seizure on magnesium: additional dose per provider/order set. Check every dose against the CSM pharmacy build.',
     'Magnesium toxicity (loss of reflexes, respiratory depression): stop the infusion; calcium gluconate 1 g IV over 3 min (FORMULARY). Monitor reflexes, respiratory rate, urine output; lower the infusion if oliguric (creatinine).',
     'Treat BP ≥160/110 within 30–60 min on one first-line ladder (FD-ANT-04 / FORMULARY).'])+
    sec('Then',['Continuous EFM if ≥20 wk once the mother is stabilized; fetal bradycardia during a seizure often recovers — stabilize the mother first. Delivery timing is the provider’s decision.',
     'Focal deficits, persistent confusion, or seizure without preeclampsia features: activate the stroke/neurology pathway; pregnancy does not exclude stroke-team evaluation.'])},
  'NC-APH':{title:{en:'Antepartum hemorrhage / abruption / previa (≥20 wk or status unknown)',es:'Hemorragia anteparto, desprendimiento o placenta previa (≥20 semanas o estado desconocido)'},
   sources:['House card: FD-PP-01 (postpartum hemorrhage), ANT-06 (antenatal steroids), ANT-07 (placenta accreta spectrum)','SMFM Consult Series #37: Diagnosis and management of vasa previa. Am J Obstet Gynecol 2015;213(5):615–619','ACOG Practice Bulletin No. 205, Vaginal Birth After Cesarean Delivery. Obstet Gynecol 2019;133:e110–e127','ACOG/SMFM Obstetric Care Consensus No. 7, Placenta Accreta Spectrum. Obstet Gynecol 2018;132:e259–e275','Supplementary (international): RCOG Green-top Guideline No. 63, Antepartum Haemorrhage (2011)','Supplementary (international): RCOG Green-top Guideline No. 27a, Placenta Praevia and Placenta Accreta: Diagnosis and Management (2018)','Supplementary (international): RCOG Green-top Guideline No. 27b, Vasa Praevia: Diagnosis and Management (2018)'], // ND4
   html:sec('First actions',['<b>≥20 wk antepartum: NO digital cervical (or rectal) exam until ultrasound has excluded previa.</b>',
     '<b>No uterotonics and no fundal massage before delivery.</b>',
     'Continuous EFM, left lateral, 2 large-bore IVs, type &amp; crossmatch, OB at bedside now. Activate the obstetric hemorrhage response if bleeding is heavy or she is unstable.',
     'Quantify blood loss (weigh pads); CBC, coagulation studies and fibrinogen per order set.'])+
    sec('Think abruption',['Pain, a hard or tender uterus, frequent contractions, FHR changes, or shock out of proportion to visible bleeding (bleeding can be concealed): provider now.',
     'Painless bleeding at ROM with sudden FHR deterioration: think <b>vasa previa</b> — emergency cesarean team now.',
     'Prior cesarean with sudden pain, loss of station or FHR abnormality: think <b>uterine rupture</b>.'])+
    sec('Then (provider)',['Ultrasound for placental site if not already known.','Rh status: anti-D if Rh-negative per protocol; consider Kleihauer-Betke.',
     'Antenatal steroids if preterm birth is likely (ANT-06). Prior cesarean with low/anterior placenta: think accreta (ANT-07).','Maternal stability comes first; delivery timing and route are the provider’s decision.'])},
  'NC-SI':{title:{en:'Suicide / self-harm risk',es:'Riesgo de suicidio o autolesión'},
   sources:['App red-flag text for harm_intent / intrusive thoughts — already approved in this app','ACOG Clinical Practice Guideline No. 4, Screening and Diagnosis of Mental Health Conditions During Pregnancy and Postpartum (2023)','ACOG Clinical Practice Guideline No. 5, Treatment and Management of Mental Health Conditions During Pregnancy and Postpartum (2023)','NIMH Ask Suicide-Screening Questions (ASQ) Toolkit'], // ND4
   html:sec('Now',['Keep her in sight: constant observation by a capable person for any plan, intent, means, recent attempt or uncertain intent. She does not leave before assessment.',
     'Remove means from the room per policy (sharps, ligatures, medicines). Search belongings for means per policy. Ask about firearm access.',
     'If she tries to leave while at imminent or uncertain risk: do not let her leave alone; call the provider and security per CSM policy.',
     'Infant safety: she is not alone caring for the baby while risk is high or uncertain.',
     'Call the OB provider and behavioral health now for a risk assessment (intent, plan, means, recency, safety) with a validated tool (ASQ or C-SSRS).'])+
    sec('How',['Nonpunitive, nonjudgmental wording: these thoughts are common and treatable. No reflex police involvement or punitive assumptions.',
     'Non-English: professional interpreter only — never family or partner.','Passive thoughts with plan and intent denied: still URGENT assessment during this visit (app policy).',
     'Document the safety plan, means/firearm counseling and follow-up. Resource for after the visit: 988 Suicide &amp; Crisis Lifeline.'])},
  'NC-PSY':{title:{en:'Postpartum psychosis',es:'Psicosis posparto'},
   sources:['App red-flag text for psychosis — already approved in this app','ACOG Clinical Practice Guideline No. 5, Treatment and Management of Mental Health Conditions During Pregnancy and Postpartum (2023)'], // ND4
   html:sec('Psychiatric emergency',['Continuous 1:1 observation by a capable person. Never leave her alone, and never alone with the infant.',
     'Call the OB provider and request urgent psychiatric evaluation now; psychiatric hospitalization is generally indicated (risk of suicide and infanticide).',
     'Assess risk of harm to self and to the infant (open the suicide-risk card).',
     'Calm, low-stimulation room; remove means from the room per policy.'])+
    sec('Also',['Nurse now: vitals, point-of-care glucose, SpO2; note recent sleep, substances and medicines.','The provider evaluates for medical causes of acute confusion or psychosis.','Medicines while awaiting psychiatry: per provider/CSM order set (no doses on this card).',
     'No reflex police involvement or punitive separation; involve support persons she trusts.'])},
  'NC-IPV':{title:{en:'Intimate partner violence / safety planning',es:'Violencia de pareja / plan de seguridad'},
   sources:['App: Tex. Fam. Code §91.003 (family-violence information notice); Tex. Fam. Code §261.101 (child abuse report); Tex. Hum. Res. Code ch. 48 — already cited in this app','ACOG Committee Opinion No. 518, Intimate Partner Violence (2012)','National Domestic Violence Hotline 1-800-799-7233'], // ND4
   html:sec('Screen privately',['Ask alone, without the partner, family or friends present (e.g., during a urine sample or exam). Professional interpreter only — never family.',
     'Frame it as routine: “We ask everyone.” Explain what you must report before she discloses.',
     'Ask: Is the person who hurt you here now? Are you safe to go home tonight? Has this person ever choked/strangled you, threatened to kill you, or used or had access to a gun?'])+
    sec('If any answer is yes, she is unsafe, or you cannot separate her',['IMMEDIATE: social work / advocate now and a safety plan before she leaves. Security if anyone is in danger. Do not confront the partner.',
     'Strangulation ever: medical evaluation even without visible injury — voice change, trouble swallowing, neck pain, petechiae or LOC need provider imaging decision.',
     'Document injuries with body map/photos with her consent.','Sexual assault: SANE / forensic examination.',
     'Give resources privately (National Domestic Violence Hotline 1-800-799-7233); she can save numbers under another name.'])+
    sec('Reporting (Texas; confirm with CSM legal/social work)',['Report suspected abuse of a child (Tex. Fam. Code §261.101) or of an elderly or disabled adult (Tex. Hum. Res. Code ch. 48).',
     'Provide the family-violence information notice (Tex. Fam. Code §91.003). Competent-adult IPV is not otherwise mandatory to report.','Document her words, injuries and the safety plan.'])},
 };
 // NB4 generic lines (both languages; ES provisional, NB14).
 const GENERIC={en:['Stay with the patient. Call the OB provider now and activate rapid response / the matching code.','ABCs, O2 to SpO2 ≥95%, left lateral if ≥20 wk, IV access, continuous vitals.','EFM if ≥20 wk.'],
  es:['Quédese con la paciente. Llame ya al proveedor obstétrico y active la respuesta rápida o el código correspondiente.','ABC, oxígeno hasta SpO2 ≥95 %, decúbito lateral izquierdo si ≥20 semanas, acceso IV, signos vitales continuos.','Monitoreo fetal electrónico si ≥20 semanas.']};
 const ACTION={
  'EA-GENERIC':{title:{en:'Emergency action card',es:'Tarjeta de acción de emergencia'},lines:{en:[],es:[]}},
  'EA-STROKE':{title:{en:'Emergency action card: possible stroke',es:'Tarjeta de acción de emergencia: posible derrame cerebral'},
   lines:{en:['Activate the stroke alert; record the last-known-well time; check glucose.','Treat BP ≥160/110 (FD-ANT-04).','Pregnancy does not exclude stroke-team evaluation.','Nothing by mouth until swallow screen.'],
    es:['Active la alerta de derrame cerebral (ictus); anote la hora en que se le vio bien por última vez; mida la glucosa.','Trate la PA ≥160/110 (FD-ANT-04).','El embarazo no excluye la evaluación por el equipo de ictus.','Nada por la boca hasta la prueba de deglución.']}},
  'EA-TRAUMA':{title:{en:'Emergency action card: trauma in pregnancy',es:'Tarjeta de acción de emergencia: trauma en el embarazo'},
   lines:{en:['Trauma team activation per hospital criteria; left lateral; FAST/imaging as indicated.','≥20 wk: continuous EFM for at least 4 hours; Rh type, anti-D if Rh-negative; consider Kleihauer-Betke.','Ask privately about violence (open the IPV card).'],
    es:['Active al equipo de trauma según los criterios del hospital; decúbito lateral izquierdo; FAST o imágenes según indicación.','≥20 semanas: monitoreo fetal continuo por al menos 4 horas; tipo Rh, anti-D si es Rh negativo; considere Kleihauer-Betke.','Pregunte en privado sobre violencia (abra la tarjeta de violencia de pareja).']}},
  'EA-NEO':{title:{en:'Emergency action card: newborn not breathing',es:'Tarjeta de acción de emergencia: recién nacido que no respira'},
   lines:{en:['Call the neonatal resuscitation / NRP team now.','Keep warm; dry, stimulate. <32 wk: plastic wrap.','PPV if apneic, gasping or HR <100: start within 60 s of birth, 40–60 breaths/min.','Check HR by stethoscope/ECG — HR is the key sign.','HR <60 after 30 s of effective ventilation: chest compressions 3:1, 100% O2 (NRP team).'],
    es:['Llame ya al equipo de reanimación neonatal (NRP).','Mantenga al bebé caliente; seque y estimule. <32 semanas: envoltura de plástico.','Ventilación con presión positiva si está en apnea, jadeando o FC <100: iníciela en los primeros 60 s tras el nacimiento, 40–60 respiraciones/min.','Verifique la FC con estetoscopio o ECG — la FC es el signo clave.','FC <60 tras 30 s de ventilación eficaz: compresiones torácicas 3:1, oxígeno al 100 % (equipo NRP).']}},
  // ND6 (Doc re-verdict, verbatim): bradycardia interim action card; no doses (calcium gluconate per FORMULARY).
  'EA-BRADY':{title:{en:'Emergency action card: maternal bradycardia',es:'Tarjeta de acción de emergencia: bradicardia materna'},
   lines:{en:['Continuous ECG monitor.','Repeat manual pulse.','If on magnesium: check reflexes/RR — toxicity → stop infusion, calcium gluconate per FORMULARY.','Symptomatic: code team/ACLS per provider.'],
    es:['Monitor de ECG continuo.','Repita el pulso manual.','Si recibe magnesio: revise reflejos y frecuencia respiratoria — toxicidad → suspenda la infusión, gluconato de calcio según el FORMULARIO.','Con síntomas: equipo de código / ACLS según el proveedor.']}},
  'EA-ABD':{title:{en:'Emergency action card: acute abdomen ≥20 wk',es:'Tarjeta de acción de emergencia: abdomen agudo ≥20 semanas'},
   lines:{en:['Continuous EFM.','Consider abruption, uterine rupture (prior cesarean), appendicitis, preeclampsia/HELLP.','OB at bedside; labs per order set. Open the antepartum hemorrhage card.'],
    es:['Monitoreo fetal continuo.','Considere desprendimiento de placenta, rotura uterina (cesárea previa), apendicitis, preeclampsia o HELLP.','Obstetra a la cabecera; laboratorios según el protocolo. Abra la tarjeta de hemorragia anteparto.']}},
 };
 function actionLines(id,lang){const a=ACTION[id];if(!a)return null;const l=lang==='es'?'es':'en';return [...GENERIC[l],...a.lines[l]];}
 const api=Object.freeze({CARDS,ACTION,GENERIC,PROV_EN,PROV_ES,actionLines,ids:()=>[...Object.keys(CARDS),...Object.keys(ACTION)]});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NurseCards=api;
})(typeof self!=='undefined'?self:this);
