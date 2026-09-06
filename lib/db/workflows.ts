import { getCollection } from '@/lib/mongodb';

export interface WorkflowData {
  userId: string;
  prompt: string;
  status: 'Active' | 'Paused' | 'Completed' | 'Error';
  type: 'success' | 'error' | 'running';
  runs: number;
  name?: string;
  desc?: string;
  time?: string;
  createdAt?: string;
}

const localWorkflows = new Map<string, WorkflowData & { id: string }>();

export async function createWorkflow(userId: string, prompt: string, name?: string) {
  const id = 'wf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newWorkflow: WorkflowData & { id: string } = {
    id,
    userId,
    prompt,
    name: name || 'New Workflow',
    status: 'Active',
    type: 'running',
    runs: 0,
    time: 'Just now',
    createdAt: new Date().toISOString(),
  };

  localWorkflows.set(id, newWorkflow);

  try {
    const col = await getCollection<WorkflowData & { id: string }>('workflows');
    if (col) {
      await col.insertOne(newWorkflow);
    }
  } catch (err) {
    console.warn('MongoDB createWorkflow notice:', err);
  }

  return id;
}

export async function getUserWorkflows(userId: string) {
  try {
    const col = await getCollection<WorkflowData & { id: string }>('workflows');
    if (col) {
      const docs = await col.find({ userId }).sort({ createdAt: -1 }).toArray();
      if (docs.length > 0) {
        docs.forEach((w) => localWorkflows.set(w.id, w));
        return docs;
      }
    }
  } catch (err) {
    console.warn('MongoDB getUserWorkflows notice:', err);
  }

  return Array.from(localWorkflows.values()).filter((w) => w.userId === userId);
}


