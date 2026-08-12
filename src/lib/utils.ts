// =============================================================================
// Cursis Platform — Utility Functions
// =============================================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a human-readable form.
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return "No date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date to relative time (e.g., "2 days ago", "in 3 days").
 */
export function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0) return `in ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

/**
 * Check if a due date is overdue.
 */
export function isOverdue(dateString: string | null): boolean {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
}

/**
 * Get initials from a name (e.g., "Sarah Chen" -> "SC").
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Returns a capacity color class based on utilization ratio.
 */
export function getCapacityColor(ratio: number): {
  bar: string;
  text: string;
  bg: string;
  glow: string;
} {
  if (ratio >= 1.0) {
    return {
      bar: "bg-red-500",
      text: "text-red-400",
      bg: "bg-red-500/10",
      glow: "shadow-red-500/20",
    };
  }
  if (ratio >= 0.85) {
    return {
      bar: "bg-amber-500",
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      glow: "shadow-amber-500/20",
    };
  }
  if (ratio >= 0.6) {
    return {
      bar: "bg-blue-500",
      text: "text-blue-400",
      bg: "bg-blue-500/10",
      glow: "shadow-blue-500/20",
    };
  }
  return {
    bar: "bg-emerald-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    glow: "shadow-emerald-500/20",
  };
}
