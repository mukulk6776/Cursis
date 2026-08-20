"use client";

import type { ChangeEventHandler } from "react";
import { Eye, EyeOff } from "lucide-react";

type AuthInputProps = {
  id: string;
  label?: string;
  type?: "text" | "email" | "password";
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  autoComplete?: string;
  error?: string;
  showPasswordToggle?: boolean;
  passwordVisible?: boolean;
  onPasswordVisibilityChange?: () => void;
};

export function AuthInput({ id, label, type = "text", value, onChange, autoComplete, error, showPasswordToggle, passwordVisible, onPasswordVisibilityChange }: AuthInputProps) {
  const inputType = showPasswordToggle && passwordVisible ? "text" : type;

  return (
    <div>
      {label ? <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label> : null}
      <div className="relative">
        <input id={id} name={id} type={inputType} value={value} onChange={onChange} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-500 ${error ? "border-rose-400" : "border-slate-200"} ${showPasswordToggle ? "pr-11" : ""}`} />
        {showPasswordToggle ? <button type="button" onClick={onPasswordVisibilityChange} className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-400 hover:text-slate-700" aria-label={passwordVisible ? "Hide password" : "Show password"}>{passwordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button> : null}
      </div>
      {error ? <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
