# Archer API contract

This document is the machine-oriented reference for the Archer REST API. It is written so an AI agent (or a developer) can discover, authenticate against, and use the API without reading the source. It reflects the current implementation in `api/`; when source and this document disagree, the source is correct and this document should be updated.

- Base URL (local development): `http://localhost:4000`
- Versioned API prefix: `/api/v1`
- Built with Express 5, TypeScript, Prisma 7, SQLite, JWT, Zod.
- Health check (unversioned): `GET /health`
- Interactive product context: [`../SPEC.md`](../SPEC.md); engineering boundaries: [`../AGENTS.md`](../AGENTS.md).

## Conventions

### Transport

- All request and response bodies are `application/json` unless noted. Send `Content-Type: application/json` on every mutating request.
- Requests without a valid JSON body on endpoints that expect one fail with `400`.
- All API routes except the health check are prefixed with `/api/v1`. Unknown routes return `404` with the standard error envelope (`NOT_FOUND`).
- The API applies `helmet` security headers, CORS restricted to the comma-separated `WEB_ORIGIN` list, and a global rate limit (default 100 requests per 15 minutes per IP; excess requests receive HTTP `429`). The rate limit is not part of the standard error envelope.
- CORS only allows browser origins in `WEB_ORIGIN`. Non-browser agents (curl, server-side code) are not subject to CORS.

### Success envelope

```json
{ "data": <payload>, "meta": <optional metadata> }
```

`meta` appears only where documented (e.g. pagination on `GET /jobs`, unread count on `GET /notifications`). List endpoints that have no defined metadata return just `data` (an array).

### Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | BAD_REQUEST | INTERNAL_SERVER_ERROR",
    "message": "Human-readable summary",
    "details": "optional, present for validation errors"
  }
}
```

| HTTP | `error.code` | Meaning |
| ---- | ------------ | ------- |
| 400 | `VALIDATION_ERROR` | Body/query failed Zod validation. `details` is `z.error.flatten()`: `{ formErrors: string[], fieldErrors: { <field>: string[] } }`. |
| 400 | `BAD_REQUEST` | Reserved generic client error (`badRequest` helper). Not currently emitted by routes. |
| 401 | `UNAUTHORIZED` | Missing/invalid/expired access token, or failed login credentials, or invalid refresh token. |
| 403 | `FORBIDDEN` | Authenticated but wrong role or not a participant/owner of the resource. |
| 404 | `NOT_FOUND` | Resource does not exist, route not found, or the caller is not a participant (used deliberately to avoid leaking existence). |
| 409 | `CONFLICT` | Business-rule conflict (duplicate, wrong lifecycle state). See per-endpoint notes. |
| 429 | (not enveloped) | Rate limit exceeded. |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error. |

### Authentication

- JWT bearer auth. Send `Authorization: Bearer <accessToken>` on every authenticated request.
- Access tokens are short-lived (default `15m`). Refresh tokens are long-lived (default `30d`) and are stored server-side as hashed refresh sessions; refreshing **rotates** the refresh token (the old session is deleted and a new one is issued). Reusing a rotated refresh token fails with `401`.
- Access token payload: `{ sub: <userId>, role: "CLIENT" | "FREELANCER" | "ADMIN", type: "access" }`.
- Refresh token payload: `{ sub: <userId>, sid: <refreshSessionId>, type: "refresh" }`.
- Logout revokes the presented refresh session; without a body it still returns `204`.

### IDs and timestamps

- All ids are UUID strings (`z.string().uuid()` in validation).
- Timestamps are ISO 8601 strings with millisecond precision (e.g. `2026-11-03T12:34:56.789Z`). Fields of type `DateTime?` are `null` when unset.

### Money

- Supported currencies: `USD` and `MMK` only (`z.enum(["USD", "MMK"])`).
- Amounts are **integer minor units**: USD in cents (e.g. `150000` = $1,500.00), MMK in whole kyat.
- Every amount field is stored and returned **with its currency**. There is no currency conversion. Never interpret an amount without its paired currency field.
- Payment processing, escrow, wallets, and payouts do not exist. Do not treat any amount as paid or escrowed.

### Pagination

Only `GET /api/v1/jobs` is paginated:

- Query params: `page` (integer ≥ 1, default 1), `limit` (integer 1–50, default 20), plus `q` (search, max 100 chars) and `currency`.
- `meta`: `{ page, limit, total, pages }`.

Other list endpoints return full arrays (`GET /notifications` caps at 30 most recent).

### Enums

| Enum | Values |
| ---- | ------ |
| UserRole | `CLIENT`, `FREELANCER`, `ADMIN` (admin reserved, no admin endpoints) |
| UserStatus | `ACTIVE`, others exist in schema as free-form string but login requires `ACTIVE` |
| JobStatus | `DRAFT`, `PUBLISHED`, `IN_PROGRESS`, `COMPLETED`, `CLOSED`, `CANCELLED` |
| ProposalStatus | `SUBMITTED`, `ACCEPTED`, `REJECTED`, `WITHDRAWN` |
| ProjectStatus | `NOT_STARTED`, `ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED` |
| MilestoneStatus | `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| NotificationType | `NEW_PROPOSAL`, `PROPOSAL_ACCEPTED`, `PROPOSAL_REJECTED`, `PROJECT_STATUS_CHANGED`, `MILESTONE_CREATED`, `NEW_MESSAGE` |

### Notification payloads

`Notification.payload` is a **JSON-encoded string** (not a nested object). Parse it with `JSON.parse` before use. Shape by type:

| Type | Payload |
| ---- | ------- |
| `NEW_PROPOSAL` | `{ proposalId, jobId }` |
| `PROPOSAL_ACCEPTED` | `{ proposalId, projectId }` |
| `PROPOSAL_REJECTED` | `{ proposalId }` |
| `PROJECT_STATUS_CHANGED` | `{ projectId }` |
| `MILESTONE_CREATED` | `{ projectId, milestoneId }` |
| `NEW_MESSAGE` | `{ projectId }` |

Notification `payload` may be `null` for other/future types; tolerate that.

### Common object shapes

Full `Profile` model (returned nested in user objects):

```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "string",
  "headline": "string | null",
  "bio": "string | null",
  "avatarUrl": "string | null",
  "location": "string | null",
  "timezone": "string | null",
  "languages": "string | null",
  "createdAt": "iso",
  "updatedAt": "iso"
}
```

Public user projection used in auth responses: `{ "id", "email", "role", "profile": <Profile> }`.
Project participant projection: `{ "id", "email", "profile": <Profile> }`.
Job summary `client` projection: `{ "id", "profile": { "name", "avatarUrl" } }`.

`JobSummary` (all job responses use it):

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "category": "string | null",
  "budgetAmount": 150000,
  "budgetCurrency": "USD",
  "status": "DRAFT | PUBLISHED | ...",
  "deadline": "iso | null",
  "createdAt": "iso",
  "publishedAt": "iso | null",
  "client": { "id": "uuid", "profile": { "name": "string", "avatarUrl": "string | null" } },
  "skills": [
    { "jobId": "uuid", "skillId": "uuid", "skill": { "id": "uuid", "name": "string", "slug": "string", "createdAt": "iso" } }
  ]
}
```

`Proposal` (all proposal responses use this projection):

```json
{
  "id": "uuid",
  "coverLetter": "string",
  "bidAmount": 110000,
  "bidCurrency": "USD",
  "estimatedDays": 14,
  "status": "SUBMITTED",
  "createdAt": "iso",
  "updatedAt": "iso",
  "freelancer": { "id": "uuid", "email": "string", "profile": "<Profile>" },
  "job": {
    "id": "uuid", "title": "string", "description": "string",
    "budgetAmount": 150000, "budgetCurrency": "USD", "status": "PUBLISHED",
    "clientId": "uuid",
    "client": { "id": "uuid", "email": "string", "profile": "<Profile>" }
  }
}
```

`Project` (returned by project endpoints):

```json
{
  "id": "uuid",
  "clientId": "uuid",
  "freelancerId": "uuid",
  "agreedAmount": 110000,
  "agreedCurrency": "USD",
  "status": "NOT_STARTED",
  "startedAt": "iso | null",
  "completedAt": "iso | null",
  "createdAt": "iso",
  "updatedAt": "iso",
  "job": { "id": "uuid", "title": "string", "description": "string", "budgetAmount": 150000, "budgetCurrency": "USD", "status": "IN_PROGRESS", "deadline": "iso | null" },
  "client": { "id": "uuid", "email": "string", "profile": "<Profile>" },
  "freelancer": { "id": "uuid", "email": "string", "profile": "<Profile>" },
  "acceptedProposal": { "id": "uuid", "coverLetter": "string", "bidAmount": 110000, "bidCurrency": "USD", "estimatedDays": 14 },
  "milestones": ["<Milestone>, ordered by createdAt asc"],
  "conversation": {
    "id": "uuid",
    "messages": ["<Message> including sender, ordered by createdAt asc, max 100"]
  }
}
```

`conversation` may be absent if none exists (it is created with the project; the message-send endpoint upserts it defensively). `GET /projects` embeds conversations and messages in every project — payloads are large; prefer `GET /projects/:id/messages` for message-only fetches.

Full `Milestone` model:

```json
{
  "id": "uuid",
  "projectId": "uuid",
  "title": "string",
  "description": "string | null",
  "amount": 50000,
  "currency": "USD",
  "dueDate": "iso | null",
  "status": "PENDING",
  "createdAt": "iso",
  "updatedAt": "iso"
}
```

`Message`:

```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "senderId": "uuid",
  "body": "string",
  "readAt": "iso | null",
  "createdAt": "iso",
  "sender": { "id": "uuid", "email": "string", "profile": "<Profile>" }
}
```

`sender` is included on message reads and on the message-create response.

`Notification`:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "NEW_PROPOSAL",
  "title": "string",
  "payload": "{\"proposalId\":\"uuid\",\"jobId\":\"uuid\"} or null",
  "readAt": "iso | null",
  "createdAt": "iso"
}
```

`Skill`: `{ "id": "uuid", "name": "string", "slug": "string", "createdAt": "iso" }`.

---

## Endpoint reference

Auth column: `public` = no token required; `auth` = valid access token; role in parentheses = `requireRole` is enforced.

### Health

#### `GET /health` — public

Returns `{ "data": { "status": "ok", "service": "archer-api", "timestamp": "iso" } }`. Not under `/api/v1`.

### Auth — `/api/v1/auth`

#### `POST /auth/register` — public

Body:

```json
{
  "email": "user@example.com",
  "password": "min 8, max 128 chars",
  "name": "2–100 chars",
  "role": "CLIENT | FREELANCER (default FREELANCER)"
}
```

`201 Created`:

```json
{ "data": { "user": { "id", "email", "role", "profile" }, "accessToken": "...", "refreshToken": "..." } }
```

Errors: `400` validation; `409 CONFLICT` if the email already exists.

#### `POST /auth/login` — public

Body: `{ "email": "user@example.com", "password": "..." }`

`200 OK`: same shape as register. Errors: `400` validation; `401 UNAUTHORIZED` on bad credentials or non-`ACTIVE` account.

#### `POST /auth/refresh` — public (requires a refresh token)

Body: `{ "refreshToken": "..." }`

`200 OK`: `{ "data": { "accessToken": "...", "refreshToken": "..." } }` — note: no `user` object, and the presented refresh token is consumed (rotated).

Errors: `400` if `refreshToken` is missing; `401 UNAUTHORIZED` if the token is invalid, expired, revoked, or its session was already rotated/deleted.

#### `POST /auth/logout` — auth

Body (optional): `{ "refreshToken": "..." }`

Revokes the matching refresh session for the caller. `204 No Content` always. Access tokens remain valid until they expire (no blacklist); clients must discard them locally.

#### `GET /auth/me` — auth

`200 OK`: `{ "data": { "user": { "id", "email", "role", "profile" } } }`. Errors: `401`.

### Users — `/api/v1/users`

#### `GET /users/me` — auth

`200 OK`: `{ "data": { "id", "email", "role", "status", "profile", "createdAt" } }` (note: flatter shape than `/auth/me`). Errors: `401`, `404`.

#### `PATCH /users/me/profile` — auth

Body (all fields optional):

```json
{
  "name": "2–100 chars",
  "headline": "max 160 chars | null",
  "bio": "max 5000 chars | null",
  "avatarUrl": "valid URL | null",
  "location": "max 120 chars | null",
  "timezone": "max 80 chars | null",
  "languages": "max 200 chars | null"
}
```

`null` clears a nullable field. Creates the profile if missing (defaults `name` to `"Archer user"` when omitted).

`200 OK`: `{ "data": <Profile> }`. Errors: `400` validation, `401`.

### Skills — `/api/v1/skills`

#### `GET /skills` — public

Query: `q` (optional, case-insensitive contains, max 80 chars). Returns up to 100 skills ordered by name asc.

`200 OK`: `{ "data": [<Skill>, ...] }`

### Jobs — `/api/v1/jobs`

#### `GET /jobs` — public

Query: `q` (optional search over title/description), `currency` (`USD|MMK`), `page` (default 1), `limit` (1–50, default 20). Only `PUBLISHED` jobs are listed.

`200 OK`:

```json
{ "data": [<JobSummary>, ...], "meta": { "page": 1, "limit": 20, "total": 42, "pages": 3 } }
```

#### `GET /jobs/:id` — public

`200 OK`: `{ "data": <JobSummary> }`. Errors: `404 NOT_FOUND` for missing jobs (no authorization filter — any job is readable by id).

#### `POST /jobs` — auth (CLIENT)

Body:

```json
{
  "title": "5–160 chars",
  "description": "20–10000 chars",
  "category": "max 80 chars, optional",
  "budgetAmount": 150000,
  "budgetCurrency": "USD | MMK",
  "deadline": "ISO date, optional (coerced)",
  "skillIds": ["uuid", "..."]
}
```

`skillIds` max 20; every id must exist (`409 CONFLICT` otherwise). The job is created as `DRAFT`.

`201 Created`: `{ "data": <JobSummary> }`. Errors: `400`, `401`, `403` (non-CLIENT), `409`.

#### `POST /jobs/:id/publish` — auth (CLIENT, owner)

No body. Transitions `DRAFT → PUBLISHED` and sets `publishedAt`. Errors: `404` missing job; `403` not the owner; `409` job is not `DRAFT`.

`200 OK`: `{ "data": <JobSummary> }`

### Proposals — `/api/v1/proposals`

#### `GET /proposals/mine` — auth (FREELANCER)

`200 OK`: `{ "data": [<Proposal>, ...] }` for the caller, newest first.

#### `GET /proposals/received` — auth (CLIENT)

`200 OK`: `{ "data": [<Proposal>, ...] }` for all proposals on the caller's jobs, newest first.

#### `GET /proposals/:id` — auth (participant)

Readable only by the proposing freelancer or the job's client. `200 OK`: `{ "data": <Proposal> }`. Errors: `403` authenticated but not a participant; `404` otherwise.

#### `POST /proposals` — auth (FREELANCER)

Body:

```json
{
  "jobId": "uuid",
  "coverLetter": "20–10000 chars",
  "bidAmount": 110000,
  "bidCurrency": "USD | MMK",
  "estimatedDays": 14
}
```

`estimatedDays` optional, integer 1–365.

Business rules: job must exist and be `PUBLISHED` (`409` otherwise); you cannot propose on your own job (`403`); one proposal per freelancer per job (`409` on duplicates). Creates a `NEW_PROPOSAL` notification for the client as a side effect.

`201 Created`: `{ "data": <Proposal> }`. Errors: `400`, `401`, `403`, `404`, `409`.

#### `POST /proposals/:id/withdraw` — auth (FREELANCER, owner)

No body. Transitions `SUBMITTED → WITHDRAWN`. Errors: `404`, `403` not your proposal, `409` not currently `SUBMITTED`.

`200 OK`: `{ "data": <Proposal> }`

#### `POST /proposals/:id/reject` — auth (CLIENT, job owner)

No body. Transitions `SUBMITTED → REJECTED`; notifies the freelancer (`PROPOSAL_REJECTED`). Errors: `404`, `403` not the job owner, `409` not currently `SUBMITTED`.

`200 OK`: `{ "data": <Proposal> }`

#### `POST /proposals/:id/accept` — auth (CLIENT, job owner)

No body. Transaction, atomically:

1. Sets this proposal `SUBMITTED → ACCEPTED`.
2. Sets all other `SUBMITTED` proposals on the same job to `REJECTED`.
3. Creates the `Project` from the agreed terms (`agreedAmount`/`agreedCurrency` from the bid, status `NOT_STARTED`), including an empty `Conversation`.
4. Sets the job `PUBLISHED → IN_PROGRESS`.
5. Notifies the freelancer (`PROPOSAL_ACCEPTED`).

Preconditions (`409` unless all hold): proposal is `SUBMITTED` **and** job is `PUBLISHED`. `403` if caller is not the job's client; `404` if the proposal does not exist.

`200 OK`: `{ "data": { "project": { "id", "status", "agreedAmount", "agreedCurrency" } } }` — note this response is **not** the full project object. Fetch `GET /projects/:id` for the workspace.

### Projects — `/api/v1/projects`

All project endpoints require auth and are participant-only (client or freelancer of the project). Non-participants receive `404 NOT_FOUND`.

#### `GET /projects` — auth

`200 OK`: `{ "data": [<Project>, ...] }` for projects where the caller is client or freelancer, newest `updatedAt` first.

#### `GET /projects/:id` — auth (participant)

`200 OK`: `{ "data": <Project> }`. Errors: `404`.

#### `PATCH /projects/:id/status` — auth (participant)

Body: `{ "status": "NOT_STARTED | ACTIVE | PAUSED | COMPLETED | CANCELLED" }`

Any participant may set any status. The only rejected transition is setting the status the project already has (`409 CONFLICT`). Side effects: transitioning to `ACTIVE` sets `startedAt` (if unset); transitioning to `COMPLETED` sets `completedAt`; the other participant receives a `PROJECT_STATUS_CHANGED` notification.

`200 OK`: `{ "data": <Project> }`. Errors: `400`, `401`, `404`, `409`.

#### `POST /projects/:id/milestones` — auth (participant)

Body:

```json
{
  "title": "2–160 chars",
  "description": "max 5000 chars, optional",
  "amount": 50000,
  "currency": "USD | MMK",
  "dueDate": "ISO date, optional"
}
```

`201 Created`: `{ "data": <Milestone> }` (status defaults to `PENDING`). Notifies the other participant (`MILESTONE_CREATED`). Errors: `400`, `401`, `404`.

#### `PATCH /projects/:id/milestones/:milestoneId` — auth (participant)

Body (all optional): the milestone-create fields plus `status` (`PENDING | IN_PROGRESS | COMPLETED | CANCELLED`).

`200 OK`: `{ "data": <Milestone> }`. Errors: `400`, `401`, `404` (project or milestone not found / not in this project).

#### `GET /projects/:id/messages` — auth (participant)

`200 OK`: `{ "data": [<Message>, ...] }` — ordered `createdAt` asc, each including `sender`. The underlying project projection caps this at the first 100 messages. Empty array if no conversation/messages exist.

#### `POST /projects/:id/messages` — auth (participant)

Body: `{ "body": "1–5000 chars, trimmed" }`

Creates the conversation if missing (upsert). Notifies the other participant (`NEW_MESSAGE`).

`201 Created`: `{ "data": <Message> }` including `sender`. Errors: `400`, `401`, `404`.

#### `POST /projects/:id/messages/read` — auth (participant)

No body. Marks all messages in the project conversation sent by the *other* participant as read (`readAt = now`). `204 No Content` (also `204` when no conversation exists).

### Notifications — `/api/v1/notifications`

#### `GET /notifications` — auth

`200 OK`: `{ "data": [<Notification>, ...], "meta": { "unread": <number> } }` — up to 30 most recent notifications; `meta.unread` counts unread ones within that set.

#### `POST /notifications/read-all` — auth

No body. Marks all of the caller's unread notifications read. `204 No Content`.

#### `POST /notifications/:id/read` — auth (owner)

No body. Marks one notification read (only if it belongs to the caller). `200 OK`: `{ "data": <Notification> }`. Errors: `404` if not found or not yours.

---

## Core workflow walkthrough

Copy-pasteable sequence using curl. Assumes the API runs locally on port 4000 and the database is migrated and seeded (`npm run prisma:seed` creates `client@archer.local` / `freelancer@archer.local`, both `Password123!`).

```bash
BASE=http://localhost:4000/api/v1

# 1. Client logs in
CLIENT=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"client@archer.local","password":"Password123!"}')
CLIENT_TOKEN=$(echo "$CLIENT" | jq -r .data.accessToken)

# 2. Freelancer logs in
FREELANCER=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"freelancer@archer.local","password":"Password123!"}')
FREELANCER_TOKEN=$(echo "$FREELANCER" | jq -r .data.accessToken)

# 3. Client creates a DRAFT job (amounts in USD cents)
JOB=$(curl -s -X POST $BASE/jobs -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Redesign our marketing site","description":"Full redesign of an existing marketing site with responsive layout.","budgetAmount":250000,"budgetCurrency":"USD"}')
JOB_ID=$(echo "$JOB" | jq -r .data.id)

# 4. Client publishes it
curl -s -X POST $BASE/jobs/$JOB_ID/publish -H "Authorization: Bearer $CLIENT_TOKEN"

# 5. Freelancer submits a proposal
PROPOSAL=$(curl -s -X POST $BASE/proposals -H "Authorization: Bearer $FREELANCER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"jobId\":\"$JOB_ID\",\"coverLetter\":\"I have shipped three similar redesigns in the last year.\",\"bidAmount\":200000,\"bidCurrency\":\"USD\",\"estimatedDays\":21}")
PROPOSAL_ID=$(echo "$PROPOSAL" | jq -r .data.id)

# 6. Client sees the notification, then accepts the proposal
curl -s $BASE/notifications -H "Authorization: Bearer $CLIENT_TOKEN"
curl -s -X POST $BASE/proposals/$PROPOSAL_ID/accept -H "Authorization: Bearer $CLIENT_TOKEN"

# 7. Both fetch the project workspace (use the project id from the accept response or from GET /projects)
PROJECT_ID=$(curl -s $BASE/projects -H "Authorization: Bearer $CLIENT_TOKEN" | jq -r .data[0].id)
curl -s $BASE/projects/$PROJECT_ID -H "Authorization: Bearer $FREELANCER_TOKEN"

# 8. Exchange a message and mark incoming messages read
curl -s -X POST $BASE/projects/$PROJECT_ID/messages -H "Authorization: Bearer $FREELANCER_TOKEN" \
  -H 'Content-Type: application/json' -d '{"body":"Project received — will start tomorrow."}'
curl -s -X POST $BASE/projects/$PROJECT_ID/messages/read -H "Authorization: Bearer $CLIENT_TOKEN"
```

### Session management for agents

1. Login once; store `accessToken` and `refreshToken` from the response.
2. Send `Authorization: Bearer <accessToken>` on each request.
3. On `401`, call `POST /auth/refresh` with the stored refresh token; replace both tokens with the rotated pair. If refresh also returns `401`, re-authenticate.
4. On logout, call `POST /auth/logout` with the refresh token.
5. Handle `409` as a business-rule signal, not a retryable error. Handle `429` by backing off before retrying.

### Parsing patterns

- Always branch on the presence of `error` in the body; do not rely on status codes alone.
- `GET /jobs` list data is paginated via `meta`; other lists are complete but unordered unless this document says otherwise.
- `Notification.payload` is stringified JSON — parse it defensively (`try { JSON.parse(payload) } catch { /* legacy payload */ }`).
- `date` fields may be `null`. `Conversation` on `<Project>` may be absent; `messages` inside it is capped at 100 entries.

---

## Not implemented (do not call)

- **Reviews**: the `Review` model exists in the schema but there are no `/reviews` routes.
- **Payments/escrow/payouts/wallets/withdrawals**: excluded from MVP; no endpoints, no fields beyond budget/bid/agreed/milestone amounts.
- **Admin endpoints**: the `ADMIN` role exists in tokens only; no admin routes.
- **Job update/close/cancel** and **CLOSED/CANCELLED** job transitions, **job editing**: not exposed via the API.
- **Pre-proposal messaging**: messaging exists only inside a project.
- **Push notifications**: none; poll `GET /notifications`.
- **File/portfolio uploads, rich text, presence, real-time transport**: none.

## Known implementation quirks

- `GET /jobs` and `GET /jobs/:id` are **public** (no auth) while almost everything else requires a token. Draft jobs are never returned by list endpoints but `GET /jobs/:id` does not filter by status — treat job ids as unguessable (UUIDs), not secret.
- `PATCH /projects/:id/status` accepts any transition (including backwards, e.g. `COMPLETED → ACTIVE`); only same-status is rejected with `409`. Do not assume state-machine enforcement.
- Milestones may be created and updated by either participant.
- Login compares `status === "ACTIVE"`; suspended/other-status accounts get `401` with a generic message.
- Errors from unmatched routes use the standard envelope with code `NOT_FOUND`.
- Rate-limit rejections (`429`) do not use the error envelope.
- `POST /proposals/:id/accept` returns only a minimal project projection; use `GET /projects/:id` for the full workspace.
- `GET /users/me` and `GET /auth/me` return different shapes for the same concept (flat vs nested `user`).

## Environment and demo credentials

- Local base URL: `http://localhost:4000` (env `PORT`, default 4000).
- Demo accounts (created by `npm run prisma:seed`): `client@archer.local` and `freelancer@archer.local`, password `Password123!`.
- Configuration is via environment variables; see `api/.env.example` (`JWT_*` secrets, `ACCESS_TOKEN_TTL` (default 15m), `REFRESH_TOKEN_TTL` (default 30d), `WEB_ORIGIN` (comma-separated CORS origins), `RATE_LIMIT_*`). Never log or commit real secrets.
