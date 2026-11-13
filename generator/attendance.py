
import random
from datetime import date, datetime, time, timedelta

from sqlalchemy.orm import Session

from backend.models import (
    Assignment,
    GuardianContact,
    AttendanceEvent,
    Notification,
)
from generator.config import SEED


START_DATE = date(2026, 11, 16)
SCHOOL_DAYS = 20

ATTENDANCE_OUTCOMES = [
    "BOARDED",
    "ABSENT",
    "MISSED_PICKUP",
    "DISRUPTED",
]

ATTENDANCE_WEIGHTS = [88, 8, 2, 2]


def get_school_days(start_date, count):
    """Generate weekdays only, excluding weekends."""
    days = []
    current = start_date

    while len(days) < count:
        if current.weekday() < 5:
            days.append(current)

        current += timedelta(days=1)

    return days


def generate_attendance(db: Session):
    rng = random.Random(SEED + 1)

    assignments = (
        db.query(Assignment)
        .filter(Assignment.status == "ACTIVE")
        .order_by(Assignment.assignment_id)
        .all()
    )

    if not assignments:
        raise ValueError("No active assignments found.")

    school_days = get_school_days(START_DATE, SCHOOL_DAYS)

    # Cache guardians to avoid repeated database queries.
    guardians = {}

    for assignment in assignments:
        student_id = assignment.student_id

        guardian = (
            db.query(GuardianContact)
            .filter(
                GuardianContact.student_id == student_id,
                GuardianContact.is_primary.is_(True),
                GuardianContact.is_valid.is_(True),
            )
            .first()
        )

        guardians[student_id] = guardian

    event_counter = 0
    notification_counter = 0
    event_counts = {outcome: 0 for outcome in ATTENDANCE_OUTCOMES}

    # Generate one attendance event per eligible assignment per day.
    for service_date in school_days:
        for assignment in assignments:

            if assignment.effective_from > service_date:
                continue

            if (
                assignment.effective_to is not None
                and assignment.effective_to < service_date
            ):
                continue

            # Protect against accidental duplicate generation.
            existing = (
                db.query(AttendanceEvent)
                .filter(
                    AttendanceEvent.assignment_id == assignment.assignment_id,
                    AttendanceEvent.event_date == service_date,
                )
                .first()
            )

            if existing:
                raise ValueError(
                    f"Attendance already exists for "
                    f"{assignment.assignment_id} on {service_date}. "
                    "Do not regenerate over existing history."
                )

            outcome = rng.choices(
                ATTENDANCE_OUTCOMES,
                weights=ATTENDANCE_WEIGHTS,
                k=1,
            )[0]

            event_counter += 1
            event_counts[outcome] += 1

            event_time = datetime.combine(
                service_date,
                time(7, 30)
            )

            event_id = f"ATT-2026-{event_counter:07d}"

            event = AttendanceEvent(
                event_id=event_id,
                assignment_id=assignment.assignment_id,
                event_date=service_date,
                event_type=outcome,
                event_time=event_time,
                notes=f"Simulated attendance outcome: {outcome}",
            )

            db.add(event)
            db.flush()

            # Notify guardian for exceptional attendance outcomes.
            if outcome in ("ABSENT", "MISSED_PICKUP", "DISRUPTED"):

                guardian = guardians.get(assignment.student_id)

                if guardian is None:
                    raise ValueError(
                        f"No valid primary guardian for "
                        f"{assignment.student_id}"
                    )

                notification_counter += 1

                notification = Notification(
                    notification_id=f"NOT-2026-{notification_counter:06d}",
                    student_id=assignment.student_id,
                    guardian_id=guardian.guardian_id,
                    event_id=event.event_id,
                    channel="SMS",
                    status="SENT",
                    message=(
                        f"Transportation update: {outcome} "
                        f"for student {assignment.student_id} "
                        f"on {service_date}."
                    ),
                    sent_at=datetime.combine(
                        service_date,
                        time(7, 45)
                    ),
                )

                db.add(notification)

        # Persist each day's events in a transaction.
        db.commit()

        print(f"Completed attendance for {service_date}")

    print("\nATTENDANCE GENERATION COMPLETE")
    print(f"School days: {len(school_days)}")
    print(f"Assignments: {len(assignments)}")
    print(f"Attendance events: {event_counter}")
    print(f"Notifications: {notification_counter}")

    for outcome, count in event_counts.items():
        print(f"{outcome}: {count}")

    return {
        "school_days": len(school_days),
        "attendance_events": event_counter,
        "notifications": notification_counter,
        "outcomes": event_counts,
    }
