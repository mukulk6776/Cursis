import type { ReactNode } from "react";
import Link from "next/link";
import { DataoraLogo } from "@/components/brand/DataoraLogo";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex items-center justify-center p-5 sm:p-8">{children}</section>
      <aside className="hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/auth/login" className="flex items-center" aria-label="Cursis login"><DataoraLogo size="lg" tone="dark" /></Link>
        <div className="max-w-md">
          <p className="text-sm font-medium text-slate-300">Business operations, brought together.</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">One workspace for the work that moves your business forward.</h2>
          <p className="mt-5 text-base leading-7 text-slate-300">Manage your operations with a clear, connected view of what matters.</p>
        </div>
        <p className="text-sm text-slate-400">Cursis</p>
      </aside>
    </main>
  );
}
