"use client";

// =============================================================================
// Cursis Platform — Task Board (Kanban)
// =============================================================================
// Click-to-move Kanban board with 4 columns. Tasks are filtered by active
// project. Includes inline add task form and click-to-open detail modal.
// =============================================================================

import React from "react";
import {
  Plus,
  ChevronDown,
  Clock,
  Calendar,
  MoreHorizontal,
  Trash2,
  ArrowRight,
  FolderPlus,
  X,
} from "lucide-react";
import { usePlatformStore } from "@/lib/store";
import type { Task, TaskStatus, Priority, ProjectStatus } from "@/lib/types";
import { TASK_STATUS_ORDER, TASK_STATUS_LABELS, PRIORITY_CONFIG } from "@/lib/types";
import { cn, getInitials, formatRelativeDate, isOverdue } from "@/lib/utils";
import { TaskDetailModal } from "./TaskDetailModal";

// ---------------------------------------------------------------------------
// Column Status Config
// ---------------------------------------------------------------------------
const COLUMN_CONFIG: Record<TaskStatus, { gradient: string; dot: string; count_bg: string }> = {
  TODO: {
    gradient: "from-slate-500 to-slate-600",
    dot: "bg-slate-400",
    count_bg: "bg-slate-500/15 text-slate-400",
  },
  IN_PROGRESS: {
    gradient: "from-amber-500 to-orange-600",
    dot: "bg-amber-400",
    count_bg: "bg-amber-500/15 text-amber-400",
  },
  REVIEW: {
    gradient: "from-blue-500 to-cyan-600",
    dot: "bg-blue-400",
    count_bg: "bg-blue-500/15 text-blue-400",
  },
  DONE: {
    gradient: "from-emerald-500 to-green-600",
    dot: "bg-emerald-400",
    count_bg: "bg-emerald-500/15 text-emerald-400",
  },
};

// ---------------------------------------------------------------------------
// Add Task Form
// ---------------------------------------------------------------------------
function AddTaskForm({
  status,
  onClose,
}: {
  status: TaskStatus;
  onClose: () => void;
}) {
  const addTask = usePlatformStore((s) => s.addTask);
  const users = usePlatformStore((s) => s.users);
  const activeProjectId = usePlatformStore((s) => s.activeProjectId);
  const projects = usePlatformStore((s) => s.projects);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>("MEDIUM");
  const [assigneeId, setAssigneeId] = React.useState<string>(users[0]?.id || "");
  const [estimatedHours, setEstimatedHours] = React.useState(4);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const projectId = activeProjectId || projects[0]?.id;
    if (!projectId) return;

    addTask({
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      estimatedHours,
      dueDate: null,
      projectId,
      assigneeId: assigneeId || null,
    });

    setTitle("");
    setDescription("");
    onClose();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-indigo-500/30 bg-indigo-500/[0.05] p-3 space-y-2.5"
    >
      <input
        autoFocus
        type="text"
        placeholder="Task title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-lg border border-content/[0.08] bg-content/[0.04] px-3 py-2 text-sm text-content placeholder-content/20 outline-none transition-colors focus:border-indigo-500/40 focus:bg-content/[0.06]"
      />
      <textarea
        placeholder="Description (optional)..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-lg border border-content/[0.08] bg-content/[0.04] px-3 py-2 text-xs text-content/70 placeholder-content/20 outline-none transition-colors focus:border-indigo-500/40 focus:bg-content/[0.06]"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="rounded-lg border border-content/[0.08] bg-content/[0.04] px-2 py-1.5 text-xs text-content/70 outline-none"
        >
          <option value="LOW">Low Priority</option>
          <option value="MEDIUM">Medium Priority</option>
          <option value="HIGH">High Priority</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="rounded-lg border border-content/[0.08] bg-content/[0.04] px-2 py-1.5 text-xs text-content/70 outline-none"
        >
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-content/[0.08] bg-content/[0.04] px-2 py-1.5">
          <Clock className="h-3 w-3 text-content/30" />
          <input
            type="number"
            min={0.5}
            max={100}
            step={0.5}
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(Number(e.target.value))}
            className="w-12 bg-transparent text-xs text-content/70 outline-none"
          />
          <span className="text-[10px] text-content/25">hrs</span>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-1.5 text-xs font-medium text-content shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl disabled:opacity-40 disabled:shadow-none"
        >
          Add Task
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-content/[0.06] px-3 py-1.5 text-xs text-content/50 transition-colors hover:bg-content/[0.1]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Move Status Dropdown
// ---------------------------------------------------------------------------
function MoveStatusDropdown({
  task,
  onClose,
}: {
  task: Task;
  onClose: () => void;
}) {
  const moveTaskStatus = usePlatformStore((s) => s.moveTaskStatus);
  const deleteTask = usePlatformStore((s) => s.deleteTask);

  const availableStatuses = TASK_STATUS_ORDER.filter((s) => s !== task.status);

  return (
    <div className="absolute right-0 top-8 z-50 w-44 overflow-hidden rounded-xl border border-content/[0.1] bg-surface shadow-2xl shadow-content/40">
      <div className="border-b border-content/[0.06] px-3 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-content/25">Move to</p>
      </div>
      {availableStatuses.map((status) => {
        const config = COLUMN_CONFIG[status];
        return (
          <button
            key={status}
            onClick={() => {
              moveTaskStatus(task.id, status);
              onClose();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-content/60 transition-colors hover:bg-content/[0.06] hover:text-content/90"
          >
            <ArrowRight className="h-3 w-3" />
            <div className={cn("h-2 w-2 rounded-full", config.dot)} />
            {TASK_STATUS_LABELS[status]}
          </button>
        );
      })}
      <div className="border-t border-content/[0.06]">
        <button
          onClick={() => {
            deleteTask(task.id);
            onClose();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
          Delete Task
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task Card
// ---------------------------------------------------------------------------
function TaskCard({ task }: { task: Task }) {
  const users = usePlatformStore((s) => s.users);
  const setSelectedTask = usePlatformStore((s) => s.setSelectedTask);
  const [showMoveMenu, setShowMoveMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const assignee = users.find((u) => u.id === task.assigneeId);
  const overdue = isOverdue(task.dueDate) && task.status !== "DONE";

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoveMenu(false);
      }
    }
    if (showMoveMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMoveMenu]);

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-content/[0.02] p-3 transition-all duration-200 hover:bg-content/[0.05]",
        overdue
          ? "border-red-500/20 hover:border-red-500/30"
          : "border-content/[0.06] hover:border-content/[0.12]"
      )}
    >
      {/* Top Row: Priority + Actions */}
      <div className="mb-2 flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
            PRIORITY_CONFIG[task.priority].color
          )}
        >
          <div className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_CONFIG[task.priority].dotColor)} />
          {PRIORITY_CONFIG[task.priority].label}
        </span>

        <div ref={menuRef} className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMoveMenu(!showMoveMenu);
            }}
            className="rounded-md p-1 text-content/20 opacity-0 transition-all group-hover:opacity-100 hover:bg-content/[0.06] hover:text-content/50"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {showMoveMenu && <MoveStatusDropdown task={task} onClose={() => setShowMoveMenu(false)} />}
        </div>
      </div>

      {/* Title — clickable to open modal */}
      <button
        onClick={() => setSelectedTask(task.id)}
        className="mb-2 w-full text-left text-sm font-medium text-content/80 transition-colors hover:text-content"
      >
        {task.title}
      </button>

      {/* Meta Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {assignee && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[8px] font-bold text-content">
              {getInitials(assignee.name)}
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] text-content/25">
            <Clock className="h-3 w-3" />
            {task.estimatedHours}h
          </div>
        </div>

        {task.dueDate && (
          <div
            className={cn(
              "flex items-center gap-1 text-[10px]",
              overdue ? "text-red-400" : "text-content/25"
            )}
          >
            <Calendar className="h-3 w-3" />
            {formatRelativeDate(task.dueDate)}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanban Column
// ---------------------------------------------------------------------------
function KanbanColumn({ status }: { status: TaskStatus }) {
  const activeProjectId = usePlatformStore((s) => s.activeProjectId);
  const allTasks = usePlatformStore((s) => s.tasks);
  const tasks = React.useMemo(() => {
    return allTasks
      .filter((t) => {
        if (activeProjectId && t.projectId !== activeProjectId) return false;
        return t.status === status;
      })
      .sort((a, b) => a.order - b.order);
  }, [allTasks, activeProjectId, status]);

  const [showAddForm, setShowAddForm] = React.useState(false);
  const config = COLUMN_CONFIG[status];

  return (
    <div className="flex min-w-[280px] flex-1 flex-col">
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("h-2.5 w-2.5 rounded-full", config.dot)} />
          <h3 className="text-sm font-semibold text-content/70">{TASK_STATUS_LABELS[status]}</h3>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-bold",
              config.count_bg
            )}
          >
            {tasks.length}
          </span>
        </div>
        {status === "TODO" && (
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg p-1.5 text-content/25 transition-colors hover:bg-content/[0.06] hover:text-content/60"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Column Content */}
      <div className="flex flex-1 flex-col gap-2.5 rounded-2xl border border-content/[0.04] bg-content/[0.01] p-2.5 min-h-[200px]">
        {showAddForm && (
          <AddTaskForm status={status} onClose={() => setShowAddForm(false)} />
        )}

        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}

        {tasks.length === 0 && !showAddForm && (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <div className={cn("mb-2 h-3 w-3 rounded-full opacity-20", config.dot)} />
            <p className="text-xs text-content/15">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Project Modal
// ---------------------------------------------------------------------------
const PROJECT_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6",
];

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const addProject = usePlatformStore((s) => s.addProject);
  const organization = usePlatformStore((s) => s.organization);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>("MEDIUM");
  const [color, setColor] = React.useState(PROJECT_COLORS[0]);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !organization) return;

    setLoading(true);
    try {
      await addProject({
        name: name.trim(),
        description: description.trim() || null,
        status: "ACTIVE" as ProjectStatus,
        priority,
        color,
        organizationId: organization.id,
        startDate: new Date().toISOString(),
        endDate: null,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-content/[0.08] bg-surface shadow-2xl shadow-content/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-content/[0.06] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
              <FolderPlus className="h-4 w-4 text-content" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-content">New Project</h2>
              <p className="text-[11px] text-content/30">Create a new project to organize tasks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-content/30 transition-colors hover:bg-content/[0.06] hover:text-content/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-content/25">
              Project Name
            </label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. MVP Launch, Marketing Sprint..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-content/[0.08] bg-content/[0.04] px-4 py-2.5 text-sm text-content placeholder-content/20 outline-none transition-colors focus:border-indigo-500/40 focus:bg-content/[0.06]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-content/25">
              Description
            </label>
            <textarea
              placeholder="What is this project about? (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-content/[0.08] bg-content/[0.04] px-4 py-2.5 text-sm text-content/70 placeholder-content/20 outline-none transition-colors focus:border-indigo-500/40 focus:bg-content/[0.06]"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-content/25">
              Priority
            </label>
            <div className="flex gap-1.5">
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all",
                    priority === p
                      ? cn(PRIORITY_CONFIG[p].color, "ring-1 ring-current/20")
                      : "border-content/[0.06] bg-content/[0.02] text-content/25 hover:bg-content/[0.04]"
                  )}
                >
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      priority === p ? PRIORITY_CONFIG[p].dotColor : "bg-content/20"
                    )}
                  />
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-content/25">
              Color
            </label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full transition-all",
                    color === c ? "ring-2 ring-content/40 ring-offset-2 ring-offset-[#0e0e1a] scale-110" : "hover:scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-medium text-content shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl disabled:opacity-40 disabled:shadow-none"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-content/[0.06] px-4 py-2.5 text-sm text-content/50 transition-colors hover:bg-content/[0.1]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project Selector
// ---------------------------------------------------------------------------
function ProjectSelector() {
  const projects = usePlatformStore((s) => s.projects);
  const activeProjectId = usePlatformStore((s) => s.activeProjectId);
  const setActiveProject = usePlatformStore((s) => s.setActiveProject);
  const deleteProject = usePlatformStore((s) => s.deleteProject);
  const [open, setOpen] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <>
      <div ref={ref} className="relative flex items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-xl border border-content/[0.08] bg-content/[0.03] px-4 py-2 text-sm transition-colors hover:bg-content/[0.06]"
        >
          {activeProject && (
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: activeProject.color }}
            />
          )}
          <span className="text-content/70">{activeProject?.name || "All Projects"}</span>
          <ChevronDown className="h-3.5 w-3.5 text-content/30" />
        </button>

        {/* New Project Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/[0.06] px-3 py-2 text-xs font-medium text-indigo-400 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/[0.1]"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          New Project
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-content/[0.1] bg-surface shadow-2xl shadow-content/40">
            <button
              onClick={() => {
                setActiveProject(null);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2.5 text-xs transition-colors hover:bg-content/[0.06]",
                !activeProjectId ? "text-content" : "text-content/50"
              )}
            >
              All Projects
            </button>
            {projects.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "group flex w-full items-center gap-2 px-4 py-2.5 text-xs transition-colors hover:bg-content/[0.06]",
                  p.id === activeProjectId ? "text-content" : "text-content/50"
                )}
              >
                <button
                  className="flex min-w-0 flex-1 items-center gap-2"
                  onClick={() => {
                    setActiveProject(p.id);
                    setOpen(false);
                  }}
                >
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="truncate">{p.name}</span>
                  <span className="ml-auto shrink-0 rounded-full bg-content/[0.06] px-1.5 py-0.5 text-[10px] text-content/25">
                    {p.status}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete project "${p.name}"? All tasks in this project will be deleted.`)) {
                      deleteProject(p.id);
                      setOpen(false);
                    }
                  }}
                  className="shrink-0 rounded-md p-1 text-content/0 transition-all group-hover:text-content/20 hover:!bg-red-500/15 hover:!text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}

            {/* Create from dropdown */}
            <div className="border-t border-content/[0.06]">
              <button
                onClick={() => {
                  setOpen(false);
                  setShowCreateModal(true);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-indigo-400/70 transition-colors hover:bg-indigo-500/10 hover:text-indigo-400"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                Create New Project
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && <CreateProjectModal onClose={() => setShowCreateModal(false)} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Task Board (Main Export)
// ---------------------------------------------------------------------------
export function TaskBoard() {
  const selectedTaskId = usePlatformStore((s) => s.selectedTaskId);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <ProjectSelector />
        <div className="text-xs text-content/20">
          Click the <MoreHorizontal className="inline h-3 w-3" /> menu on any card to move it
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_STATUS_ORDER.map((status) => (
          <KanbanColumn key={status} status={status} />
        ))}
      </div>

      {/* Task Detail Modal */}
      {selectedTaskId && <TaskDetailModal taskId={selectedTaskId} />}
    </div>
  );
}
