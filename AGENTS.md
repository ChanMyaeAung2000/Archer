# Archer project boundaries

This file is the durable engineering guidance for the entire Archer workspace. It applies to `api/`, `app/`, `mobile/` when it is added, and shared project documentation.

## Documentation responsibilities

- `SPEC.md` is the product specification. It describes user roles, feature behavior, workflows, business rules, and MVP scope. It is intentionally changeable as product decisions evolve.
- `README.md` at the workspace root is the user/developer orientation document: setup, repository layout, run commands, and current implementation status.
- `api/README.md` and `app/README.md` contain package-specific setup and usage instructions.
- `AGENTS.md` is the source of truth for engineering boundaries and collaboration rules.
- `CLAUDE.md` is an assistant-specific entry point that points back to this file. Do not create conflicting rules there.

When these documents appear to disagree, preserve user instructions first, then follow this file for engineering boundaries, then use the package README for implementation details. Use `SPEC.md` to resolve intended product behavior.

## Project boundaries

Archer has three independently deployable parts:

- `api/`: Express API, authentication, authorization, business rules, Prisma, SQLite, and persistence.
- `app/`: React web client. It communicates with the API over documented HTTP endpoints only.
- `mobile/`: React Native Expo client when implemented. It communicates with the API over documented HTTP endpoints only.

Each part is expected to become its own repository. Do not import source files across package boundaries. Shared behavior belongs in the API contract or a deliberately shared package, not in ad hoc cross-folder imports.

The API is the authority for validation, permissions, state transitions, money handling, and persistence. Clients may provide immediate UX validation, but must never replace server-side checks.

No client may access Prisma, SQLite, or the API database directly.

## Technical guardrails

- API: Node.js, TypeScript, Express, Prisma 7, SQLite, JWT authentication, and Zod validation.
- Web app: React, TypeScript, React Router, TanStack Query, Tailwind CSS, and shadcn-style components using preset `bciwMOyg`.
- Mobile: React Native, Expo, TypeScript, and TanStack Query.
- API routes are versioned under `/api/v1`.
- Successful API responses use `{ "data": ..., "meta": ... }` where metadata is useful.
- API errors use `{ "error": { "code": ..., "message": ..., "details": ... } }`.
- Authentication secrets and environment-specific values must stay in environment configuration, never source control.

## Domain boundaries

- A user must only read or mutate private records for which they are an owner or participant.
- Jobs, proposals, projects, milestones, messages, notifications, and reviews require explicit authorization checks.
- Project-scoped messaging is available only to the client and freelancer participating in that project.
- Accepting a proposal creates the project snapshot and conversation. The accepted proposal becomes immutable in its decision state.
- Project status and milestone status changes must be validated by the API.
- Payment processing, escrow, wallets, payouts, and withdrawals are out of scope until explicitly added to the product specification.
- Supported currencies are USD and MMK. Store money as integers: USD in cents and MMK in whole kyat. Always store and return the currency.
- Do not perform currency conversion without an explicit exchange-rate policy and source.
- User-generated text must be safely rendered; do not introduce unsanitized HTML.

## Change workflow

For a feature change:

1. Confirm the behavior belongs in `SPEC.md`; update the feature section when the product contract changes.
2. Implement server behavior and authorization in `api/` first when data or business rules are involved.
3. Connect `app/` or `mobile/` through API clients and query/mutation state, not direct database access.
4. Update package READMEs when setup, routes, environment variables, or user-visible behavior changes.
5. Run the narrowest relevant checks, then the package build/type check. For cross-package changes, verify both API and client builds.

Use existing patterns before adding new abstractions. Keep changes focused, preserve unrelated user work, and avoid destructive operations such as resetting the database or deleting data unless explicitly requested.

## Quality expectations

- New endpoints need validation, authorization, consistent responses, and an error path.
- New UI states need loading, empty, error, and success behavior.
- Important workflow changes need an end-to-end smoke test or focused integration test.
- Keep demo data and local-only artifacts clearly separated from source-controlled configuration.
- Do not claim a feature is complete until its behavior is reachable through the intended client flow and the relevant build/check passes.
