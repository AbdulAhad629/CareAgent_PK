import os
from fastapi.responses import FileResponse
from agents.prescription import generate_prescription_draft
from utils.prescription_pdf import generate_prescription_pdf
from utils.whatsapp import send_prescription_message
from core.config import settings
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from db.models import Doctor, Visit, Patient
from schemas.schemas import DoctorDashboard, DoctorPatient

router = APIRouter(prefix="/doctors", tags=["Doctors"])

TRIAGE_COLORS = {1: "🔴", 2: "🟠", 3: "🟡", 4: "🟢", 5: "⚪"}


@router.get("/", summary="List all doctors")
async def list_doctors(db: Session = Depends(get_db)):
    doctors = db.query(Doctor).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "specialty": d.specialty,
            "room": d.room,
            "available": d.available,
            "current_load": d.current_load,
            "max_load": d.max_load,
        }
        for d in doctors
    ]


@router.get("/{doctor_id}/dashboard", response_model=DoctorDashboard)
async def doctor_dashboard(doctor_id: int, db: Session = Depends(get_db)):
    """Doctor's view — current patient queue sorted by urgency."""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    rows = (
        db.query(Visit, Patient)
        .join(Patient, Visit.patient_id == Patient.id)
        .filter(
            Visit.doctor_id == doctor_id,
            Visit.status.in_(["waiting", "in_progress"]),
        )
        .order_by(Visit.triage_level.asc(), Visit.visit_date.asc())
        .all()
    )

    return DoctorDashboard(
        doctor_name=doctor.name,
        specialty=doctor.specialty,
        room=doctor.room,
        current_load=doctor.current_load,
        max_load=doctor.max_load,
        patients=[
            DoctorPatient(
                visit_id=v.id,
                token_number=v.token_number,
                patient_name=p.name,
                patient_age=p.age,
                triage_level=v.triage_level,
                triage_color=TRIAGE_COLORS.get(v.triage_level, "⚪"),
                symptoms=v.symptoms_english or v.symptoms_raw or "",
                triage_reason=v.triage_reason or "",
                status=v.status,
            )
            for v, p in rows
        ],
    )


@router.patch("/visits/{visit_id}/status")
async def update_visit_status(
    visit_id: int,
    status: str,
    diagnosis: str = "",
    prescription: str = "",
    db: Session = Depends(get_db),
):
    """
    Doctor updates visit status.
    status: in_progress | completed | discharged
    """
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    visit.status = status

    if diagnosis:
        visit.diagnosis = diagnosis

    if prescription:
        visit.prescription = prescription

    # Decrement doctor load when visit is finished
    if status in ("completed", "discharged") and visit.doctor_id:
        doctor = db.query(Doctor).filter(Doctor.id == visit.doctor_id).first()
        if doctor and doctor.current_load > 0:
            doctor.current_load -= 1

    db.commit()

    return {
        "message": f"Visit {visit_id} updated to '{status}'"
    }
@router.post("/visits/{visit_id}/prescription/draft")
async def draft_prescription(visit_id: int, doctor_notes: str = "", db: Session = Depends(get_db)):
    """
    AI generates a draft diagnosis + prescription + advice.
    Doctor can review/edit this before finalising.
    """
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    draft = generate_prescription_draft(
        symptoms=visit.symptoms_english or visit.symptoms_raw or "",
        age=visit.patient.age if visit.patient else None,
        gender=visit.patient.gender if visit.patient else None,
        triage_level=visit.triage_level,
        specialty=visit.required_specialty,
        doctor_notes=doctor_notes,
    )
    return draft


@router.post("/visits/{visit_id}/prescription/send")
async def finalize_and_send_prescription(
    visit_id: int,
    diagnosis: str,
    prescription: str,
    advice: str = "",
    db: Session = Depends(get_db),
):
    """
    Doctor confirms the (possibly edited) prescription.
    Saves it, generates a PDF, and sends it to the patient via WhatsApp.
    """
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    patient = visit.patient
    doctor = visit.doctor

    visit.diagnosis = diagnosis
    visit.prescription = prescription
    db.commit()

    pdf_filename = f"prescription_{visit.token_number}.pdf"
    pdf_path = os.path.join("static", "prescriptions", pdf_filename)
    generate_prescription_pdf(
        output_path=pdf_path,
        patient_name=patient.name if patient else "Patient",
        patient_age=patient.age if patient else None,
        patient_gender=patient.gender if patient else None,
        doctor_name=doctor.name if doctor else "Doctor",
        doctor_specialty=doctor.specialty if doctor else visit.required_specialty,
        token_number=visit.token_number,
        diagnosis=diagnosis,
        prescription=prescription,
        advice=advice,
    )

    pdf_url = f"{settings.BACKEND_PUBLIC_URL}/static/prescriptions/{pdf_filename}"

    send_result = send_prescription_message(
        phone=patient.phone if patient else None,
        patient_name=patient.name if patient else "Patient",
        pdf_url=pdf_url,
    )

    return {
        "message": "Prescription saved and sent",
        "pdf_url": pdf_url,
        "whatsapp": send_result,
    }


@router.get("/prescriptions/{filename}")
async def download_prescription(filename: str):
    """Direct download endpoint (alternative to /static mount)."""
    path = os.path.join("static", "prescriptions", filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="application/pdf", filename=filename)