# Security Policy & Responsible Disclosure

Cursis Technologies Inc. ("Cursis") designs, engineers, and operates mission-critical enterprise autonomous workplace infrastructure. We treat security, data isolation, and cryptographic integrity as first-class architectural primitives.

---

## 🛡️ Supported Versions

We actively issue security updates, vulnerability patches, and zero-day mitigations for the following product releases:

| Version | Status | Security Support | Maintenance SLA |
| :--- | :--- | :--- | :--- |
| **v1.x (Enterprise Current)** | Active Production | Supported | Immediate Hotfix (<24h) |
| **v0.9.x** | Deprecated | Critical Security Only | Best Effort (<72h) |
| **< v0.9.0** | End of Life (EOL) | Unsupported | Upgrade Required |

---

## 🚨 Reporting a Vulnerability

If you believe you have discovered a security vulnerability in Cursis platform software, API route handlers, Edge WAF (`proxy.ts`), ORDIS AI engine, or client infrastructure, we appreciate your prompt and confidential disclosure.

### How to Submit
1. **Direct Security Desk**: Email **[security@cursis.in](mailto:security@cursis.in)** with the subject line: `[VULNERABILITY DISCLOSURE] - <Brief Description>`.
2. **Encrypted Communications**: For sensitive vulnerability payloads, please request our PGP public key or encrypt via our verified security key fingerprint: `CURSIS-SEC-KEY-2026-F982-A71C`.
3. **Private GitHub Security Advisory**: You may also open a private advisory under GitHub Security -> Advisories.

### What to Include
Please provide a comprehensive vulnerability report containing:
- **Title & Severity Assessment**: (e.g., CVSS estimate: Critical, High, Medium, Low).
- **Target Component**: Specific API route (`app/api/**`), Edge Proxy (`proxy.ts`), Auth Module (`lib/auth/**`), or ORDIS execution loop (`lib/ordis/**`).
- **Reproduction Steps**: Step-by-step instructions or minimal Proof of Concept (PoC) script.
- **Observed Impact**: Clear explanation of potential privilege escalation, data boundary bypass, cross-tenant leakage, or remote execution risk.
- **Remediation Suggestion**: (Optional) Recommended code or configuration fix.

---

## ⏱️ Response & Remediation SLA Matrix

Our Dedicated Security Operations Team operates under strict institutional SLAs:

| Severity Level | Initial Acknowledgement | Triage & Validation | Mitigation Target |
| :--- | :--- | :--- | :--- |
| **Critical** (CVSS 9.0 – 10.0) | **< 4 Hours** | **< 12 Hours** | **< 24 Hours** (Hotfix deployment) |
| **High** (CVSS 7.0 – 8.9) | **< 12 Hours** | **< 24 Hours** | **< 72 Hours** |
| **Medium** (CVSS 4.0 – 6.9) | **< 24 Hours** | **< 48 Hours** | Next Minor Release (< 7 Days) |
| **Low** (CVSS 0.1 – 3.9) | **< 48 Hours** | **< 5 Business Days** | Scheduled Roadmap Release |

---

## 🏆 Responsible Disclosure & Safe Harbor

We consider security researchers our partners. Cursis provides **Safe Harbor** for good-faith vulnerability research. We pledge that:
- We will not pursue civil or criminal legal action against researchers who adhere to this policy.
- We will provide public credit and acknowledgement in our security hall of fame (unless anonymity is requested).
- Valid vulnerabilities impacting core enterprise isolation, multi-tenant boundaries, or authentication integrity are eligible for discretionary bounty awards through our Enterprise Bug Bounty Program.

### Guidelines for Safe Harbor:
- Do not access, modify, exfiltrate, or destroy actual customer or workspace data.
- Avoid initiating Denial of Service (DoS/DDoS) attacks against production infrastructure.
- Give Cursis a reasonable window (minimum 90 days or until patch release) to mitigate vulnerabilities prior to public disclosure.

---

## 🔒 Security Architecture Highlights

- **Edge Proxy WAF**: Built-in Next.js 16 Edge Proxy (`proxy.ts`) actively blocks path traversal, null-byte injections, and script probes before requests reach serverless handlers.
- **Cryptographic Session Integrity**: HTTP-only, secure, signed cookies with tamper detection and automated invalidation.
- **Multi-Tenant Boundary Isolation**: Deterministic tenant tenancy verification on every mutation and read operation.
- **Data Protection**: AES-256 encryption at rest, TLS 1.3 in transit, strict Content Security Policy (CSP v3), and isolated Firestore/MongoDB collections.

---

**Cursis Security Operations Team**  
Email: [security@cursis.in](mailto:security@cursis.in)  
Web: [https://cursis.in/security](https://cursis.in)
