
from backend.database import SessionLocal
from generator.attendance import generate_attendance


def main():
    db = SessionLocal()

    try:
        generate_attendance(db)

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
