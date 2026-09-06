import { adminDb } from '@/lib/auth/firebase-admin';
import { inMemoryStore } from './store';

export interface WorkflowData {
  userId: string;
  prompt: string;
  status: 'Active' | 'Paused' | 'Completed' | 'Error';
  type: 'success' | 'error' | 'running';
  runs: number;
  name?: string;
  desc?: string;
  time?: string;
  createdAt?: Date | string | any;
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

  if (adminDb && typeof adminDb.collection === 'function' && process.env.FIREBASE_PROJECT_ID) {
    try {
      const workflowsRef = adminDb.collection('workflows');
      await workflowsRef.doc(id).set(newWorkflow);
    } catch (err) {
      console.warn('Firestore createWorkflow error:', err);
    }
  }

  return id;
}


export async function getUserWorkflows(userId: string) {
  if (adminDb && typeof adminDb.collection === 'function' && process.env.FIREBASE_PROJECT_ID) {
    try {
      const snapshot = await adminDb
        .collection('workflows')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...(doc.data() as any)
        } as WorkflowData & { id: string }));
      }
    } catch (err) {
      console.warn('Firestore getUserWorkflows error:', err);
    }
  }

  return Array.from(localWorkflows.values()).filter(w => w.userId === userId);
}

