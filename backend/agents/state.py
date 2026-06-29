"""
Shared state passed through ALL 4 agents in the LangGraph pipeline.
Each agent reads from state and returns updated state.
"""
from typing import TypedDict, Optional, List


class PatientState(TypedDict):

    raw_input: str        
    symptoms_raw: str       
    input_language: str     

    # ── Agent 1: Reception Output ──────────────────────────
    patient_name: str
    patient_age: Optional[int]
    patient_gender: Optional[str]
    patient_phone: Optional[str]
    patient_cnic: Optional[str]
    patient_id: Optional[int]   
    token_number: str
    is_returning: bool


    symptoms_english: str    
    triage_level: int           
    triage_reason: str          
    required_specialty: str   
    is_emergency: bool

    
    assigned_doctor_id: Optional[int]
    assigned_doctor_name: Optional[str]
    assigned_room: Optional[str]
    wait_time_minutes: int
    visit_id: Optional[int]     

    
    discharge_summary: str
    followup_scheduled: bool
    followup_date: Optional[str]
    sms_sent: bool


    errors: List[str]
    current_step: str           
    timestamp: str
