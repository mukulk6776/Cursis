"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { DataoraLogo } from "@/components/brand/DataoraLogo";

type AuthGuardProps = { children: ReactNode };

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login?redirect=/workspace-setup");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="flex items-center gap-2 text-sm text-slate-500"><DataoraLogo variant="icon" size="sm" /><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Checking session…</div>
      </main>
    );
  }

  return <>{children}</>;
}
