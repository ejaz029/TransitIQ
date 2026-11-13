
import json
import requests

BASE_URL = "http://127.0.0.1:8000"

endpoints = {
    "health": "/api/health",
    "dashboard": "/api/dashboard",
    "students": "/api/students?limit=2",
    "student_detail": "/api/students/STU-000001",
    "buses": "/api/buses",
    "routes": "/api/routes",
    "assignments": "/api/assignments?limit=2",
    "attendance": "/api/attendance?limit=2",
    "notifications": "/api/notifications?limit=2",
    "exceptions": "/api/exceptions",
}

contracts = {}

for name, endpoint in endpoints.items():
    try:
        response = requests.get(
            BASE_URL + endpoint,
            timeout=15
        )
        response.raise_for_status()

        contracts[name] = {
            "endpoint": endpoint,
            "status_code": response.status_code,
            "response": response.json()
        }

        print(f"SUCCESS: {name}")

    except Exception as error:
        contracts[name] = {
            "endpoint": endpoint,
            "error": str(error)
        }
        print(f"FAILED: {name} - {error}")

with open("frontend_api_contracts.json", "w") as file:
    json.dump(contracts, file, indent=2)

print("\nExport completed: frontend_api_contracts.json")
