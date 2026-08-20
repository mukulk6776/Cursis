import { ShoppingCart } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import type { DashboardDataState, Order } from "@/components/dashboard/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";

type RecentOrdersProps = {
  data: Order[] | null;
  state: DashboardDataState;
};

export function RecentOrders({ data, state }: RecentOrdersProps) {
  const hasOrders = state === "ready" && data && data.length > 0;

  return (
    <DashboardSection delay={0.3} className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-950">Recent orders</h2>
          <p className="mt-1 text-sm text-slate-500">Latest orders from your business.</p>
        </div>
        <button type="button" className="rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950">View all</button>
      </div>
      {state === "loading" ? (
        <div className="space-y-3 p-5"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div>
      ) : state === "error" ? (
        <ErrorState compact />
      ) : hasOrders ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-medium">Order</th><th className="px-5 py-3 font-medium">Customer</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Amount</th><th className="px-5 py-3 font-medium">Date</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{data.map((order) => <tr key={order.id} className="hover:bg-slate-50"><td className="px-5 py-3.5 font-medium text-slate-900">{order.id}</td><td className="px-5 py-3.5 text-slate-600">{order.customerName}</td><td className="px-5 py-3.5 text-slate-600">{order.status}</td><td className="px-5 py-3.5 text-slate-600">{order.amount}</td><td className="px-5 py-3.5 text-slate-600">{order.dateLabel}</td></tr>)}</tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={ShoppingCart} title="No orders yet" description="Your orders will appear here." compact />
      )}
    </DashboardSection>
  );
}
