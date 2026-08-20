"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const changingHeadlines = [
  "Startup Operations Copilot",
  "Team Intelligence Assistant",
  "Workflow Automation Engine",
  "Project Health Monitor",
  "Internal Operations Partner",
  "Daily Business Copilot",
];

const prompts = [
  { text: "What tasks are currently overdue across our projects?", lane: "top-[11%]" },
  { text: "Who on the team is currently overloaded this sprint?", lane: "top-[32%]" },
  { text: "Summarize the progress of Website Redesign project", lane: "top-[54%]" },
  { text: "Which milestone deadlines are approaching this week?", lane: "top-[76%]" },
  { text: "Create an onboarding workflow for a new product designer", lane: "top-[11%] hidden sm:block" },
  { text: "Assign pending code reviews to Rahul and Tejas", lane: "top-[32%] hidden sm:block" },
  { text: "Which project milestones are currently at risk?", lane: "top-[54%] hidden sm:block" },
  { text: "Generate our weekly team executive summary", lane: "top-[76%] hidden sm:block" },
] as const;

const PROMPT_DURATION = 42;

function Prompt({ text, lane, index }: { text: string; lane: string; index: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`absolute left-1/2 z-10 ${lane}`}>
      <motion.div
        className="whitespace-nowrap rounded-full border border-white/80 bg-white/70 px-3 py-2 text-xs font-medium text-slate-700 shadow-[0_14px_35px_-22px_rgba(34,49,63,0.45)] backdrop-blur-md sm:px-4 sm:py-2.5 sm:text-sm"
        animate={reduceMotion ? undefined : { x: ["-105vw", "-32vw", "-8vw", "28vw", "105vw"], y: [0, -2, 0, 2, 0], rotate: [-1, 0, 1, 0, -1], scale: [0.98, 1, 0.98, 1, 0.98], opacity: [0.9, 0.96, 0.28, 0.96, 0.9], filter: ["blur(0px)", "blur(0px)", "blur(8px)", "blur(0px)", "blur(0px)"] }}
        transition={reduceMotion ? undefined : { duration: PROMPT_DURATION, delay: -(index * (PROMPT_DURATION / prompts.length)), repeat: Infinity, ease: "linear", times: [0, 0.37, 0.5, 0.63, 1] }}
      >
        {text}
      </motion.div>
    </div>
  );
}

export function AISection() {
  const reduceMotion = useReducedMotion();
  const [activeHeadline, setActiveHeadline] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setActiveHeadline((current) => (current + 1) % changingHeadlines.length), 3200);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <section id="ordis" className="relative isolate min-h-[44rem] overflow-hidden bg-gradient-to-b from-[#f4eef9]/60 via-[#f0f7f3]/80 to-[#fbfaf7] py-16 sm:min-h-[48rem] sm:py-20">
      <motion.div aria-hidden="true" className="pointer-events-none absolute -left-[18%] top-[2%] size-[46rem] rounded-full bg-[#c3e7fa] opacity-65 blur-3xl" animate={reduceMotion ? undefined : { x: ["-3%", "8%", "-3%"], y: ["0%", "6%", "0%"] }} transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden="true" className="absolute -right-[16%] -top-[15%] size-[45rem] rounded-full bg-[#dfd3f7] opacity-70 blur-3xl" animate={reduceMotion ? undefined : { x: ["6%", "-6%", "6%"], y: ["0%", "8%", "0%"] }} transition={{ duration: 31, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden="true" className="absolute left-[12%] top-[43%] size-[42rem] rounded-full bg-[#cbeed8] opacity-65 blur-3xl" animate={reduceMotion ? undefined : { x: ["-4%", "7%", "-4%"], y: ["5%", "-5%", "5%"] }} transition={{ duration: 29, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden="true" className="absolute -bottom-[28%] right-[7%] size-[46rem] rounded-full bg-[#f9e6aa] opacity-55 blur-3xl" animate={reduceMotion ? undefined : { x: ["5%", "-7%", "5%"], y: ["-5%", "6%", "-5%"] }} transition={{ duration: 33, repeat: Infinity, ease: "easeInOut" }} />
      <div aria-hidden="true" className="absolute -bottom-[22%] -left-[12%] size-[38rem] rounded-full bg-[#f5cedc] opacity-50 blur-3xl" />

      <div className="relative mx-auto h-[38rem] max-w-7xl px-5 sm:h-[40rem] lg:px-8">
        <div className="absolute inset-0 overflow-hidden" aria-label="ORDIS prompt environment">
          {prompts.map((prompt, index) => <Prompt key={prompt.text} {...prompt} index={index} />)}
        </div>

        <div className="relative z-20 flex h-full flex-col items-center justify-center text-center">
          <motion.div animate={reduceMotion ? undefined : { scale: [1, 1.025, 1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="grid size-12 place-items-center rounded-full bg-black shadow-lg shadow-black/15 sm:size-14" aria-label="ORDIS AI">
            <motion.span aria-hidden="true" animate={reduceMotion ? undefined : { scaleY: [1, 1, 0.16, 1, 1, 0.16, 1] }} transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut", times: [0, 0.38, 0.41, 0.44, 0.82, 0.85, 1] }} className="flex origin-center gap-1.5"><span className="h-2.5 w-2 rounded-full bg-white sm:h-3 sm:w-2.5" /><span className="h-2.5 w-2 rounded-full bg-white sm:h-3 sm:w-2.5" /></motion.span>
          </motion.div>

          <div className="mt-5 min-h-24 max-w-3xl sm:mt-6 sm:min-h-28">
            <h2 className="text-2xl font-normal tracking-tight text-slate-700 sm:text-3xl md:text-4xl lg:text-[2.65rem] lg:leading-[1.18]">
              Meet Ordis AI, your
            </h2>
            <AnimatePresence mode="wait">
              <motion.p key={changingHeadlines[activeHeadline]} initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -16 }} transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }} className="text-2xl font-normal tracking-tight text-slate-700 sm:text-3xl md:text-4xl lg:text-[2.65rem] lg:leading-[1.18]">
                {changingHeadlines[activeHeadline]}
              </motion.p>
            </AnimatePresence>
          </div>

          <motion.div whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="mt-2 inline-block sm:mt-3">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-colors hover:bg-slate-800">
              Get Started <ArrowRight className="size-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
