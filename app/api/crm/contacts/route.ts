import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { inMemoryStore } from '@/lib/db/store';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId;

    const leads = Array.from(inMemoryStore.leads.values()).filter((l) => l.workspaceId === workspaceId);
    const contacts = leads.map((l) => ({
      id: l.id,
      name: l.name,
      company: l.company,
      email: l.email,
      phone: l.phone || '+1-555-0199',
      role: 'Decision Maker',
      status: l.status === 'won' ? 'Customer' : 'Active',
      lastContact: l.lastContactedAt ? l.lastContactedAt.split('T')[0] : 'Recently',
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
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || authUser.workspaceId;

    if (!body.name || !body.company) {
      return apiError('Contact name and company are required', 400);
    }

    const id = `ct_${Date.now()}`;
    const contact = {
      id,
      workspaceId,
      name: body.name.trim(),
      company: body.company.trim(),
      email: body.email?.trim() || `${body.name.toLowerCase().replace(/\s+/g, '.')}@${body.company.toLowerCase().replace(/\s+/g, '')}.com`,
      phone: body.phone?.trim() || '+1-555-0199',
      role: body.role || 'Contact',
      status: 'Active',
      notes: body.notes || 'Added via CRM Contacts API',
      lastContact: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    return apiSuccess({ contact }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to create contact', 500);
  }
}
