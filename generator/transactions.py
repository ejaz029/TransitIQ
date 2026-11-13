
from datetime import date, time, datetime, timedelta

from backend.models import (
    Student, Bus, Driver, Stop, AddressZone,
    Route, RouteStop, Assignment
)


SERVICE_DATE = date(2026, 11, 16)


def generate_transactions(db):
    students = db.query(Student).order_by(Student.student_id).all()
    buses = db.query(Bus).filter(
        Bus.status == "ACTIVE"
    ).order_by(Bus.bus_id).all()
    drivers = db.query(Driver).filter(
        Driver.status == "ACTIVE"
    ).order_by(Driver.driver_id).all()
    zones = db.query(AddressZone).order_by(
        AddressZone.zone_id
    ).all()

    if not students or not buses or not drivers or not zones:
        raise ValueError("Master data is missing. Generate it first.")

    if len(buses) > len(drivers):
        raise ValueError("Insufficient drivers for bus allocation.")

    # One representative approved stop per zone.
    zone_stops = {}

    for zone in zones:
        stop = (
            db.query(Stop)
            .filter(
                Stop.zone_id == zone.zone_id,
                Stop.approved.is_(True),
                Stop.active.is_(True)
            )
            .order_by(Stop.stop_id)
            .first()
        )

        if stop is None:
            raise ValueError(f"No approved stop for {zone.zone_id}")

        zone_stops[zone.zone_id] = stop

    # Create one route per bus.
    routes = {}
    route_loads = {}
    route_stops = {}

    for index, bus in enumerate(buses):
        route_id = f"ROUTE-2026-{index + 1:06d}"

        route = Route(
            route_id=route_id,
            bus_id=bus.bus_id,
            driver_id=drivers[index].driver_id,
            service_date=SERVICE_DATE,
            capacity_snapshot=bus.capacity,
            status="PLANNED"
        )

        db.add(route)
        db.flush()

        routes[bus.bus_id] = route
        route_loads[bus.bus_id] = 0
        route_stops[bus.bus_id] = {}

        # Every route visits one approved stop per zone.
        for sequence, zone in enumerate(zones, start=1):
            stop = zone_stops[zone.zone_id]

            arrival = datetime.combine(
                SERVICE_DATE,
                time(7, 0)
            ) + timedelta(minutes=sequence * 5)

            route_stop = RouteStop(
                route_stop_id=(
                    f"RSTOP-2026-{index + 1:06d}{sequence:02d}"
                ),
                route_id=route_id,
                stop_id=stop.stop_id,
                sequence_number=sequence,
                arrival_time=arrival.strftime("%H:%M"),
                travel_minutes_from_previous=5
            )

            db.add(route_stop)
            route_stops[bus.bus_id][zone.zone_id] = stop

    db.flush()

    # Allocate students requiring accessible vehicles first.
    students.sort(
        key=lambda s: (
            not s.accessibility_required,
            s.student_id
        )
    )

    assigned = 0
    rejected = []

    for student in students:
        candidates = [
            bus for bus in buses
            if route_loads[bus.bus_id] < bus.capacity
            and (
                not student.accessibility_required
                or bus.accessible
            )
        ]

        if not candidates:
            rejected.append(student.student_id)
            continue

        # Select the compatible bus with the lowest utilization.
        candidates.sort(
            key=lambda bus: (
                route_loads[bus.bus_id] / bus.capacity,
                bus.bus_id
            )
        )

        selected_bus = candidates[0]
        selected_route = routes[selected_bus.bus_id]
        selected_stop = route_stops[selected_bus.bus_id].get(
            student.zone_id
        )

        if selected_stop is None:
            rejected.append(student.student_id)
            continue

        assignment = Assignment(
            assignment_id=f"ASN-{student.student_id}-2026",
            student_id=student.student_id,
            route_id=selected_route.route_id,
            stop_id=selected_stop.stop_id,
            bus_id=selected_bus.bus_id,
            effective_from=SERVICE_DATE,
            status="ACTIVE",
            decision_reason="CAPACITY_AND_ACCESSIBILITY_VALIDATED"
        )

        db.add(assignment)
        route_loads[selected_bus.bus_id] += 1
        assigned += 1

    db.commit()

    print("\nTRANSACTION GENERATION COMPLETE")
    print(f"Routes created: {len(routes)}")
    print(f"Assignments created: {assigned}")
    print(f"Rejected assignments: {len(rejected)}")

    for bus in buses:
        print(
            f"{bus.bus_id}: "
            f"{route_loads[bus.bus_id]}/{bus.capacity} students"
        )

    if rejected:
        print("Rejected student IDs:", rejected[:20])

    return {
        "routes": len(routes),
        "assigned": assigned,
        "rejected": len(rejected)
    }
