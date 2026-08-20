import { ChartNoAxesCombined } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import type { DashboardDataState, SalesData } from "@/components/dashboard/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";

type SalesOverviewProps = {
  data: SalesData | null;
  state: DashboardDataState;
};

export function SalesOverview({ data, state }: SalesOverviewProps) {
  return (
    <DashboardSection delay={0.2} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-950">Sales overview</h2>
          <p className="mt-1 text-sm text-slate-500">Track sales performance once business data is connected.</p>
        </div>
        {data ? <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{data.periodLabel}</span> : null}
      </div>
      {state === "loading" ? (
        <div className="mt-6 space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-5"><Skeleton className="h-4 w-32" /><Skeleton className="h-48 w-full" /></div>
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <EmptyState icon={ChartNoAxesCombined} title="No sales data available yet" description="Connect your business data to see sales analytics." />
      )}
    </DashboardSection>
  );
}
