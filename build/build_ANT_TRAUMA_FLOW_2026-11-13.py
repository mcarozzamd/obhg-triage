# Build: FD-ANT-TRAUMA trauma-in-pregnancy algorithm, 13 Nov 2026.
# Wording is Doc's recommended nodes only. No dose numbers. Companion card holds doses.
import os, sys, subprocess
sys.dont_write_bytecode = True
sys.path.insert(0, "/workspace/grok-obgyn/cards/flow-diagrams/")
import fd_common
fd_common.PH = 820
from fd_common import *

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "ANT-TRAUMA_FLOW_2026-11-13.pdf")

c = new_canvas(OUT, "Trauma in pregnancy: evaluate, monitor, decide")
header(c, "TRAUMA IN PREGNANCY: EVALUATE, MONITOR, DECIDE",
       "FD-ANT-TRAUMA \u00b7 Companion to Trauma in pregnancy \u00b7 SOGC CPG No. 325 \u00b7 EAST 2010 \u00b7 ACOG \u00b7 Labor and delivery / OBED \u00b7 Decision support only, not unit policy",
       "Last reviewed: Provisional, Nov 2026", "PROVISIONAL")
howto(c, "<b>HOW TO READ THIS CHART:</b> start at node 1. Hexagons are questions; shaded rectangles are actions. "
         "Nodes 5 and 6 apply at <b>every branch</b>. <b>Doses live on the companion card; this chart lists none.</b> "
         "The 4\u20136 hour timer is a cue only, not a documented time.", h=20)
key(c, [(WHITE, "WHITE = discharge / proceed"), (LIGHT, "LIGHT GRAY = GA branch / monitoring"), (MID, "MID GRAY = extended monitoring"), (DARK, "DARK GRAY = unstable mother \u2014 stop here")], y=74)

# NODE 1
hexagon(c, 20, 86, 430, 70,
        "1. IS THE MOTHER UNSTABLE?",
        "Red flags: SBP &lt;90, HR &gt;120, altered mental status, high-energy mechanism, penetrating injury.",
        tag="n1")
arrow(c, [(450, 121), (470, 121)])
chip(c, 460, 110, "YES")
action(c, 470, 86, 302, 70, "UNSTABLE \u2014 STOP HERE \u00b7 DARK GRAY",
       "Trauma team or ED primary, OB at the bedside. Left uterine displacement if 20 weeks or more. "
       "Labs plus type and crossmatch. EFM only once the mother is stabilized. <b>Stop here.</b>",
       fill=DARK, fg=WHITE, tsize=7.0, bsize=6.5, tag="unstable")
arrow(c, [(235, 156), (235, 168)])
chip(c, 258, 162, "NO")

# NODE 2
hexagon(c, 20, 168, 430, 52, "2. GESTATIONAL AGE?",
        "Choose the branch that matches her gestational age. Viability cutoff: <b>per local policy</b>.",
        tag="n2")
# three branches
line(c, [(80, 220), (80, 230)]); line(c, [(235, 220), (235, 230)]); line(c, [(390, 220), (390, 230)])
line(c, [(80, 230), (390, 230)])
arrow(c, [(80, 230), (80, 240)], head=4)
arrow(c, [(235, 230), (235, 240)], head=4)
arrow(c, [(390, 230), (390, 240)], head=4)
action(c, 20, 240, 148, 102, "UNDER 20 WEEKS \u00b7 LIGHT GRAY",
       "Doppler FHT. Maternal evaluation. The Rh step (node 5). Then disposition by maternal findings.",
       fill=LIGHT, tsize=6.8, bsize=6.4, tag="ga20")
action(c, 176, 240, 164, 102, "20 WEEKS TO UNDER THE LOCAL VIABILITY CUTOFF \u00b7 LIGHT GRAY",
       "FHT and ultrasound. Rh step. Maternal disposition. Abruption precautions. "
       "Viability cutoff: <b>per local policy</b>.",
       fill=LIGHT, tsize=6.6, bsize=6.2, tag="ga-pre")
action(c, 348, 240, 102, 102, "VIABLE \u00b7 WHITE",
       "Go to node 3.",
       fill=WHITE, tsize=6.8, bsize=6.4, tag="ga-viable")
# also show that left two branches still do 5+6
draw_para(c, "Still complete nodes 5 and 6.", 20, 344, 430, 12, 6.4, 5.6, SLATE, tag="ga-note")

arrow(c, [(399, 342), (399, 360)])

# NODE 3
action(c, 176, 360, 430, 52, "3. EFM AND TOCO \u00b7 LIGHT GRAY",
       "EFM and toco for at least 4\u20136 hours from the event. Use the start-time and countdown cue with this algorithm "
       "(cue only, not a documented time; nothing is stored).",
       fill=LIGHT, tsize=7.0, bsize=6.5, tag="n3")
arrow(c, [(391, 412), (391, 424)])

# NODE 4
hexagon(c, 176, 424, 430, 62, "4. ANY EXTENDED-MONITORING CRITERION?",
        "Contractions 1 or more per 10 minutes, bleeding, uterine tenderness, ROM, a category II or III tracing, or a serious maternal mechanism or injury.",
        tag="n4")
# fork from bottom center of hexagon (391, 486)
line(c, [(391, 486), (391, 493)])
line(c, [(290, 493), (509, 493)])
arrow(c, [(290, 493), (290, 500)], head=4)
arrow(c, [(509, 493), (509, 500)], head=4)
chip(c, 268, 488, "YES")
chip(c, 531, 488, "NO")
action(c, 176, 500, 228, 88, "EXTEND MONITORING \u00b7 MID GRAY",
       "Extend to 24 hours. Add coags and fibrinogen. If abruption or preterm labor is suspected, see ANT-02 or the hemorrhage cards. "
       "Steroids and Mg per gestational age (doses on the cards).",
       fill=MID, tsize=6.7, bsize=6.2, tag="extend")
action(c, 412, 500, 194, 88, "DISCHARGE \u00b7 WHITE",
       "The 4\u20136 hours were reassuring. Discharge with abruption precautions. Still complete nodes 5 and 6.",
       fill=WHITE, tsize=6.7, bsize=6.3, tag="dc")

# NODES 5 and 6 \u2014 every branch
y = strips(c, 598, [
    ("5 \u00b7 RH STEP (EVERY BRANCH)",
     "<b>Rh-negative:</b> KB, then RhIG within 72 hours, with extra vials per the KB (dose on the card). "
     "<b>Rh-positive:</b> no RhIG.", 28),
    ("6 \u00b7 REQUIRED, ANY BRANCH",
     "Private IPV screen. Ultrasound for previa before any digital exam. "
     "A normal ultrasound does not rule out abruption.", 28),
    ("OBED WALK-IN",
     "Walk-in after minor trauma (not via ED/trauma): send to ED / activate trauma for any red flag, head strike with LOC, suspected fracture, injury beyond the uterus, or care OBED cannot provide. "
     "Delayed (&gt;24 h): still evaluate fully. Any contractions, bleeding, pain, leaking or decreased FM → extended monitoring. "
     "RhIG within 72 h; beyond 72 h still give and send KB (dose on the card). <b>Pending house decision</b> on RhIG &gt;72 h and on observation time after late trauma.", 42),
    ("MECHANISM / IPV / FOLLOW-UP",
     "Document mechanism in her words. Strangulation (any neck compression) is a high-lethality marker → ED/forensic evaluation. "
     "IPV screen alone; if positive, National Domestic Violence Hotline 1-800-799-7233, text START to 88788, discreetly, not on a printed AVS. "
     "Prenatal follow-up within 1 week. Seat-belt and fall-prevention counseling; acetaminophen (avoid NSAIDs ≥20 wk unless directed).", 42),
], labw=150, gap=2)

draw_para(c, "<b>PROVISIONAL</b> \u2014 pending Michael review and CSM pharmacy check. Not live. "
       "Doses live only on the companion card (Trauma in pregnancy). Decision support only, not unit policy. "
       "The 4\u20136 hour timer is a cue only, not a documented time; nothing is stored.",
       20, y + 4, PW - 40, 26, 6.4, 5.4, SLATE, tag="footer")

assert y + 30 <= PH, (y, PH)
c.showPage(); c.save()
if PROBLEMS:
    print("\n".join(PROBLEMS)); sys.exit(1)
subprocess.run(["pdftoppm", "-r", "200", "-png", "-singlefile", OUT, OUT[:-4]], check=True)
print("built", OUT, "page", PW, "x", PH, "content end", y)
