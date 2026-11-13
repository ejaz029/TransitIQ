
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api import (
    dashboard,
    students,
    transport,
    operations
)

app = FastAPI(
    title="TransitIQ API",
    description=(
        "School Transportation Management, "
        "Student Assignment and Attendance Platform"
    ),
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8501"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(students.router)
app.include_router(transport.router)
app.include_router(operations.router)


@app.get("/")
def root():
    return {
        "application": "TransitIQ",
        "version": "1.0.0",
        "message": "School Transportation Management API is running"
    }
