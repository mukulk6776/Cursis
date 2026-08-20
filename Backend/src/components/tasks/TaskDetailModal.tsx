"use client";

// =============================================================================
// Cursis Platform — Task Detail Modal
// =============================================================================
// Full-featured task detail view with:
// - Working comment thread (submit → Zustand → instant re-render)
// - Assignee selector with capacity warnings
// - Status change buttons
// - Inline date picker for firm deadlines
// - Priority selector
// =============================================================================

import React from "react";
import {
  X,
  Clock,
  AlertTriangle,
  MessageSquare,
  Calendar,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Send,
} from "lucide-react";
import { usePlatformStore, useTaskComments } from "@/lib/store";
import type { TaskStatus, Priority } from "@/lib/types";
import { TASK_STATUS_ORDER, TASK_STATUS_LABELS, PRIORITY_CONFIG } from "@/lib/types";
import { cn, getInitials, formatDate, isOverdue } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Inline Date Picker (Calendar)
// ---------------------------------------------------------------------------
function InlineDatePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (date: string | null) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(() => {
    if (value) return new Date(value);
    return new Date();
  });
  const ref = React.useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

  // Previous month padding
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }

  // Next month padding
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
  }

  function isSameDay(a: Date, b: Date | null) {
    if (!b) return false;
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  const today = new Date();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
          value
            ? isOverdue(value)
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : "border-content/[0.1] bg-content/[0.04] text-content/70"
            : "border-dashed border-content/[0.1] bg-content/[0.02] text-content/30"
        )}
      >
        <Calendar className="h-3.5 w-3.5" />
        {value ? formatDate(value) : "Set deadline"}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-content/[0.1] bg-surface p-4 shadow-2xl shadow-content/40">
          {/* Month Navigation */}
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="rounded-lg p-1 text-content/30 hover:bg-content/[0.06] hover:text-content/60"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-content/70">{monthName}</span>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="rounded-lg p-1 text-content/30 hover:bg-content/[0.06] hover:text-content/60"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="mb-1 grid grid-cols-7 gap-0">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="py-1 text-center text-[10px] font-medium text-content/25">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-0">
            {days.map((day, idx) => {
              const isSelected = isSameDay(day.date, selectedDate);
              const isToday = isSameDay(day.date, today);
              return (
                <button
                  key={idx}
                  onClick={() => {
                    onChange(day.date.toISOString());
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-lg text-xs transition-all",
                    !day.isCurrentMonth && "text-content/10",
                    day.isCurrentMonth && !isSelected && "text-content/50 hover:bg-content/[0.06] hover:text-content/80",
                    isToday && !isSelected && "font-bold text-indigo-400",
                    isSelected && "bg-gradient-to-r from-indigo-500 to-violet-600 font-bold text-white shadow-lg shadow-indigo-500/25"
                  )}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-3 flex items-center gap-2 border-t border-content/[0.06] pt-3">
            <button
              onClick={() => {
                onChange(new Date().toISOString());
                setIsOpen(false);
              }}
              className="flex-1 rounded-lg bg-content/[0.04] px-2 py-1.5 text-[10px] text-content/40 hover:bg-content/[0.08]"
            >
              Today
            </button>
            <button
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 7);
                onChange(d.toISOString());
                setIsOpen(false);
              }}
              className="flex-1 rounded-lg bg-content/[0.04] px-2 py-1.5 text-[10px] text-content/40 hover:bg-content/[0.08]"
            >
              +7 Days
            </button>
            {value && (
              <button
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                className="flex-1 rounded-lg bg-red-500/10 px-2 py-1.5 text-[10px] text-red-400/60 hover:bg-red-500/20"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assignee Selector with Capacity Check
// ---------------------------------------------------------------------------
function AssigneeSelector({
  currentAssigneeId,
  onSelect,
}: {
  currentAssigneeId: string | null;
  onSelect: (userId: string | null) => void;
}) {
  const users = usePlatformStore((s) => s.users);
  const tasks = usePlatformStore((s) => s.tasks);
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const currentAssignee = users.find((u) => u.id === currentAssigneeId);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-content/[0.1] bg-content/[0.04] px-3 py-2 text-xs transition-colors hover:bg-content/[0.06]"
      >
        {currentAssignee ? (
          <>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[8px] font-bold text-content">
              {getInitials(currentAssignee.name)}
            </div>
            <span className="text-content/70">{currentAssignee.name}</span>
          </>
        ) : (
          <>
            <UserIcon className="h-3.5 w-3.5 text-content/30" />
            <span className="text-content/30">Assign</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-content/[0.1] bg-surface shadow-2xl shadow-content/40">
          <div className="border-b border-content/[0.06] px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-content/25">
              Assign to
            </p>
          </div>

          <button
            onClick={() => {
              onSelect(null);
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-content/40 transition-colors hover:bg-content/[0.06]"
          >
            <UserIcon className="h-3.5 w-3.5" />
            Unassigned
          </button>

          {users.map((user) => {
            const workload = tasks
              .filter((t) => t.assigneeId === user.id && t.status !== "DONE")
              .reduce((sum, t) => sum + t.estimatedHours, 0);
            const ratio = user.weeklyCapacityHours > 0 ? workload / user.weeklyCapacityHours : 0;
            const isOverloaded = ratio > 1.0;
            const isCurrent = user.id === currentAssigneeId;

            return (
              <button
                key={user.id}
                onClick={() => {
                  onSelect(user.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-content/[0.06]",
                  isCurrent ? "bg-content/[0.04] text-content" : "text-content/60"
                )}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[9px] font-bold text-content">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate">{user.name}</p>
                  <p className="text-[10px] text-content/25">{user.title}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      "text-[10px] font-medium",
                      isOverloaded ? "text-red-400" : "text-content/30"
                    )}
                  >
                    {workload}/{user.weeklyCapacityHours}h
                  </p>
                  {isOverloaded && (
                    <div className="flex items-center gap-0.5 text-[9px] text-red-400">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Over
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comment Thread
// ---------------------------------------------------------------------------
function CommentThread({ taskId }: { taskId: string }) {
  const comments = useTaskComments(taskId);
  const users = usePlatformStore((s) => s.users);
  const addComment = usePlatformStore((s) => s.addComment);
  const currentUserId = usePlatformStore((s) => s.users[0]?.id);

  const [newComment, setNewComment] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;
    addComment(taskId, newComment.trim(), currentUserId);
    setNewComment("");
  }

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-content/30" />
        <h4 className="text-sm font-semibold text-content/60">
          Comments ({comments.length})
        </h4>
      </div>

      {/* Comment List */}
      <div
        ref={scrollRef}
        className="max-h-60 space-y-3 overflow-y-auto pr-1"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.05) transparent" }}
      >
        {comments.length === 0 && (
          <div className="rounded-xl bg-content/[0.02] p-4 text-center">
            <MessageSquare className="mx-auto mb-2 h-5 w-5 text-content/10" />
            <p className="text-xs text-content/20">No comments yet</p>
          </div>
        )}
        {comments.map((comment) => {
          const author = users.find((u) => u.id === comment.authorId);
          return (
            <div key={comment.id} className="flex gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[9px] font-bold text-content">
                {getInitials(author?.name || "?")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-content/70">
                    {author?.name || "Unknown"}
                  </span>
                  <span className="text-[10px] text-content/20">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-content/50">{comment.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2">
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            className="w-full resize-none rounded-xl border border-content/[0.08] bg-content/[0.04] px-3 py-2 text-xs text-content/70 placeholder-content/20 outline-none transition-colors focus:border-indigo-500/40 focus:bg-content/[0.06]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="flex h-[52px] w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl disabled:opacity-30 disabled:shadow-none"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      <p className="mt-1.5 text-[10px] text-content/15">Press Ctrl+Enter to send</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task Detail Modal (Main Export)
// ---------------------------------------------------------------------------
export function TaskDetailModal({ taskId }: { taskId: string }) {
  const task = usePlatformStore((s) => s.tasks.find((t) => t.id === taskId));
  const updateTask = usePlatformStore((s) => s.updateTask);
  const moveTaskStatus = usePlatformStore((s) => s.moveTaskStatus);
  const setSelectedTask = usePlatformStore((s) => s.setSelectedTask);
  const projects = usePlatformStore((s) => s.projects);

  if (!task) return null;

  const currentTask = task;
  const project = projects.find((p) => p.id === currentTask.projectId);
  const overdue = isOverdue(currentTask.dueDate) && currentTask.status !== "DONE";

  function handleClose() {
    setSelectedTask(null);
  }

  function handleStatusChange(newStatus: TaskStatus) {
    moveTaskStatus(currentTask.id, newStatus);
  }

  function handleAssigneeChange(userId: string | null) {
    updateTask(currentTask.id, { assigneeId: userId });
  }

  function handleDueDateChange(date: string | null) {
    updateTask(currentTask.id, { dueDate: date });
  }

  function handlePriorityChange(priority: Priority) {
    updateTask(currentTask.id, { priority });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-content/[0.08] bg-surface shadow-2xl shadow-content/50">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-content/[0.06] bg-surface/95 p-5 backdrop-blur-xl">
          <div className="min-w-0 flex-1 pr-4">
            {project && (
              <div className="mb-1.5 flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-[11px] text-content/30">{project.name}</span>
              </div>
            )}
            <h2 className="text-lg font-semibold text-content/90">{currentTask.title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-content/30 transition-colors hover:bg-content/[0.06] hover:text-content/60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Status Buttons */}
          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-content/25">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {TASK_STATUS_ORDER.map((status) => {
                const isActive = currentTask.status === status;
                const config: Record<TaskStatus, string> = {
                  TODO: "bg-slate-500/15 text-slate-400 hover:bg-slate-500/25",
                  IN_PROGRESS: "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25",
                  REVIEW: "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25",
                  DONE: "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25",
                };
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                      isActive
                        ? cn(config[status], "ring-1 ring-current/30 shadow-lg")
                        : "bg-content/[0.04] text-content/25 hover:bg-content/[0.08] hover:text-content/50"
                    )}
                  >
                    {TASK_STATUS_LABELS[status]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          {currentTask.description && (
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-content/25">
                Description
              </label>
              <p className="text-sm leading-relaxed text-content/50">{currentTask.description}</p>
            </div>
          )}

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-content/25">
                Assignee
              </label>
              <AssigneeSelector
                currentAssigneeId={currentTask.assigneeId}
                onSelect={handleAssigneeChange}
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-content/25">
                Deadline
              </label>
              <InlineDatePicker
                value={currentTask.dueDate}
                onChange={handleDueDateChange}
              />
            </div>

            {/* Priority */}
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-content/25">
                Priority
              </label>
              <div className="flex gap-1.5">
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePriorityChange(p)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-all",
                      currentTask.priority === p
                        ? cn(PRIORITY_CONFIG[p].color, "ring-1 ring-current/20")
                        : "border-content/[0.06] bg-content/[0.02] text-content/20 hover:bg-content/[0.04]"
                    )}
                  >
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        currentTask.priority === p ? PRIORITY_CONFIG[p].dotColor : "bg-content/20"
                      )}
                    />
                    {PRIORITY_CONFIG[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-content/25">
                Estimated Hours
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-content/[0.1] bg-content/[0.04] px-3 py-2">
                <Clock className="h-3.5 w-3.5 text-content/30" />
                <input
                  type="number"
                  min={0.5}
                  max={200}
                  step={0.5}
                  value={currentTask.estimatedHours}
                  onChange={(e) =>
                    updateTask(currentTask.id, { estimatedHours: Number(e.target.value) })
                  }
                  className="w-16 bg-transparent text-sm text-content/70 outline-none"
                />
                <span className="text-xs text-content/25">hours</span>
              </div>
            </div>
          </div>

          {/* Overdue Warning */}
          {overdue && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <p className="text-xs text-red-400/80">
                This task is overdue. The deadline was{" "}
                <span className="font-medium text-red-400">{formatDate(currentTask.dueDate)}</span>.
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-content/[0.06]" />

          {/* Comments */}
          <CommentThread taskId={taskId} />
        </div>
      </div>
    </div>
  );
}
