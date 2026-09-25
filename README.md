<div align="center">

<img src="public/assets/logo.svg" alt="Cursis Logo" width="100" height="100" />

# Cursis

### Autonomous AI Workplace & Agency Operating System

[![Release](https://img.shields.io/badge/Release-v1.0.0--Enterprise-0f4cff?style=for-the-badge&logo=rocket)](https://github.com/mukulk6776/Cursis/releases)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-00d8ff?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x--Strict-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Security](https://img.shields.io/badge/Security-Edge%20WAF%20Shielded-brightgreen?style=for-the-badge&logo=shield)](SECURITY.md)
[![SLA](https://img.shields.io/badge/SLA-99.99%25%20Uptime-success?style=for-the-badge)](https://cursis.in)
[![CI Pipeline](https://img.shields.io/badge/CI%2FCD-Passing-brightgreen?style=for-the-badge&logo=githubactions)](https://github.com/mukulk6776/Cursis/actions)
[![License](https://img.shields.io/badge/License-Commercial%20Enterprise-blue?style=for-the-badge)](LICENSE)

<p align="center">
  <strong>Cursis</strong> is an institutional-grade, zero-subscription-lock autonomous workplace operating system engineered for founders, high-growth enterprise teams, and digital agency deployments.
</p>

<p align="center">
  <a href="https://cursis.in"><strong>Explore Live Platform »</strong></a>
  &nbsp;&bull;&nbsp;
  <a href="#-system-architecture"><strong>Architecture</strong></a>
  &nbsp;&bull;&nbsp;
  <a href="#-enterprise-capabilities"><strong>Key Capabilities</strong></a>
  &nbsp;&bull;&nbsp;
  <a href="#-quickstart--local-development"><strong>Quickstart</strong></a>
  &nbsp;&bull;&nbsp;
  <a href="#-enterprise-production-deployment"><strong>Deployment</strong></a>
  &nbsp;&bull;&nbsp;
  <a href="SECURITY.md"><strong>Security Policy</strong></a>
</p>

</div>

---

## 📌 Executive Overview

Modern enterprises spend thousands of dollars per employee monthly on fragmented SaaS tools—juggling separate subscriptions for task trackers, CRM pipelines, document automation, video conferencing, calendar schedulers, and AI wrappers. 

**Cursis replaces fragmented SaaS stacks with a unified, private, autonomous operating fabric:**

| Capability | Legacy SaaS Fragmented Model | Cursis Autonomous OS |
| :--- | :--- | :--- |
| **Operational Intelligence** | Generic external chatbots with no context | **ORDIS AI Core**: Multi-model autonomous execution engine |
| **Workspace Architecture** | Siloed billing per seat across 6+ apps | **Unified Multi-Tenant Fabric**: Zero-subscription lock-in |
| **Legal & Paperwork** | Third-party e-signature with vendor lock-in | **Integrated Studio**: Automated intake, OCR, and PDF compilation |
| **Access Governance** | Fragmented IAM and manual permission drift | **Enterprise RBAC**: Role-based isolation (Owner, Admin, Manager, Member, Viewer) |
| **Edge Protection** | Exposed public origin endpoints | **Next.js 16 Edge Proxy WAF**: Strict anti-traversal and signed session shields |
| **Data Sovereignty** | Proprietary vendor cloud storage lock-in | **Sovereign Mesh**: Local In-Memory + MongoDB Atlas + Firebase Vault |

---

## 🏛️ System Architecture

Cursis is architected as a high-throughput, edge-shielded distributed web application with deep asynchronous multi-model AI orchestration.

```
                           +----------------------------------------+
                           |       Enterprise Client Browser        |
                           |  (React 19, Tailwind v4, Somba System)  |
                           +----------------------------------------+
                                               |
                                    HTTPS / TLS 1.3 Strict
                                               v
+===================================================================================+
|                        NEXT.JS 16 EDGE PROXY WAF (proxy.ts)                       |
|  - Anti-Traversal Guard (..)             - Null-Byte Probe Mitigation (%00)       |
|  - Script Injection Shield (<script)     - Signed HTTP-Only Session Verification  |
|  - HSTS Preload & Strict CSP v3 Directives                                        |
+===================================================================================+
                                               |
                         +---------------------+---------------------+
                         |                                           |
                         v                                           v
+------------------------------------+      +---------------------------------------+
|    Client Presentation Layer       |      |     Serverless API Route Handlers     |
| - App Router Layouts (/dashboard)  |      | - 40+ Domain-Driven REST Endpoints    |
| - 13 Dedicated Production Views    |      | - Standardized JSON Error Formatters  |
| - Real-time SSE State Synchronization     | - Granular RBAC Permission Matrix     |
+------------------------------------+      +---------------------------------------+
                         |                                           |
                         +---------------------+---------------------+
                                               |
                                               v
+===================================================================================+
|                      ORDIS OPERATIONAL AI ENGINE (lib/ordis/)                     |
|  +-------------------------------------+   +------------------------------------+ |
|  |     Groq LLaMA 3.3 70B Engine       |   |       Google Gemini 2.5 Flash      | |
|  |  Sub-100ms Deterministic Execution  |   |    Multimodal & Paperwork Studio   | |
|  +-------------------------------------+   +------------------------------------+ |
|  - 14-Tool Action Loop with Circuit-Breaker Safety Protocol                       |
|  - Multi-Step Rollback Receipts & Idempotent Mutation Guards                      |
|  - Human-in-the-Loop Risk Radar & Simulation Sandbox                              |
+===================================================================================+
                                               |
                                               v
+===================================================================================+
|                         ENTERPRISE DATA & IDENTITY MESH                           |
|  +--------------------+   +-----------------------+   +-------------------------+ |
|  |  Firebase Auth &   |   |   MongoDB Atlas Core  |   |   Resend Transactional  | |
|  |  Storage Vault     |   |   Persistence Mesh    |   |   Communications Grid   | |
|  +--------------------+   +-----------------------+   +-------------------------+ |
+===================================================================================+
```

---

## ⚡ Enterprise Capabilities

### 1. 🧠 ORDIS Autonomous Operational Engine
- **Dual-Model Reasoning**: Employs **Groq LLaMA 3.3 70B** for ultra-fast, deterministic tool calling and workflow execution, combined with **Google Gemini 2.5 Flash** for deep multimodal document comprehension and semantic synthesis.
- **Deterministic Action Loop**: Executes up to 14 verified platform actions (creating tasks, inviting team members, generating legal agreements, dispatching department notifications) with pre-execution safety audits.
- **Rollback Receipts**: Every system state mutation generates a cryptographic execution receipt, allowing full rollback tracking and preventing duplicate mutations across network reconnects.

### 2. 🏢 Multi-Tenant Workspaces & Role Governance
- **Sovereign Founder Privileges**: Full root authority reserved for verified organization founders with immutable owner controls.
- **Strict Role Hierarchy**: Complete matrix enforcement across `owner`, `admin`, `manager`, `member`, and `viewer` roles.
- **Tenant Isolation**: Strict logical separation across client workspaces, ensuring zero cross-tenant data leakage.
- **Capacity Governance**: Enforces real-time workspace seat limits (up to 10 members per workspace) with atomic reservation checks on pending invitations.

### 3. 📄 Smart Paperwork & Legal Automation Studio
- **Automated Intake & Extraction**: Digitizes client intake forms and automatically extracts critical business clauses.
- **Automated Contract Generation**: Compiles compliant NDAs, Master Service Agreements (MSAs), and Statements of Work (SOWs) dynamically.
- **5MB File Size Cap & Upload Validation**: Strict server-side and client-side payload validation preventing memory exhaustion and denial-of-service vectors.

### 4. 🛡️ Zero-Trust Edge Security & Proxy WAF
- **Edge Request Interception**: Powered by Next.js 16 `proxy.ts`, inspecting inbound HTTP requests before executing application logic.
- **Attack Probe Filtering**: Blocks path traversal attacks (`..`), null-byte injections (`%00`), XSS probes (`<script`), and system credential harvesting (`win.ini`, `etc/passwd`).
- **Cryptographic Session Cookies**: `cursis_session` cookies are signed, strictly HTTP-only, and automatically invalidated upon logout or payload tampering.

### 5. 📅 High-Velocity Collaboration & Smart Scheduling
- **Smart Slot Detection**: Algorithmic calendar slot discovery to schedule team syncs and client demonstrations without calendar conflicts.
- **Real-Time Event Mesh**: Server-Sent Events (SSE) provide live updates for task updates, notifications, and team velocity changes.
- **Integrated Video Spaces**: Virtual meeting rooms with automated audio-to-notes AI post-processing.

---

## 📂 Repository Tour

```
Cursis/
├── .github/                      # Enterprise CI/CD & Community Templates
│   ├── ISSUE_TEMPLATE/           # Structured bug report & feature request forms
│   ├── workflows/ci.yml          # GitHub Actions CI pipeline (Lint, Typecheck, Test, Build)
│   ├── dependabot.yml            # Automated weekly dependency audit
│   └── PULL_REQUEST_TEMPLATE.md  # Standardized pull request review checklist
│
├── app/                          # Next.js 16 App Router
│   ├── api/                      # 40+ Enterprise REST Route Handlers
│   │   ├── agency/               # Solutions catalog & request build pipelines
│   │   ├── auth/                 # Session verification & Firebase token exchange
│   │   ├── automations/          # Webhook triggers & sequence executions
│   │   ├── calendar/             # Smart slot algorithms & event management
│   │   ├── crm/                  # Deal pipelines, contacts, and renewal tracking
│   │   ├── dashboards/           # Real-time health scores & velocity statistics
│   │   ├── documents/            # Legal generation, OCR parsing & 5MB cap guards
│   │   ├── ordis/                # Operational AI engine, risk radar & brain routes
│   │   ├── security/             # Audit logging & transaction rollback endpoints
│   │   └── workspaces/           # Multi-tenant switching & invitation lifecycle
│   ├── dashboard/                # Authenticated enterprise workplace interface
│   ├── login/ & signup/          # High-security authentication flows
│   ├── layout.tsx                # Enterprise root layout with SEO & metadata
│   └── page.tsx                  # Public enterprise landing page
│
├── components/                   # Modular React 19 Component Architecture
│   ├── dashboard/                # Operational workplace views & control panels
│   │   ├── modals/               # High-security modal dialogs (Doc, Invite, Task, etc.)
│   │   ├── pages/                # 13 Dedicated Production Subsystem Views
│   │   ├── panels/               # Command palette, notification feed, profile
│   │   └── Sidebar.tsx & Topbar  # Ergonomic workspace navigation
│   └── landing/                  # Neo-Brutalist marketing and presentation blocks
│
├── lib/                          # Core Domain Engines & Business Logic
│   ├── auth/                     # Session token validation, RBAC, Firebase Admin
│   ├── db/                       # MongoDB Atlas models & in-memory state fallback
│   ├── dashboard/                # Global DashboardContext state provider
│   └── ordis/                    # Dual-engine LLM router, tool definitions, safety
│
├── proxy.ts                      # Next.js 16 Edge Proxy & Security WAF
├── tests/                        # Automated regression and integration test suites
├── public/                       # Optimized SVG vectors, brand assets, and icons
├── styles/                       # Somba Design System CSS tokens & animations
├── CONTRIBUTING.md               # Developer standards & branch conventions
├── SECURITY.md                   # Enterprise vulnerability disclosure policy
├── CODE_OF_CONDUCT.md            # Contributor Covenant v2.1
├── LICENSE                       # Cursis Commercial Enterprise License
└── package.json                  # Workspace manifest & verified scripts
```

---

## 🚀 Quickstart & Local Development

### Prerequisites
- **Node.js**: `20.x` or `22.x` LTS
- **npm**: `10.x` or higher
- **Git**: `2.40+`

### 1. Clone & Install
```bash
# Clone the enterprise repository
git clone https://github.com/mukulk6776/Cursis.git
cd Cursis

# Install dependencies with locked integrity
npm ci
```

### 2. Configure Environment Variables
```bash
cp .env.example .env.local
```
Fill in your configuration variables in `.env.local` (see [Configuration Matrix](#-configuration-matrix)).

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Quality Assurance & Test Verification

Cursis maintains a zero-tolerance policy for broken builds and regressions. All test suites must execute cleanly before merging:

```bash
# Run ESLint quality and code smell audits
npm run lint

# Verify strict TypeScript type compliance (0 errors allowed)
npm run typecheck

# Execute integration & regression test suites
npm test

# Verify production build compilation
npm run build
```

---

## 🌐 Enterprise Production Deployment

### Option 1: Vercel Serverless (Recommended)
Cursis is optimized for zero-configuration deployment on Vercel:
1. Import the repository into the **Vercel Dashboard**.
2. Configure environment variables matching `.env.example`.
3. Vercel automatically deploys the Next.js 16 App Router and Edge Proxy with global CDN acceleration.

### Option 2: Self-Hosted Docker Container
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## ⚙️ Configuration Matrix

| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime execution mode (`development` / `production`) | Yes | `development` |
| `NEXT_PUBLIC_APP_URL` | Canonical public origin URL | Yes | `http://localhost:3000` |
| `AUTH_SESSION_SECRET` | Cryptographic secret for signing HTTP-only session cookies | **Critical** | — |
| `MONGODB_URI` | MongoDB Atlas cluster connection URI | Yes | — |
| `MONGODB_DB_NAME` | Primary database name | Yes | `cursis` |
| `NEXT_PUBLIC_FIREBASE_*` | Client Firebase credentials (API Key, Project ID, etc.) | Yes | — |
| `FIREBASE_ADMIN_*` | Server-side Firebase Admin Service Account credentials | Yes | — |
| `GROQ_API_KEY` | Groq Cloud API Key for LLaMA 3.3 70B ORDIS reasoning | Optional | In-memory fallback |
| `GEMINI_API_KEY` | Google Gemini API Key for deep multimodal analysis | Optional | In-memory fallback |
| `RESEND_API_KEY` | Resend API key for transactional emails and alerts | Optional | Simulated dispatch |

---

## 🔒 Security, Compliance & Governance

- **Edge WAF Protection**: Proactive blocking of directory traversal, script execution, and null-byte injection via `proxy.ts`.
- **SOC 2 Type II Aligned**: Strict auditing of data access, session invalidation, and role boundaries.
- **WCAG 2.1 Level AA**: Accessible color contrast, keyboard navigation, and screen reader semantic structures.
- **GDPR & CCPA Compliant**: Built-in data export and automated deletion request pipelines at `/data-deletion`.
- **Vulnerability Disclosure**: Please consult [SECURITY.md](SECURITY.md) for our responsible disclosure guidelines and bounty program.

---

## 🤝 Community & Support

- **Enterprise Inquiries & Dedicated Deployments**: [enterprise@cursis.in](mailto:enterprise@cursis.in)
- **Security & Vulnerability Reports**: [security@cursis.in](mailto:security@cursis.in)
- **Contributing Guidelines**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Code of Conduct**: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

---

<div align="center">
  <p>&copy; 2026 Cursis Technologies Inc. All Rights Reserved.</p>
  <p>Engineered with precision for modern autonomous organizations.</p>
</div>
