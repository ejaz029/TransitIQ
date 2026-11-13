
import random
from faker import Faker
from sqlalchemy.orm import Session

from generator.config import (
    SEED, CONFIG, CENTER_LAT, CENTER_LON
)

from backend.models import (
    AddressZone, Student, GuardianContact,
    Stop, Bus, Driver
)

fake = Faker("en_IN")


def generate_master_data(db: Session, scale="starter"):
    if scale not in CONFIG:
        raise ValueError(f"Unknown scale: {scale}")

    random.seed(SEED)
    Faker.seed(SEED)
    fake.seed_instance(SEED)

    cfg = CONFIG[scale]

    # 1. Address zones
    zones = []

    for i in range(1, cfg["zones"] + 1):
        zone = AddressZone(
            zone_id=f"ZONE-{i:03d}",
            zone_name=f"Zone {i:03d}",
            latitude=CENTER_LAT + random.uniform(-0.08, 0.08),
            longitude=CENTER_LON + random.uniform(-0.08, 0.08),
        )
        zones.append(zone)

    db.add_all(zones)
    db.flush()

    # 2. Approved stops
    stops = []

    for i in range(1, cfg["stops"] + 1):
        zone = random.choice(zones)

        stops.append(
            Stop(
                stop_id=f"STOP-{i:06d}",
                stop_name=f"Pickup Stop {i:03d}",
                zone_id=zone.zone_id,
                latitude=zone.latitude + random.uniform(-0.01, 0.01),
                longitude=zone.longitude + random.uniform(-0.01, 0.01),
                approved=True,
                active=True,
            )
        )

    db.add_all(stops)

    # 3. Buses
    buses = []

    for i in range(1, cfg["buses"] + 1):
        buses.append(
            Bus(
                bus_id=f"BUS-{i:06d}",
                registration_number=f"TS-00-AB-{i:04d}",
                capacity=random.choice([30, 35, 40, 45, 50]),
                accessible=(i % 10 == 0),
                status="ACTIVE",
            )
        )

    db.add_all(buses)

    # 4. Drivers
    drivers = []

    for i in range(1, cfg["drivers"] + 1):
        drivers.append(
            Driver(
                driver_id=f"DRV-{i:06d}",
                full_name=fake.name(),
                license_number=f"DL-TS-{i:08d}",
                license_class="TRANSPORT",
                status="ACTIVE",
            )
        )

    db.add_all(drivers)

    db.flush()

    # 5. Students and guardian contacts
    for i in range(1, cfg["students"] + 1):
        zone = random.choice(zones)

        student = Student(
            student_id=f"STU-{i:06d}",
            full_name=fake.name(),
            grade=random.randint(1, 12),
            address=fake.street_address(),
            zone_id=zone.zone_id,
            latitude=zone.latitude + random.uniform(-0.015, 0.015),
            longitude=zone.longitude + random.uniform(-0.015, 0.015),
            accessibility_required=(i % 50 == 0),
            pickup_window_start="07:00",
            pickup_window_end="08:00",
            status="ACTIVE",
        )

        db.add(student)

        guardian_count = random.choice([1, 1, 2])

        for j in range(1, guardian_count + 1):
            guardian = GuardianContact(
                guardian_id=f"GUA-{i:06d}-{j:02d}",
                student_id=student.student_id,
                guardian_name=fake.name(),
                relationship_type=(
                    "PARENT" if j == 1 else "GUARDIAN"
                ),
                phone=f"+9199{random.randint(10000000, 99999999)}",
                email=fake.email(),
                is_primary=(j == 1),
                is_valid=True,
            )

            db.add(guardian)

        if i % 500 == 0:
            db.flush()
            print(f"Generated {i} students")

    db.commit()

    print("\nMASTER DATA GENERATION COMPLETE")
    print(f"Zones: {len(zones)}")
    print(f"Stops: {len(stops)}")
    print(f"Buses: {len(buses)}")
    print(f"Drivers: {len(drivers)}")
    print(f"Students: {cfg['students']}")
