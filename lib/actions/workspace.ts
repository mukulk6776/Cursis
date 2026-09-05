'use server';

import { createWorkspace as dbCreateWorkspace } from '@/lib/db/workspaces';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function createWorkspaceAction(formData: FormData) {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      throw new Error('Unauthorized');
    }

    const userId = authUser.uid;
    const name = formData.get('name') as string;
    const industry = formData.get('industry') as string;
    const teamSize = formData.get('teamSize') as string;

    // Convert comma-separated string to array
    const featuresStr = formData.get('features') as string;
    const features = featuresStr ? featuresStr.split(',').map((f) => f.trim()) : [];

    if (!name || !industry || !teamSize) {
      throw new Error('Missing required fields');
    }

    const workspaceId = await dbCreateWorkspace(userId, {
      name,
      industry,
      teamSize,
      features,
    });

    revalidatePath('/dashboard');
    revalidatePath('/platform');

    return { success: true, workspaceId };
  } catch (error: any) {
    console.error('Failed to create workspace:', error);
    return { success: false, error: error.message };
  }
}
