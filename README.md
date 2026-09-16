
# TicketFlow

![CI](https://github.com/agarwal-anushka/ticketflow/actions/workflows/ci.yml/badge.svg)

A full-stack customer support ticketing platform — built as a portfolio
project for a Software Engineering internship application, modeled after
the kind of case-management tooling used in enterprise CRM products.

It's a complete system, not a CRUD demo: JWT auth with role-based access,
a live Kanban board with optimistic UI, transaction-safe auto-assignment
(verified against a real concurrent MySQL workload, not just mocks — see
[Testing](#testing)), a full audit trail, and 41 automated tests covering
the logic that actually matters.

**Live demo:** [ticketflow-steel.vercel.app](https://ticketflow-steel.vercel.app)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@demo.ticketflow.app` | `Demo1234!` |
| Agent | `priya@demo.ticketflow.app` | `Demo1234!` |
| Agent | `rahul@demo.ticketflow.app` | `Demo1234!` |
| Customer | `customer@demo.ticketflow.app` | `Demo1234!` |

Log in as the customer to see a populated ticket list from their point
of view; log in as an agent or admin to see the Kanban board, audit log,
and analytics. (Backend is on a free-tier host — the first request after
a period of inactivity can take 30–50s to wake up.)

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
| **Auth** | JWT-based login/register with bcrypt password hashing and three roles: `admin`, `agent`, `customer`. The role is always assigned by the server — nothing in the request body can set or elevate it |
| **Access control** | Customers can only view/comment on tickets they created; agents and admins can access any ticket. Enforced at the service layer on every read and write, not just hidden in the UI |
| **Tickets** | Full CRUD with status/priority filtering |
| **Kanban board / List view** | Toggle between a drag-and-drop board (Open → In Progress → Resolved → Closed, optimistic UI with automatic rollback on failure) and a filterable list view. Dragging is available to agents/admins; customers get a read-only board |
| **Auto-assignment** | One click routes a ticket to whichever active agent currently has the fewest open tickets. Wrapped in a MySQL transaction with a row lock on the agent lookup, so two simultaneous assignments can't race each other onto the same agent — proven with a real concurrent-request integration test, not just mocks |
| **Comments** | Threaded discussion per ticket |
| **Audit log** | Every status/priority/assignee change is recorded — who changed it, from what, to what, and when |
| **Analytics** | Ticket counts by status and priority, plus average resolution time, charted with Recharts |
| **Monitoring** | `/api/health` reports uptime and live DB connectivity — a first step toward "owning your service in production" |

## Stack

**Frontend** — React (Vite), React Router, Axios, Recharts, Vitest + React Testing Library  
**Backend** — Node.js, Express, MySQL (`mysql2`), JWT, bcrypt, Jest + Supertest  
**Database** — MySQL  
**CI** — GitHub Actions running the full backend suite (unit + a real-MySQL concurrency integration test via a service container) and the frontend suite on every push

## Architecture

Layered backend, not just route handlers with inline SQL:

```
routes → controllers → services → models → MySQL
                ↑
         middleware (JWT auth, role checks, request logging, error handling)
```

- **models/** — raw parameterized SQL queries, no ORM
- **services/** — business logic; this is where the auto-assignment
  transaction, per-request access-control checks, and audit-logging live.
  Every read inside a transaction (e.g. the ticket lookup during
  auto-assignment) runs on that transaction's own connection, not a
  separate pooled one, so nothing reads stale or uncommitted state
- **controllers/** — thin request/response glue
- **middleware/** — auth, role-based gating, structured request logs, a
  single centralized error handler

## Project structure

```
ticketflow/
  .github/workflows/ci.yml    # backend + frontend tests on every push
  backend/
    sql/
      schema.sql               # run first — creates DB, tables, indexes
      seed.sql                 # optional — demo accounts + realistic tickets
    src/
      config/db.js               # MySQL connection pool + health check
      models/                     # userModel, ticketModel, commentModel, auditModel
      services/                   # authService, ticketService, assignmentService, analyticsService
      controllers/
      middleware/                 # authMiddleware, roleMiddleware, logger, error handler
      routes/
      tests/                      # 34 mocked Jest tests + 1 real-MySQL integration test
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

This creates the `ticketflow` database and all tables.

Optionally, load demo data so the app isn't empty on first run:

```bash
mysql -u root -p ticketflow < backend/sql/seed.sql
```

This creates working admin/agent/customer accounts (see the credentials
table at the top of this README) plus realistic tickets, comments, and
audit log entries.

### 2. Backend

```bash
cd backend
cp .env.example .env    # add your MySQL credentials + a JWT secret
                         # (JWT_SECRET also needs to exist for `npm test` to run)
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

**Fastest path:** run the seed script (above), then log in with any of
the demo accounts at the top of this README.

**Or walk through it from scratch:**

1. Open `http://localhost:5173` — you'll land on the marketing page.
2. Click **Get started** and register an account (always created as
   `customer` — there's no way to self-select a different role).
3. Create a ticket from the dashboard and watch it appear on the board.
4. To see auto-assignment and analytics in action, register a second
   account and promote it to `agent` directly in MySQL:
   ```sql
   UPDATE users SET role='agent' WHERE email='youragent@example.com';
   ```
5. Log in as that agent, open the ticket, and click **Auto-assign to
   least-busy agent**. Then check the audit log at the bottom of the
   ticket page.
6. Log back in as the original customer and confirm they can only see
   their own ticket — a direct link to someone else's ticket ID returns
   a 403, not the ticket.

## Testing

```bash
cd backend && npm test     # 34 mocked tests — no live DB needed
cd frontend && npm test    # 6 tests — Vitest + React Testing Library
```

Backend tests cover JWT signing/verification, auth and role middleware,
the register/login service logic (including that any role sent in the
request body — `admin`, `agent`, or otherwise — is always ignored),
ticket-level access control (a customer can only read or comment on
tickets they created; agents and admins can access any), and the
auto-assignment transaction: it's tested for the happy path, no
available agents, a missing ticket, and a mid-transaction DB failure,
confirming rollback and connection release happen correctly in every case.

**Concurrency integration test.** The 34 tests above mock the database,
which proves the transaction logic is *used* correctly but can't prove
the row lock actually *works* under real concurrent access. A separate
test (`assignmentService.integration.test.js`) runs against a real
MySQL instance: it creates two agents with zero open tickets, fires two
simultaneous `autoAssignTicket` calls with `Promise.all`, and asserts
they land on two different agents — which would fail without the
`SELECT ... FOR UPDATE` lock, since both calls would otherwise be able
to read "least busy = agent A" before either write commits. This test
is skipped by default (no DB required for a normal `npm test`) and runs
automatically in CI against a real MySQL service container. Run it
locally with:

```bash
RUN_INTEGRATION_TESTS=1 DB_HOST=localhost DB_PORT=3306 DB_USER=root \
DB_PASSWORD=yourpassword DB_NAME=ticketflow npx jest assignmentService.integration
```

## Design decisions & tradeoffs

Things worth knowing (and worth being asked about):

- **JWT in localStorage, 24h expiry, no refresh token.** Simplest option
  for this scope. A production system would likely pair a short-lived
  access token with a refresh token to shrink the exposure window if a
  token is ever stolen. Also, since the role is baked into the token at
  login, demoting a user or deactivating their account has no effect
  until their current token expires — there's no revocation check on
  each request.
- **Auto-assignment uses a MySQL transaction, not a queue.** Correct and
  sufficient at single-database scale, and verified under real
  concurrent load (see [Testing](#testing)). At high throughput, a
  queue-based assignment worker would scale better than a row lock on
  `users`.
- **Access control is enforced per-request at the service layer, not
  via database-level security.** Correct and tested for every current
  route, but it means each new query touching `tickets` or `comments`
  has to remember to scope by `created_by` for customers — there's no
  database-level backstop if a future endpoint forgets. A larger system
  might add Postgres row-level security, or a query layer that can't
  omit the scope, as a second line of defense.
- **No pagination on the ticket list.** Fine for a demo dataset; would
  need `LIMIT`/`OFFSET` or cursor pagination in production.
- **No input validation on ticket field values.** `updateTicketField`
  whitelists which *column* can be updated (preventing SQL injection via
  the field name), but doesn't validate the *value* — e.g. an invalid
  `status` currently surfaces as a raw 500 from a DB enum constraint
  rather than a clean 400. Adding a schema-validation layer (`zod` or
  `express-validator`) on request bodies is the natural next step.
