"use client";

import Link from "next/link";
import { FileSpreadsheet, Package, ShoppingCart, Users } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { DashboardSection } from "@/components/dashboard/DashboardSection";

const actions = [
  { label: "Create order", href: "/orders", icon: ShoppingCart },
  { label: "Add product", href: "/products", icon: Package },
  { label: "Add customer", href: "/customers", icon: Users },
  { label: "Open spreadsheet", href: "/spreadsheet", icon: FileSpreadsheet },
];

export function QuickActions() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <DashboardSection delay={0.7} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">Quick actions</h2>
      <p className="mt-1 text-sm text-slate-500">Jump to a common workspace.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return <motion.div key={action.href} whileHover={shouldReduceMotion ? undefined : { y: -1, scale: 1.01 }}><Link href={action.href} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"><span className="grid size-8 place-items-center rounded-md bg-slate-100 text-slate-600"><Icon className="size-4" aria-hidden="true" /></span>{action.label}</Link></motion.div>;
        })}
      </div>
    </DashboardSection>
  );
}
