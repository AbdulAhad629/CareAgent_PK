"""
Analytics API — Dashboard stats for FYP presentation
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta

from db.session import get_db
from db.models import Visit, Patient, Doctor

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary")
async def get_summary(db: Session = Depends(get_db)):
    """Overall system stats."""
    today = datetime.utcnow().date()

    total_patients  = db.query(Patient).count()
    today_visits    = db.query(Visit).filter(
        func.date(Visit.visit_date) == today
    ).count()
    waiting         = db.query(Visit).filter(Visit.status == "waiting").count()
    completed_today = db.query(Visit).filter(
        func.date(Visit.visit_date) == today,
        Visit.status == "completed"
    ).count()
    emergency_today = db.query(Visit).filter(
        func.date(Visit.visit_date) == today,
        Visit.triage_level <= 2
    ).count()
    doctors_available = db.query(Doctor).filter(Doctor.available == True).count()

    avg_wait = db.query(func.avg(Visit.wait_time_est)).filter(
        func.date(Visit.visit_date) == today
    ).scalar() or 0

    return {
        "total_patients":    total_patients,
        "today_visits":      today_visits,
        "waiting_now":       waiting,
        "completed_today":   completed_today,
        "emergency_today":   emergency_today,
        "doctors_available": doctors_available,
        "avg_wait_minutes":  round(avg_wait, 1),
    }


@router.get("/triage-distribution")
async def triage_distribution(db: Session = Depends(get_db)):
    """Triage level distribution — for pie chart."""
    results = db.query(
        Visit.triage_level,
        func.count(Visit.id).label("count")
    ).group_by(Visit.triage_level).all()

    labels = {
        1: "Immediate",
        2: "Emergency",
        3: "Urgent",
        4: "Semi-Urgent",
        5: "Non-Urgent"
    }
    colors = {
        1: "#EF4444",
        2: "#F97316",
        3: "#EAB308",
        4: "#22C55E",
        5: "#94A3B8"
    }

    return [
        {
            "name":  labels.get(r.triage_level, f"Level {r.triage_level}"),
            "value": r.count,
            "color": colors.get(r.triage_level, "#94A3B8"),
            "level": r.triage_level
        }
        for r in results
    ]


@router.get("/daily-visits")
async def daily_visits(db: Session = Depends(get_db)):
    """Last 7 days visit count — for bar chart."""
    today = datetime.utcnow().date()
    days  = []

    for i in range(6, -1, -1):
        day   = today - timedelta(days=i)
        count = db.query(Visit).filter(
            func.date(Visit.visit_date) == day
        ).count()
        emergency = db.query(Visit).filter(
            func.date(Visit.visit_date) == day,
            Visit.triage_level <= 2
        ).count()
        days.append({
            "date":      day.strftime("%d %b"),
            "visits":    count,
            "emergency": emergency,
            "normal":    count - emergency,
        })

    return days


@router.get("/specialty-distribution")
async def specialty_distribution(db: Session = Depends(get_db)):
    """Most common specialties — for horizontal bar chart."""
    results = db.query(
        Visit.required_specialty,
        func.count(Visit.id).label("count")
    ).group_by(Visit.required_specialty)\
     .order_by(func.count(Visit.id).desc())\
     .limit(8).all()

    colors = ["#7C3AED","#6366F1","#06B6D4","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899"]

    return [
        {
            "specialty": r.required_specialty,
            "count":     r.count,
            "color":     colors[i % len(colors)]
        }
        for i, r in enumerate(results)
    ]


@router.get("/doctor-performance")
async def doctor_performance(db: Session = Depends(get_db)):
    """Doctor workload stats."""
    doctors = db.query(Doctor).all()
    result  = []

    for d in doctors:
        total = db.query(Visit).filter(Visit.doctor_id == d.id).count()
        completed = db.query(Visit).filter(
            Visit.doctor_id == d.id,
            Visit.status == "completed"
        ).count()
        result.append({
            "name":       d.name,
            "specialty":  d.specialty,
            "total":      total,
            "completed":  completed,
            "current":    d.current_load,
        })

    return sorted(result, key=lambda x: x["total"], reverse=True)[:6]