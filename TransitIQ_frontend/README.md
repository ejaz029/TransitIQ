# TransitIQ Frontend

A React + TypeScript operations dashboard for the TransitIQ school transportation platform. It consumes the existing FastAPI service; it does not connect to MySQL directly and does not create simulated operational records.

## Requirements
- Node.js 20.19+ (recommended for Vite 7)
- npm
- TransitIQ FastAPI backend running at `http://127.0.0.1:8000`

## Run locally

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

The Vite development server proxies `/api/*` to `http://127.0.0.1:8000`. To use another API host, copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.

## Pages
- Overview: backend dashboard metrics, attendance-event distribution and service response indicators.
- Students, Fleet, Routes & Stops, Assignments, Attendance, Notifications and Safety & Exceptions: searchable data tables backed by the corresponding GET endpoints.

## API contract notes
The API adapter supports bare arrays and common paginated envelopes (`items`, `results`, `data`, or `records`). Table columns use known field names and a small set of aliases to tolerate naming differences. Confirm the final response shape against `/openapi.json` and the exported endpoint samples before submission. Missing values are shown as an em dash rather than fabricated.

## Important limitations
- The current backend exposes read endpoints only. The UI intentionally does not pretend to create or edit records.
- The current API does not provide GPS telemetry, live map positions, actual SMS delivery receipts, authentication or role-based access. The UI does not simulate these capabilities.
- Table views display the rows returned by the API. If an endpoint caps results, pagination must be added to the backend and frontend together to browse the full dataset.
- The dashboard charts the attendance events returned by the API request; it is an event-type breakdown, not a historical time-series forecast.

## Build

```powershell
npm run build
```

The generated static site is written to `dist/`.
