
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Student, GuardianContact

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.get("")
def get_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    zone_id: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Student)

    if zone_id:
        query = query.filter(Student.zone_id == zone_id)

    if status:
        query = query.filter(Student.status == status)

    total = query.count()

    records = (
        query.order_by(Student.student_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "students": [
            {
                "student_id": s.student_id,
                "full_name": s.full_name,
                "grade": s.grade,
                "zone_id": s.zone_id,
                "accessibility_required": s.accessibility_required,
                "status": s.status
            }
            for s in records
        ]
    }


@router.get("/{student_id}")
def get_student(
    student_id: str,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if not student:
        raise HTTPException(404, "Student not found")

    guardians = db.query(GuardianContact).filter(
        GuardianContact.student_id == student_id
    ).all()

    return {
        "student_id": student.student_id,
        "full_name": student.full_name,
        "grade": student.grade,
        "address": student.address,
        "zone_id": student.zone_id,
        "accessibility_required": student.accessibility_required,
        "status": student.status,
        "guardians": [
            {
                "guardian_id": g.guardian_id,
                "guardian_name": g.guardian_name,
                "relationship": g.relationship_type,
                "is_primary": g.is_primary
            }
            for g in guardians
        ]
    }
