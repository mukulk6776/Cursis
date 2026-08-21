type PlaceholderButtonProps = { children: React.ReactNode };

export function PlaceholderButton({ children }: PlaceholderButtonProps) {
  return <button type="button" className="rounded border border-slate-300 px-3 py-2 text-sm">{children}</button>;
}
