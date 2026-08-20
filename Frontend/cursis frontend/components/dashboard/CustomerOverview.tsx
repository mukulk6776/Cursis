import { Users } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import type { Customer, DashboardDataState } from "@/components/dashboard/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";

type CustomerOverviewProps = { data: Customer[] | null; state: DashboardDataState };

export function CustomerOverview({ data, state }: CustomerOverviewProps) {
  const hasData = state === "ready" && data && data.length > 0;
  return (
    <DashboardSection delay={0.55} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">Customer overview</h2>
      <p className="mt-1 text-sm text-slate-500">Customer information will be ready once data is connected.</p>
      {state === "loading" ? <div className="mt-5 space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : state === "error" ? <ErrorState compact /> : hasData ? <div className="mt-5 divide-y divide-slate-100">{data.map((customer) => <div key={customer.id} className="py-3 first:pt-0"><p className="text-sm font-medium text-slate-800">{customer.name}</p><p className="mt-1 text-xs text-slate-500">{customer.summary}</p></div>)}</div> : <EmptyState icon={Users} title="No customer data yet" description="Customer insights will appear here." compact />}
    </DashboardSection>
  );
}
