# Build: FD-ANT-SUD substance-use-in-pregnancy algorithm, 15 Nov 2026.
# No dose numbers. Companion card holds doses. House practices applied.
import os, sys, subprocess
sys.dont_write_bytecode = True
sys.path.insert(0, "/workspace/grok-obgyn/cards/flow-diagrams/")
import fd_common
fd_common.PH = 640
from fd_common import *

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "ANT-SUD_FLOW_2026-11-15.pdf")

c = new_canvas(OUT, "Substance use in pregnancy: what to do now")
header(c, "SUBSTANCE USE IN PREGNANCY: WHAT TO DO NOW",
       "FD-ANT-SUD \u00b7 Companion to Substance use in pregnancy \u00b7 ACOG CO 711 / 633 \u00b7 ACOG CC No. 10 \u00b7 SOAP/SMFM/ASRA 2025 \u00b7 ASAM 2020 / 2024 \u00b7 Labor and delivery / OBED \u00b7 Decision support only, not unit policy",
       "Last reviewed: Nov 2026", "")
howto(c, "<b>HOW TO READ THIS CHART:</b> start by choosing In labor / admitted or OB ED triage. "
         "<b>Doses and drug amounts live on the companion card; this chart lists none.</b> "
         "Every treatment node says see ANT-SUD card. Unresponsive, RR &lt;10 or pulseless at any point \u2192 node 0.",
       h=20)
key(c, [(WHITE, "WHITE = assess / treat"), (LIGHT, "LIGHT GRAY = first step / screen"),
        (MID, "MID GRAY = admit / high risk"), (DARK, "DARK GRAY = overdose / arrest")], y=74)

hexagon(c, 20, 90, 752, 44, "START: IN LABOR / ADMITTED, OR OB ED TRIAGE?",
        "Choose the path that matches how she presents. Overdose or arrest at any point \u2192 node 0 (SYS-04 if pulseless).",
        tag="start")
arrow(c, [(210, 134), (210, 146)])
arrow(c, [(582, 134), (582, 146)])

action(c, 20, 148, 752, 30, "0. OVERDOSE / ARREST \u00b7 DARK GRAY",
       "Pulseless \u2192 SYS-04 now. Poor breathing with suspected opioid \u2192 ventilate, naloxone titrated to breathing (see ANT-SUD card), rapid response, attending. Observe after naloxone. EFM once mother stable.",
       fill=DARK, fg=WHITE, tsize=7.0, bsize=7.2, tag="n0")

action(c, 20, 184, 372, 92, "L. IN LABOR / ADMITTED \u00b7 WHITE",
       "Verify MOUD dose (PMP / prescriber / OTP) and CONTINUE it \u2014 never hold for labor, NPO or cesarean. Early anesthesia consult. Neuraxial preferred; NO nalbuphine or butorphanol. "
       "BP \u2265140/90 in a stimulant user = preeclampsia until proven otherwise \u2192 ANT-04; <b>house practice:</b> lorazepam first; nifedipine or hydralazine for severe BP; no beta-blockers, including labetalol. "
       "Recent meth/cocaine \u2192 abruption watch (LND-01). CIWA / COWS \u2192 treat (see ANT-SUD card). Peds/NICU and social work on admission \u2192 N, S. Postpartum \u2192 P.",
       fill=WHITE, tsize=7.0, bsize=7.2, tag="labor")
action(c, 404, 184, 368, 92, "1. OB ED TRIAGE \u2014 UNIVERSAL FIRST STEP \u00b7 LIGHT GRAY",
       "Vitals with CSM early warning tool; GA; FHT or EFM/toco. Red flags \u2192 attending now (severe BP, chest pain, seizure, hyperthermia, psychosis, suicidality, abruption, Cat II\u2013III). "
       "Verbal screen every patient (4Ps / NIDA / CRAFFT). <b>House practice:</b> UDS only for a clinical question and with informed consent; confirm positives (GC/MS or LC-MS/MS) \u2192 node 2. "
       "Then by substance \u2192 nodes 3\u20138.",
       fill=LIGHT, tsize=7.0, bsize=7.2, tag="n1")

action(c, 20, 282, 372, 56, "3. METH INTOXICATION \u00b7 MID GRAY",
       "HTN = preeclampsia workup (ANT-04), not \u201cjust meth.\u201d <b>House practice:</b> lorazepam first for HTN and agitation; severe BP \u2192 nifedipine or hydralazine (see ANT-SUD card); no beta-blockers, including labetalol. EFM while hypertensive. Admit if severe BP or preeclampsia not excluded.",
       fill=MID, tsize=7.0, bsize=7.2, tag="n3")
action(c, 404, 282, 368, 56, "4. STIMULANT WITHDRAWAL (CRASH) \u00b7 WHITE",
       "Supportive care; no FDA-approved drug. Rule out oversedation. Suicidality screen (CSM tool, e.g., C-SSRS); positive \u2192 sitter + psychiatry. <b>House practice:</b> NST on presentation; EFM if recent use, HTN, contractions, bleeding or pain; growth US if none in 3\u20134 wk.",
       fill=WHITE, tsize=7.0, bsize=7.2, tag="n4")

action(c, 20, 344, 372, 64, "5. OPIOIDS \u2014 OUD / MOUD / WITHDRAWAL \u00b7 WHITE",
       "Continue MOUD; never taper. COWS \u2192 treat promptly. <b>House practice: OBED may start buprenorphine</b> (standard start for discharge; see ANT-SUD card). Fentanyl \u2192 low-dose start, ADMIT. No nalbuphine/butorphanol (EHR allergy/intolerance field). Naloxone kit in hand.",
       fill=WHITE, tsize=7.0, bsize=7.2, tag="n5")
action(c, 404, 344, 368, 64, "6. COCAINE \u00b7 MID GRAY",
       "Abdominal pain or bleeding = abruption until proven otherwise \u2192 L&amp;D, EFM, CBC/fibrinogen/coags. <b>House practice:</b> lorazepam first; severe BP \u2192 nifedipine or hydralazine; no beta-blockers, including labetalol. Chest pain \u2192 ECG, troponin, cardiology.",
       fill=MID, tsize=7.0, bsize=7.2, tag="n6")

action(c, 20, 414, 372, 52, "7. ALCOHOL \u00b7 MID GRAY",
       "CIWA-Ar. <b>House practice:</b> any pregnant patient in withdrawal \u2192 ADMIT. Benzodiazepines (short-acting near term); thiamine; no valproate \u2014 see ANT-SUD card. Seizure / DTs \u2192 attending now.",
       fill=MID, tsize=7.0, bsize=7.2, tag="n7")
action(c, 404, 414, 368, 52, "8. CANNABIS / CHS \u00b7 WHITE",
       "Counsel. CHS vs hyperemesis (ANT-08). Refractory: <b>house practice:</b> capsaicin and/or haloperidol allowed with ECG/QTc first \u2014 see ANT-SUD card. Positive UDS alone is not a report.",
       fill=WHITE, tsize=7.0, bsize=7.2, tag="n8")

action(c, 20, 472, 752, 46, "9. OBED DISPOSITION \u00b7 LIGHT GRAY",
       "Admit: severe BP / preeclampsia not excluded, abruption concern, overdose observation, alcohol withdrawal, low-dose buprenorphine start, suicidality, psychosis, unable to care for self, preterm labor. "
       "Home: sober, normal vitals, reassuring FHR, safety plan, follow-up booked; OUD \u2192 naloxone kit + buprenorphine/OTP follow-up. Return precautions given.",
       fill=LIGHT, tsize=7.0, bsize=7.2, tag="n9")

action(c, 20, 524, 752, 56, "N / S / T / P \u2014 PEDS, SOCIAL WORK, TEXAS REPORTING, POSTPARTUM \u00b7 WHITE",
       "N: tell peds/NICU before delivery; NOWS expected with MOUD; Eat, Sleep, Console. Stable MOUD \u2192 breastfeeding encouraged. "
       "S: social work / case management on admission \u2014 always consult case management for hospital and community policy; Plan of Safe Care. "
       "T: no mandated report in pregnancy; after birth DFPS within 48 h if abuse/neglect suspected; a positive test alone is not neglect. "
       "P: continue MOUD, multimodal analgesia, naloxone kit, follow-up before discharge.",
       fill=WHITE, tsize=7.0, bsize=7.2, tag="nsp")

y = 524 + 56 + 8
draw_para(c, "Doses and drug amounts live only on the companion card (Substance use in pregnancy). Decision support only, not unit policy.",
       20, y + 4, PW - 40, 32, 6.4, 5.4, SLATE, tag="footer")
assert y + 40 <= PH, (y, PH)
c.showPage(); c.save()
if PROBLEMS:
    print("\n".join(PROBLEMS)); sys.exit(1)
subprocess.run(["pdftoppm", "-png", "-r", "200", "-singlefile", OUT, OUT[:-4]], check=True)
print("built", OUT, "page", PW, "x", PH, "content end", y)
