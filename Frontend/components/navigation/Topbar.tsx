"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, Building2, ChevronDown, CircleHelp, LogOut, Menu, Search, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import { DataoraLogo } from "@/components/brand/DataoraLogo";

type TopbarProps = {
  onSidebarToggle: () => void;
};

const menuMotion = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] as const },
};

export function Topbar({ onSidebarToggle }: TopbarProps) {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const toggle = (setter: (value: boolean | ((current: boolean) => boolean)) => void) => setter((current) => !current);
  const motionProps = shouldReduceMotion ? { initial: false } : menuMotion;

  async function handleLogout() {
    await logout();
    setProfileOpen(false);
    router.replace("/");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button type="button" onClick={onSidebarToggle} className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900" aria-label="Toggle navigation">
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <Link href="/dashboard" className="shrink-0 sm:hidden" aria-label="Cursis dashboard"><DataoraLogo variant="icon" size="sm" /></Link>
      <Link href="/dashboard" className="hidden shrink-0 sm:block" aria-label="Cursis dashboard"><DataoraLogo size="sm" /></Link>

      <motion.label animate={shouldReduceMotion ? undefined : { scale: searchFocused ? 1.005 : 1 }} transition={{ duration: 0.15 }} className="relative min-w-0 max-w-xl flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input type="search" aria-label="Search Cursis" placeholder="Search Cursis..." onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} className={`h-9 w-full rounded-md border bg-slate-50 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 ${searchFocused ? "border-slate-400 bg-white" : "border-slate-200"}`} />
      </motion.label>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="relative hidden sm:block">
          <button type="button" onClick={() => toggle(setBusinessOpen)} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" aria-expanded={businessOpen} aria-label="Select business">
            <Building2 className="size-4 text-slate-500" aria-hidden="true" /><span>Select business</span><ChevronDown className="size-4 text-slate-400" aria-hidden="true" />
          </button>
          <AnimatePresence>{businessOpen ? <motion.div {...motionProps} className="absolute right-0 top-11 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"><p className="text-sm font-medium text-slate-800">No business selected</p><p className="mt-1 text-xs leading-5 text-slate-500">Connect a business to view its dashboard data.</p></motion.div> : null}</AnimatePresence>
        </div>

        <button type="button" className="inline-flex size-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900" aria-label="Help"><CircleHelp className="size-5" aria-hidden="true" /></button>

        <div className="relative">
          <button type="button" onClick={() => toggle(setNotificationsOpen)} className="inline-flex size-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900" aria-expanded={notificationsOpen} aria-label="Notifications"><Bell className="size-5" aria-hidden="true" /></button>
          <AnimatePresence>{notificationsOpen ? <motion.div {...motionProps} className="absolute right-0 top-11 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"><p className="text-sm font-medium text-slate-800">No notifications yet</p><p className="mt-1 text-xs leading-5 text-slate-500">Notifications will appear here when available.</p></motion.div> : null}</AnimatePresence>
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggle(setProfileOpen)} className="ml-1 inline-flex size-9 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-700" aria-expanded={profileOpen} aria-label="Open user profile menu"><UserRound className="size-4" aria-hidden="true" /></button>
          <AnimatePresence>{profileOpen ? <motion.div {...motionProps} className="absolute right-0 top-11 w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"><p className="px-2 py-2 text-xs text-slate-500">{currentUser?.email ?? "Your Cursis account"}</p><Link href="/settings" className="block rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950">My account</Link><Link href="/settings" className="block rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950">Settings</Link><button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"><LogOut className="size-4" />Log out</button></motion.div> : null}</AnimatePresence>
        </div>
      </div>
    </header>
  );
}
