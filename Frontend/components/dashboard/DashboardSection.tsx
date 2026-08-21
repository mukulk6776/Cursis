"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type DashboardSectionProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export function DashboardSection({ children, delay = 0, className }: DashboardSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
