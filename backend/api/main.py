from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.analytics import router as analytics_router
from core.config import settings
from db.models import Base
from db.session import engine
from api.routes.patients import router as patients_router
from api.routes.doctors  import router as doctors_router
from fastapi.staticfiles import StaticFiles
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title       = "CareAgent PK API",
    description = "Multi-Agent Hospital Queue & Triage System — FYP Project",
    version     = "1.0.0",
    docs_url    = "/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = [settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

app.include_router(patients_router, prefix="/api/v1")
app.include_router(doctors_router,  prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
os.makedirs("static/prescriptions", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

os.makedirs("static/prescriptions", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", tags=["Health"])
async def root():
    return {
        "project": "CareAgent PK",
        "status":  "running 🟢",
        "agents":  ["Reception", "Triage (RAG)", "Assignment", "Follow-up"],
        "docs":    "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "env": settings.APP_ENV}
