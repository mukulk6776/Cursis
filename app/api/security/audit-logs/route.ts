import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { getAuditLogs, logAuditEvent } from '@/lib/db/audit';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId;

    const auditLogs = await getAuditLogs(workspaceId);
    return NextResponse.json({ auditLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || 'unknown');
    const target = String(body.target || '');
    const details = body.details || '';
    const workspaceId = body.workspaceId || authUser.workspaceId;

    const entry = await logAuditEvent(workspaceId, {
      actorType: 'user',
      actorId: authUser.uid || authUser.email,
      actorName: authUser.displayName || authUser.email,
      action,
      targetType: target || 'settings',
      targetId: target || 'workspace',
      details: typeof details === 'string' ? { summary: details } : details,
      isRollbackable: false,
    });

    return NextResponse.json({
      success: true,
      auditLog: {
        id: entry.id,
        actor: entry.actorName,
        action: entry.action,
        target: entry.targetType,
        details: typeof entry.details === 'object' ? (entry.details.summary || JSON.stringify(entry.details)) : String(entry.details),
        timestamp: entry.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
