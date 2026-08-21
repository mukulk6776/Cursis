"use client";

import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";
import type { DashboardDataState, DashboardMetric } from "@/components/dashboard/types";
import { AnimatedMetricValue } from "@/components/dashboard/AnimatedMetricValue";

type StatCardProps = {
  label: string;
  data: DashboardMetric | null;
  state: DashboardDataState;
  icon: LucideIcon;
  index: number;
};

export function StatCard({ label, data, state, icon: Icon, index }: StatCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const isLoading = state === "loading";
  const isError = state === "error";

  return (
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.08 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={shouldReduceMotion ? undefined : { scale: 1.01, y: -1 }}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      {isLoading ? (
        <div className="mt-4 space-y-2"><Skeleton className="h-7 w-20" /><Skeleton className="h-4 w-32" /></div>
      ) : (
        <>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{data ? <AnimatedMetricValue data={data} /> : "—"}</p>
          <p className={`mt-1 text-sm ${isError ? "text-rose-600" : "text-slate-500"}`}>
            {isError ? "Unable to load data" : data?.detail ?? `No ${label.toLowerCase()} data yet`}
          </p>
        </>
      )}
    </motion.article>
  );
}
