"""
Agent 3 — Doctor Assignment Agent
• Finds best available doctor by required specialty
• Balances workload (least-loaded doctor first)
• Falls back to General if specialty unavailable
• Estimates wait time (avg 10 min/patient)
• Creates Visit record in PostgreSQL

No LLM needed here — pure business logic.
"""
from datetime import datetime
from sqlalchemy.orm import Session

from db.models import Doctor, Visit
from agents.state import PatientState


def _estimate_wait(doctor: Doctor) -> int:
    """10 minutes average per patient in queue."""
    return doctor.current_load * 10


def assignment_agent(state: PatientState, db: Session) -> PatientState:
    print("\n👨‍⚕️ [Agent 3] Assignment — finding doctor...")

    specialty = state.get("required_specialty", "General")

    
    doctors = (
        db.query(Doctor)
        .filter(Doctor.specialty == specialty, Doctor.available == True,
                Doctor.current_load < Doctor.max_load)
        .order_by(Doctor.current_load.asc())
        .all()
    )


    if not doctors:
        print(f"   ⚠️  No {specialty} doctor — falling back to General")
        doctors = (
            db.query(Doctor)
            .filter(Doctor.specialty == "General", Doctor.available == True,
                    Doctor.current_load < Doctor.max_load)
            .order_by(Doctor.current_load.asc())
            .all()
        )

    
    if not doctors:
        doctors = (
            db.query(Doctor)
            .filter(Doctor.available == True)
            .order_by(Doctor.current_load.asc())
            .all()
        )

    if not doctors:
        print("   ❌ No doctors available!")
        return {
            **state,
            "assigned_doctor_id":   None,
            "assigned_doctor_name": "No doctor available",
            "assigned_room":        "Please wait at reception",
            "wait_time_minutes":    999,
            "visit_id":             None,
            "errors": state.get("errors", []) + ["No doctors available"],
            "current_step": "followup",
        }

    doctor = doctors[0]
    wait   = _estimate_wait(doctor)

    # Create Visit record
    visit = Visit(
        patient_id        = state["patient_id"],
        doctor_id         = doctor.id,
        token_number      = state["token_number"],
        symptoms_raw      = state.get("symptoms_raw", ""),
        symptoms_english  = state.get("symptoms_english", ""),
        triage_level      = state.get("triage_level", 3),
        triage_reason     = state.get("triage_reason", ""),
        required_specialty = specialty,
        is_emergency      = state.get("is_emergency", False),
        status            = "waiting",
        wait_time_est     = wait,
        visit_date        = datetime.utcnow(),
    )
    db.add(visit)
    doctor.current_load += 1
    db.commit()
    db.refresh(visit)

    print(f"   ✅ Dr. {doctor.name} | Room {doctor.room} | ~{wait} min wait")

    return {
        **state,
        "assigned_doctor_id":   doctor.id,
        "assigned_doctor_name": doctor.name,
        "assigned_room":        doctor.room,
        "wait_time_minutes":    wait,
        "visit_id":             visit.id,
        "current_step":         "followup",
    }
