from backend.database import SessionLocal
from generator.transactions import generate_transactions

db = SessionLocal()

try:
    generate_transactions(db)
except Exception:
    db.rollback()
    raise
finally:
    db.close()