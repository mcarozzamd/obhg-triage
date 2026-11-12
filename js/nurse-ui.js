/* Nurse complaint-tree UI (LIVE CANDIDATE: English-only UI; the ES dictionary is dormant and unreachable unless NURSE_UI_LANGS is set by a test harness). One language per page: every string on a page comes
 * from ONE dictionary (EN or ES). SBAR copy text is English for the chart (Doc NF17).
 * Uses only getElementById / innerHTML / element listeners (no document-level listeners). */
(function(root){
 'use strict';
 const N=root.NurseFlow,PR=root.NurseProtocols,NC=root.NurseCards,D=root.DisplayNames,C=root.CONTENT;
 const dhtml=it=>D&&typeof D.html==='function'?D.html(it):String(it&&it.html||''); // live display-names.js has no html(); use the card html as the physician app does
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const STR={
  en:{title:'Nurse triage',test:'Decision support only: not unit policy. Emergency? Activate rescue now. Do not enter names, MRNs or dates of birth.',back:'Back',next:'Next',yes:'Yes',no:'No',unsure:'Unsure',none:'None of these',noRest:'All others No',
   hpi:'Free text (optional, any time): can only raise acuity. No names, MRNs or dates of birth.',
   rescue:'Emergency? Activate rescue now. Never wait to finish this form.',
   gate:'Act now: is any of these happening?',gateHit:'EMERGENT: activate rescue now.',toResult:'Go to result / SBAR',contOpt:'Continue (optional)',
   gateLock:'A positive answer can only be changed through documented clinician reassessment.',
   vitals:'Vital signs',sbp:'SBP',dbp:'DBP',hr:'Maternal pulse (not FHR)',hrHint:'Maternal pulse: palpate or pulse oximeter; not the FHR.',spo2:'SpO2 %',nm:'Not measured',nmHold:'Not measured or invalid holds disposition; never delays rescue.',
   plang:'Patient’s preferred language',pen:'English',pes:'Spanish',pother:'Other',interp:'Interpreter',ipro:'Professional interpreter (record ID)',iqb:'Qualified bilingual clinician (CSM-qualified)',ifam:'Family, friend, partner or minor',inone:'None',
   interpNote:'Family/partner/minor interpreting never counts as professional and makes IPV/SI screening not private.',
   status:'Pregnancy status',su:'Unknown',slt:'Less than 20 weeks',sge:'20 weeks or more',spp:'Postpartum',sppNote:'Postpartum = delivered at ≥20 weeks. Pregnancy loss/abortion <20 weeks → choose “Less than 20 weeks”.',
   conflict:'Free text conflicts with the pregnancy status. All status-hidden questions are shown until resolved.',
   universal:'Other emergencies (every patient)',pick:'Main complaint: pick one',tree:'Complaint questions',already:'Already answered',
   safety:'Safety screen (every patient; answer each item)',priv:'Screened privately, without partner/family?',privYes:'Yes, privately',privNo:'No',privCant:'Cannot separate her',
   addon:'Trauma add-on (answer each item)',height:'Fall height (ft)',hUnknown:'Height unknown',
   catch:'Anything else? (symptoms from other complaints)',added:'Added questions',
   result:'Result',acuity:'Acuity',disp:'Disposition',held:'HELD — complete:',alerts:'Alerts',tasks:'Open tasks',notAsked:'Not asked',notAssessed:'Not assessed',na:'N/A by status',copy:'Copy SBAR (English, for the chart)',copied:'Copied',sbarShow:'Show SBAR',restart:'New assessment / reset',
   restartConfirm:'Start over while RETAINING all unresolved alerts? Documented clinician reassessment is required; reset cannot resolve them.',retained:'Retained from earlier in this assessment; clinician reassessment required.',
   immediate:'IMMEDIATE',urgent:'URGENT',prompt:'CLINICIAN REVIEW',EMERGENT:'EMERGENT',URGENT:'URGENT',PROMPT_CLINICIAN_REVIEW:'PROMPT CLINICIAN REVIEW',
   holds:{pick_complaint:'pick a complaint',unanswered:'unanswered questions',vitals:'BP, HR and SpO2',patient_language:'patient language',interpreter:'interpreter',private_screen:'private screening',status_conflict:'status conflict',pulse_confirm:'confirm maternal pulse'},
   followUp:'Emergency transfer to L&D/OR/ICU/ED: never delay; hand off open screening items.',unsureYes:'Unsure counts as Yes.',
   sections:'Sections',sec:{gate:'Act now',vitals:'Vitals / language',status:'Status',universal:'Other emergencies',pick:'Complaint',tree:'Complaint questions',safety:'Safety screen',addon:'Trauma add-on',catch:'Anything else',result:'Result / SBAR',protocols:'Protocols'},
   openProto:'Open protocol',noProto:'No protocol in this app',finish:'Finish screening (tap to return):',dischargeBlocked:'Discharge/transfer blocked until vitals + safety screen are complete.',dischargeOk:'Vitals + safety screen complete.',protoHdr:'Protocol (English clinician content)',protoBack:'Back to nurse triage',protoLib:'All protocols',allDone:'All sections screened.',
   provBadge:'PROVISIONAL',emergencyCard:'Emergency action card',finishN:'Finish screening',
   dischargeHome:'Discharge home / non-emergency transfer: BLOCKED until complete:',dischargeHomeOk:'Discharge home / non-emergency transfer: required screening complete.',
   emergencyTransfer:'Emergency transfer to L&D/OR/ICU/ED: never delay; hand off open screening items.',
   defer:'Not completed…',deferred:'Not completed',deferWhy:'Reason (never records No; discharge stays blocked):',deferReason:{unstable:'Patient unstable/sedated',transferred:'Transferred to higher care',declined:'Patient declined',no_interpreter:'Interpreter unavailable'},
   confirm:'Confirm value',pulseCf:'Confirm maternal pulse (radial palpation)',pulseShort:'Confirm pulse',pulseFull:'Confirm maternal pulse (not FHR): {hr}. Palpate the radial pulse — this could be the fetal heart rate entered by mistake.',cfBtn:'Confirm',remeasure:'Re-measure',urgentProto:'Protocol (URGENT, not a bypass)',pulseWhy:'Could be the fetal heart rate entered by mistake: palpate the radial pulse. Alerts already apply.',cfNow:'Confirm or re-measure now',pulseHint:'Palpate radial pulse — make sure this is the maternal HR, not the FHR.',jump:'Relevant protocols',setStatus:'Set pregnancy status',relProto:'Relevant protocols',relNone:'Tap a tile: matching protocols appear here (in the bypass order).',allProto:'All protocols',relStatus:'Pregnancy status so far',deferRel:'Disposition released by documented deferral (never below URGENT): admit, transfer to L&D/higher care, or clinician bedside evaluation allowed; discharge home stays blocked.',implausible:'Implausible value: recheck. It counts only after you confirm.',vit:{hr:'HR',spo2:'SpO2',sbp:'SBP',dbp:'DBP'},
   provCard:'PROVISIONAL card — pending Doc and Michael review. Not unit policy.',sources:'Sources',
   footer:'Decision support only · not unit policy · not the medical record · enter no PHI.'},
  es:{title:'Triaje de enfermería (PRUEBA)',test:'SITIO DE PRUEBA / PRÁCTICA: no es para la atención de pacientes. No ingrese información real de pacientes.',back:'Atrás',next:'Siguiente',yes:'Sí',no:'No',unsure:'No segura',none:'Ninguno de estos',noRest:'Todos los demás No',
   hpi:'Texto libre (opcional, en cualquier momento): solo puede aumentar la urgencia. Sin nombres, números de expediente ni fechas de nacimiento.',
   rescue:'¿Emergencia? Active el rescate ahora. Nunca espere a terminar este formulario.',
   gate:'Actuar ya: ¿está ocurriendo alguno de estos?',gateHit:'EMERGENTE: active el rescate ahora.',toResult:'Ir al resultado / SBAR',contOpt:'Continuar (opcional)',
   gateLock:'Una respuesta positiva solo puede cambiarse mediante una reevaluación clínica documentada.',
   vitals:'Signos vitales',sbp:'Sistólica',dbp:'Diastólica',hr:'Pulso materno (no FCF)',hrHint:'Pulso materno: palpe o use el oxímetro de pulso; no es la FCF.',spo2:'SpO2 %',nm:'No medido',nmHold:'Un valor no medido o inválido detiene la disposición; nunca retrasa el rescate.',
   plang:'Idioma preferido de la paciente',pen:'Inglés',pes:'Español',pother:'Otro',interp:'Intérprete',ipro:'Intérprete profesional (anote el número)',iqb:'Clínico bilingüe calificado (calificado por CSM)',ifam:'Familiar, amistad, pareja o menor de edad',inone:'Ninguno',
   interpNote:'La interpretación por familiar, pareja o menor nunca cuenta como profesional y hace que la evaluación de violencia y de ideas suicidas no sea privada.',
   status:'Estado del embarazo',su:'Desconocido',slt:'Menos de 20 semanas',sge:'20 semanas o más',spp:'Posparto',sppNote:'Posparto = parto a las 20 semanas o más. Pérdida del embarazo o aborto antes de 20 semanas → elija “Menos de 20 semanas”.',
   conflict:'El texto libre no coincide con el estado del embarazo. Se muestran todas las preguntas ocultas hasta resolverlo.',
   universal:'Otras emergencias (todas las pacientes)',pick:'Motivo principal: elija uno',tree:'Preguntas del motivo',already:'Ya respondido',
   safety:'Evaluación de seguridad (todas las pacientes; responda cada punto)',priv:'¿Evaluada en privado, sin pareja ni familia?',privYes:'Sí, en privado',privNo:'No',privCant:'No se puede separar',
   addon:'Complemento de trauma (responda cada punto)',height:'Altura de la caída (pies)',hUnknown:'Altura desconocida',
   catch:'¿Algo más? (síntomas de otros motivos)',added:'Preguntas agregadas',
   result:'Resultado',acuity:'Urgencia',disp:'Disposición',held:'DETENIDA — complete:',alerts:'Alertas',tasks:'Tareas pendientes',notAsked:'No preguntado',notAssessed:'No evaluado',na:'No aplica por estado',copy:'Copiar SBAR (en inglés, para el expediente)',copied:'Copiado',sbarShow:'Ver SBAR (inglés)',restart:'Nueva evaluación / reiniciar',
   restartConfirm:'¿Empezar de nuevo CONSERVANDO todas las alertas sin resolver? Se requiere reevaluación clínica documentada; reiniciar no las resuelve.',retained:'Conservada de antes en esta evaluación; se requiere reevaluación clínica.',
   immediate:'INMEDIATA',urgent:'URGENTE',prompt:'REVISIÓN CLÍNICA',EMERGENT:'EMERGENTE',URGENT:'URGENTE',PROMPT_CLINICIAN_REVIEW:'REVISIÓN CLÍNICA PRONTA',
   holds:{pick_complaint:'elegir un motivo',unanswered:'preguntas sin responder',vitals:'PA, FC y SpO2',patient_language:'idioma de la paciente',interpreter:'intérprete',private_screen:'evaluación en privado',status_conflict:'conflicto de estado',pulse_confirm:'confirmar pulso materno'},
   followUp:'Traslado de emergencia a L&D, quirófano, UCI o urgencias: nunca lo retrase; entregue los puntos de evaluación pendientes.',unsureYes:'No estoy segura cuenta como Sí.',
   sections:'Secciones',sec:{gate:'Actuar ya',vitals:'Signos vitales / idioma',status:'Estado',universal:'Otras emergencias',pick:'Motivo',tree:'Preguntas del motivo',safety:'Evaluación de seguridad',addon:'Complemento de trauma',catch:'Algo más',result:'Resultado / SBAR',protocols:'Protocolos'},
   openProto:'Abrir protocolo (en inglés)',noProto:'No hay protocolo en esta aplicación',finish:'Termine la evaluación (toque para volver):',dischargeBlocked:'Alta o traslado bloqueados hasta completar signos vitales y evaluación de seguridad.',dischargeOk:'Signos vitales y evaluación de seguridad completos.',protoHdr:'Protocolo (en inglés)',protoBack:'Volver al triaje de enfermería',protoLib:'Todos los protocolos',allDone:'Todas las secciones evaluadas.',
   provBadge:'PROVISIONAL',emergencyCard:'Tarjeta de acción de emergencia',finishN:'Terminar evaluación',
   dischargeHome:'Alta a casa o traslado no urgente: BLOQUEADOS hasta completar:',dischargeHomeOk:'Alta a casa o traslado no urgente: evaluación requerida completa.',
   emergencyTransfer:'Traslado de emergencia a L&D, quirófano, UCI o urgencias: nunca lo retrase; entregue los puntos de evaluación pendientes.',
   defer:'No completado…',deferred:'No completado',deferWhy:'Motivo (nunca registra No; el alta sigue bloqueada):',deferReason:{unstable:'Paciente inestable o sedada',transferred:'Trasladada a mayor nivel de atención',declined:'La paciente se negó',no_interpreter:'Intérprete no disponible'},
   confirm:'Confirmar valor',pulseCf:'Confirmar pulso materno (palpación radial)',pulseShort:'Confirmar pulso',pulseFull:'Confirme el pulso materno (no la FCF): {hr}. Palpe el pulso radial — podría ser la frecuencia cardiaca fetal anotada por error.',cfBtn:'Confirmar',remeasure:'Volver a medir',urgentProto:'Protocolo (URGENTE, sin acceso directo)',pulseWhy:'Podría ser la frecuencia cardiaca fetal anotada por error: palpe el pulso radial. Las alertas ya se aplican.',cfNow:'Confirme o mida de nuevo ya',pulseHint:'Palpe el pulso radial — asegúrese de que sea la FC materna y no la FCF.',jump:'Protocolos relevantes',setStatus:'Indicar estado del embarazo',relProto:'Protocolos relevantes',relNone:'Toque una opción: aquí aparecen los protocolos correspondientes (en el orden de acceso directo).',allProto:'Todos los protocolos',relStatus:'Estado del embarazo hasta ahora',deferRel:'Disposición liberada por un aplazamiento documentado (nunca menos que URGENTE): se permite ingreso, traslado a L&D o a un nivel mayor de atención, o evaluación clínica a la cabecera; el alta a casa sigue bloqueada.',implausible:'Valor poco probable: vuelva a medir. Solo cuenta después de confirmarlo.',vit:{hr:'FC',spo2:'SpO2',sbp:'Sistólica',dbp:'Diastólica'},
   provCard:'Tarjeta PROVISIONAL — pendiente de revisión por Doc y Michael. No es política de la unidad.',sources:'Fuentes',
   footer:'Solo apoyo a la decisión · no es política de la unidad · no es el expediente médico · no ingrese información de salud protegida.',
   provisional:'Traducción provisional: pendiente de revisión por un clínico bilingüe calificado.'}
 };
 // Localized alert names (ES provisional). EN shows full engine text.
 const ALERT_ES={RF_BRADY:'Bradicardia materna (FC <50): ECG de 12 derivaciones, revisar medicamentos (labetalol, magnesio, betabloqueadores, opioides); evaluación clínica según el nivel indicado.',TEXT_BRADY:'El texto libre indica bradicardia materna (FC <50): anote el pulso materno medido en signos vitales.',PULSE_CONFIRM:'Confirme el pulso materno (palpación radial): la FC podría ser la frecuencia cardiaca fetal.',RF_SEVERE_BP:'Presión arterial grave (sistólica ≥160 o diastólica ≥110): evaluación clínica inmediata.',RF_SBP_LOW:'Sistólica <90: posible choque. Evaluación inmediata.',RF_ABNORMAL_VITALS:'FC ≥110 o SpO2 <95 %: evaluación inmediata de estabilidad.',RF_FALL_HIGH:'Caída de más de 10 pies o altura desconocida: evaluación inmediata.',FALL_HEIGHT_REQUIRED:'Paso requerido: anote la altura de la caída.',IPV_SAFETY:'Seguridad: no se puede separar o no está segura: INMEDIATA, con trabajo social.',PARTNER_RESCREEN:'Tarea: no evaluada en privado. Sepárela y vuelva a preguntar en privado con intérprete profesional.',RF_TRAUMA_DANGER:'Trauma sin todos los peligros descartados, sin evaluación privada o con bloqueo de idioma: INMEDIATA.',TRAUMA_WORKUP:'Trauma estable: seguir el estudio de trauma (monitoreo fetal ≥4 h si ≥20 semanas, Rh, Kleihauer-Betke).',RF_INTERPRETER_SI:'Pensamientos suicidas pasivos o intrusivos con bloqueo de idioma: INMEDIATA hasta evaluar con intérprete profesional.',RF_PUL_LOCK:'Embarazo de ubicación desconocida con bloqueo de idioma: evaluación inmediata.',TEXT_ABNORMAL_VITALS:'El texto libre indica signos vitales anormales: evaluación inmediata de estabilidad.',VITAL_CONFIRM:'Valor de signo vital poco probable: vuelva a medir y confirme. No cuenta hasta confirmarlo.',RF_ROM_LABOR:'Ruptura de membranas con trabajo de parto: evaluación obstétrica inmediata.'};
 const T=lang=>STR[lang]||STR.en;
 const itemLabel=(id,lang)=>N.ITEMS[id][lang==='es'?'es':'en'];
 // ---------- pure renderers (testable in Node) ----------
 function btn(act,id,val,text,pressed,extra){return '<button type="button" class="nf-btn" data-act="'+act+'" data-id="'+esc(id)+'" data-val="'+esc(val)+'" aria-pressed="'+(!!pressed)+'"'+(extra||'')+'>'+esc(text)+'</button>';}
 function row(s,r,id,lang,scr,forceRO){
  const L=T(lang),a=s.answers[id],locked=a==='yes'||a==='unsure';
  const where=s.where&&s.where[id],readonly=!!forceRO||(a!==undefined&&!!where&&where!==scr);
  const hint=N.ITEMS[id].hint?'<p class="nf-hint">'+esc(N.ITEMS[id].hint[lang])+'</p>':'';
  const opts=scr==='gate'&&!(s.noFit&&s.noFit.gate)?['yes','unsure']:['yes','no','unsure']; // gate: own Yes/Unsure per tile + group None (Doc ruling 7)
  const b=readonly?'<span class="nf-ro">'+esc(L.already)+': '+esc(a===undefined?'—':L[a])+'</span>':opts.map(v=>btn('ans',id,v,L[v],a===v,locked&&v==='no'?' disabled':'')).join('');
  return '<div class="nf-row" data-row="'+esc(id)+'"><div class="nf-q">'+esc(itemLabel(id,lang))+'</div>'+hint+'<div class="nf-ans">'+b+'</div>'+(locked&&!readonly?'<p class="nf-note">'+esc(a==='unsure'?L.unsureYes+' ':'')+esc(L.gateLock)+'</p>':'')+'</div>';
 }
 function groupBtn(s,ids,lang){if(s.noFit&&s.noFit[s.curScreen])return '';const L=T(lang),open=ids.filter(id=>s.answers[id]===undefined);if(!open.length)return '';const anyPos=ids.some(id=>s.answers[id]==='yes'||s.answers[id]==='unsure');return '<button type="button" class="nf-none" data-act="none" data-ids="'+esc(open.join(','))+'">'+esc((anyPos?L.noRest:L.none)+' ('+open.length+')')+'</button>';}
 function screens(s,r){
  const list=['gate','vitals','status','universal','pick','tree','safety'];
  if(r.traumaOn)list.push('addon');
  list.push('catch','result');return list;
 }
 function nmHTML(s,L){return btn('nm','bp','1',L.nm+' ('+L.sbp+'/'+L.dbp+')',s.bp==='not_measured')+btn('nm','hr','1',L.nm+' ('+L.hr+')',s.hr==='not_measured')+btn('nm','spo2','1',L.nm+' (SpO2)',s.spo2==='not_measured');}
 function cfHTML(r,L){return (r.implausible||[]).map(x=>'<p class="nf-warn">'+esc(L.implausible)+'</p>'+btn('confirm',x.k,'1',L.confirm+': '+L.vit[x.k]+' '+x.v)).join('')+(r.pulseConfirmNeeded&&!(r.implausible||[]).some(x=>x.k==='hr')?'<div class="nf-pulsecf" id="nf-pulsecf" data-pulsecf="1"><p class="nf-warn" data-pulsefull="1">'+esc(L.pulseFull.replace('{hr}',r.vitals.v.hr))+'</p>'+btn('confirm','pulse','1',L.cfBtn)+btn('remeasure','hr','1',L.remeasure)+'</div>':'')+(r.pulseHint?'<p class="nf-hint" data-pulsehint="1">'+esc(L.pulseHint)+'</p>':'');}
// NC7: pinned "Set pregnancy status" while status is unknown (beside the bypass button, else in the footer; no extra row).
function statusChip(r,lang){return r.status==='unknown'?'<button type="button" class="nf-chip nf-setstatus" data-act="go" data-val="status" data-setstatus="1">'+esc(T(lang).setStatus)+'</button>':'';}
// ND1: red confirm chips lead the footer row; the banner's rescue text is never replaced.
function cfNowHTML(r,lang){const L=T(lang);const imp=r.implausible||[];
 return imp.map(x=>'<button type="button" class="nf-chip nf-cfbtn" data-cfnow="1" data-act="confirm" data-id="'+esc(x.k)+'" data-val="1" title="'+esc(L.implausible)+'">'+esc(L.cfNow+': '+L.vit[x.k]+' '+x.v)+'</button>').join('');}
// ND1: the required maternal-pulse confirm (HR <50) is a short chip appended AFTER the rescue/acuity text in the top row.
// NE1: tapping it never confirms; it opens the vitals confirm block with the full visible wording and separate Confirm / Re-measure.
function pulseChipHTML(r,lang){const L=T(lang);return r.pulseConfirmNeeded&&!(r.implausible||[]).some(x=>x.k==='hr')?' <button type="button" class="nf-chip nf-cfbtn nf-cfpulse" data-cfnow="1" data-act="pulseopen" data-val="1" aria-label="'+esc(L.pulseFull.replace('{hr}',r.vitals.v.hr))+'">'+esc(L.pulseShort+' '+r.vitals.v.hr)+'</button>':'';}
// Michael t1993u: live "Relevant protocols" on the Act-now screen (same order as the bypass; NB1/NC7 bleeding order with the status known so far).
function relProtoHTML(r,lang){const L=T(lang),l=lang==='es'?'es':'en';const list=PR?PR.forResult(r):[];
 const body=list.length?list.map(t=>'<div class="nf-trig" data-reltrig="'+esc(t.key)+'"><b>'+esc(N.ITEMS[t.key]?N.ITEMS[t.key][l]:protoName(t.ids[0],lang))+'</b>'+t.links.map(x=>linkBtn(x,t,lang,false)).join('')+noteHTML(t,lang)+'</div>').join(''):'<p class="nf-hint">'+esc(L.relNone)+'</p>';
 return '<section class="nf-relproto" id="nf-relproto" data-rel="1"><h3>'+esc(L.relProto)+'</h3><p class="nf-hint" data-relstatus="'+esc(r.status)+'">'+esc(L.relStatus)+': '+esc((l==='es'?{unknown:'desconocido',lt20:'<20 semanas',ge20:'≥20 semanas',postpartum:'posparto'}:{unknown:'unknown',lt20:'<20 wk',ge20:'≥20 wk',postpartum:'postpartum'})[r.status]||r.status)+'</p>'+body+'<button type="button" class="nf-big" data-act="go" data-val="protocols" data-allproto="1">'+esc(L.allProto)+'</button></section>';}
function visible(s,r,ids){return ids.filter(id=>r.states[id]!=='na_status');}
 function screenHTML(s,r,screen,lang){
  const L=T(lang);let h='';
  if(screen==='gate'){
   const relN=PR?new Set(PR.forResult(r).flatMap(t=>t.ids)).size:0;
   h+='<h2>'+esc(L.gate)+'</h2><p class="nf-warn">'+esc(L.rescue)+(relN?' <button type="button" class="nf-chip nf-jump" data-act="jump" data-val="nf-relproto">'+esc(L.jump)+' ('+relN+') ↓</button>':'')+'</p>'+N.GATE.map(id=>row(s,r,id,lang,'gate')).join('')+groupBtn(s,N.GATE,lang);
   if(r.gateTapped)h+='<div class="nf-emergent"><b>'+esc(L.gateHit)+'</b> '+btn('go','','result',L.toResult)+btn('go','','vitals',L.contOpt)+'</div>';
   h+=relProtoHTML(r,lang);
  }else if(screen==='vitals'){
   const f=(k,lab,val)=>'<label class="nf-num">'+esc(lab)+'<input id="nf-'+k+'" data-num="'+k+'" type="number" inputmode="numeric" value="'+(Number.isFinite(val)?val:'')+'"></label>';
   const bp=s.bp&&typeof s.bp==='object'?s.bp:{};
   h+='<h2>'+esc(L.vitals)+'</h2><div class="nf-vitals">'+f('sbp',L.sbp,bp.sbp)+f('dbp',L.dbp,bp.dbp)+f('hr',L.hr,s.hr)+f('spo2',L.spo2,s.spo2)+'</div><p class="nf-hint" data-hrhint="1">'+esc(L.hrHint)+'</p><div id="nf-nm">'+nmHTML(s,L)+'</div><div id="nf-cf">'+cfHTML(r,L)+'</div><p class="nf-hint">'+esc(L.nmHold)+'</p>'+
    '<h3>'+esc(L.plang)+'</h3>'+[['en',L.pen],['es',L.pes],['other',L.pother]].map(([v,t])=>btn('plang','',v,t,s.patientLanguage===v)).join('');
   if(r.interpreterNeeded)h+='<h3>'+esc(L.interp)+'</h3>'+[['professional',L.ipro],['qualified_bilingual',L.iqb],['family',L.ifam],['none',L.inone]].map(([v,t])=>btn('interp','',v,t,s.interpreter===v)).join('')+'<p class="nf-hint">'+esc(L.interpNote)+'</p>';
  }else if(screen==='status'){
   h+='<h2>'+esc(L.status)+'</h2>'+[['unknown',L.su],['lt20',L.slt],['ge20',L.sge],['postpartum',L.spp]].map(([v,t])=>btn('status','',v,t,s.status===v)).join('')+'<p class="nf-hint">'+esc(L.sppNote)+'</p>';
  }else if(screen==='universal'){
   const ids=visible(s,r,N.UNIVERSAL);h+='<h2>'+esc(L.universal)+'</h2>'+ids.map(id=>row(s,r,id,lang,'universal')).join('')+groupBtn(s,ids,lang);
  }else if(screen==='pick'){
   h+='<h2>'+esc(L.pick)+'</h2>'+Object.keys(N.TREES).map(t=>btn('tree','',t,N.TREES[t][lang],s.tree===t,' class="nf-big"')).join('');
  }else if(screen==='tree'){
   const seen=new Set();h+='<h2>'+esc(L.tree)+'</h2>';
   for(const t of r.activeTrees){
    const all=N.TREES[t].items.filter(id=>r.states[id]!=='na_status');
    const dup=all.filter(id=>seen.has(id)),ids=all.filter(id=>!seen.has(id));ids.forEach(i=>seen.add(i));
    const ro=N.TREES[t].shown.filter(id=>r.states[id]!=='na_status');
    const editable=ids.filter(id=>!(s.answers[id]!==undefined&&s.where&&s.where[id]&&s.where[id]!=='tree'));
    // NF15: an item shared by two trees is asked once; the second tree shows the same stored answer read-only.
    h+='<h3>'+esc(N.TREES[t][lang])+'</h3>'+ids.map(id=>row(s,r,id,lang,'tree')).join('')+groupBtn(s,editable,lang)+dup.map(id=>row(s,r,id,lang,'tree',true)).join('')+ro.map(id=>row(s,r,id,lang,'tree',true)).join('');
   }
  }else if(screen==='safety'){
   h+='<h2>'+esc(L.safety)+'</h2>'+N.SAFETY.map(id=>row(s,r,id,lang,'safety')).join('')+'<div class="nf-row"><div class="nf-q">'+esc(L.priv)+'</div><div class="nf-ans">'+[['yes',L.privYes],['no',L.privNo],['cannot_separate',L.privCant]].map(([v,t])=>btn('priv','',v,t,s.privateScreen===v)).join('')+'</div></div>';
  }else if(screen==='addon'){
   const ids=N.ADDON_ITEMS.filter(id=>r.states[id]!=='na_status');
   h+='<h2>'+esc(L.addon)+'</h2>'+ids.map(id=>row(s,r,id,lang,'addon')).join('')+N.MECH.map(id=>row(s,r,id,lang,'addon')).join('')+row(s,r,'fall',lang,'addon');
   if(s.answers.fall==='yes')h+='<label class="nf-num">'+esc(L.height)+'<input id="nf-fallHeight" data-num="fallHeight" type="number" inputmode="numeric" value="'+(Number.isFinite(s.fallHeight)?s.fallHeight:'')+'"></label>'+btn('hunk','','unknown',L.hUnknown,s.fallHeight==='unknown');
  }else if(screen==='catch'){
   const ids=[...r.headers,'other_concern'];h+='<h2>'+esc(L.catch)+'</h2>'+ids.map(id=>row(s,r,id,lang,'catch')).join('')+groupBtn(s,ids,lang);
   const extra=r.requiredItems.filter(id=>!N.ITEMS[id].header&&!N.GATE.includes(id)&&!N.UNIVERSAL.includes(id)&&!N.SAFETY.includes(id)&&!N.MECH.includes(id)&&id!=='fall'&&id!=='other_concern'&&r.activeTrees.some(t=>N.TREES[t].items.includes(id))&&!(s.tree&&N.TREES[s.tree].items.includes(id)));
   if(extra.length)h+='<h3>'+esc(L.added)+'</h3>'+extra.map(id=>row(s,r,id,lang,'catch')).join('')+groupBtn(s,extra.filter(id=>!(s.answers[id]!==undefined&&s.where[id]!=='catch')),lang);
  }else if(screen==='protocols'){
   h+=protocolsScreenHTML(lang,r);
  }else if(screen==='result'){
   const names=k=>Object.keys(r.states).filter(id=>r.states[id]===k&&!N.ITEMS[id].header).map(id=>itemLabel(id,lang));
   h+='<h2>'+esc(L.result)+'</h2><p class="nf-acuity" data-urgency="'+r.urgency+'"><b>'+esc(L.acuity)+': '+esc(L[r.urgency])+'</b> · '+esc(L.disp)+': '+esc(r.disposition?L[r.disposition]:L.held+' '+r.holds.map(x=>L.holds[x]).join(', '))+'</p>';
   if(r.deferRelease)h+='<p class="nf-warn" data-deferrel="1">'+esc(L.deferRel)+'</p>';
   h+=dischargeHTML(r,lang);
   h+='<h3>'+esc(L.alerts)+'</h3><ul>'+r.alerts.filter(x=>!x.task&&x.id!=='PARTNER_RESCREEN').map(x=>'<li class="'+(x.level==='red'?'nf-red':'nf-amber')+'">'+esc(alertText(x,lang))+(x.retained?' — '+esc(L.retained):'')+'</li>').join('')+'</ul>';
   const tasks=r.alerts.filter(x=>x.task||x.id==='PARTNER_RESCREEN'||x.id==='FALL_HEIGHT_REQUIRED');
   if(tasks.length)h+='<h3>'+esc(L.tasks)+'</h3><ul>'+tasks.map(x=>'<li>'+esc(alertText(x,lang))+'</li>').join('')+'</ul>';
   for(const [k,lab] of [['not_asked',L.notAsked],['not_assessed',L.notAssessed],['na_status',L.na]]){const n=names(k);if(n.length)h+='<details><summary>'+esc(lab)+' ('+n.length+')</summary><ul>'+n.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></details>';}
   h+=btn('copy','','1',L.copy)+'<details><summary>'+esc(L.sbarShow)+'</summary><textarea id="nf-sbar" readonly lang="en" rows="8">'+esc(r.sbar)+'</textarea></details>'+btn('reset','','1',L.restart);
  }
  return h;
 }
 function alertText(x,lang){
  if(lang!=='es')return x.text;
  const L=STR.es;
  if(x.itemId&&N.ITEMS[x.itemId])return N.ITEMS[x.itemId].es+' — '+L[x.urgency==='prompt'?'prompt':x.urgency];
  return ALERT_ES[x.id]||('Alerta adicional del texto libre — '+L[x.urgency==='prompt'?'prompt':x.urgency]);
 }
 const SEC_SCREEN={gate:'gate',vitals:'vitals',universal:'universal',complaint:'tree',safety:'safety',addon:'addon',catch:'catch',status:'status'};
const secName=(L,id)=>L.sec[id==='complaint'?'tree':id];
function protoName(id,lang){return PR&&PR.NAMES[id]?PR.NAMES[id][lang==='es'?'es':'en']:id;}
const isNew=id=>/^(NC|EA)-/.test(id);
function linkBtn(x,t,lang,compact){
 const L=T(lang),l=lang==='es'?'es':'en';const cond=x.cond&&PR.COND[x.cond]?' ('+PR.COND[x.cond][l]+')':'';const stl=PR.STATUS_LBL[t.status]?' · '+PR.STATUS_LBL[t.status][l]:'';
 const lbl=L.openProto;
 return '<button type="button" class="nf-proto'+(/^EA-/.test(x.id)?' nf-ea':'')+'" data-act="proto" data-val="'+esc(x.id)+'" data-key="'+esc(t.key)+'">'+(/^EA-/.test(x.id)?'':esc(lbl)+': ')+esc(protoName(x.id,lang))+esc(cond)+(compact?'':esc(stl))+(/^NC-/.test(x.id)?' <span class="nf-badge">'+esc(L.provBadge)+'</span>':'')+'</button>';
}
// NB3: gap/partial notes always render next to their buttons; NB4: every trigger has a card (no dead end).
function noteHTML(t,lang){return t.note&&t.level!=='mapped'&&t.level!=='card'?'<span class="nf-gap" data-gap="'+esc(t.key)+'" title="'+esc(t.note[lang==='es'?'es':'en'])+'">'+esc(t.note[lang==='es'?'es':'en'])+'</span>':'';}
function protoButtons(r,lang,all){
 if(!PR)return '';const L=T(lang),list=PR.forResult(r);if(!list.length)return '';
 if(all)return '<div class="nf-bypass nf-bypass-all">'+list.map(t=>'<div class="nf-trig" data-trig="'+esc(t.key)+'"><b>'+esc(N.ITEMS[t.key]?N.ITEMS[t.key][lang==='es'?'es':'en']:protoName(t.ids[0],lang))+'</b>'+t.links.map(x=>linkBtn(x,t,lang,false)).join('')+noteHTML(t,lang)+(t.level==='card'&&t.note?'<span class="nf-hint">'+esc(t.note[lang==='es'?'es':'en'])+'</span>':'')+'</div>').join('')+'</div>';
 return '<div class="nf-bypass"><div class="nf-byrow">'+linkBtn(list[0].links[0],list[0],lang,true)+statusChip(r,lang)+'</div>'+noteHTML(list[0],lang)+'</div>';
}
// NB12 footer row: other gap/card triggers as compact card chips (never only behind +N; gap note in label/tooltip), then +N, then Finish screening.
function pinFootHTML(r,lang,remindOpen){
 const L=T(lang),l=lang==='es'?'es':'en';const list=PR?PR.forResult(r):[];
 const extra=list.slice(1).filter(t=>t.level==='gap'||t.level==='card');
 const more=list.reduce((n,t)=>n+t.links.length,0)-1-extra.length;
 const chips=extra.map(t=>{const id=t.links[0].id,nt=t.note&&t.level==='gap'?t.note[l]:'';return '<button type="button" class="nf-chip nf-proto2'+(/^EA-/.test(id)?' nf-ea':'')+'" data-act="proto" data-val="'+esc(id)+'" data-key="'+esc(t.key)+'"'+(nt?' data-gap="'+esc(t.key)+'" title="'+esc(nt)+'" aria-label="'+esc(protoName(id,lang)+'. '+nt)+'"':'')+'>'+esc(protoName(id,lang).replace(/ \((provisional card|tarjeta provisional)\)$/,''))+'</button>';}).join('');
 const rem=reminderChip(r,lang,remindOpen)+(list.length?'':statusChip(r,lang));
 const moreB=more>0?'<button type="button" class="nf-chip nf-more" data-act="go" data-val="protocols" title="'+esc('+'+more+' · '+L.sec.protocols)+'" aria-label="'+esc('+'+more+' · '+L.sec.protocols)+'">+'+more+'</button>':'';
 const cf=cfNowHTML(r,lang);
 return cf||chips||rem||moreB?'<div class="nf-pinfoot">'+cf+chips+moreB+rem+'</div>':'';
}
function dischargeHTML(r,lang){const L=T(lang);return '<p class="nf-'+(r.dischargeBlocked?'warn':'hint')+'" data-discharge="1">'+esc(r.dischargeBlocked?L.dischargeHome+' '+r.dischargeOpen.map(id=>secName(L,id)).join(', '):L.dischargeHomeOk)+'</p><p class="nf-hint" data-etransfer="1">'+esc(L.emergencyTransfer)+'</p>';}
function reminderChip(r,lang,open){
 const L=T(lang);if(!(r.locked||r.urgency==='immediate'))return '';
 const sec=r.sections.filter(x=>!x.done);
 if(!sec.length)return '<span class="nf-remind" data-remind="1"><b>'+esc(L.allDone)+'</b></span>';
 return '<button type="button" class="nf-chip nf-finish" data-remind="1" data-act="remind" aria-expanded="'+(!!open)+'">'+esc(L.finishN)+' ('+sec.length+')'+(open?' ▴':' ▾')+'</button>';
}
// Expanded finish-screening panel (only when opened from the chip).
function reminderHTML(r,lang,open,deferOpen){
 const L=T(lang);if(!(r.locked||r.urgency==='immediate')||!open)return '';
 const sec=r.sections.filter(x=>!x.done);if(!sec.length)return '';
 const rows=sec.map(x=>'<div class="nf-secrow"><button type="button" class="nf-chip" data-act="go" data-val="'+SEC_SCREEN[x.id]+'" data-sec="'+x.id+'">'+esc(secName(L,x.id))+' ('+x.remaining.length+')</button>'+(x.deferred?'<span class="nf-hint" data-deferred="'+x.id+'">'+esc(L.deferred)+': '+esc(L.deferReason[x.deferred])+'</span>':btn('deferopen','',x.id,L.defer,deferOpen===x.id))+(deferOpen===x.id&&!x.deferred?'<div class="nf-defer"><span class="nf-hint">'+esc(L.deferWhy)+'</span>'+N.DEFER_REASONS.map(k=>btn('defer',x.id,k,L.deferReason[k])).join('')+'</div>':'')+'</div>').join('');
 return '<div class="nf-remind nf-remind-open"><div class="nf-chips">'+rows+'</div>'+dischargeHTML(r,lang)+'</div>';
}
function quickNavHTML(s,r,lang,open){
 const L=T(lang);const items=['gate','vitals','status','universal','pick','tree','safety',...(r.traumaOn?['addon']:[]),'catch','result','protocols'];
 const secFor={gate:'gate',vitals:'vitals',universal:'universal',tree:'complaint',safety:'safety',addon:'addon',catch:'catch'};
 const mark=k=>{const sec=r.sections.find(x=>x.id===secFor[k]);return sec?(sec.done?' ✓':' ('+sec.remaining.length+')'):'';};
 const remaining=r.sections.filter(x=>!x.done).length;
 return {btn:'<button type="button" class="nf-secbtn" data-act="qnav" aria-expanded="'+(!!open)+'">'+esc(L.sections)+(remaining?' ('+remaining+')':'')+(open?' ▴':' ▾')+'</button>',panel:open?'<div class="nf-qnav">'+items.map(k=>btn('go','',k,L.sec[k]+mark(k))).join('')+'</div>':''};
}
// NE2: URGENT bradycardia pins EA-BRADY as an ordinary amber link (no lock, no rescue text).
function urgentLinksHTML(r,lang){if(!PR||!PR.urgentLinks)return '';const L=T(lang);const u=PR.urgentLinks(r);if(!u.length)return '';return '<div class="nf-urgentlinks" data-urgentlinks="1">'+u.map(t=>'<button type="button" class="nf-chip nf-urgentlink" data-act="proto" data-val="'+esc(t.links[0].id)+'" data-key="'+esc(t.key)+'" title="'+esc(L.urgentProto)+'">'+esc(protoName(t.links[0].id,lang))+'</button>').join('')+'</div>';}
function pinnedHTML(s,r,lang,open,remindOpen,deferOpen){const q=quickNavHTML(s,r,lang,open);return '<div class="nf-pinrow">'+bannerHTML(r,lang)+q.btn+'</div>'+q.panel+(r.locked?'':urgentLinksHTML(r,lang))+protoButtons(r,lang)+pinFootHTML(r,lang,remindOpen)+reminderHTML(r,lang,remindOpen,deferOpen);}
function protocolsScreenHTML(lang,r){const L=T(lang);return (r?protoButtons(r,lang,true)+(PR&&PR.urgentLinks?PR.urgentLinks(r).map(t=>'<div class="nf-trig" data-urgenttrig="'+esc(t.key)+'"><b>'+esc(L.urgentProto)+'</b>'+t.links.map(x=>linkBtn(x,t,lang,false)).join('')+noteHTML(t,lang)+'</div>').join(''):'')+(r.locked||r.urgency==='immediate'?dischargeHTML(r,lang):''):'')+'<h2>'+esc(L.protoLib)+'</h2>'+(PR?PR.LIBRARY.map(id=>'<button type="button" class="nf-big" data-act="proto" data-val="'+esc(id)+'">'+esc(protoName(id,lang))+'</button>').join(''):'');}
// Protocol view: header in the page language; body is the existing English clinician content (lang="en").
 function protocolHTML(id,lang){
  const L=T(lang),l=lang==='es'?'es':'en';
  const close=btn('protoclose','','1',L.protoBack);
  if(NC&&NC.ACTION[id]){const a=NC.ACTION[id];return '<div class="nf-protohdr"><b>'+esc(L.emergencyCard)+'</b> '+close+'</div><div class="nf-protobody nf-eacard" lang="'+l+'" data-card="'+esc(id)+'"><h2>'+esc(a.title[l])+'</h2><ul>'+NC.actionLines(id,l).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p class="nf-warn">'+esc(L.provCard)+'</p></div>';}
  if(NC&&NC.CARDS[id]){const c=NC.CARDS[id];return '<div class="nf-protohdr"><b>'+esc(L.protoHdr)+'</b>: '+esc(protoName(id,lang))+' '+close+'<p class="nf-warn">'+esc(L.provCard)+'</p></div><div class="nf-protobody" lang="en" data-card="'+esc(id)+'"><h2>'+esc(c.title.en)+'</h2><p class="nf-warn"><b>'+esc(NC.PROV_EN)+'</b></p><div class="cardtext">'+c.html+'</div><h3>Sources</h3><ul>'+c.sources.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>';}
  const it=C&&C.items.find(x=>x.id===id);if(!it)return '';
  const card=it.kind==='diagram'&&it.card?C.items.find(x=>x.id===it.card):null;
  const body=(it.kind==='diagram'?'<a href="'+esc(D.image(it))+'" target="_blank" rel="noopener"><img class="diag" src="'+esc(D.image(it))+'" alt="'+esc(D.title(it))+'"></a>':'')+'<div class="cardtext">'+dhtml(it)+'</div>'+(card?'<div class="cardtext">'+dhtml(card)+'</div>':'');
  return '<div class="nf-protohdr"><b>'+esc(L.protoHdr)+'</b>: '+esc(protoName(id,lang))+' '+btn('protoclose','','1',L.protoBack)+'</div><div class="nf-protobody" lang="en"><h2>'+esc(D.title(it))+'</h2>'+body+'</div>';
 }
 function bannerHTML(r,lang){const L=T(lang);return '<span class="nf-acu">'+(r.locked?'<b>'+esc(L[r.urgency])+'</b> · <span class="nf-hit">'+esc(L.gateHit)+'</span>':'<b>'+esc(L.acuity)+': '+esc(L[r.urgency])+'</b>'+(r.disposition?' · '+esc(L[r.disposition]):''))+pulseChipHTML(r,lang)+'</span>'+(r.statusConflict?'<p>'+esc(L.conflict)+'</p>':'');}
 function navHTML(s,r,screen,lang){const L=T(lang),list=screens(s,r),i=list.indexOf(screen);if(i<0)return btn('go','','result',L.sec.result);return (i>0?btn('nav','','-1',L.back):'')+(i<list.length-1?btn('nav','','1',L.next):'');}
 function pageStrings(lang){return T(lang);}
 const api={STR,ALERT_ES,screens,screenHTML,bannerHTML,navHTML,alertText,pageStrings,pinnedHTML,protocolHTML,protoButtons,reminderHTML,reminderChip,pinFootHTML,quickNavHTML,dischargeHTML,cfHTML};
 root.NurseUI=api;
 // ---------- controller (browser) ----------
 const doc=root.document;if(!doc||!doc.getElementById||!doc.getElementById('nurse-app'))return;
 const $=id=>doc.getElementById(id);
 const LANGS=Array.isArray(root.NURSE_UI_LANGS)&&root.NURSE_UI_LANGS.length?root.NURSE_UI_LANGS:['en']; // live: English only
 let s=null,r=null,screen='lang',prior=null,qnav=false,proto=null,remindOpen=false,deferOpen=null;
 function start(lang){if(!LANGS.includes(lang))lang='en';qnav=false;proto=null;remindOpen=false;deferOpen=null;s=N.create(lang);s.where={};s.noFit={};screen='gate';const L=T(lang);
  if(doc.documentElement)doc.documentElement.lang=lang;doc.title=L.title;$('nurse-title').textContent=L.title;$('nurse-test').textContent=L.test;$('nurse-hpi-label').textContent=L.hpi;$('nurse-footer').textContent=L.footer;$('nurse-prov').textContent=lang==='es'?STR.es.provisional:'';$('nurse-prov').hidden=lang!=='es';
  if($('nurse-lang'))$('nurse-lang').hidden=true;$('nurse-main').hidden=false;$('nurse-hpi').value='';render();}
 function render(){r=N.evaluate(s,prior);prior=r.locked?r:{alerts:r.alerts,locked:false};
  const list=screens(s,r);if(!list.includes(screen)&&screen!=='protocols')screen='catch';
  $('nurse-banner').innerHTML=pinnedHTML(s,r,s.uiLang,qnav,remindOpen,deferOpen);$('nurse-banner').setAttribute('data-urgency',r.urgency);
  $('nurse-protocol').hidden=!proto;$('nurse-flowview').hidden=!!proto;$('nurse-protocol').innerHTML=proto?protocolHTML(proto,s.uiLang):'';
  s.curScreen=screen;$('nurse-screen').innerHTML=screenHTML(s,r,screen,s.uiLang);if($('nurse-screen').setAttribute)$('nurse-screen').setAttribute('class','box nf-s-'+screen+(['gate','universal','tree','catch'].includes(screen)?' nf-compact':''));$('nurse-nav').innerHTML=navHTML(s,r,screen,s.uiLang);api.last={s,r,screen};fitCheck();}
 // Doc ruling 7: group None only when every item and the button are visible without scrolling; otherwise per-item No.
 function fitCheck(){const sc=$('nurse-screen'),b=$('nurse-banner');if(!sc.getBoundingClientRect||!sc.querySelector||s.noFit[screen]!==undefined)return;const n=sc.querySelector('[data-act=none]');if(!n)return;
  const span=n.getBoundingClientRect().bottom-sc.getBoundingClientRect().top,ban=b.getBoundingClientRect?b.getBoundingClientRect().height:0;
  s.noFit[screen]=span+ban>(root.innerHeight||0);if(s.noFit[screen])render();}
 function go(to){proto=null;screen=to;render();if($('nurse-screen').scrollIntoView)$('nurse-screen').scrollIntoView({block:'start'});}
 function step(d){const list=screens(s,r);const i=Math.max(0,list.indexOf(screen)+d);go(list[Math.min(i,list.length-1)]);}
 function onClick(e){
  const el=e.target&&e.target.closest?e.target.closest('[data-act]'):null;if(!el)return;
  const d=el.dataset,act=d.act;
  if(act==='lang'){start(d.val);return;}
  if(act==='jump'){const t=$(d.val);if(t&&t.scrollIntoView)t.scrollIntoView({block:'start'});return;} // ND5: no state change
  if(!s)return;
  if(act==='ans'){if(s.answers[d.id]!==undefined&&s.where[d.id]&&s.where[d.id]!==screen){render();return;}const res=N.setAnswer(s,d.id,d.val,'item');if(res.ok)s.where[d.id]=screen;render();return;}
  if(act==='none'){const ids=String(d.ids||'').split(',').filter(Boolean);const g=N.groupNo(s,ids);if(g.ok)g.set.forEach(i=>s.where[i]=screen);render();const rr=r;if(screen!=='catch'&&!(screen==='gate'&&rr.gateTapped))step(1);return;}
  if(act==='nm'){s[d.id]='not_measured';if(d.id==='bp'){$('nf-sbp')&&($('nf-sbp').value='');}render();return;}
  if(act==='plang'){s.patientLanguage=d.val;render();return;}
  if(act==='interp'){s.interpreter=d.val;render();return;}
  if(act==='status'){s.status=d.val;render();step(1);return;}
  if(act==='tree'){if(!s.tree)s.tree=d.val;else if(s.tree!==d.val&&!s.addedTrees.includes(d.val))s.addedTrees.push(d.val);render();go('tree');return;} // a second tree is added, never replaces answers
  if(act==='qnav'){qnav=!qnav;render();return;}
  if(act==='remind'){remindOpen=!remindOpen;render();return;}
  if(act==='deferopen'){deferOpen=deferOpen===d.val?null:d.val;render();return;}
  if(act==='defer'){N.defer(s,d.id,d.val);deferOpen=null;render();return;}
  if(act==='confirm'){N.confirmVital(s,d.id);render();return;}
  if(act==='pulseopen'){go('vitals');const b=$('nf-pulsecf');if(b&&b.scrollIntoView)b.scrollIntoView({block:'center'});return;} // NE1: opens, does not confirm
  if(act==='remeasure'){go('vitals');const f=$('nf-'+(d.id||'hr'));if(f){if(f.focus)f.focus();if(f.select)f.select();}return;} // NE1: re-measure keeps the value until a new one is typed
  if(act==='proto'){proto=d.val;render();return;}
  if(act==='protoclose'){proto=null;render();return;}
  if(act==='priv'){s.privateScreen=d.val;render();return;}
  if(act==='hunk'){s.fallHeight='unknown';render();return;}
  if(act==='go'){go(d.val);return;}
  if(act==='nav'){step(+d.val);return;}
  if(act==='copy'){const t=r.sbar;if(root.navigator&&root.navigator.clipboard&&root.navigator.clipboard.writeText)root.navigator.clipboard.writeText(t).then(()=>{el.textContent=T(s.uiLang).copied;}).catch(()=>{});return;}
  if(act==='reset'){const L=T(s.uiLang);if(r.alerts.length&&root.confirm&&!root.confirm(L.restartConfirm))return;const keep={alerts:r.alerts.map(x=>({...x})),locked:false};const lang=s.uiLang;start(lang);prior=keep;render();return;}
 }
 function onInput(e){
  const t=e.target;if(!t||!s)return;
  if(t.id==='nurse-hpi'){s.text=t.value;render();return;}
  const k=t.dataset&&t.dataset.num;if(!k)return;
  const n=t.value===''?undefined:Number(t.value);
  if(k==='sbp'||k==='dbp'){const bp=s.bp&&typeof s.bp==='object'?{...s.bp}:{};bp[k]=n;if(bp.sbp===undefined&&bp.dbp===undefined)s.bp='not_measured';else s.bp=Object.fromEntries(Object.entries(bp).filter(([,v])=>v!==undefined));}
  else if(k==='fallHeight')s.fallHeight=n;
  else s[k]=n===undefined?'not_measured':n;
  r=N.evaluate(s,prior);prior=r.locked?r:{alerts:r.alerts,locked:false};$('nurse-banner').innerHTML=pinnedHTML(s,r,s.uiLang,qnav,remindOpen,deferOpen);$('nurse-nav').innerHTML=navHTML(s,r,screen,s.uiLang);
  if(k!=='fallHeight'&&$('nf-nm'))$('nf-nm').innerHTML=nmHTML(s,T(s.uiLang));
  if(k!=='fallHeight'&&$('nf-cf'))$('nf-cf').innerHTML=cfHTML(r,T(s.uiLang));
  api.last={s,r,screen};
 }
 $('nurse-app').addEventListener('click',onClick);
 $('nurse-app').addEventListener('input',onInput);
 api.start=start;api.click=onClick;api.input=onInput;api.LANGS=LANGS;
 start('en'); // opens straight into English (no language picker)
})(typeof self!=='undefined'?self:this);
