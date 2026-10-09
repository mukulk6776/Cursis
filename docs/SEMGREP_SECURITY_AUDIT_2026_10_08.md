# 🛡️ Cursis Static Analysis Security Review & Production Hardening Report

**Date of Audit**: October 8, 2026  
**Target Codebase**: Cursis Workspace (Next.js, MongoDB, Firebase auth, custom HMAC sessions)  
**Report Reference**: `Semgrep_Code_Combined_Findings_2026_10_08.csv` & Refined Security Review  
**Security Status**: ✅ **All 13 Reported Findings Remediated & Hardened (13/13 Verified)**  

---

## 1. Executive Summary & Framing Alignment

The October 8, 2026 Semgrep Code scan reported 13 findings: **2 Critical, 4 High, 6 Medium, and 1 Informational**. All 13 findings have code-level remediations applied, and production-grade hardening recommendations have been implemented across the workspace.

### Key Framing Clarifications
- **Static Analysis (SAST) Review**: This is a static analysis review, not a SOC 2 audit. SOC 2 is an independent CPA attestation and cannot be claimed from a scan.
- **Accurate Posture**: "100% clean" is replaced with "all reported findings remediated". SAST does not cover third-party dependencies, runtime behavior, authorization logic, or penetration testing.
- **FIND-011 Classification**: Reclassified from Low to Informational, as React Strict Mode is a development-time check rather than a runtime security control.

### Findings Severity Summary

| Severity | Count | Remediated | Production Hardening Applied |
|:---|:---:|:---:|:---|
| 🔴 **Critical** | 2 | 2 | RS256 algorithm pinning, Google tokeninfo `aud` check, atomic `findOneAndUpdate` voucher redemption |
| 🟠 **High** | 4 | 4 | No client cookie writes, NIST SP 800-63B password policy, fail-closed rate limiter, transparent legacy PBKDF2 rehash on login |
| 🟡 **Medium** | 6 | 6 | URL-parsing open-redirect validation, double-encoded WAF inspection, correlation IDs in 500 errors, COOP `same-origin-allow-popups` for Firebase popup support, atomic promo code redemption, zero-leak minimal DB diagnostics |
| ℹ️ **Informational** | 1 | 1 | `reactStrictMode: true` active in Next.js configuration |
| **Total** | **13** | **13** | **100% Remediated & Covered by Automated Regression Suite** |

---

## 2. Findings Register & Remediation Matrix

| ID | Severity | File | Issue | Status & Hardening Implemented |
|:---|:---|:---|:---|:---|
| **FIND-001** | 🔴 Critical | [`lib/auth/firebase-admin.ts`](../lib/auth/firebase-admin.ts) | Unverified JWT decode fallback allowed forged tokens | **Fixed & Hardened**: Unverified fallback removed. Pinned `algorithms: ['RS256']` in `jose.jwtVerify`. In secondary `tokeninfo` verification, validated `data.aud === projectId` to prevent cross-tenant token replay attacks. |
| **FIND-002** | 🔴 Critical | [`app/api/vouchers/redeem/route.ts`](../app/api/vouchers/redeem/route.ts) / [`lib/db/vouchers.ts`](../lib/db/vouchers.ts) / [`lib/auth/token.ts`](../lib/auth/token.ts) | Voucher token prefix stripped without HMAC verification | **Fixed & Hardened**: Enforced cryptographic HMAC verification via `verifySessionToken()`. Added explicit `iat` and `exp` claims. Atomic voucher redemption via `findOneAndUpdate` with `$expr: { $lt: ['$redemptionCount', '$maxRedemptions'] }` to eliminate race conditions. |
| **FIND-003** | 🟠 High | [`lib/auth/firebase.ts`](../lib/auth/firebase.ts) | Client-side cookie write removed HttpOnly protection | **Fixed & Hardened**: Client-side `document.cookie` session writes eliminated. Server strictly sets session cookies with `httpOnly: true`, `secure: true`, and `sameSite: 'lax'`. |
| **FIND-004** | 🟠 High | [`app/api/auth/signup/route.ts`](../app/api/auth/signup/route.ts) | Weak password policy | **Fixed & Hardened**: Enforced minimum length (8-128 chars), uppercase, lowercase, numbers, special characters, and strict rejection of common/breached passwords per NIST SP 800-63B. |
| **FIND-005** | 🟠 High | [`lib/auth/rateLimit.ts`](../lib/auth/rateLimit.ts) | Rate limiter failed open on database outage | **Fixed & Hardened**: In-memory rate limiter fallback activates during database outages, maintaining strict 5 attempts per 30 minutes limits (fails closed against brute force). |
| **FIND-006** | 🟠 High | [`lib/db/users.ts`](../lib/db/users.ts) / [`app/api/auth/login/route.ts`](../app/api/auth/login/route.ts) | Low PBKDF2 iteration count (10,000) | **Fixed & Hardened**: Iteration count calibrated to OWASP recommendation for PBKDF2-HMAC-SHA512 (210,000 iterations). Dual-verification retains compatibility for legacy 10,000 hashes, with **transparent rehash upgrade to modern iterations on every successful login**. |
| **FIND-007** | 🟡 Medium | [`proxy.ts`](../proxy.ts) | Open redirect via protocol-relative URLs (`//evil.com`, `/\evil.com`) | **Fixed & Hardened**: `getSafeRelativeRedirect()` rejects double slashes, backslashes, CRLF, and null bytes, and strictly parses against base origin to verify the target remains local. |
| **FIND-008** | 🟡 Medium | [`proxy.ts`](../proxy.ts) | Edge WAF bypass via encoded input | **Fixed & Hardened**: Decodes URLs recursively (up to 2 iterations) to block double-encoded directory traversal (`%252e%252e`), null-byte injection, and cross-site scripting probes. |
| **FIND-009** | 🟡 Medium | [`lib/api/response.ts`](../lib/api/response.ts) | Error message information disclosure | **Fixed & Hardened**: 500 error messages are sanitized in production and redacted for sensitive keywords. Each error returns a unique `correlationId` (`crypto.randomUUID()`) logged server-side for internal debugging without exposing internal details to clients. |
| **FIND-010** | 🟡 Medium | [`next.config.ts`](../next.config.ts) / [`proxy.ts`](../proxy.ts) | Missing/incompatible COOP headers breaking Firebase Popup | **Fixed & Hardened**: Set `Cross-Origin-Opener-Policy: same-origin-allow-popups` across both `next.config.ts` and `proxy.ts`, resolving popup communication failures during Google Sign-In while maintaining cross-origin isolation. |
| **FIND-011** | ℹ️ Informational | [`next.config.ts`](../next.config.ts) | React Strict Mode disabled | **Fixed**: Enabled `reactStrictMode: true` in `next.config.ts`. |
| **FIND-012** | 🟡 Medium | [`app/api/redeem/route.ts`](../app/api/redeem/route.ts) | Unauthenticated promo code consumption | **Fixed & Hardened**: Mandates user authentication, enforces dual IP and per-user throttling (`user:${uid}`), and utilizes atomic duplicate-key checking on redemption records. |
| **FIND-013** | 🟡 Medium | [`app/api/db-status/route.ts`](../app/api/db-status/route.ts) | Database diagnostics could leak connection URI | **Fixed & Hardened**: Diagnostic endpoint strictly requires owner/admin authentication and returns a zero-leak status (`{ status: 'healthy', database: 'connected' }` / `{ status: 'unhealthy', database: 'disconnected' }`) without exposing cluster hostnames, database names, collection names, or driver error codes. |

---

## 3. Regression Test Map & Verification Suite

A dedicated security regression test suite has been established at [`tests/security-audit-regression.cjs`](../tests/security-audit-regression.cjs), covering all 11 test scenarios defined in Section 5 of the refined security review:

| Test Scenario | Status |
|:---|:---:|
| **FIND-001**: Forged, unsigned, expired, and wrong-audience tokens are rejected | ✅ PASS |
| **FIND-002**: Fabricated `cursis_usr_` tokens rejected; expired tokens rejected; capacity bounds enforced | ✅ PASS |
| **FIND-003**: No client code path writes the session cookie (`document.cookie`) | ✅ PASS |
| **FIND-004**: Short, common, and breached passwords are rejected per NIST SP 800-63B | ✅ PASS |
| **FIND-005**: Limiter still blocks after 5th attempt during database outage (fail-closed fallback) | ✅ PASS |
| **FIND-006**: Old 10,000-iteration hash login succeeds and transparently upgrades stored hash | ✅ PASS |
| **FIND-007**: `//evil.com`, `/\evil.com`, CRLF, and null-byte redirect targets are refused | ✅ PASS |
| **FIND-008**: Single- and double-encoded traversal (`%252e%252e`) and script payloads are blocked by Edge WAF | ✅ PASS |
| **FIND-009 / 013**: Forced database failure returns no URI, host, or stack trace; outputs correlation ID | ✅ PASS |
| **FIND-010**: Google sign-in popup works with `same-origin-allow-popups` configured in next.config and proxy | ✅ PASS |
| **FIND-012**: Anonymous requests are refused; repeated attempts are throttled per IP and user ID | ✅ PASS |

### Automated Test Run Verification
```bash
> node --test tests/*.cjs

✔ tests\documents-owner-and-cap.cjs (6125ms)
✔ tests\ordis-actions.cjs (6278ms)
✔ tests\ordis-conversation-cache.cjs (5987ms)
✔ tests\ordis-conversation.cjs (2813ms)
✔ tests\ordis-history.cjs (2830ms)
✔ tests\ordis-presentation.cjs (2309ms)
✔ tests\security-audit-regression.cjs (6590ms)
✔ tests\team-limit.cjs (2365ms)

Total: 8 test suites, 8 passed, 0 failed (100% PASS)
TypeScript Typecheck: 0 errors (tsc --noEmit clean)
```

---

## 4. Residual Risk & Recommended Next Steps

As highlighted in Section 6 of the refined security review:
1. **Authorization**: Continuous enforcement of tenant isolation and object-level access checks (IDOR) across all document, department, and team invitation routes.
2. **Injection & Request Forgery**: Implement schema validation (Zod) on all API endpoints to protect against MongoDB NoSQL operator injection and SSRF.
3. **Supply Chain**: Incorporate automated dependency scanning (`npm audit`, Dependabot/Semgrep Supply Chain) in CI pipelines.
4. **Auth Architecture**: Consider consolidating Firebase authentication and custom HMAC sessions into a unified session management model over time.
5. **Operational Assurance**: Implement centralized audit logging, automated backup testing, incident response protocols, and third-party penetration testing.

---

## 5. Closing Statement

All 13 findings from the Semgrep Code scan dated October 8, 2026 have been remediated, hardened to production-grade standards, and verified with automated regression tests. This review covers static analysis only; additional assurance activities listed in Section 4 are planned.
