"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  fetchBackendTasks,
  fetchBackendProjects,
  createBackendTask,
  BackendTask,
  BackendProject,
} from "@/lib/backend";
import {
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  AlertCircle,
  FolderKanban,
  User,
  ListTodo,
} from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProjectId, setNewTaskProjectId] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [newTaskHours, setNewTaskHours] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([
        fetchBackendTasks(),
        fetchBackendProjects(),
      ]);
      setTasks(t);
      setProjects(p);
      if (p.length > 0 && !newTaskProjectId) {
        setNewTaskProjectId(p[0].id);
      }
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredTasks =
    filterStatus === "ALL"
      ? tasks
      : tasks.filter((t) => t.status === filterStatus);

  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskProjectId) return;
    setIsSubmitting(true);
    const created = await createBackendTask({
      title: newTaskTitle.trim(),
      projectId: newTaskProjectId,
      priority: newTaskPriority,
      estimatedHours: Number(newTaskHours),
      status: "TODO",
    });
    if (created) {
      setNewTaskTitle("");
      setIsModalOpen(false);
      await loadData();
    }
    setIsSubmitting(false);
  }

  const statusColors: Record<string, string> = {
    TODO: "bg-amber-50 text-amber-700 border-amber-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    REVIEW: "bg-purple-50 text-purple-700 border-purple-200",
    DONE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const priorityColors: Record<string, string> = {
    LOW: "text-slate-500",
    MEDIUM: "text-blue-600",
    HIGH: "text-amber-600",
    CRITICAL: "text-rose-600 font-semibold",
  };

  return (
    <AppShell
      title="Tasks & Operations"
      actionLabel="Add Task"
      breadcrumb="Workspace"
    >
      <div className="space-y-6">
        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total Tasks</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{tasks.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">To Do</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{todoCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">In Progress</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{inProgressCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Completed</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{doneCount}</p>
          </div>
        </div>

        {/* Task Controls & Filtering */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {["ALL", "TODO", "IN_PROGRESS", "REVIEW", "DONE"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  filterStatus === st
                    ? "bg-slate-950 text-white shadow-sm"
                    : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {st.replace("_", " ")}
                {st === "ALL" ? ` (${tasks.length})` : ` (${tasks.filter((t) => t.status === st).length})`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <Plus className="size-3.5" />
              New Task
            </button>
          </div>
        </div>

        {/* Task List Grid */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              <RefreshCw className="size-6 animate-spin mx-auto text-slate-400 mb-2" />
              Loading tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="size-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-800">No tasks found</p>
              <p className="text-xs text-slate-500 mt-1">
                {filterStatus !== "ALL"
                  ? `No tasks with status ${filterStatus}.`
                  : "Create your first task to get started."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 hover:bg-slate-50/70 transition-colors gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{task.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          statusColors[task.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                      {task.project && (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <FolderKanban className="size-3 text-slate-400" />
                          {task.project.name}
                        </span>
                      )}
                      {task.assignee ? (
                        <span className="inline-flex items-center gap-1">
                          <User className="size-3 text-slate-400" />
                          {task.assignee.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3 text-slate-400" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${priorityColors[task.priority] || "text-slate-600"}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60 font-mono">
                      {task.estimatedHours}h
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ListTodo className="size-5 text-indigo-600" />
              Create New Task
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Landing Page Hero"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newTaskProjectId}
                  onChange={(e) => setNewTaskProjectId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-600"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-600"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newTaskHours}
                    onChange={(e) => setNewTaskHours(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTaskTitle.trim()}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
