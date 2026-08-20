"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

const builderParticles = Array.from({ length: 54 }, (_, index) => ({
  id: index,
  angle: (index * 47) % 360,
  distance: 18 + ((index * 29) % 54),
  size: index % 4 === 0 ? 3 : 2,
}));

const networkLines = [
  "M112 164 C220 84 280 124 360 208",
  "M130 310 C240 360 292 292 382 236",
  "M306 78 C366 120 410 154 418 220",
  "M442 218 C518 124 602 150 700 104",
  "M452 244 C530 326 618 330 708 274",
  "M364 216 C280 238 250 230 146 234",
] as const;

function BuilderParticle({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const particle = builderParticles[index];
  const angle = (particle.angle * Math.PI) / 180;
  const startX = Math.cos(angle) * particle.distance;
  const startY = Math.sin(angle) * particle.distance;
  const endX = Math.cos(angle) * (particle.distance * 2.4);
  const endY = Math.sin(angle) * (particle.distance * 1.5);
  const opacity = useTransform(progress, [0.16, 0.32, 0.54, 0.78, 0.93, 1], [0, 0.72, 0.9, 0.42, 0.85, 0.15]);
  const x = useTransform(progress, [0.16, 0.4, 0.75, 0.95, 1], [`${startX}%`, `${endX}%`, `${startX * 0.45}%`, "0%", `${startX * 0.22}%`]);
  const y = useTransform(progress, [0.16, 0.4, 0.75, 0.95, 1], [`${startY}%`, `${endY}%`, `${startY * 0.45}%`, "0%", `${startY * 0.22}%`]);
  const scale = useTransform(progress, [0.16, 0.35, 0.78, 0.96], [0.4, 1, 0.7, 0.2]);
  return <motion.span aria-hidden="true" className="absolute left-1/2 top-1/2 rounded-full bg-slate-700/70" style={{ width: particle.size, height: particle.size, opacity, x, y, scale }} />;
}

function GeneratedTitle({ progress }: { progress: MotionValue<number> }) {
  return (
    <div className="relative z-20 flex justify-center whitespace-nowrap text-[clamp(3.5rem,12vw,9rem)] font-semibold leading-none tracking-[-0.08em] text-slate-950">
      {"AI BUILDER".split("").map((character, index) => <GeneratedCharacter key={`${character}-${index}`} character={character} index={index} progress={progress} />)}
    </div>
  );
}

function GeneratedCharacter({ character, index, progress }: { character: string; index: number; progress: MotionValue<number> }) {
  const start = 0.035 + index * 0.012;
  const opacity = useTransform(progress, [start, start + 0.05, 0.78, 0.9], [0, 1, 1, 0.35]);
  const y = useTransform(progress, [start, start + 0.05, 0.78, 0.9], [8, 0, 0, -4]);
  return <motion.span style={{ opacity, y }} className={character === " " ? "w-[0.2em]" : "inline-block"}>{character}</motion.span>;
}

function Network({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0.18, 0.3, 0.54, 0.63], [0, 0.92, 0.78, 0]);
  const pathLength = useTransform(progress, [0.2, 0.4], [0, 1]);
  const labelsOpacity = useTransform(progress, [0.28, 0.38, 0.53, 0.61], [0, 0.7, 0.7, 0]);
  return (
    <motion.div style={{ opacity }} className="absolute inset-0 z-10">
      <svg aria-hidden="true" className="absolute inset-0 size-full" viewBox="0 0 820 430" preserveAspectRatio="none">
        {networkLines.map((path) => <motion.path key={path} d={path} fill="none" stroke="rgba(71,85,105,0.42)" strokeWidth="1" strokeDasharray="3 7" style={{ pathLength }} />)}
        {[[112,164], [130,310], [306,78], [442,218], [708,104], [708,274], [146,234]].map(([cx, cy], index) => <motion.circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={index % 2 === 0 ? 3 : 2} fill="rgba(71,85,105,0.72)" style={{ opacity: pathLength }} />)}
      </svg>
      <motion.div style={{ opacity: labelsOpacity }} className="absolute inset-0 hidden text-[9px] font-semibold tracking-[0.16em] text-slate-500 sm:block"><span className="absolute left-[13%] top-[23%]">LAYOUT</span><span className="absolute left-[31%] top-[14%]">CONTENT</span><span className="absolute right-[16%] top-[24%]">DESIGN</span><span className="absolute left-[19%] bottom-[21%]">STRUCTURE</span><span className="absolute right-[14%] bottom-[25%]">PUBLISH</span></motion.div>
    </motion.div>
  );
}

function SitePart({ label, progress, range, className }: { label: string; progress: MotionValue<number>; range: [number, number]; className: string }) {
  const opacity = useTransform(progress, [range[0], range[1], 0.78, 0.88], [0, 1, 1, 0]);
  const y = useTransform(progress, [range[0], range[1]], [10, 0]);
  return <motion.div style={{ opacity, y }} className={`rounded-md border border-slate-200/90 bg-white/90 ${className}`}><span className="block px-2 pt-1.5 text-[8px] font-semibold tracking-[0.13em] text-slate-400">{label}</span></motion.div>;
}

function GeneratedWebsite({ progress, status }: { progress: MotionValue<number>; status: string }) {
  const opacity = useTransform(progress, [0.4, 0.55, 0.78, 0.89], [0, 1, 1, 0]);
  const scale = useTransform(progress, [0.4, 0.55, 0.8, 0.89], [0.86, 1, 1, 0.93]);
  const y = useTransform(progress, [0.4, 0.55, 0.89], [18, 0, -8]);
  return (
    <motion.div style={{ opacity, scale, y }} className="absolute inset-x-5 top-1/2 z-20 mx-auto max-w-2xl -translate-y-1/2 rounded-2xl border border-white/90 bg-white/70 p-3 shadow-[0_34px_90px_-48px_rgba(15,23,42,0.58)] backdrop-blur-xl sm:inset-x-12 sm:p-4">
      <div className="mb-3 flex items-center justify-between border-b border-slate-200/80 pb-2.5"><span className="text-[10px] font-semibold tracking-[0.14em] text-slate-600">AI GENERATED STOREFRONT</span><AnimatePresence mode="wait"><motion.span key={status} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-slate-500">{status}</motion.span></AnimatePresence></div>
      <div className="space-y-2.5">
        <SitePart label="HEADER" progress={progress} range={[0.43, 0.49]} className="h-8" />
        <SitePart label="HERO" progress={progress} range={[0.48, 0.55]} className="h-20 bg-[#eff4fb]/90 sm:h-24" />
        <div className="grid grid-cols-3 gap-2"><SitePart label="PRODUCTS" progress={progress} range={[0.54, 0.61]} className="h-14" /><SitePart label="PRODUCTS" progress={progress} range={[0.56, 0.63]} className="h-14" /><SitePart label="PRODUCTS" progress={progress} range={[0.58, 0.65]} className="h-14" /></div>
        <SitePart label="CONTENT" progress={progress} range={[0.62, 0.69]} className="h-12" />
        <SitePart label="FOOTER" progress={progress} range={[0.67, 0.73]} className="h-7 bg-slate-50" />
      </div>
    </motion.div>
  );
}

export function WebBuilderSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const rawProgress = useMotionValue(0);
  const progress = useSpring(rawProgress, { stiffness: 120, damping: 28, mass: 0.45 });
  const [status, setStatus] = useState("Generating...");
  const finalOpacity = useTransform(progress, [0.88, 0.96], [0, 1]);
  const cursorOpacity = useTransform(progress, [0, 0.03, 0.11, 0.17], [0, 1, 1, 0]);

  useMotionValueEvent(progress, "change", (value) => {
    if (value < 0.58) setStatus("Generating...");
    else if (value < 0.66) setStatus("Designing...");
    else if (value < 0.74) setStatus("Optimizing...");
    else setStatus("Ready");
  });

  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      const section = sectionRef.current;
      if (!section) return;
      const top = section.getBoundingClientRect().top + window.scrollY;
      const distance = Math.max(section.offsetHeight - window.innerHeight, 1);
      rawProgress.set(Math.min(Math.max((window.scrollY - top) / distance, 0), 1));
      frame = 0;
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(updateProgress); };
    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", updateProgress); if (frame) window.cancelAnimationFrame(frame); };
  }, [rawProgress]);

  return (
    <section id="ai-builder" ref={sectionRef} className="relative isolate h-[460vh] bg-gradient-to-b from-[#f4eff8]/50 via-[#f7f8f5] via-30% to-[#f4eef9]/60 text-slate-950">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden px-5 py-7 sm:px-8">
        <div aria-hidden="true" className="absolute inset-0 opacity-70 [background-image:radial-gradient(rgba(71,85,105,0.12)_0.7px,transparent_0.7px)] [background-size:15px_15px]" />
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 size-[33rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300/45" />
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 size-[23rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300/30" />
        <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center text-center">
          <div className="absolute top-[10%] z-30"><p className="text-xs font-semibold tracking-[0.18em] text-slate-600">CURSIS AI BUILDER</p></div>
          <div className="relative flex h-[27rem] w-full items-center justify-center sm:h-[31rem]">
            <motion.span style={{ opacity: cursorOpacity }} className="absolute z-30 -translate-x-[5.4rem] -translate-y-[4.5rem] text-3xl font-light text-slate-700 sm:-translate-x-[10rem] sm:-translate-y-[6.8rem]">|</motion.span>
            <GeneratedTitle progress={progress} />
            <Network progress={progress} />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">{builderParticles.map((particle) => <BuilderParticle key={particle.id} index={particle.id} progress={progress} />)}</div>
            <GeneratedWebsite progress={progress} status={status} />
            <motion.div style={{ opacity: finalOpacity }} className="absolute z-40 flex flex-col items-center"><p className="bg-gradient-to-r from-slate-500 via-slate-950 to-slate-500 bg-clip-text text-[clamp(2.5rem,8vw,6.5rem)] font-semibold tracking-[-0.08em] text-transparent">COMING SOON</p><span className="mt-3 h-px w-24 bg-slate-400" /></motion.div>
          </div>
          <motion.div style={{ opacity: finalOpacity }} className="relative z-40 -mt-4 max-w-xl px-4 sm:-mt-7"><h2 className="text-sm font-semibold tracking-[0.18em] text-slate-700">AI WEBSITE BUILDER</h2><p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Build, launch, and manage your digital storefront with AI — directly synced with Cursis inventory.</p><p className="mt-4 text-xs text-slate-500 font-medium">Smart automated storefronts coming soon.</p><span className="mt-5 inline-flex rounded-full border border-slate-300 bg-white/65 px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-slate-700">COMING SOON</span></motion.div>
        </div>
      </div>
    </section>
  );
}
