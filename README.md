# Archer

Archer is a freelance marketplace connecting clients with freelancers through jobs, proposals, project workspaces, milestones, and project messaging.

The workspace currently contains two independently runnable packages:

| Package | Purpose | Local URL |
|---|---|---|
| `api/` | Express REST API, Prisma 7, SQLite, JWT auth | `http://localhost:4000` |
| `app/` | React web client | `http://localhost:5173` |

The Expo mobile client is planned as `mobile/` and is not implemented yet.

## Documentation map

- [SPEC.md](SPEC.md) — product features, workflows, business rules, and MVP scope.
- [AGENTS.md](AGENTS.md) — engineering boundaries and contribution guidance.
- [CLAUDE.md](CLAUDE.md) — assistant entry point that follows `AGENTS.md`.
- [api/README.md](api/README.md) — API setup and endpoint reference.
- [app/README.md](app/README.md) — web app setup and implemented client flows.

## Quick start

Start the API first:

```powershell
Set-Location api
npm install
Copy-Item .env.example .env
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

In another terminal, start the web app:

```powershell
Set-Location app
npm install
Copy-Item .env.example .env
npm run dev
```

The web app expects the API at `http://localhost:4000/api/v1`.

Demo accounts:

- Client: `client@archer.local` / `Password123!`
- Freelancer: `freelancer@archer.local` / `Password123!`

## Current implemented flow

1. Register or sign in as a client or freelancer.
2. Clients create and publish jobs with USD or MMK budgets and target deadlines.
3. Freelancers browse jobs and submit proposals.
4. Clients receive proposal notifications and can inspect, accept, or reject proposals.
5. Accepted proposals create a project workspace and conversation.
6. Project participants can manage status, milestones, and messages.

Payment processing is intentionally not implemented.
