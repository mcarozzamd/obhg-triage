# Build: FD-ANT-STI STIs on L&D router, 13 Nov 2026.
# Labor-path wording is Doc's recommended nodes only. No dose numbers.
# Entry choice added per Michael (13 Nov 2026): In labor / admitted vs OB ED triage.
# OB ED triage branch from Doc's 13 Nov 2026 draft; house decisions applied.
import os, sys, subprocess
sys.dont_write_bytecode = True
sys.path.insert(0, "/workspace/grok-obgyn/cards/flow-diagrams/")
import fd_common
fd_common.PH = 1010
from fd_common import *

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "ANT-STI_FLOW_2026-11-13.pdf")

c = new_canvas(OUT, "STIs on labor and delivery: what to do now")
header(c, "STIs ON LABOR AND DELIVERY: WHAT TO DO NOW",
       "FD-ANT-STI \u00b7 Companion to STIs on Labor and Delivery \u00b7 CDC STI Treatment Guidelines 2021 \u00b7 ACOG PB 220 \u00b7 Labor and delivery / OBED \u00b7 Decision support only, not unit policy",
       "Last reviewed: Provisional, Nov 2026", "PROVISIONAL")
howto(c, "<b>HOW TO READ THIS CHART:</b> start by choosing <b>In labor / admitted</b> or <b>OB ED triage</b>. "
         "The labor path is the router below (hard stops first). The OB ED triage branch is for patients not in labor or postpartum ≤12 wk. "
         "Doses and regimens live on the companion card; this chart lists none.", h=22)
key(c, [(WHITE, "WHITE = can wait / no delivery-mode change"), (LIGHT, "LIGHT GRAY = admission check"), (MID, "MID GRAY = treat before discharge"), (DARK, "DARK GRAY = hard stop \u2014 changes delivery")], y=76)

# ENTRY
hexagon(c, 20, 90, 752, 46, "START: IN LABOR / ADMITTED, OR OB ED TRIAGE?",
        "Choose the path that matches how she presents.", tag="entry")
arrow(c, [(210, 136), (210, 148)])
arrow(c, [(582, 136), (582, 148)])
action(c, 20, 148, 372, 56, "IN LABOR / ADMITTED \u00b7 WHITE",
       "Continue to the labor router (nodes 1\u20135 below).",
       fill=WHITE, tsize=7.2, bsize=6.8, tag="labor")
action(c, 404, 148, 368, 56, "OB ED TRIAGE \u00b7 WHITE",
       "Not in labor (any GA) or postpartum ≤12 wk. Continue to the OB ED triage branch below.",
       fill=WHITE, tsize=7.2, bsize=6.8, tag="triage")
# only the labor box continues
arrow(c, [(206, 204), (206, 214)])
line(c, [(206, 214), (396, 214)])
arrow(c, [(396, 214), (396, 226)], head=4)

# NODE 1 (labor path — Doc's nodes, numbering unchanged)
action(c, 20, 226, 752, 48, "1. ADMISSION STATUS CHECK \u00b7 LIGHT GRAY",
       "Syphilis, HIV and HBsAg must be known; also GC/CT and HSV history. Anything unknown gets ordered now. Then go to node 2.",
       fill=LIGHT, tsize=7.4, bsize=7.0, tag="n1")
arrow(c, [(396, 274), (396, 286)])

# NODE 2 hard stops
hexagon(c, 20, 286, 752, 44, "2. HARD STOPS \u2014 SHOWN FIRST",
        "Does anything change how she delivers? Check both boxes. Either or both may apply.", tag="n2")
arrow(c, [(210, 330), (210, 342)])
arrow(c, [(582, 330), (582, 342)])
action(c, 20, 342, 372, 72, "ACTIVE GENITAL HSV \u00b7 DARK GRAY",
       "<b>Active genital HSV lesions or prodrome, or ROM with lesions: cesarean.</b> "
       "This is a hard stop. See the companion card for the rest of HSV management.",
       fill=DARK, fg=WHITE, tsize=7.2, bsize=6.7, tag="hsv")
action(c, 404, 342, 368, 72, "HIV \u00b7 DARK GRAY",
       "<b>HIV reactive or unknown with risk, or viral load over 1,000 or unknown: IV ZDV,</b> "
       "then the HIV card / HHS guidance for mode of delivery. This is a hard stop.",
       fill=DARK, fg=WHITE, tsize=7.2, bsize=6.7, tag="hiv")
arrow(c, [(396, 414), (396, 428)])

# NODE 3
action(c, 20, 428, 752, 26, "3. TREAT BEFORE DISCHARGE \u2014 DELIVERY MODE UNCHANGED \u00b7 MID GRAY",
       "These do not change how she delivers. Treat before she leaves. Doses and regimens are on the companion card.",
       fill=MID, tsize=7.2, bsize=6.6, tag="n3h")
action(c, 20, 456, 372, 72, "SYPHILIS \u00b7 MID GRAY",
       "Positive or undocumented, including discordant results: benzathine penicillin by stage. "
       "Desensitize if she is allergic. Peds handoff with her titers and treatment dates. (Doses on the card.)",
       fill=MID, tsize=7.0, bsize=6.5, tag="syph")
action(c, 404, 456, 368, 72, "GC OR CT \u00b7 MID GRAY",
       "Positive or untreated: treatment per the card. Tell peds about untreated GC. Order EPT.",
       fill=MID, tsize=7.0, bsize=6.5, tag="gcct")
arrow(c, [(396, 528), (396, 542)])

# NODE 4
action(c, 20, 542, 752, 48, "4. CAN WAIT UNTIL POSTPARTUM OR ROUTINE CARE \u00b7 WHITE",
       "Trich, symptomatic BV, yeast, test of cure, and suppression counseling. "
       "<b>Fluconazole only after delivery.</b> Regimens are on the companion card.",
       fill=WHITE, tsize=7.2, bsize=6.8, tag="n4")
arrow(c, [(396, 590), (396, 604)])

# NODE 5
action(c, 20, 604, 752, 48, "5. PEDS HANDOFF SUMMARY \u00b7 LIGHT GRAY",
       "Auto-list whatever was flagged: syphilis; HSV (primary vs recurrent); untreated GC; HBsAg status; and HIV. "
       "Use the peds-handoff cue with this algorithm. Nothing is stored.",
       fill=LIGHT, tsize=7.2, bsize=6.8, tag="n5")

# OB ED TRIAGE BRANCH (Doc draft + Michael house decisions, 13 Nov 2026)
action(c, 20, 662, 752, 36, "OB ED TRIAGE BRANCH · LIGHT GRAY",
       "Not in labor (any GA) or postpartum ≤12 wk. Early pregnancy, location unknown, or pain/bleeding <20 wk: confirm pregnancy and location first; ectopic and septic abortion outrank every STI diagnosis.",
       fill=LIGHT, tsize=7.0, bsize=6.4, tag="obed-h")
action(c, 20, 700, 752, 36, "UNIVERSAL FIRST STEP · LIGHT GRAY",
       "GA/viability and FHT or EFM. Vitals and sepsis screen. Last prenatal labs (syphilis, HIV, HBsAg, GC/CT, urine culture) — draw any that are missing. Ask about partners, prior STI, and social risk. Contractions, bleeding, ROM or abnormal FHR → L&D, not this pathway.",
       fill=LIGHT, tsize=6.8, bsize=6.3, tag="obed-u")
action(c, 20, 738, 372, 48, "a) DISCHARGE / ITCHING · WHITE",
       "Workup and treatment per the card. Trich: always treat, including an incidental asymptomatic finding. BV symptomatic only. VVC: no oral fluconazole in pregnancy.",
       fill=WHITE, tsize=6.6, bsize=6.2, tag="oa")
action(c, 404, 738, 368, 48, "b) LESIONS / ULCERS · WHITE",
       "HSV PCR, syphilis serology, HIV. Darkfield/PCR if available (do not wait). Pending house decision on darkfield/PCR availability. Treatment per the card.",
       fill=WHITE, tsize=6.6, bsize=6.2, tag="ob")
action(c, 20, 788, 372, 48, "c) PELVIC PAIN / FEVER · WHITE",
       "Rule out ectopic, septic abortion, IAI, pyelo first. PID in pregnancy: hospitalize, IV, ID consult. Regimen per ID/pharmacy. Pending house decision.",
       fill=WHITE, tsize=6.6, bsize=6.2, tag="oc")
action(c, 404, 788, 368, 48, "d) DYSURIA · WHITE",
       "UA, culture, and GC/CT/trich NAAT. Pyelonephritis: admit as an inpatient for IV antibiotics. Cystitis/ASB: treatment per the card.",
       fill=WHITE, tsize=6.6, bsize=6.2, tag="od")
action(c, 20, 838, 372, 52, "e) SYPHILIS SCREEN · WHITE",
       "Treat in OBED; do not send her home for the shot. House practice (not a cited rule): J-H — before ~24 wk, discharge with return precautions; from 24 wk, first early-syphilis dose on L&D with fetal monitoring for several hours.",
       fill=WHITE, tsize=6.5, bsize=6.1, tag="oe")
action(c, 404, 838, 368, 52, "f) PARTNER / EPT  g) HIV OR HEP B UNKNOWN · WHITE",
       "Test and treat exposures per the card. EPT permitted in Texas for GC/CT, not syphilis. Unknown HIV: opt-out test, link to care. Unknown hep B: SMFM #69 — newborn vaccine plus HBIG within 12 h.",
       fill=WHITE, tsize=6.5, bsize=6.1, tag="ofg")
action(c, 20, 892, 752, 32, "BEFORE DISCHARGE · LIGHT GRAY",
       "Single-dose treatments given in OBED, not just prescribed. Doses live only on the companion card. TOC/retest, Texas reporting, partner treatment or DIS, prenatal follow-up within 1 wk. Return precautions.",
       fill=LIGHT, tsize=6.6, bsize=6.2, tag="odc")
y = 892 + 32 + 8
draw_para(c, "<b>PROVISIONAL</b> \u2014 pending Michael review and CSM pharmacy check. Not live. "
           "Doses and regimens live only on the companion card (STIs on Labor and Delivery). "
           "The OB ED triage branch is for patients not in labor or postpartum ≤12 wk. "
           "Decision support only, not orders or unit policy. Nothing typed into the cues is saved.",
           20, y, PW - 40, 28, 6.4, 5.4, SLATE, tag="footer")
assert y + 32 <= PH, (y, PH)
c.showPage(); c.save()
if PROBLEMS:
    print("\n".join(PROBLEMS)); sys.exit(1)
subprocess.run(["pdftoppm", "-r", "200", "-png", "-singlefile", OUT, OUT[:-4]], check=True)
print("built", OUT, "page", PW, "x", PH, "content end", y)
