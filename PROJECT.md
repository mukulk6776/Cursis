# Project: Cursis Enterprise Autonomous Workspace

## Architecture
- **Framework**: Next.js 16.3.2 (App Router), React 19.3.0, TypeScript 5, Tailwind CSS v4
- **Persistence & Identity**: MongoDB native driver (`mongodb` v7.6.0), Firebase Client & Admin SDK (`jose` for JWT session tokens)
- **AI & Autonomous Engine**: Groq Cloud SDK (`llama-3.3-70b-versatile`), Ordis Intelligence Assistant (`lib/ordis/assistant.ts` and `workspace-actions.ts`)
- **Security & Tenancy**: Edge proxy (`proxy.ts`), HMAC-SHA256 session tokens, RBAC roles (`owner`, `admin`, `manager`, `member`, `viewer`), software-level MongoDB tenant isolation (`{ workspaceId }`)
- **Design System**: Cursis Neo-Brutalism (#FAF6EE architectural cream canvas, 3px solid #0A0A0A ink borders, 4px/6px/8px hard offset ink shadows, #FF5500 Electric Orange branding)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Multi-Tenant Query Scoping | Ensure all MongoDB queries across `crm.ts`, `documents.ts`, `meetings.ts`, `tasks.ts`, and `projects.ts` strictly enforce `{ workspaceId }` filtering. | M1 | Survey 2 |
| 2 | CRM Lead Tenant Overwrite Fix | Strip `workspaceId` from lead update payload and scope update query by `{ id, workspaceId }`. | M1 | Survey 2 |
| 3 | Ordis Approval Queue RBAC | Enforce `['owner', 'admin']` required roles on `app/api/ordis/approval-queue/[id]/route.ts`. | M1 | Survey 2 |
| 4 | Ordis External Action RBAC | Enforce `['owner', 'admin']` required roles on `app/api/ordis/external-action/route.ts`. | M1 | Survey 2 |
| 5 | Sanitized Error Disclosures | Replace raw `error.message` returns with structured `apiError` across the 6 identified routes. | M1 | Survey 2 |
| 6 | Configurable Sovereign Founder | Parameterize `SOVEREIGN_FOUNDER_EMAIL` via `process.env.SOVEREIGN_FOUNDER_EMAIL` with fallback. | M1 | Survey 2 |
| 7 | Secrets & Environment Hygiene | Prevent private credentials from leaking to client bundles and maintain HMAC token integrity. | M1 | Survey 2 |
| 8 | Comprehensive State Reset on Switch | Clear CRM deals/contacts, automations, API keys, webhooks, audit logs, employees, and invitations in `DashboardContext.tsx:switchWorkspace`. | M2 | Survey 3 |
| 9 | Session Cookie & Profile Workspace Sync | Sync active workspace switch to backend so session cookie and MongoDB profile retain correct active tenant. | M2 | Survey 3 |
| 10 | Orphaned Switcher Cleanup | Remove or wire dead `components/dashboard/WorkspaceSwitcher.tsx` to active layout. | M2 | Survey 3 |
| 11 | Team Capacity & Seat Limit Enforcement | Strictly enforce `MAX_TEAM_MEMBERS = 4` across database queries, APIs, and UI callouts. | M2 | Survey 3 |
| 12 | Team Invitation Lifecycle | Enforce 7-day TTL tokens, atomic claiming in MongoDB, and graceful unregistered user onboarding handling. | M2 | Survey 3 |
| 13 | Human-in-the-Loop Confirmation Gate | Require explicit user authorization and confirmation before executing state-mutating Ordis actions. | M3 | Survey 3 |
| 14 | Paid Tier Safety Policy | Prohibit paid workspace tier from automatically disabling `approvalRequiredForActions`. | M3 | Survey 3 |
| 15 | Persistent Audit Logging for Ordis | Connect all Ordis state mutations in `workspace-actions.ts` to `logAuditEvent()` in `lib/db/audit.ts`. | M3 | Survey 3 |
| 16 | Ground Auxiliary Ordis Endpoints | Replace static mock responses in `ambient-scan`, `audit`, `process-meeting`, `drafts`, `goal`, `risk-radar` with real MongoDB aggregations. | M3 | Survey 3 |
| 17 | Clean Task Presentation | Format Ordis task lists cleanly without raw IDs or squished markdown tables. | M3 | Survey 3 |
| 18 | Neo-Brutalist Token Unification | Standardize `#FAF6EE` canvas, canonical 3px solid `#0A0A0A` borders, and 4px/6px/8px hard offset shadows. | M4 | Survey 1 |
| 19 | Purge Legacy "Somba Blue" | Replace all ~80 instances of `#0f4cff` with Electric Orange (`#FF5500`) or designated semantic tokens. | M4 | Survey 1 |
| 20 | Component Neo-Brutalist Styling | Upgrade `.btn`, `.card`, `.stat-card`, `.modal`, and inputs to eliminate Gaussian blur and 1px borders. | M4 | Survey 1 |
| 21 | De-Mock Interactive Controls | Ground Natural Language automations, use server-generated crypto for webhooks, and pass real `user.id` to audit logs. | M4 | Survey 1 |
| 22 | Honest Empty States | Deploy clean Neo-Brutalist `<EmptyState />` for `TasksPage` (List & Calendar), `HomePage`, `MeetingsPage`, etc. | M4 | Survey 1 |
| 23 | E2E Test Suite 100% Pass (Tiers 1-4) | Execute and pass 100% of opaque-box requirement tests from `TEST_READY.md`. | M5 | Track E2E |
| 24 | Adversarial Coverage Hardening (Tier 5) | Perform white-box code path analysis and adversarial stress testing. | M5 | Track E2E |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Security & Multi-Tenant Isolation | Features 1-7: DB query scoping, lead hijacking fix, RBAC for Ordis approval queue/actions, error sanitization, founder parameterization. | none | DONE |
| M2 | Workspace State Consistency & Team Limits | Features 8-12: Full state reset on switch, session cookie/profile sync, orphaned component resolution, team seat limit enforcement. | M1 | DONE |
| M3 | Ordis Intelligence Grounding, Safety & Audit | Features 13-17: Human-in-the-loop confirmation, paid tier safety fix, audit log persistence, real DB aggregations for auxiliary routes. | M1, M2 | DONE |
| M4 | Neo-Brutalism Design System & De-Mocking | Features 18-22: Token unification (#FAF6EE, #0A0A0A, #FF5500), purge #0f4cff, button/card/modal styling, de-mock controls, honest empty states. | M1 | DONE |
| M5 | Final Milestone: 100% E2E Pass & Hardening | Features 23-24: Phase 1 (100% pass of Tiers 1-4 from TEST_READY.md) + Phase 2 (Tier 5 Adversarial Coverage Hardening). | M1, M2, M3, M4, TEST_READY.md | PLANNED |

## Interface Contracts

### M1 (Security & Tenancy) ↔ M2 (Workspace State)
- Workspace resolution contract: All database helper functions in `lib/db/*.ts` must accept an explicit `workspaceId: string` parameter and include `{ workspaceId }` in MongoDB query filters.
- Session contract: `app/api/auth/session/route.ts` and `lib/auth/session.ts` accept workspace update requests to refresh the active `workspaceId` in the session JWT.

### M2 (Workspace State) ↔ M3 (Ordis Intelligence)
- Active workspace context contract: Ordis tool calls in `lib/ordis/workspace-actions.ts` receive the verified `workspaceId` from the authenticated session and validate all target entity IDs against that workspace before execution.
- Confirmation contract: For any mutation where `requiresConfirmation: true`, Ordis returns an action payload `{ type: 'action_confirmation_required', actionId, operation, input, description }` to the client instead of executing immediately.

### M3 (Ordis Intelligence) ↔ M4 (UI/UX Design System)
- Action card presentation contract: Interactive confirmation prompts and task list cards generated by Ordis must use Cursis Neo-Brutalism tokens (`border: 3px solid #0A0A0A`, `box-shadow: 4px 4px 0px #0A0A0A`, `#FF5500` accent buttons).

## Code Layout
- `app/` — Next.js 16 App Router pages, dashboard views, and 34 API endpoints
- `components/dashboard/` — Authenticated workspace UI views, navigation, panels, modals
- `components/landing/` — Public marketing and presentation components
- `lib/db/` — MongoDB database access layer, schema types, query functions
- `lib/auth/` — Session management, RBAC verification, founder authorization
- `lib/ordis/` — Autonomous AI assistant pipeline, capabilities, workspace actions, safety filters
- `styles/` — Core CSS stylesheets (`variables.css`, `components.css`, `pages.css`, `layout.css`)
- `tests/` — Automated test suites (`tests/*.cjs` and `tests/browser/*.cjs`)
- `.agents/teamwork/` — Teamwork coordination metadata and agent workspaces ONLY (never source code)
