from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Free API keys
    # NAYE
    GROQ_API_KEY: str = "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"
    GEMINI_API_KEY: str = "AQ.Ab8RN6JmQdLOi5eK2ulq9Br3_J1qjnBhCAKGzlhED__NIJOL3w"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # Database
    DATABASE_URL: str = "postgresql://neondb_owner:npg_1wrNGf4iDmvZ@ep-bitter-base-atf5oog4.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
    REDIS_URL: str = "redis://localhost:6379"

    # AI Models (all free)
    PRIMARY_LLM: str = "llama-3.1-8b-instant"
    BACKUP_LLM: str = "gemini-1.5-flash"
    EMBEDDING_MODEL: str = "paraphrase-multilingual-MiniLM-L12-v2"
    WHISPER_MODEL_SIZE: str = "base"

    # App
    APP_ENV: str = "development"
    SECRET_KEY: str = "dev-secret"
    FRONTEND_URL: str = "http://localhost:3000"
    CHROMA_DB_PATH: str = "./chroma_medical_kb"

    class Config:
        env_file = "../.env"


@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
