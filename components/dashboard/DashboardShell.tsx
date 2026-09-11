'use client';

import React, { useEffect } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

// Core layout components
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CommandPalette from './CommandPalette';
import NotificationPanel from './NotificationPanel';
import ProfilePanel from './ProfilePanel';
import ToastContainer from './ToastContainer';
import OrdisFloatingChat from './panels/OrdisFloatingChat';

import TaskModal from './modals/TaskModal';
import ProjectModal from './modals/ProjectModal';
import MeetingModal from './modals/MeetingModal';
import MemberModal from './modals/MemberModal';
import MeetingNotesModal from './modals/MeetingNotesModal';
import AgencyModal from './modals/AgencyModal';
import InviteModal from './modals/InviteModal';
import GenericModal from './modals/GenericModal';
import RedeemCodeModal from './modals/RedeemCodeModal';
import WorkspaceSetupModal from './modals/WorkspaceSetupModal';

interface DashboardShellProps {
  children?: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { mobileSidebarOpen, setMobileSidebarOpen, openModal } = useDashboard();

  // Trigger workspace setup options screen when user logs in or hasn't completed onboarding
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isSetupParam = urlParams.get('setup') === 'true' || urlParams.get('onboarding') === 'true';
      const showFromLogin =
        sessionStorage.getItem('cursis_show_workspace_setup') === 'true' ||
        localStorage.getItem('cursis_show_workspace_setup') === 'true';
      const notCompleted = !localStorage.getItem('cursis_workspace_setup_completed');

      if (isSetupParam || showFromLogin || notCompleted) {
        // Small timeout to allow context hydration
        const timer = setTimeout(() => {
          openModal('workspace-setup-modal');
        }, 350);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [openModal]);

  return (
    <div className="cursis-dashboard-root">
      <div className="app">
        {/* Sidebar */}
        <Sidebar />

        {/* Mobile Sidebar Backdrop Overlay */}
        {mobileSidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        {/* Main Section */}
        <div className="main-wrapper">
          <Topbar />
          <main className="main-content">{children}</main>
        </div>
      </div>

      {/* Slide-over Drawers & Overlays */}
      <NotificationPanel />
      <ProfilePanel />
      <CommandPalette />

      {/* Dialog Modals */}
      <TaskModal />
      <ProjectModal />
      <MeetingModal />
      <MemberModal />
      <MeetingNotesModal />
      <AgencyModal />
      <InviteModal />
      <GenericModal />
      <RedeemCodeModal />
      <WorkspaceSetupModal />

      {/* Global Floating Ordis AI Chatbot */}
      <OrdisFloatingChat />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
