import { TriangleAlert } from "lucide-react";

type ErrorStateProps = {
  title?: string;
  description?: string;
  compact?: boolean;
};

export function ErrorState({
  title = "Unable to load data",
  description = "Please try again.",
  compact = false,
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-6" : "min-h-52 py-10"}`}>
      <span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-600">
        <TriangleAlert className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <button type="button" className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
        Try again
      </button>
    </div>
  );
}
