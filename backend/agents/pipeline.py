"""
LangGraph Pipeline — Orchestrates all 4 agents

Graph:
  reception → triage → [emergency check] → assignment → followup → END

Emergency patients (Level 1-2) are flagged but still go through
the same pipeline — just with priority routing on assignment.
"""
from datetime import datetime
from sqlalchemy.orm import Session

from langgraph.graph import StateGraph, END

from agents.state import PatientState
from agents.reception import reception_agent
from agents.triage import triage_agent
from agents.assignment import assignment_agent
from agents.followup import followup_agent


def build_pipeline(db: Session):
    """Build and compile the LangGraph agent graph."""

    # Bind DB session to each agent
    def run_reception(state):  return reception_agent(state, db)
    def run_triage(state):     return triage_agent(state, db)
    def run_assignment(state): return assignment_agent(state, db)
    def run_followup(state):   return followup_agent(state, db)

    # Conditional routing after triage
    def route_after_triage(state) -> str:
        if state.get("is_emergency"):
            print("   🚨 EMERGENCY FLAGGED — priority routing!")
        return "assignment"   

    # Build graph
    graph = StateGraph(PatientState)
    graph.add_node("reception",  run_reception)
    graph.add_node("triage",     run_triage)
    graph.add_node("assignment", run_assignment)
    graph.add_node("followup",   run_followup)

    graph.set_entry_point("reception")
    graph.add_edge("reception", "triage")
    graph.add_conditional_edges(
        "triage",
        route_after_triage,
        {"assignment": "assignment"},
    )
    graph.add_edge("assignment", "followup")
    graph.add_edge("followup", END)

    return graph.compile()


def run_pipeline(raw_input: str, symptoms: str, db: Session) -> PatientState:
    """
    Main entry point called by the FastAPI route.

    Args:
        raw_input: Full patient statement (Urdu/English/voice transcript)
        symptoms:  Symptom-focused part of the input (can be same as raw_input)
        db:        SQLAlchemy session

    Returns:
        Final PatientState after all 4 agents have run.
    """
    initial: PatientState = {
        # Input
        "raw_input":      raw_input,
        "symptoms_raw":   symptoms,
        "input_language": "english",

        # Agent 1 outputs
        "patient_name":   "",
        "patient_age":    None,
        "patient_gender": None,
        "patient_phone":  None,
        "patient_cnic":   None,
        "patient_id":     None,
        "token_number":   "",
        "is_returning":   False,

        # Agent 2 outputs
        "symptoms_english":   "",
        "triage_level":       3,
        "triage_reason":      "",
        "required_specialty": "General",
        "is_emergency":       False,

        # Agent 3 outputs
        "assigned_doctor_id":   None,
        "assigned_doctor_name": None,
        "assigned_room":        None,
        "wait_time_minutes":    0,
        "visit_id":             None,

        # Agent 4 outputs
        "discharge_summary":  "",
        "followup_scheduled": False,
        "followup_date":      None,
        "sms_sent":           False,

        # Meta
        "errors":       [],
        "current_step": "reception",
        "timestamp":    datetime.utcnow().isoformat(),
    }

    pipeline = build_pipeline(db)
    return pipeline.invoke(initial)
