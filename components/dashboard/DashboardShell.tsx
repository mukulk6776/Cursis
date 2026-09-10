'use client';

import React from 'react';
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
import DocumentModal from './modals/DocumentModal';
import GenericModal from './modals/GenericModal';
import RedeemCodeModal from './modals/RedeemCodeModal';

interface DashboardShellProps {
  children?: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useDashboard();

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
      <DocumentModal />
      <GenericModal />
      <RedeemCodeModal />

      {/* Global Floating Ordis AI Chatbot */}
      <OrdisFloatingChat />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
