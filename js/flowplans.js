/* Verbatim plain-text reference extracted from the EXISTING published diagram sources.
 * No new clinical recommendations; no held 2026-11-09 card changes.
 * Source hashes must match CONTENT diagram.sha. Whitespace/HTML typography only normalized. */
(function(root){
  "use strict";
  const data = {
  "FD-SYS-03": {
    "source": "SYS-03_MATERNAL_SEPSIS_FLOW_2026-10-25.pdf",
    "sourceSHA256": "4b875966b2a93e0d6e2915c06b2bebc695431800d1077f947c8000edc18493ef",
    "blocks": [
      {
        "type": "li",
        "text": "HOW TO READ THIS CHART: start at Step 0. Hexagons are questions; shaded rectangles are actions. Fever is not required. No single screening tool alone (SMFM); qSOFA missed half of maternal sepsis (sensitivity 50%) and SIRS over-calls in pregnancy (specificity 63%) (CMQCC)."
      },
      {
        "type": "h",
        "text": "STEP 0: SUSPECTED INFECTION"
      },
      {
        "type": "li",
        "text": "Pregnant, postpartum, or after abortion; any unit including ED. Fever is not required (SMFM). RN runs the screen."
      },
      {
        "type": "h",
        "text": "STEP 1: CMQCC SCREEN: 2 OR MORE?"
      },
      {
        "type": "li",
        "text": "Temp <36 or ≥38 °C; HR >110 sustained 15 min; RR >24 sustained 15 min; WBC >15,000 or <4,000/mm^3 or >10% bands. Recheck an abnormal value with full VS and SpO2 in 15 min. MAP <65 with suspected infection: sepsis protocol now."
      },
      {
        "type": "h",
        "text": "SCREEN NEGATIVE · WHITE"
      },
      {
        "type": "li",
        "text": "Keep screening through labor and until discharge; VS between contractions. Infection still suspected (eg, CVA tenderness with low-grade temp; prolonged ROM with maternal or fetal tachycardia): do Step 2 labs anyway (CMQCC)."
      },
      {
        "type": "h",
        "text": "SCREEN POSITIVE = TIME ZERO · 1-HOUR BUNDLE"
      },
      {
        "type": "li",
        "text": "RN notifies the OBHG hospitalist and charge RN now; hospitalist to the bedside. Within 1 h: lactate; blood cultures x2 before antibiotics if no delay; broad-spectrum antibiotics by source (strips A1, A2); 1 to 2 L balanced crystalloid if hypotension or hypoperfusion (strip B). Step 2 labs: CBC with bands, PT/INR, PTT, CMP with bilirubin and creatinine. Foley with urometer; SpO2; mental status."
      },
      {
        "type": "h",
        "text": "STEP 2: ANY ORGAN INJURY? (CMQCC)"
      },
      {
        "type": "li",
        "text": "New ventilation need or PaO2/FiO2 <300; platelets <100 x 10^9/L, INR >1.5, or PTT >60 s; bilirubin >2 mg/dL; after fluids SBP <85, MAP <65, or SBP fall >40 mm Hg; creatinine ≥1.2 mg/dL, doubled, or urine <0.5 mL/kg/h x2 h; agitated, confused, or unresponsive; lactate >2 mmol/L not in labor. One is enough."
      },
      {
        "type": "h",
        "text": "NO ORGAN INJURY · LIGHT GRAY"
      },
      {
        "type": "li",
        "text": "Still high risk: keep treating the infection, close supervision, reevaluate; any new criterion = Step 2 YES. In labor with elevated lactate only: at minimum close surveillance, consider more fluid, repeat lactate (lactate rises in normal labor)."
      },
      {
        "type": "h",
        "text": "STEP 3: SEPTIC SHOCK?"
      },
      {
        "type": "li",
        "text": "MAP <65 mm Hg sustained 15 min after fluid resuscitation (CMQCC), or a vasopressor needed to keep MAP 65 with lactate >2 mmol/L after adequate fluids (Sepsis-3, PB 211)?"
      },
      {
        "type": "h",
        "text": "SEPSIS CONFIRMED · MID GRAY"
      },
      {
        "type": "li",
        "text": "Fluids per strip B, reassessing after each bolus; repeat lactate; close surveillance and rapid response team per CSM; escalate as needed. Source control (Step 4). Worse at any reassessment: back to Step 3."
      },
      {
        "type": "h",
        "text": "SEPTIC SHOCK · ICU NOW (SYS-01)"
      },
      {
        "type": "li",
        "text": "Norepinephrine first line (SMFM); initial target MAP 65, not studied in pregnancy: individualize to perfusion (mentation, urine, lactate, fetal status). Vasopressin second line; dobutamine for myocardial dysfunction. Norepinephrine or epinephrine ≥0.25 mcg/kg/min for ≥4 h: hydrocortisone 200 mg/day (50 mg IV q6h). VTE prophylaxis; insulin if glucose >180 mg/dL. Adult ICU accepts her; transfer only if stable, never past an available OR or ICU."
      },
      {
        "type": "h",
        "text": "STEP 4: FIND AND CONTROL THE SOURCE"
      },
      {
        "type": "li",
        "text": "Identify or exclude an anatomic source fast; emergency source control when indicated (SMFM). Least invasive effective route (strip C)."
      },
      {
        "type": "h",
        "text": "STEP 5: STILL PREGNANT?"
      },
      {
        "type": "li",
        "text": "Stabilize her first; maternal resuscitation usually improves the FHR. Strip D."
      },
      {
        "type": "h",
        "text": "SURGERY OR TRANSFUSION NEEDED"
      },
      {
        "type": "li",
        "text": "OBHG hospitalist notifies the private attending. No routine call otherwise."
      },
      {
        "type": "h",
        "text": "A1 · ANTIBIOTICS BY SOURCE"
      },
      {
        "type": "li",
        "text": "IAI/chorio (LND-04 card; CO 712): ampicillin 2 g IV q6h + gentamicin 5 mg/kg IV q24h (or 2 mg/kg, then 1.5 mg/kg q8h); add clindamycin 900 mg or metronidazole 500 mg IV q8h for cesarean. Endometritis (CMQCC): clindamycin 900 mg IV q8h (or metronidazole 500 mg IV q8h) + gentamicin 5 mg/kg IV q24h + ampicillin 2 g IV q6h; or ampicillin-sulbactam 3 g IV q6h + gentamicin 5 mg/kg IV q24h. Pyelonephritis (CMQCC): ceftriaxone 2 g IV q24h or cefepime 2 g IV q12h; severe penicillin allergy: aztreonam 1 g IV q8h; MDRO risk: ertapenem 1 g IV q24h or meropenem 1 g IV q8h."
      },
      {
        "type": "h",
        "text": "A2 · ANTIBIOTICS (CONT.)"
      },
      {
        "type": "li",
        "text": "Septic abortion or retained products (CMQCC): cefoxitin 2 g IV q6h or cefotetan 2 g IV q12h + doxycycline 100 mg PO or IV q12h; or clindamycin 900 mg IV q8h + gentamicin 3 to 5 mg/kg IV daily. Septic abortion or periviable sepsis: alert house supervisor or CMO. Necrotizing wound (CMQCC): piperacillin-tazobactam 3.375 g IV q8h extended infusion (or 4.5 g q6h) + vancomycin per protocol + clindamycin 900 mg IV q8h; GAS or clostridia: penicillin G 4 million U IV q4h + clindamycin 900 mg IV q8h. Non-necrotizing wound (CSM house regimen): PO amoxicillin-clavulanate 875/125 mg BID x 7 days; IV ampicillin-sulbactam 3 g IV q6h, OR piperacillin-tazobactam 4.5 g IV q8h (confirm infusion schedule with CSM pharmacy). Unknown source or septic shock (CMQCC Table 9): piperacillin-tazobactam 3.375 g IV q8h extended (or 4.5 g q6h), or meropenem 1 g IV q8h if MDRO risk, plus vancomycin 15 to 20 mg/kg IV q8 to 12h (load 25 to 30 mg/kg if critically ill). Doses assume normal renal function."
      },
      {
        "type": "h",
        "text": "B · FLUIDS AND REASSESSMENT"
      },
      {
        "type": "li",
        "text": "Hypotension or suspected hypoperfusion: 1 to 2 L balanced crystalloid (LR, Plasma-Lyte) IV in the first 3 h (SMFM); septic shock may need a total of 30 mL/kg in the first 3 h: individualize. SMFM: 30 mL/kg \"may be overly aggressive in pregnancy\" (lower oncotic pressure, more pulmonary edema): extra caution in preeclampsia, cardiac disease, or pulmonary edema risk; measured aliquots (SYS-01). No starches or gelatin. Reassess after each bolus with dynamic measures (passive leg raise with uterine displacement, 250 to 500 mL bolus with cardiac output, POCUS); not fluid responsive or lungs wet: vasopressor. Lactate: repeat if >2 mmol/L (CMQCC order set: at 3 h); CMS also treats lactate ≥4 as shock (CMQCC App A); read with caution in labor. MAP and temp q30 min until lactate <2; urine hourly (CMQCC)."
      },
      {
        "type": "h",
        "text": "C · SOURCE CONTROL"
      },
      {
        "type": "li",
        "text": "Uterine source (IAI, infected retained tissue, septic abortion): prompt delivery or evacuation regardless of GA (SMFM); IAI alone is not a cesarean indication (LND-04). Retained products: ultrasound, D&C. Septic abortion or periviable sepsis: alert house supervisor or CMO. Wound: open and culture; deep or organ space: CT and ultrasound; necrotizing: early surgical debridement, hysterectomy if myometrial necrosis. Pyelonephritis/obstruction: renal ultrasound antepartum, CT with contrast postpartum; drainable abscess: IR; obstructed infected kidney: urology decompresses (CSM). Pelvic abscess: ultrasound or CT; IR drainage. Percutaneous over open surgery, except necrotizing infection (SMFM)."
      },
      {
        "type": "h",
        "text": "D · FETUS AND DELIVERY"
      },
      {
        "type": "li",
        "text": "Sepsis alone is not an immediate indication for delivery, except IAI (SMFM). Deliver for the usual obstetric indications; cesarean is usually reserved for obstetric indications after she is stabilized (CMQCC). Fetal monitoring after maternal stabilization if viable; at the limit of viability, include her or her family's preferences. Septic abortion or periviable sepsis: alert house supervisor or CMO. Antenatal steroids are not contraindicated. Strongly consider avoiding neuraxial in sepsis or shock; anesthesia decides (CMQCC)."
      },
      {
        "type": "h",
        "text": "E · NOTIFY AND ESCALATE"
      },
      {
        "type": "li",
        "text": "RN: positive screen to OBHG hospitalist and charge RN. Hospitalist: critical care or ICU (SYS-01), anesthesia, neonatology; MFM via the local MFM call schedule posted in the call lounge; ID or surgery as needed. Private attending: only if surgery or transfusion is needed. Concern about the plan: charge RN, then nursing director, then OBHG Site Director. Septic abortion or periviable sepsis: alert house supervisor or CMO."
      },
      {
        "type": "li",
        "text": "Doses to be checked against CSM pharmacy build. GA = gestational age; IAI = intraamniotic infection; MDRO = multidrug-resistant organism; POCUS = point-of-care ultrasound. Decision support only, not unit policy. Cite: SMFM Consult Series #67, Maternal sepsis, Am J Obstet Gynecol 2023;229:B2-B19; CMQCC, Improving Diagnosis and Treatment of Maternal Sepsis (2020, errata 2022), Box 1, Tables 3, 5, 9, 10, 11; ACOG CO 712, Obstet Gynecol 2017;130:e95-e101; ACOG PB 211, Obstet Gynecol 2019;133:e303-19."
      }
    ]
  },
  "FD-ED-OB": {
    "source": "ED_TO_OB_PATHWAY_DECISION_TREE_2026-10-25.pdf",
    "sourceSHA256": "1cd746ab11977558741d382d9ab21f413549dcc78b8d930173b7d72a8b400265",
    "blocks": [
      {
        "type": "li",
        "text": "HOW TO READ THIS CHART: pick a branch, start at STEP 0, follow the arrows, and answer each yes/no question. Hexagons are questions; shaded rectangles are actions; follow any THEN arrow."
      },
      {
        "type": "h",
        "text": "PREGNANT PATIENT AT THE MAIN ED"
      },
      {
        "type": "li",
        "text": "Gestational age, then non-OB S&S, then delivery"
      },
      {
        "type": "li",
        "text": "STEP 0: START Pregnant patient arrives at Main ED. Triage per protocol."
      },
      {
        "type": "h",
        "text": "STEP 1: LESS THAN 20 WEEKS GESTATION?"
      },
      {
        "type": "h",
        "text": "MAIN ED · WHITE"
      },
      {
        "type": "li",
        "text": "Stays in the Main ED for evaluation • Consult OB as needed. • Consider US for fetal wellbeing. • Contact L&D if help is needed with fetal heart tones."
      },
      {
        "type": "h",
        "text": "STEP 2: ANY NON-OB S&S? (Non-OB list in band below)"
      },
      {
        "type": "h",
        "text": "MAIN ED · WHITE"
      },
      {
        "type": "li",
        "text": "Stays in the Main ED for evaluation and treatment Provider-to-provider consult between ED and OB for maternal/fetal evaluation."
      },
      {
        "type": "h",
        "text": "TO OBED · LIGHT GRAY"
      },
      {
        "type": "li",
        "text": "1. Contact the L&D charge RN 2. Once medically cleared, call L&D. 3. Transfer the patient to OBED."
      },
      {
        "type": "h",
        "text": "STEP 3: IS DELIVERY IMMINENT?"
      },
      {
        "type": "h",
        "text": "DELIVERY IMMINENT · DARK GRAY"
      },
      {
        "type": "li",
        "text": "Call L&D at 427-2606 The Neo/L&D team comes to the ED."
      },
      {
        "type": "h",
        "text": "TO OBED · LIGHT GRAY"
      },
      {
        "type": "li",
        "text": "Contact OBED RN or L&D charge RN to give report Then transfer the patient to OBED."
      },
      {
        "type": "h",
        "text": "POSTPARTUM: 6 WEEKS OR LESS"
      },
      {
        "type": "li",
        "text": "STEP 0P: START Patient arrives at the Main ED and is 6 weeks or less postpartum. Triage per protocol."
      },
      {
        "type": "h",
        "text": "STEP 1P: ANY NON-OB S&S? (Non-OB list in band below)"
      },
      {
        "type": "h",
        "text": "MAIN ED"
      },
      {
        "type": "li",
        "text": "Stays in the ED for evaluation Consult OB as needed."
      },
      {
        "type": "h",
        "text": "TO OBED"
      },
      {
        "type": "li",
        "text": "Contact OBED/L&D charge RN for report Then transfer the patient to OBED."
      },
      {
        "type": "li",
        "text": "Preeclampsia S&S apply from 20 weeks gestation through 6 weeks postpartum (criteria in band below). Listed with OB S&S. L&D: 427-2606"
      },
      {
        "type": "h",
        "text": "NON-OB S&S (YES at STEP 2 / 1P)"
      },
      {
        "type": "li",
        "text": "Any cardiac complaint(s) · SOB/respiratory infection · Trauma/non-OB injury · Suicide attempt · Communicable diseases · Sore throat/ear infections · GI symptoms · Stroke/Bell palsy"
      },
      {
        "type": "h",
        "text": "OB S&S"
      },
      {
        "type": "li",
        "text": "Decreased fetal movement · Vaginal bleeding · Contractions/abdominal cramping/constant pain · Leaking of fluid · Pelvic pressure · HTN/S&S of preeclampsia · Delivery complications"
      },
      {
        "type": "h",
        "text": "S&S OF PREECLAMPSIA (20 weeks to 6 weeks PP)"
      },
      {
        "type": "li",
        "text": "SBP 160 or higher and/or DBP 110 or higher, OR SBP 140 to 159 and/or DBP 90 to 109 WITH unremitting headache, visual disturbances, or RUQ/epigastric pain."
      },
      {
        "type": "h",
        "text": "ABBREVIATIONS"
      },
      {
        "type": "li",
        "text": "ED = emergency department; OBED = obstetric emergency department; L&D = labor and delivery; S&S = signs and symptoms; US = ultrasound; Neo = neonatal; PP = postpartum; HTN = hypertension; SOB = shortness of breath; RUQ = right upper quadrant."
      },
      {
        "type": "li",
        "text": "Decision support only, not unit policy. Source: CSM ED to OB Pathway Guideline (10/2026) + annotated paper copy; checked vs ED to OB Fast Pass (rev. 10/2026) and OB Triage ED/OBED guideline."
      }
    ]
  }
};
  if(typeof module!=="undefined"&&module.exports) module.exports=data; else root.FlowPlanText=data;
})(typeof self!=="undefined"?self:this);
