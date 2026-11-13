
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import (
    Bus, Route, RouteStop, Stop, Assignment
)

router = APIRouter(prefix="/api", tags=["Transportation"])


@router.get("/buses")
def get_buses(db: Session = Depends(get_db)):

    buses = db.query(Bus).order_by(Bus.bus_id).all()

    result = []

    for bus in buses:
        assigned = db.query(Assignment).filter(
            Assignment.bus_id == bus.bus_id,
            Assignment.status == "ACTIVE"
        ).count()

        result.append({
            "bus_id": bus.bus_id,
            "registration_number": bus.registration_number,
            "capacity": bus.capacity,
            "assigned_students": assigned,
            "remaining_capacity": max(0, bus.capacity - assigned),
            "accessible": bus.accessible,
            "status": bus.status
        })

    return {"total": len(result), "buses": result}


@router.get("/routes")
def get_routes(db: Session = Depends(get_db)):

    routes = db.query(Route).order_by(Route.route_id).all()

    result = []

    for route in routes:
        stops = (
            db.query(RouteStop, Stop)
            .join(Stop, RouteStop.stop_id == Stop.stop_id)
            .filter(RouteStop.route_id == route.route_id)
            .order_by(RouteStop.sequence_number)
            .all()
        )

        result.append({
            "route_id": route.route_id,
            "bus_id": route.bus_id,
            "driver_id": route.driver_id,
            "service_date": route.service_date.isoformat(),
            "capacity": route.capacity_snapshot,
            "status": route.status,
            "stops": [
                {
                    "stop_id": rs.stop_id,
                    "stop_name": stop.stop_name,
                    "sequence": rs.sequence_number,
                    "arrival_time": rs.arrival_time,
                    "travel_minutes": rs.travel_minutes_from_previous
                }
                for rs, stop in stops
            ]
        })

    return {"total": len(result), "routes": result}


@router.get("/assignments")
def get_assignments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: str | None = None,
    db: Session = Depends(get_db)
):

    query = db.query(Assignment)

    if status:
        query = query.filter(Assignment.status == status)

    total = query.count()

    assignments = (
        query.order_by(Assignment.assignment_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "assignments": [
            {
                "assignment_id": a.assignment_id,
                "student_id": a.student_id,
                "route_id": a.route_id,
                "stop_id": a.stop_id,
                "bus_id": a.bus_id,
                "effective_from": a.effective_from.isoformat(),
                "status": a.status,
                "decision_reason": a.decision_reason
            }
            for a in assignments
        ]
    }
