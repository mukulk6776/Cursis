import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
import {
  getWorkspaceTeam,
  addTeamMember,
  removeTeamMember,
  updateTeamMember,
  sendTeamInvitation,
  getWorkspaceInvitations,
  revokeTeamInvitation,
  acceptTeamInvitation,
} from '@/lib/db/team';
import { createNotification } from '@/lib/db/notifications';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId || 'ws_public';

    const [team, invitations] = await Promise.all([
      getWorkspaceTeam(workspaceId),
      getWorkspaceInvitations(workspaceId),
    ]);

    return apiSuccess({ team, invitations });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve team members', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || authUser.workspaceId || 'ws_public';

    // Check action type: direct add vs invitation vs accept
    const action = body.action || 'add';

    if ((action === 'accept' || action === 'accept_invitation') && body.token) {
      const member = await acceptTeamInvitation(body.token);
      if (!member) {
        return apiError('Invalid or expired invitation token', 400);
      }
      return apiSuccess({ member, message: 'Invitation accepted successfully' });
    }

    if (action === 'invite' || action === 'send_invitation') {
      const email = body.email?.trim()?.toLowerCase();
      if (!email) {
        return apiError('Recipient email is required to send invitation', 400);
      }

      const invitation = await sendTeamInvitation(workspaceId, {
        email,
        name: body.name?.trim(),
        roleTitle: body.roleTitle?.trim() || 'Team Member',
        workspaceRole: body.workspaceRole || body.role || 'member',
        department: body.department || 'Engineering',
        team: body.team || null,
        note: body.note?.trim(),
        invitedBy: authUser.uid || 'u1',
        planTier: body.planTier || 'standard',
      });

      // Dispatch email internally using Resend
      if (process.env.RESEND_API_KEY) {
        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const inviteLink = `${protocol}://${host}/invite/${invitation.token}`;
        
        try {
          await resend.emails.send({
            from: 'Cursis <onboarding@resend.dev>',
            to: email,
            subject: `You've been invited to join Cursis`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #0f4cff;">You've been invited to Cursis!</h2>
                <p>Hi ${body.name || 'there'},</p>
                <p><strong>${authUser.displayName || 'Workspace Admin'}</strong> has invited you to join the workspace as a <strong>${body.roleTitle || 'Team Member'}</strong>.</p>
                <p>Click the button below to securely accept the invitation and set up your account:</p>
                <div style="margin: 30px 0;">
                  <a href="${inviteLink}" style="background-color: #0f4cff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation</a>
                </div>
                <p style="font-size: 12px; color: #666;">Or copy and paste this link into your browser: <br/> ${inviteLink}</p>
                <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                <p style="font-size: 12px; color: #999;">If you were not expecting this invitation, you can safely ignore this email.</p>
              </div>
            `,
          });
        } catch (emailError) {
          console.error('Failed to send invitation email via Resend:', emailError);
        }
      } else {
        console.log(`[Email Simulation] Invitation link for ${email}: /invite/${invitation.token}`);
      }

      return apiSuccess({ invitation, message: `Invitation sent to ${email}` }, 201);
    }

    // Default: Direct Provision Member
    const displayName = (body.displayName || body.name)?.trim();
    if (!displayName) {
      return apiError('Display name is required', 400);
    }

    // Fallback to internal email if no email provided
    const email = body.email?.trim()?.toLowerCase() || `${displayName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@cursis.io`;

    const member = await addTeamMember(workspaceId, {
      email,
      displayName,
      role: body.role || 'member',
      department: body.department || 'Engineering',
      title: body.title || body.roleTitle || 'Team Member',
      skills: Array.isArray(body.skills) ? body.skills : (body.skills ? [body.skills] : ['General']),
      photoURL: body.photoURL,
      presence: body.presence || 'online',
      planTier: body.planTier || 'standard',
    });

    // Dispatch persistent notifications
    await createNotification({
      userEmail: email,
      workspaceId,
      type: 'team',
      text: `<strong>${authUser.displayName || 'Workspace Admin'}</strong> added you to the workspace as <strong>${member.title}</strong> in <strong>${member.department}</strong>.`,
      icon: 'team',
    });

    await createNotification({
      userEmail: authUser.email,
      workspaceId,
      type: 'team',
      text: `Added <strong>${member.displayName}</strong> (${email}) to team as <strong>${member.title}</strong>.`,
      icon: 'check',
    });

    return apiSuccess({ member, message: `Added ${member.displayName} to team` }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to process team action', 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json().catch(() => ({}));
    const userId = body.userId || body.id;

    if (!userId) {
      return apiError('User ID is required for update', 400);
    }

    const updated = await updateTeamMember(userId, body.updates || body);
    if (!updated) {
      return apiError('Team member not found', 404);
    }

    return apiSuccess({ member: updated, message: 'Team member updated' });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update team member', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const invitationId = searchParams.get('invitationId');
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId || 'ws_public';

    if (invitationId) {
      await revokeTeamInvitation(invitationId);
      return apiSuccess({ message: 'Invitation revoked' });
    }

    if (userId || email) {
      // Authorization Guard: Only Owners/Admins can remove OTHER members
      const isSelfLeave = (userId && userId === authUser.uid) || (email && email.toLowerCase() === authUser.email.toLowerCase());
      if (!isSelfLeave && authUser.role !== 'owner' && authUser.workspaceRole !== 'owner') {
        return apiError('Forbidden: Only Workspace Owners can remove other members.', 403);
      }

      const removed = await removeTeamMember(workspaceId, userId || '', email || undefined);
      return apiSuccess({ removed, message: 'Team member removed from workspace' });
    }

    return apiError('User ID, Email, or Invitation ID is required', 400);
  } catch (error: any) {
    return apiError(error.message || 'Failed to remove member or invitation', 500);
  }
}
