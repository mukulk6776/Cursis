"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Phase = "scatter" | "friction" | "connect" | "system" | "growth";

type BusinessNode = {
  id: "Team" | "Projects" | "Tasks" | "Deadlines" | "Hiring" | "Workflows" | "Docs";
  scatter: [number, number];
  system: [number, number];
  related: string[];
};

const nodes: BusinessNode[] = [
  { id: "Team", scatter: [12, 19], system: [24, 25], related: ["Projects", "Tasks", "Workflows"] },
  { id: "Projects", scatter: [68, 12], system: [48, 16], related: ["Team", "Tasks", "Deadlines"] },
  { id: "Tasks", scatter: [33, 74], system: [73, 25], related: ["Projects", "Deadlines", "Team"] },
  { id: "Deadlines", scatter: [79, 58], system: [83, 52], related: ["Projects", "Tasks", "Workflows"] },
  { id: "Hiring", scatter: [10, 80], system: [69, 79], related: ["Team", "Docs", "Workflows"] },
  { id: "Workflows", scatter: [55, 43], system: [36, 83], related: ["Tasks", "Deadlines", "Team"] },
  { id: "Docs", scatter: [88, 29], system: [17, 55], related: ["Team", "Projects", "Hiring"] },
];

const relations = [
  ["Team", "Projects"],
  ["Projects", "Tasks"],
  ["Projects", "Deadlines"],
  ["Tasks", "Deadlines"],
  ["Team", "Hiring"],
  ["Tasks", "Workflows"],
  ["Projects", "Docs"],
] as const;

const phaseCopy: Record<Phase, string | null> = {
  scatter: null,
  friction: "Searching across 10 different tools...",
  connect: "Unifying into Cursis...",
  system: "One customizable operating system.",
  growth: "Your team operates with clarity.",
};

const phaseDuration: Record<Phase, number> = {
  scatter: 4600,
  friction: 2600,
  connect: 2600,
  system: 3600,
  growth: 3400,
};

const nextPhase: Record<Phase, Phase> = {
  scatter: "friction",
  friction: "connect",
  connect: "system",
  system: "growth",
  growth: "scatter",
};

function findNode(id: string) {
  return nodes.find((node) => node.id === id)!;
}

function nodePosition(node: BusinessNode, phase: Phase, focus: string | null): [number, number] {
  const [baseX, baseY] = phase === "scatter" || phase === "friction" ? node.scatter : node.system;
  if (!focus || focus === node.id) return [baseX, baseY];

  const focusedNode = findNode(focus);
  const related = focusedNode.related.includes(node.id);
  if (!related) return [baseX, baseY];

  const [focusX, focusY] = phase === "scatter" || phase === "friction" ? focusedNode.scatter : focusedNode.system;
  return [baseX + (focusX - baseX) * 0.13, baseY + (focusY - baseY) * 0.13];
}

export function ProblemSection() {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("scatter");
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    if (reduced) return;
    const timeout = window.setTimeout(() => setPhase(nextPhase[phase]), phaseDuration[phase]);
    return () => window.clearTimeout(timeout);
  }, [phase, reduced]);

  const connected = phase === "connect" || phase === "system" || phase === "growth";

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#f8f9f6] via-[#f2eff7]/60 via-40% to-[#f8f9f6] pb-20 pt-36 text-slate-950 sm:pb-28 sm:pt-48 lg:pt-56">
      {/* Soft Ambient Blended Light Orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/4 top-1/3 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-200/30 via-pink-100/25 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-1/4 top-2/3 size-[38rem] translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tl from-emerald-100/30 via-sky-100/25 to-transparent blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-600 uppercase">
            CURSIS / WHY IT MATTERS
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl text-balance">
            Managing a growing team is messy.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg text-balance">
            When your people, projects, tasks, deadlines, and hiring are scattered across different apps, every decision takes longer. Cursis brings the pieces together into one flexible workspace.
          </p>
        </motion.div>

        <div className="relative mx-auto mt-12 h-[29rem] max-w-6xl overflow-hidden rounded-[2rem] border border-white/90 bg-gradient-to-tr from-white/70 via-white/50 to-white/80 shadow-[0_32px_85px_-48px_rgba(15,23,42,0.18)] backdrop-blur-md sm:mt-14 sm:h-[35rem]">
          <div aria-hidden="true" className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(71,85,105,0.12)_0.65px,transparent_0.65px)] [background-size:18px_18px]" />
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 size-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300/40 sm:size-[22rem]" />
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 size-[10rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300/30 sm:size-[15rem]" />

          <svg aria-hidden="true" className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {relations.map(([from, to], index) => {
              const source = findNode(from);
              const target = findNode(to);
              const [x1, y1] = nodePosition(source, phase, focus);
              const [x2, y2] = nodePosition(target, phase, focus);
              const relatedToFocus = focus ? from === focus || to === focus : false;
              const visible = connected || relatedToFocus || (phase === "friction" && index < 3);
              return <motion.line key={`${from}-${to}`} x1={x1} y1={y1} x2={x2} y2={y2} animate={{ opacity: visible ? (relatedToFocus ? 0.9 : 0.42) : 0, pathLength: visible ? 1 : 0 }} transition={{ type: "spring", stiffness: 80, damping: 20, delay: phase === "connect" ? index * 0.08 : 0 }} stroke={relatedToFocus || connected ? "rgba(86,120,151,0.72)" : "rgba(100,116,139,0.45)"} strokeWidth={relatedToFocus ? 0.38 : 0.22} strokeDasharray={phase === "friction" ? "1.4 1.8" : undefined} />;
            })}
            {connected ? <motion.path d="M24 25 L48 16 L73 25 L69 79 L83 52 L17 55" fill="none" stroke="rgba(106,145,175,0.85)" strokeWidth="0.48" strokeDasharray="1.2 1.7" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.4, ease: "easeInOut" }} /> : null}
          </svg>

          <AnimatePresence>
            {phase === "friction" ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 pointer-events-none text-[10px] font-medium tracking-[0.12em] text-slate-400"><span className="absolute left-[19%] top-[39%]">SEARCHING IN NOTION...</span><span className="absolute right-[16%] top-[31%]">WAITING ON SLACK...</span><span className="absolute bottom-[17%] left-[42%]">OVERDUE DEADLINE</span></motion.div> : null}
          </AnimatePresence>

          <AnimatePresence>
            {connected ? <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.5 }} className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center"><span className="text-xs font-semibold tracking-[0.2em] text-slate-800">CURSIS</span>{phase === "growth" ? <motion.p initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="mt-2 text-2xl font-semibold tracking-[0.08em] text-slate-950 sm:text-3xl">ONE ECOSYSTEM</motion.p> : null}</motion.div> : null}
          </AnimatePresence>

          {nodes.map((node, index) => {
            const [left, top] = nodePosition(node, phase, focus);
            const isFocused = focus === node.id;
            const related = focus ? findNode(focus).related.includes(node.id) : false;
            const quiet = Boolean(focus && !isFocused && !related);
            return (
              <motion.button
                key={node.id}
                type="button"
                onPointerEnter={() => setFocus(node.id)}
                onPointerLeave={() => setFocus(null)}
                onFocus={() => setFocus(node.id)}
                onBlur={() => setFocus(null)}
                animate={{ left: `${left}%`, top: `${top}%`, opacity: quiet ? 0.32 : 1, scale: isFocused ? 1.14 : related ? 1.03 : 1, rotate: phase === "scatter" ? [index % 2 ? -1.5 : 1, index % 2 ? 1.5 : -1, index % 2 ? -1.5 : 1] : 0 }}
                transition={phase === "scatter" ? { left: { type: "spring", stiffness: 68, damping: 17 }, top: { type: "spring", stiffness: 68, damping: 17 }, opacity: { duration: 0.35 }, scale: { type: "spring", stiffness: 150, damping: 16 }, rotate: { duration: 4.2 + index * 0.25, repeat: Infinity, ease: "easeInOut" } } : { type: "spring", stiffness: 78, damping: 18 }}
                className="absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/85 bg-white/76 px-2.5 py-2 text-[10px] font-semibold tracking-[0.08em] text-slate-700 shadow-[0_16px_34px_-25px_rgba(15,23,42,0.6)] backdrop-blur-md transition-colors hover:bg-white sm:px-4 sm:py-2.5 sm:text-xs"
                aria-pressed={isFocused}
              >
                {node.id}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-7 flex min-h-12 flex-col items-center text-center">
          <AnimatePresence mode="wait">
            {phaseCopy[phase] ? <motion.p key={phaseCopy[phase]} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.35 }} className="text-sm font-medium text-slate-600">{phaseCopy[phase]}</motion.p> : <motion.p key="explore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-500">Move across a business node to explore its relationships.</motion.p>}
          </AnimatePresence>
          <Link href="/data-management" className="mt-3 text-sm font-semibold text-slate-800 underline-offset-4 transition-colors hover:text-slate-950 hover:underline">See how Cursis connects it →</Link>
        </div>
      </div>
    </section>
  );
}
