import json, re
from datetime import datetime
from sqlalchemy.orm import Session

from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

from core.config import settings
from db.models import Patient, Visit
from agents.state import PatientState

RECEPTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a hospital reception assistant in Pakistan.
Extract patient information from Urdu, English, or mixed Hinglish input.

Name rules:
- "mera naam Ahmed hai" → Ahmed
- "main Sara hoon" → Sara
- If NO name found → use "Patient"

Phone rules:
- Extract any 10-11 digit number starting with 03 or +92
- "03047412646" → "03047412646"
- "0304-7412646" → "03047412646"
- Remove all dashes and spaces

Return ONLY valid JSON — no extra text, no markdown:
{{
  "name":     "extracted name or Patient",
  "age":      0,
  "gender":   "male or female or null",
  "phone":    "03XXXXXXXXX or null",
  "cnic":     "null",
  "language": "urdu or english or mixed"
}}"""),
    ("human", "Patient said: {input}")
])


def _get_llm(use_backup: bool = False):
    if not use_backup and settings.GROQ_API_KEY:
        return ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model=settings.PRIMARY_LLM,
            temperature=0,
        )
    return ChatGoogleGenerativeAI(
        google_api_key=settings.GEMINI_API_KEY,
        model=settings.BACKUP_LLM,
        temperature=0,
    )


def _make_token(db: Session) -> str:
    today = datetime.now().strftime("%d%m")
    count = db.query(Visit).filter(
        Visit.visit_date >= datetime.now().replace(hour=0, minute=0, second=0)
    ).count()
    return f"T{today}-{str(count + 1).zfill(3)}"


def _parse_json(text: str) -> dict:
    clean = re.sub(r"```json|```", "", text).strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        return {}


def reception_agent(state: PatientState, db: Session) -> PatientState:
    print("\n🏥 [Agent 1] Reception — processing input...")

    info = {}
    for use_backup in (False, True):
        try:
            llm = _get_llm(use_backup)
            chain = RECEPTION_PROMPT | llm
            resp = chain.invoke({"input": state["raw_input"]})
            info = _parse_json(resp.content)
            if info:
                break
        except Exception as e:
            print(f"   ⚠️  {'Groq' if not use_backup else 'Gemini'} failed: {e}")

    if not info:
        info = {"name": "Patient", "language": "english"}

    # Check returning patient
    patient = None
    if info.get("cnic") and info["cnic"] != "null":
        patient = db.query(Patient).filter(Patient.cnic == info["cnic"]).first()
    if not patient and info.get("phone") and info["phone"] != "null":
        patient = db.query(Patient).filter(Patient.phone == info["phone"]).first()

    is_returning = patient is not None

    if not is_returning:
        patient = Patient(
            name=info.get("name", "Patient"),
            age=info.get("age") if info.get("age") != 0 else None,
            gender=info.get("gender") if info.get("gender") != "null" else None,
            phone=info.get("phone") if info.get("phone") != "null" else None,
            cnic=info.get("cnic") if info.get("cnic") != "null" else None,
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

    token = _make_token(db)
    status = "returning" if is_returning else "new"
    print(f"   ✅ Patient: {patient.name} ({status}) | Token: {token} | Phone: {patient.phone}")

    return {
        **state,
        "patient_name":   patient.name,
        "patient_age":    patient.age,
        "patient_gender": patient.gender,
        "patient_phone":  patient.phone,
        "patient_cnic":   patient.cnic,
        "patient_id":     patient.id,
        "token_number":   token,
        "is_returning":   is_returning,
        "input_language": info.get("language", "english"),
        "current_step":   "triage",
    }