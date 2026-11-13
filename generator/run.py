
import argparse

from backend.database import SessionLocal
from generator.master_data import generate_master_data


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--scale",
        choices=["starter", "full"],
        default="starter"
    )

    args = parser.parse_args()

    db = SessionLocal()

    try:
        generate_master_data(db, args.scale)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
