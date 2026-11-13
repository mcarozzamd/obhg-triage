# Build: FD-ANT-STI STIs on L&D router, 13 Nov 2026.
# Labor-path wording is Doc's recommended nodes only. No dose numbers.
# Entry choice added per Michael (13 Nov 2026): In labor / admitted vs OB ED triage.
# The OB ED triage branch is a placeholder only — no triage clinical content until Doc's draft.
import os, sys, subprocess
sys.dont_write_bytecode = True
sys.path.insert(0, "/workspace/grok-obgyn/cards/flow-diagrams/")
import fd_common
fd_common.PH = 700
from fd_common import *

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "ANT-STI_FLOW_2026-11-13.pdf")

c = new_canvas(OUT, "STIs on labor and delivery: what to do now")
header(c, "STIs ON LABOR AND DELIVERY: WHAT TO DO NOW",
       "FD-ANT-STI \u00b7 Companion to STIs on Labor and Delivery \u00b7 CDC STI Treatment Guidelines 2021 \u00b7 ACOG PB 220 \u00b7 Labor and delivery / OBED \u00b7 Decision support only, not unit policy",
       "Last reviewed: Provisional, Nov 2026", "PROVISIONAL")
howto(c, "<b>HOW TO READ THIS CHART:</b> start by choosing <b>In labor / admitted</b> or <b>OB ED triage</b>. "
         "The labor path is the router below (hard stops first). The OB ED triage branch is a placeholder until Doc's draft. "
         "Doses and regimens live on the companion card; this chart lists none.", h=22)
key(c, [(WHITE, "WHITE = can wait / placeholder"), (LIGHT, "LIGHT GRAY = admission check"), (MID, "MID GRAY = treat before discharge"), (DARK, "DARK GRAY = hard stop \u2014 changes delivery")], y=76)

# ENTRY
hexagon(c, 20, 90, 752, 46, "START: IN LABOR / ADMITTED, OR OB ED TRIAGE?",
        "Choose the path that matches how she presents.", tag="entry")
arrow(c, [(210, 136), (210, 148)])
arrow(c, [(582, 136), (582, 148)])
action(c, 20, 148, 372, 56, "IN LABOR / ADMITTED \u00b7 WHITE",
       "Continue to the labor router (nodes 1\u20135 below).",
       fill=WHITE, tsize=7.2, bsize=6.8, tag="labor")
action(c, 404, 148, 368, 56, "OB ED TRIAGE \u2014 PLACEHOLDER \u00b7 WHITE",
       "Pending Doc's draft. No triage steps on this chart yet.",
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

y = 604 + 48 + 8
draw_para(c, "<b>PROVISIONAL</b> \u2014 pending Michael review and CSM pharmacy check. Not live. "
           "Doses and regimens live only on the companion card (STIs on Labor and Delivery). "
           "The OB ED triage branch is a placeholder until Doc's draft. "
           "Decision support only, not orders or unit policy. Nothing typed into the cues is saved.",
           20, y, PW - 40, 28, 6.4, 5.4, SLATE, tag="footer")
assert y + 32 <= PH, (y, PH)
c.showPage(); c.save()
if PROBLEMS:
    print("\n".join(PROBLEMS)); sys.exit(1)
subprocess.run(["pdftoppm", "-r", "200", "-png", "-singlefile", OUT, OUT[:-4]], check=True)
print("built", OUT, "page", PW, "x", PH, "content end", y)
