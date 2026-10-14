import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getContacts, createContact, getLeads } from '@/lib/db/crm';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const rawWorkspaceId = searchParams.get('workspaceId') || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const storedContacts = await getContacts(wsAuth.workspaceId);
    if (storedContacts.length > 0) {
      return apiSuccess({ contacts: storedContacts });
    }

    // Derive contacts from workspace leads if no explicit contacts stored yet
    const leads = await getLeads(wsAuth.workspaceId);
    const contacts = leads.map((l) => ({
      id: l.id,
      workspaceId: l.workspaceId,
      name: l.name,
      company: l.company,
      email: l.email,
      phone: l.phone || '',
      role: 'Decision Maker',
      status: l.status === 'won' ? 'Customer' : 'Active',
      lastContact: l.lastContactedAt ? l.lastContactedAt.split('T')[0] : 'Recently',
      createdAt: l.createdAt,
    }));

    return apiSuccess({ contacts });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve contacts', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json().catch(() => ({}));
    const rawWorkspaceId = body.workspaceId || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    if (!body.name || !body.company) {
      return apiError('Contact name and company are required', 400);
    }

    const contact = await createContact(wsAuth.workspaceId, {
      name: body.name.trim(),
      company: body.company.trim(),
      email: body.email?.trim() || '',
      phone: body.phone?.trim() || '',
      role: body.role || 'Contact',
      status: 'Active',
      notes: body.notes || 'Added via CRM Contacts API',
    });

    return apiSuccess({ contact }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to create contact', 500);
  }
}
