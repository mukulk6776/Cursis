"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, MapPin, Package, Users } from "lucide-react";
import { DataoraLogo } from "@/components/brand/DataoraLogo";

const steps = [
  [Building2, "Business information", "Tell us the basics about your business."],
  [MapPin, "Business category and location", "Set the context for your workspace."],
  [Package, "Add your first product", "Start building your catalog when you are ready."],
  [Users, "Invite your team", "Bring the right people into Cursis."],
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);

  async function finishOnboarding() {
    setIsCompleting(true);
    await fetch("/api/auth/onboarding", { method: "PATCH" });
    router.replace("/dashboard");
  }

  return <main className="min-h-screen bg-slate-50 px-5 py-8 sm:p-12"><div className="mx-auto max-w-3xl"><DataoraLogo size="md" /><section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"><p className="text-sm font-medium text-slate-500">Welcome to Cursis</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Set up your workspace</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Complete these steps now, or skip them and return whenever your business is ready.</p><ol className="mt-8 space-y-4">{steps.map(([Icon, title, copy], index) => <li key={title} className="flex gap-4 rounded-xl border border-slate-200 p-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">{index + 1}</span><div><div className="flex items-center gap-2"><Icon className="size-4 text-slate-500" aria-hidden="true" /><h2 className="font-medium text-slate-900">{title}</h2></div><p className="mt-1 text-sm text-slate-500">{copy}</p></div></li>)}</ol><div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={finishOnboarding} disabled={isCompleting} className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Skip for now</button><button type="button" onClick={finishOnboarding} disabled={isCompleting} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">{isCompleting ? "Finishing…" : "Go to dashboard"} <ArrowRight className="size-4" /></button></div><p className="mt-5 flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />You can complete every setup task later from your workspace.</p></section></div></main>;
}
