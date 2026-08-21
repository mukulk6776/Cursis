"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3, Bot, Boxes, CircleHelp, ClipboardList, CreditCard, FileSpreadsheet,
  HandCoins, LayoutDashboard, Megaphone, Package, PanelLeftClose, PanelLeftOpen,
  ReceiptText, Settings, ShoppingBag, ShoppingCart, SlidersHorizontal, Users,
  WalletCards, Wrench, X,
} from "lucide-react";
import { SidebarSection, type SidebarNavigationItem } from "@/components/navigation/SidebarSection";
import { DataoraLogo } from "@/components/brand/DataoraLogo";
import { getWorkspaceCustomization, WorkspaceCustomization } from "@/lib/workspace-customization";

type NavigationSection = { label: string; items: SidebarNavigationItem[] };

const baseNavigationSections: NavigationSection[] = [
  {
    label: "Main",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", href: "/orders", icon: ShoppingCart },
      { label: "POS", href: "/pos", icon: ShoppingBag },
      { label: "Payments", href: "/payments", icon: CreditCard },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Inventory", href: "/inventory", icon: Boxes },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Customers", href: "/customers", icon: Users },
      { label: "CRM", href: "/crm", icon: Megaphone },
      { label: "Udhar", href: "/udhar", icon: HandCoins },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Transactions", href: "/transactions", icon: WalletCards },
      { label: "Expenses", href: "/expenses", icon: ReceiptText },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "Reports", href: "/reports", icon: ClipboardList },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Employees", href: "/employees", icon: Users },
      { label: "Tasks", href: "/tasks", icon: ClipboardList },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Spreadsheet", href: "/spreadsheet", icon: FileSpreadsheet },
      { label: "ORDIS AI", href: "/dashboard/ai", icon: Bot },
      { label: "Web Builder", href: "/web-builder", icon: Wrench },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Help", href: "/help", icon: CircleHelp },
    ],
  },
];

// Mapping between routes and module IDs
const routeModuleMap: Record<string, string> = {
  "/tasks": "tasks",
  "/employees": "employees",
  "/orders": "sales",
  "/pos": "sales",
  "/payments": "sales",
  "/products": "products",
  "/inventory": "inventory",
  "/customers": "customers",
  "/udhar": "customers",
  "/crm": "crm",
  "/transactions": "finance",
  "/expenses": "finance",
  "/analytics": "analytics",
  "/reports": "analytics",
  "/spreadsheet": "spreadsheet",
  "/dashboard/ai": "ai",
  "/web-builder": "web",
};

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

type SidebarContentProps = {
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  mobile?: boolean;
};

function SidebarContent({ collapsed, onToggle, onNavigate, mobile = false }: SidebarContentProps) {
  const pathname = usePathname();
  const [customization, setCustomization] = useState<WorkspaceCustomization | null>(null);

  useEffect(() => {
    setCustomization(getWorkspaceCustomization());
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<WorkspaceCustomization>;
      if (customEvent.detail) {
        setCustomization(customEvent.detail);
      }
    };
    window.addEventListener("cursis_workspace_changed", handleUpdate);
    return () => window.removeEventListener("cursis_workspace_changed", handleUpdate);
  }, []);

  const visibleSections = useMemo(() => {
    if (!customization) return baseNavigationSections;
    const enabled = new Set(customization.enabledModules || []);

    return baseNavigationSections
      .map((sec) => {
        // System and Main sections always visible
        if (sec.label === "Main" || sec.label === "System") return sec;

        const filteredItems = sec.items.filter((item) => {
          const reqModule = routeModuleMap[item.href];
          if (!reqModule) return true;
          return enabled.has(reqModule);
        });

        return {
          ...sec,
          items: filteredItems,
        };
      })
      .filter((sec) => sec.items.length > 0);
  }, [customization]);

  return (
    <>
      <div className="flex h-16 items-center border-b border-slate-200 px-3">
        <Link href="/dashboard" onClick={onNavigate} className="flex min-w-0 items-center" aria-label="Cursis dashboard">
          <DataoraLogo variant={collapsed ? "icon" : "full"} size="sm" />
        </Link>
        {mobile ? (
          <button type="button" onClick={onNavigate} className="ml-auto inline-flex rounded p-2 text-slate-500 hover:bg-slate-100" aria-label="Close navigation">
            <X className="size-4" />
          </button>
        ) : onToggle ? (
          <button type="button" onClick={onToggle} className="ml-auto hidden rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 xl:inline-flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto px-2 py-3" aria-label="Primary navigation">
        {visibleSections.map((section) => (
          <SidebarSection key={section.label} {...section} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Customize Workspace Footer link */}
      <div className="border-t border-slate-200 p-2">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 ${
            collapsed ? "justify-center" : ""
          }`}
          title="Customize Workspace"
        >
          <SlidersHorizontal className="size-4 shrink-0 text-slate-500" />
          {!collapsed && <span>Customize Workspace</span>}
        </Link>
      </div>
    </>
  );
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <aside className="hidden h-screen w-16 shrink-0 flex-col border-r border-slate-200 bg-white md:sticky md:top-0 md:flex xl:hidden">
        <SidebarContent collapsed />
      </aside>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 256 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white xl:sticky xl:top-0 xl:flex"
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggle} />
      </motion.aside>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.aside
            initial={shouldReduceMotion ? false : { x: -288 }}
            animate={{ x: 0 }}
            exit={shouldReduceMotion ? undefined : { x: -288 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl md:hidden"
          >
            <SidebarContent collapsed={false} mobile onNavigate={onMobileClose} />
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
