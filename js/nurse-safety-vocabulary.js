/* Nurse-section only (loaded by nurse.html; not used by index.html). */
/* Staging safety vocabulary: bounded bilingual concept extraction, not a translator,
 * diagnosis model, discharge tool, or substitute for a qualified interpreter. */
(function(root){
 'use strict';
 const re=(s)=>new RegExp(s,'i');
 const has=(t,p)=>p.test(t);
 const near=(t,a,b,n=65)=>new RegExp('(?:'+a+')[^.;]{0,'+n+'}(?:'+b+')|(?:'+b+')[^.;]{0,'+n+'}(?:'+a+')','i').test(t);
 const fold=s=>s.normalize('NFKC').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").replace(/[‐‑–—]/g,'-').replace(/[^\S\n]+/g,' ');
 function language(input){
  const t=fold(typeof input==='string'?input:'');
  const es=/\b(?:tengo|estoy|embaraz|semanas?|bebe|parto|pareja|sangrad|sangre|duele|quiero|desmayo|respira|contracciones|fuente|pecho|dolor|falta el aire|convulsion|azucar|no siento|niega|quisiera|veces|despertar|pienso|aguanto|desaparecer|choque|chocaron|muerta)\w*\b/i.test(t);
  const foreign=/[^\p{Script=Latin}\p{Script=Greek}\p{Number}\p{Punctuation}\p{Symbol}\p{Separator}\p{Mark}\s]/u.test(t)||/\b(?:je suis|j'ai|ne respire|ne bouge|enceinte|douleur|saigne|ich bin|schwanger|nao consigo|estou gravida|non respiro)\b/i.test(t);
  const en=/\b(?:shoved|choked|slapped|grabbed|patient|postpartum|pregnan\w*|weeks?|days?|hours?|delivery|birth|labor|pain|headache|fever|breath\w*|bleed\w*|seiz\w*|convuls\w*|stroke|glucose|diabet\w*|insulin|blood|baby|infant|cord|fetal|vomit\w*|nausea|dysuria|BP|HR|CP|SOB|HA|PIH|SI|HI|NST|BPP|DFM|LOF|ctx|SROM|PPROM|GBS|POD\d*|PPD\d*|G\d|hCG|IUP|UPT|ectopic|PUL|TVUS|rear[- ]ended|stoplight|fender|bender|wreck|motorcycle|interpreter|vitals?|stable|spotting|IPV|LOC|airbag|crash|mph|partner|fell|punched|kicked|belly|abdomen|stomach|anaph\w*|hives|trauma|MVA|MVC|routine|appointment|refill|work note|comfortable|nothing|request|needs?|normal|well|joint|calf|chest|constipation|tired|epidural|education|mental|suicid\w*|chill\w*|psychosis|taking|feel|help|my|her|she|he|i|the|and|with|no|denies)\b/i.test(t);
  return {code:es?'es':foreign?'unsupported':en||!t.trim()?'en':'uncertain',interpreterRecommended:es||foreign,unsupported:foreign||(!es&&!en&&t.trim().split(/\s+/).length>=3)};
 }
 // Phrase-level positive absences precede ordinary negation; replacement occurs IN
 // the clause, never by appending a global keyword that could evade negation scope.
 const ES=[
  [/\bhace\s+(\d+)\s*(semanas?|dias?|meses?)\s+(?:tuve|tuvo|di a luz|dio a luz)\s+(?:el |un |al )?(?:bebe|nino|parto)\b/gi,' $1 $2 postpartum '],
  [/\b(?:despues|tras|desde)\s+(?:del? |el )?parto\b|\bpost[ -]?parto\b/gi,' postpartum '],
  [/\b(?:no quiero vivir|no quiere vivir|quiero morirme|quiero morir|quiero hacerme dano|me quiero matar|quiero matarme|quitarme la vida|pensamientos? de (?:hacerme dano|quitarme la vida|morir(?:me)?|matarme|suicidio|no querer vivir)|(?:seria|estaria) mejor (?:estar )?muerta?|mejor estar muerta?|ojala (?:no despertara|estuviera muerta)|(?:seria|estaria) mejor no despertar|mejor no despertar(?:me)?|no (?:quisiera|quiero) despertar(?:me)?|(?:quisiera|quiero) desaparecer|(?:quisiera|quiero) no existir|(?:ya )?no (?:aguanto|soporto) (?:el |este )?dolor de vivir|(?:ya )?no aguanto (?:mas )?(?:esta|la) vida|ya no aguanto(?! (?:el|los|las|este|esta|estos|estas) (?:dolor|dolores|contracciones|comezon|nausea))|(?:mejor|preferiria estar) muerta|no quiero estar aqui|no vale la pena vivir|no tengo razon para vivir)\b/gi,' suicidal thoughts '],
  [/\b(?:ya )?no (?:aguanto|soporto)(?: mas)? (?:el|los|las|este|esta|estos|estas) (?:dolor(?:es)?|contracciones|comezon|nauseas?)\b/gi,' intense pain '],
  [/\b(?:hacerle dano|lastimar|matar|ahogar|sacudir)\s+(?:a |al )?(?:mi |el |su )?(?:bebe|hijo|recien nacido)\b/gi,' harm infant '],
  [/\b(?:mi |el |su )?bebe\s+no\s+(?:respira(?: bien)?|esta respirando)\b/gi,' infant respiratory arrest '],
  [/\bno\s+(?:puedo respirar|puede respirar|respiro bien)|\bme (?:falta el aire|cuesta respirar)|\b(?:falta de aire|dificultad (?:para |al )?respirar|me ahogo)\b/gi,' breathing difficulty '],
  [/\bno\s+(?:siento|sentimos)\s+(?:a |al )?(?:mi |el )?bebe\s+(?:moverse|mover)|\b(?:el |mi )?bebe\s+no\s+se mueve|\bmenos movimientos(?: fetales)?\b/gi,' decreased fetal movement '],
  [/\b(?:se me rompio|se rompio|rompi)\s+(?:la )?(?:fuente|bolsa|agua)|\b(?:perdida|salida|goteo) de liquido\b/gi,' rupture of membranes '],
  [/\b(?:me cai|se cayo|tuve una caida|sufri una caida|accidente de (?:carro|coche|auto|transito))\b/gi,' fell '],
  [/\b(?:tuve un choque|choque (?:de|en) (?:carro|coche|auto|moto)|me chocaron|chocamos|choque (?:el|mi|su|un|una|con|contra) (?:carro|coche|auto|camion|camioneta|moto|motocicleta|poste|pared|arbol|otro carro|otro coche)|choco (?:mi|el) (?:carro|coche|auto))\b/gi,' car crash '],
  [/\b(?:(?:mi|su|el|la) )?(?:pareja|esposo|novio|marido|ex|el|alguien)?\s*(?:me|la|le)\s+(?:pego|golpeo|pateo|estrangulo|ahorco|empujo|aventó|avento|jalo|cacheteo|abofeteo|zarandeo|sacudio|mordio|ataco|tiro al suelo|agarro (?:a golpes|del cuello|del pelo|del brazo|fuerte))\b/gi,' partner assaulted '],
  [/\b(?:contesta|responde|habla)\s+(?:todo\s+)?por ella\b|\bno la deja (?:hablar|contestar|responder|sola)\b|\b(?:pareja|esposo|novio|marido|el)\s+no se (?:quiere ir|va|quiere salir)\b|\bno se (?:puede|pudo) separar\b/gi,' partner answers for her '],
  [/\b(?:(?:me|se) desmay\w*|me quiero desmayar|perdi el conocimiento|desvanecimiento)\b/gi,' syncope '],
  [/\bsangr(?:ado|ando|o|ar)\s+(?:mucho|demasiado|abundante)|\bmucha sangre\b|\bhemorragia\b/gi,' heavy bleeding '],
  [/\bsangr(?:ado|ando|o|ar)\b|\bsangre vaginal\b/gi,' vaginal bleeding '],
  [/\bdolor (?:de|en la) cabeza\b/gi,' headache '],
  [/\b(?:veo lucecitas|vision borrosa|veo borroso|veo manchas|luces en la vista)\b/gi,' blurred vision '],
  [/\b(?:me duele|dolor en|dolor de)\s+(?:el )?pecho\b/gi,' chest pain '],
  [/\b(?:convulsiones?|ataque convulsivo|ataque epileptico)\b/gi,' seizure '],
  [/\b(?:derrame cerebral|cara caida|boca torcida|habla arrastrada|no puede hablar|un lado debil)\b/gi,' stroke symptoms '],
  [/\b(?:dolor en (?:el )?abdomen|dolor abdominal|dolor (?:del? )?vientre)\b/gi,' abdominal pain '],
  [/\b(?:embarazada|embarazo|gestacion)\b/gi,' pregnant '],
  [/\bsemanas?\b/gi,' weeks '],[/\bdias?\b/gi,' days '],[/\bmeses?\b/gi,' months '],
  [/\bfiebre\b/gi,' fever '],[/\btemperatura\b/gi,' temperature '],[/\bescalofrios\b/gi,' chills '],
  [/\b(?:confundid[ao]|no responde bien|somnolienta|somnoliento)\b/gi,' altered mental status '],[/\b(?:anafilaxia|reaccion anafilactica)\b/gi,' anaphylaxis '],[/\bcetoacidosis\b/gi,' ketoacidosis '],[/\bcetonas\b/gi,' ketones '],[/\b(?:mareada|mareado|mareos)\b/gi,' dizzy '],[/\bpalida\b/gi,' pale '],
  [/\b(?:contracciones|contraccion)\b/gi,' contractions '],[/\bcada\b/gi,' every '],
  [/\b(?:cordon umbilical|cordon)\b/gi,' cord '],[/\bvagina\b/gi,' vagina '],
  [/\b(?:sale|saliendo|afuera)\b/gi,' coming out '],
  [/\b(?:liquido es verde|liquido verde)\b/gi,' green fluid '],
  [/\b(?:ronchas|urticaria)\b/gi,' hives '],[/\b(?:labios hinchados|labios se hinchan)\b/gi,' swollen lips '],
  [/\b(?:garganta se cierra|lengua hinchada|se hincha la lengua)\b/gi,' tongue swelling '],
  [/\b(?:azucar|glucemia|glucosa)\b/gi,' glucose '],[/\b(?:presion arterial|presion)\b/gi,' blood pressure '],
  [/\b(?:pastillas|tabletas)\b/gi,' pills '],[/\b(?:voces|alucinaciones)\b/gi,' hallucinations '],
  [/\b(?:no tiene|no presenta|no siento)\b/gi,' no '],[/\bniega\b/gi,' denies '],[/\bsin\b/gi,' without '],
 ];
 const EN=[
  [/\b(?:thoughts? (?:of|about) |thinking (?:of|about) )?(?:not wanting to (?:wake up|live|be alive|be here)|(?:doesn't|does not|don't|do not) want to (?:wake up|live|be alive))\b|\b(?:everyone|everybody|family|the baby|her (?:family|kids|children|baby)|my (?:family|kids|children|baby)|they|others)\b[^.;]{0,20}\bbetter off without (?:her|me)\b|\b(?:end(?:ing)? it all|end(?:ing)? (?:my|her) (?:own )?life|tired of living|no reason to live|(?:can't|cannot) go on (?:living|anymore)|wants? to disappear|wish(?:es)? (?:I|she) could disappear)\b/gi,' suicidal thoughts '],
  [/\b(?:history of |hx of |h\/o |prior |past |previous )?(?:being |been |was |got )?(?:choked|strangled)\s+(?:by|from)\s+(?:her |my |a |an |the )?(?:partner|ex|boyfriend|husband|spouse|girlfriend|fiance\w*|him|her|someone|abuser)\b|\b(?:history of|hx of|h\/o|prior|past|previous) (?:being )?(?:choking|strangulation|choked|strangled)(?! (?:on|by food))\b|\b(?:partner|boyfriend|husband|spouse|girlfriend|ex|he|she|abuser)\b[^.;]{0,20}\b(?:choked|strangled|choking|strangling)\s+(?:her|me)\b/gi,' strangulation '],
  [/\b(?:dec(?:reased)?\.?\s*FM|FM\s*(?:dec(?:reased)?|reduced|absent)|fetal movements?\s*(?:is |are |has |have )?(?:decreased|reduced|less|absent))\b/gi,' decreased fetal movement '],
  [/\b(?:LOF|leak of fluid|leaking water|water(?:s)? (?:has |have )?(?:broken|broke)|waters went)\b/gi,' rupture of membranes '],
  [/\bCP\b/gi,' chest pain '],[/\bPIH\b/gi,' gestational hypertension '],
  [/\b(?:post[ -]partum|since delivery|since giving birth|after giving birth)\b/gi,' postpartum '],
  [/\b(?:can't|cannot|couldn't) catch (?:my|her|his|your|a) breath|\b(?:trouble|difficulty|struggling) (?:with |to )?breath(?:e|ing)|\b(?:gasping(?: for air)?|air hunger|breathless|winded|breathing (?:hard|fast)|hard to breathe|can't get (?:enough )?air)\b/gi,' breathing difficulty '],
  [/\b(?:can't|cannot|unable to) (?:lie|lay) flat|\bwake(?:s)? up (?:gasping|breathless)|\b(?:orthopnea|paroxysmal nocturnal dyspnea)\b/gi,' breathing difficulty '],
  [/\b(?:chest (?:pressure|tightness|tight)|pressure (?:in|on) (?:my|her|the) chest)\b/gi,' chest pain '],
  [/\b(?:whole[- ]body|all over)(?:[^.;,]{0,18})(?:shak\w*|jerk\w*)|\b(?:shak\w*|jerk\w*)[^.;,]{0,18}(?:all over|whole[- ]body)|\beyes (?:have |had )?rolled back|\bfoaming (?:at|from) (?:the |her )?mouth|\bgrand mal\b/gi,' seizure '],
  [/\b(?:fit|spell)\b(?=[^.;]{0,45}(?:passed out|unconscious|jerk|shak))|\b(?:black(?:ed)? out|passed out)(?=[^.;]{0,45}(?:jerk|shak|stiffen))/gi,' seizure '],
  [/\b(?:talking funny|speech (?:is |was )?(?:garbled|slurred)|slurring (?:her |his |my )?words|can't get (?:my |her |the )?words out|cannot get (?:my |her |the )?words out|speaking gibberish|face (?:is )?(?:crooked|drooping)|smile (?:is )?uneven|mouth (?:is )?droop\w*)\b/gi,' stroke symptoms '],
  [/\b(?:arm|leg|face)\b[^.;,]{0,25}\b(?:weak\w*|numb\w*|droop\w*)|\b(?:weak\w*|numb\w*|droop\w*)\b[^.;,]{0,25}\b(?:arm|leg|face)\b/gi,' stroke symptoms '],
  [/\b(?:better off dead|wish(?:es)? (?:I|she|he) (?:was|were) dead|wish(?:es)? (?:I|she|he) (?:wouldn't|would not) wake up|go to sleep (?:and never wake up|forever)|don't want to be here anymore|do not want to be here anymore|don't want to go on|no reason to live)\b/gi,' suicidal thoughts '],
  [/\b(?:driv\w*|jump\w*)[^.;,]{0,20}(?:off|from|over)[^.;,]{0,15}(?:bridge|roof|window|cliff)|\b(?:hang|shoot|drown|kill|cut)\s+(?:myself|herself|himself)|\b(?:cut\w*|slit\w*) (?:my |her |his )?wrists?|\bwalk\w* into traffic\b/gi,' suicidal method thoughts '],
  [/\b(?:took|take|swallowed|swallow|ingested|ingest)\b[^.;,]{0,20}\b(?:handful|bunch|too many|all|whole bottle|bottle full|lots)\b[^.;,]{0,18}\b(?:pills|tablets|medic\w*)\b/gi,' overdose '],
  [/\b(?:rope|cord|umbilical cord|loop)\b[^.;]{0,35}\b(?:hang\w*|stick\w*|coming|came|fell|protrud\w*|pulsat\w*)\b[^.;]{0,35}\b(?:vagina|vaginal|between (?:my|her|the) legs)\b/gi,' cord prolapse '],
  [/\b(?:hands?|arm|belt)\b[^.;]{0,25}\b(?:around|squeez\w*|compress\w*)\b[^.;]{0,20}\b(?:neck|throat)\b|\b(?:squeez\w*|compress\w*)\b[^.;]{0,25}\b(?:neck|throat)\b/gi,' strangulation '],
  [/\b(?:blood|bleeding)\b[^.;]{0,22}\b(?:pour\w*|flood\w*|stream\w*|running down|won't stop|will not stop)\b|\b(?:pour\w*|flood\w*)\b[^.;]{0,22}\bblood\b|\b(?:pool of blood|bed full of blood)\b/gi,' heavy bleeding '],
  [/\b(?:passed out|blacked out|fainted|fainting|about to pass out)\b/gi,' syncope '],
  [/\b(?:baby|newborn|infant)\b[^.;,]{0,15}\b(?:blue|purple|not breathing|isn't breathing|is not breathing|limp|unresponsive)\b/gi,' infant respiratory arrest '],
 ];
 function normalize(input){
  let t=fold(typeof input==='string'?input:'');
  const lang=language(t);
  t=t.replace(/\b(every|q)\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/gi,(_,a,n)=>a+' '+({one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12}[n.toLowerCase()]));
  t=t.replace(/\b(\d{2,3}),(\d)\b/g,'$1.$2');
  // Meter HI/LO values cannot become homicidal-ideation tokens; only the local
  // meter/value span is replaced, so an independent HI/intent statement survives.
  t=t.replace(/\b(?:blood sugar|glucose|glucometer|glucose meter|meter|CBG|BGL|BG|FSBS|accu[- ]?check|fingerstick)\s*(?:is|of|reads?|reading|says|shows?|showing|=|:)??\s*["']?(HI|HIGH|LO|LOW)["']?\b/gi,(_,v)=>' glucose '+(/^HI/i.test(v)?'above meter range':'below meter range')+' ');
  t=t.replace(/\b(?:me|se) (?:esta )?(?:estrangul\w*|ahorc\w*)/gi,' strangulation ').replace(/\bme (?:esta )?(?:peg\w*|golpe\w*)/gi,' assault ');
  for(const [p,v]of ES)t=t.replace(p,v);
  if(lang.code==='es')t=t.replace(/\bsi\b(?!\s*(?:\/\s*hi|with|plan|intent))/gi,' yes ');
  t=t.replace(/\bpositive home (?:pregnancy )?test\b/gi,' positive pregnancy test ');
  for(const [p,v]of EN)t=t.replace(p,v);
  t=t.replace(/\b(?:not|isn't|is not) (?:answering|responding)(?: questions)?(?: well)?\b/gi,' altered mental status ');
  return t;
 }
 function enrich(f,current){
  const t=f.positiveText;
  f.language=language(f.raw);
  f.currentNarrative=current;
  const g=current.match(/\b(?:blood sugar|glucose|glucometer|meter|CBG|BGL|BG|BS|FSBS|fingerstick|accu[- ]?check)\s*(?:is|of|reads?|reading|says|shows?|showing|at|=|:)?\s*(\d+(?:\.\d+)?)\s*(mmol\/?L|mg\/?dL)?\b/i);
  const o=current.match(/\bO2\s*(?:is|at|=|:)?\s*(\d{2,3})\s*%/i); if(o)f.spo2=+o[1];
  if(g){f.glucose=+g[1];if(/^mmol/i.test(g[2]||''))f.glucose*=18;}
  f.glucoseHi=/glucose above meter range/i.test(current);f.glucoseLo=/glucose below meter range/i.test(current);
  const e=f.evidence={};
  e.breathing=!!f.kw.sob||f.postpartum&&/sleep(?:ing)? (?:sitting|sat) up|propped up (?:on|with) pillows/i.test(t)||/breathing difficulty|(?:can't|cannot|unable to) breathe|coughing up blood|hemoptysis|difficulty breathing/i.test(t);
  e.syncope=/syncope|faint|dizz|lightheaded|pale|diaphoret|clammy|cold sweat/i.test(t);
  e.ams=!!f.kw.ams||/not answering|not responding|unconscious|unresponsive|drowsy|hard to wake|difficult to wake|sleepy and|not acting (?:right|normal)|acting strange/i.test(t);
  e.seizure=!!f.kw.seizure||near(t,'stiff\\w*|rigid','shak\\w*|jerk\\w*')||near(t,'unconscious|syncope|black\\w* out','shak\\w*|jerk\\w*')||/(?:had a|having a) fit.*lost consciousness/i.test(t);
  e.stroke=/smile (?:is )?lopsided|(?:can't|cannot|unable to) lift (?:my |her |his )?(?:left |right )?arm|\bstroke\b|facial droop|face droop|one[- ]sided weakness|weakness on (?:my |her |his |the )?(?:left|right) side|unable to speak suddenly|slurred speech|aphasia|cannot move (?:my |her |his )?(?:left|right) (?:arm|leg)|sudden (?:loss of vision|vision loss)|(?:arm|leg) (?:won't|will not) (?:move|lift)/i.test(t);
  e.dfm=!!f.kw.dfm&&/decreased fetal movement|\bDFM\b|reduced fetal movement|less fetal movement/i.test(t);
  e.dvt=near(t,'\\b(?:calf|leg)\\b','\\b(?:swoll\\w*|swelling|tender\\w*|pain\\w*|warm)\\b')&&!/bilateral|both (?:ankles|legs)|ankles mildly/i.test(t);
  if(e.dvt)f.kw.leg=true;
  e.rom=!!f.kw.rom;
  e.regularCtx=!!f.kw.contractions&&/\bregular\b|every\s*\d|q\s*\d|cervical change|dilated|preterm labor|\bPTL\b/i.test(t);
  e.benignCtx=!!f.kw.contractions&&/irregular|mild|Braxton|go away|resolv\w*|comfortable between/i.test(t)&&!e.regularCtx&&!e.rom&&!f.kw.bleeding;
  if(e.benignCtx)delete f.kw.contractions;
  e.hypovolemia=(f.sbpMin<90)||(f.mapMin<65)||((f.hr>=110||e.syncope)&&!!f.kw.bleeding);
  e.shock=f.sbpMin<90||f.mapMin<65||!!f.kw.shock||/syncope/i.test(t)&&/pale|clammy|cold sweat|diaphoret/i.test(t);
  const slowPad=/pad[^.;]{0,30}(?:every|q)\s*(?:[2-9]|1[0-2])(?:\s*(?:to|-)\s*\d+)?\s*(?:hours?|hrs?|h)\b/i.test(t);
  e.normalLochia=f.postpartum&&/lochia|normal vaginal birth|normal (?:bleeding|discharge)|expected postpartum/i.test(t)&&(slowPad||/light|scant|decreas|getting lighter|normal (?:lochia|bleeding)|expected postpartum/i.test(t))&&!e.hypovolemia&&!/heavy|gushing|large clots|hemorrhag/i.test(t);
  if(e.normalLochia){delete f.kw.bleeding;delete f.kw.hemorrhage;delete f.kw.heavyBleed;}
  e.bleeding=!!f.kw.bleeding&&!e.normalLochia;
  e.heavy=(near(t,'\\b(?:pad|towel|bed)\\b','saturat\\w*|soak\\w*|drench\\w*|fill\\w*')||/heavy (?:vaginal )?bleed|hemorrhag|\bPPH\b|gushing|passing (?:large )?clots|bleeding through|pads? soak(?:ed|ing)|soaking[^.;]*pad|soaking (?:the )?bed|rapid blood loss/i.test(t))&&!slowPad&&!e.normalLochia;
  e.hemorrhage=f.qbl>=1000||(e.bleeding&&e.hypovolemia)||e.heavy;
  e.early=!!f.kw.ectopic||f.hcgPositive||f.ga<14||/(?:missed|late) (?:my |her |a )?period|period (?:is |was )?(?:late|missed)|first trimester|(?:one|two|three|[123]) months? pregnant/i.test(t);
  e.abdPain=!!f.kw.pelvicPain||/(?:one[- ]sided|unilateral|(?:left|right)[- ]sided|stomach|lower (?:belly|abdomen)|belly) pain|pain (?:in|on|under).*(?:shoulder|belly|abdomen)|severe (?:lower )?abdominal pain|shoulder.*(?:pain|hurt)/i.test(t);
  e.cord=!!f.kw.cordProlapse||near(t,'(?:umbilical )?cord','hang\\w*|coming out|fell out|protrud\\w*|outside|visible')||(e.rom&&near(t,'loop|string|rope','vagina|between (?:my |her |the )?legs|coming out'))||near(t,'\\b(?:cord|pulsat\\w*)\\b','vagin\\w*|between (?:my |her |the )?legs');
  e.trauma=/\bMVA\b|\bMVC\b|motor vehicle|trauma|\bfell\b|\bfall\b|assault|(?:partner|boyfriend|husband|girlfriend|spouse) (?:hit|hurt|punched|kicked|choked|strangled)|\b(?:partner|boyfriend|husband|girlfriend|spouse|wife|fiance|fiancee|ex|he|she|someone|somebody|they|a man|a woman|a person|father|dad|stepfather|brother|mother|family member)\b[^.;]{0,20}?\b(?:pushed|shoved|choked|strangled|smothered|slapped|grabbed|punched|kicked|hit|beat|attacked|threw|dragged|shook|bit|strangled)\b[^.;]{0,6}?\b(?:her|me|the patient|patient)\b|\b(?:was|got|been|being)\s+(?:pushed|shoved|choked|strangled|slapped|punched|kicked|beaten|beat up|attacked|dragged|grabbed|thrown (?:down|against|into|onto|to the (?:floor|ground)))\b(?!\s+(?:for|x)\s)|\bthrew her\b|strangulat|domestic violence|intimate partner violence|(?:punch|kick|hit|struck|strik|elbow|kne|slap|shov|push)\w*[^.;]{0,30}\b(?:abdomen|abdominal|belly|stomach)\b|(?:blow|trauma|injury) to (?:the |her |my )?(?:abdomen|belly|stomach)|(?:kicked|hit|punched|beaten|beat|slapped|shoved|pushed|attacked)[^.;]{0,25}\bby (?:her |my |the )?(?:partner|boyfriend|husband|spouse|girlfriend|ex)\b|pedestrian|(?:hit|struck) by (?:a )?(?:car|vehicle|truck)|(?:car|vehicle|auto|motorcycle|motorbike|moped|scooter|bike|bicycle|atv|truck) (?:crash|accident|collision|wreck)|rear[- ]ended|fender[- ]bender|\bwreck(?:ed)?\b|(?:was|been|involved|after|in|from|during) (?:(?:a|the) )?(?:car |vehicle |motor vehicle )?(?:crash|collision|wreck)\b|(?:thrown|fell|ejected|separated) (?:off|from) (?:a |her |the |my )?(?:motorcycle|motorbike|atv|four-wheeler|horse|dirt bike|scooter|bike|bicycle)|run over|(?:cyclist|bicyclist|biker) (?:hit|struck)|(?:hit|struck) (?:while|on) (?:a |her )?(?:bike|bicycle)|extricat\w*|steering wheel|dashboard|f[ae]ll\w* (?:\d+|ten|twelve|fifteen|twenty) (?:ft|feet|foot)|f[ae]ll\w* (?:off|from) (?:a |the |her )?(?:roof|balcony|second (?:story|floor)|2nd (?:story|floor)|ladder|tree)|eject\w*|airbag|rollover (?:crash|accident|collision)|(?:car|vehicle|truck|suv) rolled|penetrating|impaled|\bstab(?:bed|bing| wound)\b|gunshot|\bshot (?:in|at)\b|knife wound|\bIPV\b|abus(?:ive|ed|e) (?:by )?(?:partner|boyfriend|husband|spouse)|(?:partner|boyfriend|husband|spouse) (?:is )?abusive|chok(?:ed|ing) (?:me|her|him)|grab\w*[^.;]{0,25}neck/i.test(t);
  const mucosal='(?:lip\\w*|tongue|throat)[^.;,]{0,15}(?:swell\\w*|swollen|closing)|swollen (?:lip\\w*|tongue)';
  e.allergy=/anaphyla|throat (?:is )?(?:swell\w*|closing)|tongue (?:is )?(?:swell\w*|swollen)/i.test(t)
    ||near(t,'hives|urticaria|rash|itchy','wheez\\w*|breathing difficulty|shortness of breath|difficulty breathing|'+mucosal)
    ||near(t,mucosal,'wheez\\w*|breathing difficulty|shortness of breath|difficulty breathing');
  e.psychosis=/psychosis|psychotic|hallucinat|hearing voices|seeing things that are not there|delusion|baby (?:is |was )?(?:the devil|possessed)|voices?[^.;]*(?:tell|command|hurt|harm)|hear\w*[^.;]{0,20}voices|paranoi\w*[^.;]{0,35}(?:not slept|no sleep)|(?:not slept|no sleep)[^.;]{0,35}paranoi/i.test(t);
  e.overdose=/overdose|poison(?:ed|ing)|(?:took|swallowed|ingested)\s+(?:[3-9]|[1-9]\d+)\s+(?:pills|tablets)|(?:too much|all (?:my|her|his)) (?:insulin|meds)|took[^.;]{0,25}(?:too many|handful|bunch|bottle)[^.;]{0,20}(?:pill|tablet|medic)/i.test(t);
  const narrative=normalize(f.raw);
  e.intrusive=/intrusive|unwanted|ego[- ]dystonic/i.test(narrative)&&/no (?:intent|plan)|denies (?:any )?(?:intent|plan)|would never act|do not want to act|never act on/i.test(narrative)&&!e.psychosis&&!/plan to (?:harm|hurt|kill)|intend to|cannot be trusted|will (?:harm|hurt|kill)/i.test(t);
  const acronym=/\bSI\b(?!\s*(?:joint|pain))|\bHI\b(?=\s*(?:with|plan|intent|positive|present))|\b(?:SI\s*\/\s*HI|HI\s*\/\s*SI)\b|\b(?:endorses|reports|positive for|has)\s+HI\b/i.test(t)&&!(f.language.code==='es'&&!/\bSI\b|\bHI\b/.test(t));
  e.mental=/suicid|homicid|infanticid|filicid|(?:baby|infant|newborn|child)[- ]harm(?:ing)? (?:thought|ideat)|(?:kill(?:ing)?|hurt(?:ing)?|harm(?:ing)?) (?:myself|herself|himself|yourself|her partner|my partner)|ending (?:my|her|his|your) life|(?:want|wants|wish|wishes) to (?:die|be dead)|(?:harm|hurt|kill|smother|shake|drown|stab)[^.;,]{0,35}(?:baby|infant|child|newborn)|(?:don't|do not|does not|doesn't) want to live/i.test(t)||acronym||e.psychosis||e.overdose;
  // House policy (11 Nov 2026): narrow, never-below-urgent exceptions. Denials read from raw text; danger read from affirmed text.
  const rawT=String(f.raw||'');
  e.spanishOnly=/(?:speaks|speaking) (?:only )?spanish|spanish[- ]speak(?:ing|er)|(?:solo )?habla (?:solo )?espa(?:n|ñ)ol|non[- ]?english(?:[- ]speaking)?|monolingual|(?:only|primarily|monolingual) spanish|spanish only|limited english|\bLEP\b|(?:no|doesn't speak|does not speak|minimal) english|non-english/i.test(rawT);
  e.interpreterDocumented=/(?:professional|certified|qualified|hospital|staff|video|phone|telephon\w*|in-person|medical) interpreter|interpreter (?:services|line|used|present|id|#|number)|language line|(?:via|through|with|using) (?:an |a )?interpreter(?! (?:by|from) (?:her )?(?:family|husband|partner|son|daughter))/i.test(rawT)&&!/(?:family|husband|partner|boyfriend|son|daughter|child|friend)[^.;]{0,20}interpret/i.test(rawT);
  // B2: structured language/interpreter field is read first; free text can only add risk.
  const lf=f.languageField||{};
  // A non-English preference with interpreter use not yet recorded holds disposition (combine) instead of latching an escalation mid-entry.
  if(lf.preferred&&lf.preferred!=='en'&&lf.interpreter)e.spanishOnly=true;
  if(lf.preferred!=='en'&&(lf.interpreter==='family'||lf.interpreter==='none'))e.spanishOnly=true;
  if(lf.interpreter==='professional')e.interpreterDocumented=e.interpreterDocumented||!/(?:family|husband|partner|boyfriend|son|daughter|child|friend)[^.;]{0,20}interpret/i.test(rawT);
  else if(lf.interpreter==='family'||lf.interpreter==='none')e.interpreterDocumented=false;
  e.languageFieldUsed=!!(lf.preferred||lf.interpreter);
  e.lepNoInterpreter=e.spanishOnly&&!e.interpreterDocumented;
  const denyList=/(?:\bno\b|denies|denied|without|negative for)\s+(?:(?:any|active|suicidal|current|a|prior|previous|past|recent)\s+)*(?:plans?|intent|means|attempts?)(?:\s*(?:,|or|and|\/|nor)\s*(?:(?:any|prior|previous|past|recent)\s+)?(?:plans?|intent|means|attempts?))*/gi;
  // Raw text minus only explicitly negated clauses (clause ends at , ; . or but): a danger mentioned anywhere else always counts.
  const affirmedRaw=rawT.replace(denyList,' ').replace(/(?:\bno\b|denies|denied|without|negative for|not)\b[^,.;]*?(?=,|;|\.|\bbut\b|$)/gi,' ');
  const instabilityWords=/faint|syncop|dizz|light-?headed|pale|clammy|diaphor|confus|unresponsive|unconscious|seiz|short(?:ness)? of breath|chest pain|heavy bleed|soak|hemorrhag|hypotens|tachycard|unstable|shock/i;
  const passivePhrase=/passive (?:suicidal|SI\b|death wish)|better off dead|wish(?:es|ed)? (?:I|she|he) (?:was|were) dead|(?:wouldn't|would not|won't|will not) wake up|(?:don't|do not|doesn't|does not) want to (?:be here|live|be alive|wake up)|(?:want|wants|wish|wishes) to (?:die|be dead)|thoughts of (?:death|dying)|not wanting to (?:wake up|live|be alive|be here)|better off without (?:her|me)|wants? to disappear|wish(?:es)? (?:I|she) could disappear|tired of living|no reason to live/i;
  const denied=k=>new RegExp('(?:\\bno\\b|denies|denied|without|negative for)\\s+(?:(?:any|active|suicidal|current|a)\\s+)*(?:(?:plans?|intent|means)\\s*(?:,|or|and|\\/|nor)\\s*)*'+k,'i').test(rawT);
  const miUncertain=/unsure|uncertain|not sure|unclear|ambivalen|(?:can't|cannot|won't|will not) (?:say|answer|guarantee|promise)|refus|declin/i.test(rawT);
  const miDanger=/\bplan\b|plans to|intent|intend|method|means|gun|firearm|weapon|pills?\b|stockpil|attempt|rope|noose|(?:kill|hang|shoot|cut|drown) (?:my|her|him)self|end(?:ing)? (?:my|her|his) life|unable to (?:stay|keep)|(?:can't|cannot) (?:stay|keep|guarantee|promise)|unsure|uncertain|not sure|refus|declin|won't (?:say|answer)|homicid|\bHI\b|(?:harm|hurt|kill|smother|shake|drown)[^.;]{0,25}(?:baby|infant|newborn)|voices|psychos|overdose|cut(?:ting)? (?:my|her)self|self-?harm|drunk|intoxicat|under the influence|\bhigh\b|been drinking|drinking|drank|alcohol|\bbeers?\b|\bshots?\b|wine|vodka|liquor|using|substance|marijuana|cannabis|weed|pills? (?:to sleep|tonight)|\betoh\b|meth\b|methamphetamine|cocaine|heroin|fentanyl|using drugs|manic|mania|racing thoughts|grandios|access to|safety[- ]?plan/i;
  const miRaw=/no safety[- ]?plan|unable to (?:make|do|complete|agree to|create) (?:a )?safety[- ]?plan|(?:can't|cannot|won't|will not|refuses to) (?:make|do|agree to|create) (?:a )?safety[- ]?plan|safety[- ]?plan (?:is )?(?:not possible|impossible)|not slept|hasn't slept|haven't slept|has not slept|no sleep (?:for|in)|without sleep|up for \d+ days|attempted suicide|suicide attempt(?!s? (?:denied|none))|(?:gun|firearm|weapon)s? (?:at|in the) home/i;
  e.passiveSI=!e.lepNoInterpreter&&passivePhrase.test(rawT)&&denied('plan')&&denied('intent')&&!miUncertain&&!miRaw.test(rawT.replace(/(?:\bno\b|denies|denied|without)\s+(?:any\s+|prior\s+|previous\s+|past\s+)*(?:suicide\s+)?attempts?(?:\s+(?:or|and|,)\s+(?:plan|intent|means)s?)*/gi,' '))&&!instabilityWords.test(affirmedRaw)&&!(f.hr>=110)&&!(f.sbpMin<90)&&!miDanger.test(t)&&!miDanger.test(affirmedRaw)&&!e.psychosis&&!e.overdose&&!/homicid|\bHI\b/i.test(affirmedRaw);
  const preg=f.antepartum||f.ga>0||/pregnan/i.test(t);
  // House policy 11 Nov: trauma/IPV is urgent ONLY when every danger sign is explicitly denied.
  const SIGN={abd:'(?:(?:abdominal|abd|belly|stomach|pelvic|uterine)\\s+)?(?:pain|tenderness)',bleed:'(?:vaginal\\s+)?bleeding|\\bVB\\b',ctx:'contractions?|cramping|tightening',lof:'\\bLOF\\b|leak(?:ing|age)?\\s+(?:of\\s+)?fluid|fluid\\s+leak(?:ing|age)?|loss\\s+of\\s+fluid|\\bROM\\b|water\\s+break(?:ing)?',loc:'\\bLOC\\b|loss\\s+of\\s+consciousness|passing\\s+out|syncope'};
  const ALT=Object.values(SIGN).join('|');
  const traumaDeny=new RegExp('(?:\\bno\\b|denies|denied|without|negative for)\\s+(?:any\\s+)?(?:'+ALT+')(?:\\s*(?:,|or|and|\\/|nor)\\s*(?:no\\s+|any\\s+)?(?:'+ALT+'))*','gi');
  const denials=(rawT.match(traumaDeny)||[]).join(' | ');
  const deniedSign=k=>new RegExp(SIGN[k],'i').test(denials);
  const notPregnant=/not (?:currently )?pregnant|non-?pregnant/i.test(rawT);
  const fmNormal=/(?:baby|fetus|fetal movements?|\bFM\b)[^.;,]{0,12}(?:moving|movements?)?\s*(?:well|normal(?:ly)?|active(?:ly)?|good|present|\+)|(?:normal|good|active|positive|\+)\s*(?:fetal movements?|\bFM\b)|\+\s*FM/i.test(rawT);
  const fmNA=f.postpartum||notPregnant||(f.ga>0&&f.ga<20);
  const ipvLike=/\bIPV\b|intimate partner|domestic|partner|boyfriend|husband|spouse|girlfriend|abus|assault|hit me|hit her|punch|kick|slap/i.test(rawT);
  const safetyDenied=!/(?:not|isn't|is not|un)\s*safe|afraid|scared/i.test(rawT)&&/feels? safe|safe (?:at home|to (?:go|return) home|tonight|now)|no (?:immediate |current |ongoing )?(?:safety )?(?:threat|danger)|denies (?:any )?(?:immediate |current )?(?:safety )?(?:threat|danger)|abuser (?:is )?not present/i.test(rawT);
  const documentedStable=/hemodynamically stable|vitals? (?:are |were |remain\w* )?(?:stable|normal|WNL|within normal limits)|stable vitals|normal vitals/i.test(rawT)&&!/unstable|not (?:hemodynamically |clinically )?stable|vitals? (?:are |were )?not (?:stable|normal)/i.test(rawT);
  const stabilityDocumented=(/hemodynamically stable|vitals? (?:are |were |remain\w* )?(?:stable|normal|WNL|within normal limits)|stable vitals|normal vitals|no (?:signs of )?instability/i.test(rawT))&&!/unstable|not (?:hemodynamically |clinically )?stable|vitals? (?:are |were )?not (?:stable|normal)/i.test(rawT);
  const traumaAffirmed=rawT.replace(traumaDeny,' ').replace(/(?:\bno\b|denies|denied|without|negative for|not)\b[^,.;]*?(?=,|;|\.|\bbut\b|$)/gi,' ');
  // Spanish/interpreter-limited trauma cannot establish absent danger signs: stays immediate.
  e.traumaDanger=e.trauma&&(instabilityWords.test(traumaAffirmed)||/strangulat|chok(?:ed|ing)|neck|weapon|\bgun\b|firearm|knife|\bstab(?:bed|bing| wound)?\b|\bshot\b|threat\w* to kill|\bLOC\b|consciousness|knocked out|passed out|black(?:ed)? out|slurr|intoxicat|drunk|abdom\w* (?:pain|tender)|belly pain|stomach pain|bleed|contraction|cramp|tighten|(?:baby|fetal|fetus)[^.;]{0,15}(?:movement|moving|kicks?)[^.;]{0,15}(?:unknown|unsure|not (?:felt|sure)|less|decreas|reduc|absent|stopped)|fluid|leak|water broke|(?:is|was) (?:here|outside)|danger/i.test(traumaAffirmed)||f.hr>=110||f.sbpMin<90||f.language.code==='es'||!!f.language.interpreterRecommended||!!f.language.unsupported||/strangulat|chok(?:ed|ing)|neck compression|(?:hands?|arm|cord|rope) (?:around|on) (?:her|my|the) (?:neck|throat)|weapon|\bgun\b|firearm|knife|\bstab(?:bed|bing| wound)?\b|\bshot\b|threat\w* to kill|(?:is|was) (?:here|outside|in the (?:building|waiting room)|on (?:his|her|the) way)|(?:in|immediate) danger|not safe (?:right )?now|\bLOC\b|loss of consciousness|lost consciousness|knocked out|passed out|unconscious|black(?:ed)? out|slurr|intoxicat|drunk|(?:baby|fetal|fetus)[^.;]{0,15}(?:movement|moving|kicks?)[^.;]{0,15}(?:unknown|unsure|not (?:felt|sure)|less|decreas|reduc|absent|stopped)/i.test(t)||e.syncope||e.ams||e.seizure||e.shock||e.hemorrhage||e.breathing||!!f.kw.unstable||e.abdPain||/abdom|belly|stomach|pelvi/i.test(t)&&/pain|tender|hurt|cramp/i.test(t)||e.bleeding||e.dfm||e.rom||e.regularCtx||!!f.kw.contractions||!!f.kw.pretermLabor||preg&&/contraction|cramp|tighten/i.test(t));
  // Doc F1: high-risk mechanism is IMMEDIATE even when stable. F4: partner present/unsafe to go home. F7: sexual assault, impaired/unreliable history.
  const mph=(traumaAffirmed.match(/(\d{2,3})\s*(?:mph|miles per hour)/i)||[])[1];
  const fallFt=(traumaAffirmed.match(/f[ae]ll\w*\s+(?:about |approximately |~)?(\d+)\s*(?:ft|feet|foot|')/i)||traumaAffirmed.match(/f[ae]ll\w*[^.;]{0,40}?\b(\d+(?:\.\d+)?)\s*(?:-\s*)?(?:ft|feet|foot|')(?:\b|\s)/i)||[])[1];
  e.ladderFall=e.trauma&&/\bladder\b/i.test(traumaAffirmed)&&/f[ae]ll|slip|came off|off (?:a|the) ladder/i.test(traumaAffirmed);
  e.fallHeightUnknown=/(?:height|how (?:high|far)) (?:is |was )?(?:unknown|not known|unclear)|unknown height|(?:can't|cannot|could not|couldn't|unable to|does not|doesn't) (?:say|tell|recall|remember|know) (?:how (?:high|far)|the height)/i.test(rawT);
  e.landedOnAbdomen=/(?:landed|fell|hit) (?:on|onto) (?:her |my |the )?(?:abdomen|belly|stomach|tummy)/i.test(traumaAffirmed);
  e.fallHeightStated=fallFt!==undefined;
  const unrestrained=/unrestrained|unbelted|no seat ?belt|not (?:wearing|using) (?:a |her |my )?seat ?belt|without (?:a |her )?seat ?belt|(?:car seat|child seat) (?:not secured|unsecured|not buckled)|unsecured (?:car|child) seat/i.test(rawT)&&!/(?:was|were) restrained|wearing (?:a |her )?seat ?belt/i.test(rawT.replace(/not (?:wearing|using) (?:a |her |my )?seat ?belt/gi,''));
  e.highRiskMechanism=e.trauma&&(+mph>=40||+fallFt>10||unrestrained||(e.ladderFall&&e.fallHeightUnknown)||e.landedOnAbdomen||/seat ?belt (?:mark|sign|bruis\w*|abrasion|injur\w*)|seat ?belt[^.;]{0,25}(?:across|over|on) (?:the |her )?(?:abdomen|belly|stomach|uterus)|lap belt[^.;]{0,25}(?:across|over|on) (?:the |her )?(?:abdomen|belly|uterus)|(?:abdominal|belly|stomach) (?:bruis\w*|ecchymos\w*|contusion)|bruis\w*[^.;]{0,20}(?:abdomen|belly|stomach|across (?:the |her )?(?:abdomen|belly))|high[- ]speed|highway speed|on the (?:highway|freeway|interstate|expressway)|significant speed|intrusion|extricat|trapped in (?:the )?(?:car|vehicle)|pinned|eject|(?:death|died|dead|fatality|killed)[^.;]{0,25}(?:same )?(?:vehicle|car|scene)|(?:passenger|driver|occupant|other person)[^.;]{0,25}(?:died|dead|killed)|motorcycle|motorbike|\batv\b|four-wheeler|horse|dirt bike|(?:thrown|launched|ejected|separated) (?:off|from)|run over|ran over|(?:pedestrian|cyclist|bicyclist|biker)[^.;]{0,30}(?:hit|struck|thrown|impact)|steering wheel|dashboard|f[ae]ll\w* (?:off|from) (?:a |the |her )?(?:roof|balcony|second (?:story|floor)|2nd (?:story|floor))|rollover|(?:car|vehicle|truck|suv) rolled|airbags? (?:deploy|went off)|airbag deployment|pedestrian|(?:hit|struck) by (?:a )?(?:car|vehicle|truck)|(?:punch|kick|hit|struck|strik|elbow|kne|blow)\w*[^.;]{0,30}\b(?:abdomen|abdominal|belly|stomach)\b|(?:blow|trauma|injury) to (?:the |her |my )?(?:abdomen|belly|stomach)|f[ae]ll\w* (?:on|onto) (?:her |my |the )?(?:abdomen|belly|stomach)|penetrat|impaled|\bstab(?:bed|bing| wound)\b|gunshot|\bshot\b|strangul|chok(?:ed|ing)|neck compression|(?:hands?|arm|cord|rope) (?:around|on) (?:her|my|the) (?:neck|throat)/i.test(traumaAffirmed));
  e.partnerDanger=/(?:partner|abuser|boyfriend|husband|spouse|girlfriend|\bex\b|the person who hurt her|he|she)\s+(?:is\s+|was\s+|remains\s+|still\s+)?(?:present|here|in (?:the )?(?:room|exam room|building|waiting room|hallway|lobby)|at (?:the )?bedside|with her|with me|accompanying|coming|on (?:his|her|the) way|outside)|(?:partner|abuser|boyfriend|husband|spouse) (?:present|at bedside|in room)|accompanied by (?:her |my |the )?(?:partner|boyfriend|husband|spouse|abuser)|knows (?:she|i) (?:is|am) here/i.test(rawT);
  e.unsafeHome=/afraid to go home|scared to go home|afraid (?:of|for) (?:my|her) (?:life|safety)|(?:not|isn't|is not|un)\s*safe (?:to (?:go|return) )?(?:home|at home|tonight)|no safe place|nowhere (?:safe|to go)|(?:can't|cannot) go home/i.test(rawT);
  e.partnerControl=/(?:partner|boyfriend|husband|spouse|he)\s+(?:won't|will not|refuses to|would not|wouldn't) leave|(?:can't|cannot|could not|couldn't|unable to) (?:be )?separat|(?:partner|boyfriend|husband|spouse|he) (?:answers|answered|answering|speaks|spoke|talks|talked) for her|answering for her|won't let her (?:speak|talk|answer)|(?:answers?|answered|answering|responds?|responded|responding|speaks?|speaking|spoke|talks?|talking)(?: all)?(?: (?:of )?the)?(?: questions?)? for (?:her|the patient|patient)\b|does (?:all )?(?:of )?the talking|(?:won't|will not|doesn't|does not|didn't|did not|wouldn't|would not|refuses to|won't|not) (?:let|allow|letting|allowing) (?:her|the patient|patient) (?:to )?(?:speak|talk|answer|respond|be alone|be seen alone)|(?:partner|boyfriend|husband|spouse|he)\s+(?:won't|will not|refuses to|would not|wouldn't) step out|partner answers for her/i.test(rawT+' '+t);
  e.partnerPresent=/(?:partner|boyfriend|husband|spouse|significant other|\bFOB\b|father of (?:the )?baby)\s+(?:is\s+|was\s+)?(?:present|here|in (?:the )?(?:room|exam room)|at (?:the )?bedside|with her|accompanying)|accompanied by (?:her |the )?(?:partner|boyfriend|husband|spouse|significant other|FOB)|(?:partner|boyfriend|husband|spouse|FOB) (?:present|at bedside|in room)/i.test(rawT);
  e.partnerDanger=e.partnerDanger||e.unsafeHome||e.partnerControl;
  e.sexualAssault=/sexual(?:ly)? assault|\brape|\bSANE\b|forced (?:sex|intercourse)/i.test(traumaAffirmed);
  e.unreliableHistory=/unreliable history|unable to (?:give|provide) (?:a )?(?:reliable )?history|poor historian|impaired|under the influence|intoxicat|drunk|\bhigh on\b/i.test(traumaAffirmed);
  if(e.trauma&&(e.highRiskMechanism||e.partnerDanger||e.sexualAssault||e.unreliableHistory))e.traumaDanger=true;
  e.ipv=ipvLike;
  if(e.trauma&&e.lepNoInterpreter)e.traumaDanger=true;
  e.stableTrauma=e.trauma&&!e.traumaDanger&&!instabilityWords.test(traumaAffirmed)&&!/strangulat|chok|neck|weapon|\bgun\b|knife|threat|\bLOC\b|consciousness|bleed|contraction|cramp|fluid|leak|abdom\w* (?:pain|tender)|belly pain|danger|unsafe|afraid|scared/i.test(traumaAffirmed)&&deniedSign('abd')&&deniedSign('bleed')&&(deniedSign('ctx')||notPregnant)&&(fmNormal||fmNA)&&(deniedSign('lof')||f.postpartum||notPregnant)&&deniedSign('loc')&&stabilityDocumented&&(!ipvLike||safetyDenied);
  e.stablePUL=!e.lepNoInterpreter&&e.early&&/\bPUL\b|pregnancy of unknown location|unknown location/i.test(rawT)&&documentedStable&&!/ectopic|methotrexate|\bMTX\b|shoulder|syncop|faint|dizz|lightheaded|severe|unilateral|one[- ]sided|(?:left|right)[- ]sided|heavy|soak|clots|hemorrhag|tachycard|hypotens|peritoneal|rebound|guarding|free fluid/i.test(t+' '+affirmedRaw)&&!instabilityWords.test(affirmedRaw)&&!e.abdPain&&!e.syncope&&!e.hemorrhage&&!e.heavy&&!e.shock&&!e.ams&&!f.kw.unstable&&!(f.hr>100)&&!(f.sbpMin<90);
  e.dka=/\bDKA\b|ketoacidos/i.test(t)||((f.glucose>=200||f.glucoseHi||f.kw.diabetes)&&/ketone|fruity|acetone|Kussmaul/i.test(t))||((f.glucose>=250||f.glucoseHi)&&(/vomit|abdominal pain|breathing difficulty|drowsy|confus/i.test(t)))||(f.kw.diabetes&&/vomit/i.test(t)&&/missed insulin|no insulin|cannot keep insulin/i.test(t));
  return f;
 }
 const QUESTIONS=[
  {id:'breathing',text:'Chest pain, trouble breathing, collapse, or a baby not breathing?',urgency:'immediate'},
  {id:'neuro',text:'Seizure, stroke symptoms, severe headache/vision change, or severe BP?',urgency:'immediate'},
  {id:'bleeding',text:'Heavy bleeding, fainting, cold/clammy appearance, or shock?',urgency:'immediate'},
  {id:'cord',text:'Cord seen/felt outside the vagina or an acute delivery emergency?',urgency:'immediate'},
  {id:'behavior',text:'Self/other/infant-harm intent, overdose, hallucinations, or inability to stay safe?',urgency:'immediate'},
  {id:'metabolic',text:'Dangerous glucose reading with illness or altered awareness?',urgency:'immediate'},
  {id:'allergy',text:'Throat/tongue swelling, wheeze with hives, or severe allergic reaction?',urgency:'immediate'},
  {id:'trauma',text:'Recent trauma, assault, neck compression or IPV? Ask privately when safe.',urgency:'immediate'},
  {id:'fetal',text:'Reduced fetal movement, fluid leaking, or regular preterm contractions?',urgency:'urgent'},
 ];
 // Doc F2/F4/F7 explicit trauma workup and IPV steps (no reference to non-existent trauma content).
 function traumaText(f,e){
  const ga=f.ga,parts=[];
  if(!(ga>0&&ga<20)&&!f.postpartum)parts.push('≥20 weeks: continuous fetal heart rate and contraction monitoring for at least 4 hours, even after minor trauma. Extend monitoring for contractions, uterine tenderness, bleeding, ROM, abnormal tracing or high-risk mechanism. Check Rh type; give anti-D if Rh-negative per protocol. Consider Kleihauer-Betke to quantify fetomaternal hemorrhage and dose anti-D.');
  if(!(ga>=20)||f.postpartum)parts.push('Under 20 weeks/postpartum: maternal evaluation now; document fetal heart tones when gestational age permits; Rh status if pregnant.');
  if(e.sexualAssault)parts.push('Sexual assault: route to SANE/forensic examination now.');
  if(e.ipv||e.partnerDanger||e.sexualAssault)parts.push('Ask alone, without the partner or family present; use a professional interpreter, never family. Ask: Is the person who hurt you here now? Are you safe to go home tonight? Has this person ever choked/strangled you, threatened to kill you, or used or had access to a gun? If the partner is present, she is unsafe to go home, or any answer is yes: IMMEDIATE, with social work/advocate and safety planning now. Reporting follows Texas law and CSM policy: report suspected abuse of a child (Tex. Fam. Code §261.101) or of an elderly or disabled adult (Tex. Hum. Res. Code ch. 48); provide the family-violence information notice (Tex. Fam. Code §91.003). Competent-adult IPV is not otherwise mandatory to report; confirm with CSM legal/social work.');
  else parts.push('Ask privately and nonjudgmentally; complete a safety assessment.');
  return ' '+parts.join(' ');
 }
 function assess(f,options={}){
  const t=f.positiveText,e=f.evidence,alerts=[];
  const add=(id,urgency,text)=>alerts.push({id,urgency,level:urgency==='immediate'?'red':'amber',text:(urgency==='immediate'?'IMMEDIATE CLINICAL ESCALATION: ':'CLINICAL ASSESSMENT: ')+text});
  if(e.partnerControl&&!e.trauma&&!e.unsafeHome)add('IPV_SAFETY','immediate','Partner will not leave, she cannot be separated, or the partner answers for her: IMMEDIATE, with social work/advocate and private safety screening (ACOG CO 518).');
  if(e.partnerPresent&&!e.partnerControl)add('PARTNER_RESCREEN','prompt','Required step (non-escalating): Partner present: separate her from the partner (for example, for a urine sample or exam) and rescreen privately with a professional interpreter if needed. If she cannot be separated, the partner will not leave, or the partner answers for her: IMMEDIATE, with social work/advocate (ACOG CO 518).');
  if(e.ladderFall&&!e.fallHeightStated&&!e.highRiskMechanism)alerts.push({id:'FALL_HEIGHT_REQUIRED',urgency:'prompt',level:'amber',text:'Required step: document the fall height and whether she landed on her abdomen. IMMEDIATE if >10 ft, from a roof, balcony or second story, onto the abdomen, or the height cannot be obtained.'});
  if(e.lepNoInterpreter)alerts.push({id:'INTERPRETER_REQUIRED',urgency:'prompt',level:'amber',blocksPolicyDowngrade:true,text:'Spanish-only patient without a documented professional interpreter (house rule): use and document a professional interpreter (never family). Policy downgrades to URGENT (trauma, passive SI, stable PUL) do not apply until then; those stay IMMEDIATE.'});
  if(e.unsafeHome&&!e.trauma)add('IPV_SAFETY','immediate','Unsafe to go home / afraid for safety: immediate social work/advocate and safety planning now. '+'Ask alone, without the partner or family present; use a professional interpreter, never family. Ask: Is the person who hurt you here now? Are you safe to go home tonight? Has this person ever choked/strangled you, threatened to kill you, or used or had access to a gun? If the partner is present, she is unsafe to go home, or any answer is yes: IMMEDIATE, with social work/advocate and safety planning now. Reporting follows Texas law and CSM policy: report suspected abuse of a child (Tex. Fam. Code §261.101) or of an elderly or disabled adult (Tex. Hum. Res. Code ch. 48); provide the family-violence information notice (Tex. Fam. Code §91.003). Competent-adult IPV is not otherwise mandatory to report; confirm with CSM legal/social work.');
  if(e.passiveSI&&!e.intrusive)add('PASSIVE_SI','urgent','Clinician (or behavioral-health) suicide-risk assessment NOW (≤15 min), during this visit, using a validated tool (ASQ or C-SSRS). She does not leave before it is done. Stay nearby and remove means from the room per policy. Nonpunitive and nonjudgmental: having these thoughts is common and treatable. Document the safety plan, means/firearm counseling and follow-up. Any plan, intent, preparatory behavior, any prior suicide attempt (unless explicitly denied), means access, psychosis, mania, intoxication, infant-harm intent or inability to safety-plan is IMMEDIATE.');
  if(e.mental&&!e.intrusive&&!e.passiveSI)add('MENTAL_HEALTH','immediate','Possible self/other/infant harm, overdose or psychosis: immediate clinician risk assessment, then risk-tailored response. For uncertain/high risk maintain capable supervision and infant safety; no reflex police involvement or punitive assumptions.');
  if(e.intrusive)add('INTRUSIVE_THOUGHTS_SUPPORT','prompt','Unwanted intrusive thoughts with stated absence of intent are not synonymous with psychosis or intent to harm. Arrange a named clinician assessment today, documented safety plan/return instructions and clinician-set follow-up. Clarify safety and escalate if intent, loss of control or psychosis appears; no punitive assumptions.');
  if(e.overdose)add('OVERDOSE','immediate','Possible toxic ingestion. Emergency/poison assessment now; do not wait to finish screening or search for a card.');
  if(e.seizure)add('SEIZURE','immediate','Possible seizure/convulsion. Activate emergency response and OB evaluation when relevant.');
  if(e.stroke)add('STROKE','immediate','Possible acute stroke/neurologic deficit. Activate emergency assessment now.');
  if(/worst headache|thunderclap|headache[^.;,]{0,12}worst (?:of|in) (?:my |her )?life|worst (?:\w+ )?headache/i.test(t)||(f.obContext&&!(f.ga<20)&&/\bsevere (?:\w+ )?headache|headache[^.;,]{0,12}(?:severe|10\/10)/i.test(t))||(f.obContext&&f.kw.headache&&f.kw.visual)||(f.htn&&f.sfSymptoms.length&&f.obContext))add('NEURO_OB_WARNING','immediate','Neurologic/obstetric warning symptoms need emergency assessment, even with one normal BP.');
  if(f.severeBP)add('SEVERE_BP','immediate','SBP >=160 OR DBP >=110: immediate clinician assessment and repeat measurement per adopted pathway; a denial does not negate a dangerous reading.');
  if(e.hemorrhage)add('HEMORRHAGE','immediate','Heavy bleeding, QBL >=1000 mL, or bleeding with hypovolemia: activate emergency hemorrhage assessment.');
  if(f.kw.abruption||(f.antepartum&&(f.ga>=20||f.labor)&&(/painful vaginal bleeding.*(?:rigid|hard)|severe abdominal pain.*vaginal bleeding|constant abdominal pain.*hard uterus/i.test(t))))add('ABRUPTION','immediate','Possible abruption/acute obstetric abdominal emergency; assess maternal/fetal status now.');
  if(e.cord)add('CORD_PROLAPSE','immediate','Possible cord prolapse: activate emergency OB response now.');
  if(e.dfm)add('FETAL_MOVEMENT','urgent','Reduced/absent fetal movement: obstetric/fetal assessment, not reassurance from a card match.');
  if(e.breathing||f.kw.pe||f.spo2<95)add('CARDIOPULMONARY','immediate','Chest pain, respiratory difficulty or hypoxia: emergency cardiopulmonary assessment; symptoms alone do not diagnose PE.');
  else if(e.dvt)add('DVT_EVALUATION','urgent','Possible unilateral leg clot: in-person evaluation; absence of chest symptoms does not exclude DVT.');
  if(f.kw.sepsis||(f.infectionPicture&&f.sepsisFlags.length)||(f.tempC<36&&(f.hr>=110||f.sbpMin<90||e.ams))||(f.febrile&&(e.ams||e.shock||e.syncope&&/pus|purulen|wound|incision|uterine tenderness/i.test(t))))add('SEPSIS','immediate','Possible sepsis/infection with systemic danger signs; activate emergency assessment. Fever is not required.');
  if(e.shock)add('SHOCK','immediate','Hypotension, collapse or possible shock needs immediate emergency assessment regardless of pregnancy context.');
  if(e.allergy)add('ANAPHYLAXIS','immediate','Possible anaphylaxis/airway compromise; activate emergency response and adopted pathway.');
  if(e.trauma&&!e.stableTrauma)add('TRAUMA_IPV','immediate','Trauma/IPV with a danger sign, high-risk mechanism (crash with speed/intrusion/ejection/rollover/airbag, pedestrian struck, blow/kick/punch or fall onto the abdomen, penetrating injury, strangulation ever), partner present/unsafe to go home, sexual assault, intoxication/unreliable history, or without explicit denial of danger signs: immediate in-person assessment.'+traumaText(f,e));
  if(e.trauma&&!e.stableTrauma)alerts[alerts.length-1].traumaBasis=e.traumaDanger?'danger':'unconfirmed';
  else if(e.trauma)add('TRAUMA_IPV','urgent','Stable trauma or IPV disclosure with danger signs explicitly denied and no high-risk mechanism (house policy): in-person assessment.'+traumaText(f,e));
  if(f.postpartum&&(f.febrile||(f.kw.chills&&f.kw.foulLochia)))add('POSTPARTUM_FEVER','urgent','Postpartum fever/infection symptoms: OB assessment and sepsis screen.');
  if(e.stablePUL)add('ECTOPIC_STABLE_PUL','urgent','OB/GYN clinician assessment NOW (≤15 min). If discharged: repeat quantitative hCG in 48 hours, with TVUS as indicated, under a named owner who has the result. Written ectopic return precautions: worsening or one-sided pain, shoulder pain, fainting or dizziness, or bleeding soaking a pad an hour. Free fluid, peritoneal signs, more than mild pain, HR >100, SBP <90, dizziness/syncope or heavy bleeding is IMMEDIATE. Spanish return precautions (provisional): Regrese de inmediato si tiene dolor fuerte o de un solo lado, dolor en el hombro, se desmaya o se marea, o si el sangrado empapa una toalla sanitaria en una hora.');
  else if(e.early&&(f.kw.ectopic||e.abdPain||f.kw.unstable||/syncope|fainting|shoulder tip pain/i.test(t)))add('ECTOPIC','immediate','Ectopic/early-pregnancy concern with unassessed stability: immediate OB/GYN stability/location evaluation, not a confirmed ectopic or rupture diagnosis. Clinician-established stable pregnancy of unknown location/light spotting instead needs an owned assessment/follow-up plan; no automatic downgrade from narrative wording alone.');
  if(e.dka)add('DKA','immediate','Possible ketoacidosis/metabolic emergency, including pregnancy-associated euglycemic DKA. Emergency assessment now; no diagnosis from glucose alone.');
  else if(f.glucoseHi||f.glucose>=400)add('HYPERGLYCEMIA','immediate','Very high glucose/meter HI needs immediate clinical assessment; HI is a meter value here, not homicidal ideation.');
  if(f.glucoseLo||f.glucose<54||f.glucose<70&&(e.ams||/sweat|shak|clammy/i.test(t)))add('HYPOGLYCEMIA','immediate','Low glucose/meter LO with severe value or impaired awareness: emergency assessment now.');
  else if(f.glucose<70)add('HYPOGLYCEMIA','urgent','Low glucose requires clinical evaluation.');
  if(f.kw.arrestCard||/pulseless|unresponsive|respiratory arrest|not breathing/i.test(t))add('COLLAPSE','immediate','Maternal or infant collapse/breathing emergency: activate emergency response now.');
  if(f.kw.cat3||f.kw.shoulder||f.kw.uterineRupture)add('OB_EMERGENCY','immediate','Acute delivery/fetal emergency: activate immediate OB response.');
  if(e.rom&&(f.ga<37||/\bPPROM\b/i.test(t))&&(f.kw.contractions||f.kw.pretermLabor))add('OB_EMERGENCY','immediate','Preterm membrane rupture with contractions: immediate obstetric assessment; do not wait for completion of the screen.');
  if(e.rom)add('ROM','urgent','Possible membrane rupture: obstetric assessment; preterm status/contractions, infection, bleeding or abnormal fluid increase concern.');
  if(f.antepartum&&f.ga<37&&(e.regularCtx||f.kw.pretermLabor))add('PRETERM_LABOR','urgent','Regular preterm contractions/possible labor: OB assessment.');
  if(e.rom&&/green|meconium|brown fluid/i.test(t))add('OB_EMERGENCY','immediate','Membrane rupture with abnormal fluid: immediate obstetric assessment.');
  if(f.antepartum&&f.ga>=20&&e.bleeding&&!e.regularCtx&&!e.trauma&&!e.dfm)add('OB_BLEEDING',/bright red|ongoing|continuous|significant/i.test(t)?'immediate':'urgent','Current antepartum bleeding needs obstetric assessment; confirm severity and maternal/fetal status.');
  if(f.antepartum&&f.ga>=20&&e.bleeding&&(e.regularCtx||e.trauma||e.dfm))add('OB_BLEEDING','immediate','Antepartum bleeding with contractions, trauma or reduced movement: immediate maternal/fetal assessment.');
  if(f.kw.pyelo&&/dysuria|\bUTI\b/i.test(t)&&!/pyelo|flank pain|CVA|renal colic/i.test(t))add('UTI_EVALUATION','urgent','Isolated urinary symptoms: UTI evaluation; assess pregnancy, fever/flank pain and systemic illness. Do not infer pyelonephritis.');
  if(f.language.interpreterRecommended&&!f.language.unsupported)add('LANGUAGE_SUPPORT','prompt','Spanish keyword support is limited, not a full translation. Use a qualified interpreter and clinician for complete assessment; never delay rescue.');
  if(f.language.unsupported)add('LANGUAGE_HANDOFF','urgent','Unsupported/uncertain complaint language: clinician and qualified interpreter handoff. Do not label this a negative safety screen or delay rescue for translation.');
  const answers=options.screen||{};
  for(const q of QUESTIONS)if(answers[q.id]==='yes')add('SCREEN_'+q.id.toUpperCase(),q.urgency,'Positive structured red-flag answer: '+q.text+' Do not delay rescue to complete remaining questions.');
  const complete=QUESTIONS.every(q=>answers[q.id]==='yes'||answers[q.id]==='no');
  const urgency=alerts.some(a=>a.urgency==='immediate')?'immediate':alerts.some(a=>a.urgency==='urgent')?'urgent':alerts.length||!complete?'prompt':'routine';
  const disposition=urgency==='immediate'?'EMERGENT':urgency==='urgent'?'URGENT':!complete?'CLINICIAN_REVIEW_REQUIRED':urgency==='prompt'?'PROMPT_CLINICAL_REVIEW':'ROUTINE_AFTER_CLINICIAN_SCREEN';
  return {urgency,disposition,alerts,screen:{required:true,complete,questions:QUESTIONS,answers},language:f.language,disclaimer:'Preliminary clinician handoff, not clearance. A negative text screen cannot exclude an emergency; structured questions never delay rescue.'};
 }
 const api={normalize,language,enrich,assess,QUESTIONS};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SafetyVocabulary=api;
})(typeof self!=='undefined'?self:this);
