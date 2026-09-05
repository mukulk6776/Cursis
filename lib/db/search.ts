import { inMemoryStore } from './store';
import { SearchResultItem } from './types';

export async function universalSearch(workspaceId: string, query: string): Promise<SearchResultItem[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const q = query.toLowerCase().trim();
  const results: SearchResultItem[] = [];

  // 1. Search Tasks
  for (const t of inMemoryStore.tasks.values()) {
    if (t.workspaceId === workspaceId) {
      if (t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q))) {
        results.push({
          id: t.id,
          type: 'task',
          title: t.title,
          snippet: t.description || `Status: ${t.status} | Priority: ${t.priority} | Due: ${new Date(t.dueDate).toLocaleDateString()}`,
          url: `/dashboard/tasks?id=${t.id}`,
          metadata: { status: t.status, priority: t.priority, isAtRisk: t.isAtRisk },
          updatedAt: t.updatedAt,
        });
      }
    }
  }

  // 2. Search Projects
  for (const p of inMemoryStore.projects.values()) {
    if (p.workspaceId === workspaceId) {
      if (p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.clientName?.toLowerCase().includes(q)) {
        results.push({
          id: p.id,
          type: 'project',
          title: p.name,
          snippet: p.description || `Health: ${p.health} | Client: ${p.clientName} | Budget: ₹${p.budget.toLocaleString()}`,
          url: `/dashboard/projects?id=${p.id}`,
          metadata: { health: p.health, progress: p.progressPercent },
          updatedAt: p.updatedAt,
        });
      }
    }
  }


  // 4. Search Documents & Knowledge Base
  for (const d of inMemoryStore.documents.values()) {
    if (d.workspaceId === workspaceId) {
      if (d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q) || d.tags.some((tag) => tag.toLowerCase().includes(q))) {
        results.push({
          id: d.id,
          type: 'document',
          title: d.title,
          snippet: d.summary || d.content.substring(0, 150),
          url: `/dashboard/documents?id=${d.id}`,
          metadata: { category: d.category, author: d.authorName },
          updatedAt: d.updatedAt,
        });
      }
    }
  }

  // 5. Search CRM Leads & Deals
  for (const l of inMemoryStore.leads.values()) {
    if (l.workspaceId === workspaceId) {
      if (l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)) {
        results.push({
          id: l.id,
          type: 'lead',
          title: `${l.name} (${l.company})`,
          snippet: `Status: ${l.status} | Budget: ₹${l.budget?.toLocaleString() || 'N/A'} | Source: ${l.source}`,
          url: `/dashboard/crm?leadId=${l.id}`,
          metadata: { status: l.status, company: l.company },
          updatedAt: l.updatedAt,
        });
      }
    }
  }

  // 6. Search Meetings
  for (const mtg of inMemoryStore.meetings.values()) {
    if (mtg.workspaceId === workspaceId) {
      if (mtg.title.toLowerCase().includes(q) || mtg.summary?.toLowerCase().includes(q) || mtg.transcript?.toLowerCase().includes(q)) {
        results.push({
          id: mtg.id,
          type: 'meeting',
          title: mtg.title,
          snippet: mtg.summary || `Meeting with ${mtg.attendees.join(', ')}`,
          url: `/dashboard/meetings?id=${mtg.id}`,
          metadata: { duration: mtg.durationMinutes, scheduledAt: mtg.scheduledAt },
          updatedAt: mtg.createdAt,
        });
      }
    }
  }

  // 7. Search Dynamic Tools
  for (const tool of inMemoryStore.dynamicTools.values()) {
    if (tool.workspaceId === workspaceId) {
      if (tool.title.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q) || tool.prompt.toLowerCase().includes(q)) {
        results.push({
          id: tool.id,
          type: 'tool',
          title: tool.title,
          snippet: tool.description,
          url: `/dashboard/tools/${tool.slug}`,
          metadata: { slug: tool.slug, recordsCount: tool.records.length },
          updatedAt: tool.updatedAt,
        });
      }
    }
  }

  return results.slice(0, 30);
}
