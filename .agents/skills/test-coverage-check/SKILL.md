---
name: test-coverage-check
description: Inspect a project's existing tests and identify important untested behavior; write a prioritized findings report without changing tests or running them.
---

# Test coverage check

Use this skill when asked to assess meaningful test coverage or recommend where tests should be added. The deliverable is a report for an implementation agent to act on.

## Boundaries

- Inspect source, test files, package scripts, and project documentation with read-only tools.
- Do not create, edit, or delete test code. Do not implement any recommendation.
- Do not run tests, builds, coverage commands, or other project commands that execute application code. Static file inspection is sufficient.
- Write or refresh only `test-coverage-check/coverage-report.md` for the coverage findings. Do not change project configuration or other documentation.
- Do not claim numeric coverage unless an existing coverage artifact can be inspected without running anything. Distinguish inspected facts from recommendations and note when test execution status is unknown.

## Check and report

Inspect the repository layout, package-level test scripts, existing test files, and the important user workflows and business rules documented or implemented in the project. Group findings by independently deployable package or meaningful system boundary.

Recommend a small set of tests around high-impact behavior: permissions and private data, state transitions, validation and errors, money or other domain invariants, and essential end-to-end client workflows. Skip exhaustive unit-test inventories and avoid recommending tests for every component. Mark a behavior covered only when an existing test clearly exercises it; distinguish direct assertions from incidental passage through a workflow.

Write a concise Markdown report to `test-coverage-check/coverage-report.md`. Include:

- review date and whether tests or coverage commands were executed (they should not be);
- a short coverage summary that does not invent percentages;
- prioritized, actionable findings with package, behavior, reason for importance, and existing test evidence or gap;
- a suggested next test slice an implementation agent can pick up.

Use repository-relative file paths and line numbers when available. Keep recommendations focused on behavior that can fail in a meaningful way.
