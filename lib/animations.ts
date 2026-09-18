/**
 * Shared animation variants and utilities for Cursis UI
 * Uses motion (Motion One / Framer Motion API) for declarative React animations
 * and animejs for imperative DOM/canvas animations
 */

// ─── Motion variants ──────────────────────────────────────────────────────────

export const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: 12 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -32 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -16 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: 16 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.95 },
};

export const slideDown = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

// Stagger container — apply to parent, children get staggered entry
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

// ─── Transition presets ───────────────────────────────────────────────────────

export const spring = { type: 'spring', stiffness: 380, damping: 30 };
export const springSnappy = { type: 'spring', stiffness: 500, damping: 36 };
export const ease = { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] };
export const easeOut = { duration: 0.28, ease: [0, 0, 0.2, 1] };

// ─── Anime.js helpers (imperative) ───────────────────────────────────────────
// Import like: import { animeStaggerIn } from '@/lib/animations'
// These return the anime instance so callers can chain / cancel

export async function animeStaggerIn(selector: string, options?: object) {
  if (typeof window === 'undefined') return;
  const { animate, stagger } = await import('animejs');
  return animate(selector, {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 480,
    delay: stagger(60),
    easing: 'easeOutCubic',
    ...options,
  });
}

export async function animePulse(selector: string) {
  if (typeof window === 'undefined') return;
  const { animate } = await import('animejs');
  return animate(selector, {
    scale: [1, 1.06, 1],
    duration: 420,
    easing: 'easeInOutSine',
  });
}

export async function animeCountUp(selector: string, target: number, duration = 900) {
  if (typeof window === 'undefined') return;
  const { animate, utils } = await import('animejs');
  const el = document.querySelector(selector);
  if (!el) return;
  return animate(
    { count: 0 },
    {
      count: target,
      duration,
      easing: 'easeOutCubic',
      onUpdate: (anim) => {
        // Read the current value of the tracked property
        el.textContent = String(Math.round((anim as any).targets[0].count));
      },
    }
  );
}

export async function animeSlideInFromLeft(selector: string, delay = 0) {
  if (typeof window === 'undefined') return;
  const { animate } = await import('animejs');
  return animate(selector, {
    opacity: [0, 1],
    translateX: [-28, 0],
    duration: 500,
    delay,
    easing: 'easeOutExpo',
  });
}
