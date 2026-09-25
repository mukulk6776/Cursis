# Contributing to Cursis

Thank you for your interest in contributing to **Cursis** — the Enterprise Autonomous AI Workplace & Agency Operating System.

We hold our codebase to rigorous institutional quality standards. Whether you are addressing a bug, optimizing runtime performance, extending ORDIS intelligence capabilities, or improving enterprise documentation, this guide outlines the process and expectations.

---

## 🧭 Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to providing a professional, respectful, and inclusive environment.

---

## 🛠️ Development Environment Setup

### 1. Prerequisites
- **Node.js**: v20.x or v22.x LTS (Recommended)
- **npm**: v10.x or higher
- **Git**: v2.40+
- **Database (Optional for local mocks)**: Local MongoDB instance or MongoDB Atlas cluster URI
- **Firebase Project**: Dedicated development Firebase credentials

### 2. Initial Setup
```bash
# 1. Clone your fork
git clone https://github.com/<your-username>/Cursis.git
cd Cursis

# 2. Install dependencies with strict lockfile integrity
npm ci

# 3. Configure environment variables
cp .env.example .env.local
```

### 3. Running Development Server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000). The development server runs with fast hot-module replacement and Turbo execution.

---

## 🌿 Branching Strategy & Workflow

We utilize a trunk-based development strategy with short-lived feature branches:

| Branch Prefix | Purpose | Example |
| :--- | :--- | :--- |
| `feat/` | New enterprise feature or capability | `feat/ordis-streaming-latency` |
| `fix/` | Bug fix or security mitigation | `fix/edge-waf-null-byte` |
| `perf/` | Performance optimization | `perf/calendar-slot-caching` |
| `refactor/` | Code structure improvement without logic changes | `refactor/rbac-guard-unification` |
| `docs/` | Documentation, schema updates, or guides | `docs/enterprise-sso-guide` |
| `test/` | Adding or updating unit/regression test suites | `test/team-limit-boundary` |

```bash
git checkout -b feat/your-descriptive-branch-name
```

---

## 📝 Commit Message Guidelines

Cursis strictly enforces the **[Conventional Commits](https://www.conventionalcommits.org/)** specification. Every commit message must follow this structure:

```
<type>(<scope>): <short description in present tense>

[optional detailed body explaining rationale and architecture decisions]

[optional footer referencing issue numbers: Closes #123]
```

### Supported Types:
- `feat`: A new user-facing or platform feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (formatting, white-space)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process, tooling, or dependencies

### Example:
```git
feat(ordis): implement multi-step tool execution receipt caching

- Introduces deterministic tool hash generation in lib/ordis/engine.ts
- Prevents redundant write mutations during multi-turn LLM loops
- Adds regression tests verifying receipt retention on provider failure

Closes #142
```

---

## 🧪 Quality Assurance & Local Verification

Before submitting a Pull Request, you **must** verify that all local checks pass cleanly:

```bash
# 1. Run ESLint across the codebase
npm run lint

# 2. Verify strict TypeScript compilation
npm run typecheck

# 3. Execute the full integration and regression test suite
npm test

# 4. Verify production build compilation
npm run build
```

**PRs with failing lint, type errors, or broken tests will not be merged.**

---

## 📬 Pull Request Submission Checklist

When opening a Pull Request:
1. **Target Branch**: Ensure your PR targets the `main` branch.
2. **Template**: Fill out all sections in the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).
3. **No Unrelated Changes**: Keep PRs focused. Do not combine unrelated refactors with feature development.
4. **Security & RBAC**: If introducing new endpoints or mutations, verify role authorization checks (`lib/auth/rbac.ts`) and tenant boundary enforcement.
5. **Clean History**: Rebase against `origin/main` and squash extraneous wip commits before requesting final review.

---

## 🏛️ Architecture Conventions

- **Next.js 16 Edge Proxy**: Route protection and security mitigations reside in `proxy.ts`.
- **Stateless & Resilient**: Route handlers in `app/api/**` must handle missing database configurations gracefully with fallback resilience.
- **Typed Responses**: All API endpoints should return standardized JSON responses using `lib/api/response.ts`.
- **Zero Inline Secrets**: Never hardcode credentials, tokens, or private keys. Always use typed environment helpers.

Thank you for helping build the future of autonomous workplace software! 🚀
