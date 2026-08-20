"use client";

// =============================================================================
// Cursis Platform — Dashboard Layout
// =============================================================================
// Premium dark SaaS layout with glassmorphism sidebar, responsive header,
// and dynamic content area driven by activeView from Zustand store.
// =============================================================================

import React from "react";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Zap,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePlatformStore } from "@/lib/store";
import type { ActiveView } from "@/lib/types";
import { cn, getInitials } from "@/lib/utils";
import { CapacityBoard } from "@/components/capacity/CapacityBoard";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { logout } from "@/app/auth-actions";

// ---------------------------------------------------------------------------
// Navigation Config
// ---------------------------------------------------------------------------
const NAV_ITEMS: Array<{
  id: ActiveView;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Overview & metrics" },
  { id: "tasks", label: "Projects", icon: KanbanSquare, description: "Task boards" },
  { id: "capacity", label: "Capacity", icon: Users, description: "Team workload" },
  { id: "settings", label: "Settings", icon: Settings, description: "Preferences" },
];

// ---------------------------------------------------------------------------
// Sidebar Component
// ---------------------------------------------------------------------------
function Sidebar() {
  const activeView = usePlatformStore((s) => s.activeView);
  const setActiveView = usePlatformStore((s) => s.setActiveView);
  const collapsed = usePlatformStore((s) => s.sidebarCollapsed);
  const toggleSidebar = usePlatformStore((s) => s.toggleSidebar);
  const org = usePlatformStore((s) => s.organization);
  const currentUser = usePlatformStore((s) => s.currentUser);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-content/[0.06] transition-all duration-300 ease-in-out",
        "bg-surface/80 backdrop-blur-2xl",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Org Header */}
      <div className="flex h-16 items-center gap-3 border-b border-content/[0.06] px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/25">
          <Zap className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-content">{org?.name}</h1>
            <p className="truncate text-[11px] text-content/40">Startup Ops Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-content/[0.08] text-content shadow-lg shadow-content/20"
                  : "text-content/50 hover:bg-content/[0.04] hover:text-content/80"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-500" />
              )}
              <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-indigo-400" : "")} />
              {!collapsed && (
                <div className="min-w-0 flex-1 text-left">
                  <span>{item.label}</span>
                  {isActive && (
                    <p className="truncate text-[11px] font-normal text-content/30">{item.description}</p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-content/[0.06] px-3 py-2">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg p-2 text-content/30 transition-colors hover:bg-content/[0.04] hover:text-content/60"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* User Card */}
      <div className="border-t border-content/[0.06] p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-xs font-bold text-white">
            {getInitials(currentUser?.name || "U")}
          </div>
          {!collapsed && currentUser && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-content/80">{currentUser.name}</p>
              <p className="truncate text-[11px] text-content/30">{currentUser.title}</p>
            </div>
          )}
          {!collapsed && (
            <button 
              onClick={() => logout()}
              className="rounded-lg p-1.5 text-content/20 transition-colors hover:bg-content/[0.04] hover:text-red-400"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Header Component
// ---------------------------------------------------------------------------
function Header() {
  const activeView = usePlatformStore((s) => s.activeView);
  const collapsed = usePlatformStore((s) => s.sidebarCollapsed);
  const { theme, setTheme } = useTheme();

  const viewTitles: Record<ActiveView, { title: string; subtitle: string }> = {
    dashboard: { title: "Dashboard", subtitle: "Your operational command center" },
    tasks: { title: "Project Execution", subtitle: "Manage tasks and track deadlines" },
    capacity: { title: "Team Capacity", subtitle: "Monitor workload and bandwidth" },
    settings: { title: "Settings", subtitle: "Configure your workspace" },
  };

  const { title, subtitle } = viewTitles[activeView];

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-content/[0.06] bg-background/80 px-6 backdrop-blur-xl transition-all duration-300",
        collapsed ? "ml-[72px]" : "ml-[260px]"
      )}
    >
      <div>
        <h2 className="text-lg font-semibold text-content">{title}</h2>
        <p className="text-xs text-content/35">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl border border-content/[0.06] bg-content/[0.03] px-3 py-2">
          <Search className="h-3.5 w-3.5 text-content/25" />
          <input
            type="text"
            placeholder="Search..."
            className="w-40 bg-transparent text-sm text-content/70 placeholder-content/20 outline-none"
          />
          <kbd className="rounded border border-content/[0.08] bg-content/[0.04] px-1.5 py-0.5 text-[10px] text-content/20">
            ⌘K
          </kbd>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-xl border border-content/[0.06] bg-content/[0.03] p-2.5 text-content/30 transition-colors hover:bg-content/[0.06] hover:text-content/60"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <button className="relative rounded-xl border border-content/[0.06] bg-content/[0.03] p-2.5 text-content/30 transition-colors hover:bg-content/[0.06] hover:text-content/60">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-[9px] font-bold text-content">
            3
          </span>
        </button>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Overview (Default View)
// ---------------------------------------------------------------------------
function DashboardOverview() {
  const tasks = usePlatformStore((s) => s.tasks);
  const projects = usePlatformStore((s) => s.projects);
  const users = usePlatformStore((s) => s.users);

  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const reviewCount = tasks.filter((t) => t.status === "REVIEW").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  const totalEstimated = tasks.reduce((s, t) => s + t.estimatedHours, 0);
  const completedHours = tasks
    .filter((t) => t.status === "DONE")
    .reduce((s, t) => s + t.estimatedHours, 0);

  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
  );

  const stats = [
    {
      label: "Active Projects",
      value: projects.filter((p) => p.status === "ACTIVE").length,
      icon: KanbanSquare,
      gradient: "from-indigo-500 to-violet-600",
      glow: "shadow-indigo-500/20",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      icon: Zap,
      gradient: "from-amber-500 to-orange-600",
      glow: "shadow-amber-500/20",
    },
    {
      label: "Team Members",
      value: users.filter((u) => u.isActive).length,
      icon: Users,
      gradient: "from-emerald-500 to-cyan-600",
      glow: "shadow-emerald-500/20",
    },
    {
      label: "Overdue",
      value: overdueTasks.length,
      icon: Bell,
      gradient: overdueTasks.length > 0 ? "from-red-500 to-rose-600" : "from-slate-500 to-slate-600",
      glow: overdueTasks.length > 0 ? "shadow-red-500/20" : "shadow-slate-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-content/[0.06] bg-content/[0.02] p-5 transition-all duration-300 hover:border-content/[0.1] hover:bg-content/[0.04]",
                `hover:shadow-xl hover:${stat.glow}`
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-content/40">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold text-content">{stat.value}</p>
                </div>
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
                    stat.gradient,
                    stat.glow
                  )}
                >
                  <Icon className="h-5 w-5 text-content" />
                </div>
              </div>
              {/* Decorative gradient line */}
              <div
                className={cn(
                  "absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                  stat.gradient
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Execution Progress */}
        <div className="rounded-2xl border border-content/[0.06] bg-content/[0.02] p-6">
          <h3 className="text-sm font-semibold text-content/80">Execution Progress</h3>
          <p className="mt-1 text-xs text-content/30">
            {completedHours} of {totalEstimated} estimated hours completed
          </p>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-content/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
              style={{
                width: `${totalEstimated > 0 ? (completedHours / totalEstimated) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { label: "To Do", count: todoCount, color: "bg-slate-400" },
              { label: "In Progress", count: inProgressCount, color: "bg-amber-400" },
              { label: "Review", count: reviewCount, color: "bg-blue-400" },
              { label: "Done", count: doneCount, color: "bg-emerald-400" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-content/[0.03] p-3 text-center">
                <div className={cn("mx-auto mb-1.5 h-1.5 w-1.5 rounded-full", item.color)} />
                <p className="text-lg font-bold text-content">{item.count}</p>
                <p className="text-[10px] text-content/30">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-content/[0.06] bg-content/[0.02] p-6">
          <h3 className="text-sm font-semibold text-content/80">Recent Tasks</h3>
          <p className="mt-1 text-xs text-content/30">Latest task updates across all projects</p>
          <div className="mt-4 space-y-3">
            {tasks
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 5)
              .map((task) => {
                const assignee = users.find((u) => u.id === task.assigneeId);
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-xl bg-content/[0.02] p-3 transition-colors hover:bg-content/[0.04]"
                  >
                    <div
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        task.status === "DONE"
                          ? "bg-emerald-400"
                          : task.status === "IN_PROGRESS"
                          ? "bg-amber-400"
                          : task.status === "REVIEW"
                          ? "bg-blue-400"
                          : "bg-slate-400"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-content/70">{task.title}</p>
                      <p className="text-[11px] text-content/25">
                        {assignee?.name || "Unassigned"} · {task.estimatedHours}h
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium",
                        task.priority === "CRITICAL"
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : task.priority === "HIGH"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : task.priority === "MEDIUM"
                          ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                          : "border-slate-500/30 bg-slate-500/10 text-slate-400"
                      )}
                    >
                      {task.priority}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings View (Placeholder that works)
// ---------------------------------------------------------------------------
function SettingsView() {
  const org = usePlatformStore((s) => s.organization);
  const resetStore = usePlatformStore((s) => s.resetStore);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-2xl border border-content/[0.06] bg-content/[0.02] p-6">
        <h3 className="text-sm font-semibold text-content/80">Organization</h3>
        <p className="mt-1 text-xs text-content/30">Manage your workspace settings</p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-content/[0.03] p-4">
            <div>
              <p className="text-sm font-medium text-content/70">Organization Name</p>
              <p className="text-xs text-content/30">{org?.name}</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-content/[0.03] p-4">
            <div>
              <p className="text-sm font-medium text-content/70">Slug</p>
              <p className="text-xs text-content/30">{org?.slug}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-6">
        <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
        <p className="mt-1 text-xs text-content/30">Reset all data to the original seed state</p>
        <button
          onClick={resetStore}
          className="mt-4 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
        >
          Reset All Data
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Layout
// ---------------------------------------------------------------------------
export function DashboardLayout() {
  const activeView = usePlatformStore((s) => s.activeView);
  const collapsed = usePlatformStore((s) => s.sidebarCollapsed);

  function renderContent() {
    switch (activeView) {
      case "dashboard":
        return <DashboardOverview />;
      case "capacity":
        return <CapacityBoard />;
      case "tasks":
        return <TaskBoard />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardOverview />;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main
        className={cn(
          "min-h-[calc(100vh-64px)] p-6 transition-all duration-300",
          collapsed ? "ml-[72px]" : "ml-[260px]"
        )}
      >
        {renderContent()}
      </main>
    </div>
  );
}
