---
title: Security + Maintainability Task Plan
scope: hanabi-ts
last_updated: 2025-12-22
---

# Task Plan

This document breaks security and maintainability improvements into discrete,
trackable tasks with clear acceptance criteria.

## Task List

T1 - CI quality gate (lint/typecheck/build)
- Status: Done
- Priority: High
- Owner: Core
- Scope: Add a CI workflow that runs on PRs and pushes.
- Acceptance:
  - `npm run lint` passes in CI.
  - `npm run typecheck` passes in CI.
  - `npm run build` passes in CI.

T2 - Automated dependency updates (Dependabot)
- Status: Done
- Priority: High
- Owner: Core
- Scope: Configure Dependabot for npm and GitHub Actions.
- Acceptance:
  - Weekly update PRs for npm dependencies and actions.

T3 - Static security scanning (CodeQL)
- Status: Done
- Priority: High
- Owner: Core
- Scope: Add a CodeQL workflow for JavaScript/TypeScript.
- Acceptance:
  - CodeQL analysis runs on push and on a weekly schedule.

T4 - Security policy
- Status: Done
- Priority: High
- Owner: Core
- Scope: Add `SECURITY.md` with a clear reporting path.
- Acceptance:
  - Security policy is present at repo root.

T5 - Contribution guide
- Status: Done
- Priority: Medium
- Owner: Core
- Scope: Add `CONTRIBUTING.md` with local setup and PR expectations.
- Acceptance:
  - New contributors can run lint/build from docs alone.

T6 - Test harness foundation
- Status: Done
- Priority: Medium
- Owner: Core
- Scope: Add Vitest + first unit tests for `audio/` and `choreography/`.
- Acceptance:
  - `npm run test` exists and runs at least 3 unit tests.

T7 - Audio input validation and resource cleanup
- Status: Done
- Priority: Medium
- Owner: Core
- Scope: Validate file size/type/duration and release resources.
- Acceptance:
  - Rejects unsupported types or size with user feedback.
  - `URL.revokeObjectURL()` and `AudioContext.close()` paths exist.

T8 - Tuning configuration extraction
- Status: Done
- Priority: Medium
- Owner: Core
- Scope: Move hard-coded thresholds into a single config module.
- Acceptance:
  - All current thresholds load from `src/config/tuning.ts`.

T9 - CSP baseline
- Status: Planned
- Priority: Low
- Owner: Core
- Scope: Add a minimal CSP via meta tag for GitHub Pages.
- Acceptance:
  - `index.html` includes a CSP meta tag that allows required assets.

T10 - Diagnostics toggle
- Status: Done
- Priority: Low
- Owner: Core
- Scope: Add a debug flag for logging/perf stats.
- Acceptance:
  - Logs are guarded behind a single toggle.

## Execution Order

1. T1
2. T2
3. T3
4. T4
5. T5
6. T6
7. T7
8. T8
9. T9
10. T10
