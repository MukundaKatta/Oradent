# Módulo de Ortodontia Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/orthodontics/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase sampling (`packages/server/tests/*.test.ts`, `packages/web/src/**/*.test.ts`) - confirm before Execute. Guidelines found: none (no `AGENTS.md`/`CLAUDE.md`) - inferred from existing test samples instead of strong defaults.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------- | ---------------------- | ------------------- | ------------- |
| Prisma schema (enums, `OrthodonticCase`, `OrthodonticVisit`) | none | build gate only - schema has no branching logic to unit-test | `packages/server/prisma/schema.prisma` | `npx prisma generate && npm run type-check -w packages/server` |
| Route/query logic (`routes/orthodontics.ts`) | unit | All branches; 1:1 to ORTHO-01..07, 09; every listed edge case (cross-tenant 404, duplicate-active 409, non-active-case 409, invalid enum/date-order 400, `alignerStepNumber` guard 400, `nextVisitDate` guard 400, `cdtCode` range 400, invalid transition 400) - mirrors `tests/auditLog.test.ts` (mock `prisma`, assert `where` clause and branch taken) | `packages/server/tests/orthodontics.test.ts` | `npm test -w packages/server` |
| Reminder job (`jobs/orthodonticReminder.ts`) | unit | Query window logic covered (visit due / not due / case not `ACTIVE` excluded) - same mocking style as above | `packages/server/tests/orthodonticReminder.test.ts` | `npm test -w packages/server` |
| `auditMiddleware.ts` `PHI_ROUTES` extension | unit | New case added to the existing `parseAuditResource`/`shouldAudit` suite proving `/api/orthodontics/...` is recognized | `packages/server/tests/auditMiddleware.test.ts` (extend, do not replace) | `npm test -w packages/server` |
| Web hook/page (`useOrthodontics.ts`, `orthodontics/page.tsx`, visit form/timeline) | none | build gate only - repo has zero component/hook test infra (no `@testing-library/*` dependency anywhere in `packages/web`); introducing that infra is out of this feature's scope | `packages/web/src/hooks/useOrthodontics.ts`, `packages/web/src/app/(dashboard)/patients/[id]/orthodontics/page.tsx` | `npm run type-check -w packages/web && npm run lint -w packages/web` |

## Gate Check Commands

> Generated from `packages/server/package.json`, `packages/web/package.json`, `.github/workflows/ci.yml` - confirm before Execute.

| Gate Level | When to Use | Command |
| ----------- | ------------- | --------- |
| Quick | After a server task with only unit tests (no schema/route wiring change) | `npm test -w packages/server` |
| Full | After a task that changes schema, mounts a route, or touches middleware | `npx prisma generate && npm run type-check -w packages/server && npm test -w packages/server` |
| Build | After phase completion, or any web-only task | Server: `npm run build -w packages/server && npm run lint -w packages/server && npm test -w packages/server`. Web: `npm run type-check -w packages/web && npm run lint -w packages/web && npm run build -w packages/web` |

---

## Execution Plan

### Phase 1: Schema & Migration (Foundation)
```
T1 → T2 → T3
```

### Phase 2: Backend - Cases API
```
T4 → T5 → T6
```

### Phase 3: Backend - Visits API + Wiring
```
T7 → T8 → T9 → T10
```

### Phase 4: Audit + Reminder Job
```
T11 → T12
```

### Phase 5: Frontend
```
T13 → T14 → T15 → T16
```

---

## Task Breakdown

### Phase 1: Schema & Migration (Foundation)

### T1: Add `OrthodonticCase` model + enums to schema

**What**: Add `OrthodonticApplianceType`, `OrthodonticCaseStatus` enums and the `OrthodonticCase` model (fields per design.md) to `schema.prisma`, plus the inverse relation arrays on `Patient` and `Provider`.
**Where**: `packages/server/prisma/schema.prisma`
**Depends on**: None
**Reuses**: Same enum/model declaration style as `TreatmentPlanStatus`/`TreatmentPlan`
**Requirement**: ORTHO-01, ORTHO-02, ORTHO-03

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] Enums and model match design.md field-for-field
- [ ] `Patient.orthodonticCases` and `Provider.orthodonticCases` relation arrays added
- [ ] `npx prisma format` runs clean (no syntax error)

**Tests**: none
**Gate**: build
**Commit**: `feat(schema): add OrthodonticCase model and enums`

**Status**: ✅ Done

---

### T2: Add `OrthodonticVisit` model + Treatment/Appointment relations

**What**: Add the `OrthodonticVisit` model (fields per design.md) to `schema.prisma`, the inverse optional relation on `Treatment` (`orthodonticVisit`) and `Appointment` (`orthodonticVisits`).
**Where**: `packages/server/prisma/schema.prisma`
**Depends on**: T1
**Reuses**: Same 1:1-optional-FK pattern as `Treatment.invoiceId`
**Requirement**: ORTHO-04, ORTHO-05, ORTHO-07

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] `OrthodonticVisit` matches design.md field-for-field, including `@unique` on `treatmentId`
- [ ] `Treatment.orthodonticVisit` and `Appointment.orthodonticVisits` inverse relations added
- [ ] `npx prisma format` runs clean

**Tests**: none
**Gate**: build
**Commit**: `feat(schema): add OrthodonticVisit model and relations`

**Status**: ✅ Done

---

### T3: Generate the migration file

**What**: Generate the Prisma migration SQL for the two new tables/enums against a **disposable, local-only** Postgres container (never against `oradent-db-1`), then remove that container.
**Where**: `packages/server/prisma/migrations/<timestamp>_add_orthodontics/migration.sql`
**Depends on**: T2
**Reuses**: Naming convention of existing migrations (`YYYYMMDDHHMMSS_description`)
**Requirement**: ORTHO-01..09 (infra for all)

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] A temporary Postgres container is started on a non-conflicting local port (e.g. `docker run --rm -d -p 15432:5432 ...`), **not** the `oradent-db-1`/`5432` production container
- [ ] `DATABASE_URL` pointed at that temp container, `npx prisma migrate dev --create-only --name add_orthodontics` generates the SQL
- [ ] Generated SQL reviewed: only `CREATE TYPE`/`CREATE TABLE`/`CREATE INDEX`/`ALTER TABLE ... ADD CONSTRAINT` for the two new tables - no `DROP`/`ALTER COLUMN` touching existing tables
- [ ] Temp container removed
- [ ] `npx prisma generate` run against the checked-in migration (client codegen only, no DB connection needed for this step)

**Tests**: none
**Gate**: `npx prisma generate && npm run type-check -w packages/server`
**Commit**: `feat(schema): add orthodontics migration`

**Status**: ✅ Done

---

### Phase 2: Backend - Cases API

### T4: `POST /api/orthodontics/cases`

**What**: Create `routes/orthodontics.ts` with `router.use(authenticate)` and the case-creation endpoint, enforcing tenant scoping, the single-active-case rule, and field validation.
**Where**: `packages/server/src/routes/orthodontics.ts`
**Depends on**: T3
**Reuses**: Zod + `authenticate` + `practiceId`-scoped-`findFirst` pattern from `treatments.ts`
**Requirement**: ORTHO-01, ORTHO-02, ORTHO-03

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] AC1 (create + 201), AC2 (cross-tenant patient → 404), AC3 (duplicate active case → 409), AC4 (invalid `applianceType` → 400), AC5 (`estimatedEndDate` < `startDate` → 400) all implemented
- [ ] Router not yet mounted in `index.ts` (that's T10) - file is self-contained and importable for the test

**Tests**: unit - one test per AC above (5 tests minimum), mocking `prisma` per the matrix
**Gate**: quick
**Commit**: `feat(orthodontics): add POST /cases endpoint`

**Status**: ✅ Done

---

### T5: `GET /api/orthodontics/cases/:patientId`

**What**: Add the list-cases-by-patient endpoint to the same router.
**Where**: `packages/server/src/routes/orthodontics.ts`
**Depends on**: T4
**Reuses**: Same file, same tenant-scoping pattern
**Requirement**: ORTHO-06

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] Returns cases scoped to `practiceId`, both active and historical
- [ ] Cross-tenant `patientId` → empty list or 404 per the same convention as T4 (404, for consistency with the rest of the file)

**Tests**: unit - happy path + cross-tenant scoping test
**Gate**: quick
**Commit**: `feat(orthodontics): add GET /cases/:patientId endpoint`

**Status**: ✅ Done

---

### T6: `PATCH /api/orthodontics/cases/:caseId`

**What**: Add the case-status-transition endpoint with the closed transition table from design.md.
**Where**: `packages/server/src/routes/orthodontics.ts`
**Depends on**: T5
**Reuses**: Same file
**Requirement**: ORTHO-09

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] AC1 (valid transitions `ACTIVE→RETENTION`, `ACTIVE→COMPLETED`, `ACTIVE→DISCONTINUED`, `RETENTION→COMPLETED` → 200) implemented
- [ ] AC2 (any other transition, e.g. `COMPLETED→ACTIVE` → 400) implemented
- [ ] Cross-tenant `caseId` → 404

**Tests**: unit - one test per valid transition + one for an invalid transition + cross-tenant test
**Gate**: full (phase-completing schema+route surface before moving to visits)
**Commit**: `feat(orthodontics): add PATCH /cases/:id status transitions`

**Status**: ✅ Done

---

### Phase 3: Backend - Visits API + Wiring

### T7: `POST /api/orthodontics/cases/:caseId/visits` (core fields + guards)

**What**: Add the visit-creation endpoint covering the core fields and all guard conditions except the optional `Treatment` creation (that's T8).
**Where**: `packages/server/src/routes/orthodontics.ts`
**Depends on**: T6
**Reuses**: Same file; conflict/guard pattern from `appointments.ts` PUT `/:id`
**Requirement**: ORTHO-04, ORTHO-05

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] AC1 (create + 201) implemented
- [ ] AC2 (`caseId` cross-tenant/missing → 404)
- [ ] AC3 (case not `ACTIVE` → 409)
- [ ] AC4 (`appointmentId` cross-patient/cross-tenant → 404)
- [ ] AC5 (`alignerStepNumber` on non-`ALIGNER` case → 400)
- [ ] AC6 (`nextVisitDate` in the past → 400)

**Tests**: unit - one test per AC (6 tests minimum)
**Gate**: quick
**Commit**: `feat(orthodontics): add POST visits endpoint with guards`

---

### T8: Optional `Treatment` creation on visit (billing integration)

**What**: Extend the T7 endpoint so a request carrying `cdtCode`+`fee` creates a linked `Treatment` in the same Prisma transaction as the visit.
**Where**: `packages/server/src/routes/orthodontics.ts`
**Depends on**: T7
**Reuses**: `prisma.$transaction` pattern from `appointments.ts:245-270`; `billingCalc.ts` D8xxx mapping (no changes needed there)
**Requirement**: ORTHO-07

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] AC1 (`cdtCode`+`fee` present → `Treatment` created, linked via `treatmentId`)
- [ ] AC2 (`cdtCode` outside `D8000`-`D8999` → 400)
- [ ] AC3 (neither field present → visit created without `Treatment`)
- [ ] AC8 from the visits story (transaction: forced `Treatment` failure → visit also not persisted) - test by mocking `prisma.treatment.create` to reject and asserting `prisma.orthodonticVisit.create` was never durably committed (transaction rollback)

**Tests**: unit - 4 tests above
**Gate**: quick
**Commit**: `feat(orthodontics): link optional Treatment to visit creation`

---

### T9: `GET /api/orthodontics/cases/:caseId/visits`

**What**: Add the list-visits-by-case endpoint.
**Where**: `packages/server/src/routes/orthodontics.ts`
**Depends on**: T8
**Reuses**: Same file
**Requirement**: ORTHO-06

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] Returns visits ordered by `date` descending
- [ ] Cross-tenant `caseId` → 404

**Tests**: unit - happy path (order) + cross-tenant test
**Gate**: quick
**Commit**: `feat(orthodontics): add GET visits endpoint`

---

### T10: Mount the orthodontics router

**What**: Import and mount `orthodonticsRouter` at `/api/orthodontics` in the Express app.
**Where**: `packages/server/src/index.ts`
**Depends on**: T9
**Reuses**: Same `app.use('/api/...', ...)` pattern as every other router
**Requirement**: ORTHO-01..09 (makes the router reachable)

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] `app.use('/api/orthodontics', orthodonticsRouter)` added in the same block as the other route mounts
- [ ] Server boots without error (`npm run build -w packages/server` + manual `npm run dev -w packages/server` smoke check)

**Tests**: none (wiring only, exercised end-to-end by T11's audit test and manual smoke check)
**Gate**: full
**Commit**: `feat(orthodontics): mount router in app`

---

### Phase 4: Audit + Reminder Job

### T11: Add `/api/orthodontics` to `PHI_ROUTES`

**What**: Add `'/api/orthodontics'` to the `PHI_ROUTES` array so all writes are audit-logged automatically, and extend the existing test suite to cover it.
**Where**: `packages/server/src/middleware/auditMiddleware.ts`
**Depends on**: T10
**Reuses**: Existing `PHI_ROUTES` mechanism - no new logic
**Requirement**: (Implicit-Requirement Dimension: Observability, spec.md sweep table)

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] `'/api/orthodontics'` added to the `PHI_ROUTES` array
- [ ] `packages/server/tests/auditMiddleware.test.ts` extended with a case proving `/api/orthodontics/cases/<cuid>` is recognized (mirrors the existing `/api/dental-chart` case)

**Tests**: unit - extend existing suite (1 new test case)
**Gate**: quick
**Commit**: `feat(orthodontics): audit-log orthodontics writes as PHI`

---

### T12: Reminder job

**What**: Create the cron job scanning `OrthodonticVisit.nextVisitDate` within the `reminderHoursBefore` window for `ACTIVE` cases, logging only (no send), and register it in `index.ts`.
**Where**: `packages/server/src/jobs/orthodonticReminder.ts` (new) + `packages/server/src/index.ts` (register, one line)
**Depends on**: T11
**Reuses**: `appointmentReminder.ts` structure (cron schedule, window query, `logger.info`)
**Requirement**: ORTHO-08

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] `startOrthodonticReminders()` exported and registered alongside the other `start*` calls in `index.ts`
- [ ] Query correctly excludes visits whose case is not `ACTIVE`
- [ ] AC2 (no real send - only `logger.info`) verified by absence of any email/SMS call

**Tests**: unit - due / not-due / non-active-case-excluded (3 tests minimum)
**Gate**: full (registers in `index.ts`, phase-completing)
**Commit**: `feat(orthodontics): add reminder job for upcoming visits`

---

### Phase 5: Frontend

### T13: `useOrthodontics.ts` hook

**What**: React Query hooks for cases (list, create, patch status) and visits (list, create) against the new endpoints.
**Where**: `packages/web/src/hooks/useOrthodontics.ts`
**Depends on**: T12
**Reuses**: `useTreatments.ts` structure
**Requirement**: ORTHO-01, 04, 06, 09 (frontend data layer)

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] Hook exports mirror `useTreatments.ts` naming conventions
- [ ] `npm run type-check -w packages/web` passes

**Tests**: none (per matrix)
**Gate**: build
**Commit**: `feat(web): add useOrthodontics hook`

---

### T14: Orthodontics patient tab - case list + open-case form

**What**: New page listing a patient's orthodontic cases with a form to open a new case.
**Where**: `packages/web/src/app/(dashboard)/patients/[id]/orthodontics/page.tsx`
**Depends on**: T13
**Reuses**: Structure of `patients/[id]/treatments/page.tsx`; i18n `ptBR`
**Requirement**: ORTHO-01, ORTHO-06

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] Page renders case list + open-case form using T13's hook
- [ ] Follows existing page's loading/empty/error state conventions
- [ ] `npm run type-check -w packages/web && npm run lint -w packages/web` pass

**Tests**: none (per matrix)
**Gate**: build
**Commit**: `feat(web): add orthodontics case page`

---

### T15: Visit form + timeline

**What**: Component to register a maintenance visit (with the optional billing fields) and a timeline listing visits for a case, adapted from `TreatmentTimeline.tsx`.
**Where**: `packages/web/src/components/orthodontics/OrthodonticVisitTimeline.tsx` (new), wired into T14's page
**Depends on**: T14
**Reuses**: `TreatmentTimeline.tsx` visual structure
**Requirement**: ORTHO-04, ORTHO-06, ORTHO-07

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] Visit form fields match `OrthodonticVisit` (T2), including conditional `alignerStepNumber` field only for `ALIGNER` cases
- [ ] Timeline lists visits newest-first, matching T9's ordering
- [ ] `npm run type-check -w packages/web && npm run lint -w packages/web` pass

**Tests**: none (per matrix)
**Gate**: build
**Commit**: `feat(web): add orthodontic visit form and timeline`

---

### T16: Add "Ortodontia" tab to patient navigation

**What**: Add the new page to the patient's tab navigation, alongside `chart`/`history`/`billing`/`imaging`/`treatments`.
**Where**: patient layout/nav component (wherever the existing tab list is defined - identify at task start by grepping for the `treatments` tab entry)
**Depends on**: T15
**Reuses**: Existing tab-list pattern
**Requirement**: ORTHO-01..09 (discoverability)

**Tools**: MCP: NONE / Skill: NONE

**Done when**:
- [ ] "Ortodontia" tab visible and navigates to T14's page
- [ ] `npm run type-check -w packages/web && npm run lint -w packages/web && npm run build -w packages/web` all pass

**Tests**: none (per matrix)
**Gate**: build
**Commit**: `feat(web): add orthodontics tab to patient navigation`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1 ------→ T2 ------→ T3
Phase 2:  T4 ------→ T5 ------→ T6
Phase 3:  T7 ------→ T8 ------→ T9 ------→ T10
Phase 4:  T11 -----→ T12
Phase 5:  T13 -----→ T14 -----→ T15 -----→ T16
```

Execution is strictly sequential - there is no intra-phase parallelism.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ------- | -------- |
| T1 | 1 file (schema additions) | ✅ Granular |
| T2 | 1 file (schema additions) | ✅ Granular |
| T3 | 1 migration file | ✅ Granular |
| T4 | 1 endpoint | ✅ Granular |
| T5 | 1 endpoint | ✅ Granular |
| T6 | 1 endpoint | ✅ Granular |
| T7 | 1 endpoint (guards) | ✅ Granular |
| T8 | 1 endpoint extension (billing) | ✅ Granular |
| T9 | 1 endpoint | ✅ Granular |
| T10 | 1 file (mount) | ✅ Granular |
| T11 | 1 file (constant + test) | ✅ Granular |
| T12 | 1 job file + 1-line registration | ✅ Granular (registration is trivial, not a second deliverable) |
| T13 | 1 hook file | ✅ Granular |
| T14 | 1 page file | ✅ Granular |
| T15 | 1 component file | ✅ Granular |
| T16 | 1 nav change | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ------------------------ | ---------------- | -------- |
| T1 | None | (start of Phase 1) | ✅ Match |
| T2 | T1 | T1→T2 | ✅ Match |
| T3 | T2 | T2→T3 | ✅ Match |
| T4 | T3 | T3→T4 (Phase 1→Phase 2) | ✅ Match |
| T5 | T4 | T4→T5 | ✅ Match |
| T6 | T5 | T5→T6 | ✅ Match |
| T7 | T6 | T6→T7 (Phase 2→Phase 3) | ✅ Match |
| T8 | T7 | T7→T8 | ✅ Match |
| T9 | T8 | T8→T9 | ✅ Match |
| T10 | T9 | T9→T10 | ✅ Match |
| T11 | T10 | T10→T11 (Phase 3→Phase 4) | ✅ Match |
| T12 | T11 | T11→T12 | ✅ Match |
| T13 | T12 | T12→T13 (Phase 4→Phase 5) | ✅ Match |
| T14 | T13 | T13→T14 | ✅ Match |
| T15 | T14 | T14→T15 | ✅ Match |
| T16 | T15 | T15→T16 | ✅ Match |

No forward-phase dependency (every task depends only on the immediately preceding task, none point ahead).

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | ------------------------------ | ------------------ | ----------- | -------- |
| T1 | Prisma schema | none | none | ✅ OK |
| T2 | Prisma schema | none | none | ✅ OK |
| T3 | Prisma migration | none | none | ✅ OK |
| T4 | Route/query logic | unit | unit (5 tests) | ✅ OK |
| T5 | Route/query logic | unit | unit (2 tests) | ✅ OK |
| T6 | Route/query logic | unit | unit (3 tests) | ✅ OK |
| T7 | Route/query logic | unit | unit (6 tests) | ✅ OK |
| T8 | Route/query logic | unit | unit (4 tests) | ✅ OK |
| T9 | Route/query logic | unit | unit (2 tests) | ✅ OK |
| T10 | Route wiring (index.ts) | not a matrix layer (pure wiring, no branching) | none | ✅ OK |
| T11 | `auditMiddleware.ts` | unit | unit (1 test, extends suite) | ✅ OK |
| T12 | Reminder job | unit | unit (3 tests) | ✅ OK |
| T13 | Web hook | none | none | ✅ OK |
| T14 | Web page | none | none | ✅ OK |
| T15 | Web component | none | none | ✅ OK |
| T16 | Web nav | none | none | ✅ OK |

No violations. `Tests: none` is only used where the matrix says `none` for that layer.
