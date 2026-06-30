"""
Prescription PDF Generator
────────────────────────────
Generates a clean, printable prescription PDF using reportlab.
"""
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT


def generate_prescription_pdf(
    output_path: str,
    patient_name: str,
    patient_age,
    patient_gender: str,
    doctor_name: str,
    doctor_specialty: str,
    token_number: str,
    diagnosis: str,
    prescription: str,
    advice: str = "",
) -> str:
    """Builds a prescription PDF and writes it to output_path. Returns the path."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        topMargin=18 * mm, bottomMargin=18 * mm,
        leftMargin=18 * mm, rightMargin=18 * mm,
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "TitleStyle", parent=styles["Heading1"],
        alignment=TA_CENTER, textColor=HexColor("#6D28D9"), fontSize=20,
    )
    sub_style = ParagraphStyle(
        "SubStyle", parent=styles["Normal"],
        alignment=TA_CENTER, textColor=HexColor("#555555"), fontSize=10,
    )
    section_style = ParagraphStyle(
        "SectionStyle", parent=styles["Heading3"],
        textColor=HexColor("#1E293B"), spaceBefore=12, spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "BodyStyle", parent=styles["Normal"],
        fontSize=11, leading=16, alignment=TA_LEFT,
    )

    elements = []

    elements.append(Paragraph("CareAgent PK", title_style))
    elements.append(Paragraph("AI Smart Hospital Platform — Prescription", sub_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", color=HexColor("#6D28D9"), thickness=1))
    elements.append(Spacer(1, 10))

    info_table = Table(
        [
            ["Patient Name:", patient_name, "Token #:", token_number],
            ["Age / Gender:", f"{patient_age or '-'} / {patient_gender or '-'}", "Date:", datetime.now().strftime("%d %b %Y")],
            ["Doctor:", doctor_name, "Specialty:", doctor_specialty],
        ],
        colWidths=[80, 160, 60, 130],
    )
    info_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (-1, -1), HexColor("#1E293B")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", color=HexColor("#E2E8F0"), thickness=0.5))

    elements.append(Paragraph("Diagnosis", section_style))
    elements.append(Paragraph(diagnosis or "—", body_style))

    elements.append(Paragraph("Prescription (Rx)", section_style))
    for line in (prescription or "—").split("\n"):
        if line.strip():
            elements.append(Paragraph(f"• {line.strip()}", body_style))

    if advice:
        elements.append(Paragraph("Advice", section_style))
        elements.append(Paragraph(advice, body_style))

    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width="100%", color=HexColor("#E2E8F0"), thickness=0.5))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        "This is a digitally generated prescription from CareAgent PK. "
        "Please consult your doctor before making any changes to medication.",
        ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8, textColor=HexColor("#94A3B8")),
    ))

    doc.build(elements)
    return output_path