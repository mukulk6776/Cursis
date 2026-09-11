import { inMemoryStore } from './store';
import { Department } from './types';
import { getCollection } from '@/lib/mongodb';

// Initial default departments for bootstrapped workspaces
export const INITIAL_DEPARTMENTS_DATA: Omit<Department, 'workspaceId'>[] = [
  {
    id: 'dept_engineering',
    name: 'Engineering',
    description: 'Core product architecture, full-stack systems, frontend experience, and DevOps reliability.',
    lead: 'Marcus Vance',
    head: 'Marcus Vance',
    membersCount: 4,
    memberCount: 4,
    budget: '$480,000 / yr',
    color: '#0f4cff',
    tags: ['Core', 'Technical', 'Product'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dept_product',
    name: 'Product & Design',
    description: 'User research, interface architecture, design systems, and roadmap prioritization.',
    lead: 'Sophia Chen',
    head: 'Sophia Chen',
    membersCount: 3,
    memberCount: 3,
    budget: '$320,000 / yr',
    color: '#8b5cf6',
    tags: ['Design', 'UX', 'Strategy'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dept_leadership',
    name: 'Leadership',
    description: 'Executive strategy, investor relations, resource allocation, and company governance.',
    lead: 'Mukul K (Founder)',
    head: 'Mukul K (Founder)',
    membersCount: 1,
    memberCount: 1,
    budget: '$600,000 / yr',
    color: '#ccff00',
    tags: ['Executive', 'Governance'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dept_growth',
    name: 'Growth & Operations',
    description: 'Client acquisition, enterprise partnerships, customer success, and revenue operations.',
    lead: 'David Kim',
    head: 'David Kim',
    membersCount: 2,
    memberCount: 2,
    budget: '$250,000 / yr',
    color: '#10b981',
    tags: ['Sales', 'Marketing', 'Ops'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function getDepartments(workspaceId: string): Promise<Department[]> {
  try {
    const col = await getCollection<Department>('departments');
    if (col) {
      const docs = await col.find({ workspaceId }).sort({ createdAt: 1 }).toArray();
      if (docs.length > 0) {
        docs.forEach((d) => inMemoryStore.departments.set(d.id, d));
        return docs;
      }
    }
  } catch (e) {
    console.warn('MongoDB getDepartments notice:', e);
  }

  const memDepts = Array.from(inMemoryStore.departments.values()).filter((d) => d.workspaceId === workspaceId);
  if (memDepts.length > 0) return memDepts;

  const defaults = INITIAL_DEPARTMENTS_DATA.map((d) => ({ ...d, workspaceId }));
  defaults.forEach((d) => inMemoryStore.departments.set(d.id, d));
  return defaults;
}

export async function getDepartmentById(id: string): Promise<Department | null> {
  const cached = inMemoryStore.departments.get(id);
  if (cached) return cached;

  try {
    const col = await getCollection<Department>('departments');
    if (col) {
      const found = await col.findOne({ id });
      if (found) {
        inMemoryStore.departments.set(id, found);
        return found;
      }
    }
  } catch {}

  const defaultFound = INITIAL_DEPARTMENTS_DATA.find((d) => d.id === id);
  if (defaultFound) {
    const d = { ...defaultFound, workspaceId: 'default' };
    inMemoryStore.departments.set(id, d);
    return d;
  }

  return null;
}

export async function createDepartment(workspaceId: string, data: Partial<Department>): Promise<Department> {
  const cleanName = (data.name || 'General Department').trim();
  const id = data.id || `dept_${cleanName.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substring(2, 6)}`;

  const dept: Department = {
    id,
    workspaceId,
    name: cleanName,
    description: data.description || `${cleanName} operational division.`,
    lead: data.lead || data.head || 'Unassigned',
    head: data.head || data.lead || 'Unassigned',
    membersCount: data.membersCount || data.memberCount || 0,
    memberCount: data.memberCount || data.membersCount || 0,
    budget: data.budget || '$150,000 / yr',
    color: data.color || '#0f4cff',
    tags: Array.isArray(data.tags) ? data.tags : ['Core Team'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.departments.set(id, dept);

  try {
    const col = await getCollection<Department>('departments');
    if (col) {
      await col.insertOne(dept);
    }
  } catch (e) {
    console.warn('MongoDB insert department notice:', e);
  }

  return dept;
}

export async function updateDepartment(id: string, updates: Partial<Department>): Promise<Department | null> {
  const existing = await getDepartmentById(id);
  if (!existing) return null;

  const updated: Department = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.departments.set(id, updated);

  try {
    const col = await getCollection<Department>('departments');
    if (col) {
      await col.updateOne({ id }, { $set: updated });
    }
  } catch (e) {
    console.warn('MongoDB update department notice:', e);
  }

  return updated;
}

export async function deleteDepartment(id: string): Promise<boolean> {
  const existed = inMemoryStore.departments.delete(id);

  try {
    const col = await getCollection<Department>('departments');
    if (col) {
      const res = await col.deleteOne({ id });
      return res.deletedCount > 0 || existed;
    }
  } catch (e) {
    console.warn('MongoDB delete department notice:', e);
  }

  return existed;
}
