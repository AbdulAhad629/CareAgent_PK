"""
Prescription Draft Agent
────────────────────────────
Generates a draft diagnosis + prescription + advice using AI,
based on the patient's triage info and doctor's optional notes.
Doctor can edit the draft before sending.

LLM : Groq Llama 3.1 8B (free) → fallback Gemini Flash (free)
"""
import json, re
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

from core.config import settings


PRESCRIPTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an experienced doctor at a hospital in Pakistan, writing a prescription.
Use the patient's symptoms and triage info to draft a prescription.
This is a DRAFT — the doctor will review and edit it before it's finalised.

Return ONLY valid JSON — no extra text:
{{
  "diagnosis": "likely diagnosis in 1-2 sentences",
  "prescription": "medicines, dosage, and duration — one per line",
  "advice": "general advice for the patient (rest, diet, follow-up, etc.)"
}}"""),
    ("human", """Patient: {age} year old {gender}
Symptoms: {symptoms}
Triage Level: {triage_level}
Specialty: {specialty}
Doctor's Notes (optional): {doctor_notes}"""),
])


def _parse_json(text: str) -> dict:
    clean = re.sub(r"```json|```", "", text).strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        return {}


def generate_prescription_draft(
    symptoms: str,
    age,
    gender: str,
    triage_level: int,
    specialty: str,
    doctor_notes: str = "",
) -> dict:
    payload = {
        "symptoms": symptoms or "Not specified",
        "age": age or "unknown",
        "gender": gender or "unknown",
        "triage_level": triage_level or "-",
        "specialty": specialty or "General",
        "doctor_notes": doctor_notes or "None",
    }

    result = {}
    for use_backup in (False, True):
        try:
            if not use_backup and settings.GROQ_API_KEY:
                llm = ChatGroq(api_key=settings.GROQ_API_KEY, model=settings.PRIMARY_LLM, temperature=0.3)
            else:
                llm = ChatGoogleGenerativeAI(google_api_key=settings.GEMINI_API_KEY, model=settings.BACKUP_LLM, temperature=0.3)
            chain = PRESCRIPTION_PROMPT | llm
            resp = chain.invoke(payload)
            result = _parse_json(resp.content)
            if result:
                break
        except Exception as e:
            print(f"   ⚠️  {'Groq' if not use_backup else 'Gemini'} failed: {e}")

    return {
        "diagnosis": result.get("diagnosis", ""),
        "prescription": result.get("prescription", ""),
        "advice": result.get("advice", ""),
    }