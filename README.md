# 🏥 CareAgent PK — Multi-Agent Hospital Triage System

> **FYP Project** | CS Final Year | AI/ML Specialization  
> LangGraph + Llama 3.1 (Groq Free) + FastAPI + React + PostgreSQL + ChromaDB

## Agent Pipeline
```
Patient Input (Urdu/English/Voice)
        ↓
[Agent 1: Reception]  → Extracts patient info, creates record, generates token
        ↓
[Agent 2: Triage]     → RAG + LLM classifies severity (Level 1-5), finds specialty
        ↓
[Agent 3: Assignment] → Assigns best available doctor, estimates wait time
        ↓
[Agent 4: Follow-up]  → Generates Urdu discharge summary, schedules SMS reminder
```

## Quick Start (Zero Cost)

### 1. Get Free API Keys
- Groq: https://console.groq.com  (free, 14400 req/day)
- Gemini: https://aistudio.google.com (free, backup LLM)

### 2. Setup
```bash
git clone <your-repo> && cd careagent-pk
cp .env.example .env    # paste your free API keys
```

### 3. Run with Docker (Recommended)
```bash
docker-compose up --build
# API: http://localhost:8000
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### 4. Run Manually
```bash
# Backend
cd backend
pip install -r requirements.txt
python scripts/init_db.py          # create tables + seed doctors
python utils/knowledge_base.py     # load medical KB into ChromaDB
uvicorn api.main:app --reload --port 8000

# Frontend
cd frontend
npm install && npm run dev
```

## Project Structure
```
careagent-pk/
├── backend/
│   ├── agents/          # 4 LangGraph agents
│   │   ├── state.py         # Shared TypedDict state
│   │   ├── pipeline.py      # LangGraph orchestrator
│   │   ├── reception.py     # Agent 1
│   │   ├── triage.py        # Agent 2 (RAG)
│   │   ├── assignment.py    # Agent 3
│   │   └── followup.py      # Agent 4
│   ├── api/
│   │   ├── main.py          # FastAPI app
│   │   └── routes/          # API endpoints
│   ├── core/config.py       # Settings & env vars
│   ├── db/
│   │   ├── models.py        # SQLAlchemy models
│   │   └── session.py       # DB connection
│   ├── schemas/             # Pydantic schemas
│   ├── utils/
│   │   ├── speech.py        # Whisper Urdu STT
│   │   └── knowledge_base.py# ChromaDB loader
│   └── scripts/init_db.py   # DB setup + seed
├── frontend/src/
│   ├── pages/
│   │   ├── PatientRegister.jsx  # Patient intake form
│   │   ├── QueueDisplay.jsx     # Live queue TV screen
│   │   └── DoctorDashboard.jsx  # Doctor's patient list
│   └── components/
├── tests/test_pipeline.py   # Pytest test cases
├── docs/architecture.md
├── docker-compose.yml
└── .env.example
```

## Free Stack Summary
| Tool | Purpose | Cost |
|------|---------|------|
| Groq API (Llama 3.1 8B) | Primary LLM | Free 14400/day |
| Gemini 1.5 Flash | Backup LLM | Free 1500/day |
| Whisper (local) | Urdu Speech-to-Text | Free |
| HuggingFace Embeddings | ChromaDB vectors | Free |
| ChromaDB | Medical knowledge RAG | Free |
| PostgreSQL | Patient/Doctor data | Free |
| FastAPI | Backend API | Free |
| React + Vite | Frontend | Free |
| Docker | Deployment | Free |

## FYP Evaluation Metrics
- Triage accuracy vs manual: target >85%
- Urdu STT accuracy: target >80%
- Agent response time: target <3 seconds
- Queue wait time reduction: target >40% (simulated)
