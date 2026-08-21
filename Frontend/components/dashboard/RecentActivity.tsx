import { Activity as ActivityIcon } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import type { Activity, DashboardDataState } from "@/components/dashboard/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";

type RecentActivityProps = {
  data: Activity[] | null;
  state: DashboardDataState;
};

export function RecentActivity({ data, state }: RecentActivityProps) {
  const hasData = state === "ready" && data && data.length > 0;

  return (
    <DashboardSection delay={0.65} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">Recent activity</h2>
      <p className="mt-1 text-sm text-slate-500">Business events will appear here.</p>
      {state === "loading" ? (
        <div className="mt-5 space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-3/5" /></div>
      ) : state === "error" ? <ErrorState compact /> : hasData ? (
        <div className="mt-5 divide-y divide-slate-100">{data.map((item) => <div key={item.id} className="py-3 first:pt-0"><p className="text-sm text-slate-700">{item.message}</p><p className="mt-1 text-xs text-slate-500">{item.timeLabel}</p></div>)}</div>
      ) : <EmptyState icon={ActivityIcon} title="No activity yet" description="Activity will appear as your business gets moving." compact />}
    </DashboardSection>
  );
}
