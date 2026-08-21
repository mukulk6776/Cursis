"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

type Feature = {
  title: "Team" | "Projects" | "Hiring" | "Ordis AI";
  description: string;
  image?: { src: string; width: number; height: number; alt: string };
};

const features: Feature[] = [
  {
    title: "Team",
    description:
      "Organize employee profiles, departments, roles, responsibilities, and real-time team availability in one connected workspace.",
    image: {
      src: "/product-showcase/inventory.png",
      width: 1376,
      height: 768,
      alt: "Cursis team and operations workspace",
    },
  },
  {
    title: "Projects",
    description:
      "Assign owners, track sprint deliverables, manage dependencies, and meet deadlines with clear accountability across your startup.",
    image: {
      src: "/product-showcase/analytics.png",
      width: 1376,
      height: 768,
      alt: "Cursis projects and sprint management",
    },
  },
  {
    title: "Hiring",
    description:
      "Manage candidate pipelines, schedule interview stages, and trigger automatic onboarding workflows when new team members join.",
  },
  {
    title: "Ordis AI",
    description:
      "Your native operations copilot analyzes team workload, flags approaching deadlines, summarizes project health, and automates tasks.",
    image: {
      src: "/product-showcase/ai.png",
      width: 928,
      height: 1152,
      alt: "Ordis AI startup operations assistant",
    },
  },
];

function SecurityVisual() {
  const securityItems = [
    [KeyRound, "Role-based permissions", "Grant team members precise access permissions for sales, POS, and financial data."],
    [LockKeyhole, "Account & session security", "Keep your business account controls secure with encrypted session tokens."],
    [ShieldCheck, "Reliable data protection", "Store and protect critical customer and financial records in one place."],
  ] as const;

  return (
    <div className="w-full max-w-md rounded-[1.5rem] border border-white/85 bg-white/65 p-5 shadow-[0_28px_70px_-38px_rgba(41,53,70,0.55)] backdrop-blur-md sm:p-6">
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4">
        <span className="grid size-10 place-items-center rounded-xl bg-[#d9e9fa] text-slate-800">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-950">Workspace protection</p>
          <p className="mt-0.5 text-xs text-slate-500">Enterprise security controls for your team</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {securityItems.map(([Icon, title, copy]) => (
          <div key={title} className="flex gap-3 rounded-xl bg-white/75 p-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-[#6f9f7b]" />
            <div>
              <p className="text-sm font-medium text-slate-800">{title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{copy}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureVisual({ feature }: { feature: Feature }) {
  if (!feature.image) return <SecurityVisual />;

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Image
        src={feature.image.src}
        alt={feature.image.alt}
        width={feature.image.width}
        height={feature.image.height}
        sizes="(max-width: 1024px) 82vw, 48vw"
        className="h-auto max-h-[21rem] w-auto max-w-full rounded-[1.5rem] object-contain shadow-[0_28px_70px_-38px_rgba(41,53,70,0.55)] ring-1 ring-white/80 sm:max-h-[26rem]"
        priority={feature.title === "Products"}
      />
    </div>
  );
}

export function InteractiveFeatureShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const activeFeature = features[activeIndex];

  useEffect(() => {
    const updateActiveFeature = () => {
      const section = sectionRef.current;
      if (!section) return;

      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const scrollDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(
        Math.max((window.scrollY - sectionTop) / scrollDistance, 0),
        0.9999,
      );
      const nextIndex = Math.floor(progress * features.length);

      setActiveIndex((currentIndex) =>
        currentIndex === nextIndex ? currentIndex : nextIndex,
      );
    };

    updateActiveFeature();
    window.addEventListener("scroll", updateActiveFeature, { passive: true });
    window.addEventListener("resize", updateActiveFeature);

    return () => {
      window.removeEventListener("scroll", updateActiveFeature);
      window.removeEventListener("resize", updateActiveFeature);
    };
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative isolate h-[400vh] bg-gradient-to-b from-[#f8f9f6] via-[#eff5f2] via-30% to-[#f8f9f6] text-slate-950"
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden py-6 sm:py-10">
        <div aria-hidden="true" className="absolute -left-[18%] top-[7%] size-[38rem] rounded-full bg-[#c6e8fa] opacity-65 blur-3xl" />
        <div aria-hidden="true" className="absolute -right-[14%] -top-[18%] size-[42rem] rounded-full bg-[#ded5f8] opacity-65 blur-3xl" />
        <div aria-hidden="true" className="absolute left-[24%] bottom-[-30%] size-[46rem] rounded-full bg-[#ccefd7] opacity-55 blur-3xl" />
        <div aria-hidden="true" className="absolute -right-[8%] bottom-[-34%] size-[40rem] rounded-full bg-[#f8e6aa] opacity-55 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-[35%] -left-[12%] size-[38rem] rounded-full bg-[#f5cedd] opacity-45 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl px-5 lg:px-8">
          <div className="grid items-center gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
            <aside aria-label="Showcase sections" className="lg:self-stretch lg:border-r lg:border-slate-900/10 lg:pr-8">
              <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-slate-500 lg:mb-7">EXPLORE FEATURES</p>
              <ol className="grid grid-cols-4 gap-2 lg:block lg:space-y-2">
                {features.map((feature, index) => {
                  const active = index === activeIndex;
                  return (
                    <li key={feature.title}>
                      <span
                        aria-current={active ? "step" : undefined}
                        className={`flex items-center rounded-xl px-2 py-2 text-sm font-semibold transition-colors sm:text-base lg:px-3 lg:py-3 ${
                          active
                            ? "bg-white/80 text-slate-950 shadow-sm"
                            : "text-slate-400"
                        }`}
                      >
                        <span className={`mr-2 hidden size-1.5 rounded-full lg:block ${active ? "bg-slate-950" : "bg-slate-300"}`} />
                        {feature.title}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </aside>

            <div className="min-h-[30rem] overflow-hidden rounded-[1.75rem] border border-white/85 bg-white/30 p-5 shadow-[0_30px_80px_-50px_rgba(41,53,70,0.55)] backdrop-blur-sm sm:min-h-[33rem] sm:p-8 lg:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature.title}
                  initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.987 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -12, scale: 0.99 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="grid min-h-[26rem] items-center gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:gap-10"
                >
                  <div className="max-w-md">
                    <p className="text-xs font-semibold tracking-[0.16em] text-slate-600 uppercase">CURSIS {activeFeature.title}</p>
                    <h3 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                      {activeFeature.title === "AI"
                        ? "Meet Ordis AI in your daily workflow."
                        : `${activeFeature.title}, unified and clear.`}
                    </h3>
                    <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{activeFeature.description}</p>
                  </div>

                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, x: 18, scale: 0.975 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.52, delay: reduceMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="flex min-h-[15rem] items-center justify-center rounded-[1.5rem] border border-white/75 bg-white/35 p-4 sm:min-h-[20rem] sm:p-6"
                  >
                    <FeatureVisual feature={activeFeature} />
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
