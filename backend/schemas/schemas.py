from pydantic import BaseModel
from typing import Optional


class RegisterRequest(BaseModel):
    raw_input: str          # "Mera naam Ahmed hai, 45 saal, chest mein dard"
    symptoms: str           # "chest pain, shortness of breath"
    audio_base64: Optional[str] = None   # Base64-encoded audio for voice input


class RegisterResponse(BaseModel):
    success: bool
    token_number: str
    patient_name: str
    triage_level: int
    triage_reason: str
    triage_color: str       # 🔴🟠🟡🟢⚪
    is_emergency: bool
    required_specialty: str
    assigned_doctor: str
    room: str
    wait_time_minutes: int
    followup_date: Optional[str]
    message_urdu: str       # Confirmation in Urdu


class QueueItem(BaseModel):
    token_number: str
    patient_name: str
    triage_level: int
    triage_color: str
    required_specialty: str
    doctor_name: str
    room: str
    wait_time_est: int
    status: str


class DoctorPatient(BaseModel):
    visit_id: int
    token_number: str
    patient_name: str
    patient_age: Optional[int]
    triage_level: int
    triage_color: str
    symptoms: str
    triage_reason: str
    status: str


class DoctorDashboard(BaseModel):
    doctor_name: str
    specialty: str
    room: str
    current_load: int
    max_load: int
    patients: list[DoctorPatient]
