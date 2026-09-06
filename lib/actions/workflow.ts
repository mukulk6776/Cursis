'use server';

import { createWorkflow as dbCreateWorkflow } from '@/lib/db/workflows';
import { OrdisEngine } from '@/lib/ordis/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function createWorkflowAction(formData: FormData) {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      throw new Error('Unauthorized');
    }

    const prompt = formData.get('prompt') as string;
    if (!prompt) {
      throw new Error('Missing prompt');
    }

    // Trigger one sentence process if prompt looks like a new project/client
    if (prompt.toLowerCase().includes('client') || prompt.toLowerCase().includes('project') || prompt.toLowerCase().includes('budget')) {
      const processResult = await OrdisEngine.runProcessFromSentence(authUser.workspaceId, prompt);
      const workflowId = await dbCreateWorkflow(authUser.uid, prompt, processResult.project.name);

      revalidatePath('/dashboard');
      return { success: true, workflowId, processResult };
    }

    const workflowId = await dbCreateWorkflow(authUser.uid, prompt);

    revalidatePath('/dashboard');
    return { success: true, workflowId };
  } catch (error: any) {
    console.error('Failed to create workflow:', error);
    return { success: false, error: error.message };
  }
}
