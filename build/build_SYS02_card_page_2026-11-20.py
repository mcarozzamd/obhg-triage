#!/usr/bin/env python3
"""Typeset the Pregnancy-related thromboembolism companion card page (book page 26/27)."""
import sys
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import ParagraphStyle as PS
from reportlab.lib.enums import TA_JUSTIFY, TA_RIGHT

# Reuse styles and helpers from the companion builder
sys.path.insert(0, "/workspace/grok-obgyn")
import build_qr as B

NAVY, GOLD, BLBG = B.NAVY, B.GOLD, B.BLBG
W, H = letter
ML, MR, MT, MB = B.ML, B.MR, B.MT, B.MB
CW = B.CW
TITLE = B.TITLE
FOOT = B.FOOT
S = B.S
esc = B.esc
P = B.P
card_header = B.card_header
bottom_line = B.bottom_line

OUT = Path("/workspace/obhg-triage-sys02-vte-2026-11-20/build/SYS-02_THROMBOEMBOLISM_CARD_2026-11-20.pdf")

SECTIONS = [
    ("Diagnose — do not use D-dimer", [
        "Suspected DVT: compression US of the proximal veins first (Level A). Whole-leg swelling ± flank/buttock pain → iliac imaging or empiric heparin. Repeat US at 3 and 7 days if iliac clot is not suspected and the first study is negative.",
        "Suspected PE: chest X-ray first. Normal film → V/Q. Abnormal film → CT angiography. Do not withhold imaging because she is pregnant.",
    ]),
    ("Postpartum chest pain (add-on)", [
        "PE until proven otherwise after cesarean, wound infection / reoperation, or other high VTE risk. Normal labs and a normal ECG do not exclude PE.",
        "Obtain CTA chest (or V/Q) before discharge in post-op / high-risk patients. Do not use D-dimer to clear her (see BOTTOM LINE).",
        "If she declines imaging: document the shared decision, PE counseling, and return precautions (chest pain, dyspnea, syncope).",
    ]),
    ("Treat acute VTE", [
        "Adjusted-dose LMWH first-line. Enoxaparin 1 mg/kg SC q12h. Anti-Xa target 0.6–1.0 IU/mL 4 hours after a twice-daily dose.",
        "No warfarin for most pregnant patients. No DOACs in pregnancy or lactation. Mechanical valve is the exception — multidisciplinary plan.",
        "Acute VTE this pregnancy: therapeutic antepartum and at least 6 weeks postpartum.",
    ]),
    ("Prophylaxis risk (CMQCC Low / Medium / High)", [
        "Major (CS algorithm): BMI ≥35 at delivery; low-risk thrombophilia; PPH requiring transfusion / further operation / IR; infection needing antibiotics; antepartum hospitalization ≥72h current or within last month; chronic medical (sickle cell, SLE, significant cardiac, active IBD, active cancer, nephrotic syndrome).",
        "Minor: multiple gestation; age >40; PPH ≥1000 mL without transfusion/further op/IR; family history VTE (1st-degree <50); smoker; preeclampsia.",
        "Cesarean — LOW (not medium/high): mechanical only. MEDIUM (1 major OR ≥2 minor): mechanical + prophylactic LMWH/UFH postpartum until discharge. (CMQCC table “>2 Minor”; house ≥2 per prose/ACCP.) HIGH (high-risk thrombophilia incl APS no prior VTE; any single prior VTE (including provoked, idiopathic, or estrogen-related); low-risk thrombophilia + family history of VTE; already on outpatient LMWH/UFH, warfarin, or other full anticoagulation; acute VTE this pregnancy; multiple prior VTE; prior VTE + high-risk thrombophilia/APS): mechanical + prophylactic to 6 weeks <b>OR</b> mechanical + therapeutic (PP dose ≥ antepartum) in hospital and to 6 weeks. Favor therapeutic if already adjusted-dose antepartum or prior VTE + high-risk thrombophilia/APS; prophylactic often enough for high-risk thrombophilia alone without prior VTE.",
        "Vaginal — LOW (isolated delivery BMI >40, no medium/high criteria): mechanical only; other vaginal without medium/high → early ambulation. MEDIUM (BMI >40 AND [antepartum hosp ≥72h current/past month OR low-risk thrombophilia]): mechanical + prophylactic during PP hospitalization; consider 6 weeks if BMI ≥40 + thrombophilia. HIGH: same high-risk set as CS → mechanical + prophylactic to 6 weeks <b>OR</b> mechanical + therapeutic to 6 weeks (favor therapeutic if already adjusted-dose antepartum or prior VTE + high-risk thrombophilia/APS; otherwise prophylactic often enough — bleeding risk / hematology).",
        "Definitions: High-risk thrombophilia = ATIII def, APS, FVL or PT homozygous/compound het. Low-risk = FVL or PT heterozygous, protein C or S deficiency. Family Hx = 1st-degree VTE before age 50. All CS: ambulate, avoid dehydration, mechanical before CS until ambulatory.",
    ]),
    ("Around birth", [
        "SCDs before every cesarean. Hold prophylactic LMWH ≥12 hours before scheduled induction or cesarean; hold therapeutic ≥24 hours.",
        "Restart no sooner than 4–6 hours after vaginal birth or 6–12 hours after cesarean. After neuraxial: delay therapeutic LMWH ≥24 hours after the block and ≥4 hours after catheter removal.",
        "Warfarin, LMWH, and UFH are compatible with breastfeeding.",
    ]),
    ("Doses", [
        "When the tree calls for prophylaxis: Prophylactic enoxaparin 40 mg SC daily; Intermediate 40 mg SC q12h (weight extremes / hematology — not a CMQCC L/M/H default); Therapeutic 1 mg/kg SC q12h (Anti-Xa 0.6–1.0). Hold prophylactic ≥12h / therapeutic ≥24h before scheduled birth.",
        "<b>HOUSE DEFAULT UNCHANGED:</b> when pharmacologic prophylaxis is indicated by the tree, enoxaparin 40 mg SC once daily for the postpartum hospital stay only (6-week branches unchanged).",
        "When the tree calls for prophylaxis: <b>HIGHER BMI (physician judgment):</b> booking/current weight 50–90 kg: 40 mg daily · 91–130 kg: 60 mg daily · 131–170 kg: 80 mg daily. >170 kg or <50 kg: pharmacy/hematology.",
        "<b>NEURAXIAL TIMING:</b> first dose 12 h after neuraxial placement OR ≥4 h after catheter removal, WHICHEVER IS LATER.",
        "<b>HOLD:</b> platelets <~75k or active bleeding / bleeding concern. SCDs continue.",
        "Postpartum prophylactic UFH: 5,000 units SC q12h.",
    ]),
]

BL = ("No D-dimer. Compression US for the leg; CXR then V/Q or CTA for the chest. "
      "Enoxaparin 1 mg/kg q12h for acute clot. CMQCC risk band (L/M/H) drives postpartum mechanical ± pharmacologic duration. "
      "Hold prophylactic 12 hours / therapeutic 24 hours before scheduled birth; SCDs before every cesarean.")

def header_footer(page_label):
    def _hf(c, doc):
        c.saveState()
        c.setFillColor(NAVY)
        c.rect(0, H - 0.36 * inch, W, 0.36 * inch, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Times-Bold", 9)
        c.drawString(ML, H - 0.23 * inch, TITLE)
        c.setFont("Times-Roman", 7.5)
        c.drawRightString(W - MR, H - 0.23 * inch, "CHRISTUS St. Michael / OBHG · 1 Sep 2026")
        c.setFillColor(GOLD)
        c.rect(0, H - 0.40 * inch, W, 0.04 * inch, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.rect(0, 0, W, 0.32 * inch, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(0, 0.32 * inch, W, 0.03 * inch, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Times-Roman", 7)
        c.drawString(ML, 0.13 * inch, FOOT)
        c.setFont("Times-Bold", 7.5)
        c.drawRightString(W - MR, 0.13 * inch, f"Page {page_label}")
        c.restoreState()
    return _hf

def h3(text):
    return Paragraph(esc(text), S["h3"])

def bul(text):
    # text may contain <b>..</b> already; escape the rest carefully
    if "<b>" in text:
        # split on bold tags
        parts=[]
        rest=text
        while True:
            i=rest.find("<b>")
            if i<0:
                parts.append(esc(rest))
                break
            parts.append(esc(rest[:i]))
            j=rest.find("</b>", i)
            parts.append("<b>"+esc(rest[i+3:j])+"</b>")
            rest=rest[j+4:]
        body="".join(parts)
    else:
        body=esc(text)
    return Paragraph("• " + body, S["bul"])

def build(out: Path, page_label: int):
    out.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(out), pagesize=letter,
        leftMargin=ML, rightMargin=MR, topMargin=0.58*inch, bottomMargin=0.48*inch,
        title="Thromboembolism in pregnancy",
        author="",
        subject="Decision support. Not the record. Confirm vs house cart.",
    )
    story = [card_header("Thromboembolism in pregnancy", "ACOG PB 196 · CMQCC VTE"), Spacer(1, 8)]
    for title, bullets in SECTIONS:
        story.append(h3(title))
        for b in bullets:
            story.append(bul(b))
        story.append(Spacer(1, 3))
    story.append(Spacer(1, 2))
    story.append(bottom_line(BL))
    doc.build(story, onFirstPage=header_footer(page_label), onLaterPages=header_footer(page_label))
    print("wrote", out, "page label", page_label)

if __name__ == "__main__":
    base = Path("/workspace/obhg-triage-sys02-vte-2026-11-20/build")
    build(base / "SYS-02_THROMBOEMBOLISM_CARD_p26_2026-11-20.pdf", 26)
    build(base / "SYS-02_THROMBOEMBOLISM_CARD_p27_2026-11-20.pdf", 27)
