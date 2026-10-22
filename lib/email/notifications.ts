import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const ADMIN_EMAIL = 'cursis.in@gmail.com';
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Cursis <onboarding@resend.dev>';

export async function sendProgressEmail(payload: { to: string; subject: string; text: string }, idempotencyKey: string) {
  if (!resend || !process.env.RESEND_FROM_EMAIL) throw new Error('Progress email is not configured');
  const { error } = await resend.emails.send({ from: FROM_EMAIL, ...payload }, { idempotencyKey });
  if (error) throw new Error('Progress email delivery failed');
}

export function isPasswordResetEmailConfigured(): boolean {
  return Boolean(resend && process.env.RESEND_FROM_EMAIL);
}

export async function sendPasswordResetEmail(email: string, code: string): Promise<void> {
  if (!resend || !isPasswordResetEmailConfigured()) throw new Error('Reset email is unavailable');
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Your Cursis password reset code',
    text: `Your Cursis password reset code is ${code}. It expires in 10 minutes and can only be used once. If you did not request this, you can ignore this email. Never share this code.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#FAF6EE;color:#0A0A0A;border:3px solid #0A0A0A;border-radius:16px;box-shadow:6px 6px 0 #0A0A0A"><h1 style="font-size:24px">Reset your Cursis password.</h1><p>Enter this code on the Forgot Password page:</p><p style="font-size:32px;font-weight:800;letter-spacing:8px;padding:16px;background:#FF5500;border:2px solid #0A0A0A;border-radius:12px">${code}</p><p>This code expires in 10 minutes and can only be used once.</p><p>If you did not request this, you can ignore this email. Never share this code.</p></div>`,
  });
  if (error) throw new Error('Reset email could not be sent');
}

export const CURSIS_PHYSICAL_ADDRESS = {
  company: process.env.PRIVACY_LEGAL_ENTITY || 'Saransh Vashistha, operating as Cursis',
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
        <a href="${escapeHtml(unsubscribeUrl)}" style="color: #0f4cff; text-decoration: underline; font-weight: 600;">Unsubscribe from marketing emails</a>
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
  if (!resend) {
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

    const emailContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0f4cff; border-bottom: 2px solid #0f4cff; padding-bottom: 10px;">
          🎉 New Custom Client Workspace Created
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
              <td style="padding: 8px 0;"><a href="mailto:${safeOwnerEmail}" style="color: #0f4cff;">${safeOwnerEmail}</a></td>
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
        ${getCanspamEmailFooter(ADMIN_EMAIL)}
      </div>
    `;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `🚀 New Custom Client Workspace: ${data.workspaceName}`,
      html: emailContent,
    });

    if (error) {
      console.error('❌ Resend API returned error for admin notification:', error);
      return;
    }

    console.log(`✅ Admin notification email sent for workspace: ${data.workspaceId}`);
  } catch (error) {
    console.error('❌ Failed to send admin notification email:', error);
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
  if (!resend) {
    console.warn('Resend API key not configured, skipping welcome email');
    return;
  }

  try {
    const safeWsName = escapeHtml(workspaceName);
    const safeOwner = escapeHtml(ownerName || 'there');
    const safeAppUrl = escapeHtml(process.env.NEXT_PUBLIC_APP_URL || 'https://cursis.in');

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Welcome to ${workspaceName} on Cursis!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #0f4cff;">Welcome to ${safeWsName}! 🎉</h2>
          <p>Hi ${safeOwner},</p>
          <p>Your workspace <strong>${safeWsName}</strong> has been successfully created on Cursis!</p>
          <p>You can now start inviting team members, managing projects, and leveraging the power of AI-assisted workflows.</p>
          <div style="margin: 30px 0;">
            <a href="${safeAppUrl}/dashboard"
               style="background-color: #0f4cff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">
            Questions? Reach out to us at <a href="mailto:cursis.in@gmail.com" style="color: #0f4cff;">cursis.in@gmail.com</a>
          </p>
          ${getCanspamEmailFooter(email)}
        </div>
      `,
    });

    if (error) {
      console.error('Resend error sending welcome email:', error);
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
  if (!resend) {
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

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `You've been invited to join ${safeWsName} on Cursis`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #0f4cff;">You've been invited to ${safeWsName}!</h2>
          <p>Hi ${safeRecipient},</p>
          <p><strong>${safeInviter}</strong> has invited you to join <strong>${safeWsName}</strong> as a <strong>${safeRole}</strong>.</p>
          <p>Open your Cursis dashboard to accept or decline the invitation:</p>
          <div style="margin: 30px 0;">
            <a href="${safeInviteLink}" style="background-color: #0f4cff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Invitation</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">If you were not expecting this invitation, you can safely ignore this email.</p>
          ${getCanspamEmailFooter(to)}
        </div>
      `,
    });

    if (error) {
      console.warn('❌ Resend API returned error for invitation:', error);
      return { success: false, error: error.message || 'Resend delivery error' };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('❌ Failed to dispatch invitation email:', err?.message);
    return { success: false, error: err?.message || 'Email dispatch exception' };
  }
}

