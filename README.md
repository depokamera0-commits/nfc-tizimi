# NFC Tizimi (NFC-Based Employee Management System)

## Overview
An NFC-enabled employee management system for secure login, employee self-service, and HR oversight. The platform supports structured approvals, record tracking, and reporting with Excel exports.

## Core Functions
- Login with card ID + PIN
- Employee profile (read-only)
- Medical check records
- Safety training records
- Online applications
- Disciplinary records

## Roles
- Employee
- HR
- Admin
- Manager

## Approval Workflow
Supervisor → HR → Director approval

## Reporting
- Filterable report views
- Export to Excel

## Tech Stack
- Backend: Node.js (Express)
- Frontend: React
- Database: PostgreSQL

## Development Roadmap
### Phase 0 — Discovery & Planning
- Confirm functional requirements, approval flow, and role permissions.
- Define data retention and compliance needs (medical and disciplinary records).
- Draft UX wireframes for main flows.

### Phase 1 — Project Foundation
- Set up monorepo structure and shared tooling (linting, formatting).
- Configure environment management and local development with Docker.
- Define initial database schema and migration workflow.

### Phase 2 — Authentication & Authorization
- Implement NFC login with card ID + PIN.
- Add role-based access control for Employee, HR, Admin, Manager.
- Create audit logging for sensitive actions.

### Phase 3 — Core Records
- Employee profile (read-only for employees).
- Medical check records CRUD (HR/Admin).
- Safety training records CRUD (HR/Admin).
- Disciplinary records CRUD (HR/Admin).

### Phase 4 — Online Applications & Approval Flow
- Application submission by employees.
- Supervisor → HR → Director approval workflow with status tracking.
- Notifications for pending approvals and decisions.

### Phase 5 — Reporting & Export
- Filterable report interfaces across modules.
- Excel export with role-based access controls.
- Scheduled exports for HR (optional).

### Phase 6 — Hardening & Launch
- Security review and penetration testing.
- Performance testing for login and reporting.
- Production deployment, monitoring, and backups.

## Proposed Project Structure
```
nfc-tizimi/
├─ apps/
│  ├─ web/                    # React frontend
│  │  ├─ src/
│  │  │  ├─ components/
│  │  │  ├─ pages/
│  │  │  ├─ routes/
│  │  │  ├─ hooks/
│  │  │  ├─ services/         # API clients
│  │  │  └─ styles/
│  │  └─ public/
│  └─ api/                    # Express backend
│     ├─ src/
│     │  ├─ controllers/
│     │  ├─ routes/
│     │  ├─ services/
│     │  ├─ middlewares/
│     │  ├─ policies/         # RBAC policies
│     │  ├─ validators/
│     │  └─ utils/
│     └─ tests/
├─ packages/
│  ├─ shared/                 # Shared types and utilities
│  └─ ui/                     # Shared UI components
├─ database/
│  ├─ migrations/
│  ├─ seeds/
│  └─ schema/
├─ docs/
│  ├─ architecture/
│  ├─ api/
│  └─ workflows/
├─ scripts/
└─ docker/
```

## Backend Setup (Express + PostgreSQL)
### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Environment
Copy `.env.example` to `.env` and update values as needed:
```
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/nfc_tizimi
JWT_SECRET=replace-with-strong-secret
```

### Database
Create the database and run the migration:
```
createdb nfc_tizimi
psql nfc_tizimi < database/migrations/001_init.sql
```

### Install & Run
```
npm install
npm run dev
```

## Frontend Setup (React)
### Environment
Copy `web/.env.example` to `web/.env` and update values as needed:
```
VITE_API_URL=http://localhost:4000
```

### Install & Run
```
cd web
npm install
npm run dev
```

### Features
- Login with card ID + PIN
- Read-only employee profile
- Admin dashboard with employee directory and creation form (admin/hr)

### Seed an Admin User
```
npm run create-admin -- CARD-001 1234 "Admin User"
```

### Authentication
Login using card ID + PIN:
```
POST /auth/login
{
  "cardId": "CARD-001",
  "pin": "1234"
}
```

### API Overview
Profile:
- `GET /me`

Employees (admin/hr only):
- `GET /employees`
- `GET /employees/:id`
- `POST /employees`
- `PUT /employees/:id`
- `DELETE /employees/:id`

Medical Records:
- `GET /medical-records/me`
- `GET /medical-records` (admin/hr/manager)
- `GET /medical-records/:id` (admin/hr/manager)
- `POST /medical-records` (admin/hr)
- `PUT /medical-records/:id` (admin/hr)
- `DELETE /medical-records/:id` (admin/hr)

Safety Training Records:
- `GET /safety-records/me`
- `GET /safety-records` (admin/hr/manager)
- `GET /safety-records/:id` (admin/hr/manager)
- `POST /safety-records` (admin/hr)
- `PUT /safety-records/:id` (admin/hr)
- `DELETE /safety-records/:id` (admin/hr)

Disciplinary Records:
- `GET /disciplinary-records/me`
- `GET /disciplinary-records` (admin/hr/manager)
- `GET /disciplinary-records/:id` (admin/hr/manager)
- `POST /disciplinary-records` (admin/hr)
- `PUT /disciplinary-records/:id` (admin/hr)
- `DELETE /disciplinary-records/:id` (admin/hr)
