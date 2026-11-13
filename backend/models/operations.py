
from sqlalchemy import (
    Column, String, Date, DateTime,
    ForeignKey, func
)
from sqlalchemy.orm import relationship
from backend.database import Base


class AttendanceEvent(Base):
    __tablename__ = "attendance_events"

    event_id = Column(String(40), primary_key=True)
    assignment_id = Column(
        String(40),
        ForeignKey("assignments.assignment_id"),
        nullable=False
    )
    event_date = Column(Date, nullable=False)
    event_type = Column(String(30), nullable=False)
    event_time = Column(DateTime, nullable=False)
    notes = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())

    assignment = relationship(
        "Assignment", back_populates="attendance_events"
    )
    notifications = relationship(
        "Notification", back_populates="attendance_event"
    )


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(String(30), primary_key=True)
    student_id = Column(
        String(20), ForeignKey("students.student_id"), nullable=False
    )
    guardian_id = Column(
        String(30), ForeignKey("guardian_contacts.guardian_id"), nullable=False
    )
    event_id = Column(
        String(40), ForeignKey("attendance_events.event_id"), nullable=False
    )

    channel = Column(String(20), nullable=False)
    status = Column(String(30), nullable=False)
    message = Column(String(500), nullable=False)
    sent_at = Column(DateTime)
    failure_reason = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())

    guardian = relationship("GuardianContact", back_populates="notifications")
    attendance_event = relationship(
        "AttendanceEvent", back_populates="notifications"
    )
