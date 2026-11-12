# Build: Diabetes in labor (ALG-DM-INTRAPARTUM) one-page flow diagram, 11 Nov 2026 (rev. after Doc fixes). fd_common house visual model.
# ALL wording, doses and bands come from js/dm-intrapartum.js (single source; switches applied there), so the image, the text companion
# and the tests cannot drift. Page is landscape-letter width, taller (792 x 906 pt) to carry Doc's full rescue matrix legibly.
import os, sys, subprocess, json
sys.dont_write_bytecode = True
sys.path.insert(0, "/workspace/grok-obgyn/cards/flow-diagrams/")
import fd_common
fd_common.PH = 906
from fd_common import *
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
JS = ("const b=require('./js/dm-intrapartum.js');const D=process.env.DM_SWITCHES?b.create(JSON.parse(process.env.DM_SWITCHES)):b;"
      "console.log(JSON.stringify({rows:D.table().map(r=>({label:r.band.label,id:r.band.id,rate:r.band.rate,cells:r.cells})),rescue:D.RESCUE,after:D.RESCUE_AFTER,mon:D.MONITORING,T:D.TEXT,sw:D.SWITCHES,dec:D.DECIDED}))")
X = json.loads(subprocess.check_output(["node", "-e", JS], cwd=ROOT, text=True)); T = X["T"]
OUT = os.path.join(HERE, "DM_INTRAPARTUM_FLOW_2026-11-11.pdf")
import re
def e(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
def m(s, dark=False):
    col = "#F3C969" if dark else AMBER
    return re.sub(r"(\u2666 PENDING MICHAEL \([^)]*\)\.?)", r'<font color="%s"><b>\1</b></font>' % col, e(s))
PH = fd_common.PH
c = new_canvas(OUT, T["title"])
header(c, T["title"].upper(),
       "Companion to Diabetes in pregnancy \u00b7 CSM OB insulin infusion protocol (CHRISTUS Health) \u00b7 ACOG PB 190/201 \u00b7 ADA Standards 2026 \u00a76, \u00a715\u201316 \u00b7 Labor and delivery \u00b7 Decision support only, not unit policy",
       "Last reviewed: Nov 2026", "")
howto(c, "<b>HOW TO READ THIS CHART:</b> Step 1 on admission. Each FSBG: find the row, set the insulin rate AND the fluid. <b>Below 70 = low: rescue box.</b> Hexagons are questions; shaded rectangles are actions.")
key(c, [(WHITE, "WHITE = monitor / set-up"), (LIGHT, "LIGHT GRAY = admission, no-drip rule"), (MID, "MID GRAY = insulin running"), (DARK, "DARK GRAY = hypoglycemia, DKA")])
pill(c, 20, 84, 150, 80, "STEP 0: DIABETES IN LABOR", m(T["step0"]), tag="s0")
arrow(c, [(170, 124), (182, 124)])
action(c, 182, 84, 330, 80, "STEP 1: ON ADMISSION (CSM) \u00b7 LIGHT GRAY", m(T["step1"]), fill=LIGHT, tsize=7.2, bsize=6.6, tag="s1")
arrow(c, [(512, 124), (528, 124)])
action(c, 528, 84, 244, 80, "DRIP SET-UP \u00b7 WHITE", m(T["setup"]), fill=WHITE, tsize=7.2, bsize=6.6, tag="setup")
action(c, 20, 172, 150, 120, "MONITORING \u00b7 WHITE", "<br/>".join(m(x) for x in X["mon"]), fill=WHITE, tsize=7.0, bsize=6.3, tag="mon")
action(c, 20, 300, 150, 244, "TYPE 1: NEVER ZERO BASAL \u00b7 MID GRAY", m(T["t1"]), fill=MID, tsize=7.0, bsize=6.2, tag="t1")
arrow(c, [(347, 164), (347, 172)])
hexagon(c, 182, 172, 590, 54, "STEP 2: FSBG NOW \u2014 WHICH ROW? (CSM NOMOGRAM, MAINTENANCE 125 mL/h)", m(T["step2"]), tsize=7.8, bsize=6.4, tag="s2")
rect(c, 182, 230, 590, 24, fill=DARK, stroke=NAVY, lw=0.8)
draw_para(c, "<b>BELOW 70:</b> " + m(T["f1"], dark=True), 186, 231.5, 582, 21, 7.2, 5.8, WHITE, valign="middle", tag="f1")
x0, y0, cw = 182, 258, [118, 192, 160, 120]
hdr = ["FSBG (mg/dL)", "GDM A2 / type 2 on insulin", "Type 1: insulin", "Fluid at 125 mL/h"]
x = x0
for w, h in zip(cw, hdr):
    rect(c, x, y0, w, 14, fill=NAVY, stroke=NAVY, lw=0.6); draw_para(c, "<b>%s</b>" % h, x + 3, y0 + 1, w - 6, 12, 7.0, 5.6, WHITE, valign="middle", tag="th"); x += w
y = y0 + 14
for r in X["rows"]:
    rh = 34 if r["id"] in ("le60", "61-90") else 22
    dark = r["id"] == "le60"
    fill = DARK if dark else (WHITE if r["id"] == "61-90" else (MID if r["rate"] >= 1 else LIGHT)); fg = WHITE if dark else TEXT
    cl = ["<b>%s</b>" % e(r["label"]), m(r["cells"]["gdm"], dark), m(r["cells"]["t1"], dark), "<b>%s</b>" % e(r["cells"]["fluid"])]
    if r["rate"] >= 0.5: cl[1] = "<b>" + cl[1] + "</b>"
    x = x0
    for w, t in zip(cw, cl):
        rect(c, x, y, w, rh, fill=fill, stroke=NAVY, lw=0.6); draw_para(c, t, x + 3, y + 1.5, w - 6, rh - 3, 7.2, 5.6, fg, valign="middle", tag="cell:" + r["id"]); x += w
    y += rh
A1H = 96
action(c, 182, y + 4, 590, A1H, "DIET-CONTROLLED GDM (A1) OR ORAL AGENTS ONLY: NO DRIP \u00b7 LIGHT GRAY", m(T["f4"]), fill=LIGHT, tsize=7.4, bsize=7.0, tag="a1")
action(c, 182, y + 8 + A1H, 590, 38, "TYPE 1 ON PLAIN LR (\u2265121): KETONES \u00b7 MID GRAY", m(T["ketones"]), fill=MID, tsize=7.0, bsize=6.4, tag="ket")
ytop = max(y + 8 + A1H + 38, 300 + 244) + 8
assert ytop <= 700, ytop
resc = "".join("<b>%s:</b> %s<br/>" % (e(o["order"]), m(o["when"], True)) for o in X["rescue"]) + "<br/>".join(m(a, True) for a in X["after"])
action(c, 20, ytop, 500, 150, "HYPOGLYCEMIA <70 OR SYMPTOMS: RESCUE NOW (CSM ADULT HYPOGLYCEMIC PROTOCOL) \u00b7 DARK GRAY", resc, fill=DARK, fg=WHITE, tsize=7.2, bsize=6.6, tag="rescue")
action(c, 528, ytop, 244, 150, "SICK, KETONES, VOMITING? \u2192 DKA \u00b7 DARK GRAY", m(T["dka"], True), fill=DARK, fg=WHITE, tsize=7.0, bsize=6.4, tag="dka")
ys = ytop + 158
yend = strips(c, ys, [
    ("A \u00b7 AFTER DELIVERY (CSM)", m(T["after"]), 30),
    ("B \u00b7 NEWBORN", m(T["newborn"]), 20),
    ("C \u00b7 STEROIDS / TIMING", m(T["steroidsShort"]), 22),
    ("D \u00b7 NOTIFY", m(T["notify"]), 22),
], labw=112, gap=0)
footer(c, "<b>" + e(T["verify"].split(".")[0]) + ".</b> Decision support only, not orders or unit policy. FSBG = fingerstick blood glucose; BHB = beta-hydroxybutyrate; POC = point of care. "
          "<b>Cite:</b> CHRISTUS Health OB insulin infusion protocol (CSM, transcribed 11 Nov 2026); ACOG PB 190 and 201; ADA Standards of Care 2026 \u00a76, \u00a715\u201316; SMFM Consult #58.",
       "Last reviewed: Nov 2026", y=yend + 6, h=22)
assert yend + 30 <= PH, (yend, PH)
c.showPage(); c.save()
if PROBLEMS:
    print("\n".join(PROBLEMS)); sys.exit(1)
subprocess.run(["pdftoppm", "-r", "200", "-png", "-singlefile", OUT, OUT[:-4]], check=True)
print("built", OUT, "page", PW, "x", PH, "content end", yend)
