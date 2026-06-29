"""
Agent 2 — Symptom Triage Agent
────────────────────────────────
• Queries ChromaDB (RAG) for relevant medical context
• Classifies symptoms into 5 severity levels
• Identifies required medical specialty
• Flags emergency cases

LLM  : Groq Llama 3.1 8B (free) → fallback Gemini Flash (free)
RAG  : ChromaDB + HuggingFace multilingual embeddings (free, local)
"""
import json, re
from sqlalchemy.orm import Session

from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

from core.config import settings
from agents.state import PatientState


TRIAGE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert triage nurse at a government hospital in Pakistan.
Analyse the patient symptoms using the medical context below.

Medical Knowledge (RAG):
{medical_context}

Return ONLY valid JSON — no extra text:
{{
  "symptoms_english": "symptoms summarised in English",
  "triage_level":     <1|2|3|4|5>,
  "triage_reason":    "short plain-language explanation (1-2 sentences)",
  "required_specialty": "<one of: General|Cardiology|Orthopedics|Neurology|Pediatrics|Gynecology|ENT|Dermatology|Ophthalmology|Psychiatry>",
  "is_emergency":     <true|false>
}}

Triage Scale:
  1 = IMMEDIATE  — life-threatening (chest pain, stroke, unconscious)
  2 = EMERGENCY  — high-risk (high fever >104F, fracture, dengue)
  3 = URGENT     — moderate (moderate pain, infection, injury)
  4 = SEMI-URGENT — mild (minor wound, mild fever, UTI)
  5 = NON-URGENT — routine (cough, cold, check-up)"""),
    ("human", "Patient: {age} year old {gender}\nSymptoms: {symptoms}"),
])


def _retrieve_medical_context(symptoms: str) -> str:
    """Query ChromaDB for relevant medical knowledge."""
    try:
        embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
        vectorstore = Chroma(
            persist_directory=settings.CHROMA_DB_PATH,
            embedding_function=embeddings,
            collection_name="medical_knowledge",
        )
        docs = vectorstore.similarity_search(symptoms, k=3)
        context = "\n".join(d.page_content for d in docs)
        print(f"   📚 RAG: retrieved {len(docs)} chunks from ChromaDB")
        return context
    except Exception as e:
        print(f"   ⚠️  RAG failed (ChromaDB not loaded yet?): {e}")
        return "No additional medical context available."


def _parse_json(text: str) -> dict:
    clean = re.sub(r"```json|```", "", text).strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        return {}


def triage_agent(state: PatientState, db: Session = None) -> PatientState:
    print("\n🩺 [Agent 2] Triage — classifying symptoms...")

    symptoms = state.get("symptoms_raw") or state.get("raw_input", "")
    medical_context = _retrieve_medical_context(symptoms)

    payload = {
        "symptoms":       symptoms,
        "age":            state.get("patient_age") or "unknown",
        "gender":         state.get("patient_gender") or "unknown",
        "medical_context": medical_context,
    }

    result = {}
    for use_backup in (False, True):
        try:
            if not use_backup and settings.GROQ_API_KEY:
                llm = ChatGroq(api_key=settings.GROQ_API_KEY, model=settings.PRIMARY_LLM, temperature=0)
            else:
                llm = ChatGoogleGenerativeAI(google_api_key=settings.GEMINI_API_KEY, model=settings.BACKUP_LLM, temperature=0)
            chain = TRIAGE_PROMPT | llm
            resp = chain.invoke(payload)
            result = _parse_json(resp.content)
            if result:
                break
        except Exception as e:
            print(f"   ⚠️  {'Groq' if not use_backup else 'Gemini'} failed: {e}")

    # Safe defaults
    level    = result.get("triage_level", 3)
    reason   = result.get("triage_reason", "Manual review required")
    specialty = result.get("required_specialty", "General")
    is_emg   = result.get("is_emergency", level <= 2)

    color = {1:"🔴",2:"🟠",3:"🟡",4:"🟢",5:"⚪"}.get(level, "⚪")
    print(f"   ✅ Level {level} {color} | {specialty} | Emergency: {is_emg}")

    return {
        **state,
        "symptoms_english":    result.get("symptoms_english", symptoms),
        "triage_level":        level,
        "triage_reason":       reason,
        "required_specialty":  specialty,
        "is_emergency":        is_emg,
        "current_step":        "assignment",
    }
