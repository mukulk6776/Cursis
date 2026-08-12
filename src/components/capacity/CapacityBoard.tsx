"use client";

// =============================================================================
// Cursis Platform — Capacity Board
// =============================================================================
// Real-time team bandwidth visualization. Workload is DYNAMICALLY CALCULATED
// by summing estimatedHours of all non-DONE tasks per user — never stored
// as a static field. Includes onboarding workflow trigger.
// =============================================================================

import React from "react";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  UserPlus,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { usePlatformStore, useUserUtilization } from "@/lib/store";
import type { User, Task } from "@/lib/types";
import { cn, getInitials, getCapacityColor } from "@/lib/utils";
import { PRIORITY_CONFIG, TASK_STATUS_LABELS } from "@/lib/types";

// ---------------------------------------------------------------------------
// User Capacity Card
// ---------------------------------------------------------------------------
function UserCapacityCard({ user }: { user: User }) {
  const { workload, capacity, ratio, isOverloaded } = useUserUtilization(user.id);
  const applyOnboardingWorkflow = usePlatformStore((s) => s.applyOnboardingWorkflow);
  const tasks = usePlatformStore((s) =>
    s.tasks.filter((t) => t.assigneeId === user.id && t.status !== "DONE")
  );
  const colors = getCapacityColor(ratio);
  const [expanded, setExpanded] = React.useState(false);
  const [onboardingApplied, setOnboardingApplied] = React.useState(false);

  const percentage = Math.min(Math.round(ratio * 100), 100);
  const overflowPercentage = ratio > 1 ? Math.round((ratio - 1) * 100) : 0;

  function handleOnboarding() {
    applyOnboardingWorkflow(user.id);
    setOnboardingApplied(true);
    setTimeout(() => setOnboardingApplied(false), 3000);
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]",
        isOverloaded && "border-red-500/20 hover:border-red-500/30"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-offset-2 ring-offset-[#07070d]",
              isOverloaded
                ? "bg-gradient-to-br from-red-500 to-rose-600 ring-red-500/40"
                : "bg-gradient-to-br from-indigo-500 to-violet-600 ring-indigo-500/20"
            )}
          >
            {getInitials(user.name)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">{user.name}</h3>
            <p className="text-xs text-white/35">{user.title}</p>
          </div>
        </div>

        {/* Overloaded Badge */}
        {isOverloaded && (
          <div className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-medium text-red-400">
            <AlertTriangle className="h-3 w-3" />
            Over capacity
          </div>
        )}
      </div>

      {/* Capacity Bar */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className={cn("text-xs font-medium", colors.text)}>
            {workload}h / {capacity}h
          </span>
          <span className={cn("text-xs font-bold", colors.text)}>
            {percentage}%
            {overflowPercentage > 0 && (
              <span className="text-red-400"> (+{overflowPercentage}%)</span>
            )}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={cn("h-full rounded-full transition-all duration-700 ease-out", colors.bar)}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Task Summary */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-white/30">
          <Briefcase className="h-3 w-3" />
          {tasks.length} active {tasks.length === 1 ? "task" : "tasks"}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/50"
        >
          {expanded ? "Hide" : "Show"}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Expanded Task List */}
      {expanded && tasks.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-white/[0.04] pt-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 rounded-lg bg-white/[0.02] p-2"
            >
              <div
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  task.status === "IN_PROGRESS"
                    ? "bg-amber-400"
                    : task.status === "REVIEW"
                    ? "bg-blue-400"
                    : "bg-slate-400"
                )}
              />
              <span className="min-w-0 flex-1 truncate text-xs text-white/50">{task.title}</span>
              <span className="shrink-0 text-[10px] text-white/25">{task.estimatedHours}h</span>
              <span
                className={cn(
                  "shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-medium",
                  PRIORITY_CONFIG[task.priority].color
                )}
              >
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Onboarding Workflow Button */}
      <div className="mt-3 border-t border-white/[0.04] pt-3">
        <button
          onClick={handleOnboarding}
          disabled={onboardingApplied}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200",
            onboardingApplied
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
          )}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {onboardingApplied ? "Onboarding tasks added ✓" : "Apply Onboarding Workflow"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team Summary Row
// ---------------------------------------------------------------------------
function TeamSummary() {
  const users = usePlatformStore((s) => s.users);
  const tasks = usePlatformStore((s) => s.tasks);

  const activeUsers = users.filter((u) => u.isActive);
  const totalCapacity = activeUsers.reduce((s, u) => s + u.weeklyCapacityHours, 0);
  const totalWorkload = tasks
    .filter((t) => t.status !== "DONE")
    .reduce((s, t) => s + t.estimatedHours, 0);
  const utilizationPct = totalCapacity > 0 ? Math.round((totalWorkload / totalCapacity) * 100) : 0;
  const overloadedCount = activeUsers.filter((user) => {
    const userWorkload = tasks
      .filter((t) => t.assigneeId === user.id && t.status !== "DONE")
      .reduce((s, t) => s + t.estimatedHours, 0);
    return userWorkload > user.weeklyCapacityHours;
  }).length;

  const summaryStats = [
    {
      label: "Total Capacity",
      value: `${totalCapacity}h`,
      icon: Clock,
      gradient: "from-indigo-500 to-violet-600",
    },
    {
      label: "Active Workload",
      value: `${totalWorkload}h`,
      icon: TrendingUp,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      label: "Utilization",
      value: `${utilizationPct}%`,
      icon: Users,
      gradient: "from-emerald-500 to-cyan-600",
    },
    {
      label: "Overloaded",
      value: overloadedCount.toString(),
      icon: AlertTriangle,
      gradient:
        overloadedCount > 0 ? "from-red-500 to-rose-600" : "from-slate-500 to-slate-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {summaryStats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
                stat.gradient
              )}
            >
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[11px] text-white/30">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Capacity Board (Main Export)
// ---------------------------------------------------------------------------
export function CapacityBoard() {
  const users = usePlatformStore((s) => s.users.filter((u) => u.isActive));

  return (
    <div className="space-y-6">
      <TeamSummary />

      <div>
        <h3 className="mb-4 text-sm font-semibold text-white/60 uppercase tracking-wider">
          Individual Capacity
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <UserCapacityCard key={user.id} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
}
