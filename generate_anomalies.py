
from backend.database import SessionLocal
from generator.anomalies import generate_anomalies


def main():
    db = SessionLocal()

    try:
        generate_anomalies(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
