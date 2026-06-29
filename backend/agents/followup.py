"""
Agent 4 — Follow-up Agent
• Generates bilingual (Urdu + English) discharge summary
• Saves summary to Visit record in PostgreSQL
• Creates FollowUp record (Day 3 reminder)
• Sends confirmation SMS via Twilio (optional — free trial credit)

LLM: Groq Llama 3.1 8B (free) → fallback Gemini Flash (free)
SMS: Twilio free $15 trial (optional — skipped if no credentials)
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate


from core.config import settings
from db.models import Visit, FollowUp
from agents.state import PatientState

SUMMARY_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful hospital assistant in Pakistan.
Write a SHORT, clear discharge note in BOTH English and Urdu.

Format strictly:
**English:**
[2-3 sentences: what happened, next steps]

**اردو:**
[Same in simple Urdu — use easy words]

**Follow-up Instructions:**
- When to return
- Warning signs to watch for"""),
    ("human", """Patient: {name}, Age: {age}, Gender: {gender}
Symptoms: {symptoms}
Triage Level: {level} ({reason})
Assigned Doctor: {doctor} — Room {room}"""),
])

def _send_whatsapp(phone: str, message: str) -> bool:
    """Send WhatsApp message via Twilio Sandbox (free)."""
    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
        print("   ℹ️  Twilio not configured — WhatsApp skipped")
        return False
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        # Format phone number for WhatsApp
        if not phone.startswith("+"):
            phone = "+92" + phone.lstrip("0")
        whatsapp_to = f"whatsapp:{phone}"

        client.messages.create(
            body=message,
            from_="whatsapp:+14155238886",
            to=whatsapp_to
        )
        print(f"   ✅ WhatsApp sent to {phone}")
        return True
    except Exception as e:
        print(f"   ⚠️  WhatsApp failed: {e}")
        return False


def followup_agent(state: PatientState, db: Session) -> PatientState:
    print("\n📋 [Agent 4] Follow-up — generating discharge summary...")

    summary = ""
    for use_backup in (False, True):
        try:
            if not use_backup and settings.GROQ_API_KEY:
                llm = ChatGroq(api_key=settings.GROQ_API_KEY, model=settings.PRIMARY_LLM, temperature=0.3)
            else:
                llm = ChatGoogleGenerativeAI(google_api_key=settings.GEMINI_API_KEY, model=settings.BACKUP_LLM, temperature=0.3)
            chain = SUMMARY_PROMPT | llm
            resp = chain.invoke({
                "name":     state.get("patient_name", "Patient"),
                "age":      state.get("patient_age", "N/A"),
                "gender":   state.get("patient_gender", "N/A"),
                "symptoms": state.get("symptoms_english", ""),
                "level":    state.get("triage_level", 3),
                "reason":   state.get("triage_reason", ""),
                "doctor":   state.get("assigned_doctor_name", "Doctor"),
                "room":     state.get("assigned_room", "N/A"),
            })
            summary = resp.content
            break
        except Exception as e:
            print(f"   ⚠️  {'Groq' if not use_backup else 'Gemini'} failed: {e}")

    if not summary:
        summary = f"Patient {state.get('patient_name')} visited on {datetime.now().strftime('%d/%m/%Y')}. Please follow doctor's advice."


    if state.get("visit_id"):
        visit = db.query(Visit).filter(Visit.id == state["visit_id"]).first()
        if visit:
            visit.discharge_summary = summary

    followup_date = datetime.utcnow() + timedelta(days=3)
    if state.get("patient_id") and state.get("visit_id"):
        fu = FollowUp(
            patient_id = state["patient_id"],
            visit_id   = state["visit_id"],
            scheduled  = followup_date,
            type       = "sms",
            message    = f"Follow-up reminder for token {state.get('token_number')}. Please visit if symptoms persist.",
            status     = "pending",
        )
        db.add(fu)
    db.commit()

    # --- Send confirmation SMS ---
    sms_sent = False
    if state.get("patient_phone"):
        triage_emoji = {1:"🔴",2:"🟠",3:"🟡",4:"🟢",5:"⚪"}.get(state.get("triage_level",3),"⚪")
        sms_text = (
            f"CareAgent PK — Assalamu Alaikum {state.get('patient_name')}!\n"
            f"Token: {state.get('token_number')} {triage_emoji}\n"
            f"Doctor: {state.get('assigned_doctor_name')} | Room: {state.get('assigned_room')}\n"
            f"Wait: ~{state.get('wait_time_minutes')} min\n"
            f"Follow-up: {followup_date.strftime('%d/%m/%Y')}"
        )
        sms_sent = _send_whatsapp(state["patient_phone"], sms_text)

    print(f"   ✅ Summary generated | Follow-up: {followup_date.strftime('%d/%m/%Y')}")

    return {
        **state,
        "discharge_summary":  summary,
        "followup_scheduled": True,
        "followup_date":      followup_date.strftime("%d/%m/%Y"),
        "sms_sent":           sms_sent,
        "current_step":       "done",
    }
