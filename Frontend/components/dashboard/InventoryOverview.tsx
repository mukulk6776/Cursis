import { Boxes } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import type { DashboardDataState, InventoryItem } from "@/components/dashboard/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";

type InventoryOverviewProps = {
  data: InventoryItem[] | null;
  state: DashboardDataState;
};

export function InventoryOverview({ data, state }: InventoryOverviewProps) {
  const hasData = state === "ready" && data && data.length > 0;

  return (
    <DashboardSection delay={0.4} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div><h2 className="font-semibold text-slate-950">Inventory overview</h2><p className="mt-1 text-sm text-slate-500">Monitor stock levels across your catalog.</p></div>
        <button type="button" className="rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950">View inventory</button>
      </div>
      {state === "loading" ? (
        <div className="mt-5 space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
      ) : state === "error" ? <ErrorState compact /> : hasData ? (
        <div className="mt-5 divide-y divide-slate-100">{data.map((item) => <div key={item.id} className="flex items-center justify-between py-3 text-sm"><span className="font-medium text-slate-800">{item.name}</span><span className={item.stockStatus === "out" ? "text-rose-600" : "text-amber-600"}>{item.stockStatus === "out" ? "Out of stock" : "Low stock"}</span></div>)}</div>
      ) : <EmptyState icon={Boxes} title="No inventory data yet" description="Connect your product data to monitor stock levels." compact />}
    </DashboardSection>
  );
}
