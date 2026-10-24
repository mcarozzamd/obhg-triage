/* OBHG Clinical Triage — deterministic, auditable triage engine.
 * Runs entirely in the browser (and in Node for tests). No network, no storage.
 * Every score comes from an explicit rule below; each rule carries a human-readable "why". */
(function (root) {
  'use strict';
  const R = (s, f) => new RegExp(s, f || 'i');

  // ---------- keyword / synonym lexicon ----------
  const KW = {
    headache: R('headache|\\bHA\\b|cephalgia'),
    visual: R('visual|vision|blurr|scotoma|seeing spots|photophobia'),
    ruq: R('\\bRUQ\\b|right upper quadrant|epigastri'),
    seizure: R('seiz|(?<!pre-?)\\beclamp|convuls|tonic.?clonic'),
    preeclampsia: R('pre-?eclamp|\\bPEC\\b|\\bpreE\\b|HELLP|gestational hypertension|\\bgHTN\\b|severe features|hypertensi|\\bHTN\\b|elevated (bp|blood pressure)|high (bp|blood pressure)'),
    hellp: R('HELLP|thrombocytopeni|low platelets|elevated (LFTs|liver enzymes|AST|ALT)'),
    bleeding: R('bleed|hemorrhag|\\bPPH\\b|\\bclots?\\b|soaking|\\bVB\\b|spotting|blood loss'),
    hemorrhage: R('hemorrhag|\\bPPH\\b|boggy|aton(y|ic)|soaking'),
    fever: R('fever|(?<!a)febrile|pyrexi'),
    chills: R('chill|rigor'),
    foulLochia: R('foul|malodor|purulent'),
    infection: R('infect|sepsis|septic|chorio|\\bIAI\\b|endometritis|pyelo|cellulitis|abscess|wound (infection|erythema|drainage)|mastitis'),
    sepsis: R('sepsis|septic'),
    iai: R('chorio|\\bIAI\\b|intra-?amniotic infection|triple I'),
    decels: R('decel|\\blates?\\b|variables|prolonged decel'),
    cat3: R('cat(egory)?\\.?\\s*(III|3|three)\\b|sinusoidal'),
    cat2: R('cat(egory)?\\.?\\s*(II|2|two)\\b'),
    fhr: R('\\bFHR\\b|fetal heart|fetal HR\\b|tracing|variability|fetal tachy|fetal brady|NRFHT|non-?reassuring|\\bEFM\\b'),
    rom: R('\\bS?ROM\\b|\\bP?PROM\\b|leak(ing)?( of)? (clear )?fluid|gush|rupture of (the )?membranes|water broke|pooling|\\bfern|nitrazine|amnisure'),
    contractions: R('contraction|\\bctx\\b|cramp|tighten|labor pain|uterine activity|painful uterine'),
    pretermWord: R('preterm|premature'),
    pretermLabor: R('preterm labor|\\bPTL\\b'),
    cervixChange: R('cervical change|dilated|\\b\\d\\s*cm\\b|effaced'),
    pelvicPain: R('pelvic pain|lower abdominal pain|\\bLLQ\\b|\\bRLQ\\b|adnexal (pain|tender)|abdominal pain|lower quadrant pain|pelvic cramp'),
    sob: R('short(ness)? of breath|\\bSOB\\b|dyspnea|chest pain|pleuritic|hypoxi|pulmonary edema|tachypnea'),
    leg: R('leg swelling|calf (pain|swelling|tender)|(leg|lower extremity) (swelling|edema|pain)|\\bDVT\\b|swollen (left |right )?(leg|calf)'),
    pe: R('\\bPE\\b|pulmonary embol'),
    vte: R('\\bVTE\\b|enoxaparin|lovenox|heparin|thromboprophylaxis|thrombosis|anticoag|\\bSCDs?\\b|caprini'),
    nausea: R('nausea|vomit|emesis|hyperemesis|\\bNVP\\b|\\bN\\/V\\b|keep (anything|food|liquids|fluids) down|ketonuria|ketones|\\bHG\\b'),
    induction: R('induc|ripen|cytotec|misoprostol|foley bulb|cervidil|dinoprostone|bishop|\\bIOL\\b|post-?dates|postterm|post-term'),
    arrest: R('arrest of (dilation|descent)|failure to (progress|descend)|\\bFTP\\b|protract|no (cervical )?change (for|in) \\d|stalled|prolonged (second|2nd) stage|pushing (for )?\\d|second stage'),
    gbs: R('\\bGBS\\b|group b strep'),
    shoulder: R('shoulder dystocia|\\bshoulder dysto|turtle sign|turtling|shoulders? (stuck|impacted|not delivering|won.?t deliver|will not deliver)|anterior shoulder (stuck|impacted)'),
    placentaStuck: R('placenta (won.?t|will not|would not|wouldn.?t|does not|doesn.?t|did not|didn.?t|not|unable to) (separate|deliver|come out|detach)|placenta not separating|adherent placenta|morbidly adherent|no (cleavage|separation) plane|placenta (is )?stuck'),
    ovb: R('vacuum|forceps|operative vaginal|\\bOVD\\b|\\bOVB\\b|kiwi|\\bOASIS\\b|(3rd|4th|third|fourth)[- ]degree'),
    tolac: R('TOLAC|VBAC|trial of labor after'),
    priorCS: R('(prior|previous|hx( of)?|history of|h\\/o|repeat)\\s*(\\w+\\s){0,2}(c-?section|cesarean|\\bCS\\b|C\\/S|LTCS|classical)|\\bx\\s?\\d\\s*(c-?section|cesarean)|\\bTOLAC\\b|\\bVBAC\\b'),
    cerclage: R('cerclage|short cervix|cervical (insufficiency|incompetence|length)|\\bCL\\s*\\d|funnel|prolapsing membranes|hourglass'),
    diabetes: R('diabet|\\bGDM\\b|\\bA[12]GDM\\b|insulin|glucose|hyperglyc|\\bDKA\\b'),
    steroids: R('betamethasone|celestone|steroids|\\bACS\\b|antenatal cortico|dexamethasone'),
    pas: R('previa|accreta|increta|percreta|\\bPAS\\b'),
    dfm: R('decreased fetal movement|\\bDFM\\b|less fetal movement|baby (not|isn\'t) moving|reduced fetal movement|\\bNST\\b|\\bBPP\\b|surveillance'),
    timing: R('when to deliver|delivery timing|timing of delivery|\\bFGR\\b|\\bIUGR\\b|oligohydramnios|\\boligo\\b|polyhydramnios|twins|di\\/di|mo\\/di|mo\\/mo|cholestasis|\\bICP\\b|bile acids|vasa previa|\\bHIV\\b|viral load|chronic hypertension|\\bcHTN\\b'),
    ectopic: R('ectopic|\\bPUL\\b|pregnancy of unknown location|adnexal mass with (positive|\\+) hcg|methotrexate|\\bMTX\\b'),
    epl: R('miscarriage|\\bSAB\\b|missed ab|abortion|no (fetal )?(heartbeat|cardiac activity|FHT)|\\bEPL\\b|early pregnancy loss|passing tissue|products of conception|\\bPOC\\b|anembryonic|blighted|\\bCRL\\b|empty sac|nonviable'),
    iup: R('\\bIUP\\b|intrauterine pregnancy|yolk sac|gestational sac (in|within) the uterus'),
    anemia: R('anemi|\\bHg?b\\s*(of|is)?\\s*\\d|hemoglobin|iron|ferritin|transfus'),
    critical: R('\\bICU\\b|critical care|cardiac arrest|\\bcode\\b|unresponsive|intubat|\\bshock\\b|pressors|norepinephrine|perimortem|\\bACLS\\b|\\bCPR\\b|\\bAFE\\b|amniotic fluid embol'),
    arrestCard: R('cardiac arrest|\\bcode blue\\b|pulseless|\\bCPR\\b|perimortem'),
    aub: R('\\bAUB\\b|menorrhagia|heavy (menstrual|menses|period)|abnormal uterine bleeding|fibroid|postmenopausal bleeding|\\bPMB\\b'),
    pid: R('\\bPID\\b|\\bTOA\\b|tubo-?ovarian|pelvic inflammatory|cervical motion tenderness|\\bCMT\\b|pelvic abscess|chandelier'),
    hemCyst: R('hemorrhagic (ovarian )?cyst|ruptured (ovarian |corpus luteum |hemorrhagic |functional )?cyst|corpus luteum (cyst|rupture)|cyst rupture'),
    suddenPain: R('sudden(?: onset)?(?: of)?(?: severe)? (?:RLQ|LLQ|right lower quadrant|left lower quadrant|unilateral|pelvic|lower abdominal|adnexal|right|left)'),
    heavyBleed: R('heavy (vaginal )?bleed|soaking|pads? (an |per |every )?hour|hourly|passing (large )?clots|\\bclots\\b|gushing blood'),
    torsion: R('torsion|twist|sudden (onset )?(of )?(severe )?(unilateral |right |left )?(pelvic|lower abdominal|adnexal) pain'),
    mass: R('adnexal mass|ovarian (cyst|mass)|\\bcyst\\b|dermoid|endometrioma|complex mass|CA-?125'),
    pyelo: R('pyelo|\\bCVA(T)?\\b|costovertebral|flank pain|kidney stone|renal colic|nephrolith|ureteral stone|hydronephrosis|\\bUTI\\b|dysuria'),
    iud: R('\\bIUD\\b|\\bIUC\\b|mirena|paragard|kyleena|liletta|strings|nexplanon|implant'),
    cpp: R('chronic pelvic pain|pelvic pain (for|x|over) \\d+ (months|years)|\\bCPP\\b|endometriosis|dyspareunia|\\b(6|six|\\d{2}) months of pelvic pain'),
    posthyst: R('hysterectomy|\\bTLH\\b|\\bTAH\\b|\\bTVH\\b|vaginal cuff|\\bcuff\\b|evisceration'),
    molar: R('molar|hydatidiform|\\bGTD\\b|\\bGTN\\b|snowstorm|theca lutein'),
    ed: R('\\bED\\b|emergency (department|room)|\\bER\\b|main ED'),
    trauma: R('\\bMVA\\b|\\bMVC\\b|motor vehicle|trauma|\\bfall\\b|fell|assault|chest pain|overdose|stroke|syncope'),
    imminent: R('crowning|delivery imminent|imminent delivery|precipitous|urge to push'),
    cordProlapse: R('cord prolapse|prolapsed cord'),
    abruption: R('abruption|abruptio'),
    uterineRupture: R('uterine rupture|ruptured uterus|rupture of the uterus|uterine (scar )?dehiscence|scar dehiscence|loss of (fetal )?station'),
    timingWords: R('when to deliver|delivery timing|timing'),
    labor: R('in (active |early )?labor|laboring|(?<!preterm |pre-term |false |prodromal )\\blabor\\b(?!\\s*(and|&)\\s*delivery| (pain|check))|intrapartum|\\bpushing\\b|complete dilation|fully dilated|second stage|epidural|\\b\\d+\\s*cm(?! (?:ovarian|adnexal|complex|simple|cystic|solid|cyst|mass|fibroid|TOA|ectopic|lesion|dermoid|endometrioma|right|left|pelvic|hemorrhagic))( dilated)?\\b|dilated (to )?\\d|\\d\\/\\d{2,3}\\/[-+]?\\d|\\bon pitocin\\b|\\bpit\\b|oxytocin augmentation|\\bIUPC\\b'),
    pregnantWord: R('pregnan|gestation|\\bIUP\\b|gravid|\\bG\\d+\\s*P\\d|\\bEGA\\b|\\bGA\\b|trimester|weeks? (pregnant|gestation)|\\bwga\\b'),
    notPregnant: R('not pregnant|non-?pregnant|negative (serum |urine )?(b-?hcg|hcg|upt|pregnancy test)|(hcg|upt|pregnancy test) (is )?(negative|neg)\\b|postmenopausal|\\bhcg\\s*-'),
    hcgPos: R('(\\+|positive|pos)\\s*(serum |urine |quant(itative)? )?(b-?hcg|β-?hcg|bhcg|hcg|upt|pregnancy test|preg test|\\bpt\\b)|(b-?hcg|bhcg|hcg|upt|pregnancy test)\\s*(is\\s*)?(\\+|positive|pos\\b)'),
    ams: R('confus|altered mental|\\bAMS\\b|mental status change|disorient|obtunded|letharg|somnolen|delirium|not making sense|hard to arouse'),
    oliguria: R('oliguri|anuri|low urine output|\\bUOP\\s*(<|less than|of)?\\s*\\d|decreased urine output|not making urine'),
    shock: R('\\bshock\\b'),
    unstable: R('unstable|hypotensi|syncop|peritoneal signs|rebound|guarding|hemoperitoneum|free fluid|lightheaded|pale|diaphoretic'),
  };

  function num(s) { return parseFloat(String(s).replace(/,/g, '')); }

  // ---------- parser ----------
  function parse(input) {
    const t = ' ' + String(input || '').replace(/\s+/g, ' ') + ' ';
    const f = { raw: input, kw: {} };
    // voice-to-text gravida (Michael, 18 Oct 2026): 'GTP won', 'G one', 'gravida one' → G1
    const gv = t.match(/\b(?:GTP|G\.?|gee|gravida)\s*(won|one|two|three|four|five|\d{1,2})\b(?!\s*(?:P\s*\d|para))/i);
    if (gv && !/\bG\s?\d{1,2}\s?P\s?\d/i.test(t)) { const w = { won: 1, one: 1, two: 2, three: 3, four: 4, five: 5 }; f.G = w[gv[1].toLowerCase()] || +gv[1]; f.gVoice = gv[0].trim(); }
    for (const k in KW) if (KW[k].test(t)) f.kw[k] = true;

    // simple negation for IUP ("no IUP", "without intrauterine pregnancy", "empty uterus")
    if (/\b(no|without|absent|not seen|no definite)\s+(definite\s+|visible\s+)?(IUP|intrauterine)|empty uterus/i.test(t)) { f.noIUP = true; delete f.kw.iup; }
    // negated bleeding / contractions ('no bleeding', 'denies contractions', 'without VB') do not count
    for (const [k, w] of [['bleeding', '(?:vaginal )?(?:bleeding|VB|spotting)'], ['contractions', '(?:contractions|ctx|cramping)']]) {
      if (f.kw[k] && !KW[k].test(t.replace(new RegExp('\\b(?:no|denies|without|not having|absent)\\s+(?:any\\s+)?' + w + '\\b', 'gi'), ' '))) delete f.kw[k];
    }
    // negated fever ('afebrile', 'no fever', 'denies fevers') does not count
    if (f.kw.fever && !KW.fever.test(t.replace(/\b(no|denies|without|neg(?:ative)? for)\s+(fevers?|febrile)\b|\bafebrile\b/gi, ' '))) delete f.kw.fever;
    let m;
    if ((m = t.match(/\b(\d{1,2})\s*(?:yo|y\/o|y\.o\.?|yr?s?[- ]?old|year[- ]old|years? old|yof|f\b)/i))) f.age = +m[1];
    if ((m = t.match(/\bG\s?(\d{1,2})\s?P\s?(\d{1,2})(?:[-\s]?(\d)(\d)(\d)(\d))?/i))) {
      f.G = +m[1]; f.P = +m[2];
      if (m[3] !== undefined) f.TPAL = [m[3], m[4], m[5], m[6]].join('-');
    } else if (/primigravida|nullip/i.test(t)) { f.G = f.G || 1; f.P = 0; }

    // postpartum / post-op status
    const ppRe = /(?:\b(\d{1,2})\s*(hours?|hrs?|h|days?|d|weeks?|wks?|w)\s*(?:postpartum|post-partum|pp\b|after (?:delivery|birth|c-?section|cesarean)|s\/p (?:delivery|svd|nsvd|c-?section|cesarean))|\b(?:PPD|POD|PP day|postpartum day|post-op day)\s*#?\s*(\d{1,2}))/i;
    if ((m = t.match(ppRe))) {
      f.postpartum = true;
      if (m[1]) {
        const u = m[2].toLowerCase()[0];
        f.ppDays = u === 'h' ? 0 : u === 'd' ? +m[1] : +m[1] * 7;
        f.ppText = m[1] + ' ' + m[2];
      } else { f.ppDays = +m[3]; f.ppText = 'day ' + m[3]; }
    }
    if (/postpartum|post-partum|\bPPH\b|\bpp\b|after (delivery|birth)|delivered|s\/p (svd|nsvd|vaginal delivery|delivery|c-?section|cesarean|primary cesarean|repeat cesarean|\bCS\b|\bLTCS\b)|following (delivery|birth)|lochia|post-?cesarean|post c-?section/i.test(t)) f.postpartum = true;
    if (/post-?op|\bPOD\b|s\/p (hysterectomy|\bTLH\b|\bTAH\b|\bTVH\b|laparoscop|myomectomy|surgery)/i.test(t)) f.postop = true;
    if (f.postop && f.kw.posthyst) f.postpartum = f.postpartum && /delivery|birth|cesarean|c-?section|lochia/i.test(t);

    // gestational age (skip numbers that are postpartum intervals)
    const gaRe = /\b(\d{1,2})\s*(?:(?:\+|w(?:ee)?ks?\s*(?:and\s*)?|weeks?\s*(?:and\s*)?|w\s*)(\d)\s*(?:d(?:ays?)?|\/7)?|(?:\s*(\d)\/7)?\s*(?:weeks?|wks?|wk|w)\b)(?!\s*(?:postpartum|post-partum|pp\b|after|post-?op|ago|of (bleeding|pain|vomiting)|history))/gi;
    let ga = null;
    while ((m = gaRe.exec(t))) {
      const w = +m[1], d = m[2] !== undefined ? +m[2] : (m[3] !== undefined ? +m[3] : 0);
      if (w >= 3 && w <= 44 && d <= 6) { ga = { w, d }; break; }
    }
    if (ga && !(f.postpartum && !/pregnan|gestation|G\d|weeks? (pregnant|gestation)|\bat \d/i.test(t))) {
      f.gaWeeks = ga.w; f.gaDays = ga.d; f.ga = ga.w + ga.d / 7;
    }

    // BP: max of all readings
    const bpRe = /\b(\d{2,3})\s*\/\s*(\d{2,3})\b/g;
    while ((m = bpRe.exec(t))) {
      const s = +m[1], d = +m[2];
      if (s >= 50 && s <= 300 && d >= 20 && d <= 200 && s > d) {
        f.bpReadings = (f.bpReadings || []).concat([s + '/' + d]);
        f.sbp = Math.max(f.sbp || 0, s); f.dbp = Math.max(f.dbp || 0, d);
        f.sbpMin = Math.min(f.sbpMin || 999, s); f.dbpMin = Math.min(f.dbpMin || 999, d);
        f.mapMin = Math.min(f.mapMin || 999, Math.round((s + 2 * d) / 3));
      }
    }
    // maternal HR: fetal heart-rate phrases ('fetal HR 175', 'FHR 170', 'fetal tachycardia to 180', 'baseline 165') are removed first
    const tMat = t.replace(/\bfetal\s+(?:heart rate|heart tones?|HR|tachycardi[ac]?|baseline)(?:\s*(?:of|to|is|at|in the|=))?\s*\d{0,3}s?|\bFHR(?:\s*baseline)?(?:\s*(?:of|to|is|in the|=))?\s*\d{0,3}s?|\bbaseline(?:\s*FHR)?(?:\s*(?:of|is|in the))?\s*\d{2,3}s?/gi, ' FETALHR ');
    if ((m = tMat.match(/(?:\bHR|heart rate|\bpulse|tachycardi[ac]?(?: to| at| in the)?|\bP)\s*:?\s*(?:of|to|is|=)?\s*(\d{2,3})\b/i))) f.hr = +m[1];
    if ((m = t.match(/(?:\bFHR|fetal heart(?: rate)?|fetal HR|\bbaseline|fetal tachycardia(?: to)?)\s*(?:of|is|in the|to|=)?\s*(\d{2,3})s?\b/i))) f.fhr = +m[1];
    let tm = t.match(/(?:\btemp(?:erature)?|\bT\s?max|\bT|febrile(?: to)?|fever(?: of| to)?)\s*:?\s*(?:of|is|to|=)?\s*(\d{2,3}(?:\.\d+)?)\s*°?\s*([FC])?\b/i)
      || t.match(/\b(\d{2,3}(?:\.\d+)?)\s*°?\s*([FC])?\s*(?:fever|febrile)/i)
      || t.match(/\b(\d{2,3}(?:\.\d+)?)\s*°\s*([FC])?/i) || t.match(/\b(\d{2,3}\.\d)\s*([FC])\b/i);
    if (tm) {
      let v = num(tm[1]); const u = (tm[2] || '').toUpperCase();
      if (u === 'F' || (!u && v >= 90 && v <= 110)) { f.tempF = v; f.tempC = Math.round((v - 32) * 5 / 9 * 10) / 10; }
      else if (v >= 30 && v <= 45) { f.tempC = v; f.tempF = Math.round((v * 9 / 5 + 32) * 10) / 10; }
    }
    if ((m = t.match(/\bMAP\s*:?\s*(?:of|is|=|<)?\s*(\d{2,3})\b/i))) f.mapMin = Math.min(f.mapMin || 999, +m[1]);
    if ((m = t.match(/\b(?:RR|resp(?:iratory)?(?: rate)?|respirations)\s*:?\s*(?:of|is|=)?\s*(\d{1,2})\b/i))) f.rr = +m[1];
    if ((m = t.match(/(?:SpO2|SaO2|O2 sat(?:uration)?s?|\bsats?|saturation|pulse ox)\s*:?\s*(?:of|is|=)?\s*(\d{2,3})\s*%?/i)) || (m = t.match(/\b(\d{2,3})\s*%\s*(?:on\s*)?(?:RA|room air)/i))) { if (+m[1] <= 100) f.spo2 = +m[1]; }
    if ((m = t.match(/(?:\bQBL|\bEBL|blood loss)\s*(?:of|is|=|:|~|approx\.?|about|now)?\s*(\d[\d,]*(?:\.\d+)?)\s*(L\b|liters?|mL|ml|cc)?/i)) || (m = t.match(/\b(\d[\d,]*(?:\.\d+)?)\s*(L\b|liters?|mL|ml|cc)\s*(?:QBL|EBL|of blood|blood loss|bleeding|hemorrhage)/i))) {
      let v = num(m[1]); if (/^l/i.test(m[2] || '') && v < 20) v *= 1000; f.qbl = v;
    }
    if ((m = t.match(/\bWBC\s*(?:of|is|:|=)?\s*(\d[\d,]*(?:\.\d+)?)/i))) { let v = num(m[1]); if (v > 1000) v /= 1000; f.wbc = v; }
    if ((m = t.match(/\blactate\s*(?:of|is|:|=)?\s*(\d+(?:\.\d+)?)/i))) f.lactate = num(m[1]);
    if ((m = t.match(/(?:b-?hcg|bhcg|hcg|quant)\s*(?:of|is|:|=)?\s*(\d[\d,]{2,})/i))) f.hcg = num(m[1]);

    // delivery route (current delivery), separating prior-cesarean history
    const t2 = t.replace(KW.priorCS, ' PRIORCS ');
    if (KW.priorCS.test(t)) f.priorCS = true;
    if (/c-?section|cesarean|\bCS\b|C\/S|\bLTCS\b|\bCD\b|\bpLTCS\b|\brLTCS\b/i.test(t2)) f.route = 'cesarean';
    else if (/\bN?SVD\b|vaginal (delivery|birth)|\bVD\b|\bVAVD\b|delivered vaginally|vaginally/i.test(t2)) f.route = 'vaginal';

    f.labor = !!f.kw.labor && !f.postpartum;
    f.hcgPositive = !!f.kw.hcgPos || (f.hcg > 5 && !f.kw.notPregnant);
    f.pregnant = !f.postpartum && !f.kw.notPregnant && (f.ga !== undefined || f.G !== undefined || !!f.kw.pregnantWord || f.hcgPositive || f.labor || /in (active |early )?labor|laboring|intrapartum/i.test(t));
    f.antepartum = f.pregnant && !f.postpartum;
    f.obContext = f.pregnant || f.postpartum;

    // derived
    f.severeBP = (f.sbp >= 160) || (f.dbp >= 110);
    f.htn = (f.sbp >= 140) || (f.dbp >= 90);
    f.sfSymptoms = ['headache', 'visual', 'ruq', 'seizure'].filter(k => f.kw[k]).concat(f.kw.sob && /pulmonary edema/i.test(t) ? ['pulmonary edema'] : []);
    f.severeFeatures = f.severeBP || f.sfSymptoms.length > 0 || !!f.kw.hellp;
    f.feverC = f.tempC !== undefined ? f.tempC >= 38.0 : false;
    f.sirs = [];
    if (f.tempC !== undefined && (f.tempC >= 38 || f.tempC < 36)) f.sirs.push('temp ' + f.tempC + ' °C');
    if (f.hr > 110) f.sirs.push('HR ' + f.hr + ' (>110)');
    if (f.rr > 24) f.sirs.push('RR ' + f.rr + ' (>24)');
    if (f.wbc !== undefined && (f.wbc > 15 || f.wbc < 4)) f.sirs.push('WBC ' + f.wbc);
    f.abnormalVS = (f.hr >= 110) || (f.sbpMin <= 85) || (f.dbpMin <= 45) || (f.spo2 !== undefined && f.spo2 < 95);
    // pregnancy / fever split (Michael, 18 Oct 2026): IAI first for intrapartum fever unless sepsis red flags
    f.febrile = f.feverC || (!!f.kw.fever && f.tempC === undefined);
    f.lowGradeFever = f.feverC && f.tempC < 38.5;
    f.fetalTachy = /fetal tachy/i.test(t) || f.fhr > 160;
    // IAI context (Michael, 23 Oct 2026): fever + fetal tachycardia is a strong IAI discriminator even without labor wording
    f.iaiFeatures = [];
    if (f.fetalTachy) f.iaiFeatures.push('fetal tachycardia' + (f.fhr > 160 ? ' (FHR ' + f.fhr + ')' : ''));
    if (/uterine (tenderness|tender)|fundal tender|tender (uterus|fundus)/i.test(t)) f.iaiFeatures.push('uterine tenderness');
    if (/(foul|malodor|purulent|cloudy)[\w\s-]{0,20}(fluid|discharge|amniotic)/i.test(t)) f.iaiFeatures.push('foul / purulent fluid');
    f.iaiContext = !!f.antepartum && !!(f.labor || f.kw.rom || f.kw.iai || f.kw.contractions || (f.fetalTachy && (f.febrile || f.feverC)));
    // true sepsis / organ-dysfunction flags. Maternal tachycardia + fever alone is NOT a sepsis flag in the IAI context
    f.sepsisFlags = [];
    f.hypotensionWord = /hypotens|\bsoft (BP|pressures?)\b/i.test(t);
    f.pressors = /vasopressor|pressors|norepinephrine|levophed|phenylephrine drip|vasopressin/i.test(t);
    f.organDysfx = /end-?organ|organ dysfunction|\bAKI\b|acute kidney|rising creatinine|\bDIC\b|coagulopathy/i.test(t);
    f.lactateHigh = f.lactate >= 2 || /(elevated|high|rising|up-?trending) lactate|lactate (is )?(elevated|high|up)/i.test(t);
    if (f.sbpMin !== undefined && f.sbpMin < 90) f.sepsisFlags.push('SBP ' + f.sbpMin + ' (<90)');
    if (f.mapMin !== undefined && f.mapMin < 65) f.sepsisFlags.push('MAP ' + f.mapMin + ' (<65)');
    if (f.hypotensionWord) f.sepsisFlags.push('hypotension');
    if (f.hr > 110 && !f.iaiContext) f.sepsisFlags.push('HR ' + f.hr + ' (>110)');
    if (f.iaiContext ? (f.rr >= 25 || (f.rr >= 22 && f.spo2 !== undefined && f.spo2 < 95)) : f.rr >= 22) f.sepsisFlags.push('RR ' + f.rr + (f.rr >= 25 || !f.iaiContext ? ' (≥22)' : ' (≥22 with hypoxia)'));
    if (f.spo2 !== undefined && f.spo2 < 95) f.sepsisFlags.push('SpO2 ' + f.spo2 + '% (<95)');
    if (f.kw.ams) f.sepsisFlags.push('altered mental status');
    if (f.lactateHigh) f.sepsisFlags.push(f.lactate >= 2 ? 'lactate ' + f.lactate + ' (≥2)' : 'elevated lactate');
    if (f.kw.oliguria) f.sepsisFlags.push('oliguria');
    if (f.pressors) f.sepsisFlags.push('vasopressors');
    if (f.organDysfx) f.sepsisFlags.push('end-organ dysfunction');
    if (f.kw.shock) f.sepsisFlags.push('shock wording');
    // explicit 'sepsis' wording counts on its own outside IAI; in the IAI context it needs an objective feature above
    if (f.kw.sepsis && (!f.iaiContext || f.sepsisFlags.length)) f.sepsisFlags.push('sepsis / septic wording');
    // maternal cause in the HPI (Michael, 18 Oct 2026): LND-01 is then 'also consider', never the top card
    f.maternalCauses = [];
    if (f.febrile) f.maternalCauses.push('maternal fever');
    if (f.kw.iai || (f.kw.infection && !f.febrile)) f.maternalCauses.push('chorio / IAI / infection wording');
    if (f.sepsisFlags.length) f.maternalCauses.push('sepsis red flags');
    if (f.kw.abruption) f.maternalCauses.push('abruption');
    if ((f.kw.bleeding || f.kw.hemorrhage) && !f.kw.abruption) f.maternalCauses.push('bleeding');
    if (f.severeBP) f.maternalCauses.push('severe-range BP');
    if (f.kw.uterineRupture) f.maternalCauses.push('uterine rupture');
    f.infectionPicture = f.febrile || !!f.kw.sepsis || !!f.kw.infection || (f.tempC !== undefined && f.tempC < 36);
    f.feverText = f.tempC !== undefined ? 'temp ' + f.tempC + ' °C' + (f.tempF ? ' / ' + f.tempF + ' °F' : '') : 'fever reported';
    f.iaiWhy = f.labor ? 'Intrapartum fever' : f.kw.rom ? 'Fever with ROM / PPROM' : f.kw.iai ? 'Fever with chorio / IAI wording' : 'Fever with contractions';
    if (f.hr && f.sbpMin && f.sbpMin < 999) f.shockIndex = Math.round(f.hr / f.sbpMin * 100) / 100;
    if (f.qbl !== undefined) {
      const thr = f.route === 'cesarean' ? 1000 : 500;
      f.pphByQbl = f.qbl >= thr;
      f.qblThreshold = thr + (f.route ? ' (' + f.route + ')' : ' (route not stated; vaginal threshold used)');
    }
    return f;
  }

  // ---------- scoring rules (target, points, test, why) ----------
  const ob = f => f.obContext;
  const RULES = [
    // ANT-04
    ['ANT-04', 100, f => f.severeBP && ob(f), f => `Severe-range BP ${f.sbp}/${f.dbp} (SBP ≥160 or DBP ≥110) in ${f.postpartum ? 'postpartum' : 'pregnancy'}`],
    ['ANT-04', 98, f => f.htn && f.sfSymptoms.length && ob(f), f => `BP ≥140/90 (${f.sbp}/${f.dbp}) with ${f.sfSymptoms.join(', ')} → preeclampsia with severe features`],
    ['ANT-04', 96, f => f.kw.seizure && ob(f), () => 'Seizure in pregnancy/postpartum → eclampsia until proven otherwise'],
    ['ANT-04', 62, f => f.htn && ob(f) && (f.postpartum || !(f.ga < 20)), f => `BP ≥140/90 (${f.sbp}/${f.dbp}) after 20 weeks or postpartum`],
    ['ANT-04', 70, f => f.kw.preeclampsia && ob(f) && !f.kw.timingWords, () => 'Hypertensive-disorder keywords (preeclampsia / gHTN / HELLP / HTN)'],
    ['ANT-04', 30, f => f.kw.headache && ob(f) && !(f.ga < 20), () => 'Headache in pregnancy ≥20 wk or postpartum: check BP'],
    // SYS-03 sepsis
    ['SYS-03', 96, f => ob(f) && f.sepsisFlags.length && f.infectionPicture, f => `${f.febrile ? (f.iaiContext ? f.iaiWhy : f.postpartum ? 'Postpartum fever' : 'Fever in pregnancy') + ' (' + f.feverText + ')' : 'Infection picture'} WITH sepsis red flags: ${f.sepsisFlags.join(', ')} → sepsis first`],
    ['SYS-03', 88, f => f.sirs.length >= 2 && ob(f) && !(f.iaiContext && !f.sepsisFlags.length), f => `Sepsis screen ≥2 criteria (CMQCC Box 1): ${f.sirs.join(', ')}`],
    ['SYS-03', 86, f => f.kw.sepsis && ob(f) && !(f.iaiContext && !f.sepsisFlags.length), () => 'Sepsis / septic keyword in pregnancy or postpartum'],
    ['SYS-03', 80, f => f.feverC && f.postpartum && !(f.lowGradeFever && !f.sepsisFlags.length), f => `Temp ${f.tempC} °C (≥38.0) postpartum`],
    ['SYS-03', 64, f => f.feverC && f.postpartum && f.lowGradeFever && !f.sepsisFlags.length, f => `Low-grade postpartum fever (${f.tempC} °C) without sepsis red flags: look for the source card first`],
    ['SYS-03', 74, f => f.feverC && f.antepartum && !f.iaiContext, f => `Temp ${f.tempC} °C (≥38.0) in pregnancy, no labor/ROM context${f.sepsisFlags.length ? '' : ', no sepsis red flags'}`],
    ['SYS-03', 72, f => f.kw.fever && f.tempC === undefined && ob(f) && !f.iaiContext, () => 'Fever reported (no number) in pregnancy/postpartum'],
    ['SYS-03', 60, f => f.febrile && f.iaiContext && !f.sepsisFlags.length, f => `${f.iaiWhy} without sepsis red flags: sepsis is a secondary differential. Escalate to SYS-03 if hypotension (SBP <90 / MAP <65), AMS, lactate ≥2, RR ≥25 or RR ≥22 with SpO2 <95, oliguria, or pressors${f.hr > 110 ? ' (maternal HR ' + f.hr + ' with fever alone is expected with IAI)' : ''}`],
    ['SYS-03', 12, f => (f.kw.chills || f.kw.foulLochia) && ob(f), () => 'Chills / foul lochia or discharge'],
    ['SYS-03', 40, f => f.postpartum && f.kw.foulLochia, () => 'Foul or purulent lochia postpartum'],
    // LND-04
    ['LND-04', 94, f => f.febrile && f.iaiContext && f.fetalTachy && !f.sepsisFlags.length, f => `Maternal fever (${f.feverText}) plus fetal tachycardia${f.fhr > 160 ? ' (FHR ' + f.fhr + ')' : ''} in labor / ROM: classic IAI (LND-04)`],
    ['LND-04', 92, f => f.febrile && f.iaiContext && !f.sepsisFlags.length, f => `${f.iaiWhy} (${f.feverText}) without sepsis red flags: IAI first (LND-04)`],
    ['LND-04', 95, f => f.febrile && f.iaiContext && f.iaiFeatures.length >= 2 && !f.sepsisFlags.length, f => `Maternal fever with ${f.iaiFeatures.join(', ')}: strong IAI picture (LND-04)`],
    ['LND-04', 90, f => f.kw.iai && f.antepartum, () => 'Intraamniotic infection / chorio keyword'],
    ['LND-04', 80, f => f.febrile && f.iaiContext && f.sepsisFlags.length, f => `${f.iaiWhy} with sepsis red flags: IAI is the likely source; run the sepsis bundle first (SYS-03)`],
    // PP-01
    ['PP-01', 97, f => f.pphByQbl && (f.postpartum || f.route || f.kw.hemorrhage), f => `QBL ${f.qbl} mL ≥ ${f.qblThreshold} → PPH (CMQCC Stage 1)`],
    ['PP-01', 92, f => f.kw.hemorrhage && f.postpartum, () => 'Postpartum hemorrhage keywords (PPH / atony / boggy / soaking)'],
    ['PP-01', 85, f => f.kw.bleeding && f.postpartum, () => 'Postpartum bleeding'],
    ['PP-01', 8, f => f.postpartum && f.kw.bleeding && f.abnormalVS, () => 'Bleeding with abnormal VS (HR ≥110, BP ≤85/45, or SpO2 <95%)'],
    // SYS-02
    ['SYS-02', 84, f => f.kw.leg && (ob(f) || f.postop), () => 'Leg swelling / calf pain / DVT keyword'],
    ['SYS-02', 84, f => f.kw.pe && (ob(f) || f.postop), () => 'PE keyword'],
    ['SYS-02', 72, f => f.kw.vte, () => 'VTE / anticoagulation / prophylaxis keyword'],
    ['SYS-02', 58, f => f.kw.sob && ob(f), () => 'Shortness of breath / chest pain in pregnancy or postpartum → consider PE'],
    // LND-01
    ['LND-01', 90, f => f.kw.cat3 || f.kw.cat2, () => 'Category II/III FHR tracing'],
    ['LND-01', 86, f => f.kw.decels && (f.antepartum || f.labor), () => 'Decelerations on the tracing'],
    ['LND-01', 78, f => f.kw.fhr && f.antepartum && !f.kw.dfm, () => 'Fetal heart rate / tracing keyword'],
    ['LND-01', 75, f => f.fhr && (f.fhr > 160 || f.fhr < 110), f => `FHR baseline ${f.fhr} outside 110–160`],
    ['LND-01', 95, f => f.kw.cordProlapse, () => 'Cord prolapse'],
    // LND-02 .. LND-08
    ['LND-02', 80, f => f.kw.arrest, () => 'Labor arrest / protraction / second-stage keyword'],
    ['LND-03', 72, f => f.kw.induction && !f.postpartum, () => 'Induction / ripening keyword'],
    ['LND-03', 45, f => f.ga >= 41 && f.antepartum, f => `GA ${f.gaWeeks}w: late/post-term`],
    ['LND-05', 74, f => f.kw.gbs, () => 'GBS keyword'],
    ['LND-06', 95, f => f.kw.shoulder, () => 'Shoulder dystocia'],
    ['LND-07', 82, f => f.kw.ovb, () => 'Operative vaginal birth / OASIS keyword'],
    ['LND-08', 82, f => f.kw.tolac, () => 'TOLAC / VBAC'],
    ['LND-08', 70, f => f.priorCS && f.labor, () => 'Prior cesarean and in labor'],
    ['LND-08', 30, f => f.priorCS && f.antepartum, () => 'Prior cesarean'],
    // ANT
    ['ANT-01', 84, f => f.kw.rom && f.antepartum, () => 'Rupture of membranes / leaking fluid'],
    ['ANT-01', 88, f => f.kw.rom && f.antepartum && !f.febrile && (/\bPPROM\b|preterm (premature |prelabor )?rupture/i.test(f.raw) || f.ga < 37), f => `ROM before 37 weeks${f.gaWeeks !== undefined ? ' (' + f.gaWeeks + 'w' + (f.gaDays ? f.gaDays + 'd' : '') + ')' : ''} → PPROM (ANT-01 tree by gestational age)`],
    ['ANT-02', 86, f => f.kw.pretermLabor && f.antepartum, () => 'Preterm labor keyword'],
    ['ANT-02', 80, f => f.kw.contractions && f.ga >= 20 && f.ga < 37 && f.antepartum, f => `Contractions at ${f.gaWeeks}w${f.gaDays ? f.gaDays + 'd' : ''} (<37w)`],
    ['ANT-02', 20, f => f.kw.pretermWord && f.antepartum, () => 'Preterm'],
    ['ANT-03', 80, f => f.kw.cerclage, () => 'Cerclage / short cervix / insufficiency'],
    ['ANT-05', 68, f => f.kw.diabetes && (ob(f)), () => 'Diabetes in pregnancy keyword'],
    ['ANT-06', 66, f => f.kw.steroids && ob(f), () => 'Antenatal corticosteroid keyword'],
    ['ANT-06', 50, f => f.antepartum && f.ga >= 23 && f.ga < 34 && (f.kw.rom || f.kw.contractions || f.kw.pretermLabor || f.kw.bleeding), f => `GA ${f.gaWeeks}w (23–33+6) with possible delivery within 7 days → ACS`],
    ['ANT-07', 90, f => f.kw.pas && f.kw.bleeding, () => 'Previa / PAS with bleeding'],
    ['ANT-07', 84, f => f.kw.pas, () => 'Previa / accreta spectrum'],
    ['ANT-07', 92, f => /previa/i.test(f.raw) && f.priorCS, () => 'Previa with prior cesarean → high placenta accreta spectrum risk (ANT-07)'],
    ['ANT-07', 96, f => f.kw.placentaStuck, () => 'Placenta will not separate → treat as unexpected PAS: leave it in situ (ANT-07); hemorrhage via PP-01'],
    ['ANT-07', 70, f => f.kw.abruption && f.antepartum, () => 'Abruption: no abruption card in this set; placental bleeding card (previa / PAS) with PP-01 hemorrhage readiness; tracing on LND-01'],
    ['LND-08', 88, f => f.kw.uterineRupture && f.antepartum, () => 'Uterine rupture / scar dehiscence: TOLAC card (LND-08), emergency cesarean'],
    ['ANT-07', 60, f => f.antepartum && f.ga >= 20 && f.kw.bleeding && !f.kw.hemorrhage, () => 'Antepartum bleeding ≥20 wk: rule out previa/PAS (ANT-07) — no abruption card in this set'],
    ['ANT-08', 76, f => f.kw.nausea && (f.antepartum || f.hcgPositive) && !(f.ga >= 20), () => 'Nausea / vomiting in early pregnancy'],
    ['ANT-08', 45, f => f.kw.nausea && f.antepartum && f.ga >= 20, () => 'Vomiting after 20 wk (rethink NVP label)'],
    ['ANT-09', 70, f => f.kw.dfm && f.antepartum, () => 'Decreased fetal movement / NST / surveillance'],
    ['ANT-10', 66, f => f.kw.timing && ob(f), () => 'Delivery-timing condition (FGR, oligo, twins, ICP, HIV, cHTN, etc.)'],
    ['ANT-10', 74, f => f.kw.timingWords && ob(f), () => 'Question about delivery timing'],
    // early pregnancy
    ['GYNB-01', 95, f => f.hcgPositive && f.kw.unstable && !f.kw.iup && !(f.ga >= 14), () => 'Positive hCG + unstable / peritoneal signs → ectopic until proven otherwise (OR)'],
    ['GYNB-01', 92, f => f.kw.ectopic, () => 'Ectopic / PUL / methotrexate keyword'],
    ['GYNB-01', 80, f => (f.hcgPositive || f.ga < 14) && f.kw.pelvicPain && !f.kw.iup && !(f.ga >= 14), () => 'Early pregnancy / positive hCG with pelvic pain, no confirmed IUP'],
    ['GYNB-01', 74, f => (f.hcgPositive || f.ga < 14) && f.kw.bleeding && !f.kw.iup && !(f.ga >= 14) && !f.postpartum, () => 'Early pregnancy bleeding, location not confirmed'],
    ['GYNB-01', 82, f => f.noIUP && (f.hcgPositive || f.ga < 14), () => 'Positive hCG / early pregnancy with no IUP on ultrasound'],
    ['GYNB-01', 55, f => f.hcgPositive && !f.kw.iup && !(f.ga >= 14) && !f.kw.nausea, () => 'Positive hCG, location not confirmed'],
    ['GYN-01', -3, null, null], // mirror of GYNB-01 (OB-book version) handled below
    ['GYN-02', 90, f => f.kw.epl, () => 'Early pregnancy loss keyword'],
    ['GYN-02', 84, f => f.kw.iup && f.kw.bleeding && !(f.ga >= 20), () => 'Bleeding with known IUP in early pregnancy'],
    ['GYN-02', 70, f => (f.hcgPositive || f.ga < 20) && f.kw.bleeding && !f.postpartum && !(f.ga >= 20), () => 'Early pregnancy bleeding'],
    ['GYNB-10', 94, f => f.kw.molar, () => 'Molar / GTD keyword'],
    ['GYNB-10', 70, f => f.hcg >= 100000 && !(f.ga >= 14), f => `hCG ${f.hcg} (≥100,000) early → consider molar`],
    // other
    ['PP-02', 66, f => f.kw.anemia && !f.kw.hemorrhage, () => 'Anemia / iron / hemoglobin keyword'],
    ['SYS-01', 99, f => f.kw.arrestCard && ob(f), () => 'Maternal cardiac arrest → perimortem cesarean if fundus >20 wk'],
    ['SYS-01', 82, f => f.kw.critical && ob(f), () => 'Critical-care keyword (ICU / shock / code / AFE)'],
    ['SYS-01', 60, f => f.spo2 !== undefined && f.spo2 < 92 && ob(f), f => `SpO2 ${f.spo2}%`],
    // GYN book
    ['GYNB-02', 82, f => f.kw.aub && !f.pregnant && !f.postpartum, () => 'Abnormal uterine bleeding, not pregnant'],
    ['GYNB-02', 72, f => f.kw.bleeding && f.kw.notPregnant && !f.postpartum, () => 'Bleeding with negative hCG'],
    ['GYNB-02', 80, f => f.kw.bleeding && f.kw.heavyBleed && !f.obContext && !f.hcgPositive && !f.postop && !f.kw.posthyst, () => 'Heavy bleeding, no pregnancy or postpartum context → acute AUB (pregnancy test first)'],
    ['GYNB-03', 86, f => f.kw.pid, () => 'PID / TOA / CMT keyword'],
    ['GYNB-04', 88, f => f.kw.torsion && !f.kw.sob, () => 'Torsion / sudden unilateral pain keyword'],
    ['GYNB-04', 50, f => f.kw.pelvicPain && f.kw.mass && !f.hcgPositive, () => 'Pelvic pain with adnexal mass'],
    ['GYNB-04', 88, f => f.kw.mass && (f.kw.suddenPain || (f.kw.pelvicPain && f.kw.nausea)) && !f.pregnant, () => 'Sudden or vomiting-associated pain with an ovarian cyst/mass → suspected torsion'],
    ['GYNB-04', 86, f => f.kw.hemCyst && !f.pregnant, () => 'Ruptured / hemorrhagic cyst → GYN-04 tree (CSM house pathway: stable = observe, serial Hgb; unstable = OR)'],
    ['GYNB-04', 40, f => f.kw.pelvicPain && f.kw.notPregnant, () => 'Pelvic pain, not pregnant'],
    ['GYNB-05', 70, f => f.kw.mass && !f.hcgPositive, () => 'Adnexal mass / cyst keyword'],
    ['GYNB-06', 83, f => f.kw.pyelo, () => 'Pyelonephritis / stone / CVA tenderness keyword'],
    ['GYNB-07', 86, f => f.kw.iud, () => 'IUD / implant keyword'],
    ['GYNB-08', 84, f => f.kw.cpp, () => 'Chronic pelvic pain keyword'],
    ['GYNB-09', 87, f => f.kw.posthyst, () => 'Post-hysterectomy / cuff keyword'],
    // ED-to-OB
    ['ED-OB', 45, f => f.kw.ed && ob(f), () => 'Pregnant or ≤6 wk postpartum patient in the main ED (ED-to-OB pathway)'],
    ['ED-OB', 25, f => f.kw.ed && f.kw.trauma && ob(f), () => 'Non-OB signs/symptoms in the ED'],
    ['ED-OB', 40, f => f.kw.imminent && f.kw.ed, () => 'Delivery imminent in the ED'],
  ];

  const CARD_FOR = { 'SYS-03': null, 'ED-OB': null };
  function diagramFor(topic, content) {
    return content.items.find(i => i.kind === 'diagram' && (i.id === 'FD-' + topic || (i.topics || []).includes(topic))) || null;
  }

  function score(f) {
    const s = {}, why = {};
    for (const [tg, pts, test, w] of RULES) {
      if (!test) continue;
      let ok = false; try { ok = !!test(f); } catch (e) { ok = false; }
      if (!ok) continue;
      // highest rule sets the base; additional matching rules add a small bonus (auditable)
      if (s[tg] === undefined) { s[tg] = pts; } else { s[tg] = Math.max(s[tg], pts) + Math.min(pts, s[tg]) * 0.05; }
      (why[tg] = why[tg] || []).push(`${typeof w === 'function' ? w(f) : w} [+${pts}]`);
    }
    // pregnancy context weighting: with fever but stable vitals, obstetric cards beat generic sepsis
    if (f.obContext && f.febrile && !f.sepsisFlags.length) {
      for (const k of Object.keys(s)) if (/^(LND|ANT|PP)-/.test(k)) { s[k] += 6; why[k].push('Pregnancy context weighted over generic sepsis (fever, no sepsis red flags) [+6]'); }
    }
    if (s['LND-01'] !== undefined && f.maternalCauses && f.maternalCauses.length && !f.kw.cordProlapse) {
      const others = Object.keys(s).filter(k => k !== 'LND-01').map(k => s[k]);
      if (!others.length && f.febrile && f.antepartum) { s['LND-04'] = s['LND-01']; why['LND-04'] = ['Maternal fever with a tracing question: treat the cause first (LND-04)']; others.push(s['LND-04']); }
      if (others.length) {
        let cap = Math.max(...others) - 2;
        if (f.febrile && s['LND-04'] !== undefined) cap = Math.min(cap, s['LND-04'] - 2);  // fever: IAI card ranks above the tracing card
        if (s['LND-01'] > cap) { s['LND-01'] = cap; why['LND-01'].push(`Maternal cause in the HPI (${f.maternalCauses.join(', ')}): tracing card shown as also consider, not first`); }
      }
    }
    if (f.kw.placentaStuck && s['ANT-07'] !== undefined && s['PP-01'] !== undefined && s['PP-01'] >= s['ANT-07']) { s['ANT-07'] = s['PP-01'] + 1; why['ANT-07'].push('Placenta will not separate: PAS tree first, PP-01 runs alongside for the bleeding'); }
    if (s['GYNB-01'] !== undefined) { s['GYN-01'] = s['GYNB-01'] - 3; why['GYN-01'] = ['OB-book short version of the ectopic card (see GYN-01 GYN book)']; }
    if (s['SYS-03'] !== undefined && f.labor && s['LND-04'] === undefined && f.antepartum) { s['LND-04'] = s['SYS-03'] - 5; why['LND-04'] = ['Intrapartum fever → LND-04 companion']; }
    if (s['ANT-04'] >= 95 && s['ANT-10'] === undefined && f.antepartum) { s['ANT-10'] = 40; why['ANT-10'] = ['Delivery timing (34w vs 37w clock)']; }
    if (s['PP-01'] >= 85 && s['PP-02'] === undefined) { s['PP-02'] = 35; why['PP-02'] = ['Postpartum anemia / transfusion follow-up']; }
    if (s['PP-01'] >= 85 && s['SYS-01'] === undefined && (f.abnormalVS || f.qbl > 1500)) { s['SYS-01'] = 50; why['SYS-01'] = ['Hemodynamic instability → critical care']; }
    return Object.keys(s).map(k => ({ id: k, score: Math.round(s[k] * 10) / 10, why: why[k] }))
      .sort((a, b) => b.score - a.score);
  }

  // ---------- red flags ----------
  function redFlags(f) {
    const out = [];
    if (f.severeBP && f.obContext) out.push({ level: 'red', text: 'SEVERE-RANGE BP: confirm on a recheck within 15 min; treat within 30–60 min of confirmation' });
    if (f.htn && f.sfSymptoms.length && f.obContext) out.push({ level: 'red', text: 'SEVERE FEATURES (' + f.sfSymptoms.join(', ') + '): magnesium for seizure prophylaxis (ANT-04)' });
    if (f.kw.seizure && f.obContext) out.push({ level: 'red', text: 'SEIZURE: treat as eclampsia — magnesium per formulary' });
    if (f.obContext && f.sepsisFlags.length && f.infectionPicture) out.push({ level: 'red', text: 'SEPSIS RED FLAGS (' + f.sepsisFlags.join(', ') + '): time-zero bundle; antibiotics within 1 h (SYS-03)' + (f.iaiContext ? '; IAI is the likely source (LND-04)' : '') });
    else if (f.sirs.length >= 2 && f.obContext && !f.iaiContext) out.push({ level: 'red', text: 'SEPSIS SCREEN POSITIVE (≥2): time-zero bundle; antibiotics within 1 h (SYS-03)' });
    else if (f.febrile && f.iaiContext) out.push({ level: 'amber', text: f.iaiWhy.toUpperCase() + ' without sepsis red flags: treat as suspected IAI (LND-04); recheck VS and escalate to SYS-03 if hypotension (SBP <90 / MAP <65), AMS, lactate ≥2, RR ≥25 or RR ≥22 with SpO2 <95, oliguria, or pressors' + (f.hr > 110 ? '; maternal tachycardia with fever alone is expected with IAI' : '') });
    else if (f.feverC && f.obContext) out.push({ level: 'amber', text: 'FEVER ≥38.0 °C: run the sepsis screen' + (f.postpartum && f.lowGradeFever ? '; low-grade, no red flags: look for the source' : '') });
    if (f.pphByQbl) out.push({ level: 'red', text: 'PPH (CMQCC Stage 1): QBL ' + f.qbl + ' mL ≥ ' + f.qblThreshold });
    if (f.qbl > 1500) out.push({ level: 'red', text: 'QBL >1500 mL: Stage 3 — OR, MTP 1:1:1 (PP-01 pearl)' });
    if (f.abnormalVS && f.obContext) out.push({ level: 'amber', text: 'ABNORMAL VS (CMQCC): HR ≥110, BP ≤85/45, or SpO2 <95%' });
    if (f.shockIndex >= 0.9 && f.obContext) out.push({ level: 'red', text: 'SHOCK INDEX ' + f.shockIndex + ' (≥0.9)' });
    if (f.hcgPositive && f.kw.unstable && !(f.ga >= 14)) out.push({ level: 'red', text: 'UNSTABLE + POSITIVE hCG → OPERATING ROOM, not another quantitative (GYN-01)' });
    if (f.kw.cat3) out.push({ level: 'red', text: 'CATEGORY III: resuscitate while you move toward delivery (LND-01)' });
    if (f.kw.cordProlapse) out.push({ level: 'red', text: 'CORD PROLAPSE: cannot-miss (ANT-01)' });
    if (f.kw.arrestCard && f.obContext) out.push({ level: 'red', text: 'ARREST + fundus >20 wk → perimortem cesarean at the bedside (SYS-01)' });
    if (f.spo2 !== undefined && f.spo2 < 95 && !f.abnormalVS) out.push({ level: 'amber', text: 'SpO2 ' + f.spo2 + '%' });
    if (f.kw.torsion) out.push({ level: 'amber', text: 'Possible torsion: present Doppler flow does not exclude it (GYN-04)' });
    return out;
  }

  // ---------- coding ----------
  function ctxFor(f) {
    if (f.postpartum) return 'pp';
    if (f.labor) return 'cb';
    if (f.ga !== undefined) return f.ga < 14 ? 't1' : f.ga < 28 ? 't2' : 't3';
    return 'u';
  }
  function whenOk(w, f) {
    if (!w || w === 'always') return true;
    if (w === 'never') return false;
    const neg = w[0] === '!'; const k = neg ? w.slice(1) : w;
    const map = {
      severe: f.severeFeatures, hellp: !!f.kw.hellp, seizure: !!f.kw.seizure, headache: !!f.kw.headache,
      labor: f.labor, preterm: f.ga !== undefined && f.ga < 37, term: f.ga >= 37, pp: !!f.postpartum,
      antepartum: !!f.antepartum, bleeding: !!f.kw.bleeding, priorCS: !!f.priorCS, lt20: !(f.ga >= 20), ge20: f.ga >= 20,
      dfm: !!f.kw.dfm, pregnant: !!f.pregnant, sob: !!(f.kw.sob || f.kw.pe), arrest: !!f.kw.arrestCard, ed: !!f.kw.ed,
      critical: !!(f.kw.critical || f.sirs.length >= 2), postterm: f.ga >= 40 + 1 / 7 && f.ga < 42, prolonged: f.ga >= 42,
    };
    const v = !!map[k]; return neg ? !v : v;
  }
  function z3a(f) {
    if (f.postpartum || !f.pregnant) return null;
    if (f.gaWeeks === undefined) return { code: 'Z3A.00', label: 'Weeks of gestation not specified' };
    const w = f.gaWeeks;
    if (w < 8) return { code: 'Z3A.01', label: 'Less than 8 weeks gestation' };
    if (w > 42) return { code: 'Z3A.49', label: 'Greater than 42 weeks gestation' };
    const c = w < 10 ? 'Z3A.0' + w : 'Z3A.' + w;
    return { code: c, label: w + ' weeks gestation of pregnancy' };
  }
  function codes(topicId, f, tables, validation) {
    let card = tables.cards[topicId]; if (!card) return null;
    if (card.same_as) card = tables.cards[card.same_as];
    const ctx = ctxFor(f); const icd = [];
    const v = c => validation && validation.codes[c] ? validation.codes[c] : null;
    for (const e of card.icd || []) {
      if (!whenOk(e.when, f)) continue;
      const cs = [];
      const pick = e.codes[ctx] || (ctx === 'cb' && f.ga !== undefined ? e.codes[f.ga < 28 ? 't2' : 't3'] : null) || e.codes.any || e.codes.u;
      if (pick) cs.push(pick); if (e.codes.any2) cs.push(e.codes.any2);
      for (const c of cs) {
        const vv = v(c);
        icd.push({ code: c, label: e.label, alt: !!e.alt, verified: !!(vv && vv.fy2026), cms: vv ? vv.desc_fy2026 : null, fy2027: !!(vv && vv.fy2027) });
      }
    }
    const z = z3a(f);
    if (z) { const vv = v(z.code); icd.push(Object.assign(z, { alt: false, secondary: true, verified: !!(vv && vv.fy2026), cms: vv ? vv.desc_fy2026 : null, fy2027: !!(vv && vv.fy2027) })); }
    const cpt = (card.cpt || []).filter(c => whenOk(c.when, f));
    const em = tables.em.filter(e => whenOk(e.when, f));
    return { ctx, icd, cpt, em, tableVersion: tables.version };
  }

  // ---------- privacy check ----------
  function privacyCheck(text) {
    const w = []; const t = String(text || '');
    if (/\bMRN\b|medical record|\bacct\b|account (no|number)|\bFIN\b/i.test(t) || /\b\d{6,}\b/.test(t.replace(/\b\d{1,2}[,]?\d{3}\s*(mL|ml|cc|mIU)/gi, ''))) w.push('Looks like it may contain an MRN or account number.');
    if (/\bDOB\b|date of birth|\b\d{1,2}[\/-]\d{1,2}[\/-](19|20)?\d{2}\b/i.test(t)) w.push('Looks like it may contain a date of birth or calendar date.');
    if (/\b(Mr|Mrs|Ms|Miss|Mx)\.?\s+[A-Z][a-z]+/.test(t) || /\b[A-Z][a-z]{2,},\s*[A-Z][a-z]{2,}\b/.test(t) || /\b(name is|named|patient name|pt name)\b/i.test(t)) w.push('Looks like it may contain a patient name.');
    if (/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b|\b\d{3}-\d{2}-\d{4}\b|@\w+\./.test(t)) w.push('Looks like it may contain a phone, SSN, or email.');
    return w;
  }

  // related cards used to pad 'also consider' to at least 2 alternates (score 0, labelled as related)
  const RELATED = {
    'ANT-04': ['ANT-10', 'LND-03', 'SYS-01'], 'PP-01': ['PP-02', 'SYS-01', 'ANT-07'], 'SYS-03': ['LND-04', 'SYS-01', 'GYNB-06'],
    'LND-01': ['LND-02', 'LND-08', 'LND-04'], 'LND-02': ['LND-07', 'LND-01'], 'LND-03': ['LND-08', 'ANT-10'], 'LND-04': ['SYS-03', 'LND-05'],
    'LND-05': ['ANT-01', 'LND-04'], 'LND-06': ['LND-07', 'PP-01'], 'LND-07': ['LND-06', 'LND-02'], 'LND-08': ['LND-03', 'LND-01'],
    'ANT-01': ['ANT-06', 'LND-04', 'LND-05'], 'ANT-02': ['ANT-06', 'ANT-01'], 'ANT-03': ['ANT-02', 'ANT-01'], 'ANT-05': ['ANT-10', 'LND-06'],
    'ANT-06': ['ANT-02', 'ANT-01'], 'ANT-07': ['PP-01', 'ANT-10'], 'ANT-08': ['GYNB-10', 'GYN-02'], 'ANT-09': ['ANT-10', 'LND-01'],
    'ANT-10': ['ANT-06', 'ANT-09'], 'GYNB-01': ['GYN-02', 'GYNB-10'], 'GYN-01': ['GYNB-01', 'GYN-02'], 'GYN-02': ['GYNB-01', 'GYNB-10'],
    'PP-02': ['PP-01'], 'SYS-01': ['SYS-03', 'PP-01'], 'SYS-02': ['SYS-01', 'PP-01'], 'ED-OB': ['ANT-04', 'SYS-03'],
    'GYNB-02': ['GYNB-05', 'PP-02'], 'GYNB-03': ['GYNB-04', 'GYNB-06'], 'GYNB-04': ['GYNB-05', 'GYNB-01'], 'GYNB-05': ['GYNB-04'],
    'GYNB-06': ['SYS-03', 'GYNB-03'], 'GYNB-07': ['GYNB-01', 'GYNB-03'], 'GYNB-08': ['GYNB-05', 'GYNB-03'], 'GYNB-09': ['SYS-02', 'GYNB-03'],
    'GYNB-10': ['GYN-02', 'GYNB-01'],
  };
  function padAlternates(ranked) {
    if (!ranked.length) return ranked;
    const out = ranked.slice(); const have = new Set(out.map(r => r.id));
    for (const id of RELATED[out[0].id] || []) {
      if (out.length >= 3) break;
      if (!have.has(id)) { out.push({ id, score: 0, why: ['Related card for ' + out[0].id + ' (no direct rule match)'] }); have.add(id); }
    }
    return out;
  }

  function triage(text, content, tables, validation) {
    const f = parse(text);
    const ranked = score(f);
    const top = ranked[0] || null;
    const resolve = id => {
      const diag = content ? diagramFor(id, content) : null;
      const card = content ? content.items.find(i => i.kind === 'card' && i.id === id) : null;
      return { id, diagram: diag, card };
    };
    return {
      facts: f, ranked, flags: redFlags(f), privacy: privacyCheck(text),
      top: top ? Object.assign(resolve(top.id), top) : null,
      alternates: padAlternates(ranked).slice(1, 4).map(r => Object.assign(resolve(r.id), r)),
      coding: top && tables ? codes(top.id, f, tables, validation) : null,
    };
  }

  const api = { parse, score, redFlags, codes, privacyCheck, triage, RULES, KW };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TriageEngine = api;
})(typeof self !== 'undefined' ? self : this);
