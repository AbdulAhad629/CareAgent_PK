from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()


class Patient(Base):
    __tablename__ = "patients"

    id         = Column(Integer, primary_key=True, index=True)
    cnic       = Column(String(15), unique=True, nullable=True)
    name       = Column(String(100), nullable=False)
    age        = Column(Integer, nullable=True)
    gender     = Column(String(10), nullable=True)
    phone      = Column(String(15), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    visits   = relationship("Visit", back_populates="patient")


class Doctor(Base):
    __tablename__ = "doctors"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(100), nullable=False)
    specialty    = Column(String(50), nullable=False)
    room         = Column(String(10), nullable=False)
    current_load = Column(Integer, default=0)
    max_load     = Column(Integer, default=30)
    available    = Column(Boolean, default=True)
    shift_start  = Column(String(5), default="08:00")
    shift_end    = Column(String(5), default="16:00")

    visits = relationship("Visit", back_populates="doctor")


class Visit(Base):
    """One patient visit = one token = one agent pipeline run."""
    __tablename__ = "visits"

    id               = Column(Integer, primary_key=True, index=True)
    patient_id       = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id        = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    token_number     = Column(String(15), unique=True, nullable=False)
    symptoms_raw     = Column(Text)           # Original Urdu/English input
    symptoms_english = Column(Text)           # Translated by triage agent
    triage_level     = Column(Integer)        # 1=Immediate ... 5=Non-urgent
    triage_reason    = Column(Text)           # AI explanation
    required_specialty = Column(String(50), default="General")
    is_emergency     = Column(Boolean, default=False)
    diagnosis        = Column(Text, nullable=True)  # Filled by doctor later
    prescription     = Column(Text, nullable=True)
    discharge_summary = Column(Text, nullable=True)
    status           = Column(String(20), default="waiting")
    # waiting → in_progress → completed → discharged
    wait_time_est    = Column(Integer, default=0)   # minutes
    visit_date       = Column(DateTime, default=datetime.utcnow)

    patient  = relationship("Patient", back_populates="visits")
    doctor   = relationship("Doctor",  back_populates="visits")
    followups = relationship("FollowUp", back_populates="visit")


class FollowUp(Base):
    __tablename__ = "followups"

    id         = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_id   = Column(Integer, ForeignKey("visits.id"),   nullable=False)
    scheduled  = Column(DateTime, nullable=False)
    type       = Column(String(20), default="sms")   # sms / call
    message    = Column(Text)
    status     = Column(String(20), default="pending")
    # pending → sent → done

    visit = relationship("Visit", back_populates="followups")
