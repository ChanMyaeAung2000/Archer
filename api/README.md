# Archer API

Standalone REST API for Archer, built with Express, TypeScript, Prisma 7, and SQLite.

For product behavior and project-wide boundaries, see [../SPEC.md](../SPEC.md) and [../AGENTS.md](../AGENTS.md).

## Local setup

Requirements: Node.js 20+.

```bash
npm install
Copy-Item .env.example .env
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

The API runs at `http://localhost:4000`.

- Health check: `GET /health`
- API base: `http://localhost:4000/api/v1`
- Demo client: `client@archer.local` / `Password123!`
- Demo freelancer: `freelancer@archer.local` / `Password123!`

## Current endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /users/me`
- `PATCH /users/me/profile`
- `GET /skills`
- `GET /jobs`
- `GET /jobs/:id`
- `POST /jobs`
- `POST /jobs/:id/publish`
- `POST /proposals`
- `GET /proposals/mine`
- `GET /proposals/received`
- `GET /proposals/:id`
- `POST /proposals/:id/withdraw`
- `POST /proposals/:id/accept`
- `POST /proposals/:id/reject`
- `GET /notifications`
- `POST /notifications/:id/read`
- `POST /notifications/read-all`
- `GET /projects`
- `GET /projects/:id`
- `PATCH /projects/:id/status`
- `POST /projects/:id/milestones`
- `PATCH /projects/:id/milestones/:milestoneId`
- `GET /projects/:id/messages`
- `POST /projects/:id/messages`
- `POST /projects/:id/messages/read`

Amounts are integer minor units: USD uses cents and MMK uses whole kyat. Payment processing is not implemented.
