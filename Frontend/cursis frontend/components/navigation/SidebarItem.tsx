"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type SidebarItemProps = {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
};

export function SidebarItem({ label, href, icon: Icon, active, collapsed, onNavigate }: SidebarItemProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div whileHover={shouldReduceMotion ? undefined : { x: 1 }} transition={{ duration: 0.15 }}>
      <Link
        href={href}
        title={label}
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
          active
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <AnimatePresence initial={false}>
          {!collapsed ? <motion.span initial={shouldReduceMotion ? false : { opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={shouldReduceMotion ? undefined : { opacity: 0, x: -4 }} transition={{ duration: 0.15 }}>{label}</motion.span> : null}
        </AnimatePresence>
      </Link>
    </motion.div>
  );
}
