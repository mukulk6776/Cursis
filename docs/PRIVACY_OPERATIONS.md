# Cursis privacy operations runbook

The code creates workflows, not a staffed privacy function. Appoint an accountable owner before deployment. Use restricted database/operator access; never expose a general MongoDB admin endpoint to customers.

## Configuration and deployment

Set PRIVACY_LEGAL_ENTITY, PRIVACY_POSTAL_ADDRESS, PRIVACY_OFFICER_NAME, PRIVACY_OFFICER_TITLE, PRIVACY_OFFICER_EMAIL, PRIVACY_TOMBSTONE_SECRET (stable random 32+ characters), PRIVACY_CRON_SECRET (different random 32+ characters), and the exact public NEXT_PUBLIC_APP_URL. Confirm all existing AUTH/FIREBASE/MongoDB credentials separately. Do not put secrets in NEXT_PUBLIC variables.

Use the existing database with a least-privilege service user; privacy operations intentionally fail without it. Back up and test migration in staging. New privacy data must not enter log payloads.

Schedule a daily POST to /api/privacy/maintenance with Authorization: Bearer <PRIVACY_CRON_SECRET>. This is not a Vercel cron GET route. Monitor failed requests, HTTP 503, overdue counts, retry jobs, awaiting_external_review and awaitingRetentionReview; alert a staffed owner and escalation backup. The response is not itself an email notification.

Run maintenance once to create unique nominee/erasure indexes and expiry indexes; establish a unique users.uid index through the existing index setup. Request erasure also ensures the job index before upsert. Existing duplicate nominee rows must be reconciled before enabling its unique index.

## Daily rights and grievance review

Read privacy_requests in a restricted console. Each authenticated online request gets an immediate acknowledgment and reference. Reply to emailed requests within 72 hours, verify receipt time, and record them in the same register; email ingestion is manual. Assign an owner and resolve within 30 calendar days, subject to applicable faster rights rules (GDPR normally one month, not exactly 30 days). Do not reset the receipt date while seeking clarification. Use appropriate identity checks, not blanket Aadhaar collection.

For access, supplement the JSON download with a processing summary, exact recipients and other accessible personal data from business tables/provider records, after other-person review. For correction, propagate to relevant processors/customer records. For objection/restriction, isolate disputed processing and document the outcome. Include the named contact in every reply and explain management escalation, then Board complaint route when applicable after internal redress.

Example mongosh queries (operator only):

```javascript
db.privacy_requests.find({status: {$ne: "resolved"}}).sort({resolveBy: 1});
db.privacy_requests.updateOne({id: "<verified-request-id>"}, {$set: {
  status: "resolved", resolvedAt: new Date(), operatorId: "<staff-id>",
  outcomeReference: "<restricted-response-evidence-id>"
}});
db.privacy_erasures.find({status: {$ne: "completed"}}).sort({dueAt: 1});
```

Privacy request/consent expiresAt indexes implement a 12-month-from-recording baseline. Approved holds must remove expiresAt and record legal reason, owner and review date before expiry; clear holds and reinstate the correct expiry after review. Reassess this baseline against final Rules 6/8, claims requirements and effective dates. The job ledger/blocks do not auto-expire and need explicit review.

## Nomination

The stored representative is not a second account and receives no bearer token. For a claim, verify the principal, claimant, nomination, death/incapacity and applicable guardian authority through an agreed secure channel. Record verification outcome without retaining excessive identity documents. Route customer-controlled records to the customer; disclose only the rights-related response. Update/remove nominations on the principal's instructions.

## Erasure and retention review

An accepted self-service request persists a job, creates durable HMAC blocks for UID and email, clears this browser's account caches and stops API authentication. Signed and Firebase session exchange and new signup also check blocks. Other devices and provider identities still need revocation. A stable tombstone secret must survive restarts and key rotations.

The active worker waits for a legal-review approval. Determine the relevant final Rules 6/8 effective-date duties, CERT-In logs, finance retention, customer shared records and specific holds. Isolate any mandatory retained copy in a restricted archive with owner, statutory basis and purge date before approving active cleanup. No archive is created automatically.

```javascript
db.privacy_erasures.updateOne({id: "<verified-job-id>", status: "pending"}, {$set: {
  legalReview: {approved: true, approvedAt: new Date(),
    reviewer: "<staff-id>", reference: "<retention-disposition-evidence-id>"}
}});
```

Call scheduled maintenance; it claims one approved job per call with a 10-minute retry lease. Bounded jobs must finish before lease expiry; use a dedicated worker/renewal and pagination for large tenants before production use. Re-running deletes is safe. Status becomes awaiting_external_review, never completed solely from active deletion.

Review shared/free-text references, audit logs, CRM subjects, authored content, voucher records, private notification caches, model context copies and unknown collections. Document each necessary restriction, redaction, lawful retention or controller referral. Personal scopes and workspaceCollections in lib/privacy/data.ts are the query manifest; extend them whenever a new collection is added. Do not add broad email-regex deletion or delete an entire shared workspace.

Fulfil each job externalTasks entry: Firebase account/refresh-token revocation, Resend records, both AI providers, host/CDN logs, integrations, backups/restore blocks, restricted legal archives and other process/device caches. Use official deletion/revocation APIs or provider-confirmed retention expiration; evidence must identify scope, request time, response and final disposition. Never send unverified bulk deletion instructions to providers.

Only after evidence review, mark completed, record completedAt and evidence references, minimise/unset raw uid/email in the job and retain only the keyed block/audit evidence for an approved reviewed period. Do not remove the block while old credentials or backups could resurrect the account. Communicate any legally retained categories and final purge dates. Plan a secure re-registration process separately; blocks currently require operator review.

## Retention jobs still needing activation

The worker does not invent last-substantive-response dates or provider storage settings. Deploy inquiry/proposal expiration using an authoritative last-contact field, business-content retention jobs and restricted archive final purge jobs after legal approval. Configure host, MongoDB snapshots, object stores and each provider directly. Signed session and cookie-choice expiry are application controls; they do not erase infrastructure logs.

## Security evidence

Inspect actual TLS handshakes for each public/API/DB/service hop; one TLS 1.3 handshake proves negotiation, not TLS 1.3-only enforcement. Test prohibited versions separately. HSTS does not select a cipher/protocol.

Obtain hosting and database encryption settings, algorithm/key identifiers, disk/snapshot/object encryption, KMS access/rotation policies and restoration evidence. Raw integration config needs a secret vault or AES-256-GCM envelope encryption with a managed key and migration; password hashing is not disk encryption. Keep screenshots/config exports and dates in a restricted evidence store, not this public repository.

Run monthly access reviews and a staged recovery/deletion-block test. Resolve placeholder identity/address and security claims throughout policies/email templates before publication.
