import Link from "next/link";
import { PlaceholderButton } from "@/components/ui/PlaceholderButton";

const builderLinks = [
  { label: "Editor", href: "/web-builder/editor" },
  { label: "Pages", href: "/web-builder/pages" },
  { label: "Themes", href: "/web-builder/themes" },
  { label: "Templates", href: "/web-builder/templates" },
  { label: "Navigation", href: "/web-builder/navigation" },
  { label: "Domains", href: "/web-builder/domains" },
  { label: "Settings", href: "/web-builder/settings" },
];

export function WebBuilderEditor() {
  return (
    <section className="overflow-hidden rounded border border-slate-300 bg-white" aria-label="Web Builder editor">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3 text-sm">
        <Link href="/web-builder" className="rounded border border-slate-300 px-3 py-2">Back</Link>
        <button type="button" className="rounded border border-slate-300 px-3 py-2">Home page</button>
        <div className="ml-auto flex flex-wrap gap-2">
          <PlaceholderButton>Desktop</PlaceholderButton>
          <PlaceholderButton>Tablet</PlaceholderButton>
          <PlaceholderButton>Mobile</PlaceholderButton>
          <PlaceholderButton>Preview</PlaceholderButton>
          <PlaceholderButton>Save</PlaceholderButton>
          <PlaceholderButton>Publish</PlaceholderButton>
        </div>
      </div>

      <div className="grid min-h-[560px] grid-cols-[180px_minmax(0,1fr)_220px]">
        <aside className="border-r border-slate-200 p-3 text-sm">
          <p className="mb-3 font-medium">Left Panel</p>
          <div className="space-y-2">
            <button type="button" className="block w-full rounded border border-slate-300 px-3 py-2 text-left">Add</button>
            <button type="button" className="block w-full rounded border border-slate-300 px-3 py-2 text-left">Layers</button>
            <button type="button" className="block w-full rounded border border-slate-300 px-3 py-2 text-left">Pages</button>
          </div>
          <div className="mt-6 border-t border-slate-200 pt-3 text-slate-500">
            {builderLinks.map((item) => <Link key={item.href} href={item.href} className="block py-1 hover:underline">{item.label}</Link>)}
          </div>
        </aside>

        <div className="bg-slate-100 p-6">
          <p className="mb-3 text-sm font-medium">Center Canvas</p>
          <div className="mx-auto max-w-2xl space-y-3 border border-dashed border-slate-400 bg-white p-4 text-sm">
            <div className="border border-slate-200 p-4">Header</div>
            <div className="border border-slate-200 p-8">Hero</div>
            <div className="border border-slate-200 p-10">Content sections</div>
            <div className="border border-slate-200 p-4">Footer</div>
          </div>
        </div>

        <aside className="border-l border-slate-200 p-3 text-sm">
          <p className="mb-3 font-medium">Right Inspector</p>
          <div className="space-y-2">
            <button type="button" className="block w-full rounded border border-slate-300 px-3 py-2 text-left">Settings</button>
            <button type="button" className="block w-full rounded border border-slate-300 px-3 py-2 text-left">Style</button>
            <button type="button" className="block w-full rounded border border-slate-300 px-3 py-2 text-left">Advanced</button>
          </div>
        </aside>
      </div>
    </section>
  );
}
