# TransitIQ 🚍
### A smarter way to understand and manage school transportation operations.

**TransitIQ** is a school transportation operations and monitoring platform built to bring student transport records, vehicle assignments, attendance, notifications and operational exceptions into one place.

Managing school transportation involves more than knowing which bus goes where. It means keeping student assignments consistent, monitoring attendance events, understanding operational exceptions and making information accessible to the people responsible for daily operations.

I built TransitIQ to explore how a centralized, API-driven system can make these workflows easier to understand, validate and manage.

---

## Why TransitIQ?

Transportation data is often spread across different records and workflows. This makes it harder to get a clear picture of daily operations and identify inconsistencies early.

TransitIQ approaches this problem by bringing together:

- **Student information** — access student transport records and individual details.
- **Fleet and routes** — view buses and their associated route information.
- **Transport assignments** — review student-to-transport assignments and their statuses.
- **Attendance monitoring** — inspect attendance events and identify missed pickups or disruptions.
- **Notifications** — review simulated notification records and their delivery statuses.
- **Operational exceptions** — access records that may require attention.
- **Anomaly validation** — evaluate predefined operational and data-integrity scenarios using explicit validation rules.

The goal is simple: make transportation operations more visible, structured and easier to review.

## What it looks like

The application combines a React-based dashboard with a FastAPI backend.

> Add your actual dashboard screenshot here once you have captured it.

<!-- Replace this comment with:
![TransitIQ Dashboard](docs/images/dashboard.png)
-->

## Key capabilities

| Module | What it does |
|---|---|
| Dashboard | Provides a consolidated operational overview |
| Students | Lists students and supports individual student lookup |
| Buses | Exposes bus information |
| Routes | Provides route information |
| Assignments | Supports assignment review and filtering |
| Attendance | Provides date- and event-based attendance filtering |
| Notifications | Lists notification records and supports status filtering |
| Exceptions | Exposes operational exception records |
| Anomaly validation | Checks predefined scenarios against expected decisions |

## Engineering behind the project

TransitIQ is built as a separated frontend and backend application.

```text
                 ┌─────────────────────────┐
                 │      React Frontend     │
                 │     TypeScript + Vite   │
                 └────────────┬────────────┘
                              │
                         REST API
                              │
                 ┌────────────▼────────────┐
                 │       FastAPI           │
                 │     Backend Layer       │
                 └────────────┬────────────┘
                              │
                  ┌───────────┴───────────┐
                  │                       │
          ┌───────▼────────┐     ┌────────▼────────┐
          │    MySQL       │     │ Anomaly Engine  │
          │  SQLAlchemy    │     │  Rule-based     │
          └────────────────┘     └─────────────────┘

             Python Data Generation Scripts
```

### Technology stack

**Backend**
- Python
- FastAPI
- SQLAlchemy
- MySQL

**Frontend**
- React
- TypeScript
- Vite

**Testing and validation**
- Pytest
- pytest-cov
- Custom rule-based anomaly validation

**Development**
- Git and GitHub
- Python virtual environment
- REST API architecture

## Anomaly validation

One important part of TransitIQ is its rule-based validation engine.

Rather than treating every operational record as valid, the engine evaluates specific conditions and produces an expected action.

| Scenario | Validation outcome |
|---|---|
| Bus capacity exceeded | REJECT |
| Accessibility mismatch | REJECT |
| Impossible route travel-time gap | FLAG |
| Invalid guardian contact | BLOCK_NOTIFICATION |
| Unapproved address exposure | CRITICAL_ALERT |

### Validation results

The supplied evaluation dataset contains five predefined anomaly scenarios.

| Metric | Result |
|---|---:|
| Total scenarios | 5 |
| Detected | 5 |
| Missed | 0 |
| Decision accuracy on supplied scenarios | 100% |

All five predefined scenarios were detected during the reported evaluation.

*This result applies only to the supplied test cases. It should not be interpreted as real-world detection accuracy or performance on unseen data.*

## Synthetic data generation

To make the platform testable without depending on real school or student information, TransitIQ includes configurable synthetic data generation.

| Configuration | Starter | Full |
|---|---:|---:|
| Students | 200 | 5,000 |
| Buses | 10 | 100 |
| Stops | 30 | 300 |
| Zones | 5 | 30 |
| Drivers | 10 | 100 |
| School days | 20 | 200 |

The configured random seed is `20261022`, supporting repeatable generation.

All generated records are demonstration data. The geographic coordinates use a fictional Hyderabad reference area and are not verified student addresses or approved pickup locations.

## Getting started

### Prerequisites

- Python 3.12 or a compatible Python environment
- MySQL
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/ejaz029/TransitIQ.git
cd TransitIQ
```

### 2. Set up the backend

Create and activate a virtual environment:

```bash
python -m venv venv
```

Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the project dependencies:

```bash
pip install -r requirements.txt
```

Configure your local database settings using the provided `.env.example` as a reference. Create the required MySQL database before starting the application.

### 3. Prepare the database

```bash
python create_tables.py
```

Check the database connection:

```bash
python test_db.py
```

### 4. Generate demonstration data

For the starter dataset:

```bash
python generator/run.py --scale starter
```

For the larger dataset:

```bash
python generator/run.py --scale full
```

### 5. Start the backend

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Backend:

`http://127.0.0.1:8000`

Interactive API documentation:

`http://127.0.0.1:8000/docs`

### 6. Start the frontend

Open another terminal:

```bash
cd TransitIQ_frontend
npm install
npm run dev
```

Frontend:

`http://localhost:5173`

The Vite development server proxies `/api` requests to the local FastAPI backend.

## API overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard` | Dashboard summary |
| GET | `/api/students` | List students |
| GET | `/api/students/{student_id}` | Student details |
| GET | `/api/buses` | List buses |
| GET | `/api/routes` | List routes |
| GET | `/api/assignments` | List assignments |
| GET | `/api/attendance` | Attendance records |
| GET | `/api/notifications` | Notification records |
| GET | `/api/exceptions` | Operational exceptions |

Refer to the generated FastAPI documentation at `/docs` for the available request parameters and response schemas.

## Testing

Automated tests are maintained in the `tests/` directory.

Run the test suite:

```bash
python -m pytest tests -v
```

Run with coverage:

```bash
python -m pip install pytest-cov

python -m pytest tests -v --cov=backend --cov=validation --cov-report=term-missing
```

Run the anomaly evaluation separately:

```bash
python evaluate_anomalies.py
```

### Reported verification

- 16 automated tests passed.
- Backend and validation coverage reported at 64%.
- Frontend production build completed successfully.
- Five predefined anomaly scenarios detected.

These are results from the development verification run, not guarantees for every future revision.

## Project structure

```text
TransitIQ/
│
├── backend/
│   ├── api/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── database.py
│   └── main.py
│
├── generator/
│   ├── config.py
│   ├── run.py
│   ├── master_data.py
│   ├── transactions.py
│   └── anomalies.py
│
├── validation/
│   └── anomaly_engine.py
│
├── data/
│   ├── generated/
│   └── ground_truth/
│
├── tests/
│
├── docs/
│
├── TransitIQ_frontend/
│   └── src/
│       ├── components/
│       ├── layouts/
│       ├── lib/
│       └── pages/
│
├── create_tables.py
├── evaluate_anomalies.py
├── generate_anomalies.py
├── generate_attendance.py
├── generate_transactions.py
└── export_api_contracts.py
```

## Current limitations

I believe a useful engineering project should be clear about what it has and what it does not have.

TransitIQ is currently a prototype with the following limitations:

- No live GPS or vehicle telemetry integration.
- No production authentication or role-based access control.
- Notification records are simulated; real SMS delivery is not integrated.
- Route generation uses a basic heuristic rather than a production-grade optimization engine.
- Anomaly evaluation currently covers five predefined scenarios.
- The generated dataset is synthetic and should not be used for real transport operations.

## What's next?

There is room to take TransitIQ further:

- Live vehicle tracking and telemetry integration.
- Secure authentication and role-based access.
- Real notification provider integration.
- More advanced route optimization.
- Expanded anomaly detection and independent evaluation datasets.
- Database integration and end-to-end frontend testing.
- Production deployment, monitoring and observability.

## About the project

TransitIQ was developed as a hands-on engineering project to explore how backend systems, data generation, validation logic and frontend applications can work together to solve an operational problem.

The focus was not just on building screens or exposing endpoints, but on creating a structured system that can be tested, understood and extended.

**Built with Python, FastAPI, React, TypeScript and MySQL.**

---

**Developer:** Ejaz Ahammed Belgaum  
**GitHub:** [ejaz029](https://github.com/ejaz029)  
**Project repository:** [TransitIQ](https://github.com/ejaz029/TransitIQ)

*If you're reviewing the project, the best place to start is the architecture, the API documentation and the automated validation tests.*
