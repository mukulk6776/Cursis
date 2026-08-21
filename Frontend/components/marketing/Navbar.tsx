"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { DataoraLogo } from "@/components/brand/DataoraLogo";

const navLinks = [
  { label: "Features", href: "/#features", anchor: "features" },
  { label: "Solutions", href: "/#solutions", anchor: "solutions" },
  { label: "Ordis AI", href: "/#ordis", anchor: "ordis" },
  { label: "AI Builder", href: "/#ai-builder", anchor: "ai-builder" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    link: (typeof navLinks)[number]
  ) => {
    setOpen(false);

    if (link.anchor && pathname === "/") {
      const el = document.getElementById(link.anchor);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", `#${link.anchor}`);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full px-3 pt-2.5 pb-1 sm:px-6 sm:pt-4 transition-all duration-300">
      <nav
        className={`mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full px-4 sm:px-6 transition-all duration-300 ease-in-out ${
          scrolled || open
            ? "border border-slate-200/90 bg-white/90 text-slate-900 shadow-md shadow-slate-950/5 backdrop-blur-md"
            : "border border-transparent bg-transparent text-slate-900"
        }`}
      >
        {/* Left: Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="Cursis home"
        >
          <DataoraLogo size="md" priority />
        </Link>

        {/* Center: Navigation Links */}
        <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link)}
              className="relative py-2 transition-colors hover:text-slate-950 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-violet-500 after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: Login + Get Started Pill */}
        <div className="hidden items-center gap-2.5 lg:flex">
          <Link
            href="/login"
            className="rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-4.5 py-2 text-sm font-semibold text-white shadow-md shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:scale-[1.02]"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex size-9 items-center justify-center rounded-full text-slate-900 hover:bg-slate-200/60 lg:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile Collapsible Navigation */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-xl backdrop-blur-md lg:hidden"
          >
            <div className="space-y-1 px-4 py-3.5">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-100">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-950 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
