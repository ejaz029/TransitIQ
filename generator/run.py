
import argparse

from backend.database import SessionLocal
from generator.master_data import generate_master_data
from generator.transactions import generate_transactions


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--scale",
        choices=["starter", "full"],
        default="starter"
    )

    parser.add_argument(
        "--master-only",
        action="store_true"
    )

    args = parser.parse_args()
    db = SessionLocal()

    try:
        if args.master_only:
            generate_master_data(db, args.scale)
        else:
            generate_master_data(db, args.scale)
            generate_transactions(db)

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
