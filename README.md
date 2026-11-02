# Mini Project Manager

A small project-management web app: sign up, create projects, and track the tasks
inside them. Every project and task belongs to exactly one user, and the API
enforces that on every request.

- **Frontend** — Next.js (App Router) + React, Redux Toolkit & RTK Query
- **UI** — shadcn/ui on Base UI primitives, Tailwind CSS v4, dnd-kit for the board
- **Backend** — Node.js + Express 5, TypeScript
- **Database** — MongoDB via Mongoose
- **Auth** — JWT access + refresh tokens in httpOnly cookies

---

## Features

**Authentication**
- Email + password signup and login, passwords hashed with bcrypt (12 rounds)
- Short-lived access token (15 min) with a rotating refresh token (7 days)
- Protected API routes and protected frontend pages
- Rate-limited login (10 attempts per IP per 15 minutes)

**Projects**
- Create, read, update, delete — scoped to the signed-in user
- Each card shows a live per-status task count
- Deleting a project deletes its tasks

**Tasks**
- Belong to a project; `title`, `description`, `status`, `dueDate`
- Status is one of `todo`, `in-progress`, `done`
- Create, edit (full form or quick status change), delete
- **Two views, toggled in the filter bar:**
  - **Board** — a kanban with one column per status. Drag a card between
    columns to change its status, by mouse or keyboard.
  - **List** — a flat list with status filtering and full sorting
- Filter by one or more statuses (list view) and by due date — overdue, due
  today, next 7 days, or no due date (both views)
- Sort by due date, created, updated, title or status, in either direction
- Due dates are flagged as *overdue* or *due soon* in the UI (never on a done
  task — finished work is not late)

---

## Repository layout

```
.
├── api/                  Express + Mongoose REST API
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/     signup, login, refresh, logout, me
│   │   │   ├── projects/ project CRUD
│   │   │   ├── tasks/    task CRUD, filtering, sorting
│   │   │   └── shared/   errors, response envelope, JWT, validation
│   │   ├── db/           Mongoose connection, models, seed script
│   │   ├── env.ts        validated environment
│   │   └── server.ts     entry point
│   └── .env.example
└── web/                  Next.js frontend
    ├── src/
    │   ├── app/          routes: /login, /signup, /projects, /projects/[id]
    │   ├── components/
    │   │   ├── ui/       shadcn/ui components (generated)
    │   │   └── *.tsx     feature components
    │   ├── store/        Redux store, RTK Query API, slices
    │   └── lib/          shared types and helpers
    └── .env.local.example
```

---

## Prerequisites

- **Node.js 20+** (developed on 22.18)
- **pnpm** (`npm install -g pnpm`) — npm or yarn work too, adjust the commands
- **MongoDB** — either a local server or a free MongoDB Atlas cluster

### Getting a database

**Option A — Docker (quickest locally)**

```bash
docker run -d --name mpm-mongo -p 27017:27017 mongo:7
```

Then use `mongodb://127.0.0.1:27017/mini-project-manager`.

**Option B — MongoDB Atlas**

Create a free cluster, add a database user, allow your IP, and copy the
connection string. It looks like:

```
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/mini-project-manager?retryWrites=true&w=majority
```

---

## Setup

### 1. Backend

```bash
cd api
pnpm install
cp .env.example .env
```

Edit `api/.env`. The two JWT secrets must each be at least 32 characters and
must differ from each other. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | no | `development` by default |
| `PORT` | no | `4000` by default |
| `WEB_ORIGIN` | yes | Frontend origin(s) allowed to send credentials, comma-separated |
| `MONGODB_URI` | yes | Connection string from the step above |
| `JWT_ACCESS_SECRET` | yes | At least 32 characters |
| `JWT_REFRESH_SECRET` | yes | At least 32 characters, different from the access secret |
| `SEED_USER_EMAIL` | only for seeding | Demo account email |
| `SEED_USER_PASSWORD` | only for seeding | Demo account password, at least 8 characters |

Start it:

```bash
pnpm dev
```

The API listens on `http://localhost:4000`. Health check:
`http://localhost:4000/health`

Optionally load a demo account with two projects and five tasks:

```bash
pnpm db:seed
```

### 2. Frontend

In a second terminal:

```bash
cd web
pnpm install
cp .env.local.example .env.local
pnpm dev
```

`web/.env.local` needs one variable:

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the API **including** `/api/v1` |

Open `http://localhost:3000`, create an account, and start adding projects.

---

## API reference

Base URL: `http://localhost:4000/api/v1`

Successful responses are `{ "data": ... }`. Failures are
`{ "error": { "code", "message", "fields?" } }`, where `fields` maps a form
field name to a message, which is what the UI renders inline.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | – | Create an account, sets auth cookies |
| `POST` | `/auth/login` | – | Sign in, sets auth cookies |
| `POST` | `/auth/refresh` | refresh cookie | Rotate the token pair |
| `POST` | `/auth/logout` | – | Revoke the refresh token, clear cookies |
| `GET` | `/auth/me` | yes | Current user |
| `GET` | `/projects` | yes | List own projects with task counts |
| `POST` | `/projects` | yes | Create a project |
| `GET` | `/projects/:projectId` | yes | One project |
| `PATCH` | `/projects/:projectId` | yes | Update title and/or description |
| `DELETE` | `/projects/:projectId` | yes | Delete a project and its tasks |
| `GET` | `/projects/:projectId/tasks` | yes | Tasks in a project |
| `POST` | `/projects/:projectId/tasks` | yes | Create a task |
| `GET` | `/tasks` | yes | All of the user's tasks, same filters |
| `GET` | `/tasks/:taskId` | yes | One task |
| `PATCH` | `/tasks/:taskId` | yes | Update any task field |
| `DELETE` | `/tasks/:taskId` | yes | Delete a task |

### Filtering and sorting

Both task-list endpoints accept:

| Query param | Values | Default |
| --- | --- | --- |
| `status` | `todo`, `in-progress`, `done` — repeat the param or comma-separate | all statuses |
| `due` | `overdue`, `today`, `week`, `undated` | no due filter |
| `dueFrom` / `dueTo` | `YYYY-MM-DD`, inclusive | no range |
| `today` | `YYYY-MM-DD` — the caller's calendar date, anchors `due` | server's UTC date |
| `sort` | `dueDate`, `createdAt`, `updatedAt`, `title`, `status` | `createdAt` |
| `order` | `asc`, `desc` | `desc` |

`due` and `dueFrom`/`dueTo` are mutually exclusive; sending both is a 400.

```
GET /api/v1/projects/<id>/tasks?status=todo,in-progress&sort=dueDate&order=asc
GET /api/v1/projects/<id>/tasks?due=overdue&today=2026-11-03
GET /api/v1/projects/<id>/tasks?dueFrom=2026-11-01&dueTo=2026-11-30
```

### Trying it with curl

```bash
curl -c jar.txt -H "Content-Type: application/json" -d "{\"email\":\"demo@example.com\",\"password\":\"demo-password\"}" http://localhost:4000/api/v1/auth/signup
```

```bash
curl -b jar.txt http://localhost:4000/api/v1/projects
```

---

## Design decisions

- **Auth cookies** — JWT access (15 min) and rotating refresh (7 days) in
  httpOnly cookies, not `localStorage`. Refresh is stored server-side and
  rotated on use. Cookies use `SameSite=Lax` in development and
  `Secure` + `SameSite=None` in production.
- **Silent refresh** — On `401`, RTK Query calls `/auth/refresh` once and
  retries the request; the user is sent to `/login` only if refresh fails.
- **Ownership** — Project and task queries always filter by `owner`. Other
  users’ resources (and bad ids) return `404`.
- **Route guards** — Frontend auth is client-side via `/auth/me`
  (`RequireAuth`), because auth cookies live on the API host, not the Next.js
  origin. The API remains the real security boundary.
- **Due dates** — `due=overdue` skips done tasks. The client sends
  `today=YYYY-MM-DD` so “today / overdue / week” match the user’s calendar,
  not the server’s UTC date.
- **Sorting** — When sorting by due date, undated tasks are forced last so
  nulls do not bury real deadlines.
- **Task counts** — Project cards get per-status counts from one aggregation,
  not an N+1 count per project.
- **Board** — Drag between columns only updates `status` (optimistic UI).
  There is no `position` field, so within-column reorder is not persisted;
  columns follow the active sort. Status can also be changed from the list
  dropdown.
- **State** — Server data lives in RTK Query; filter/sort/view UI state lives
  in a Redux slice.

### Known limitations

- Login rate limiting is in-process (resets on restart; not shared across
  instances).
- No automated tests yet.
- Refresh-token revocation is per-token (no “sign out everywhere”).
- No pagination on project or task lists.
- Board cards cannot be reordered within a column.

---

## Deployment

The two halves deploy independently.

**API** (Render, Railway, Fly, any Node host): build with `pnpm build`, start
with `pnpm start`. Set `NODE_ENV=production`, `MONGODB_URI`, both JWT secrets,
and `WEB_ORIGIN` to the deployed frontend origin.

**Web** (Vercel or any Next.js host): set `NEXT_PUBLIC_API_BASE_URL` to the
deployed API URL, including `/api/v1`.

Because the cookies are `SameSite=None` in production, both halves must be
served over HTTPS.
