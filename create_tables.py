
from backend.database import engine, Base
from backend import models

def create_schema():
    Base.metadata.create_all(bind=engine)

    print("TransitIQ database schema created successfully!")

    for table in Base.metadata.sorted_tables:
        print(f"Created/verified: {table.name}")

if __name__ == "__main__":
    create_schema()
