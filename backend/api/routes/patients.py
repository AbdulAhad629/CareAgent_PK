import base64
import os
import tempfile

from dotenv import load_dotenv
load_dotenv()

from groq import Groq
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from db.models import Visit, Patient, Doctor
from schemas.schemas import RegisterRequest, RegisterResponse, QueueItem
from agents.pipeline import run_pipeline
from utils.speech import transcribe_audio

router = APIRouter(prefix="/patients", tags=["Patients"])

TRIAGE_COLORS = {1: "🔴", 2: "🟠", 3: "🟡", 4: "🟢", 5: "⚪"}

FFMPEG_PATH = r"C:\Users\AHAD\Downloads\ffmpeg-8.1.2-essentials_build\ffmpeg-8.1.2-essentials_build\bin"
os.environ["PATH"] += os.pathsep + FFMPEG_PATH

# ✅ Sirf ek baar — .env se load
_groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
print("✅ Groq Whisper client ready.")


@router.post("/register", response_model=RegisterResponse)
async def register_patient(req: RegisterRequest, db: Session = Depends(get_db)):
    raw_input = req.raw_input
    symptoms  = req.symptoms

    if req.audio_base64:
        try:
            audio_bytes = base64.b64decode(req.audio_base64)
            result      = transcribe_audio(audio_bytes, language="ur")
            raw_input   = result["text"]
            symptoms    = raw_input
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Audio processing failed: {e}")

    state = run_pipeline(raw_input, symptoms, db)
    color = TRIAGE_COLORS.get(state["triage_level"], "⚪")

    return RegisterResponse(
        success            = True,
        token_number       = state["token_number"],
        patient_name       = state["patient_name"],
        triage_level       = state["triage_level"],
        triage_reason      = state["triage_reason"],
        triage_color       = color,
        is_emergency       = state["is_emergency"],
        required_specialty = state["required_specialty"],
        assigned_doctor    = state.get("assigned_doctor_name", ""),
        room               = state.get("assigned_room", ""),
        wait_time_minutes  = state.get("wait_time_minutes", 0),
        followup_date      = state.get("followup_date"),
        message_urdu=(
            f"السلام علیکم {state['patient_name']}! "
            f"آپ کا ٹوکن {state['token_number']} ہے۔ "
            f"{color} ڈاکٹر {state.get('assigned_doctor_name')} "
            f"کمرہ {state.get('assigned_room')} میں ملیں گے۔ "
            f"تقریباً {state.get('wait_time_minutes')} منٹ انتظار کریں۔"
        ),
    )


@router.get("/queue", response_model=list[QueueItem])
async def get_queue(db: Session = Depends(get_db)):
    rows = (
        db.query(Visit, Patient, Doctor)
        .join(Patient, Visit.patient_id == Patient.id)
        .join(Doctor,  Visit.doctor_id  == Doctor.id)
        .filter(Visit.status == "waiting")
        .order_by(Visit.triage_level.asc(), Visit.visit_date.asc())
        .all()
    )
    return [
        QueueItem(
            token_number       = v.token_number,
            patient_name       = p.name,
            triage_level       = v.triage_level,
            triage_color       = TRIAGE_COLORS.get(v.triage_level, "⚪"),
            required_specialty = v.required_specialty,
            doctor_name        = d.name,
            room               = d.room,
            wait_time_est      = v.wait_time_est,
            status             = v.status,
        )
        for v, p, d in rows
    ]


@router.post("/voice-transcribe")
async def voice_transcribe(request: dict):
    """Transcribe audio using Groq Whisper large-v3-turbo — best Urdu accuracy."""
    try:
        audio_bytes = base64.b64decode(request["audio_base64"])

        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name

        print(f"Audio saved: {tmp_path} | Size: {os.path.getsize(tmp_path)} bytes")

        with open(tmp_path, "rb") as audio_file:
            transcription = _groq_client.audio.transcriptions.create(
                file=audio_file,
                model="whisper-large-v3-turbo",  # ✅ turbo — Urdu better
                language="ur",
                prompt="اردو: مریض کا نام احمد، عمر پینتالیس سال، سینے میں درد، بخار، کھانسی",
                response_format="text",
            )

        os.unlink(tmp_path)

        text = transcription.strip() if isinstance(transcription, str) else transcription.text.strip()

        print(f"Transcribed: {text}")
        return {
            "text":     text,
            "language": "ur",
        }

    except Exception as e:
        print(f"Voice error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))