#!/usr/bin/env python3
"""Build the postpartum VTE prophylaxis decision tree (Doc 4 Oct 2026 APPROVE-WITH-FIXES).

Standalone landscape letter chart + 2200x1700 PNG for the app.
No hospital or service-line branding, no personal names, no draft/review stamps,
no internal card codes on the face of the chart.
"""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color, white, black
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT_PDF = ROOT / "build" / "SYS-02_VTE_POSTPARTUM_DECISION_TREE_2026-11-20.pdf"
OUT_PNG = ROOT / "assets" / "diagrams" / "SYS-02_VTE_POSTPARTUM_DECISION_TREE_2026-11-20.png"

NAVY = HexColor("#0B3D5C")
HEX_FILL = HexColor("#EEF3F7")
HEX_EDGE = HexColor("#0B3D5C")
HIGH_FILL = HexColor("#4A4A4A")
MED_FILL = HexColor("#D9D9D9")
LT_LINE = HexColor("#9AA7B1")
RULE = HexColor("#333333")
W, H = 792, 612  # landscape letter

def wrap(text, font, size, width):
    words = text.split()
    if not words:
        return [""]
    lines, cur = [], words[0]
    for w in words[1:]:
        trial = cur + " " + w
        if pdfmetrics.stringWidth(trial, font, size) <= width:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines

def draw_wrapped(c, text, x, y, font, size, width, leading=None, color=black, align="left"):
    leading = leading or size + 1.2
    lines = wrap(text, font, size, width)
    c.setFillColor(color)
    c.setFont(font, size)
    yy = y
    for ln in lines:
        if align == "center":
            c.drawCentredString(x, yy, ln)
        elif align == "right":
            c.drawRightString(x, yy, ln)
        else:
            c.drawString(x, yy, ln)
        yy -= leading
    return yy

def wrap_bold_head(c, head, rest, x, y, width, head_font="Helvetica-Bold", rest_font="Helvetica", size=6.2, leading=7.4, color=black):
    """Draw a bold lead-in plus regular remainder, wrapping as needed."""
    c.setFillColor(color)
    head_w = pdfmetrics.stringWidth(head, head_font, size)
    # first line: head + as much of rest as fits
    words = rest.split() if rest else []
    first, leftover = [], words[:]
    used = head_w + (pdfmetrics.stringWidth(" ", rest_font, size) if words else 0)
    kept = []
    for w in words:
        extra = pdfmetrics.stringWidth((" " if kept else "") + w, rest_font, size)
        if used + extra <= width:
            kept.append(w)
            used += extra
        else:
            leftover = words[len(kept):]
            break
    else:
        leftover = []
    c.setFont(head_font, size)
    c.drawString(x, y, head)
    if kept:
        c.setFont(rest_font, size)
        c.drawString(x + head_w, y, " " + " ".join(kept) if head else " ".join(kept))
    yy = y - leading
    if leftover:
        yy = draw_wrapped(c, " ".join(leftover), x, yy, rest_font, size, width, leading, color)
    return yy

def rrect(c, x, y, w, h, fill=None, stroke=NAVY, radius=6, sw=1.0):
    c.saveState()
    if fill is not None:
        c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(sw)
    c.roundRect(x, y, w, h, radius, fill=1 if fill is not None else 0, stroke=1 if stroke else 0)
    c.restoreState()

def hexagon(c, x, y, w, h, fill=HEX_FILL, stroke=NAVY, sw=1.1):
    # elongated left-right hexagon; (x,y) is lower left of bounding box
    p = min(h * 0.42, w * 0.08, 16)
    path = c.beginPath()
    path.moveTo(x + p, y + h)
    path.lineTo(x + w - p, y + h)
    path.lineTo(x + w, y + h / 2)
    path.lineTo(x + w - p, y)
    path.lineTo(x + p, y)
    path.lineTo(x, y + h / 2)
    path.close()
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(sw)
    c.drawPath(path, fill=1, stroke=1)

def arrow_right(c, x0, x1, y, color=NAVY, head=6):
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.1)
    c.line(x0, y, x1 - head, y)
    p = c.beginPath()
    p.moveTo(x1, y)
    p.lineTo(x1 - head, y + head * 0.45)
    p.lineTo(x1 - head, y - head * 0.45)
    p.close()
    c.drawPath(p, fill=1, stroke=0)

def arrow_down(c, x, y0, y1, color=NAVY, head=6):
    # y0 is top, y1 is bottom tip
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.1)
    c.line(x, y0, x, y1 + head)
    p = c.beginPath()
    p.moveTo(x, y1)
    p.lineTo(x - head * 0.45, y1 + head)
    p.lineTo(x + head * 0.45, y1 + head)
    p.close()
    c.drawPath(p, fill=1, stroke=0)

def pill(c, cx, cy, text, w=70, h=12):
    rrect(c, cx - w / 2, cy - h / 2, w, h, fill=white, stroke=NAVY, radius=h / 2, sw=1.0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(cx, cy - 2.2, text)

def yesno(c, cx, cy, text, fill=HEX_FILL):
    w, h = 28, 11
    rrect(c, cx - w / 2, cy - h / 2, w, h, fill=fill, stroke=NAVY, radius=2.5, sw=0.8)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(cx, cy - 2.1, text)

def bullets(c, items, x, y, width, size=6.3, leading=7.6, bullet="•"):
    yy = y
    for it in items:
        # hanging indent
        c.setFillColor(black)
        c.setFont("Helvetica", size)
        c.drawString(x, yy, bullet)
        bx = x + 7
        lines = wrap(it, "Helvetica", size, width - 7)
        for i, ln in enumerate(lines):
            c.drawString(bx, yy, ln)
            yy -= leading
    return yy

def build():
    c = canvas.Canvas(str(OUT_PDF), pagesize=(W, H))
    c.setTitle("Postpartum VTE prophylaxis: risk decision tree")
    c.setAuthor("")
    c.setSubject("Decision support only, not unit policy. ACOG Practice Bulletin 196; CMQCC Maternal VTE Task Force.")

    # page background
    c.setFillColor(white)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # ----- header (navy title band; display-image builder overwrites this in the app PNG) -----
    HDR = 36
    c.setFillColor(NAVY)
    c.rect(0, H - HDR, W, HDR, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(14, H - 18, "POSTPARTUM VTE PROPHYLAXIS: RISK DECISION TREE")
    c.setFont("Helvetica", 6.4)
    c.drawString(14, H - 29.5, "Companion to Pregnancy-related thromboembolism  ·  ACOG Practice Bulletin 196  ·  CMQCC Maternal VTE Task Force  ·  Decision support only, not unit policy")
    c.setFont("Helvetica", 6.4)
    c.drawRightString(W - 14, H - 18, "20 November 2026")

    # how to read
    y = H - HDR - 4
    rrect(c, 12, y - 16, W - 24, 16, fill=white, stroke=NAVY, radius=2, sw=0.7)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 5.8)
    c.drawString(16, y - 11.5, "HOW TO READ THIS CHART:")
    c.setFont("Helvetica", 5.8)
    c.setFillColor(black)
    c.drawString(16 + pdfmetrics.stringWidth("HOW TO READ THIS CHART: ", "Helvetica-Bold", 5.8), y - 11.5,
                 "start at the top, follow the arrows, and answer each yes/no question. Hexagons are questions; shaded rectangles are the action. Stop at the first shaded result you reach.")

    # shading key
    ky = y - 28
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(14, ky, "SHADING KEY:")
    # white swatch
    def swatch(x, label, fill, stroke=black):
        c.setStrokeColor(stroke)
        c.setFillColor(fill)
        c.setLineWidth(0.7)
        c.rect(x, ky - 2, 14, 9, fill=1, stroke=1)
        c.setFillColor(black)
        c.setFont("Helvetica", 5.8)
        c.drawString(x + 17, ky, label)
        return x + 17 + pdfmetrics.stringWidth(label, "Helvetica", 5.8) + 14
    x = 78
    x = swatch(x, "WHITE = SCDs or early ambulation only", white, NAVY)
    x = swatch(x, "LIGHT GRAY = SCDs + prophylactic LMWH/UFH", MED_FILL, RULE)
    swatch(x, "DARK GRAY = to 6 weeks and/or therapeutic", HIGH_FILL, HIGH_FILL)

    # ===================== FLOW =====================
    # Available vertical: from ky-10 down to footer strips.
    # Strips need more room than the Oct 1 chart. Reserve ~132 pt for strips+footer.
    STRIP_TOP = 138
    flow_top = ky - 10
    flow_bot = STRIP_TOP + 4
    ML, MR = 12, W - 12

    # --- Row 1: Step 0, Step 1, High ---
    row1_h = 78
    row1_y = flow_top - row1_h

    # Step 0
    s0w, s0h = 118, 62
    s0x, s0y = ML, row1_y + (row1_h - s0h) / 2
    rrect(c, s0x, s0y, s0w, s0h, fill=NAVY, stroke=NAVY, radius=14, sw=0.8)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 6.4)
    c.drawCentredString(s0x + s0w / 2, s0y + s0h - 13, "STEP 0: START")
    c.setFont("Helvetica", 6.0)
    for i, ln in enumerate([
        "Postpartum patient:",
        "assess VTE risk at",
        "delivery (and re-assess if",
        "clinical change).",
    ]):
        c.drawCentredString(s0x + s0w / 2, s0y + s0h - 24 - i * 8, ln)

    # Step 1 box
    s1x = s0x + s0w + 22
    s1w = 392
    s1h = 78
    s1y = row1_y
    rrect(c, s1x, s1y, s1w, s1h, fill=white, stroke=NAVY, radius=8, sw=1.2)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 7.0)
    c.drawCentredString(s1x + s1w / 2, s1y + s1h - 11, "STEP 1: ANY HIGH-RISK TRIGGER?  (either mode of delivery)")
    left_items = [
        "High-risk thrombophilia (including APS), no prior VTE",
        "Any single prior VTE (including provoked, idiopathic, or estrogen-related)",
        "Multiple prior VTE",
        "Prior VTE + high-risk thrombophilia or APS",
    ]
    right_items = [
        "Low-risk thrombophilia + family history of VTE",
        "Already on outpatient LMWH/UFH, warfarin, or other full anticoagulation (e.g., mechanical valve)",
        "Acute VTE this pregnancy",
    ]
    bullets(c, left_items, s1x + 8, s1y + s1h - 22, s1w / 2 - 16, size=5.9, leading=7.3)
    bullets(c, right_items, s1x + s1w / 2 + 2, s1y + s1h - 22, s1w / 2 - 14, size=5.9, leading=7.3)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Oblique", 5.8)
    c.drawCentredString(s1x + s1w / 2, s1y + 5, "Any ONE trigger = YES")

    # arrow Step0 -> Step1
    arrow_right(c, s0x + s0w, s1x, s0y + s0h / 2)

    # High risk box
    hx = s1x + s1w + 36
    hw = MR - hx
    hh = 78
    hy = row1_y
    rrect(c, hx, hy, hw, hh, fill=HIGH_FILL, stroke=HIGH_FILL, radius=3, sw=0.8)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(hx + 5, hy + hh - 11, "HIGH RISK · DARK GRAY")
    c.setFont("Helvetica-Bold", 6.2)
    yy = draw_wrapped(c, "SCDs + LMWH/UFH to 6 weeks", hx + 5, hy + hh - 20, "Helvetica-Bold", 6.2, hw - 10, 7.4, white)
    c.setFont("Helvetica", 5.7)
    rest = ("EITHER prophylactic dose to 6 weeks OR therapeutic dose (postpartum dose at least antepartum dose) in hospital and to 6 weeks. "
            "Favor therapeutic if on adjusted-dose antepartum, or prior VTE + high-risk thrombophilia/APS. "
            "Prophylactic often enough for high-risk thrombophilia alone without prior VTE. Hematology and bleeding-risk judgment decide.")
    draw_wrapped(c, rest, hx + 5, yy - 1, "Helvetica", 5.7, hw - 10, 7.0, white)

    # YES arrow Step1 -> High
    midy = s1y + s1h / 2
    yesno(c, s1x + s1w + 18, midy, "YES")
    arrow_right(c, s1x + s1w, hx, midy)

    # NO down from Step 1
    no_x = s1x + s1w / 2
    arrow_down(c, no_x, s1y, s1y - 14)
    yesno(c, no_x, s1y - 7, "NO")

    # --- Step 2 hexagon ---
    s2w, s2h = 250, 22
    s2x = no_x - s2w / 2
    s2y = s1y - 14 - s2h
    hexagon(c, s2x, s2y, s2w, s2h)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 7.0)
    c.drawCentredString(s2x + s2w / 2, s2y + 7.5, "STEP 2: MODE OF DELIVERY?")

    # split arrows to CS / Vaginal
    split_y = s2y - 16
    cs_cx = 210
    vg_cx = 560
    # vertical from step2, then horizontal, then down to pills
    c.setStrokeColor(NAVY)
    c.setFillColor(NAVY)
    c.setLineWidth(1.1)
    junction = s2y
    # line down a bit, then left and right
    c.line(no_x, s2y, no_x, split_y + 6)
    c.line(cs_cx, split_y + 6, vg_cx, split_y + 6)
    arrow_down(c, cs_cx, split_y + 6, split_y - 8)
    arrow_down(c, vg_cx, split_y + 6, split_y - 8)
    pill(c, cs_cx, split_y - 14, "CESAREAN", w=72, h=12)
    pill(c, vg_cx, split_y - 14, "VAGINAL", w=72, h=12)

    # --- Branch panels ---
    pan_top = split_y - 22
    pan_bot = flow_bot + 2
    pan_h = pan_top - pan_bot
    gap = 10
    cs_x = ML
    cs_w = (MR - ML - gap) * 0.52
    vg_x = cs_x + cs_w + gap
    vg_w = MR - vg_x

    # panel borders
    rrect(c, cs_x, pan_bot, cs_w, pan_h, fill=white, stroke=NAVY, radius=3, sw=1.1)
    rrect(c, vg_x, pan_bot, vg_w, pan_h, fill=white, stroke=NAVY, radius=3, sw=1.1)

    # navy header bars
    bar_h = 13
    c.setFillColor(NAVY)
    c.rect(cs_x, pan_top - bar_h, cs_w, bar_h, fill=1, stroke=0)
    c.rect(vg_x, pan_top - bar_h, vg_w, bar_h, fill=1, stroke=0)
    # cover rounded top already drawn; redraw top corners by clipping not needed if we overpaint
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 6.6)
    c.drawString(cs_x + 6, pan_top - 9.5, "CESAREAN BRANCH")
    c.setFont("Helvetica", 5.8)
    c.drawRightString(cs_x + cs_w - 6, pan_top - 9.5, "Count MAJOR and MINOR factors")
    c.setFont("Helvetica-Bold", 6.6)
    c.drawString(vg_x + 6, pan_top - 9.5, "VAGINAL BRANCH")
    c.setFont("Helvetica", 5.8)
    c.drawRightString(vg_x + vg_w - 6, pan_top - 9.5, "Check BMI, hospitalization, thrombophilia")

    # All-CS line (Doc fix 8)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Oblique", 5.5)
    allcs = "All cesarean patients, at every risk level: early ambulation, avoid dehydration, and SCDs before incision until ambulatory."
    c.drawString(cs_x + 6, pan_top - bar_h - 9, allcs)

    # Major / Minor columns
    col_top = pan_top - bar_h - 14
    col_h = 78
    col_w = (cs_w - 14) / 2
    maj_x = cs_x + 5
    min_x = maj_x + col_w + 4
    rrect(c, maj_x, col_top - col_h, col_w, col_h, fill=white, stroke=NAVY, radius=2, sw=0.8)
    rrect(c, min_x, col_top - col_h, col_w, col_h, fill=white, stroke=NAVY, radius=2, sw=0.8)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 5.8)
    c.drawString(maj_x + 4, col_top - 9, "MAJOR FACTORS (count each)")
    c.drawString(min_x + 4, col_top - 9, "MINOR FACTORS (count each)")
    major = [
        "BMI >35 at delivery",
        "Low-risk thrombophilia",
        "PPH needing transfusion, further operation, or IR",
        "Infection needing antibiotics",
        "Antepartum hospitalization ≥72 h, current or within last month",
        "Chronic medical: sickle cell, SLE, significant cardiac disease, active IBD, active cancer, nephrotic syndrome",
    ]
    minor = [
        "Multiple gestation",
        "Age >40",
        "PPH ≥1000 mL without transfusion, further operation, or IR",
        "Family history of VTE (first-degree relative, before age 50)",
        "Smoker",
        "Preeclampsia",
    ]
    bullets(c, major, maj_x + 3, col_top - 18, col_w - 8, size=5.4, leading=6.7)
    bullets(c, minor, min_x + 3, col_top - 18, col_w - 8, size=5.4, leading=6.7)

    # Step 3A hexagon
    a_w = cs_w - 16
    a_h = 20
    a_x = cs_x + 8
    a_y = col_top - col_h - 6 - a_h
    # connector down from cols
    arrow_down(c, cs_x + cs_w / 2, col_top - col_h, a_y + a_h, head=5)
    hexagon(c, a_x, a_y, a_w, a_h)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 6.2)
    c.drawCentredString(a_x + a_w / 2, a_y + 7, "STEP 3A: 1 or more MAJOR factors, OR  2 or more MINOR factors?")

    # YES / NO to medium / low
    med_w = (cs_w - 20) / 2
    med_h = 36
    med_y = pan_bot + 5
    med_x = cs_x + 6
    low_x = med_x + med_w + 8
    # arrows
    yes_x = med_x + med_w / 2
    no_x2 = low_x + med_w / 2
    c.setStrokeColor(NAVY)
    c.setLineWidth(1.1)
    c.line(cs_x + cs_w / 2, a_y, cs_x + cs_w / 2, a_y - 7)
    c.line(yes_x, a_y - 7, no_x2, a_y - 7)
    arrow_down(c, yes_x, a_y - 7, med_y + med_h + 11, head=5)
    arrow_down(c, no_x2, a_y - 7, med_y + med_h + 11, head=5)
    yesno(c, yes_x, med_y + med_h + 6, "YES")
    yesno(c, no_x2, med_y + med_h + 6, "NO")

    rrect(c, med_x, med_y, med_w, med_h, fill=MED_FILL, stroke=RULE, radius=2, sw=1.0)
    rrect(c, low_x, med_y, med_w, med_h, fill=white, stroke=RULE, radius=2, sw=1.0)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 5.8)
    c.drawString(med_x + 4, med_y + med_h - 9, "MEDIUM RISK · LIGHT GRAY")
    c.setFont("Helvetica-Bold", 5.6)
    draw_wrapped(c, "SCDs + prophylactic LMWH/UFH", med_x + 4, med_y + med_h - 17, "Helvetica-Bold", 5.6, med_w - 8, 6.8)
    c.setFont("Helvetica", 5.4)
    draw_wrapped(c, "Give postpartum until discharge.", med_x + 4, med_y + 8, "Helvetica", 5.4, med_w - 8, 6.6)
    c.setFont("Helvetica-Bold", 5.8)
    c.drawString(low_x + 4, med_y + med_h - 9, "LOW RISK · WHITE")
    c.setFont("Helvetica-Bold", 5.6)
    c.drawString(low_x + 4, med_y + med_h - 17, "SCDs only")
    c.setFont("Helvetica", 5.4)
    draw_wrapped(c, "Mechanical prophylaxis (SCDs) only. Early ambulation, avoid dehydration.", low_x + 4, med_y + med_h - 25, "Helvetica", 5.4, med_w - 8, 6.6)

    # ----- Vaginal branch -----
    # Step 3B hexagon
    b_w = vg_w - 16
    b_h = 28
    b_x = vg_x + 8
    b_y = col_top - 8 - b_h
    hexagon(c, b_x, b_y, b_w, b_h)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 6.2)
    c.drawCentredString(b_x + b_w / 2, b_y + 16, "STEP 3B: BMI >40 AND")
    c.setFont("Helvetica-Bold", 5.8)
    c.drawCentredString(b_x + b_w / 2, b_y + 7, "(antepartum hospitalization ≥72 h, current or within last month,  OR low-risk thrombophilia)?")

    # YES left -> medium; NO right -> step 4
    vmed_w = vg_w * 0.46
    vmed_h = 48
    vmed_x = vg_x + 6
    vmed_y = b_y - 18 - vmed_h
    # step 4 to the right of medium, then two lows under it
    s4_w = vg_w - vmed_w - 20
    s4_h = 20
    s4_x = vmed_x + vmed_w + 10
    s4_y = vmed_y + vmed_h - s4_h

    yes3 = vmed_x + vmed_w / 2
    no3 = s4_x + s4_w / 2
    c.setStrokeColor(NAVY)
    c.setLineWidth(1.1)
    c.line(b_x + b_w / 2, b_y, b_x + b_w / 2, b_y - 7)
    c.line(yes3, b_y - 7, no3, b_y - 7)
    arrow_down(c, yes3, b_y - 7, vmed_y + vmed_h + 11, head=5)
    arrow_down(c, no3, b_y - 7, s4_y + s4_h + 11, head=5)
    yesno(c, yes3, vmed_y + vmed_h + 6, "YES")
    yesno(c, no3, s4_y + s4_h + 6, "NO")

    rrect(c, vmed_x, vmed_y, vmed_w, vmed_h, fill=MED_FILL, stroke=RULE, radius=2, sw=1.0)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 5.8)
    c.drawString(vmed_x + 4, vmed_y + vmed_h - 9, "MEDIUM RISK · LIGHT GRAY")
    c.setFont("Helvetica-Bold", 5.5)
    draw_wrapped(c, "SCDs + prophylactic LMWH/UFH", vmed_x + 4, vmed_y + vmed_h - 17, "Helvetica-Bold", 5.5, vmed_w - 8, 6.6)
    c.setFont("Helvetica", 5.3)
    draw_wrapped(c, "Give during the postpartum hospitalization. Consider 6 weeks if BMI ≥40 + thrombophilia.",
                 vmed_x + 4, vmed_y + vmed_h - 25, "Helvetica", 5.3, vmed_w - 8, 6.5)

    hexagon(c, s4_x, s4_y, s4_w, s4_h)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 5.8)
    c.drawCentredString(s4_x + s4_w / 2, s4_y + 7, "STEP 4: ISOLATED DELIVERY BMI >40?")

    # two low boxes under step 4
    lowh = 38
    loww = (s4_w - 8) / 2
    lowy = pan_bot + 5
    low1x = s4_x
    low2x = s4_x + loww + 8
    c.setStrokeColor(NAVY)
    c.setLineWidth(1.1)
    c.line(s4_x + s4_w / 2, s4_y, s4_x + s4_w / 2, s4_y - 6)
    c.line(low1x + loww / 2, s4_y - 6, low2x + loww / 2, s4_y - 6)
    arrow_down(c, low1x + loww / 2, s4_y - 6, lowy + lowh + 11, head=5)
    arrow_down(c, low2x + loww / 2, s4_y - 6, lowy + lowh + 11, head=5)
    yesno(c, low1x + loww / 2, lowy + lowh + 6, "YES")
    yesno(c, low2x + loww / 2, lowy + lowh + 6, "NO")

    rrect(c, low1x, lowy, loww, lowh, fill=white, stroke=RULE, radius=2, sw=1.0)
    rrect(c, low2x, lowy, loww, lowh, fill=white, stroke=RULE, radius=2, sw=1.0)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 5.6)
    c.drawString(low1x + 3, lowy + lowh - 9, "LOW · WHITE")
    c.setFont("Helvetica-Bold", 5.4)
    c.drawString(low1x + 3, lowy + lowh - 17, "SCDs only")
    c.setFont("Helvetica", 5.2)
    draw_wrapped(c, "Mechanical only.", low1x + 3, lowy + lowh - 25, "Helvetica", 5.2, loww - 6, 6.3)
    c.setFont("Helvetica-Bold", 5.6)
    c.drawString(low2x + 3, lowy + lowh - 9, "LOW · WHITE")
    c.setFont("Helvetica-Bold", 5.4)
    c.drawString(low2x + 3, lowy + lowh - 17, "Early ambulation")
    c.setFont("Helvetica", 5.2)
    draw_wrapped(c, "No pharmacologic prophylaxis.", low2x + 3, lowy + lowh - 25, "Helvetica", 5.2, loww - 6, 6.3)

    # ===================== REFERENCE STRIPS =====================
    # 4 content rows + thin footer. Label column 88 pt.
    LAB_W = 86
    strip_x = 12
    strip_w = W - 24
    row_defs = [
        ("DEFINITIONS",
         "High-risk thrombophilia = antithrombin deficiency, antiphospholipid syndrome (APS), or factor V Leiden (FVL) or prothrombin (PT) gene homozygous or compound heterozygous. "
         "Low-risk thrombophilia = FVL or PT gene heterozygous, or protein C or S deficiency. Family history = first-degree relative with VTE before age 50."),
        ("DOSING",
         "House default when the tree calls for prophylaxis: enoxaparin 40 mg SC daily for the postpartum hospital stay (6-week branches unchanged). "
         "Intermediate 40 mg SC q12h (not a CMQCC default). Therapeutic 1 mg/kg SC q12h. Anti-Xa: measure 4 h (3 to 5 h) after a dose; therapeutic target 0.6 to 1.0 IU/mL (q12h). "
         "Higher BMI (physician judgment): 50–90 kg 40 mg daily · 91–130 kg 60 mg daily · 131–170 kg 80 mg daily · >170 kg or <50 kg: pharmacy/hematology. "
         "UFH (ACOG PB 196 Table 2): prophylactic 5,000–7,500 units SC q12h first trimester; 7,500–10,000 second; 10,000 third unless the aPTT is elevated. "
         "Therapeutic UFH: ≥10,000 units SC q12h, aPTT 1.5–2.5× control 6 h after injection. Postpartum prophylactic UFH: confirm the dose with pharmacy. "
         "Renal: if CrCl <30 mL/min, enoxaparin 30 mg SC daily (label; verify with pharmacy) or use UFH; therapeutic LMWH needs dose reduction, hematology, and anti-Xa."),
        ("NEURAXIAL AND RESTART",
         "Restart at whichever is later: the post-birth window (no sooner than 4 to 6 h after vaginal birth or 6 to 12 h after cesarean) or the neuraxial interval. "
         "Low-dose daily LMWH: first dose ≥12 h after puncture; catheter may stay; remove catheter ≥12 h after last dose; next dose ≥4 h after removal. "
         "Low-dose BID: remove the catheter first; dose ≥12 h after puncture and ≥4 h after removal. "
         "Intermediate dose: use 24 h after puncture unless anesthesia directs otherwise; catheter out ≥4 h. "
         "Therapeutic LMWH: ≥24 h after puncture and catheter out ≥4 h. Bloody tap: delay LMWH 24 h. "
         "Do not combine an NSAID, antiplatelet, or a second heparin with a catheter plus LMWH. "
         "Low-dose UFH: remove catheter ≥4 to 6 h after a dose; next dose after removal per anesthesia (ASRA allows immediately; a 1-hour wait is more conservative). "
         "Before scheduled birth: hold prophylactic LMWH ≥12 h, therapeutic ≥24 h."),
        ("HOLD AND CONTRAINDICATIONS",
         "Hold pharmacologic anticoagulation for active bleeding or bleeding concern, ongoing PPH, platelets <~75k, coagulopathy or HELLP, prior HIT, or uncontrolled severe hypertension. "
         "SCDs continue when pharmacologic therapy is held, unless mechanical prophylaxis is also contraindicated — then early ambulation still applies, and pharmacologic prophylaxis is used when the tree otherwise calls for it and it is safe. "
         "HIT: check a platelet count if LMWH or UFH has been given for more than 4 days before neuraxial needle placement or catheter manipulation. "
         "LMWH, UFH, and warfarin are compatible with breastfeeding."),
    ]

    # compute row heights from wrapped text
    body_w = strip_w - LAB_W - 8
    size, leading = 5.7, 6.9
    heights = []
    for _, body in row_defs:
        n = len(wrap(body, "Helvetica", size, body_w))
        heights.append(max(16, n * leading + 5))
    total_h = sum(heights)
    # footer 10 pt
    foot_h = 10
    # place strips so bottom of footer is at y=4
    # If total too tall, shrink font slightly — already reserved 138
    top = 4 + foot_h + total_h
    # draw outer border
    c.setStrokeColor(NAVY)
    c.setLineWidth(1.0)
    c.rect(strip_x, 4 + foot_h, strip_w, total_h, fill=0, stroke=1)

    ycursor = 4 + foot_h + total_h
    for i, ((lab, body), rh) in enumerate(zip(row_defs, heights)):
        ycursor -= rh
        # label cell
        c.setFillColor(NAVY)
        c.rect(strip_x, ycursor, LAB_W, rh, fill=1, stroke=0)
        c.setStrokeColor(NAVY)
        c.setLineWidth(0.7)
        c.line(strip_x, ycursor, strip_x + strip_w, ycursor)
        c.line(strip_x + LAB_W, ycursor, strip_x + LAB_W, ycursor + rh)
        # label text centered vertically, may wrap 2 lines
        c.setFillColor(white)
        lab_lines = wrap(lab, "Helvetica-Bold", 5.3, LAB_W - 6)
        lab_block = len(lab_lines) * 6.4
        ly = ycursor + (rh + lab_block) / 2 - 6.2
        c.setFont("Helvetica-Bold", 5.3)
        for ln in lab_lines:
            c.drawCentredString(strip_x + LAB_W / 2, ly, ln)
            ly -= 6.4
        # body
        tx = strip_x + LAB_W + 4
        ty = ycursor + rh - 7.2
        draw_wrapped(c, body, tx, ty, "Helvetica", size, body_w, leading, black)

    # footer line
    c.setFillColor(black)
    c.setFont("Helvetica", 5.4)
    c.drawString(strip_x, 6, "SCDs = sequential compression devices. Decision support only · not the record · not unit policy.  Cite: CMQCC Maternal VTE Task Force; ACOG Practice Bulletin 196.")
    c.drawRightString(W - 12, 6, "20 November 2026")

    c.showPage()
    c.save()
    print("wrote", OUT_PDF)

    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    tmp = OUT_PDF.with_suffix("")
    subprocess.check_call(["pdftoppm", "-png", "-r", "200", "-singlefile", str(OUT_PDF), str(tmp)])
    # pdftoppm -singlefile writes tmp.png
    src = Path(str(tmp) + ".png")
    if src != OUT_PNG:
        src.replace(OUT_PNG)
    # verify size
    from PIL import Image
    im = Image.open(OUT_PNG)
    print("png", OUT_PNG, im.size)
    assert im.size == (2200, 1700), im.size

if __name__ == "__main__":
    build()
