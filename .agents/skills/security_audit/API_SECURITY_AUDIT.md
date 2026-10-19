# API Security Audit

**Date:** 2026-10-13  
**Scope:** Static review of `api/src/`, Prisma schema, and existing API integration tests.  
**Execution:** Read-only source review. No application tests or commands were run. Findings are based on the checked-in implementation; no live deployment, infrastructure, or runtime configuration was inspected.

## Summary

The API has useful baseline controls: Helmet, restrictive configured CORS, JSON body limits, request throttling, Zod input validation, bcrypt password hashing, separate access and refresh JWT secrets, hashed refresh tokens at rest, and participant-scoped project queries. The highest risks are a public job detail route that exposes unpublished jobs, project-status updates that allow arbitrary transitions by either participant, and weak production safeguards for JWT secrets. The current test suite covers two broad workflows but leaves important authorization, token lifecycle, and state-transition properties without regression tests.

## Findings

### High — Unpublished job details are publicly readable

`GET /api/v1/jobs/:id` fetches a job by ID and returns its summary regardless of status or owner. The summary contains the full description, budget, client identity/profile, and skills. A guessed or leaked ID therefore exposes draft jobs and other non-public states (including jobs already in progress), even though the collection route only lists published jobs.

**Evidence:** [api/src/routes/jobs.routes.ts](/home/agb/PersonalTest/Archer/api/src/routes/jobs.routes.ts:66) queries by ID without a status or authenticated-owner predicate.

**Recommendation:** Return jobs publicly only when `PUBLISHED`; require authentication and owner authorization for drafts. Define visibility for in-progress/closed jobs explicitly. Add tests proving anonymous access to a draft is denied while published job detail remains public.

### High — Project status transitions have no transition policy

Any project participant can set any different status from the accepted enum. For example, a newly created `NOT_STARTED` project can be marked `COMPLETED` or `CANCELLED`, and a completed project can be moved back to `ACTIVE`. This bypasses the stated API responsibility for validating project state transitions and can corrupt lifecycle and completion timestamps.

**Evidence:** [api/src/routes/projects.routes.ts](/home/agb/PersonalTest/Archer/api/src/routes/projects.routes.ts:75) checks only that the requested status differs from the current status before writing it.

**Recommendation:** Specify allowed transitions and which participant may perform each one, enforce them server-side, and make terminal-state behavior explicit. Add tests for permitted and forbidden transitions, including attempts by both roles and repeated/concurrent requests.

### Medium — Production JWT secrets can be weak or reused

Configuration accepts secrets as short as 16 characters in every environment and does not reject equal access and refresh secrets. A short, guessable or reused production secret increases token-forgery risk and weakens the intended separation between token types.

**Evidence:** [api/src/config/env.ts](/home/agb/PersonalTest/Archer/api/src/config/env.ts:4) enforces only a 16-character minimum and has no production-specific checks.

**Recommendation:** Require independently generated high-entropy secrets in production and fail startup if the secrets are equal or below the chosen entropy/length policy. Keep test/development configuration convenient without weakening production startup requirements.

### Medium — Access tokens retain stale role and account status

Authorization middleware trusts the role embedded in the signed access token and does not reload the user or check current account status. Role changes or account deactivation therefore do not take effect until issued access tokens expire (15 minutes by default); logout revokes a refresh session but does not invalidate an already issued access token.

**Evidence:** [api/src/middleware/auth.ts](/home/agb/PersonalTest/Archer/api/src/middleware/auth.ts:22) accepts token claims directly; account status is checked during login only in [api/src/routes/auth.routes.ts](/home/agb/PersonalTest/Archer/api/src/routes/auth.routes.ts:77).

**Recommendation:** Decide and document the acceptable revocation window. For immediate deactivation/role-change enforcement, validate current user status/role or use a revocation/version mechanism during authentication. Add tests for deactivation, role change, and post-logout access-token behavior.

### Medium — Important security invariants lack focused regression tests

Only two integration tests are present. They cover registration validation, one role denial, proposal acceptance, duplicate proposals, and project participant visibility. They do not exercise draft-job confidentiality, authorization across all private resources, project/milestone transition rules, message/notification isolation, refresh rotation/replay/logout, invalid/expired/wrong-type tokens, account deactivation, or rate limiting.

**Evidence:** [api/tests/core-workflows.test.ts](/home/agb/PersonalTest/Archer/api/tests/core-workflows.test.ts:63) contains the current test cases.

**Recommendation:** Add focused API-level security tests for the behaviors above, prioritizing authorization boundaries and state-changing flows. Test user-visible security outcomes rather than every utility or unit.

### Low — Status-changing operations can race

Several handlers read current state, validate it, then update by ID without a conditional update or transaction-level state recheck. Concurrent requests may both pass the initial check; this is especially relevant for proposal acceptance and project status changes, where duplicate side effects or overwritten transitions would be undesirable. Unique constraints may stop some duplicate project creation, but the losing request can surface as an unhandled database error rather than a consistent conflict.

**Evidence:** proposal acceptance checks status before a transaction and then unconditionally updates in [api/src/routes/proposals.routes.ts](/home/agb/PersonalTest/Archer/api/src/routes/proposals.routes.ts:138); project status follows the same check-then-update pattern in [api/src/routes/projects.routes.ts](/home/agb/PersonalTest/Archer/api/src/routes/projects.routes.ts:75).

**Recommendation:** Recheck and conditionally claim the expected current state within the transaction; map uniqueness/conditional-update conflicts to stable API conflict responses. Add concurrency coverage for one-time acceptance and terminal transitions.

## Positive controls observed

- `helmet()` is enabled, `x-powered-by` is disabled, JSON bodies are limited to 1 MB, and CORS origins are configured explicitly in [api/src/app.ts](/home/agb/PersonalTest/Archer/api/src/app.ts:9).
- Registration/login inputs and most write payloads use Zod schemas; password hashes use bcrypt with cost 12 in [api/src/lib/auth.ts](/home/agb/PersonalTest/Archer/api/src/lib/auth.ts:1).
- Refresh tokens are stored as SHA-256 hashes; refresh and access token secrets are configured separately in [api/src/routes/auth.routes.ts](/home/agb/PersonalTest/Archer/api/src/routes/auth.routes.ts:37).
- Project and notification reads are generally scoped to the authenticated participant/user, and ORM response selections avoid returning password hashes.
- Generic unexpected-error responses do not include stack traces or raw exception messages in HTTP responses.

## Suggested test priorities

1. Draft and non-public job confidentiality, including owner access behavior.
2. Cross-user isolation for proposals, projects, messages, and notifications.
3. Allowed/denied project and milestone transitions and their side effects.
4. Refresh rotation, replay rejection, logout, and invalid token types/expiry.
5. One-time proposal acceptance under repeated or concurrent requests.

## Limitations

This is a source-level review, not a penetration test. It does not assess deployment TLS, proxy configuration, database file permissions/backups, secret storage, dependency vulnerabilities, operational monitoring, or whether the audited source matches a deployed build.
