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
  GripVertical,
  MoreHorizontal,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { usePlatformStore } from "@/lib/store";
import type { Task, TaskStatus, Priority } from "@/lib/types";
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
        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-indigo-500/40 focus:bg-white/[0.06]"
      />
      <textarea
        placeholder="Description (optional)..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white/70 placeholder-white/20 outline-none transition-colors focus:border-indigo-500/40 focus:bg-white/[0.06]"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs text-white/70 outline-none"
        >
          <option value="LOW">Low Priority</option>
          <option value="MEDIUM">Medium Priority</option>
          <option value="HIGH">High Priority</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs text-white/70 outline-none"
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
        <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5">
          <Clock className="h-3 w-3 text-white/30" />
          <input
            type="number"
            min={0.5}
            max={100}
            step={0.5}
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(Number(e.target.value))}
            className="w-12 bg-transparent text-xs text-white/70 outline-none"
          />
          <span className="text-[10px] text-white/25">hrs</span>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl disabled:opacity-40 disabled:shadow-none"
        >
          Add Task
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/[0.1]"
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
    <div className="absolute right-0 top-8 z-50 w-44 overflow-hidden rounded-xl border border-white/[0.1] bg-[#12121f] shadow-2xl shadow-black/40">
      <div className="border-b border-white/[0.06] px-3 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-white/25">Move to</p>
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
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white/90"
          >
            <ArrowRight className="h-3 w-3" />
            <div className={cn("h-2 w-2 rounded-full", config.dot)} />
            {TASK_STATUS_LABELS[status]}
          </button>
        );
      })}
      <div className="border-t border-white/[0.06]">
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
        "group relative rounded-xl border bg-white/[0.02] p-3 transition-all duration-200 hover:bg-white/[0.05]",
        overdue
          ? "border-red-500/20 hover:border-red-500/30"
          : "border-white/[0.06] hover:border-white/[0.12]"
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
            className="rounded-md p-1 text-white/20 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/[0.06] hover:text-white/50"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {showMoveMenu && <MoveStatusDropdown task={task} onClose={() => setShowMoveMenu(false)} />}
        </div>
      </div>

      {/* Title — clickable to open modal */}
      <button
        onClick={() => setSelectedTask(task.id)}
        className="mb-2 w-full text-left text-sm font-medium text-white/80 transition-colors hover:text-white"
      >
        {task.title}
      </button>

      {/* Meta Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {assignee && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[8px] font-bold text-white">
              {getInitials(assignee.name)}
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] text-white/25">
            <Clock className="h-3 w-3" />
            {task.estimatedHours}h
          </div>
        </div>

        {task.dueDate && (
          <div
            className={cn(
              "flex items-center gap-1 text-[10px]",
              overdue ? "text-red-400" : "text-white/25"
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
  const tasks = usePlatformStore((s) =>
    s.tasks
      .filter((t) => {
        if (activeProjectId && t.projectId !== activeProjectId) return false;
        return t.status === status;
      })
      .sort((a, b) => a.order - b.order)
  );

  const [showAddForm, setShowAddForm] = React.useState(false);
  const config = COLUMN_CONFIG[status];

  return (
    <div className="flex min-w-[280px] flex-1 flex-col">
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("h-2.5 w-2.5 rounded-full", config.dot)} />
          <h3 className="text-sm font-semibold text-white/70">{TASK_STATUS_LABELS[status]}</h3>
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
            className="rounded-lg p-1.5 text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/60"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Column Content */}
      <div className="flex flex-1 flex-col gap-2.5 rounded-2xl border border-white/[0.04] bg-white/[0.01] p-2.5 min-h-[200px]">
        {showAddForm && (
          <AddTaskForm status={status} onClose={() => setShowAddForm(false)} />
        )}

        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}

        {tasks.length === 0 && !showAddForm && (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <div className={cn("mb-2 h-3 w-3 rounded-full opacity-20", config.dot)} />
            <p className="text-xs text-white/15">No tasks</p>
          </div>
        )}
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
  const [open, setOpen] = React.useState(false);
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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm transition-colors hover:bg-white/[0.06]"
      >
        {activeProject && (
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: activeProject.color }}
          />
        )}
        <span className="text-white/70">{activeProject?.name || "All Projects"}</span>
        <ChevronDown className="h-3.5 w-3.5 text-white/30" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/[0.1] bg-[#12121f] shadow-2xl shadow-black/40">
          <button
            onClick={() => {
              setActiveProject(null);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-2 px-4 py-2.5 text-xs transition-colors hover:bg-white/[0.06]",
              !activeProjectId ? "text-white" : "text-white/50"
            )}
          >
            All Projects
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveProject(p.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2.5 text-xs transition-colors hover:bg-white/[0.06]",
                p.id === activeProjectId ? "text-white" : "text-white/50"
              )}
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.name}
              <span className="ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/25">
                {p.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
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
        <div className="text-xs text-white/20">
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
