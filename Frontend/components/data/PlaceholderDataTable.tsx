export function PlaceholderDataTable() {
  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium">Placeholder data</div>
      <div className="grid grid-cols-3 gap-4 px-4 py-3 text-sm text-slate-500">
        <span>Column one</span><span>Column two</span><span>Column three</span>
      </div>
      <div className="grid grid-cols-3 gap-4 border-t border-slate-200 px-4 py-3 text-sm text-slate-400">
        <span>Example row</span><span>—</span><span>—</span>
      </div>
    </div>
  );
}
