"use client";

import { motion, useReducedMotion } from "framer-motion";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className={`rounded bg-slate-200 ${className}`}
      animate={shouldReduceMotion ? undefined : { opacity: [0.45, 0.8, 0.45] }}
      transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
    />
  );
}
