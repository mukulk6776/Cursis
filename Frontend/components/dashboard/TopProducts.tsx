import { Package } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import type { DashboardDataState, Product } from "@/components/dashboard/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";

type TopProductsProps = { data: Product[] | null; state: DashboardDataState };

export function TopProducts({ data, state }: TopProductsProps) {
  const hasData = state === "ready" && data && data.length > 0;
  return (
    <DashboardSection delay={0.5} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">Top products</h2>
      <p className="mt-1 text-sm text-slate-500">Your best-performing products will appear here.</p>
      {state === "loading" ? <div className="mt-5 space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : state === "error" ? <ErrorState compact /> : hasData ? <div className="mt-5 divide-y divide-slate-100">{data.map((product) => <div key={product.id} className="py-3 first:pt-0"><p className="text-sm font-medium text-slate-800">{product.name}</p><p className="mt-1 text-xs text-slate-500">{product.summary}</p></div>)}</div> : <EmptyState icon={Package} title="No product data yet" description="Products will appear here when sales data is available." compact />}
    </DashboardSection>
  );
}
