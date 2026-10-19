# Cursis legal responsibilities and required details

Prepared 18 October 2026 for an unregistered business operated under the Cursis trading name. This is a deployment checklist, not a compliance certificate. Privacy duties can apply to an individual operator; do not describe Cursis as an incorporated company.

## Names and business details

| Detail or role | Current information | Next action |
| --- | --- | --- |
| Trading name | Cursis | Use consistently |
| Responsible operator / contracting party | Saransh Vashistha, operating as Cursis | Use full legal identity in notices and contracts |
| Privacy and grievance contact | Saransh Vashistha | Publish with the contact title |
| Contact title | Operator and Grievance Contact | Do not imply a statutory DPO appointment |
| Privacy / grievance email | official@cursis.in | Verify delivery, secure the mailbox, and monitor daily |
| Business postal/contact address | Missing | Provide a real usable service address; never invent one |
| Registration status | Not registered, as confirmed by the user | Do not publish Inc., Pvt. Ltd., CIN, GSTIN or registered-office claims without the applicable registration |
| Security / incident-response owner | Not separately assigned | Saransh may cover this initially; appoint a backup and on-call channel |
| Rights/deletion operations owner | Not separately assigned | Name a person who checks requests, legal holds and provider cleanup |
| Tax / accounting adviser | Not assigned | Assess applicable business, invoicing, GST and record-keeping duties |
| Privacy legal reviewer | Not assigned | Review applicability, phased commencement, contracts, transfers and retention |

A DPDP statutory Data Protection Officer is required if designated a Significant Data Fiduciary; it is not an automatic requirement for every startup. GDPR DPO and EU/UK representative duties have separate triggers. Evaluate them if your operations meet those triggers. Do not claim a U.S. registered copyright agent or foreign office without evidence.

## Core privacy responsibilities

| Responsibility | What Cursis must put in place | Current position |
| --- | --- | --- |
| Define fiduciary vs processor roles | Cursis is responsible for its own account/security/inquiry purposes; enterprise customers normally control their workspace personal data | Draft role distinction and customer addendum created |
| Give a separate notice | Itemised data, purposes, recipients, retention, transfers, rights and named contact; usable language choices | English draft implemented; postal address and language implementation remain |
| Establish processing grounds | Record consent or a specifically applicable Section 7 use; separately assess GDPR grounds where applicable | New signup/inquiry consent added; legacy processing review needed |
| Respect consent choices | Active unchecked choices, optional analytics off, easy withdrawal, purpose/version evidence | Source controls implemented; audit legacy records and every deployed tracker |
| Protect children | Adult-only service unless a separately lawful verified-parental workflow is introduced; no child tracking/profiling/targeted advertising | Adult attestation added; not equivalent to verified age assurance |
| Handle rights | Access/recipient summary, correction, erasure, nomination and grievance process; reasonable identity verification | Centre/API and partial JSON implemented; shared/provider records need assisted review |
| Govern customer data | Signed processor instructions, access controls, assistance, confidentiality, approved sub-processors and return/deletion terms | Addendum drafted; execution and customer-specific schedules pending |
| Govern providers | Actual provider legal entities, DPAs, regions, onward transfers, AI use/training/retention terms | Code register exists; production contracts/settings unverified |
| Control international transfers | Check current Indian restrictions, sector rules and applicable GDPR transfer mechanisms | Contract/region and technical destination review pending |
| Apply retention and deletion | Category-specific periods, legal holds, restricted archives, final purges, backup/provider evidence | Active erasure queue exists; legal approval and external cleanup remain operational duties |
| Secure processing | Least privilege, MFA for operators, tenant isolation, secrets management, encryption, backups, monitoring and incident handling | Some code controls exist; infrastructure evidence and credential-vault work remain |
| Respond to incidents | Maintain contacts, clocks, Board/customer/user notices and a tested playbook | Templates/runbook created; appoint staff and run an exercise |

The [DPDP Act](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf) and [final Rules, corrigendum and commencement notifications](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digit) control applicability and phased effective dates. Our operational checklist prepares for duties that may not all be in force on the audit date.

## Documents and evidence to maintain

- Standalone Privacy Notice with the completed operator/address details.
- Terms of Service that do not bundle privacy or optional marketing consent.
- Cookie/storage notice and an actual consent-controlled tracker inventory.
- Customer Data Processing Addendum, with specific instructions and service security annex.
- Approved provider/sub-processor register, contracts and cross-border transfer assessment.
- Record of processing purposes, categories, locations, access and legal grounds.
- Consent/version evidence and a reviewed legacy-consent migration plan.
- Rights, nominee claims and grievance register with receipts and outcomes.
- Retention schedule, legal-hold register, deletion evidence and restore-block procedures.
- Access reviews, encryption/key-management evidence, backup/restore tests and vulnerability records.
- Incident register, response playbook and Board/user/customer notification templates.
- Applicable tax invoices, accounting records and a legally reviewed retention schedule.
- Separate marketing consent and durable unsubscribe enforcement if marketing is introduced.

## Response clocks and retention

| Item | Working rule |
| --- | --- |
| Grievance acknowledgment | Cursis commitment: within 72 hours; online receipt is immediate |
| Grievance resolution | Cursis commitment: within 30 calendar days; final DPDP Rule 14 permits a published period up to 90 days when effective |
| GDPR rights where applicable | Normally within one month; do not substitute 30 days automatically |
| DPDP breach where applicable | Board and affected individuals without delay; fuller Board update within 72 hours under final Rule 7 |
| CERT-In covered incidents | Separate six-hour reporting requirement |
| Account erasure | Prompt eligible cleanup; 90-day operational completion target is subject to applicable shorter duties and mandatory retention |
| Processing/security retention | Assess final Rules 6/8 one-year requirements and commencement, plus CERT-In's covered 180-day ICT-log/localisation duty |
| GST records if applicable | 72 months from the relevant annual-return due date, with proceedings exceptions |
| Company books if applicable later | Separate eight-financial-year assessment; do not assume an unregistered individual is already a company |

Sources for separate duties: [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679), [CERT-In directions](https://www.cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf), [GST Act](https://cbic-gst.gov.in/pdf/CGST-Act-Updated-31082021.pdf), [Companies Act Section 128](https://www.incometaxindia.gov.in/w/section-128-81).

## Highest priority before publication

1. Supply the business contact address and verify official@cursis.in delivery/monitoring.
2. Configure the stable privacy block key, worker secret, scheduler and alerts.
3. Verify actual providers, regions, contracts, encryption and backups. Public cursis.in accepts both TLS 1.3 and 1.2; TLS 1.3-only enforcement and universal AES-256 storage are not established.
4. Approve legal retention and run a complete rights/erasure/provider/restore exercise.
5. Resolve legacy children/consent records and provide required notice/consent language support.
6. Review broader business, tax and consumer obligations with a qualified adviser.

Detailed implementation findings: DPDP_COMPLIANCE_AUDIT.md. Operator procedures: PRIVACY_OPERATIONS.md. Incident templates: INCIDENT_RESPONSE_PLAYBOOK.md. Customer terms: DATA_PROCESSING_ADDENDUM.md.
