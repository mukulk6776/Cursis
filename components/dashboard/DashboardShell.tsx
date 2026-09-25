'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { motion, AnimatePresence } from 'motion/react';

// Core layout components
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CommandPalette from './CommandPalette';
import NotificationPanel from './NotificationPanel';
import ProfilePanel from './ProfilePanel';
import ToastContainer from './ToastContainer';

import TaskModal from './modals/TaskModal';
import ProjectModal from './modals/ProjectModal';
import MeetingModal from './modals/MeetingModal';
import EventModal from './modals/EventModal';
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
  const pathname = usePathname();
  const isOrdisPage = pathname === '/dashboard/ordis' || pathname?.startsWith('/dashboard/ordis');

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
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="sidebar-backdrop"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close sidebar"
            />
          )}
        </AnimatePresence>

        {/* Main Section */}
        <div className="main-wrapper">
          <Topbar />
          <motion.main
            key={pathname || 'main'}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className={`main-content ${isOrdisPage ? 'main-content-ordis' : ''}`}
          >
            {children}
          </motion.main>
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
      <EventModal />
      <MemberModal />
      <MeetingNotesModal />
      <AgencyModal />
      <InviteModal />
      <GenericModal />
      <RedeemCodeModal />
      <WorkspaceSetupModal />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
