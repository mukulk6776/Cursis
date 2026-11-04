'use client';

import { useDashboard } from '@/lib/dashboard/DashboardContext';

/**
 * Workspace switcher helper component
 * Provides switching between accessible workspaces without orphaned routing
 */
export default function WorkspaceSwitcher() {
  const { activeWorkspaceId, workspaces, switchWorkspace } = useDashboard();

  const handleSwitchWorkspace = async (workspaceId: string) => {
    try {
      await switchWorkspace(workspaceId);
    } catch (error) {
      console.error('Failed to switch workspace:', error);
    }
  };

  return null;
}
