"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Topbar } from "@/components/navigation/Topbar";
import { PageHeader } from "@/components/page/PageHeader";

type AppShellProps = {
  title: string;
  children: ReactNode;
  actionLabel?: string;
  breadcrumb?: string;
};

export function AppShell({ title, children, actionLabel, breadcrumb }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  function toggleNavigation() {
    if (window.innerWidth < 768) {
      setMobileSidebarOpen((value) => !value);
      return;
    }

    setSidebarCollapsed((value) => !value);
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      <div className="min-w-0 flex-1 overflow-x-hidden">
        <Topbar onSidebarToggle={toggleNavigation} />
        <main className="space-y-6 p-4 sm:p-6 lg:p-8">
          <PageHeader title={title} actionLabel={actionLabel} breadcrumb={breadcrumb} />
          {children}
        </main>
      </div>
    </div>
  );
}
