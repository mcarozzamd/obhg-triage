# Build: FD-ANT-UTI UTI/pyelo-in-pregnancy algorithm, 13 Nov 2026.
# Reviewed nodes. No dose numbers. Companion card holds doses. House practices applied.
import os, sys, subprocess
sys.dont_write_bytecode = True
sys.path.insert(0, "/workspace/grok-obgyn/cards/flow-diagrams/")
import fd_common
fd_common.PH = 560
from fd_common import *

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "ANT-UTI_FLOW_2026-11-13.pdf")

c = new_canvas(OUT, "UTI and pyelonephritis in pregnancy: what to do now")
header(c, "UTI AND PYELONEPHRITIS IN PREGNANCY: WHAT TO DO NOW",
       "FD-ANT-UTI \u00b7 Companion to UTI and pyelonephritis in pregnancy \u00b7 ACOG CC No. 4 \u00b7 IDSA 2019 \u00b7 ACOG CO 797 / 717 \u00b7 SMFM #67 \u00b7 Labor and delivery / OBED \u00b7 Decision support only, not unit policy",
       "Last reviewed: Nov 2026", "")
howto(c, "<b>HOW TO READ THIS CHART:</b> start by choosing In labor / admitted or OB ED triage. "
         "<b>Doses, regimens and durations live on the companion card; this chart lists none.</b> "
         "Every treatment node says see ANT-UTI card. Pregnant pyelo is always admitted.",
       h=20)
key(c, [(WHITE, "WHITE = home / ASB or cystitis"), (LIGHT, "LIGHT GRAY = first step / screen"),
        (MID, "MID GRAY = admit / inpatient pyelo"), (DARK, "DARK GRAY = sepsis \u2014 SYS-03 first")], y=74)

hexagon(c, 20, 90, 752, 44, "START: IN LABOR / ADMITTED, OR OB ED TRIAGE?",
        "Choose the path that matches how she presents. Pregnant or postpartum: GYNB-06 is never used.",
        tag="start")
arrow(c, [(210, 134), (210, 146)])
arrow(c, [(582, 134), (582, 146)])

action(c, 20, 148, 372, 36, "IN LABOR / ADMITTED \u00b7 WHITE",
       "Sepsis screen first (CSM tool). Positive \u2192 node 5. Fever in labor: IAI (LND-04) first; send UA + culture. Confirmed pyelo \u2192 node 4; see ANT-UTI card. GBS bacteriuria any count \u2192 IAP. Postpartum inpatient \u2192 node 6.",
       fill=WHITE, tsize=6.6, bsize=6.1, tag="labor")
action(c, 404, 148, 368, 36, "OB ED TRIAGE \u00b7 WHITE",
       "Not in labor (any GA) or postpartum \u226412 wk. Continue to the OB ED branch below.",
       fill=WHITE, tsize=6.6, bsize=6.1, tag="triage")

action(c, 20, 190, 752, 36, "1. UNIVERSAL FIRST STEP \u00b7 LIGHT GRAY",
       "Vitals with sepsis screen (CSM tool). GA/viability; FHT or EFM/toco. Contractions, bleeding, ROM or abnormal FHR \u2192 L&D in parallel. "
       "Sepsis screen positive or any red flag \u2192 node 5 (SYS-03) now. Otherwise: 2 ASB, 3 cystitis, or 4 pyelo.",
       fill=LIGHT, tsize=6.6, bsize=6.2, tag="n1")

action(c, 20, 232, 372, 52, "2. ASB \u00b7 WHITE",
       "Uropathogen \u2265100,000 CFU/mL: treat, culture-directed \u2014 see ANT-UTI card. Vaginal flora only: no treatment. GBS at ANY count: chart flag for IAP; antepartum treatment only if \u2265100,000 or symptomatic \u2014 see ANT-UTI card. Symptoms \u2192 node 3 or 4. Home \u2192 node 7.",
       fill=WHITE, tsize=6.4, bsize=6.0, tag="n2")
action(c, 404, 232, 368, 52, "3. ACUTE CYSTITIS \u00b7 WHITE",
       "UA + culture before the first dose. Pyuria with negative culture, or vaginal symptoms \u2192 NAAT and ANT-STI (first alternate). Treat empirically \u2014 see ANT-UTI card. Fever, CVA tenderness or vomiting \u2192 node 4. Home if afebrile and tolerating PO \u2192 node 7.",
       fill=WHITE, tsize=6.4, bsize=6.0, tag="n3")

action(c, 20, 290, 752, 56, "4. PYELONEPHRITIS \u2014 ALWAYS ADMIT IN PREGNANCY \u00b7 MID GRAY",
       "Fever \u226538.0 \u00b0C + urine findings + flank pain/CVA tenderness (\u00b1 N/V). No outpatient branch in pregnancy. UA + culture before the first IV dose (do not delay the dose). Start IV antibiotics in OBED \u2014 see ANT-UTI card. "
       "Measured fluids \u2014 ARDS/pulmonary edema risk. Clinically improved \u2192 oral step-down and total course \u2014 see ANT-UTI card. Not improving at 48\u201372 h \u2192 recheck culture; renal ultrasound; urology / ID as indicated. Septic \u2192 node 5.",
       fill=MID, tsize=6.6, bsize=6.1, tag="n4")

action(c, 20, 352, 752, 40, "5. SEPSIS RED FLAGS \u2014 SYS-03 FIRST \u00b7 DARK GRAY",
       "Open SYS-03 maternal sepsis flow first; ANT-UTI is the source card (antibiotic choice, source control). Cultures + lactate, antibiotics ideally within 1 h, crystalloid and pressor per SYS-03. Obstruction/stone/abscess \u2192 urology now. Sepsis alone is not an indication for delivery.",
       fill=DARK, fg=WHITE, tsize=6.6, bsize=6.1, tag="n5")

action(c, 20, 398, 752, 48, "6. POSTPARTUM (\u226412 WK) \u00b7 LIGHT GRAY",
       "No ASB screening or treatment postpartum. Cystitis \u2192 node 3 (lactation check on the card). Admit pyelo if any admit criterion (sepsis/red flag, unable to take PO, vomiting, immunocompromise, obstruction/stone, failed oral therapy, unreliable follow-up, within the delivery admission or \u22641 wk after cesarean). "
       "<b>House practice:</b> well-appearing, no admit criteria \u2014 IV dose plus oral therapy with follow-up in 24\u201348 h; see ANT-UTI card. Pregnant pyelo is still always admitted. GYNB-06 is still not used.",
       fill=LIGHT, tsize=6.5, bsize=6.0, tag="n6")

action(c, 20, 452, 752, 48, "7. DISPOSITION AND RETURN PRECAUTIONS \u00b7 WHITE",
       "Home (ASB, cystitis, or postpartum per node 6): afebrile, no CVA tenderness, tolerating PO, call-back named, GBS flag if applicable. Admit: any pyelo in pregnancy; sepsis; postpartum admit criterion. "
       "Return for fever, flank pain, vomiting, contractions, bleeding, leaking, decreased FM, shortness of breath, or symptoms not better in 48 h. "
       "<b>House practice:</b> routine test-of-cure culture 2 weeks after completing treatment for ASB or cystitis (ACOG and IDSA do not require it); after pyelo, test-of-cure culture 2 weeks after completing treatment. <b>House practice:</b> routine suppression after a single pyelo, until 4\u20136 weeks postpartum \u2014 see ANT-UTI card.",
       fill=WHITE, tsize=6.4, bsize=6.0, tag="n7")

y = 452 + 48 + 8
draw_para(c, "Doses, regimens and durations live only on the companion card (UTI and pyelonephritis in pregnancy). Decision support only, not unit policy.",
       20, y + 4, PW - 40, 32, 6.4, 5.4, SLATE, tag="footer")
assert y + 40 <= PH, (y, PH)
c.showPage(); c.save()
if PROBLEMS:
    print("\n".join(PROBLEMS)); sys.exit(1)
subprocess.run(["pdftoppm", "-png", "-r", "200", "-singlefile", OUT, OUT[:-4]], check=True)
print("built", OUT, "page", PW, "x", PH, "content end", y)
