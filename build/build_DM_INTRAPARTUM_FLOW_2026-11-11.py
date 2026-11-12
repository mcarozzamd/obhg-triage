# Build: Diabetes in labor (ALG-DM-INTRAPARTUM) one-page flow diagram, 11 Nov 2026. Same fd_common visual model as the house flow diagrams.
# Doses/bands come from js/dm-intrapartum.js (single source) so the image, the text companion and the tests cannot drift.
import os, sys, subprocess, json
sys.dont_write_bytecode = True
sys.path.insert(0, "/workspace/grok-obgyn/cards/flow-diagrams/")
from fd_common import *
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
T = json.loads(subprocess.check_output(["node", "-e", "const D=require('./js/dm-intrapartum.js');console.log(JSON.stringify({rows:D.table().map(r=>({label:r.band.label,fluid:r.band.fluid,rate:r.band.rate,t1:r.byType.T1.insulinUnitsPerHour,id:r.band.id})),rescue:D.RESCUE,mon:D.MONITORING}))"], cwd=ROOT, text=True))
OUT = os.path.join(HERE, "DM_INTRAPARTUM_FLOW_2026-11-11.pdf")
CH = []
def ch(*a): CH.append(a)
c = new_canvas(OUT, "Diabetes in labor: insulin and dextrose")
header(c, "DIABETES IN LABOR: INSULIN AND DEXTROSE",
       "Companion to Diabetes in pregnancy \u00b7 CSM OB insulin infusion protocol (CHRISTUS Health) \u00b7 ACOG PB 201 \u00b7 ADA Standards 2026 \u00a715\u201316 \u00b7 Labor and delivery \u00b7 Decision support only, not unit policy",
       "Last reviewed: Nov 2026", "")
howto(c, "<b>HOW TO READ THIS CHART:</b> Step 1 on admission. Each FSBG: find the row, set the insulin rate AND the fluid. Hexagons are questions; shaded rectangles are actions. FSBG is read as a whole number (60 = the \u226460 row).")
key(c, [(WHITE, "WHITE = monitor / set-up"), (LIGHT, "LIGHT GRAY = admission, after delivery"), (MID, "MID GRAY = insulin running"), (DARK, "DARK GRAY = hypoglycemia, DKA")])

pill(c, 20, 84, 150, 66, "STEP 0: DIABETES IN LABOR",
     "GDM A1/A2, type 2 or type 1 admitted for labor, induction or scheduled cesarean. Unsure of type or insulin-deficient: treat as type 1 for basal and get senior/endocrine review.", tag="s0")
arrow(c, [(170, 117), (182, 117)])
action(c, 182, 84, 330, 66, "STEP 1: ON ADMISSION (CSM) \u00b7 LIGHT GRAY",
       "<b>Stop all insulin, including SC insulin pumps, and oral agents. NPO except 8 oz ice chips every 4 h.</b> POC glucose; <b>BMP + urine ketones if FSBG &gt;160</b>. "
       "<b>Type 1: start the IV floor BEFORE stopping SC/pump, or keep the glargine/detemir already given \u2014 never a gap.</b> Night-before / morning home doses and steroid adjustment: per the CSM provider/pharmacy order set (this app gives no home doses).",
       fill=LIGHT, tsize=7.2, bsize=6.5, tag="s1")
arrow(c, [(512, 117), (528, 117)])
action(c, 528, 84, 244, 66, "DRIP SET-UP \u00b7 WHITE",
       "Regular insulin (Myxredlin) <b>100 units/100 mL</b>: units/h = mL/h; range <b>0.5\u20135 units/h</b>. PE-lined tubing: fill with insulin, <b>wait 20 min, then flush</b>. Smart pump, dedicated line, independent double-check. High-alert.",
       fill=WHITE, tsize=7.2, bsize=6.6, tag="setup")

action(c, 20, 160, 150, 104, "MONITORING \u00b7 WHITE",
       "<b>Drip running: FSBG every 1 h</b> regardless of dilation (Michael override of CSM q2h; ACOG PB 201).<br/>No drip: q2h latent/NPO; q1h at 4\u20136 cm or regular contractions (CSM).<br/>FSBG before starting IV fluids. Hospital POC for decisions; CGM for trends only.",
       fill=WHITE, tsize=7.0, bsize=6.4, tag="mon")
action(c, 20, 272, 150, 118, "TYPE 1: NEVER ZERO BASAL \u00b7 MID GRAY",
       "<b>61\u201390: 0.5 units/h floor + D5LR 125 + notify provider</b>; provider may set 0.5\u20131 units/h by trend. <b>Clinician override of the CSM chart</b> (CSM: hold). Not needed if effective SC basal or a working pump is on board; do not stack. "
       "Stop only for \u226460 or symptoms = <b>emergency pause</b>; resume 0.5 once &gt;70 and rising; pause &gt;~1 h needs provider review.",
       fill=MID, tsize=7.0, bsize=6.2, tag="t1")
arrow(c, [(347, 150), (347, 160)])
hexagon(c, 182, 160, 590, 40, "STEP 2: FSBG NOW \u2014 WHICH ROW? (CSM NOMOGRAM, MAINTENANCE 125 mL/h)",
        "Look up the current FSBG every check; move rows as glucose changes. No bolus. Max 5 units/h. Never use this chart to treat DKA.", tag="s2")
# nomogram table
x0, y0, cw = 182, 206, [118, 192, 160, 120]
hdr = ["FSBG (mg/dL)", "GDM (A1/A2) and type 2: insulin", "Type 1: insulin", "Fluid at 125 mL/h"]
x = x0
for w, h in zip(cw, hdr):
    rect(c, x, y0, w, 14, fill=NAVY, stroke=NAVY, lw=0.6); draw_para(c, "<b>%s</b>" % h, x + 3, y0 + 1, w - 6, 12, 7.0, 5.8, WHITE, valign="middle", tag="th"); x += w
y = y0 + 14; rh = 22
for r in T["rows"]:
    if r["id"] == "le60":
        cells = ["<b>%s</b>" % r["label"], "<b>No insulin. Contact provider. Hypoglycemia protocol (below).</b>", "<b>Emergency pause</b> (dextrose continues); resume 0.5 once &gt;70 and rising.", "<b>D5LR</b>"]; fill = DARK; fg = WHITE
    elif r["id"] == "61-90":
        cells = ["<b>%s</b>" % r["label"], "Hold infusion (A1: no insulin; monitor).", "<b>0.5 units/h floor</b> (provider 0.5\u20131) + notify \u00b7 <i>override of CSM</i>", "<b>D5LR</b>"]; fill = WHITE; fg = TEXT
    else:
        cells = ["<b>%s</b>" % r["label"], "<b>%g units/h</b>%s" % (r["rate"], " \u00b7 max: notify provider" if r["rate"] == 5 else ""), "<b>%g units/h</b>%s" % (r["t1"], " \u00b7 watch for ketones on LR" if r["fluid"].startswith("LR") else ""), "<b>%s</b>" % r["fluid"].split(" ")[0]]; fill = MID if r["rate"] >= 1 else LIGHT; fg = TEXT
    x = x0
    for w, t in zip(cw, cells):
        rect(c, x, y, w, rh, fill=fill, stroke=NAVY, lw=0.6); draw_para(c, t, x + 3, y + 1.5, w - 6, rh - 3, 7.4, 5.8, fg, valign="middle", tag="cell:" + r["id"]); x += w
    y += rh
assert y <= 398, y
resc = "".join("<b>%s:</b> %s<br/>" % (o["order"], o["when"]) for o in T["rescue"])
action(c, 20, 400, 500, 82, "HYPOGLYCEMIA <70 OR SYMPTOMS: RESCUE NOW (CSM ADULT HYPOGLYCEMIC PROTOCOL) \u00b7 DARK GRAY",
       resc + "Recheck in <b>15 min</b>; repeat until &gt;70. GDM/type 2: hold IV insulin. Don't delay symptomatic rescue for a lab value.",
       fill=DARK, fg=WHITE, tsize=7.0, bsize=6.0, tag="rescue")
action(c, 528, 400, 244, 82, "SICK, KETONES, VOMITING? \u2192 DKA \u00b7 DARK GRAY",
       "Pregnancy DKA can occur below 200. Check ketones (BHB), VBG, electrolytes/K+, anion gap; fetal monitoring. <b>Use the CSM DKA order set, not this chart.</b> Reference only, per CSM DKA order set: insulin 0.1 units/kg/h after K+ is safe. Type 1 on LR with ketones: here, no ad hoc dextrose.",
       fill=DARK, fg=WHITE, tsize=7.0, bsize=6.2, tag="dka")
for a in CH: chip(*a)
strips(c, 488, [
    ("A \u00b7 AFTER DELIVERY (CSM)", "Notify the provider when delivery is complete to start the <b>CSM Postpartum Diabetes Management Order Set</b> (doses there). GDM: stop insulin at placenta; OGTT 75 g at 4\u201312 weeks. Type 1: basal always covered. Continue IV insulin <b>1\u20132 h after the first SC basal dose</b>; then stop D5LR and insulin together.", 30),
    ("B \u00b7 NEWBORN", "Tell the nursery: diabetes type, treatment, last maternal glucose, steroids. Stable baby: feed within 1 hour; neonatal glucose protocol belongs to the nursery team.", 20),
    ("C \u00b7 STEROIDS / TIMING", "Don't withhold indicated steroids for hyperglycemia; SMFM #58: no late-preterm steroids in pregestational diabetes. Delivery timing and EFW \u22654500 g counseling stay on the Diabetes in pregnancy card.", 20),
    ("D \u00b7 NOTIFY", "RN to OBHG hospitalist: FSBG \u226460, 61\u201390 on a type 1 floor, 5 units/h with rising values, ketones, or a gap in type 1 basal.", 18),
], labw=112, gap=0)
footer(c, "<b>Doses to be checked against CSM pharmacy build.</b> Decision support only, not orders or unit policy. FSBG = fingerstick blood glucose; BHB = beta-hydroxybutyrate. "
          "<b>Cite:</b> CHRISTUS Health OB insulin infusion protocol (CSM, transcribed 11 Nov 2026); ACOG PB 190 and 201; ADA Standards of Care 2026 \u00a715\u201316; SMFM Consult #58.",
       "Last reviewed: Nov 2026", y=588, h=22)
c.showPage(); c.save()
if PROBLEMS:
    print("\n".join(PROBLEMS)); sys.exit(1)
subprocess.run(["pdftoppm", "-r", "200", "-png", "-singlefile", OUT, OUT[:-4]], check=True)
print("built", OUT)
