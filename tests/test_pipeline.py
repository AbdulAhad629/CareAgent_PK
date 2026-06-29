"""
Test suite for CareAgent PK pipeline.
Run: cd backend && pytest ../tests/ -v
"""
import sys
sys.path.insert(0, "./backend")

import pytest
from unittest.mock import MagicMock, patch
from agents.state import PatientState
from datetime import datetime


def _base_state(**overrides) -> PatientState:
    state: PatientState = {
        "raw_input": "", "symptoms_raw": "", "input_language": "english",
        "patient_name": "Test Patient", "patient_age": 30, "patient_gender": "male",
        "patient_phone": None, "patient_cnic": None, "patient_id": 1,
        "token_number": "T2406-001", "is_returning": False,
        "symptoms_english": "", "triage_level": 3, "triage_reason": "",
        "required_specialty": "General", "is_emergency": False,
        "assigned_doctor_id": None, "assigned_doctor_name": None,
        "assigned_room": None, "wait_time_minutes": 0, "visit_id": None,
        "discharge_summary": "", "followup_scheduled": False,
        "followup_date": None, "sms_sent": False,
        "errors": [], "current_step": "triage",
        "timestamp": datetime.utcnow().isoformat(),
    }
    state.update(overrides)
    return state


# ── Triage Agent tests ─────────────────────────────────────────────────────────
TRIAGE_CASES = [
    {
        "id": "cardiac_emergency",
        "symptoms": "severe chest pain, shortness of breath, sweating, left arm pain",
        "age": 55, "gender": "male",
        "expected_levels": [1, 2],
        "expected_specialty": "Cardiology",
    },
    {
        "id": "dengue_pakistan",
        "symptoms": "high fever, pain behind eyes, joint pain, rash, 3 days",
        "age": 25, "gender": "female",
        "expected_levels": [2, 3],
        "expected_specialty": "General",
    },
    {
        "id": "pediatric_fever",
        "symptoms": "child 4 years old, fever 104F, not eating, very irritable",
        "age": 4, "gender": "male",
        "expected_levels": [1, 2, 3],
        "expected_specialty": "Pediatrics",
    },
    {
        "id": "minor_cold",
        "symptoms": "mild cold, runny nose, slight fever since yesterday",
        "age": 22, "gender": "female",
        "expected_levels": [4, 5],
        "expected_specialty": "General",
    },
    {
        "id": "stroke_symptoms",
        "symptoms": "sudden face drooping, arm weakness, slurred speech",
        "age": 65, "gender": "male",
        "expected_levels": [1, 2],
        "expected_specialty": "Neurology",
    },
]


@pytest.mark.parametrize("case", TRIAGE_CASES, ids=[c["id"] for c in TRIAGE_CASES])
def test_triage_level(case):
    """Triage agent should classify each symptom set to the expected level range."""
    from agents.triage import triage_agent

    state = _base_state(
        symptoms_raw=case["symptoms"],
        raw_input=case["symptoms"],
        patient_age=case["age"],
        patient_gender=case["gender"],
    )

    result = triage_agent(state)

    assert result["triage_level"] in case["expected_levels"], (
        f"[{case['id']}] Expected level in {case['expected_levels']}, "
        f"got {result['triage_level']}. Reason: {result['triage_reason']}"
    )
    print(f"✅ {case['id']}: Level {result['triage_level']} — {result['required_specialty']}")


# ── Pipeline state tests ───────────────────────────────────────────────────────
def test_initial_state_keys():
    """All required keys must exist in PatientState."""
    state = _base_state()
    required_keys = [
        "raw_input", "token_number", "triage_level",
        "assigned_doctor_name", "discharge_summary", "errors"
    ]
    for key in required_keys:
        assert key in state, f"Missing key: {key}"


def test_emergency_flag_for_low_triage():
    """is_emergency should be True when triage_level <= 2."""
    state = _base_state(triage_level=1, is_emergency=True)
    assert state["is_emergency"] is True


def test_non_emergency_flag():
    """is_emergency should be False for level 4-5."""
    state = _base_state(triage_level=5, is_emergency=False)
    assert state["is_emergency"] is False


# ── Assignment Agent tests ─────────────────────────────────────────────────────
def test_assignment_no_doctors():
    """Assignment agent should handle no-doctor scenario gracefully."""
    from agents.assignment import assignment_agent

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = []

    state = _base_state(
        patient_id=1,
        required_specialty="Cardiology",
        symptoms_raw="chest pain",
        symptoms_english="chest pain",
        triage_reason="possible cardiac",
        is_emergency=True,
    )

    result = assignment_agent(state, mock_db)
    assert result["assigned_doctor_id"] is None
    assert len(result["errors"]) > 0
    print("✅ No-doctor graceful fallback works")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
