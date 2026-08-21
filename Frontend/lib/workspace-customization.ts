"use client";

export interface WorkspaceCustomization {
  companyName: string;
  businessType: string;
  fullName?: string;
  workEmail?: string;
  teamSize?: string;
  expectedUsers?: string;
  enabledModules: string[];
  goals?: string[];
  challenges?: string[];
  updatedAt?: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  category: "operations" | "sales" | "finance" | "catalog" | "customers" | "tools" | "analytics";
  iconName: string;
  href: string;
}

export const AVAILABLE_MODULES: ModuleDefinition[] = [
  {
    id: "tasks",
    name: "Task Operations",
    description: "Manage projects, sprint tasks, assignees, and deadlines",
    category: "operations",
    iconName: "ClipboardList",
    href: "/tasks",
  },
  {
    id: "crm",
    name: "CRM & Leads",
    description: "Track customer interactions, deals, and lead pipelines",
    category: "customers",
    iconName: "Megaphone",
    href: "/crm",
  },
  {
    id: "customers",
    name: "Customer Directory",
    description: "Customer database, profiles, and order history",
    category: "customers",
    iconName: "Users",
    href: "/customers",
  },
  {
    id: "sales",
    name: "Orders & POS",
    description: "Point of sale checkout, orders, and payment collection",
    category: "sales",
    iconName: "ShoppingCart",
    href: "/orders",
  },
  {
    id: "inventory",
    name: "Inventory & Stock",
    description: "Real-time SKU stock tracking, warehouse levels, and reorders",
    category: "catalog",
    iconName: "Boxes",
    href: "/inventory",
  },
  {
    id: "products",
    name: "Product Catalog",
    description: "Product management, pricing, variations, and categories",
    category: "catalog",
    iconName: "Package",
    href: "/products",
  },
  {
    id: "finance",
    name: "Financials & Expenses",
    description: "Cash flow tracking, expense categorization, and P&L audit",
    category: "finance",
    iconName: "ReceiptText",
    href: "/expenses",
  },
  {
    id: "employees",
    name: "Team & HR",
    description: "Staff directory, roles, permissions, and shift capacity",
    category: "operations",
    iconName: "Users",
    href: "/employees",
  },
  {
    id: "ai",
    name: "ORDIS AI Assistant",
    description: "AI business automation, workflow summaries, and insights",
    category: "tools",
    iconName: "Bot",
    href: "/dashboard/ai",
  },
  {
    id: "web",
    name: "Web Builder & Store",
    description: "Custom online storefront and customer booking portal",
    category: "tools",
    iconName: "Wrench",
    href: "/web-builder",
  },
  {
    id: "analytics",
    name: "Analytics & Reports",
    description: "Business intelligence metrics, growth trends, and reporting",
    category: "analytics",
    iconName: "BarChart3",
    href: "/analytics",
  },
  {
    id: "spreadsheet",
    name: "Spreadsheet Tool",
    description: "Embedded spreadsheet calculation & tabular data management",
    category: "tools",
    iconName: "FileSpreadsheet",
    href: "/spreadsheet",
  },
];

const STORAGE_KEY = "cursis_workspace_customization";
const DEFAULT_CUSTOMIZATION: WorkspaceCustomization = {
  companyName: "My Workspace",
  businessType: "Technology & Software",
  enabledModules: ["tasks", "crm", "sales", "inventory", "finance", "employees", "ai", "web", "analytics"],
  goals: ["Deliver projects on time", "Automate workflows", "Scale operations"],
  teamSize: "1 - 10",
};

/**
 * Maps department IDs from the setup wizard to module IDs
 */
export function mapDepartmentsToModules(departments: string[], features: string[]): string[] {
  const selected = new Set<string>(["tasks"]); // Tasks always enabled by default

  const deptMap: Record<string, string[]> = {
    ops: ["tasks", "employees"],
    inventory: ["inventory", "products"],
    pos: ["sales", "products"],
    sales: ["sales", "crm", "customers"],
    finance: ["finance"],
    expenses: ["finance"],
    hr: ["employees"],
    analytics: ["analytics"],
    web: ["web"],
    ai: ["ai"],
  };

  departments.forEach((d) => {
    if (deptMap[d]) {
      deptMap[d].forEach((m) => selected.add(m));
    }
  });

  const featureMap: Record<string, string[]> = {
    pos_billing: ["sales"],
    multi_loc_inv: ["inventory", "products"],
    crm_loyalty: ["crm", "customers"],
    expense_tracking: ["finance"],
    employee_mgmt: ["employees"],
    ai_insights: ["ai"],
    web_builder: ["web"],
    financial_reports: ["analytics", "finance"],
    credit_ledger: ["finance", "customers"],
  };

  features.forEach((f) => {
    if (featureMap[f]) {
      featureMap[f].forEach((m) => selected.add(m));
    }
  });

  if (selected.size === 1) {
    // If few selected, include core essentials
    return ["tasks", "crm", "finance", "ai"];
  }

  return Array.from(selected);
}

/**
 * Get current workspace customization
 */
export function getWorkspaceCustomization(): WorkspaceCustomization {
  if (typeof window === "undefined") return DEFAULT_CUSTOMIZATION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WorkspaceCustomization;
      if (parsed.enabledModules && Array.isArray(parsed.enabledModules)) {
        return {
          ...DEFAULT_CUSTOMIZATION,
          ...parsed,
        };
      }
    }
  } catch (err) {
    console.warn("Failed to read workspace customization from storage:", err);
  }
  return DEFAULT_CUSTOMIZATION;
}

/**
 * Save workspace customization & dispatch update event
 */
export function saveWorkspaceCustomization(customization: Partial<WorkspaceCustomization>): WorkspaceCustomization {
  if (typeof window === "undefined") return DEFAULT_CUSTOMIZATION;
  try {
    const current = getWorkspaceCustomization();
    const updated: WorkspaceCustomization = {
      ...current,
      ...customization,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("cursis_workspace_changed", { detail: updated }));
    return updated;
  } catch (err) {
    console.error("Failed to save workspace customization:", err);
    return DEFAULT_CUSTOMIZATION;
  }
}
