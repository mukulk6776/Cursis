import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DataoraLogo } from "@/components/brand/DataoraLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <DataoraLogo size="md" />
      <h1 className="mt-6 text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
        404 — Page Not Found
      </h1>
      <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-md">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved or deleted.
      </p>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition-all"
        >
          <ArrowLeft className="size-4" />
          Back to Homepage
        </Link>
      </div>
    </div>
  );
}
