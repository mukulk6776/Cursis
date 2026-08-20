"use client";

import React, { useState } from "react";
import { login, signup } from "@/app/auth-actions";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Lock, User, Building, Loader2, Sparkles } from "lucide-react";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = isLogin ? await login(formData) : await signup(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07070d] text-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30">
          <div className="absolute h-[600px] w-[600px] animate-pulse-glow rounded-full bg-indigo-600/30 blur-[120px]" />
          <div className="absolute h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 animate-pulse-glow rounded-full bg-violet-600/30 blur-[120px]" style={{ animationDelay: "1s" }} />
          <div className="absolute h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/4 animate-pulse-glow rounded-full bg-cyan-600/20 blur-[100px]" style={{ animationDelay: "2s" }} />
        </div>

        {/* Content */}
        <div className="z-10 w-full max-w-md animate-scale-in p-6">
          <div className="mb-10 flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/25">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome to Cursis
            </h1>
            <p className="mt-2 text-sm text-white/50">
              The premier operations platform for early-stage startups.
            </p>
          </div>

          <div className="relative rounded-3xl border border-white/[0.08] bg-[#0e0e1a]/80 p-8 shadow-2xl backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {!isLogin && (
                <div className="animate-fade-in space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-4 w-4 text-white/30" />
                      </div>
                      <input 
                        type="text" 
                        name="name" 
                        required 
                        className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-indigo-500/50 focus:bg-white/[0.06]" 
                        placeholder="Steve Jobs" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">Organization</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <Building className="h-4 w-4 text-white/30" />
                      </div>
                      <input 
                        type="text" 
                        name="organization" 
                        required 
                        className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-indigo-500/50 focus:bg-white/[0.06]" 
                        placeholder="Acme Corp" 
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-white/30" />
                  </div>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-indigo-500/50 focus:bg-white/[0.06]" 
                    placeholder="you@gmail.com" 
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-white/30" />
                  </div>
                  <input 
                    type="password" 
                    name="password" 
                    required 
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-indigo-500/50 focus:bg-white/[0.06]" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              {error && (
                <div className="animate-fade-in rounded-lg bg-red-500/10 p-3 text-center text-xs font-medium text-red-400">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }} 
                className="text-xs text-white/40 transition-colors hover:text-white/80"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
