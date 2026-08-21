type PageHeaderProps = {
  title: string;
  breadcrumb?: string;
  actionLabel?: string;
};

export function PageHeader({ title, breadcrumb = "Cursis", actionLabel = "Page action" }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
      <div>
        <p className="text-sm text-slate-500">{breadcrumb} / {title}</p>
        <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
      </div>
      <button type="button" className="rounded border border-slate-300 px-3 py-2 text-sm">{actionLabel}</button>
    </div>
  );
}
