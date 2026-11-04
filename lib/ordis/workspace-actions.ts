import { NextRequest } from 'next/server';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getWorkspace } from '@/lib/db/workspaces';
import { inMemoryStore } from '@/lib/db/store';
import { getDb } from '@/lib/mongodb';
import { logAuditEvent } from '@/lib/db/audit';
import { capabilities, validateAction } from './capabilities';

// Static imports via loaders: the model cannot choose URLs, imports, or credentials.
const loaders = {
  tasks: () => import('@/app/api/tasks/route'),
  projects: () => import('@/app/api/projects/route'),
  departments: () => import('@/app/api/departments/route'),
  team: () => import('@/app/api/team/route'),
  meetings: () => import('@/app/api/meetings/route'),
  'calendar/events': () => import('@/app/api/calendar/events/route'),
  documents: () => import('@/app/api/documents/route'),
  automations: () => import('@/app/api/automations/route'),
  'crm/deals': () => import('@/app/api/crm/deals/route'),
  'crm/leads': () => import('@/app/api/crm/leads/route'),
  'crm/contacts': () => import('@/app/api/crm/contacts/route'),
  integrations: () => import('@/app/api/integrations/route'),
  notifications: () => import('@/app/api/notifications/route'),
  'ordis/brain': () => import('@/app/api/ordis/brain/route'),
  'dashboards/stats': () => import('@/app/api/dashboards/stats/route'),
  search: () => import('@/app/api/search/route'),
};

export interface ActionResult {
  ok: boolean;
  operation: string;
  error?: string;
  data?: unknown;
  changed?: boolean;
  page?: string;
  actionPayload?: unknown;
}

export async function executeWorkspaceAction(request: Request, workspaceId: string, operation: string, input: Record<string, unknown>): Promise<ActionResult> {
  const invalid = validateAction(operation, input);
  if (invalid) return { ok: false, operation, error: invalid };
  const spec = capabilities[operation];
  const auth = await authorizeWorkspaceAccess(request, workspaceId);
  if (auth.errorResponse) return { ok: false, operation, error: 'You do not have access to this workspace.' };

  // Confirmation gate for destructive operations (Feature 13)
  const isDestructive = spec.method === 'DELETE';
  const isConfirmed = input.confirmed === true;
  if (isDestructive && !isConfirmed) {
    const ws = await getWorkspace(workspaceId).catch(() => null);
    const approvalRequired = ws?.settings?.approvalRequiredForActions ?? true;
    if (approvalRequired) {
      const actionId = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const description = `Confirmation required to ${operation.replaceAll('_', ' ')}`;
      const pendingItem: any = {
        id: actionId,
        workspaceId,
        operation,
        action: operation,
        capability: 'takes_outside_action',
        description,
        status: 'pending',
        input,
        payload: input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryStore.approvalQueue.set(actionId, pendingItem);
      try {
        const db = await getDb();
        if (db) await db.collection('ordis_approvals').insertOne(pendingItem);
      } catch (e) {
        console.warn('MongoDB approval enqueue notice:', e);
      }

      return {
        ok: false,
        operation,
        changed: false,
        error: `Confirmation required: Ordis requires explicit user confirmation before executing '${operation.replaceAll('_', ' ')}'.`,
        actionPayload: {
          type: 'action_confirmation_required',
          actionId,
          operation,
          input,
          description,
        },
      };
    }
  }

  // Prevent IDs obtained from another workspace from crossing the active workspace boundary.
  const targetId = input.id || input.userId || input.invitationId;
  if (targetId) {
    const listOperation = Object.entries(capabilities).find(([, item]) => item.resource === spec.resource && item.method === 'GET')?.[0];
    if (!listOperation) return { ok: false, operation, error: 'Cannot verify the target in this workspace.' };
    const listed = await executeWorkspaceAction(request, workspaceId, listOperation, {});
    const lists = listed.data && typeof listed.data === 'object' ? Object.values(listed.data) : [];
    if (!listed.ok || !lists.some(value => Array.isArray(value) && value.some(item => item.id === targetId || item.userId === targetId))) {
      return { ok: false, operation, error: 'Target not found in the active workspace. List the items and use their actual ID.' };
    }
  }

  const params = { ...input, workspaceId };
  if (operation === 'invite_member') Object.assign(params, { action: 'invite' });
  if (operation === 'read_notifications') Object.assign(params, { action: 'mark_all_read' });
  const url = new URL(`/api/${spec.resource}`, request.url);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const key of ['cookie', 'authorization', 'host']) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  const bodyless = spec.method === 'GET' || spec.method === 'DELETE';
  if (bodyless) for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  try {
    const projectItem = spec.resource === 'projects' && ['PATCH', 'DELETE'].includes(spec.method);
    const routes = projectItem ? await import('@/app/api/projects/[id]/route') : await loaders[spec.resource as keyof typeof loaders]();
    const handler = (routes as unknown as Record<string, (req: NextRequest, context: { params: Promise<{ id: string }> }) => Promise<Response>>)[spec.method];
    const response = await handler(new NextRequest(url, { method: spec.method, headers, ...(!bodyless ? { body: JSON.stringify(params) } : {}) }), { params: Promise.resolve({ id: String(input.id || '') }) });
    const payload = await response.json();
    if (!response.ok || payload.success === false || payload.data?.success === false) {
      return { ok: false, operation, error: payload.error || 'The website could not complete this action.' };
    }
    const changed = !bodyless || spec.method === 'DELETE';
    if (changed) {
      try {
        const resData = payload.data ?? payload;
        const targetId = String(
          input.id ||
          input.userId ||
          input.invitationId ||
          resData?.id ||
          resData?.task?.id ||
          resData?.project?.id ||
          resData?.department?.id ||
          resData?.invitation?.id ||
          resData?.meeting?.id ||
          resData?.event?.id ||
          resData?.document?.id ||
          resData?.deal?.id ||
          resData?.lead?.id ||
          resData?.rule?.id ||
          input.title ||
          input.name ||
          input.email ||
          operation
        );
        const targetType = spec.resource
          .replace(/^crm\//, '')
          .replace(/\/events$/, '_event')
          .replace(/s$/, '');

        await logAuditEvent(workspaceId, {
          actorType: 'ordis_assisted',
          actorId: auth.user.uid,
          actorName: auth.user.displayName || auth.user.email || 'Ordis Assistant',
          action: `ordis.${operation}`,
          targetType: targetType || 'workspace',
          targetId,
          details: { operation, input, result: resData },
          isRollbackable: false,
        });
      } catch (auditError) {
        console.warn('Ordis audit logging error:', auditError);
      }
    }
    return { ok: true, operation, data: payload.data ?? payload, changed, page: spec.page };
  } catch {
    // Do not retry a write: the server may have committed it before the response failed.
    return { ok: false, operation, error: 'The action could not be confirmed. Check the relevant page before retrying.' };
  }
}
