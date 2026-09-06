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
import AutomationModal from './modals/AutomationModal';
import MeetingNotesModal from './modals/MeetingNotesModal';
import AgencyModal from './modals/AgencyModal';
import InviteModal from './modals/InviteModal';
import DocumentModal from './modals/DocumentModal';
import GenericModal from './modals/GenericModal';

// Pages
import HomePage from './pages/HomePage';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import TeamPage from './pages/TeamPage';
import CalendarPage from './pages/CalendarPage';
import MeetingsPage from './pages/MeetingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import WorkspacePage from './pages/WorkspacePage';
import AutomationsPage from './pages/AutomationsPage';
import OrdisPage from './pages/OrdisPage';
import DocumentsPage from './pages/DocumentsPage';
import MessagesPage from './pages/MessagesPage';
import IntegrationsPage from './pages/IntegrationsPage';
import SettingsPage from './pages/SettingsPage';

export default function DashboardShell() {
  const { currentPage } = useDashboard();

  const renderActivePage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'tasks':
        return <TasksPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'team':
        return <TeamPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'meetings':
        return <MeetingsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'workspace':
        return <WorkspacePage />;
      case 'automations':
        return <AutomationsPage />;
      case 'ordis':
        return <OrdisPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'messages':
        return <MessagesPage />;
      case 'integrations':
        return <IntegrationsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="cursis-dashboard-root">
      <div className="app">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Section */}
        <div className="main-wrapper">
          <Topbar />
          <main className="main-content">{renderActivePage()}</main>
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
      <AutomationModal />
      <MeetingNotesModal />
      <AgencyModal />
      <InviteModal />
      <DocumentModal />
      <GenericModal />

      {/* Global Floating Ordis AI Chatbot */}
      <OrdisFloatingChat />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
