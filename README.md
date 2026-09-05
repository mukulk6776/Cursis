# Cursis — Autonomous AI Workplace & Agency Operating System

<div align="center">

![Cursis Platform](https://img.shields.io/badge/Next.js-16.3.2-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-ffca28?style=for-the-badge&logo=firebase)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)

**Cursis** is a full-featured, zero-subscription-lock AI workplace and operating system engineered for founders, modern teams, and agency client deployments. It unifies operations, project governance, smart calendar scheduling, automated paperwork pipelines, multi-agent intelligence (ORDIS AI), and bespoke client workspace provisioning into a single, cohesive ecosystem.

</div>

---

## 🛠️ Complete Technology Stack

### 1. Frontend Core & Architecture
- **Framework**: [Next.js 16.3.2](https://nextjs.org/) (App Router, Turbopack, React Server & Client Components)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) with strict type checking
- **UI Library**: [React 19.2.8](https://react.dev/) & [React DOM 19.2.8](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom design system variables, glassmorphism tokens, and responsive utility architecture
- **Animations & Physics**:
  - [Framer Motion 13.1.1](https://www.framer.com/motion/) for fluid page transitions, spring physics, hover micro-interactions, scroll reveals, and line drawing
  - [Lenis 1.3.26](https://lenis.darkroom.engineering/) for momentum smooth scrolling
- **3D Graphics**:
  - [Three.js 0.185.1](https://threejs.org/)
  - [@react-three/fiber 9.7.0](https://docs.pmnd.rs/react-three-fiber/) & [@react-three/drei 10.7.8](https://github.com/pmndrs/drei) for interactive 3D hero canvasing and spatial effects
- **Icons**: [Lucide React](https://lucide.dev/) + Optimized Inline SVG Vector Systems
- **Theme Engine**: `next-themes` (Dark/Light mode support)

### 2. Backend, Auth & API Architecture
- **API Runtime**: Next.js Edge & Node.js Serverless Route Handlers (`app/api/**`)
- **Authentication**:
  - **Client-Side**: Firebase Auth v12 (Email/Password, Google OAuth Popup)
  - **Server-Side Session**: Signed, HTTP-only secure session cookies (`cursis_session`) with 5-day expiration
  - **Role-Based Access Control (RBAC)**: Owner, Admin, Manager, Member, Viewer permissions matrix
  - **Route Protection**: Edge Proxy / Middleware (`proxy.ts`) enforcing authenticated route boundaries
- **Database & Storage**:
  - Firebase Firestore (Cloud Database)
  - Firebase Storage (Asset & Document Vault)
  - In-Memory Hybrid Store (`lib/db/store.ts`) for zero-latency local state and offline resilience
- **Admin SDK**: `firebase-admin v14.3.0` for server-side token verification and user profile management

### 3. AI & Automation Engine (ORDIS)
- **ORDIS Operational Intelligence**: Real-time AI engine with context memory across tasks, team velocity, document summaries, meetings, and cross-workspace automations.
- **Paperwork Engine**: Digital client intake form parsing, OCR clause extraction, contract PDF generation, and automated legal approval routing.
- **Workflow Automation**: Visual trigger-action sequence builder and webhook dispatcher.

---

## 📂 Project Structure & Module Overview

```
Cursis/
├── app/
│   ├── api/                     # 40+ REST & Serverless API Route Handlers
│   │   ├── agency/              # Agency project requests, solutions catalog
│   │   ├── auth/                # Session exchange (/api/auth/session, /api/auth/me)
│   │   ├── automations/         # Automation execution & triggers
│   │   ├── calendar/            # Smart calendar slots & event scheduling
│   │   ├── crm/                 # Contacts, deals, renewals, pipeline management
│   │   ├── dashboards/          # Live metrics, health scoring, revenue reports
│   │   ├── documents/           # Document repository, AI generators, e-signatures
│   │   ├── integrations/        # Webhooks, API keys, 3rd party sync
│   │   ├── meetings/            # Google Meet/Zoom integration, AI notes processor
│   │   ├── ordis/               # Brain, risk radar, simulation, approval queue
│   │   ├── projects/            # Multi-project lifecycle endpoints
│   │   ├── search/              # Global ⌘K multi-entity search
│   │   ├── security/            # Audit logging, rollbacks, governance
│   │   ├── tasks/               # Kanban tasks, reassignments, deadlines
│   │   ├── team/                # Org directory, invitations, onboarding
│   │   └── workspaces/          # Multi-tenant workspace switcher & management
│   ├── dashboard/               # Protected dashboard route (/dashboard)
│   ├── login/                   # Custom authentication login page
│   ├── signup/                  # User registration & workspace creation
│   ├── layout.tsx               # Root application layout & metadata
│   ├── page.tsx                 # High-conversion public landing page
│   └── globals.css              # Global tokens, typography & animations
│
├── components/
│   ├── landing/                 # Highly animated marketing components
│   │   ├── HeroSection.tsx      # 3D canvas, interactive workflow nodes, CTA
│   │   ├── OrdisSection.tsx     # ORDIS AI capability demonstration
│   │   ├── FeaturesSection.tsx  # Modular workspace capabilities
│   │   ├── AgencySection.tsx    # Bespoke AI agency client implementation showcase
│   │   ├── PricingSection.tsx   # Free Public Workspace vs Custom Enterprise builds
│   │   └── ...
│   └── dashboard/               # Production workspace dashboard modules
│       ├── DashboardShell.tsx   # Reactive workspace shell & route presenter
│       ├── Sidebar.tsx          # Dynamic collapsible sidebar navigation
│       ├── Topbar.tsx           # Multi-workspace switcher, global search, profile
│       ├── CommandPalette.tsx   # Global ⌘K keyboard shortcut navigator
│       ├── NotificationPanel.tsx# Real-time event notifications slide-over
│       ├── ProfilePanel.tsx     # Active member statistics & detail view
│       ├── modals/              # Task, Project, Meeting, Doc, Agency modals
│       └── pages/               # 13 Dedicated Production Views:
│           ├── HomePage.tsx     # Focus mode, metrics, ORDIS command bar
│           ├── TasksPage.tsx    # Kanban & list task management
│           ├── ProjectsPage.tsx # Multi-initiative tracking & milestones
│           ├── DocumentsPage.tsx# Paperwork studio & legal pipeline simulator
│           ├── TeamPage.tsx     # Org directory, roles, and invitation tracker
│           ├── CalendarPage.tsx # Day/Week/Month smart calendar
│           ├── MeetingsPage.tsx # Virtual meeting rooms, AI notes & summaries
│           ├── AnalyticsPage.tsx# Team velocity, burndown, throughput metrics
│           ├── WorkspacePage.tsx# Client CRM, deal pipeline, and agency store
│           ├── AutomationsPage.tsx # Trigger-action sequence builder
│           ├── OrdisPage.tsx    # Dedicated Operational AI control hub
│           ├── IntegrationsPage.tsx # Webhooks, OAuth apps, and API keys
│           └── SettingsPage.tsx # Governance, 2FA security policies & audit logs
│
├── lib/
│   ├── auth/                    # Client Firebase SDK, Admin SDK, and Session helpers
│   ├── db/                      # In-memory store, schema types, mock seed sets
│   ├── dashboard/               # DashboardContext state, actions, and getters
│   └── api/                     # Standardized API response formatters & auth guards
│
├── proxy.ts                     # Edge middleware for route protection & redirects
└── public/                      # Static assets, SVG vector icons, brand marks
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎨 Design Language
Cursis is designed with a **Somba Neo-Brutalist** aesthetic:
- **Sharp Geometry**: `0px` border-radius with crisp definition
- **High Contrast**: Solid borders with offset drop shadows
- **Vibrant Palette**: Somba Brand Blue (`#0f4cff`) & Lime Accent (`#ccff00`)
- **Fluid Motion**: Spring-physics micro-interactions and GPU-accelerated scroll reveals

---

## 📄 License
© Cursis. All rights reserved.
