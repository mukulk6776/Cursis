"use client";

import Link from "next/link";
import {
  ArrowRight,
  Users,
  Briefcase,
  CheckSquare,
  Calendar,
  UserPlus,
  Zap,
  Sparkles,
  Search,
  Layers,
  Clock,
  Workflow,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const ecosystemItems = [
  { label: "Team", icon: Users },
  { label: "Projects", icon: Briefcase },
  { label: "Tasks", icon: CheckSquare },
  { label: "Deadlines", icon: Calendar },
  { label: "Hiring", icon: UserPlus },
  { label: "Workflows", icon: Zap },
  { label: "Ordis AI", icon: Sparkles },
];

export function Hero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-visible bg-[#f8f9f6]">
      {/* ONE Continuous, Smooth Atmospheric Pastel Gradient Canvas */}
      <div className="relative isolate overflow-hidden rounded-b-[2.5rem] bg-gradient-to-b from-[#fbf9f5] via-[#fbf2ea]/75 via-45% to-[#f5ebf8]/65 pb-32 pt-14 sm:rounded-b-[4rem] sm:pb-44 sm:pt-20 lg:rounded-b-[5rem] lg:pb-56 lg:pt-24">
        
        {/* Soft, Continuous Atmospheric Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(254,243,225,0.7)_0%,rgba(253,230,238,0.35)_50%,transparent_100%)]"
        />
        <div aria-hidden="true" className="cursis-orb pointer-events-none absolute -left-28 top-28 size-72 rounded-full bg-violet-300/20 blur-3xl" />
        <div aria-hidden="true" className="cursis-orb cursis-orb--slow pointer-events-none absolute -right-20 top-12 size-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(71,85,105,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,.12)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />

        <div className="relative mx-auto max-w-7xl px-5 text-center lg:px-8">
          {/* 1. Small Announcement Pill */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex justify-center"
          >
            <a
              href="#ordis"
              className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/75 px-3.5 py-1.5 text-xs font-medium text-slate-800 backdrop-blur-xs transition-colors hover:border-slate-900/20 hover:bg-white"
            >
              <span>Introducing Ordis AI — Your Startup Copilot</span>
              <ArrowRight className="size-3 text-slate-500" />
            </a>
          </motion.div>

          {/* 2. Main Hero Heading (H1) */}
          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-7 max-w-4xl text-center text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl md:text-7xl lg:text-[4.75rem] leading-[1.08] text-balance"
          >
            Run Your Startup
            <br className="hidden sm:inline" />
            {" "}Your Way.
          </motion.h1>

          {/* 3. Short Description */}
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-xl text-center text-base font-normal leading-relaxed text-slate-600 sm:max-w-2xl sm:text-lg sm:leading-8 text-balance"
          >
            Cursis is a fully customizable workspace for managing your team, projects, tasks, deadlines, hiring, and workflows — all in one connected ecosystem.
          </motion.p>

          {/* 4. Single Primary CTA */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-col items-center justify-center gap-2.5"
          >
            <motion.div
              whileHover={shouldReduceMotion ? undefined : { scale: 1.03, y: -2 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            >
              <Link
                href="/signup"
                className="cursis-shimmer inline-flex items-center gap-2 rounded-full bg-[linear-gradient(110deg,#020617_35%,#374151_50%,#020617_65%)] px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-black/10 transition-colors hover:bg-slate-800"
              >
                Build Your Workspace <ArrowRight className="size-4" />
              </Link>
            </motion.div>
            <p className="text-xs text-slate-500 font-normal">
              No credit card required · Free for growing teams.
            </p>
          </motion.div>

          {/* 5. Subtle Ecosystem Text Row (No boxes, no cards) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-slate-500 font-medium sm:gap-x-4"
          >
            {ecosystemItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <span key={item.label} className="inline-flex items-center gap-1.5">
                  <Icon className="size-3 text-slate-400" />
                  <span>{item.label}</span>
                  {idx < ecosystemItems.length - 1 && (
                    <span className="text-slate-300 ml-1.5 sm:ml-2">·</span>
                  )}
                </span>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* 6. Clean, Wide Cursis Dashboard Preview */}
      <div className="relative z-30 mx-auto -mt-20 max-w-6xl px-4 sm:-mt-28 sm:px-6 lg:-mt-36">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_70px_-16px_rgba(15,23,42,0.14)] sm:rounded-3xl"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />
          {/* App Window Top Bar */}
          <div className="flex h-11 items-center justify-between border-b border-slate-100 bg-[#fafbfa] px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-slate-300" />
                <span className="size-2.5 rounded-full bg-slate-300" />
                <span className="size-2.5 rounded-full bg-slate-300" />
              </div>
              <div className="hidden items-center gap-2 text-xs font-semibold text-slate-800 sm:flex">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Acme Startup OS</span>
              </div>
            </div>

            {/* Center Search */}
            <div className="flex w-44 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-0.5 text-xs text-slate-400 sm:w-64">
              <Search className="size-3 text-slate-400 shrink-0" />
              <span className="truncate">Search tasks, team, projects...</span>
              <span className="ml-auto hidden rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-500 sm:inline">
                ⌘K
              </span>
            </div>

            {/* Right User Tag */}
            <div className="flex items-center gap-2.5">
              <span className="hidden text-[11px] font-medium text-purple-700 sm:inline">
                ✦ Ordis Ready
              </span>
              <div className="flex size-6.5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                C
              </div>
            </div>
          </div>

          {/* Main Dashboard Canvas */}
          <div className="grid grid-cols-1 divide-y divide-slate-100 lg:grid-cols-[170px_1fr] lg:divide-x lg:divide-y-0">
            {/* Minimal Left Sidebar */}
            <div className="hidden space-y-1 bg-[#fbfcfb] p-3 lg:block">
              <div className="flex items-center gap-2 rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white">
                <Layers className="size-3.5" />
                <span>Overview</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                <Briefcase className="size-3.5 text-slate-400" />
                <span>Projects</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                <CheckSquare className="size-3.5 text-slate-400" />
                <span>Tasks & Sprints</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                <Users className="size-3.5 text-slate-400" />
                <span>Team & Roles</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                <Calendar className="size-3.5 text-slate-400" />
                <span>Deadlines</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                <UserPlus className="size-3.5 text-slate-400" />
                <span>Hiring Pipeline</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-50">
                <Sparkles className="size-3.5 text-purple-600" />
                <span>Ordis Copilot</span>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white p-4.5 sm:p-6">
              {/* Header Greeting */}
              <div className="flex flex-col justify-between gap-1.5 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950 sm:text-base">
                    Team & Operations Pulse
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live team execution across projects, deadlines, and hiring pipelines.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                        <span className="cursis-live-dot size-1.5 rounded-full bg-emerald-500" />
                  All workflows active
                </span>
              </div>

              {/* 4 KPI Cards */}
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3.5">
                <motion.div whileHover={shouldReduceMotion ? undefined : { y: -3 }} className="rounded-xl border border-slate-100 bg-[#fafbfa] p-3 transition-shadow hover:shadow-lg hover:shadow-slate-900/5">
                  <p className="text-[11px] font-medium text-slate-500">Active Projects</p>
                  <p className="mt-0.5 text-base font-bold tracking-tight text-slate-950 sm:text-lg">
                    12
                  </p>
                  <span className="text-[10px] font-medium text-emerald-600">10 on track</span>
                </motion.div>

                <motion.div whileHover={shouldReduceMotion ? undefined : { y: -3 }} className="rounded-xl border border-slate-100 bg-[#fafbfa] p-3 transition-shadow hover:shadow-lg hover:shadow-slate-900/5">
                  <p className="text-[11px] font-medium text-slate-500">Pending Tasks</p>
                  <p className="mt-0.5 text-base font-bold tracking-tight text-slate-950 sm:text-lg">
                    84
                  </p>
                  <span className="text-[10px] font-medium text-emerald-600">92% on-time</span>
                </motion.div>

                <motion.div whileHover={shouldReduceMotion ? undefined : { y: -3 }} className="rounded-xl border border-slate-100 bg-[#fafbfa] p-3 transition-shadow hover:shadow-lg hover:shadow-slate-900/5">
                  <p className="text-[11px] font-medium text-slate-500">Team Capacity</p>
                  <p className="mt-0.5 text-base font-bold tracking-tight text-slate-950 sm:text-lg">
                    28 Members
                  </p>
                  <span className="text-[10px] font-medium text-emerald-600">94% active</span>
                </motion.div>

                <motion.div whileHover={shouldReduceMotion ? undefined : { y: -3 }} className="rounded-xl border border-slate-100 bg-[#fafbfa] p-3 transition-shadow hover:shadow-lg hover:shadow-slate-900/5">
                  <p className="text-[11px] font-medium text-slate-500">Hiring Pipeline</p>
                  <p className="mt-0.5 text-base font-bold tracking-tight text-slate-950 sm:text-lg">
                    7 Candidates
                  </p>
                  <span className="text-[10px] font-medium text-slate-500">3 in review</span>
                </motion.div>
              </div>

              {/* 2-Column Split: Activity + Sprint Trajectory */}
              <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
                {/* Real-time Activity Feed */}
                <div className="rounded-xl border border-slate-100 bg-[#fafbfa] p-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                      Live Team Activity
                    </p>
                    <span className="text-[10px] text-slate-400">Real-time</span>
                  </div>
                  <div className="mt-2.5 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="cursis-live-dot size-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">Tejas finished Frontend Review for Website Redesign</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">4m ago</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="size-1.5 rounded-full bg-sky-500 shrink-0" />
                        <span className="truncate">Ordis AI assigned onboarding tasks for new Designer</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">18m ago</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="size-1.5 rounded-full bg-purple-500 shrink-0" />
                        <span className="truncate">Rahul updated Sprint #14 milestone to Friday 6 PM</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">42m ago</span>
                    </div>
                  </div>
                </div>

                {/* Growth / Velocity Visualizer */}
                <div className="rounded-xl border border-slate-100 bg-[#fafbfa] p-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                      Sprint Velocity
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-600">94.6% Done</span>
                  </div>
                  <div className="mt-2.5 h-16 w-full">
                    <svg className="size-full overflow-visible" viewBox="0 0 300 70" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0 60 Q 60 55 120 40 T 220 25 T 300 8 L 300 70 L 0 70 Z"
                        fill="url(#curveGrad)"
                      />
                      <motion.path
                        d="M 0 60 Q 60 55 120 40 T 220 25 T 300 8"
                        fill="none"
                        stroke="#7c3aed"
                        strokeWidth="2"
                        initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.35, delay: 0.7, ease: "easeOut" }}
                      />
                      <motion.circle cx="300" cy="8" r="3.5" fill="#7c3aed" animate={shouldReduceMotion ? undefined : { scale: [1, 1.35, 1], opacity: [1, .55, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
