import { PlaceholderDataTable } from "@/components/data/PlaceholderDataTable";

type PlaceholderContentProps = { title: string };

export function PlaceholderContent({ title }: PlaceholderContentProps) {
  return (
    <section className="space-y-4" aria-label={`${title} content area`}>
      <div className="rounded border border-dashed border-slate-300 bg-white p-6">
        <p className="text-sm font-medium">{title} content area</p>
        <p className="mt-1 text-sm text-slate-500">Static placeholder for the Phase 1 wireframe.</p>
      </div>
      <PlaceholderDataTable />
    </section>
  );
}
