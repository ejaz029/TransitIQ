
from sqlalchemy import (
    Column, String, Integer, Float, Boolean,
    ForeignKey, DateTime, CheckConstraint, func
)
from sqlalchemy.orm import relationship
from backend.database import Base


class AddressZone(Base):
    __tablename__ = "address_zones"

    zone_id = Column(String(20), primary_key=True)
    zone_name = Column(String(100), nullable=False, unique=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    students = relationship("Student", back_populates="zone")
    stops = relationship("Stop", back_populates="zone")


class Student(Base):
    __tablename__ = "students"

    student_id = Column(String(20), primary_key=True)
    full_name = Column(String(150), nullable=False)
    grade = Column(Integer, nullable=False)
    address = Column(String(255), nullable=False)
    zone_id = Column(String(20), ForeignKey("address_zones.zone_id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accessibility_required = Column(Boolean, default=False, nullable=False)
    pickup_window_start = Column(String(5), nullable=False)
    pickup_window_end = Column(String(5), nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        CheckConstraint("grade BETWEEN 1 AND 12"),
    )

    zone = relationship("AddressZone", back_populates="students")
    guardians = relationship("GuardianContact", back_populates="student")
    assignments = relationship("Assignment", back_populates="student")


class GuardianContact(Base):
    __tablename__ = "guardian_contacts"

    guardian_id = Column(String(30), primary_key=True)
    student_id = Column(String(20), ForeignKey("students.student_id"), nullable=False)
    guardian_name = Column(String(150), nullable=False)
    relationship_type = Column(String(30), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(150))
    is_primary = Column(Boolean, default=False, nullable=False)
    is_valid = Column(Boolean, default=True, nullable=False)

    student = relationship("Student", back_populates="guardians")
    notifications = relationship("Notification", back_populates="guardian")


class Stop(Base):
    __tablename__ = "stops"

    stop_id = Column(String(20), primary_key=True)
    stop_name = Column(String(150), nullable=False)
    zone_id = Column(String(20), ForeignKey("address_zones.zone_id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    approved = Column(Boolean, default=False, nullable=False)
    active = Column(Boolean, default=True, nullable=False)

    zone = relationship("AddressZone", back_populates="stops")
    route_stops = relationship("RouteStop", back_populates="stop")


class Bus(Base):
    __tablename__ = "buses"

    bus_id = Column(String(20), primary_key=True)
    registration_number = Column(String(30), unique=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    accessible = Column(Boolean, default=False, nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)

    __table_args__ = (
        CheckConstraint("capacity > 0"),
    )

    routes = relationship("Route", back_populates="bus")


class Driver(Base):
    __tablename__ = "drivers"

    driver_id = Column(String(20), primary_key=True)
    full_name = Column(String(150), nullable=False)
    license_number = Column(String(50), unique=True, nullable=False)
    license_class = Column(String(30), nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)

    routes = relationship("Route", back_populates="driver")
