export const PRIVACY_VERSION = '2026-10-18';
export const privacyContact = {
  entity: process.env.PRIVACY_LEGAL_ENTITY || 'Saransh Vashistha, operating as Cursis',
  address: process.env.PRIVACY_POSTAL_ADDRESS || 'Business contact address awaiting confirmation',
  name: process.env.PRIVACY_OFFICER_NAME || 'Saransh Vashistha',
  title: process.env.PRIVACY_OFFICER_TITLE || 'Operator and Grievance Contact',
  email: process.env.PRIVACY_OFFICER_EMAIL || 'official@cursis.in',
};

// Code-observed recipients. Hosting region, contracts and activation need an operator audit.
export const providers = [
  ['MongoDB / MongoDB Atlas', 'Account profiles, password hashes and salts, workspace records, messages, AI history, integration configuration, privacy requests.', 'Database; Atlas is configurable, production location unverified.'],
  ['Google Firebase Authentication', 'Google identity, email, name, avatar, ID tokens, browser/device and connection metadata.', 'Identity provider when Google sign-in is used.'],
  ['Google Gemini API', 'Prompts, selected workspace context, document inputs and outputs, meeting information sent to AI features.', 'Only on configured AI requests; contract, training terms and region require approval.'],
  ['Groq', 'Prompts, conversation context, tool inputs and AI outputs.', 'Configured AI requests and fallback; approve both providers before use.'],
  ['Resend', 'Recipient addresses, invitation/notification content, delivery metadata.', 'Configured transactional email.'],
  ['Deployment / CDN operator (unconfirmed)', 'IP address, URL, headers, session cookie at the application, application responses and operational logs.', 'Vercel-compatible configuration is present; actual host and log settings need confirmation.'],
  ['Customer-configured integrations', 'Selected contact, invoice, contract, calendar and webhook payloads plus credentials.', 'Intuit QuickBooks, Salesforce, DocuSign, Google Calendar or a custom webhook, only when configured.'],
  ['Linked websites / image hosts', 'Preview URL and server IP for link previews; viewer IP and browser headers for remote images.', 'User-selected URLs, Google avatar and Unsplash image hosts.'],
] as const;

export const collectionMatrix = [
  ['Onboarding progress, email preferences and report delivery records', 'Show your first-week checklist, deliver weekly owner reports and optionally a daily assigned-task digest; unsubscribe or turn these off in notification settings.', 'MongoDB workspace_activation, workspace_email_preferences, workspace_email_deliveries; Resend for delivery. Reports use saved task data.'],
  ['Pending CSV task import', 'Preview and safely retry the task batch you requested.', 'Browser sessionStorage, scoped to your account and workspace, removed after confirmed import or when the browser tab closes; imported tasks are saved in MongoDB.'],
  ['Signup source, when analytics is accepted', 'Attribute a new workspace signup to the Ordis demo.', 'Optional browser sessionStorage for 30 minutes; users.signupSource and consent timestamp after sign-in.'],
  ['Email, name, avatar, user ID', 'Create and identify your account, show your profile and send service messages.', 'Signup, Google sign-in, profile; MongoDB/Firebase.'],
  ['Password hash and random salt', 'Verify password login. Plaintext passwords are transient request inputs and must never be logged.', 'Password signup/login; MongoDB.'],
  ['Session / identity tokens', 'Authenticate requests. Tokens contain identifiers; they are credentials.', 'HTTP-only session cookie, browser auth storage, Firebase verification.'],
  ['IP, browser headers, timestamps, rate-limit keys', 'Deliver pages, prevent abuse and investigate incidents.', 'Hosting, authentication, link preview and unsubscribe endpoints.'],
  ['Tasks, projects, CRM contacts, emails, documents, meeting notes, chat and AI inputs/outputs', 'Deliver the workspace and the AI features you request.', 'Dashboard/API; MongoDB and configured AI/integration providers.'],
  ['Integration credentials, endpoints and payloads', 'Carry out explicitly configured external actions.', 'Integration settings/API; MongoDB and the selected destination.'],
  ['Inquiry name/company, email, service, budget, requirements and generated proposal', 'Respond to a custom-build request.', 'Agency contact form/API; MongoDB.'],
  ['Consent choices, version, age attestation, nominee name/email, grievance and erasure requests', 'Record choices and handle privacy rights.', 'Signup and privacy centre; MongoDB.'],
  ['Cookie choices and local application preferences', 'Remember choices; optional analytics only after opt-in.', 'Browser localStorage/cookies. No analytics SDK was identified in this audit.'],
  ['Contact name/email/message and newsletter email/consent', 'Reply to inquiries; send product updates only after separate newsletter opt-in.', 'Contact form and footer; MongoDB marketing_contacts and marketing_subscribers. See the retention schedule in this notice.'],
  ['Anonymous daily event totals', 'Measure public-page engagement after analytics opt-in; no visitor identifiers or form values.', 'MongoDB marketing_event_totals; operational request logs are controlled separately by the host.'],
] as const;
