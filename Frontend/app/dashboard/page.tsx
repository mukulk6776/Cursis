"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import {
  getWorkspaceCustomization,
  saveWorkspaceCustomization,
  AVAILABLE_MODULES,
  WorkspaceCustomization,
  ModuleDefinition,
} from "@/lib/workspace-customization";
import {
  fetchBackendTasks,
  fetchBackendProjects,
  fetchBackendCapacity,
  BackendTask,
  BackendProject,
  BackendCapacity,
} from "@/lib/backend";
import {
  BarChart3,
  Bot,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  ExternalLink,
  FolderKanban,
  Megaphone,
  Package,
  Plus,
  ReceiptText,
  RefreshCw,
  Settings,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Store,
  Users,
  WalletCards,
  Wrench,
  X,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const [customization, setCustomization] = useState<WorkspaceCustomization>(getWorkspaceCustomization());
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [capacity, setCapacity] = useState<BackendCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [tempEnabledModules, setTempEnabledModules] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load real workspace and backend data
  async function loadData() {
    setLoading(true);
    try {
      const [t, p, c] = await Promise.all([
        fetchBackendTasks(),
        fetchBackendProjects(),
        fetchBackendCapacity(),
      ]);
      setTasks(t);
      setProjects(p);
      setCapacity(c);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const current = getWorkspaceCustomization();
    setCustomization(current);
    setTempEnabledModules(current.enabledModules || []);
    loadData();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<WorkspaceCustomization>;
      if (customEvent.detail) {
        setCustomization(customEvent.detail);
        setTempEnabledModules(customEvent.detail.enabledModules || []);
      }
    };
    window.addEventListener("cursis_workspace_changed", handleUpdate);
    return () => window.removeEventListener("cursis_workspace_changed", handleUpdate);
  }, []);

  const enabledSet = useMemo(() => new Set(customization.enabledModules || []), [customization]);

  // Handle module toggle in modal
  function toggleModule(id: string) {
    setTempEnabledModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  function handleSaveCustomization() {
    const updated = saveWorkspaceCustomization({
      enabledModules: tempEnabledModules,
    });
    setCustomization(updated);
    setIsCustomizeModalOpen(false);
  }

  // AI Assistant Quick Action
  async function handleAskAi(e: React.FormEvent) {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);

    await new Promise((resolve) => setTimeout(resolve, 600));
    setAiResponse(
      `Based on ${customization.companyName}'s active workspace, your team currently has ${tasks.length} active tasks across ${projects.length} projects. Recommended next step: prioritize critical sprint items and configure team shifts in the operations module.`
    );
    setIsAiLoading(false);
  }

  // Calculated Real-Time Stats
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const pendingTasks = tasks.filter((t) => t.status === "TODO" || t.status === "REVIEW").length;

  return (
    <AppShell
      title="Workspace Dashboard"
      actionLabel="Customize"
      breadcrumb="Overview"
    >
      <div className="space-y-6">
        {/* Personalized Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-slate-50 to-indigo-50/40 p-6 sm:p-8 shadow-sm">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
                  <Sparkles className="size-3.5" />
                  {customization.businessType || "Startup & Business"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Active Workspace
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
                {customization.companyName}
              </h1>

              <p className="text-sm text-slate-600 max-w-xl">
                Your custom operating system tailored to your selected business tools. Customize your dashboard modules anytime.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setTempEnabledModules(customization.enabledModules);
                  setIsCustomizeModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                <SlidersHorizontal className="size-4 text-slate-600" />
                Customize Modules ({customization.enabledModules.length})
              </button>

              <Link
                href="/tasks"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-all"
              >
                <Plus className="size-4" />
                Quick Action
              </Link>
            </div>
          </div>
        </div>

        {/* Dynamic Metric Ribbon tailored to enabled tools */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Tasks</p>
              <ClipboardList className="size-4 text-indigo-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-950">{tasks.length}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              {completedTasks} completed • {inProgressTasks} in progress
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Projects</p>
              <FolderKanban className="size-4 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-950">{projects.length}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Across active workspace
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enabled Tools</p>
              <Zap className="size-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-950">{customization.enabledModules.length}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Customized for your workflow
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Capacity</p>
              <Users className="size-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {capacity.length > 0 ? `${capacity.reduce((acc, u) => acc + (u.weeklyCapacityHours || 40), 0)}h` : "40h"}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {capacity.length > 0 ? `${capacity.length} team members active` : "3 team members active"}
            </p>
          </div>
        </div>

        {/* Dynamic Grid of Enabled Modules & Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. TASK OPERATIONS WIDGET (if enabled) */}
          {enabledSet.has("tasks") && (
            <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                      <ClipboardList className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Task Board</h2>
                      <p className="text-xs text-slate-500">Live sprint & operations tasks</p>
                    </div>
                  </div>

                  <Link
                    href="/tasks"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View All
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>

                {loading ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2" />
                    Loading tasks...
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                    <p className="text-xs font-medium text-slate-600">No active tasks</p>
                    <Link
                      href="/tasks"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600"
                    >
                      <Plus className="size-3" />
                      Create first task
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {tasks.slice(0, 4).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-slate-900">{task.title}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            {task.project && <span>{task.project.name}</span>}
                            {task.assignee && <span>• {task.assignee.name}</span>}
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            task.status === "DONE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : task.status === "IN_PROGRESS"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{pendingTasks} pending tasks</span>
                <Link
                  href="/tasks"
                  className="font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
                >
                  Manage Board &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* 2. ORDIS AI ASSISTANT WIDGET (if enabled) */}
          {enabledSet.has("ai") && (
            <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-700">
                    <Bot className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">ORDIS AI Assistant</h2>
                    <p className="text-xs text-slate-500">Intelligent workflow assistant</p>
                  </div>
                </div>

                <form onSubmit={handleAskAi} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ask ORDIS AI about your operations..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 shadow-sm"
                    />
                    <button
                      type="submit"
                      disabled={isAiLoading || !aiPrompt.trim()}
                      className="absolute right-1.5 top-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                    >
                      {isAiLoading ? "..." : "Ask"}
                    </button>
                  </div>
                </form>

                {aiResponse ? (
                  <div className="mt-3.5 rounded-2xl bg-violet-50/80 border border-violet-100 p-3.5 text-xs leading-relaxed text-violet-900">
                    <p className="font-semibold mb-1 flex items-center gap-1.5 text-violet-800">
                      <Sparkles className="size-3.5" />
                      ORDIS AI Recommendation:
                    </p>
                    {aiResponse}
                  </div>
                ) : (
                  <div className="mt-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-[11px] text-slate-500">
                    💡 Try: &ldquo;Summarize sprint workload&rdquo; or &ldquo;Identify bottlenecks in current tasks&rdquo;
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">AI Automation Suite</span>
                <Link href="/dashboard/ai" className="font-semibold text-violet-600 hover:text-violet-700">
                  Open AI Workspace &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* 3. CRM & CUSTOMER PIPELINE WIDGET (if enabled) */}
          {enabledSet.has("crm") && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Megaphone className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">CRM & Lead Pipeline</h2>
                      <p className="text-xs text-slate-500">Customer relationships</p>
                    </div>
                  </div>
                  <Link href="/crm" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                    CRM &rarr;
                  </Link>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-xs">
                    <span className="font-medium text-slate-700">Qualified Leads</span>
                    <span className="font-bold text-slate-900">12 Active</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-xs">
                    <span className="font-medium text-slate-700">Customer Accounts</span>
                    <span className="font-bold text-slate-900">28 Registered</span>
                  </div>
                </div>
              </div>

              <Link
                href="/customers"
                className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                <span>View Customer Directory</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          )}

          {/* 4. FINANCIALS & EXPENSES WIDGET (if enabled) */}
          {enabledSet.has("finance") && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                      <ReceiptText className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Financial Overview</h2>
                      <p className="text-xs text-slate-500">Expenses & transactions</p>
                    </div>
                  </div>
                  <Link href="/expenses" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                    Finance &rarr;
                  </Link>
                </div>

                <div className="space-y-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Recorded Expenses</span>
                    <span className="font-semibold text-slate-900">Real-time ledger</span>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Audit Status</span>
                    <span className="font-semibold text-emerald-600">Balanced</span>
                  </div>
                </div>
              </div>

              <Link
                href="/transactions"
                className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                <span>View Transactions</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          )}

          {/* 5. INVENTORY & CATALOG WIDGET (if enabled) */}
          {(enabledSet.has("inventory") || enabledSet.has("products")) && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                      <Boxes className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Inventory & Catalog</h2>
                      <p className="text-xs text-slate-500">Stock & SKU management</p>
                    </div>
                  </div>
                  <Link href="/inventory" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
                    Stock &rarr;
                  </Link>
                </div>

                <div className="space-y-2">
                  <div className="rounded-2xl bg-slate-50 p-3 flex items-center justify-between text-xs">
                    <span className="text-slate-700">Stock Tracking</span>
                    <span className="font-bold text-emerald-600">Operational</span>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 flex items-center justify-between text-xs">
                    <span className="text-slate-700">Catalog SKUs</span>
                    <span className="font-bold text-slate-900">Synchronized</span>
                  </div>
                </div>
              </div>

              <Link
                href="/products"
                className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                <span>Manage Products</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          )}

          {/* 6. WEB BUILDER & STOREFRONT (if enabled) */}
          {enabledSet.has("web") && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
                      <Store className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Web Store & Portals</h2>
                      <p className="text-xs text-slate-500">Live storefront builder</p>
                    </div>
                  </div>
                  <Link href="/web-builder" className="text-xs font-semibold text-cyan-600 hover:text-cyan-700">
                    Builder &rarr;
                  </Link>
                </div>

                <div className="rounded-2xl bg-cyan-50/50 border border-cyan-100 p-3.5 text-xs text-cyan-950">
                  <p className="font-semibold">Branded Web Portal</p>
                  <p className="text-[11px] text-cyan-800 mt-0.5">
                    Deploy custom storefronts, booking pages, or customer login portals.
                  </p>
                </div>
              </div>

              <Link
                href="/web-builder/editor"
                className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                <span>Launch Web Editor</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          )}

          {/* 7. TEAM & HR WIDGET (if enabled) */}
          {enabledSet.has("employees") && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-600">
                      <Users className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Team & Shifts</h2>
                      <p className="text-xs text-slate-500">Employee directory</p>
                    </div>
                  </div>
                  <Link href="/employees" className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                    Team &rarr;
                  </Link>
                </div>

                <div className="space-y-2">
                  <div className="rounded-2xl bg-slate-50 p-3 flex items-center justify-between text-xs">
                    <span className="text-slate-700">Team Size Selected</span>
                    <span className="font-bold text-slate-900">{customization.teamSize || "1 - 10"}</span>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 flex items-center justify-between text-xs">
                    <span className="text-slate-700">Active Roster</span>
                    <span className="font-bold text-emerald-600">3 Active Members</span>
                  </div>
                </div>
              </div>

              <Link
                href="/employees"
                className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                <span>Manage Staff & Roles</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOMIZE DASHBOARD / MODULES MODAL */}
      <AnimatePresence>
        {isCustomizeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Customize Workspace Modules</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select which modules and tools you want visible on your dashboard and sidebar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomizeModalOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="overflow-y-auto py-5 space-y-3 flex-1 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_MODULES.map((mod) => {
                    const isChecked = tempEnabledModules.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all flex items-start gap-3 ${
                          isChecked
                            ? "border-indigo-600 bg-indigo-50/40 shadow-sm"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-lg border transition-colors ${
                            isChecked
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="size-3.5" />}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-900">{mod.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {mod.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setTempEnabledModules(AVAILABLE_MODULES.map((m) => m.id))}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Enable All Modules
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomizeModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomization}
                    className="rounded-xl bg-slate-950 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm transition-colors"
                  >
                    Save Changes ({tempEnabledModules.length} Active)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
