
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models import (
    Student, Bus, Route, Assignment,
    AttendanceEvent, Notification
)

router = APIRouter(prefix="/api", tags=["Dashboard"])


@router.get("/health")
def health():
    return {
        "status": "healthy",
        "application": "TransitIQ"
    }


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):

    students = db.query(func.count(Student.student_id)).scalar()
    buses = db.query(func.count(Bus.bus_id)).scalar()
    routes = db.query(func.count(Route.route_id)).scalar()

    assignments = db.query(
        func.count(Assignment.assignment_id)
    ).filter(
        Assignment.status == "ACTIVE"
    ).scalar()

    attendance = db.query(
        func.count(AttendanceEvent.event_id)
    ).scalar()

    boarded = db.query(
        func.count(AttendanceEvent.event_id)
    ).filter(
        AttendanceEvent.event_type == "BOARDED"
    ).scalar()

    missed = db.query(
        func.count(AttendanceEvent.event_id)
    ).filter(
        AttendanceEvent.event_type == "MISSED_PICKUP"
    ).scalar()

    notifications = db.query(
        func.count(Notification.notification_id)
    ).scalar()

    sent = db.query(
        func.count(Notification.notification_id)
    ).filter(
        Notification.status == "SENT"
    ).scalar()

    attendance_rate = (
        round(boarded / attendance * 100, 2)
        if attendance else 0
    )

    return {
        "total_students": students,
        "total_buses": buses,
        "total_routes": routes,
        "active_assignments": assignments,
        "attendance_events": attendance,
        "boarded_events": boarded,
        "missed_pickups": missed,
        "attendance_rate": attendance_rate,
        "total_notifications": notifications,
        "sent_notifications": sent
    }
