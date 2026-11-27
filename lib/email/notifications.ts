import { Resend } from 'resend';

const SANDBOX_FROM_EMAIL = 'Cursis <onboarding@resend.dev>';
const ADMIN_EMAIL = 'cursis.in@gmail.com';

function cleanEnvValue(value?: string): string {
  return String(value || '').trim().replace(/^["']|["']$/g, '').trim();
}

function isPlaceholderValue(value: string): boolean {
  if (!value) return true;
  return /^(re_xxx|your[-_]|changeme|placeholder|example)/i.test(value) || value.includes('your-verified-domain');
}

export function getResendClient(): Resend | null {
  const apiKey = cleanEnvValue(process.env.RESEND_API_KEY);
  if (!apiKey || isPlaceholderValue(apiKey)) return null;
  return new Resend(apiKey);
}

export function getFromEmail(): string {
  const configured = cleanEnvValue(process.env.RESEND_FROM_EMAIL);
  if (configured && !isPlaceholderValue(configured)) {
    return configured;
  }
  return SANDBOX_FROM_EMAIL;
}

export const FROM_EMAIL = getFromEmail();

export function getContactRecipients(): string[] {
  const raw = [
    process.env.CONTACT_TO_EMAIL,
    process.env.ADMIN_EMAIL,
    process.env.SOVEREIGN_FOUNDER_EMAIL,
    process.env.PRIVACY_OFFICER_EMAIL,
    'official@cursis.in',
    ADMIN_EMAIL,
  ];
  const seen = new Set<string>();
  const recipients: string[] = [];
  for (const item of raw) {
    const cleaned = cleanEnvValue(item).toLowerCase();
    if (!cleaned || isPlaceholderValue(cleaned) || !cleaned.includes('@') || seen.has(cleaned)) continue;
    seen.add(cleaned);
    recipients.push(cleaned);
  }
  return recipients;
}

async function sendResendEmail(
  payload: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    replyTo?: string;
  },
  idempotencyKey?: string
): Promise<{ sent: boolean; error?: string }> {
  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not configured' };
  }

  const from = getFromEmail();
  const options = idempotencyKey ? { idempotencyKey } : undefined;
  const emailPayload = {
    from,
    to: payload.to,
    subject: payload.subject,
    ...(payload.text ? { text: payload.text } : {}),
    ...(payload.html ? { html: payload.html } : {}),
    ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
  } as Parameters<Resend['emails']['send']>[0];

  const firstAttempt = await client.emails.send(emailPayload, options);
  if (!firstAttempt.error) {
    return { sent: true };
  }

  const errMsg = firstAttempt.error.message || 'Resend delivery failed';
  const isDomainError = /domain|verify|verified/i.test(errMsg);
  if (isDomainError && from !== SANDBOX_FROM_EMAIL) {
    console.warn(`[resend] Configured sender "${from}" failed domain check (${errMsg}); retrying via ${SANDBOX_FROM_EMAIL}`);
    const fallbackAttempt = await client.emails.send(
      { ...emailPayload, from: SANDBOX_FROM_EMAIL } as Parameters<Resend['emails']['send']>[0],
      options
    );
    if (!fallbackAttempt.error) {
      return { sent: true };
    }
    const fallbackMsg = fallbackAttempt.error.message || errMsg;
    console.warn(`[resend] Fallback send failed: ${fallbackMsg}`);
    return { sent: false, error: fallbackMsg };
  }

  console.warn(`[resend] Send failed: ${errMsg}`);
  return { sent: false, error: errMsg };
}

export function isResendConfigured(): boolean {
  return Boolean(getResendClient());
}

export async function sendProgressEmail(payload: { to: string; subject: string; text: string }, idempotencyKey: string) {
  if (!isResendConfigured()) throw new Error('Progress email is not configured');
  const result = await sendResendEmail(payload, idempotencyKey);
  if (!result.sent) throw new Error(result.error || 'Progress email delivery failed');
}

export function isPasswordResetEmailConfigured(): boolean {
  return isResendConfigured();
}

export function isVerificationEmailConfigured(): boolean {
  return isResendConfigured();
}

export async function sendPasswordResetEmail(email: string, code: string): Promise<void> {
  if (!isPasswordResetEmailConfigured()) throw new Error('Reset email is unavailable');
  const result = await sendResendEmail({
    to: email,
    subject: 'Your Cursis password reset code',
    text: `Your Cursis password reset code is ${code}. It expires in 10 minutes and can only be used once. If you did not request this, you can ignore this email. Never share this code.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#FAF6EE;color:#0A0A0A;border:3px solid #0A0A0A;border-radius:16px;box-shadow:6px 6px 0 #0A0A0A"><h1 style="font-size:24px;margin-top:0">Reset your Cursis password.</h1><p>Enter this code on the Forgot Password page:</p><p style="font-size:32px;font-weight:800;letter-spacing:8px;padding:16px;background:#FF5500;color:#FFFFFF;border:2px solid #0A0A0A;border-radius:12px;text-align:center">${code}</p><p>This code expires in 10 minutes and can only be used once.</p><p>If you did not request this, you can ignore this email. Never share this code.</p></div>`,
  });
  if (!result.sent) throw new Error(result.error || 'Reset email could not be sent');
}

export async function sendAdminVerificationEmail(email: string, code: string): Promise<void> {
  if (!isVerificationEmailConfigured()) throw new Error('Verification email is unavailable');
  const result = await sendResendEmail({
    to: email,
    subject: 'Verify your Cursis administrator email',
    text: `Your Cursis administrator verification code is ${code}. It expires in 10 minutes and can only be used once. If you did not try to access the Cursis Admin Console, ignore this message.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#FAF6EE;color:#0A0A0A;border:3px solid #0A0A0A;border-radius:16px;box-shadow:6px 6px 0 #0A0A0A"><h1 style="font-size:22px;margin-top:0;">Verify your Cursis email</h1><p>Enter this 6-digit verification code to confirm ownership of your account:</p><p style="font-size:32px;font-weight:800;letter-spacing:8px;padding:16px;background:#FF5500;color:#FFFFFF;border:2px solid #0A0A0A;border-radius:12px;text-align:center;">${code}</p><p style="font-size:13px;color:#4A4A4A;">This code expires in 10 minutes and can only be used once.</p></div>`,
  });
  if (!result.sent) throw new Error(result.error || 'Verification email could not be sent');
}

export const CURSIS_PHYSICAL_ADDRESS = {
  company: process.env.PRIVACY_LEGAL_ENTITY || 'Saransh Vashistha and Mukul Kumar, operating as Cursis',
  addressLine1: process.env.PRIVACY_POSTAL_ADDRESS || 'Business contact address awaiting confirmation',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  usComplianceAgent: '',
};

export function getCanspamEmailFooter(recipientEmail?: string): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://cursis.in').replace(/\/$/, '');
  const encodedEmail = recipientEmail ? encodeURIComponent(recipientEmail) : '';
  const unsubscribeUrl = `${appUrl}/unsubscribe${encodedEmail ? `?email=${encodedEmail}` : ''}`;

  return `
    <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #eaeaea; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; line-height: 1.6; color: #737373; text-align: center;">
      <p style="margin: 0 0 6px 0; font-weight: 600; color: #404040;">
        ${escapeHtml(CURSIS_PHYSICAL_ADDRESS.company)}
      </p>
      <p style="margin: 0 0 6px 0;">
        ${escapeHtml(CURSIS_PHYSICAL_ADDRESS.addressLine1)}, ${escapeHtml(CURSIS_PHYSICAL_ADDRESS.city)}, ${escapeHtml(CURSIS_PHYSICAL_ADDRESS.postalCode)}, ${escapeHtml(CURSIS_PHYSICAL_ADDRESS.country)}<br />
      </p>
      <p style="margin: 0 0 10px 0; color: #999;">
        This email was sent in compliance with the CAN-SPAM Act of 2003 (15 U.S.C. § 7704).
      </p>
      <p style="margin: 0;">
        <a href="${escapeHtml(unsubscribeUrl)}" style="color: #FF5500; text-decoration: underline; font-weight: 600;">Unsubscribe from marketing emails</a>
        &nbsp;&nbsp;•&nbsp;&nbsp;
        <a href="${escapeHtml(appUrl)}/dashboard/settings" style="color: #737373; text-decoration: underline;">Notification Preferences</a>
        &nbsp;&nbsp;•&nbsp;&nbsp;
        <a href="${escapeHtml(appUrl)}/privacy" style="color: #737373; text-decoration: underline;">Privacy Policy</a>
      </p>
    </div>
  `;
}

export function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface CustomClientWorkspaceData {
  workspaceId: string;
  workspaceName: string;
  ownerUserId: string;
  ownerEmail?: string;
  ownerName?: string;
  industry?: string;
  teamSize?: string;
  features?: string[];
  tier?: string;
  createdAt: string;
}

/**
 * Sends an email notification to the admin when a custom client workspace is created
 */
export async function notifyAdminCustomClientWorkspace(data: CustomClientWorkspaceData): Promise<void> {
  if (!isResendConfigured()) {
    console.warn('Resend API key not configured, skipping admin notification email');
    return;
  }

  try {
    const safeWsId = escapeHtml(data.workspaceId);
    const safeWsName = escapeHtml(data.workspaceName);
    const safeTier = escapeHtml(data.tier || 'free');
    const safeIndustry = escapeHtml(data.industry);
    const safeTeamSize = escapeHtml(data.teamSize);
    const safeOwnerId = escapeHtml(data.ownerUserId);
    const safeOwnerName = escapeHtml(data.ownerName);
    const safeOwnerEmail = escapeHtml(data.ownerEmail);

    const recipients = getContactRecipients();
    const primaryRecipient = recipients[0] || ADMIN_EMAIL;

    const emailContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #FF5500; border-bottom: 2px solid #FF5500; padding-bottom: 10px;">
          New Custom Client Workspace Created
        </h2>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Workspace Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 150px;">Workspace ID:</td>
              <td style="padding: 8px 0;">${safeWsId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Workspace Name:</td>
              <td style="padding: 8px 0;">${safeWsName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Tier:</td>
              <td style="padding: 8px 0;">${safeTier}</td>
            </tr>
            ${data.industry ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Industry:</td>
              <td style="padding: 8px 0;">${safeIndustry}</td>
            </tr>
            ` : ''}
            ${data.teamSize ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Team Size:</td>
              <td style="padding: 8px 0;">${safeTeamSize}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Created At:</td>
              <td style="padding: 8px 0;">${escapeHtml(new Date(data.createdAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
              }))}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Owner Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 150px;">User ID:</td>
              <td style="padding: 8px 0;">${safeOwnerId}</td>
            </tr>
            ${data.ownerName ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Name:</td>
              <td style="padding: 8px 0;">${safeOwnerName}</td>
            </tr>
            ` : ''}
            ${data.ownerEmail ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${safeOwnerEmail}" style="color: #FF5500;">${safeOwnerEmail}</a></td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${data.features && data.features.length > 0 ? `
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Selected Features</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${data.features.map(feature => `<li style="padding: 4px 0;">${escapeHtml(feature)}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />

        <p style="font-size: 12px; color: #999;">
          This is an automated notification from Cursis. A new custom client workspace has been created and requires your attention.
        </p>
        ${getCanspamEmailFooter(primaryRecipient)}
      </div>
    `;

    const result = await sendResendEmail({
      to: primaryRecipient,
      replyTo: data.ownerEmail || undefined,
      subject: `New Custom Client Workspace: ${data.workspaceName}`,
      html: emailContent,
    });

    if (!result.sent) {
      console.error('Resend API returned error for admin notification:', result.error);
      return;
    }

    console.log(`Admin notification email sent for workspace: ${data.workspaceId}`);
  } catch (error) {
    console.error('Failed to send admin notification email:', error);
  }
}

/**
 * Sends a welcome email to the workspace owner
 */
export async function sendWorkspaceWelcomeEmail(
  email: string,
  workspaceName: string,
  ownerName?: string
): Promise<void> {
  if (!isResendConfigured()) {
    console.warn('Resend API key not configured, skipping welcome email');
    return;
  }

  try {
    const safeWsName = escapeHtml(workspaceName);
    const safeOwner = escapeHtml(ownerName || 'there');
    const safeAppUrl = escapeHtml(process.env.NEXT_PUBLIC_APP_URL || 'https://cursis.in');

    const result = await sendResendEmail({
      to: email,
      subject: `Welcome to ${workspaceName} on Cursis!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #FF5500;">Welcome to ${safeWsName}!</h2>
          <p>Hi ${safeOwner},</p>
          <p>Your workspace <strong>${safeWsName}</strong> has been successfully created on Cursis!</p>
          <p>You can now start inviting team members, managing projects, and leveraging the power of AI-assisted workflows.</p>
          <div style="margin: 30px 0;">
            <a href="${safeAppUrl}/dashboard"
               style="background-color: #FF5500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">
            Questions? Reach out to us at <a href="mailto:official@cursis.in" style="color: #FF5500;">official@cursis.in</a>
          </p>
          ${getCanspamEmailFooter(email)}
        </div>
      `,
    });

    if (!result.sent) {
      console.error('Resend error sending welcome email:', result.error);
    }
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

/**
 * Sends an invitation email to a prospective or registered team member
 */
export async function sendWorkspaceInvitationEmail({
  to,
  workspaceName,
  recipientName,
  inviterName,
  assignedRole,
  reqHost,
}: {
  to: string;
  workspaceName: string;
  recipientName?: string;
  inviterName?: string;
  assignedRole?: string;
  reqHost?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isResendConfigured()) {
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const safeWsName = escapeHtml(workspaceName);
    const safeRecipient = escapeHtml(recipientName || 'there');
    const safeInviter = escapeHtml(inviterName || 'Workspace Admin');
    const safeRole = assignedRole === 'admin' ? 'Workspace Admin' : 'Team Member';

    const cleanHost = reqHost ? reqHost.replace(/[^a-zA-Z0-9.:-]/g, '') : 'localhost:3000';
    const protocol = cleanHost.includes('localhost') ? 'http' : 'https';
    const inviteLink = `${protocol}://${cleanHost}/dashboard?invited=true`;
    const safeInviteLink = escapeHtml(inviteLink);

    const result = await sendResendEmail({
      to,
      subject: `You've been invited to join ${workspaceName} on Cursis`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #FF5500;">You've been invited to ${safeWsName}!</h2>
          <p>Hi ${safeRecipient},</p>
          <p><strong>${safeInviter}</strong> has invited you to join <strong>${safeWsName}</strong> as a <strong>${safeRole}</strong>.</p>
          <p>Open your Cursis dashboard to accept or decline the invitation:</p>
          <div style="margin: 30px 0;">
            <a href="${safeInviteLink}" style="background-color: #FF5500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Invitation</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">If you were not expecting this invitation, you can safely ignore this email.</p>
          ${getCanspamEmailFooter(to)}
        </div>
      `,
    });

    if (!result.sent) {
      return { success: false, error: result.error || 'Resend delivery error' };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Failed to dispatch invitation email:', err?.message);
    return { success: false, error: err?.message || 'Email dispatch exception' };
  }
}

/**
 * Sends a Slack-style activity notification email to the project leader
 * when a teammate makes an update inside a project.
 */
export async function sendProjectActivityNotificationEmail({
  to,
  leaderName,
  projectName,
  updaterName,
  action,
  detail,
  projectUrl,
}: {
  to: string;
  leaderName?: string;
  projectName: string;
  updaterName: string;
  action: string;
  detail: string;
  projectUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isResendConfigured()) {
    console.warn('Resend API key not configured, skipping project activity email');
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const safeLeader = escapeHtml(leaderName || 'Project Lead');
    const safeProject = escapeHtml(projectName);
    const safeUpdater = escapeHtml(updaterName);
    const safeAction = escapeHtml(action);
    const safeDetail = escapeHtml(detail);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://cursis.in').replace(/\/$/, '');
    const safeUrl = escapeHtml(projectUrl || `${appUrl}/dashboard`);

    const result = await sendResendEmail({
      to,
      subject: `[${projectName}] ${updaterName} ${action}: ${detail}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; color: #111827; background: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #FF5500;"></div>
            <span style="font-size: 12px; font-weight: 700; color: #FF5500; text-transform: uppercase; letter-spacing: 0.05em;">Project Activity Alert</span>
          </div>

          <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">
            Update in <strong>${safeProject}</strong>
          </h2>

          <p style="font-size: 14px; line-height: 1.5; color: #374151; margin: 0 0 16px 0;">
            Hi ${safeLeader},<br />
            <strong>${safeUpdater}</strong> just ${safeAction} inside <strong>${safeProject}</strong>:
          </p>

          <div style="background: #F9FAFB; border-left: 3px solid #FF5500; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="font-size: 14px; font-weight: 600; color: #111827; margin: 0;">
              ${safeDetail}
            </p>
          </div>

          <div style="margin: 24px 0;">
            <a href="${safeUrl}" style="background-color: #FF5500; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; display: inline-block;">
              View in Project Board →
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0 16px 0;" />
          <p style="font-size: 11px; color: #6B7280; margin: 0;">
            You received this notification because you are a lead or member of <strong>${safeProject}</strong> on CURSIS.
          </p>
          ${getCanspamEmailFooter(to)}
        </div>
      `,
    });

    if (!result.sent) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Failed to dispatch project activity notification email:', err?.message);
    return { success: false, error: err?.message };
  }
}

/**
 * Delivers an email independently to each team recipient so one sandbox-restricted
 * address does not block delivery to the verified team inbox.
 */
async function sendToTeamRecipients(payload: {
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): Promise<{ deliveredCount: number; lastError?: string }> {
  const recipients = getContactRecipients();
  let deliveredCount = 0;
  let lastError: string | undefined;

  for (const recipient of recipients) {
    const res = await sendResendEmail({
      to: recipient,
      replyTo: payload.replyTo,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    if (res.sent) {
      deliveredCount++;
    } else if (res.error) {
      lastError = res.error;
    }
  }

  return { deliveredCount, lastError };
}

/**
 * Sends Contact Us form submissions to the Cursis team and emails a receipt
 * confirmation to the sender via Resend.
 */
export async function sendContactInquiryEmails({
  name,
  email,
  message,
  inquiryId,
}: {
  name: string;
  email: string;
  message: string;
  inquiryId?: string;
}): Promise<{ sent: boolean; teamDelivered: number; confirmationSent: boolean; error?: string }> {
  if (!isResendConfigured()) {
    return { sent: false, teamDelivered: 0, confirmationSent: false, error: 'Resend API key not configured' };
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');
  const safeId = escapeHtml(inquiryId || 'web-contact');
  const appUrl = escapeHtml((process.env.NEXT_PUBLIC_APP_URL || 'https://cursis.in').replace(/\/$/, ''));

  const teamResult = await sendToTeamRecipients({
    replyTo: email,
    subject: `[Cursis Contact] Message from ${name}`,
    text: `New Contact Us inquiry (${inquiryId || 'web-contact'})\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px;background:#FAF6EE;color:#0A0A0A;border:3px solid #0A0A0A;border-radius:16px;box-shadow:6px 6px 0 #0A0A0A;">
        <div style="display:inline-block;padding:4px 10px;background:#FF5500;color:#FFFFFF;font-size:11px;font-weight:800;text-transform:uppercase;border:1.5px solid #0A0A0A;border-radius:6px;margin-bottom:14px;">New Contact Inquiry</div>
        <h2 style="margin:0 0 12px;font-size:20px;">Message from ${safeName}</h2>
        <p style="margin:0 0 8px;font-size:13px;"><strong>From:</strong> ${safeName} (<a href="mailto:${safeEmail}" style="color:#FF5500;">${safeEmail}</a>)</p>
        <p style="margin:0 0 16px;font-size:12px;color:#525252;"><strong>Reference:</strong> ${safeId}</p>
        <div style="background:#FFFFFF;border:2px solid #0A0A0A;border-radius:12px;padding:16px;font-size:14px;line-height:1.6;">
          ${safeMessage}
        </div>
        <p style="margin:16px 0 0;font-size:12px;color:#525252;">Reply directly to this email to respond to ${safeName}.</p>
      </div>
    `,
  });

  const confirmResult = await sendResendEmail({
    to: email,
    replyTo: getContactRecipients()[0] || 'official@cursis.in',
    subject: 'We received your message — Cursis Support',
    text: `Hi ${name},\n\nThanks for contacting Cursis. We received your message (Ref: ${inquiryId || 'web-contact'}) and our team will respond shortly.\n\nVisit ${process.env.NEXT_PUBLIC_APP_URL || 'https://cursis.in'} for workspace access.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#FAF6EE;color:#0A0A0A;border:3px solid #0A0A0A;border-radius:16px;box-shadow:6px 6px 0 #0A0A0A;">
        <h2 style="margin:0 0 12px;font-size:22px;">Thanks for reaching out, ${safeName}.</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">We received your message and routed it to our team. We typically reply within 1 business day.</p>
        <div style="background:#FFFFFF;border:2px solid #0A0A0A;border-radius:12px;padding:14px;font-size:13px;line-height:1.5;margin-bottom:18px;">
          <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#737373;margin-bottom:6px;">Your Message (Ref: ${safeId})</div>
          ${safeMessage}
        </div>
        <a href="${appUrl}" style="display:inline-block;padding:10px 18px;background:#FF5500;color:#FFFFFF;font-weight:700;text-decoration:none;border:2px solid #0A0A0A;border-radius:10px;">Back to Cursis</a>
      </div>
    `,
  });

  return {
    sent: teamResult.deliveredCount > 0 || confirmResult.sent,
    teamDelivered: teamResult.deliveredCount,
    confirmationSent: confirmResult.sent,
    error: teamResult.deliveredCount === 0 && !confirmResult.sent ? (confirmResult.error || teamResult.lastError) : undefined,
  };
}

/**
 * Sends a confirmation email when a visitor subscribes to newsletter updates.
 */
export async function sendNewsletterSubscriptionEmail(email: string): Promise<{ sent: boolean; error?: string }> {
  if (!isResendConfigured()) {
    return { sent: false, error: 'Resend API key not configured' };
  }
  const appUrl = escapeHtml((process.env.NEXT_PUBLIC_APP_URL || 'https://cursis.in').replace(/\/$/, ''));
  return sendResendEmail({
    to: email,
    subject: 'Subscribed to Cursis product updates',
    text: `You are subscribed to Cursis product updates. You can unsubscribe anytime at ${(process.env.NEXT_PUBLIC_APP_URL || 'https://cursis.in').replace(/\/$/, '')}/unsubscribe?email=${encodeURIComponent(email)}.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#FAF6EE;color:#0A0A0A;border:3px solid #0A0A0A;border-radius:16px;box-shadow:6px 6px 0 #0A0A0A;">
        <h2 style="margin:0 0 12px;font-size:22px;">You’re subscribed to Cursis updates.</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">Thanks for subscribing! We only share meaningful product releases and workflow guides.</p>
        <a href="${appUrl}" style="display:inline-block;padding:10px 18px;background:#FF5500;color:#FFFFFF;font-weight:700;text-decoration:none;border:2px solid #0A0A0A;border-radius:10px;">Explore Cursis</a>
        ${getCanspamEmailFooter(email)}
      </div>
    `,
  });
}

/**
 * Sends custom Solutions Studio / Business inquiry notifications to Cursis team
 * and receipt confirmation to the inquirer.
 */
export async function sendAgencyBuildInquiryEmails(data: {
  id: string;
  companyName: string;
  contactEmail: string;
  requestedService: string;
  budgetRange: string;
  requirements: string;
  workspaceId: string;
}): Promise<{ sent: boolean; teamDelivered: number; confirmationSent: boolean; error?: string }> {
  if (!isResendConfigured()) {
    return { sent: false, teamDelivered: 0, confirmationSent: false, error: 'Resend API key not configured' };
  }

  const safeCompany = escapeHtml(data.companyName);
  const safeEmail = escapeHtml(data.contactEmail);
  const safeService = escapeHtml(data.requestedService);
  const safeBudget = escapeHtml(data.budgetRange);
  const safeReqs = escapeHtml(data.requirements).replace(/\n/g, '<br />');
  const safeId = escapeHtml(data.id);

  const teamResult = await sendToTeamRecipients({
    replyTo: data.contactEmail,
    subject: `[Cursis Studio] Build Inquiry: ${data.companyName} — ${data.requestedService}`,
    text: `New Custom Build / Business Inquiry (${data.id})\nCompany/Name: ${data.companyName}\nEmail: ${data.contactEmail}\nService: ${data.requestedService}\nBudget: ${data.budgetRange}\nWorkspace: ${data.workspaceId}\n\nRequirements:\n${data.requirements}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px;background:#FAF6EE;color:#0A0A0A;border:3px solid #0A0A0A;border-radius:16px;box-shadow:6px 6px 0 #0A0A0A;">
        <div style="display:inline-block;padding:4px 10px;background:#FF5500;color:#FFFFFF;font-size:11px;font-weight:800;text-transform:uppercase;border:1.5px solid #0A0A0A;border-radius:6px;margin-bottom:14px;">Business / Studio Lead</div>
        <h2 style="margin:0 0 14px;font-size:20px;">${safeCompany} — ${safeService}</h2>
        <div style="background:#FFFFFF;border:2px solid #0A0A0A;border-radius:12px;padding:16px;font-size:13.5px;line-height:1.65;">
          <p style="margin:0 0 6px;"><strong>Reply Email:</strong> <a href="mailto:${safeEmail}" style="color:#FF5500;">${safeEmail}</a></p>
          <p style="margin:0 0 6px;"><strong>Budget Range:</strong> ${safeBudget}</p>
          <p style="margin:0 0 12px;"><strong>Request ID:</strong> ${safeId}</p>
          <div style="border-top:1px solid #E5E7EB;padding-top:10px;">
            <strong>Requirements:</strong><br />${safeReqs}
          </div>
        </div>
      </div>
    `,
  });

  const confirmResult = await sendResendEmail({
    to: data.contactEmail,
    replyTo: getContactRecipients()[0] || 'official@cursis.in',
    subject: `Inquiry received (${data.requestedService}) — Cursis Solutions Studio`,
    text: `Hi ${data.companyName},\n\nWe received your custom build / Business inquiry (Ref: ${data.id}) for "${data.requestedService}". The Cursis Solutions Studio will contact you within 24 hours.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#FAF6EE;color:#0A0A0A;border:3px solid #0A0A0A;border-radius:16px;box-shadow:6px 6px 0 #0A0A0A;">
        <h2 style="margin:0 0 12px;font-size:21px;">Inquiry Received</h2>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.6;">Thanks, <strong>${safeCompany}</strong>. We received your request for <strong>${safeService}</strong> (${safeBudget}) and our studio team will contact you within 24 hours.</p>
        <p style="margin:0;font-size:12px;color:#525252;">Reference ID: ${safeId}</p>
      </div>
    `,
  });

  return {
    sent: teamResult.deliveredCount > 0 || confirmResult.sent,
    teamDelivered: teamResult.deliveredCount,
    confirmationSent: confirmResult.sent,
    error: teamResult.deliveredCount === 0 && !confirmResult.sent ? (confirmResult.error || teamResult.lastError) : undefined,
  };
}

/**
 * Notifies Privacy Officer and confirms receipt with requester when a privacy
 * rights / grievance inquiry is submitted.
 */
export async function sendPrivacyRequestNotificationEmails(data: {
  id: string;
  userEmail: string;
  kind: string;
  message: string;
  acknowledgeBy: Date | string;
  resolveBy: Date | string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!isResendConfigured()) {
    return { sent: false, error: 'Resend API key not configured' };
  }

  const safeKind = escapeHtml(data.kind);
  const safeEmail = escapeHtml(data.userEmail);
  const safeId = escapeHtml(data.id);
  const safeMessage = escapeHtml(data.message).replace(/\n/g, '<br />');
  const ackDate = escapeHtml(new Date(data.acknowledgeBy).toDateString());
  const resolveDate = escapeHtml(new Date(data.resolveBy).toDateString());

  const teamResult = await sendToTeamRecipients({
    replyTo: data.userEmail,
    subject: `[Cursis Privacy] ${data.kind.toUpperCase()} request (${data.id})`,
    text: `New privacy / grievance request\nID: ${data.id}\nType: ${data.kind}\nFrom: ${data.userEmail}\nAcknowledge by: ${ackDate}\nResolve by: ${resolveDate}\n\nDetails:\n${data.message}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px;background:#FAF6EE;color:#0A0A0A;border:3px solid #0A0A0A;border-radius:16px;box-shadow:6px 6px 0 #0A0A0A;">
        <h2 style="margin:0 0 12px;font-size:20px;">Privacy Request: ${safeKind}</h2>
        <p style="margin:0 0 6px;font-size:13px;"><strong>From:</strong> <a href="mailto:${safeEmail}" style="color:#FF5500;">${safeEmail}</a></p>
        <p style="margin:0 0 6px;font-size:13px;"><strong>Request ID:</strong> ${safeId}</p>
        <p style="margin:0 0 14px;font-size:12px;color:#525252;"><strong>Target deadlines:</strong> Ack ${ackDate} · Resolve ${resolveDate}</p>
        <div style="background:#FFFFFF;border:2px solid #0A0A0A;border-radius:12px;padding:14px;font-size:13.5px;line-height:1.55;">
          ${safeMessage}
        </div>
      </div>
    `,
  });

  const confirmResult = await sendResendEmail({
    to: data.userEmail,
    subject: `Privacy request received (${data.id}) — Cursis`,
    text: `We received your ${data.kind} privacy request (Reference: ${data.id}). Our resolution target is ${new Date(data.resolveBy).toDateString()}.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#FAF6EE;color:#0A0A0A;border:3px solid #0A0A0A;border-radius:16px;box-shadow:6px 6px 0 #0A0A0A;">
        <h2 style="margin:0 0 12px;font-size:20px;">Privacy Request Received</h2>
        <p style="margin:0 0 12px;font-size:14px;line-height:1.6;">We received your <strong>${safeKind}</strong> request (Ref: <code>${safeId}</code>).</p>
        <p style="margin:0;font-size:13px;color:#525252;">Target resolution date: <strong>${resolveDate}</strong>.</p>
      </div>
    `,
  });

  return {
    sent: teamResult.deliveredCount > 0 || confirmResult.sent,
    error: teamResult.deliveredCount === 0 && !confirmResult.sent ? (confirmResult.error || teamResult.lastError) : undefined,
  };
}

