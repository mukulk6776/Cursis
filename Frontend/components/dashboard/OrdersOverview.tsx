import { ClipboardList } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import type { DashboardDataState, OrdersOverviewData } from "@/components/dashboard/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";

type OrdersOverviewProps = { data: OrdersOverviewData | null; state: DashboardDataState };

export function OrdersOverview({ data, state }: OrdersOverviewProps) {
  return (
    <DashboardSection delay={0.25} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">Orders overview</h2>
      <p className="mt-1 text-sm text-slate-500">A quick view of order performance.</p>
      {state === "loading" ? <div className="mt-5 space-y-3"><Skeleton className="h-8 w-24" /><Skeleton className="h-4 w-full" /></div> : state === "error" ? <ErrorState compact /> : data ? <p className="mt-5 text-sm text-slate-600">{data.summary}</p> : <EmptyState icon={ClipboardList} title="No order data yet" description="Connect your business data to view order trends." compact />}
    </DashboardSection>
  );
}
