"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  FolderTree,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

const particles = Array.from({ length: 72 }, (_, index) => ({
  id: index,
  column: index % 18,
  row: Math.floor(index / 18),
  size: 1 + (index % 3),
}));

function Particle({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const particle = particles[index];
  const startX = (particle.column - 8.5) * 2.5;
  const startY = (particle.row - 1.5) * 8;
  const endX = (particle.column - 8.5) * 5.2 + ((index % 5) - 2) * 4;
  const endY = (particle.row - 1.5) * 17 + ((index % 7) - 3) * 4;
  const opacity = useTransform(progress, [0.5, 0.61, 0.88, 0.97, 1], [0, 0.9, 0.5, 0.7, 0]);
  const x = useTransform(progress, [0.5, 0.72, 0.94, 1], [`${startX}%`, `${endX}%`, `${startX * 0.35}%`, "0%"]);
  const y = useTransform(progress, [0.5, 0.72, 0.94, 1], [`${startY}%`, `${endY}%`, `${startY * 0.35}%`, "0%"]);
  const scale = useTransform(progress, [0.5, 0.66, 0.9, 1], [0.5, 1.35, 0.8, 0.25]);

  return (
    <motion.span
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 rounded-full bg-slate-950/80"
      style={{ width: particle.size, height: particle.size, opacity, x, y, scale }}
    />
  );
}

function DataManagementInterface({ progress, organized }: { progress: MotionValue<number>; organized: boolean }) {
  const interfaceOpacity = useTransform(progress, [0.66, 0.76, 0.93, 0.985], [0, 1, 1, 0]);
  const interfaceScale = useTransform(progress, [0.66, 0.78, 0.94, 0.985], [0.92, 1, 1, 0.96]);
  const interfaceY = useTransform(progress, [0.66, 0.78, 0.985], [18, 0, -8]);
  const recordsOpacity = useTransform(progress, [0.72, 0.81, 0.95, 0.985], [0, 1, 1, 0]);
  const statusOpacity = useTransform(progress, [0.82, 0.86, 0.95, 0.985], [0, 1, 1, 0]);

  return (
    <motion.div style={{ opacity: interfaceOpacity, scale: interfaceScale, y: interfaceY }} className="absolute inset-x-3 top-1/2 z-20 mx-auto max-w-3xl -translate-y-1/2 overflow-hidden rounded-2xl border border-white/90 bg-white/82 text-left shadow-[0_36px_90px_-44px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:inset-x-8">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 sm:px-5">
        <div><p className="text-sm font-semibold text-slate-900">Cursis data management</p><p className="mt-0.5 text-xs text-slate-500">Your connected business records</p></div>
        <span className="rounded-full bg-[#d9f0df] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-slate-700">FREE</span>
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-[1.35fr_0.65fr] sm:p-4">
        <div className="rounded-xl border border-slate-200/80 bg-white/85 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-2 text-xs text-slate-500"><Search className="size-3.5 shrink-0" /><span className="truncate">Search records</span></div><SlidersHorizontal className="size-4 text-slate-500" /></div>
          <motion.div style={{ opacity: recordsOpacity }} className="mt-4 space-y-2">
            {["Customer", "Product", "Order", "Payment"].map((record) => <div key={record} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-600"><span>{organized ? `${record} record` : record}</span><span className="rounded-full bg-slate-200/75 px-2 py-0.5 text-[10px] text-slate-500">{organized ? "Organized" : "Incoming"}</span></div>)}
          </motion.div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
          <motion.div style={{ opacity: recordsOpacity }} className="rounded-xl border border-slate-200/80 bg-[#eff7f2] p-3"><FolderTree className="size-4 text-slate-600" /><p className="mt-3 text-xs font-semibold text-slate-800">Categories</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Keep related records together.</p></motion.div>
          <motion.div style={{ opacity: statusOpacity }} className="rounded-xl border border-slate-200/80 bg-[#f0f3ff] p-3"><ShieldCheck className="size-4 text-slate-600" /><p className="mt-3 text-xs font-semibold text-slate-800">Security</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Protected workspace.</p></motion.div>
        </div>
      </div>
      <motion.div style={{ opacity: statusOpacity }} className="flex items-center gap-2 border-t border-slate-200/80 px-4 py-3 text-xs text-slate-600"><Activity className="size-3.5 text-slate-500" /><AnimatePresence mode="wait"><motion.span key={organized ? "secured" : "organizing"} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22 }}>{organized ? "Secured" : "Organizing..."}</motion.span></AnimatePresence><span className="text-slate-300">→</span><span>{organized ? "Recent activity is structured" : "Searching and managing records"}</span></motion.div>
    </motion.div>
  );
}

export function FreeDataManagementSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const rawProgress = useMotionValue(0);
  const progress = useSpring(rawProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  const reduced = useReducedMotion();
  const [organized, setOrganized] = useState(false);

  const introOpacity = useTransform(progress, [0, 0.08, 0.17, 0.25], [0, 1, 1, 0]);
  const freeOpacity = useTransform(progress, [0.1, 0.18, 0.62, 0.72, 0.94, 1], [0.25, 1, 1, 0.12, 0.35, 1]);
  const freeScale = useTransform(progress, [0.1, 0.4, 0.72, 0.95, 1], [0.72, 1.22, 1.04, 1.12, 1.15]);
  const freeY = useTransform(progress, [0.1, 0.4, 0.72, 1], [18, 0, -8, 0]);
  const scannerOpacity = useTransform(progress, [0.38, 0.43, 0.56, 0.61], [0, 1, 1, 0]);
  const scannerLength = useTransform(progress, [0.42, 0.56], [0, 1]);

  useMotionValueEvent(progress, "change", (value) => {
    setOrganized(value >= 0.84 && value < 0.95);
  });

  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      const section = sectionRef.current;
      if (!section) return;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const scrollDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
      const nextProgress = Math.min(Math.max((window.scrollY - sectionTop) / scrollDistance, 0), 1);
      rawProgress.set(nextProgress);
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateProgress);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [rawProgress]);

  return (
    <section id="features" ref={sectionRef} className="relative isolate h-[500vh] bg-gradient-to-b from-[#f8f9f6] via-[#f5f8f5] via-35% to-[#f8f9f6] text-slate-950">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden px-5 py-6 sm:px-8 sm:py-10">
        <div aria-hidden="true" className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(71,85,105,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,0.045)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300/50" />
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 size-[25rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300/35" />

        <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center text-center">
          <motion.div style={{ opacity: introOpacity }} className="absolute top-[9%] max-w-xl px-5">
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-600 uppercase">CURSIS / CUSTOM STARTUP OS</p>
            <p className="mt-3 text-lg font-medium tracking-tight text-slate-900 sm:text-2xl">Your startup operations, structured simply.</p>
          </motion.div>

          <div className="relative flex h-[25rem] w-full items-center justify-center sm:h-[30rem]">
            <motion.div style={{ opacity: freeOpacity, scale: freeScale, y: freeY }} className="relative z-10 select-none">
              <span className="block bg-gradient-to-br from-slate-950 via-slate-600 to-slate-900 bg-clip-text text-[clamp(7.4rem,23vw,18rem)] font-semibold leading-[0.78] tracking-[-0.105em] text-transparent drop-shadow-[0_2px_0_rgba(255,255,255,0.95)]">FREE</span>
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-[4%] bottom-[-8%] h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />
            </motion.div>

            <motion.svg aria-hidden="true" style={{ opacity: scannerOpacity }} className="pointer-events-none absolute h-[58%] w-[min(76%,43rem)]" viewBox="0 0 700 250" preserveAspectRatio="none">
              <motion.rect x="4" y="4" width="692" height="242" rx="7" fill="none" stroke="rgba(148,163,184,0.92)" strokeWidth="1.25" style={{ pathLength: scannerLength }} />
              <motion.path d="M4 4 H696" fill="none" stroke="rgba(255,255,255,0.96)" strokeWidth="2" style={{ pathLength: scannerLength }} />
            </motion.svg>

            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30">
              {particles.map((particle) => <Particle key={particle.id} index={particle.id} progress={progress} />)}
            </div>
            <DataManagementInterface progress={progress} organized={organized} />
          </div>

          <motion.div style={{ opacity: freeOpacity }} className="relative z-20 mt-2 flex flex-col items-center max-w-xl px-5">
            <p className="text-sm font-semibold tracking-[0.16em] text-slate-700 uppercase">
              Free Startup Operating System
            </p>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Organize your team, track projects, manage hiring, and automate workflows — completely free.
            </p>
            <div className="mt-5 flex flex-col items-center">
              <motion.div whileHover={reduced ? undefined : { scale: 1.03, y: -2 }} whileTap={reduced ? undefined : { scale: 0.98 }}>
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-colors hover:bg-slate-800">
                  Build Your Workspace <ArrowRight className="size-4" />
                </Link>
              </motion.div>
              <p className="mt-2 text-xs text-slate-500 font-medium">No credit card required</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
