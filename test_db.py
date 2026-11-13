from backend.database import engine

try:
    with engine.connect() as connection:
        print("MySQL connection successful!")
        print("Database:", connection.engine.url.database)

except Exception as e:
    print("Connection failed:", e)