
# TicketFlow

A full-stack customer support ticketing platform — built as a portfolio
project for a Software Engineering internship application, modeled after
the kind of case-management tooling used in enterprise CRM products.

It's a complete system, not a CRUD demo: JWT auth with role-based access,
a live Kanban board with optimistic UI, transaction-safe auto-assignment,
a full audit trail, and 33 automated tests covering the logic that
actually matters.

---

## Contents

- [Features](#features)
- [Stack](#stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Setup](#setup)
- [Trying it out](#trying-it-out)
- [Testing](#testing)
- [Design decisions & tradeoffs](#design-decisions--tradeoffs)

---

## Features

| Area | What it does |
|---|---|
| **Auth** | JWT-based login/register with bcrypt password hashing and three roles: `admin`, `agent`, `customer` |
| **Tickets** | Full CRUD with status/priority filtering |
| **Kanban board** | Drag tickets between Open → In Progress → Resolved → Closed. Updates are optimistic — the UI moves instantly and rolls back automatically if the save fails |
| **Auto-assignment** | One click routes a ticket to whichever active agent currently has the fewest open tickets. Wrapped in a MySQL transaction so two simultaneous assignments can't race each other onto the same agent |
| **Comments** | Threaded discussion per ticket |
| **Audit log** | Every status/priority/assignee change is recorded — who changed it, from what, to what, and when |
| **Analytics** | Ticket counts by status and priority, plus average resolution time, charted with Recharts |
| **Monitoring** | `/api/health` reports uptime and live DB connectivity — a first step toward "owning your service in production" |

## Stack

**Frontend** — React (Vite), React Router, Axios, Recharts, Vitest + React Testing Library  
**Backend** — Node.js, Express, MySQL (`mysql2`), JWT, bcrypt, Jest + Supertest  
**Database** — MySQL

## Architecture

Layered backend, not just route handlers with inline SQL:

```
routes → controllers → services → models → MySQL
                ↑
         middleware (JWT auth, role checks, request logging, error handling)
```

- **models/** — raw parameterized SQL queries, no ORM
- **services/** — business logic; this is where the auto-assignment
  transaction and audit-logging live
- **controllers/** — thin request/response glue
- **middleware/** — auth, role-based gating, structured request logs, a
  single centralized error handler

## Project structure

```
ticketflow/
  backend/
    sql/schema.sql              # run first — creates DB, tables, indexes
    src/
      config/db.js               # MySQL connection pool + health check
      models/                     # userModel, ticketModel, commentModel, auditModel
      services/                   # authService, ticketService, assignmentService, analyticsService
      controllers/
      middleware/                 # authMiddleware, roleMiddleware, logger, error handler
      routes/
      tests/                      # 27 Jest tests (unit + Supertest integration)
    server.js
  frontend/
    src/
      components/
        auth/                     # LoginForm, RegisterForm
        tickets/                  # KanbanBoard, TicketList, TicketDetail, TicketCard, NewTicketForm
        comments/                 # CommentThread, CommentForm
        analytics/                # SummaryCharts
        common/                   # Sidebar, ProtectedRoute
      context/AuthContext.jsx     # global auth state
      services/api.js             # axios instance with JWT interceptor
      pages/                      # Landing, Login, Register, Dashboard, TicketDetail, Analytics
      tests/                      # 6 Vitest + RTL tests
```

## Setup

### 1. Database

```bash
mysql -u root -p < backend/sql/schema.sql
```

This creates the `ticketflow` database and all tables. The two seeded
demo users have placeholder password hashes — don't try to log into
them directly; register real accounts through the app instead.

### 2. Backend

```bash
cd backend
cp .env.example .env    # add your MySQL credentials + a JWT secret
npm install
npm run dev              # → http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env     # points VITE_API_URL at the backend
npm install
npm run dev               # → http://localhost:5173
```

## Trying it out

1. Open `http://localhost:5173` — you'll land on the marketing page.
2. Click **Get started** and register an account (defaults to `customer`).
3. Create a ticket from the dashboard and watch it appear on the board.
4. To see auto-assignment and analytics in action, register a second
   account and promote it to `agent` directly in MySQL:
   ```sql
   UPDATE users SET role='agent' WHERE email='youragent@example.com';
   ```
5. Log in as that agent, open the ticket, and click **Auto-assign to
   least-busy agent**. Then check the audit log at the bottom of the
   ticket page.

## Testing

```bash
cd backend && npm test     # 27 tests — Jest, DB layer mocked, no live DB needed
cd frontend && npm test    # 6 tests — Vitest + React Testing Library
```

Backend tests cover JWT signing/verification, auth and role middleware,
the register/login service logic, and — most importantly — the
auto-assignment transaction: it's tested for the happy path, no
available agents, a missing ticket, and a mid-transaction DB failure,
confirming rollback and connection release happen correctly in every case.

## Design decisions & tradeoffs

Things worth knowing (and worth being asked about):

- **JWT in localStorage, 24h expiry, no refresh token.** Simplest option
  for this scope. A production system would likely pair a short-lived
  access token with a refresh token to shrink the exposure window if a
  token is ever stolen.
- **Auto-assignment uses a MySQL transaction, not a queue.** Correct and
  sufficient at single-database scale. At high throughput, a queue-based
  assignment worker would scale better than a row lock on `tickets`.
- **No pagination on the ticket list.** Fine for a demo dataset; would
  need `LIMIT`/`OFFSET` or cursor pagination in production.
- **Tests mock the database layer** rather than requiring a live MySQL
  instance, so the suite runs anywhere with zero setup. A fuller CI
  pipeline would add a small number of true integration tests against a
  real test database on top of these.



