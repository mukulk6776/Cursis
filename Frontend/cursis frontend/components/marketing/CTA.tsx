"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Ideal for small teams, startups, and single-store operations.",
    features: [
      "Core POS & Sales Management",
      "Basic Inventory Tracking",
      "Customer Database & History",
      "Standard Analytics Reports",
      "Free Data Protection",
    ],
    cta: "Start Free",
    href: "/signup",
    popular: false,
  },
  {
    name: "Team Growth",
    price: "$49",
    period: "per month",
    description: "For growing businesses requiring multi-location sync & AI features.",
    features: [
      "Everything in Starter",
      "Multi-Location Inventory",
      "Ordis AI Business Assistant",
      "Advanced Expense & Accounting",
      "Udhar & Credit Ledger Tracking",
      "Priority Email & Chat Support",
    ],
    cta: "Get Started",
    href: "/signup",
    popular: true,
  },
  {
    name: "Enterprise Custom",
    price: "Custom",
    period: "flexible billing",
    description: "Custom infrastructure, SLAs, and dedicated API integrations.",
    features: [
      "Everything in Team Growth",
      "Unlimited Cursis Team Seats",
      "Dedicated Single-Tenant Instance",
      "Custom ERP & WhatsApp Webhooks",
      "24/7 Phone & Onboarding Support",
    ],
    cta: "Contact Enterprise",
    href: "/workspace-setup",
    popular: false,
  },
];

export function CTA() {
  const shouldReduceMotion = useReducedMotion();
  const float = (x: number[], y: number[]) => (shouldReduceMotion ? undefined : { x, y });

  return (
    <section id="pricing" className="relative isolate overflow-hidden bg-[#f8faf6] py-20 sm:py-28">
      <motion.div
        aria-hidden="true"
        className="absolute -left-24 -top-32 size-[28rem] rounded-full bg-[#bfe7fa] opacity-65 blur-3xl"
        animate={float([0, 55, 0], [0, 25, 0])}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute left-[20%] top-12 size-[27rem] rounded-full bg-[#ccefd7] opacity-60 blur-3xl"
        animate={float([0, -45, 0], [0, 35, 0])}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -right-20 top-0 size-[30rem] rounded-full bg-[#ddd4fa] opacity-65 blur-3xl"
        animate={float([0, -30, 0], [0, 45, 0])}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-600 uppercase">
            TRANSPARENT PRICING
          </p>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-slate-950">
            Simple plans for every stage of growth.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg leading-7 text-slate-600">
            Choose the right tier for your workspace or start completely free today.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-8 lg:grid-cols-3 items-stretch">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className={`relative flex flex-col rounded-3xl p-7 transition-all ${
                plan.popular
                  ? "border-2 border-slate-950 bg-white shadow-2xl ring-1 ring-slate-950/10"
                  : "border border-white/90 bg-white/70 shadow-lg backdrop-blur-md hover:border-slate-300"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-1 text-[11px] font-semibold text-white tracking-wide uppercase">
                  Most Popular
                </span>
              )}
              <div>
                <h3 className="text-xl font-bold text-slate-950">{plan.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-950">{plan.price}</span>
                  <span className="text-xs font-medium text-slate-500">/{plan.period}</span>
                </div>
              </div>

              <ul className="mt-7 space-y-3 flex-1 border-t border-slate-200/70 pt-6 text-xs text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <Check className="size-4 shrink-0 text-emerald-600 font-bold" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-4">
                <motion.div
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  className="w-full"
                >
                  <Link
                    href={plan.href}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition-all ${
                      plan.popular
                        ? "bg-slate-950 text-white shadow-lg shadow-black/15 hover:bg-slate-800"
                        : "border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-50"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="size-4" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
