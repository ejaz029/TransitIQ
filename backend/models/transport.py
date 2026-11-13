
from sqlalchemy import (
    Column, String, Integer, Float, Date, DateTime,
    ForeignKey, UniqueConstraint, CheckConstraint, func
)
from sqlalchemy.orm import relationship
from backend.database import Base


class Route(Base):
    __tablename__ = "routes"

    route_id = Column(String(30), primary_key=True)
    bus_id = Column(String(20), ForeignKey("buses.bus_id"), nullable=False)
    driver_id = Column(String(20), ForeignKey("drivers.driver_id"), nullable=False)
    service_date = Column(Date, nullable=False)
    capacity_snapshot = Column(Integer, nullable=False)
    status = Column(String(20), default="PLANNED", nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    bus = relationship("Bus", back_populates="routes")
    driver = relationship("Driver", back_populates="routes")
    route_stops = relationship("RouteStop", back_populates="route")
    assignments = relationship("Assignment", back_populates="route")


class RouteStop(Base):
    __tablename__ = "route_stops"

    route_stop_id = Column(String(30), primary_key=True)
    route_id = Column(String(30), ForeignKey("routes.route_id"), nullable=False)
    stop_id = Column(String(20), ForeignKey("stops.stop_id"), nullable=False)
    sequence_number = Column(Integer, nullable=False)
    arrival_time = Column(String(5), nullable=False)
    travel_minutes_from_previous = Column(Integer, default=0, nullable=False)

    __table_args__ = (
        UniqueConstraint("route_id", "sequence_number"),
        UniqueConstraint("route_id", "stop_id"),
        CheckConstraint("sequence_number > 0"),
        CheckConstraint("travel_minutes_from_previous >= 0"),
    )

    route = relationship("Route", back_populates="route_stops")
    stop = relationship("Stop", back_populates="route_stops")


class Assignment(Base):
    __tablename__ = "assignments"

    assignment_id = Column(String(40), primary_key=True)
    student_id = Column(String(20), ForeignKey("students.student_id"), nullable=False)
    route_id = Column(String(30), ForeignKey("routes.route_id"), nullable=False)
    stop_id = Column(String(20), ForeignKey("stops.stop_id"), nullable=False)
    bus_id = Column(String(20), ForeignKey("buses.bus_id"), nullable=False)

    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date)
    status = Column(String(20), default="PENDING", nullable=False)
    decision_score = Column(Float)
    decision_reason = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "effective_to IS NULL OR effective_to >= effective_from"
        ),
    )

    student = relationship("Student", back_populates="assignments")
    route = relationship("Route", back_populates="assignments")
    attendance_events = relationship(
        "AttendanceEvent", back_populates="assignment"
    )
