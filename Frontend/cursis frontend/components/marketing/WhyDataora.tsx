"use client";

import { CheckCircle2, Briefcase, Layers, Users, UserPlus, CheckSquare, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/marketing/Reveal";

const points = [
  "Custom startup operating system",
  "Zapier-like workflow flexibility",
  "Team, projects & task tracking",
  "Integrated hiring pipelines",
  "Ordis AI operations copilot",
  "Adapts to your company's workflow",
];

const dataSignals = [
  {
    id: "spreadsheets",
    label: "Spreadsheets",
    icon: Briefcase,
    color: "bg-emerald-50/90 text-emerald-800 border-emerald-200/80 shadow-emerald-900/5",
    initialPos: { x: -135, y: -80, rotate: -6 },
    convergedPos: { x: -110, y: -60, rotate: -2 },
    delay: 0.08,
  },
  {
    id: "notion",
    label: "Notion & Trello",
    icon: Layers,
    color: "bg-sky-50/90 text-sky-800 border-sky-200/80 shadow-sky-900/5",
    initialPos: { x: 130, y: -90, rotate: 5 },
    convergedPos: { x: 105, y: -55, rotate: 2 },
    delay: 0.15,
  },
  {
    id: "slack",
    label: "Slack & Chats",
    icon: Users,
    color: "bg-violet-50/90 text-violet-800 border-violet-200/80 shadow-violet-900/5",
    initialPos: { x: 145, y: 25, rotate: -4 },
    convergedPos: { x: 120, y: 12, rotate: 0 },
    delay: 0.22,
  },
  {
    id: "hiring",
    label: "HR & Hiring",
    icon: UserPlus,
    color: "bg-amber-50/90 text-amber-800 border-amber-200/80 shadow-amber-900/5",
    initialPos: { x: 95, y: 110, rotate: 4 },
    convergedPos: { x: 75, y: 75, rotate: 1 },
    delay: 0.29,
  },
  {
    id: "tasks",
    label: "Task Trackers",
    icon: CheckSquare,
    color: "bg-indigo-50/90 text-indigo-800 border-indigo-200/80 shadow-indigo-900/5",
    initialPos: { x: -105, y: 100, rotate: -5 },
    convergedPos: { x: -85, y: 70, rotate: -1 },
    delay: 0.36,
  },
  {
    id: "ai",
    label: "Ordis AI",
    icon: Sparkles,
    color: "bg-rose-50/90 text-rose-800 border-rose-200/80 shadow-rose-900/5",
    initialPos: { x: -150, y: 15, rotate: 6 },
    convergedPos: { x: -125, y: 8, rotate: 1 },
    delay: 0.43,
  },
];

function BusinessConvergenceVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto flex h-72 w-full max-w-sm items-center justify-center sm:h-80 sm:max-w-md lg:h-96">
      {/* Soft background aura */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/40 via-white/75 to-white/30 backdrop-blur-sm border border-white/80 shadow-lg shadow-purple-950/5"
      />
      <div
        aria-hidden="true"
        className="absolute size-44 rounded-full bg-[#e8defa] opacity-70 blur-2xl"
      />

      {/* SVG Connection Trails */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
        viewBox="-190 -140 380 280"
      >
        <defs>
          <linearGradient id="convergenceTrail" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {dataSignals.map((signal) => (
          <motion.path
            key={`line-${signal.id}`}
            d={`M 0 0 Q ${signal.convergedPos.x * 0.45} ${signal.convergedPos.y * 0.45 - 6} ${signal.convergedPos.x} ${signal.convergedPos.y}`}
            fill="none"
            stroke="url(#convergenceTrail)"
            strokeWidth="1.25"
            strokeDasharray="3 4"
            initial={reduceMotion ? { pathLength: 1, opacity: 0.7 } : { pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.75 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 1,
              delay: signal.delay + 0.25,
              ease: "easeOut",
            }}
          />
        ))}
      </svg>

      {/* Central Connection Pulse Effect */}
      {!reduceMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute size-16 rounded-full border border-purple-400/40 bg-purple-400/10"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: [0.8, 1.8, 2.2], opacity: [0, 0.45, 0] }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.5, delay: 0.9, ease: "easeOut" }}
        />
      )}

      {/* Central Unified Node */}
      <motion.div
        initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-20 flex items-center gap-2 rounded-full border border-slate-900/10 bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-xl shadow-slate-950/20"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <span>Cursis Core</span>
      </motion.div>

      {/* Floating Converging Data Signals */}
      {dataSignals.map((signal, idx) => {
        const Icon = signal.icon;
        return (
          <motion.div
            key={signal.id}
            initial={
              reduceMotion
                ? { x: signal.convergedPos.x, y: signal.convergedPos.y, opacity: 1, rotate: signal.convergedPos.rotate }
                : { x: signal.initialPos.x, y: signal.initialPos.y, opacity: 0.3, rotate: signal.initialPos.rotate, scale: 0.9 }
            }
            whileInView={
              reduceMotion
                ? undefined
                : {
                    x: signal.convergedPos.x,
                    y: signal.convergedPos.y,
                    opacity: 1,
                    rotate: signal.convergedPos.rotate,
                    scale: 1,
                  }
            }
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              type: "spring",
              stiffness: 75,
              damping: 16,
              mass: 0.7,
              delay: signal.delay,
            }}
            className="absolute z-10"
          >
            {/* Ambient post-convergence floating motion */}
            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [0, idx % 2 === 0 ? -3 : 3, 0],
                      rotate: [signal.convergedPos.rotate, signal.convergedPos.rotate + (idx % 2 === 0 ? 1 : -1), signal.convergedPos.rotate],
                    }
              }
              transition={{
                duration: 5 + (idx % 3),
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.1 + idx * 0.15,
              }}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-sm backdrop-blur-md sm:px-3 sm:py-1.5 sm:text-xs ${signal.color}`}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{signal.label}</span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function WhyDataora() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#f8f9f6] via-[#f2edf9]/80 via-45% to-[#fbfaf6] py-20 text-slate-950 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-20 size-[36rem] rounded-full bg-[#e8e4f7]/60 opacity-50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-10 size-[36rem] rounded-full bg-[#fde2cd]/45 opacity-40 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <Reveal>
            <p className="text-sm font-semibold tracking-[0.16em] text-slate-600 uppercase">
              WHY CURSIS
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl text-balance">
              Your startup shouldn&apos;t live across ten different tools.
            </h2>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="mt-6 max-w-xl text-base sm:text-lg leading-8 text-slate-600">
              Stop managing your team across spreadsheets, Notion boards, Slack channels, hiring trackers, and disconnected apps. Cursis brings your people, projects, tasks, and automated workflows into one customizable operating system.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {points.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-xl border border-white/80 bg-white/70 p-3.5 text-sm font-medium text-slate-700 shadow-sm"
                >
                  <CheckCircle2 className="size-4.5 shrink-0 text-[#6f9f7b] mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="flex items-center justify-center">
          <BusinessConvergenceVisual />
        </div>
      </div>
    </section>
  );
}
