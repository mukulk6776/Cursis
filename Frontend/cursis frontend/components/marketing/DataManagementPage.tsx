"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { DataoraLogo } from "@/components/brand/DataoraLogo";
import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/marketing/Navbar";

const dataSources = [
  "Employees",
  "Projects",
  "Tasks",
  "Deadlines",
  "Hiring",
  "Workflows",
] as const;

const sourceStyles = [
  "left-[5%] top-[9%] bg-[#d9edfb]",
  "right-[6%] top-[10%] bg-[#f9e5ae]",
  "left-[2%] top-[43%] bg-[#d8f0de]",
  "right-[2%] top-[44%] bg-[#ecdffc]",
  "bottom-[9%] left-[12%] bg-[#f7d8e3]",
  "bottom-[9%] right-[12%] bg-[#d8ebfa]",
] as const;

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-3xl text-center"
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-slate-600 uppercase">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">{title}</h2>
      {copy ? <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{copy}</p> : null}
    </motion.div>
  );
}

function CentralDataora({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`relative z-10 grid place-items-center rounded-full border border-white/90 bg-white shadow-[0_26px_70px_-32px_rgba(15,23,42,0.5)] ${compact ? "size-28" : "size-36 sm:size-40"}`}>
      <DataoraLogo
        variant="icon"
        size={compact ? "sm" : "md"}
        className={compact ? "scale-[1.45]" : "scale-[1.6]"}
      />
    </div>
  );
}

function AnimatedLine({ d, delay = 0 }: { d: string; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="rgba(51,65,85,0.42)"
      strokeWidth="1.4"
      strokeDasharray="5 7"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: reduced ? 0.01 : 0.9, delay, ease: "easeOut" }}
      animate={reduced ? undefined : { strokeDashoffset: [0, -48] }}
    />
  );
}

function ProblemVisual() {
  const reduced = useReducedMotion();
  return (
    <div className="relative mx-auto mt-12 h-[23rem] max-w-4xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/42 p-5 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)] backdrop-blur-sm sm:h-[27rem]">
      <svg aria-hidden="true" className="absolute inset-0 size-full" viewBox="0 0 800 430" preserveAspectRatio="none">
        <AnimatedLine d="M118 86 C265 118 290 170 400 215" delay={0.55} />
        <AnimatedLine d="M680 86 C535 118 510 170 400 215" delay={0.62} />
        <AnimatedLine d="M65 215 L400 215" delay={0.69} />
        <AnimatedLine d="M735 215 L400 215" delay={0.76} />
        <AnimatedLine d="M158 365 C265 325 305 275 400 215" delay={0.83} />
        <AnimatedLine d="M642 365 C535 325 495 275 400 215" delay={0.9} />
      </svg>
      <div className="absolute inset-0 grid place-items-center"><CentralDataora compact /></div>
      {dataSources.map((source, index) => (
        <motion.div
          key={source}
          initial={{ opacity: 0, x: index % 2 === 0 ? -42 : 42, y: index < 2 ? -26 : index > 3 ? 26 : 0 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reduced ? 0.01 : 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
          className={`absolute z-10 rounded-2xl border border-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm sm:px-4 sm:py-2.5 sm:text-sm ${sourceStyles[index]}`}
        >
          {source}
        </motion.div>
      ))}
    </div>
  );
}

function ConnectedDataVisual() {
  return (
    <div className="relative mx-auto mt-12 max-w-6xl overflow-hidden rounded-[2rem] border border-white/90 bg-white/45 p-5 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)] backdrop-blur-sm sm:p-9">
      <svg aria-hidden="true" className="absolute left-[8%] top-1/2 hidden h-px w-[84%] -translate-y-1/2 lg:block" viewBox="0 0 1000 2" preserveAspectRatio="none"><AnimatedLine d="M0 1 L1000 1" /></svg>
      <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {["Team", "Projects", "Tasks", "Deadlines", "Hiring", "Workflows"].map((item, index) => (
          <motion.div key={item} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: index * 0.07 }} className={`rounded-2xl border border-white/90 px-3 py-5 text-center text-sm font-semibold text-slate-800 shadow-sm ${["bg-[#d9edfb]", "bg-[#d8f0de]", "bg-[#ecdffc]", "bg-[#f9e5ae]", "bg-[#f7d8e3]", "bg-[#d8ebfa]"][index]}`}>
            {item}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function DataManagementContent() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#f8f9f6] via-[#edf5f1]/80 to-[#edf5f1]/50 px-5 py-20 sm:py-28 lg:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-0 size-[32rem] rounded-full bg-[#f7d7e4]/60 opacity-60 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 bottom-10 size-[30rem] rounded-full bg-[#caeafa]/50 opacity-50 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="CUSTOMIZABLE OPERATING SYSTEM"
            title="Build Cursis around your business."
            copy="Create the exact custom structure your startup needs. Manage people, projects, tasks, deadlines, and internal workflows without rigid software constraints."
          />
          <ProblemVisual />
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#edf5f1]/50 via-[#f4edf5]/60 to-[#f8f9f6] px-5 py-20 sm:py-28 lg:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-[15%] size-[32rem] rounded-full bg-[#d4f0dd]/60 opacity-55 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute top-10 right-[10%] size-[28rem] rounded-full bg-[#fde2cd]/50 opacity-45 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="ZAPIER-LIKE FLEXIBILITY"
            title="Connect actions and information across your team."
            copy="When a new hire joins, a task becomes overdue, or a project kicks off — Cursis triggers automated workflows so your team operates with total clarity."
          />
          <ConnectedDataVisual />
        </div>
      </section>
    </>
  );
}

export function BringBusinessDataTogetherSection() {
  const reduced = useReducedMotion();

  return (
    <section id="solutions" className="relative isolate overflow-hidden bg-gradient-to-b from-[#f8f9f6] via-[#f7eef5]/70 to-[#f4eff8]/50 px-5 py-24 sm:py-32 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute -left-28 top-0 size-[31rem] rounded-full bg-[#caeafa] opacity-65 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[10%] top-0 size-[32rem] rounded-full bg-[#f5d7e5] opacity-60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 left-[28%] size-[35rem] rounded-full bg-[#f7e6ad] opacity-55 blur-3xl" />
      <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.6 }} className="relative mx-auto max-w-3xl text-center">
        <Sparkles className="mx-auto size-5 text-slate-700" />
        <h2 className="mt-5 text-3xl sm:text-5xl font-bold tracking-tight text-slate-950">
          Bring your team, projects, and work together.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base sm:text-lg leading-8 text-slate-600">
          Stop managing your startup across ten disconnected tools. One customizable workspace built around the way your business actually operates.
        </p>
        <motion.div whileHover={reduced ? undefined : { scale: 1.03, y: -2 }} whileTap={reduced ? undefined : { scale: 0.98 }} className="mt-8 inline-block">
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition-colors hover:bg-slate-800">
            Build Your Workspace <ArrowRight className="size-4" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

export function DataManagementPage() {
  return (
    <div className="overflow-x-clip bg-[#f8f9f6] text-slate-950">
      <Navbar />
      <main>
        <DataManagementContent />
        <BringBusinessDataTogetherSection />
      </main>
      <Footer />
    </div>
  );
}
