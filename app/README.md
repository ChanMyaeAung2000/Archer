# Archer App

The web client for Archer, built as an independent Vite + React application.

For product behavior and project-wide boundaries, see [../SPEC.md](../SPEC.md) and [../AGENTS.md](../AGENTS.md).

## Local setup

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

The app runs at `http://localhost:5173` and expects the API at `http://localhost:4000/api/v1`.

## Included in this slice

- Login and registration with client/freelancer roles.
- Protected application shell and responsive navigation.
- Dashboard overview.
- Job search and currency filtering.
- Job detail view.
- Client project draft creation with USD/MMK amount handling.
- Freelancer proposal submission and status tracking.
- Client proposal request inbox with accept/reject actions.
- Persistent proposal notifications that open the relevant request detail.
- Project workspace with status, milestones, and project-scoped messaging.
- Profile summary.
- React Router, TanStack Query, shadcn-style primitives, and the requested `bciwMOyg` preset metadata.
- English and Myanmar localization through `i18next` and `react-i18next`; the selected language is stored in browser local storage.
