import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/marketing/Navbar";

type PublicInfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: readonly string[];
};

export function PublicInfoPage({ eyebrow, title, description, items }: PublicInfoPageProps) {
  return <div className="min-h-screen bg-[#f8f9f6] text-slate-950"><Navbar /><main><section className="mx-auto max-w-7xl px-5 py-20 sm:py-28 lg:px-8"><p className="text-xs font-semibold tracking-[0.18em] text-slate-600">{eyebrow}</p><h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">{title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{description}</p><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:max-w-4xl">{items.map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm"><CheckCircle2 className="size-5 shrink-0 text-[#6f9f7b]" aria-hidden="true" />{item}</div>)}</div><div className="mt-10 flex flex-wrap gap-3">
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-colors hover:bg-slate-800">
            Get Started <ArrowRight className="size-4" />
          </Link>
          <Link href="/" className="inline-flex items-center rounded-full border border-slate-300 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-white">
            Explore Cursis
          </Link>
        </div></section></main><Footer /></div>;
}
