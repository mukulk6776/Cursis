"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { DataoraLogo } from "@/components/brand/DataoraLogo";

const footerColumns = [
  {
    title: "Products",
    links: [
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Customers", href: "/#solutions" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/about" },
      { label: "Terms", href: "/about" },
    ],
  },
];

export function Footer() {
  const reduceMotion = useReducedMotion();

  return (
    <footer id="contact" className="relative bg-[#f8f9f6] px-4 pb-8 pt-6 sm:px-6 sm:pb-12 lg:px-8">
      {/* Framed Card Container with soft rounded corners */}
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/5">
        
        {/* UPPER BANNER: Pure Sunset Gradient Sky + Headline + CTA + Layered Vector Dunes */}
        <div className="relative isolate flex min-h-[28rem] flex-col items-center justify-center overflow-hidden px-6 pt-20 pb-48 text-center sm:min-h-[32rem] sm:pt-24 sm:pb-56">
          
          {/* Smooth Sunset Sky Gradient */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-gradient-to-b from-[#fcd3b6] via-[#f7bcd3] via-40% to-[#ebd7f4]"
          />

          {/* Ambient Glowing Sky Light */}
          <motion.div
            aria-hidden="true"
            animate={reduceMotion ? undefined : { scale: [1, 1.06, 1], opacity: [0.6, 0.85, 0.6] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-2 size-[32rem] rounded-full bg-gradient-to-br from-amber-200/60 via-pink-300/45 to-purple-300/40 blur-3xl -z-10"
          />

          {/* Headline */}
          <motion.h2
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 max-w-2xl text-3xl font-medium tracking-tight text-slate-950 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.18] text-balance font-serif"
          >
            Bring clarity, structure, and speed to your startup operations
          </motion.h2>

          {/* CTA Pill Button */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            whileHover={reduceMotion ? undefined : { scale: 1.04, y: -2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            className="relative z-20 mt-8"
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-xs sm:text-sm font-medium text-white shadow-lg shadow-black/15 transition-colors hover:bg-slate-800"
            >
              Start your Workspace <ArrowRight className="size-3.5" />
            </Link>
          </motion.div>

          {/* Pure SVG Layered Gradient Dunes (Zero photo, perfectly smooth vectors) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-52 w-full sm:h-64 md:h-76">
            <svg
              className="size-full"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                {/* Back Hill Gradient */}
                <linearGradient id="backDune" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ccaedc" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#debfe8" stopOpacity="0.95" />
                </linearGradient>

                {/* Middle Dune Gradient */}
                <linearGradient id="midDune" x1="0%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#e8d5f0" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#f2e3f6" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#e6d4ef" stopOpacity="0.9" />
                </linearGradient>

                {/* Foreground Slope Gradient */}
                <linearGradient id="frontDune" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fbf6fd" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#fdfaff" stopOpacity="0.98" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Layer 1: Far Right Lavender Ridge */}
              <path
                d="M 680 170 Q 980 80 1260 105 Q 1370 115 1440 135 L 1440 320 L 680 320 Z"
                fill="url(#backDune)"
              />

              {/* Layer 2: Middle Lilac Dune */}
              <path
                d="M 160 200 Q 560 125 930 165 Q 1240 200 1440 180 L 1440 320 L 160 320 Z"
                fill="url(#midDune)"
              />

              {/* Layer 3: Main Sweeping Foreground Hill */}
              <path
                d="M 0 215 Q 340 160 740 195 Q 1120 225 1440 200 L 1440 320 L 0 320 Z"
                fill="url(#frontDune)"
              />

              {/* Layer 4: Clean Pure White Base Transition */}
              <path
                d="M 0 250 Q 420 215 820 238 Q 1200 258 1440 240 L 1440 320 L 0 320 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        </div>

        {/* LOWER SECTION: Clean Modern Footer Links on White Floor */}
        <div className="relative z-20 bg-white px-6 pb-12 pt-6 sm:px-12 sm:pb-16 sm:pt-8 lg:px-16">
          <div className="grid gap-10 md:grid-cols-[1.6fr_repeat(3,1fr)] lg:gap-14">
            {/* Left Brand Column */}
            <div className="space-y-4">
              <Link href="/" className="inline-flex items-center gap-2" aria-label="Cursis home">
                <DataoraLogo size="md" />
              </Link>
              <p className="max-w-xs text-xs sm:text-sm leading-relaxed text-slate-500 font-normal">
                Run every part of your business workflow from one intelligent platform.
              </p>
              <p className="pt-2 text-xs text-slate-400">
                &copy; {new Date().getFullYear()} Cursis AI. All rights reserved.
              </p>
            </div>

            {/* Right Navigation Columns */}
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-semibold text-slate-900 tracking-tight">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-xs font-normal text-slate-500 transition-colors hover:text-slate-950"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
