"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthShell } from "@/components/auth/AuthShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { DataoraLogo } from "@/components/brand/DataoraLogo";
import { loginWithEmail, loginWithGoogle, loginWithMicrosoft } from "@/lib/auth/firebase";
import { isAllowedEmailDomain, EMAIL_RESTRICTION_MESSAGE } from "@/lib/auth/email-validation";
import { formatAuthError } from "@/lib/auth/auth-errors";

export default function LoginPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading: isSessionLoading,
    refreshSession,
  } = useAuth();

  const shouldReduceMotion = useReducedMotion();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);

  useEffect(() => {
    if (!isSessionLoading && isAuthenticated) {
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      router.replace(redirect?.startsWith("/") ? redirect : "/dashboard");
    }
  }, [isAuthenticated, isSessionLoading, router]);

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    setFormError("");

    try {
      const firebaseUser = await loginWithGoogle();
      if (firebaseUser) {
        if (!isAllowedEmailDomain(firebaseUser.email || "")) {
          throw new Error(EMAIL_RESTRICTION_MESSAGE);
        }

        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
            mode: "login",
          }),
        });

        await refreshSession();
        const redirect = new URLSearchParams(window.location.search).get("redirect");
        router.replace(redirect?.startsWith("/") ? redirect : "/dashboard");
      }
    } catch (error) {
      console.error("Google login error:", error);
      setFormError(formatAuthError(error));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function handleMicrosoftLogin() {
    setIsMicrosoftLoading(true);
    setFormError("");

    try {
      const firebaseUser = await loginWithMicrosoft();
      if (firebaseUser) {
        if (!isAllowedEmailDomain(firebaseUser.email || "")) {
          throw new Error(EMAIL_RESTRICTION_MESSAGE);
        }

        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
            mode: "login",
          }),
        });

        await refreshSession();
        const redirect = new URLSearchParams(window.location.search).get("redirect");
        router.replace(redirect?.startsWith("/") ? redirect : "/dashboard");
      }
    } catch (error) {
      console.error("Microsoft login error:", error);
      setFormError(formatAuthError(error));
    } finally {
      setIsMicrosoftLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: {
      email?: string;
      password?: string;
    } = {};

    if (!isAllowedEmailDomain(email.trim())) {
      nextErrors.email = EMAIL_RESTRICTION_MESSAGE;
    }

    if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);

    try {
      let userName = email.split("@")[0];
      try {
        const firebaseUser = await loginWithEmail(email, password);
        if (firebaseUser?.displayName) {
          userName = firebaseUser.displayName;
        }
      } catch (fbError) {
        console.warn("Firebase email login fallback to local session:", fbError);
      }

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name: userName,
          password,
          mode: "login",
        }),
      });

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to log in.");
      }

      await refreshSession();

      const redirect = new URLSearchParams(
        window.location.search
      ).get("redirect");

      router.replace(
        redirect?.startsWith("/") ? redirect : "/dashboard"
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to log in. Please try again."
      );
      setIsLoading(false);
    }
  }

  return (
    <AuthShell>
      <motion.div
        initial={
          shouldReduceMotion
            ? false
            : { opacity: 0, y: 16 }
        }
        animate={
          shouldReduceMotion
            ? undefined
            : { opacity: 1, y: 0 }
        }
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="w-full max-w-md"
      >
        <Link
          href="/login"
          className="mb-10 flex items-center lg:hidden"
          aria-label="Cursis login"
        >
          <DataoraLogo size="md" />
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-slate-500">
            Welcome back
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Login to Cursis
          </h1>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Sign in to access your business operations workspace.
          </p>

          {/* Social Sign-In Buttons */}
          <div className="mt-6 space-y-2.5">
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isMicrosoftLoading || isLoading}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <LoaderCircle className="size-4 animate-spin text-slate-600" />
              ) : (
                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            {/* Microsoft Sign In */}
            <button
              type="button"
              onClick={handleMicrosoftLogin}
              disabled={isGoogleLoading || isMicrosoftLoading || isLoading}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              {isMicrosoftLoading ? (
                <LoaderCircle className="size-4 animate-spin text-slate-600" />
              ) : (
                <svg className="size-4 shrink-0" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
              )}
              Continue with Microsoft
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs uppercase tracking-wide text-slate-400">
              or with email
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate
          >
            <AuthInput
              id="email"
              label="Email Address"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              error={errors.email}
            />

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="password"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Forgot password?
                </Link>
              </div>

              <AuthInput
                id="password"
                label=""
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                error={errors.password}
                showPasswordToggle
                passwordVisible={showPassword}
                onPasswordVisibilityChange={() =>
                  setShowPassword((value) => !value)
                }
              />
            </div>

            <AnimatePresence>
              {formError ? (
                <motion.p
                  initial={
                    shouldReduceMotion
                      ? false
                      : { opacity: 0, y: -4 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="rounded-lg bg-rose-50 p-3 text-xs leading-relaxed text-rose-700"
                >
                  {formError}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <motion.button
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : { scale: 0.99 }
              }
              type="submit"
              disabled={
                isLoading || !email || !password
              }
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-800"
            >
              {isLoading ? (
                <>
                  <motion.span
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : { rotate: 360 }
                    }
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <LoaderCircle className="size-4" />
                  </motion.span>
                  Logging in...
                </>
              ) : (
                <>
                  Log in
                  <ArrowRight className="size-4" />
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-slate-900 hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthShell>
  );
}
