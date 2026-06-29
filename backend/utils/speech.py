"""
Urdu Speech-to-Text using OpenAI Whisper (runs 100% locally — FREE).

Supported languages: Urdu (ur), English (en), auto-detect.
Model sizes: tiny (39M) | base (74M) | small (244M)
Default: base — good accuracy, fast enough on CPU.
"""
import os, tempfile
import whisper
from core.config import settings

_model = None   

def _load_model():
    global _model
    if _model is None:
        print(f"🎤 Loading Whisper '{settings.WHISPER_MODEL_SIZE}' model (one-time)...")
        _model = whisper.load_model(settings.WHISPER_MODEL_SIZE)
        print("   ✅ Whisper ready")
    return _model


def transcribe_audio(audio_bytes: bytes, language: str = None) -> dict:
    """
    Transcribe audio bytes to text.

    Args:
        audio_bytes: Raw audio bytes (WAV / MP3 / M4A / etc.)
        language:    Force language code e.g. "ur" for Urdu, None = auto-detect

    Returns:
        {"text": str, "language": str}
    """
    model = _load_model()

    
    suffix = ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name

    try:
        options = {"fp16": False}   
        if language:
            options["language"] = language
        result = model.transcribe(tmp_path, **options)
        return {
            "text":     result["text"].strip(),
            "language": result.get("language", "unknown"),
        }
    finally:
        os.unlink(tmp_path)
