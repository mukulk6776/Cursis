# Cursis personal data incident response playbook

Owner: named grievance/security lead once appointed. Backup: designated engineering lead. Maintain a tested on-call channel and restricted incident register outside affected systems. This playbook does not automatically send messages or file regulatory reports.

## Detect and contain

Record first awareness in UTC and India time, source, affected services, suspected personal data, tenant scope and current evidence. Open an incident ID, appoint incident commander, privacy lead and communications owner. Preserve immutable evidence with access controls and chain of custody; do not copy tokens or full production datasets into chat/issues.

Contain the affected path, isolate compromised hosts, revoke/rotate exposed credentials, block malicious access and preserve relevant logs before destructive recovery. Assess identity-provider sessions, database credentials, integration secrets, AI prompt exposure, provider copies and cross-tenant access. Do not wait for a complete forensic report before required notifications.

## Applicable clocks and responsibilities

When DPDP breach duties apply: notify the Board and affected Data Principals without delay; final Rule 7 requires a fuller Board update within 72 hours unless the Board grants longer. Initial notification is not delayed until the 72-hour update. DPDP does not import GDPR's risk threshold. Confirm the Act/Rules commencement and current official filing channel; record counsel's decision without using uncertainty as a reason to delay a duty already applicable.

For covered reportable cyber incidents under [CERT-In directions](https://www.cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf), assess the separate six-hour reporting clock immediately. See the official [FAQ](https://www.cert-in.org.in/PDF/FAQs_on_CyberSecurityDirections_May2022.pdf); incomplete information may be supplemented. The DPDP clock does not replace it.

Where [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679) applies: controller authority notification is generally within 72 hours unless unlikely to risk rights/freedoms; high risk requires affected-person communication without undue delay, subject to the Regulation's exceptions. A processor informs the controller without undue delay. Assess the relevant authority and document delays/exceptions.

Notify enterprise fiduciaries/controllers promptly under their contracts, with enough information for their shortest reporting duty. If Cursis also acts as fiduciary for affected data, fulfil its own duties separately. Regulatory and contractual clocks run concurrently.

## Initial Board notification template

Incident ID: [ID]
Reporting legal entity and role: [verified entity / fiduciary]
Accountable contact: [name, title, business email, phone]
Awareness timestamp: [UTC and IST]
Occurrence window and location: [known / estimated / unknown]
Nature, scope and affected systems: [facts]
Personal data categories and affected principals/tenants: [known counts / estimates]
Likely impact: [confidentiality, integrity, availability; likely harm]
Containment and safeguards: [completed / ongoing]
Affected-person notifications: [channels and timing]
Next update: [within applicable deadline]
Filing channel and submission receipt: [official verified route / receipt]

Provide facts currently known, distinguish estimates, and list unresolved questions. Keep the submitted version and delivery acknowledgment.

## Detailed Board update within 72 hours

Include the updated nature/extent/timing/location; events, circumstances and reasons; risk mitigation implemented/planned; findings about the actor if known; recurrence-prevention actions; and report of notifications to affected people. Record any written extension request and the Board's approval. An extension request alone does not change the deadline.

## Affected-person notice template

Subject: Important information about your Cursis personal data

We discovered [incident] on [date/time]. It occurred [window] and affected [specific data associated with this person]. [What is known / still being investigated.]

This may cause [plain-language consequences relevant to the person]. We have [containment and mitigation] and are [next steps]. You can protect yourself by [specific practical steps; never ask users to send passwords or pay].

For help, contact [named person, title, monitored email/phone]. Your incident reference is [ID]. We will update you by [channel] as material facts become available.

Deliver through the person's registered contact/account using accessible language. Notify through another trustworthy channel if their account is compromised. Track delivery and failures, retry and document alternatives. Never expose other recipients with a CC list. Do not claim “no data accessed” or “fully secure” without supporting evidence.

## Recover and learn

Restore from known-good backups into an isolated environment, apply account deletion/consent blocks, rotate secrets and verify tenant isolation before reconnecting. Retain incident evidence on an approved restricted schedule consistent with applicable log duties and holds.

Within 7 days, review root cause, missing detections and provider responsibility. Assign remediation owners/dates and verify completion. Update the notice, provider register, threat model and processing instructions if flows changed. Conduct a tabletop exercise before launch and at least every six months.
