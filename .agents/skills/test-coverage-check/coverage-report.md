# Test coverage findings

Review date: 2026-10-13  
Method: Static inspection of package scripts, source, and test files. No tests or coverage commands were run; runtime results are unknown.

## Summary

The API now has one Vitest integration suite covering a basic authentication/role check and a job-to-project acceptance workflow. The web and mobile packages have no test files or test scripts. This review makes no numeric coverage claim. Existing API tests have not been executed, so their behavior in this environment is unverified.

## Prioritized findings

### High — API authorization and state-transition edge cases

- **Behavior:** Private resource access and role restrictions across proposals, projects, messages, and mutations.
- **Why it matters:** These routes protect participant-only records and enforce who may perform consequential actions.
- **Evidence/gap:** `api/tests/core-workflows.test.ts` checks that a freelancer cannot create a client job and an outsider receives 404 for project detail. It does not cover access to another user's proposal, project messages, milestones, or unauthorized status changes.
- **Suggested tests:** Add focused cases for proposal detail/list ownership, message read/send access, milestone scoping, and project status changes by participants versus outsiders.

### High — API proposal acceptance invariants

- **Behavior:** Accepting a proposal creates one project and conversation, records the accepted amount/currency, moves the job to in-progress, and closes competing proposals.
- **Why it matters:** Acceptance is the central business transition and must leave related records consistent.
- **Evidence/gap:** `api/tests/core-workflows.test.ts` verifies the project amount/currency/status, conversation presence, and outsider denial. It does not assert job status, competing proposal status, duplicate acceptance behavior, or notification creation.
- **Suggested tests:** Extend the acceptance workflow to verify related state and reject repeated acceptance or acceptance by a non-owning client.

### Medium — API validation, currency, and session lifecycle

- **Behavior:** Validated integer amounts and supported currencies, duplicate account handling, login, refresh, and logout/session revocation.
- **Why it matters:** These rules protect stored money values and account/session integrity.
- **Evidence/gap:** The current suite checks malformed registration and duplicate proposal submission. It does not cover invalid job/proposal amounts or currencies, duplicate email registration, login failure, or refresh/logout lifecycle.
- **Suggested tests:** Add a compact set of boundary cases for amount/currency validation and refresh-token rotation/revocation.

### Medium — Web and mobile critical user flows

- **Behavior:** Sign in/register, create a job, submit a proposal, review/accept it, and reach the resulting project.
- **Why it matters:** Both clients are independently deployable interfaces; API coverage alone cannot catch broken navigation, request wiring, or visible error/loading states.
- **Evidence/gap:** No test files were found under `app/` or `mobile/`. Their package scripts expose build/lint/typecheck commands but no test script.
- **Suggested tests:** Start with a small client smoke suite around authentication and the role-specific job/proposal/project journey; include a representative API error state.

## Suggested next implementation slice

Extend the existing API integration test to assert all acceptance side effects and negative cases, then add participant-authorization checks for proposal and project messaging endpoints. After implementation, the owning agent can run the API suite and report execution results separately.
