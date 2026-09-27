'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

/**
 * Workspace switcher component
 * Handles switching between workspaces with unique URLs
 * URL format: /dashboard/w/[workspaceSlug]
 */
export default function WorkspaceSwitcher() {
  const router = useRouter();
  const params = useParams();
  const { activeWorkspaceId, switchWorkspace } = useDashboard();

  const currentSlug = params?.workspaceSlug as string;

  useEffect(() => {
    // If workspace slug in URL doesn't match active workspace, switch
    if (currentSlug && currentSlug !== activeWorkspaceId) {
      switchWorkspace(currentSlug);
    }
  }, [currentSlug, activeWorkspaceId, switchWorkspace]);

  const handleSwitchWorkspace = async (workspaceSlug: string) => {
    try {
      // Update URL to new workspace
      router.push(`/dashboard/w/${workspaceSlug}`);

      // Switch workspace in context
      await switchWorkspace(workspaceSlug);
    } catch (error) {
      console.error('Failed to switch workspace:', error);
    }
  };

  return null;
}
