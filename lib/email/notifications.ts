import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const ADMIN_EMAIL = 'cursis.in@gmail.com';

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
              <td style="padding: 8px 0;">${data.workspaceId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Workspace Name:</td>
              <td style="padding: 8px 0;">${data.workspaceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Tier:</td>
              <td style="padding: 8px 0;">${data.tier || 'free'}</td>
            </tr>
            ${data.industry ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Industry:</td>
              <td style="padding: 8px 0;">${data.industry}</td>
            </tr>
            ` : ''}
            ${data.teamSize ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Team Size:</td>
              <td style="padding: 8px 0;">${data.teamSize}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Created At:</td>
              <td style="padding: 8px 0;">${new Date(data.createdAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Owner Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 150px;">User ID:</td>
              <td style="padding: 8px 0;">${data.ownerUserId}</td>
            </tr>
            ${data.ownerName ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Name:</td>
              <td style="padding: 8px 0;">${data.ownerName}</td>
            </tr>
            ` : ''}
            ${data.ownerEmail ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${data.ownerEmail}" style="color: #0f4cff;">${data.ownerEmail}</a></td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${data.features && data.features.length > 0 ? `
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Selected Features</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${data.features.map(feature => `<li style="padding: 4px 0;">${feature}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />

        <p style="font-size: 12px; color: #999;">
          This is an automated notification from Cursis. A new custom client workspace has been created and requires your attention.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: 'Cursis <onboarding@resend.dev>',
      to: ADMIN_EMAIL,
      subject: `🚀 New Custom Client Workspace: ${data.workspaceName}`,
      html: emailContent,
    });

    console.log(`✅ Admin notification email sent for workspace: ${data.workspaceId}`);
  } catch (error) {
    console.error('❌ Failed to send admin notification email:', error);
    // Don't throw - we don't want workspace creation to fail if email fails
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
    await resend.emails.send({
      from: 'Cursis <onboarding@resend.dev>',
      to: email,
      subject: `Welcome to ${workspaceName} on Cursis!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #0f4cff;">Welcome to ${workspaceName}! 🎉</h2>
          <p>Hi ${ownerName || 'there'},</p>
          <p>Your workspace <strong>${workspaceName}</strong> has been successfully created on Cursis!</p>
          <p>You can now start inviting team members, managing projects, and leveraging the power of AI-assisted workflows.</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cursis.in'}/dashboard"
               style="background-color: #0f4cff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">
            Questions? Reach out to us at <a href="mailto:cursis.in@gmail.com" style="color: #0f4cff;">cursis.in@gmail.com</a>
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}
