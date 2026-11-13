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
