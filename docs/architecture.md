# CareAgent PK — Architecture

## LangGraph Agent Pipeline

```
Patient Input (Urdu/English text OR Whisper voice transcript)
              │
              ▼
┌─────────────────────────────────────────────────────┐
│              LangGraph StateGraph                    │
│                                                     │
│  ┌──────────────┐    ┌──────────────┐              │
│  │  Agent 1     │───▶│  Agent 2     │              │
│  │  Reception   │    │  Triage      │              │
│  │              │    │  (RAG)       │              │
│  │ • Parse name │    │ • ChromaDB   │              │
│  │ • Age, CNIC  │    │ • Severity   │              │
│  │ • Create DB  │    │ • Specialty  │              │
│  │ • Gen token  │    │ • Emergency? │              │
│  └──────────────┘    └──────┬───────┘              │
│                             │                       │
│                    [route_after_triage]             │
│                             │                       │
│                             ▼                       │
│                    ┌──────────────┐                 │
│                    │  Agent 3     │                 │
│                    │  Assignment  │                 │
│                    │              │                 │
│                    │ • Find doctor│                 │
│                    │ • Load balance│                │
│                    │ • Wait time  │                 │
│                    │ • Create visit│                │
│                    └──────┬───────┘                │
│                           │                        │
│                           ▼                        │
│                    ┌──────────────┐                │
│                    │  Agent 4     │                │
│                    │  Follow-up   │                │
│                    │              │                │
│                    │ • Summary    │                │
│                    │ • Urdu note  │                │
│                    │ • SMS (opt)  │                │
│                    │ • DB record  │                │
│                    └──────┬───────┘                │
└───────────────────────────┼────────────────────────┘
                            │
                            ▼
                          END
                  (Final PatientState)
```

## Data Flow
```
PatientState (TypedDict) flows through all agents.
Each agent reads → processes → returns updated state.
LangGraph manages the graph execution.
```

## Database Schema
```
patients       → stores patient demographics
doctors        → stores doctor schedule & load
visits         → one per hospital visit (agent run)
followups      → scheduled reminders (Day 3, Day 7)
```

## RAG Architecture
```
Medical Knowledge → ChromaDB (local, free)
                    ↑
HuggingFace Embeddings (multilingual, Urdu-aware)
                    ↑
35 medical documents covering:
  - Cardiac emergencies
  - Neurological (stroke, seizure)
  - Pediatric
  - Pakistan-specific (Dengue, Typhoid, Malaria, Cholera)
  - Respiratory, Abdominal, Obstetric
  - Minor conditions
```

## Free Tools Used
| Tool | Version | Purpose |
|------|---------|---------|
| Groq API | Llama 3.1 8B instant | Primary LLM (30 req/min free) |
| Gemini Flash | 1.5 | Backup LLM |
| Whisper | base | Urdu STT (local) |
| ChromaDB | 0.5 | Vector store (local) |
| HuggingFace | paraphrase-multilingual | Embeddings (local) |
| LangGraph | 0.2 | Agent orchestration |
| FastAPI | 0.115 | Backend API |
| React + Vite | 18 | Frontend |
| PostgreSQL | 15 | Main database |
