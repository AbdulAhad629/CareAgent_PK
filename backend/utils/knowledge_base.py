import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
"""
Medical Knowledge Base Loader — ChromaDB (FREE, local)

Run ONCE before starting the server:
    python utils/knowledge_base.py

Uses HuggingFace multilingual embeddings (free, local, Urdu-aware).
"""
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from core.config import settings


MEDICAL_DOCS = [
    # === Cardiac ===
    {"text": "Chest pain, tightness, pressure, shortness of breath, left arm pain, sweating, nausea — possible heart attack (myocardial infarction). IMMEDIATE triage level 1. Specialty: Cardiology.", "topic": "cardiac"},
    {"text": "Rapid or irregular heartbeat (palpitations), dizziness, fainting — possible arrhythmia. URGENT level 3. Specialty: Cardiology.", "topic": "cardiac"},

    # === Neurological ===
    {"text": "Stroke FAST: Face drooping, Arm weakness, Speech difficulty, Time critical. Sudden severe headache, confusion, vision loss. IMMEDIATE level 1. Specialty: Neurology.", "topic": "neuro"},
    {"text": "Head injury, loss of consciousness, vomiting after trauma, confusion, unequal pupils. EMERGENCY level 2. Specialty: Neurology or Surgery.", "topic": "neuro"},
    {"text": "Seizure, convulsion, epileptic episode, uncontrolled shaking. EMERGENCY level 2. Specialty: Neurology.", "topic": "neuro"},

    # === Pediatric ===
    {"text": "Child under 5 with fever above 103F (39.4C), difficulty breathing, not eating, extreme irritability — EMERGENCY level 2. Specialty: Pediatrics.", "topic": "pediatric"},
    {"text": "Febrile seizure in child, high fever with convulsions. EMERGENCY level 2. Specialty: Pediatrics.", "topic": "pediatric"},
    {"text": "Child with rash, fever, neck stiffness — possible meningitis. IMMEDIATE level 1. Specialty: Pediatrics or Neurology.", "topic": "pediatric"},

    # === Respiratory ===
    {"text": "Severe difficulty breathing, wheezing, lips turning blue (cyanosis), asthma attack. IMMEDIATE level 1. Specialty: General or Pulmonology.", "topic": "respiratory"},
    {"text": "Moderate difficulty breathing, persistent cough, chest tightness. URGENT level 3. Specialty: General.", "topic": "respiratory"},

    # === Abdominal ===
    {"text": "Severe abdominal pain, vomiting blood (hematemesis), black tarry stools — possible GI bleeding. EMERGENCY level 2. Specialty: General Surgery.", "topic": "abdominal"},
    {"text": "Appendicitis signs: right lower abdominal pain, fever, nausea, rebound tenderness. EMERGENCY level 2. Specialty: Surgery.", "topic": "abdominal"},
    {"text": "Mild to moderate abdominal pain, nausea, vomiting, diarrhea — gastroenteritis. SEMI-URGENT level 4. Specialty: General.", "topic": "abdominal"},

    # === Obstetric / Gynecology ===
    {"text": "Pregnant woman with heavy bleeding, severe abdominal pain, reduced fetal movement. EMERGENCY level 2. Specialty: Gynecology.", "topic": "obs_gyn"},
    {"text": "Signs of eclampsia: seizure in pregnant woman, severe headache, high BP. IMMEDIATE level 1. Specialty: Gynecology.", "topic": "obs_gyn"},

    # === Orthopedic ===
    {"text": "Fracture, broken bone, severe pain after fall, deformity, swelling, inability to move limb. URGENT level 3. Specialty: Orthopedics.", "topic": "ortho"},
    {"text": "Sprain, minor injury, mild swelling — NON-URGENT level 5. Specialty: Orthopedics or General.", "topic": "ortho"},

    # === Pakistan-Specific Diseases ===
    {"text": "Dengue fever: sudden high fever, severe headache, pain behind eyes (retro-orbital), joint/muscle pain, skin rash. Common in Pakistan monsoon (July-Oct). URGENT level 2-3. Specialty: General. Check platelet count.", "topic": "pakistan_dengue"},
    {"text": "Typhoid fever: prolonged fever (>1 week), headache, weakness, abdominal pain, rose-spot rash. Very common in Pakistan. URGENT level 3. Specialty: General. Test: Widal or blood culture.", "topic": "pakistan_typhoid"},
    {"text": "Malaria: cyclical fever with chills, sweating, headache, vomiting. Common in Sindh, Balochistan, rural Punjab. URGENT level 2-3. Specialty: General. RDT test needed.", "topic": "pakistan_malaria"},
    {"text": "Hepatitis A/E: jaundice, yellow eyes, dark urine, fatigue, nausea. Common in Pakistan due to contaminated water. URGENT level 3. Specialty: General or Gastroenterology.", "topic": "pakistan_hepatitis"},
    {"text": "Heatstroke: extremely high body temperature (>40C/104F), confusion, no sweating despite heat — common in Karachi summer. IMMEDIATE level 1. Specialty: General Emergency.", "topic": "pakistan_heat"},
    {"text": "Cholera: severe watery diarrhea, rapid dehydration, rice-water stools. EMERGENCY level 2 due to rapid dehydration risk. Specialty: General. IV fluids critical.", "topic": "pakistan_cholera"},

    # === Minor Conditions ===
    {"text": "Common cold, mild cough, runny nose, sore throat, mild fever under 100F. NON-URGENT level 5. Specialty: General.", "topic": "minor"},
    {"text": "Urinary tract infection (UTI): burning urination, frequency, lower abdominal pain. SEMI-URGENT level 4. Specialty: General.", "topic": "minor"},
    {"text": "Skin rash, eczema, mild allergic reaction, itching without breathing difficulty. SEMI-URGENT level 4. Specialty: Dermatology.", "topic": "dermatology"},
    {"text": "Anaphylaxis: severe allergic reaction, throat swelling, difficulty breathing, hives — IMMEDIATE level 1. Specialty: Emergency/General.", "topic": "allergy_emergency"},

    # === Mental Health ===
    {"text": "Mental health crisis, suicidal ideation, severe anxiety, psychosis, aggressive behavior. URGENT level 3. Specialty: Psychiatry. Ensure patient safety.", "topic": "mental_health"},

    # === Eye / ENT ===
    {"text": "Sudden vision loss, severe eye pain, chemical splash in eye, eye injury. URGENT level 3. Specialty: Ophthalmology.", "topic": "eye"},
    {"text": "Ear pain, loss of hearing, discharge from ear, foreign object in ear. NON-URGENT level 5. Specialty: ENT.", "topic": "ent"},
    {"text": "Nosebleed (epistaxis) that won't stop, severe. SEMI-URGENT level 4. Specialty: ENT.", "topic": "ent"},

    # === Diabetes ===
    {"text": "Diabetic patient: very low blood sugar (hypoglycemia) — confusion, shaking, sweating, unconscious. IMMEDIATE level 1. Give glucose. Specialty: General.", "topic": "diabetes"},
    {"text": "Diabetic patient: very high blood sugar, fruity breath, confusion (DKA). EMERGENCY level 2. Specialty: General or Endocrinology.", "topic": "diabetes"},
]


def load_knowledge_base():
    """Load all medical docs into ChromaDB. Run once."""
    print("📚 Loading medical knowledge base into ChromaDB...")

    embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)

    documents = [
        Document(page_content=doc["text"], metadata={"topic": doc["topic"]})
        for doc in MEDICAL_DOCS
    ]

    splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=50)
    splits = splitter.split_documents(documents)

    Chroma.from_documents(
        documents=splits,
        embedding=embeddings,
        persist_directory=settings.CHROMA_DB_PATH,
        collection_name="medical_knowledge",
    )

    print(f"✅ Loaded {len(splits)} chunks into ChromaDB at '{settings.CHROMA_DB_PATH}'")


if __name__ == "__main__":
    import sys
    sys.path.append(".")
    load_knowledge_base()
