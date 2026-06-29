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