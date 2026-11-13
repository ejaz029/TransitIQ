
from datetime import date
from pathlib import Path
import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import AttendanceEvent, Notification

router = APIRouter(prefix="/api", tags=["Operations"])


@router.get("/attendance")
def get_attendance(
    service_date: date | None = None,
    event_type: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(AttendanceEvent)

    if service_date:
        query = query.filter(
            AttendanceEvent.event_date == service_date
        )

    if event_type:
        query = query.filter(
            AttendanceEvent.event_type == event_type
        )

    total = query.count()

    events = (
        query.order_by(
            AttendanceEvent.event_date.desc(),
            AttendanceEvent.event_id
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "attendance": [
            {
                "event_id": e.event_id,
                "assignment_id": e.assignment_id,
                "event_date": e.event_date.isoformat(),
                "event_type": e.event_type,
                "event_time": e.event_time.isoformat(),
                "notes": e.notes
            }
            for e in events
        ]
    }


@router.get("/notifications")
def get_notifications(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Notification)

    if status:
        query = query.filter(Notification.status == status)

    total = query.count()

    notifications = (
        query.order_by(Notification.notification_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "notifications": [
            {
                "notification_id": n.notification_id,
                "student_id": n.student_id,
                "guardian_id": n.guardian_id,
                "event_id": n.event_id,
                "channel": n.channel,
                "status": n.status,
                "sent_at": n.sent_at.isoformat() if n.sent_at else None,
                "failure_reason": n.failure_reason
            }
            for n in notifications
        ]
    }


@router.get("/exceptions")
def get_exceptions():
    path = Path("data/generated/validation_results.json")

    if not path.exists():
        return {"total": 0, "exceptions": []}

    with path.open("r", encoding="utf-8") as file:
        results = json.load(file)

    exceptions = []

    for result in results:
        for issue in result["detected"]:
            exceptions.append({
                "case_id": result["case_id"],
                "issue_type": issue["issue_type"],
                "decision": issue["decision"],
                "status": "OPEN"
            })

    return {
        "total": len(exceptions),
        "exceptions": exceptions
    }
