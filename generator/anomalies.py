
import csv
import json
from pathlib import Path
from datetime import datetime

from backend.models import (
    Student, Bus, Assignment, Route, RouteStop, GuardianContact
)

OUTPUT = Path("data/generated")
GROUND_TRUTH = Path("data/ground_truth")


def generate_anomalies(db):
    OUTPUT.mkdir(parents=True, exist_ok=True)
    GROUND_TRUTH.mkdir(parents=True, exist_ok=True)

    cases = []
    truth = []

    def add_case(case_id, entity_type, entity_id, facts,
                 issue_type, expected_decision, severity):

        cases.append({
            "case_id": case_id,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "facts": facts
        })

        truth.append({
            "case_id": case_id,
            "issue_type": issue_type,
            "expected_decision": expected_decision,
            "severity": severity
        })

    # 1. Bus capacity exceeded
    bus = db.query(Bus).order_by(Bus.bus_id).first()

    current_load = (
        db.query(Assignment)
        .filter(
            Assignment.bus_id == bus.bus_id,
            Assignment.status == "ACTIVE"
        )
        .count()
    )

    add_case(
        "ANOM-001",
        "BUS",
        bus.bus_id,
        {
            "capacity": bus.capacity,
            "current_load": current_load,
            "proposed_load": bus.capacity + 1
        },
        "BUS_CAPACITY_EXCEEDED",
        "REJECT",
        "HIGH"
    )

    # 2. Student assigned to an incompatible bus
    student = (
        db.query(Student)
        .filter(Student.accessibility_required.is_(True))
        .order_by(Student.student_id)
        .first()
    )

    incompatible_bus = (
        db.query(Bus)
        .filter(Bus.accessible.is_(False))
        .order_by(Bus.bus_id)
        .first()
    )

    if not student or not incompatible_bus:
        raise ValueError("Cannot construct accessibility anomaly.")

    add_case(
        "ANOM-002",
        "ASSIGNMENT",
        student.student_id,
        {
            "student_accessibility_required": True,
            "bus_id": incompatible_bus.bus_id,
            "bus_accessible": False
        },
        "INCOMPATIBLE_ROUTE",
        "REJECT",
        "CRITICAL"
    )

    # 3. Impossible travel time between route stops
    route = db.query(Route).order_by(Route.route_id).first()

    stops = (
        db.query(RouteStop)
        .filter(RouteStop.route_id == route.route_id)
        .order_by(RouteStop.sequence_number)
        .limit(2)
        .all()
    )

    if len(stops) != 2:
        raise ValueError("Route needs at least two stops.")

    previous_time = datetime.strptime(
        stops[0].arrival_time, "%H:%M"
    )

    # Create a hypothetical next arrival one minute later.
    proposed_next_time = (
        previous_time.replace(year=2026, month=1, day=1)
        .replace(minute=(previous_time.minute + 1) % 60)
    )

    if previous_time.minute == 59:
        proposed_next_time = proposed_next_time.replace(
            hour=(previous_time.hour + 1) % 24
        )

    required_minutes = max(
        stops[1].travel_minutes_from_previous, 5
    )

    add_case(
        "ANOM-003",
        "ROUTE",
        route.route_id,
        {
            "previous_arrival": previous_time.strftime("%H:%M"),
            "next_arrival": proposed_next_time.strftime("%H:%M"),
            "required_travel_minutes": required_minutes
        },
        "IMPOSSIBLE_TRAVEL_TIME",
        "FLAG",
        "HIGH"
    )

    # 4. Invalid guardian contact
    guardian = (
        db.query(GuardianContact)
        .order_by(GuardianContact.guardian_id)
        .first()
    )

    add_case(
        "ANOM-004",
        "GUARDIAN_CONTACT",
        guardian.guardian_id,
        {
            "contact_valid": False,
            "phone": "INVALID_SYNTHETIC_CONTACT"
        },
        "INVALID_GUARDIAN_CONTACT",
        "BLOCK_NOTIFICATION",
        "HIGH"
    )

    # 5. Unapproved address exposure
    exposed_student = (
        db.query(Student)
        .order_by(Student.student_id)
        .first()
    )

    add_case(
        "ANOM-005",
        "ADDRESS",
        exposed_student.student_id,
        {
            "address_approved": False,
            "exposure_attempted": True
        },
        "UNAPPROVED_ADDRESS_EXPOSED",
        "CRITICAL_ALERT",
        "CRITICAL"
    )

    # Export anomaly inputs separately from ground truth.
    with open(OUTPUT / "anomaly_cases.json", "w") as f:
        json.dump(cases, f, indent=4)

    with open(OUTPUT / "anomaly_cases.csv", "w", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["case_id", "entity_type", "entity_id", "facts"]
        )
        writer.writeheader()

        for case in cases:
            writer.writerow({
                **case,
                "facts": json.dumps(case["facts"])
            })

    with open(GROUND_TRUTH / "ground_truth.json", "w") as f:
        json.dump(truth, f, indent=4)

    with open(GROUND_TRUTH / "ground_truth.csv", "w", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "case_id",
                "issue_type",
                "expected_decision",
                "severity"
            ]
        )
        writer.writeheader()
        writer.writerows(truth)

    print("ANOMALY DATA GENERATION COMPLETE")
    print(f"Anomaly scenarios: {len(cases)}")
    print(f"Ground-truth labels: {len(truth)}")
