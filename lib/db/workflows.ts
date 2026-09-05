import { adminDb } from '@/lib/auth/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface WorkflowData {
  userId: string;
  prompt: string;
  status: 'Active' | 'Paused' | 'Completed' | 'Error';
  type: 'success' | 'error' | 'running';
  runs: number;
  name?: string;
  desc?: string;
  time?: string;
  createdAt?: FieldValue | Date;
}

export async function createWorkflow(userId: string, prompt: string, name?: string) {
  const workflowsRef = adminDb.collection('workflows');
  
  const newWorkflowRef = workflowsRef.doc();
  await newWorkflowRef.set({
    userId,
    prompt,
    name: name || 'New Workflow',
    status: 'Active',
    type: 'running',
    runs: 0,
    time: 'Just now',
    createdAt: FieldValue.serverTimestamp(),
  });

  return newWorkflowRef.id;
}

export async function getUserWorkflows(userId: string) {
  const snapshot = await adminDb
    .collection('workflows')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as any)
  } as WorkflowData & { id: string }));
}
