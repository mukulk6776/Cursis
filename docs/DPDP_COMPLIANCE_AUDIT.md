# Cursis DPDP compliance audit

Audit date: 18 October 2026. Scope: this working tree, not a live cloud-account audit. Status: remediation implemented in source; production compliance is **not established**. Do not publish a claim of “100% compliant”, certified TLS enforcement, universal AES-256, SOC 2, ISO 27001 or HIPAA compliance on this evidence.

The operator confirmed Cursis has not been registered. Registration is not a prerequisite for privacy duties: the actual individual operating the service may be the fiduciary/contracting party under the trading name. Remove corporate “Inc.” labels and fictitious addresses; publish that individual's verified identity, business contact address and grievance contact. Do not invent a company number, registered office or overseas compliance agent. This does not settle tax, business-registration or other applicability questions.

Confirmed by the user: Saransh Vashistha is the operator and designated grievance contact; official@cursis.in is the contact address. These are the notice defaults. A publishable business postal address and actual mailbox delivery/monitoring evidence remain outstanding. No statutory DPO designation is inferred.

## Role and responsibility

| Processing | Cursis role | Customer role |
| --- | --- | --- |
| Account identity, authentication, own billing, security and sales inquiries | Data Fiduciary; GDPR controller if applicable | Individual or customer contact |
| Enterprise employee/client records, tasks, CRM, documents, meeting content and customer-directed AI actions | Data Processor under documented instructions | Data Fiduciary/controller |
| Any independent reuse, model training or new purpose Cursis chooses | Must assess its own fiduciary/controller obligations | Instructions do not legitimise independent reuse |

Role is purpose-specific, not a company-wide label. Customer ownership of a workspace does not excuse Cursis from its own fiduciary duties. See DATA_PROCESSING_ADDENDUM.md for the contractual draft.

## Legal calibration

The [Act](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf) supplies the fiduciary/processor framework and rights. DPDP access is not a general portability right; JSON export is an additional feature. Section 7 legitimate uses are enumerated, not a general commercial legitimate-interest test. Section 16 permits notified transfer restrictions, not an assumed blanket approved-country list.

The [final Rules, corrigendum and commencement documents](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digit) must be read together. The rules dated 13 November 2025 phase commencement: rules 1–2 and 17–21 immediately; rule 4 after one year; rules 3, 5–16, 22–23 after eighteen months. Most substantive readiness controls therefore target May 2027 under the published schedule; confirm the separate Act commencement notification and any later orders before launch. The December 2025 corrigendum remains a counsel review item.

Final Rule 14 allows a published grievance response period up to 90 days. Our 72-hour acknowledgment / 30-calendar-day resolution commitments are stricter internal service targets, not those exact statutory deadlines. Final Rules 6 and 8 introduce one-year retention requirements that prevent treating a 90-day wipe as unconditional.

[GDPR](https://eur-lex.europa.eu/eli/reg/2016/679) is separately assessed for territorial scope, contract/consent/legal obligation, Article 28 contracts, Chapter V transfers, generally one-month rights responses, and risk-based breach duties. Do not confuse GDPR “one month” with 30 days.

[GST Section 36](https://cbic-gst.gov.in/pdf/CGST-Act-Updated-31082021.pdf) uses 72 months from the annual return due date, not an arbitrary seven years. [Companies Act Section 128](https://www.incometaxindia.gov.in/w/section-128-81) may require eight financial years. [CERT-In directions](https://www.cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf) separately require covered incident reporting within six hours and 180-day ICT logs within India.

## Data inventory and provider evidence

The canonical public draft at /privacy renders the itemised matrix and provider register from lib/privacy/config.ts. It is independent of Terms. Inventory evidence:

| Data | Entry point | Storage or onward flow |
| --- | --- | --- |
| Name/email, password input, hash/salt, age attestation | app/signup, api/auth/signup, lib/db/users.ts | MongoDB users; transient plaintext request |
| Google email/name/avatar, Firebase ID token | lib/auth/firebase.ts, api/auth/session | Firebase/Google token verification; MongoDB account |
| Signed session identity, authentication tokens | lib/auth/token.ts, session.ts | HTTP-only cookie; client bearer/local auth storage |
| IP, user agent, timestamp, rate-limit key | auth/rateLimit.ts, link preview, email/unsubscribe | MongoDB rate_limits; host logs; browser/device metadata |
| Workspace records, CRM, meetings, messages, documents | app/api, lib/db | MongoDB plus process caches |
| Prompts/context/tool arguments and outputs | lib/ordis/groq.ts, gemini.ts, server.ts, conversations.ts | Groq / Google Gemini; MongoDB; browser chat cache |
| Provider credentials and endpoint/payload config | lib/db/integrations.ts | Raw config in MongoDB; selected integration destinations |
| Inquiry and generated proposal | agency/request-build, lib/db/agency.ts | agency_requests and documents |
| Nominee, consent evidence, requests, deletion ledger | api/privacy, lib/privacy | MongoDB privacy collections |
| Cookie choice | components/CookieConsent.tsx | Browser localStorage |

Code-observed vendors: MongoDB (Atlas-compatible), Google Firebase Authentication, Google Gemini, Groq, Resend. Configurable integration destinations: Intuit QuickBooks, Salesforce, DocuSign, Google Calendar, arbitrary custom webhooks. Link previews contact selected remote sites; remote images/avatars expose viewer connection metadata to their hosts. Vercel-compatible configuration is present but live hosting is unverified. Supabase/Razorpay/Upstash were not identified as implemented providers.

No actual provider credentials were printed or copied into this report. .env.local contents were not audited.

## Findings and disposition

| Severity | Evidence / problem | Source remediation or remaining work |
| --- | --- | --- |
| Critical | Prior public privacy page claimed enforced TLS 1.3, universal AES-256, cryptographic tenant namespaces and certifications without evidence | Replaced with accurate scope; obtain cloud evidence and test tenant isolation |
| High | Signup admitted 16+, or 13+ on asserted parental consent; no verified parent workflow | New signup is adults-only with strict boolean gate, separate account-consent checkbox and version; Google session creation also gates new accounts |
| High | Existing accounts may include children; a self-attestation is not age verification | Operator must review legacy eligibility, invitations, child-data reports and appropriate age assurance; no retrospective consent fabricated |
| High | No complete rights lifecycle | Privacy Centre, authenticated API, durable request tracking, profile correction, nominee save/remove, account JSON, closure queue added |
| High | Stateless sessions could recreate erased cached users | Durable keyed blocks checked at authenticated access and all account entry points; closure stops access before cleanup |
| High | Shared customer content and free-text references cannot be safely erased/exported by a generic account query | Account export is explicitly partial. Assisted access and controller-directed shared-content review remain mandatory |
| High | Provider/backups retention not evidenced | Jobs retain external tasks and never auto-complete after DB deletion. Processor contacts, deletion APIs/contractual attestations and backup restore tests still required |
| High | Integration config can contain plaintext credentials; memory/local chat caches contain personal data | Restrict DB/admin access now; move credentials to a vault/envelope encryption, rotate exposed keys, review API response redaction; not remediated by adding AES marketing claims |
| High | Existing business DB helpers swallow persistence failures and use memory fallback | New privacy operations fail closed on storage errors; system-wide durable account/workspace writes still require redesign |
| High | Legal entity/address and named officer absent/unverified; email module contains apparent placeholder addresses | Notice marks missing identity; set environment values after verification and correct remaining legal/email materials before publication |
| High | No evidence of provider DPAs, transfer regions, AI training terms or approved onward transfers | Complete vendor/legal register and restrict AI use until approved. Generic policy wording does not enforce destinations |
| High | English-only notice and consent | Provide supported Eighth Schedule language choices and translations; language email assistance alone is not full implementation |
| Medium | Optional functional preference initially selected | Default now false; analytics remains false. Reject/withdraw available. Expired or malformed 180-day choices do not authorise analytics |
| Medium | Inquiry forms lacked explicit scoped consent | Both landing and dashboard inquiry forms now require active opt-in and adults-only attestation; API records version and purpose |
| Medium | No live waitlist implementation located | Do not infer a marketing subscription or activate one. New forms must use the same purpose separation |
| Medium | Unsubscribe GET reveals status; its memory and DB records diverge; no marketing sender identified | Documented remaining issue: remove enumeration endpoint or secure it; ensure any future marketing sender checks durable consent/suppression |
| Medium | Retention deletion cannot run safely without legal disposition | Daily maintenance endpoint uses an explicit operator retention approval, retry lease, and overdue counts. Active deletion is not proof of complete erasure |

## Implemented interfaces

- GET /api/privacy: authenticated minimal profile, nominee, request receipts and contact.
- GET /api/privacy?export=json: attachment with allowlisted account records, bounded size, recursive credential-field redaction, no shared-workspace dump.
- POST /api/privacy: profile, nominee, request, consent, erase/withdraw actions; strict same-origin writes and session authentication.
- Erasure needs typed confirmation and password recheck or recently reauthenticated, verified Google identity; rate-limited.
- POST /api/privacy/maintenance: secret-authenticated worker, no public GET; legal approval required; idempotent account/eligible-workspace deletion with an expiring lease; overdue SLA counts.
- /privacy/rights: public rights centre with authenticated self-service and email fallback. Linked from footer, policies and settings for ordinary members too.

New privacy operations return no-store responses. General auth catches may return 401/500 on unavailable block storage; production authentication fails closed rather than skipping closure checks. Preview/dev can still use existing memory fallback, but rights persistence does not.

## Export and erasure boundaries

The export deliberately excludes password hashes, salts, bearer tokens, invitation tokens and integration secrets. Shared data is not exported merely because the requester belongs to that workspace. A full Section 11 response needs a human-verified processing summary, actual recipient identities and supplemented records including provider logs, free-text references and legally retained data.

Active erasure removes account-scoped records, memberships, team entries, notifications, private AI histories, matching direct inquiries/consent records and nominations. It deletes an owned workspace only if no other membership, team member, user reference or member count suggests sharing. Referenced public inquiry proposals are removed. Shared tenant tasks/logs, financial records, legal holds, provider copies and backups need separate documented disposition.

A keyed closure block is personal data, not anonymous data. It prevents stale session/cache resurrection and must be protected, purpose-limited, reviewed and migrated if the signing key changes. Never rotate its stable secret without migrating blocks. Do not delete blocks merely to restore service after an outage.

## Release gates

### Public transport probe

On 18 October 2026, certificate-validated handshakes to cursis.in:443 succeeded with both TLS 1.3 (TLS_AES_128_GCM_SHA256) and TLS 1.2 (ECDHE-RSA-AES128-GCM-SHA256). The public endpoint supports TLS 1.3 but does **not** enforce TLS 1.3 only. This is a single host/network observation, not coverage of database, subdomains or providers. AES-128 negotiated for transport says nothing about AES-256 at rest. DPDP does not prescribe these exact algorithm/version labels as a universal compliance test.

1. Verify legal entity, postal address, appointed contact and mailbox monitoring. Remove all placeholder corporate/physical address and unsupported certification claims across public/email materials.
2. Supply PRIVACY_* configuration, stable tombstone key, authenticated daily scheduler and SLA alerts. Initialise indexes on a staging database, then production.
3. Review all legacy users/consent and child-related records. Do not relabel earlier age/COPPA assertions as new DPDP consent.
4. Approve retention by category, purpose, law, effective date and customer contract. Set restricted archives, final purge jobs, holds and restore suppression; no blanket unconditional 90-day wipe.
5. Verify actual host/DB/backup/storage TLS and encryption/key controls; obtain access reviews, recovery evidence and a tenant-isolation security assessment.
6. Execute vendor DPAs, region/transfer assessments, AI terms and customer DPA. Confirm legal entities and actual logs. Implement destination restrictions and reviewed AI rollout.
7. Staff daily request review and provider deletion confirmation. Run a full assisted access request, nomination claim, erasure, restore drill and breach exercise.
8. Deliver required notice/consent language choices, review accessibility and obtain Indian privacy counsel's commencement/corrigendum assessment.

No deployment, production deletion, external email, vendor instruction or Board filing was performed.

## Validation

Production build completed successfully with network access for the project's existing Google Fonts dependencies. TypeScript and focused ESLint checks passed. The new privacy suite passed 13 tests. The full existing test run initially passed 41/42: the remaining signup account-takeover fixture needed the newly required consent fields; after that fixture update its complete 8-scenario regression suite passed. Tests use mocks and do not establish live infrastructure/provider compliance. No production erasure worker or notification was invoked.

See LEGAL_RESPONSIBILITIES.md for the named-role checklist and current missing business details. Before production use, configure the independent stable PRIVACY_TOMBSTONE_SECRET; authentication intentionally fails closed without it.
