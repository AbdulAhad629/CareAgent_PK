"""
Initialize database + seed with sample doctors.
Run once: python scripts/init_db.py
"""
import sys
sys.path.append(".")

from db.models import Base, Doctor
from db.session import engine, SessionLocal


SEED_DOCTORS = [
    # General (most common — need multiple)
    {"name": "Dr. Ahmed Khan",     "specialty": "General",      "room": "OPD-1",  "shift_start": "08:00", "shift_end": "16:00"},
    {"name": "Dr. Sara Malik",     "specialty": "General",      "room": "OPD-2",  "shift_start": "08:00", "shift_end": "16:00"},
    {"name": "Dr. Imran Siddiqui", "specialty": "General",      "room": "OPD-3",  "shift_start": "14:00", "shift_end": "22:00"},
    # Specialists
    {"name": "Dr. Hassan Raza",    "specialty": "Cardiology",   "room": "CARD-1", "shift_start": "09:00", "shift_end": "17:00"},
    {"name": "Dr. Fatima Noor",    "specialty": "Pediatrics",   "room": "PED-1",  "shift_start": "08:00", "shift_end": "16:00"},
    {"name": "Dr. Usman Sheikh",   "specialty": "Orthopedics",  "room": "ORTH-1", "shift_start": "10:00", "shift_end": "18:00"},
    {"name": "Dr. Ayesha Baig",    "specialty": "Gynecology",   "room": "GYN-1",  "shift_start": "08:00", "shift_end": "14:00"},
    {"name": "Dr. Bilal Hussain",  "specialty": "Neurology",    "room": "NEU-1",  "shift_start": "09:00", "shift_end": "17:00"},
    {"name": "Dr. Zara Ahmed",     "specialty": "ENT",          "room": "ENT-1",  "shift_start": "10:00", "shift_end": "16:00"},
    {"name": "Dr. Omar Farooq",    "specialty": "Dermatology",  "room": "DERM-1", "shift_start": "11:00", "shift_end": "17:00"},
    {"name": "Dr. Hina Qureshi",   "specialty": "Psychiatry",   "room": "PSY-1",  "shift_start": "09:00", "shift_end": "15:00"},
    {"name": "Dr. Khalid Mehmood", "specialty": "Ophthalmology","room": "EYE-1",  "shift_start": "10:00", "shift_end": "16:00"},
]


def main():
    print("🗄️  Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("   ✅ Tables created")

    db = SessionLocal()
    try:
        if db.query(Doctor).count() == 0:
            for d in SEED_DOCTORS:
                db.add(Doctor(**d))
            db.commit()
            print(f"   ✅ Seeded {len(SEED_DOCTORS)} doctors")
        else:
            print("   ℹ️  Doctors already seeded — skipping")
    finally:
        db.close()

    print("\n✅ Database ready! Now run:")
    print("   python utils/knowledge_base.py   # load medical KB")
    print("   uvicorn api.main:app --reload     # start server")


if __name__ == "__main__":
    main()
