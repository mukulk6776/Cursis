/**
 * Cursis Privacy & Telemetry Guard
 * Compliant with:
 * - California Invasion of Privacy Act (CIPA, Cal. Penal Code § 631)
 * - California Consumer Privacy Act (CCPA / CPRA)
 * - Global Privacy Control (GPC) & Do Not Track (DNT)
 *
 * Mandate:
 * 1. Session Replay & Telemetry are strictly DISABLED by default.
 * 2. Inputs, textareas, and interactive form fields are automatically masked
 *    with universal privacy tags (data-private, data-mask, data-recording-optout).
 * 3. Never captures keystrokes, personal passwords, or chat content without prior opt-in.
 */

export interface PrivacyPreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  timestamp?: string;
}

export function hasCurrentCookieChoice(value: unknown, now = Date.now()): value is PrivacyPreferences {
  if (!value || typeof value !== 'object') return false;
  const choice = value as PrivacyPreferences;
  const at = typeof choice.timestamp === 'string' ? Date.parse(choice.timestamp) : NaN;
  return choice.essential === true && typeof choice.functional === 'boolean' && typeof choice.analytics === 'boolean' &&
    Number.isFinite(at) && at <= now && now - at < 180 * 86400000;
}

/**
 * Checks whether session replay or analytics tracking is legally allowed for the current session.
 * Always returns false unless explicit affirmative consent is stored and DNT/GPC is false.
 */
export function isSessionReplayAllowed(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Check Global Privacy Control (GPC) and Do Not Track (DNT) signals
  const hasDnt =
    navigator.doNotTrack === '1' ||
    (window as any).doNotTrack === '1' ||
    (navigator as any).globalPrivacyControl === true;

  if (hasDnt) {
    return false;
  }

  // 2. Check stored explicit user consent
  try {
    const rawConsent = localStorage.getItem('cursis_cookie_consent');
    if (!rawConsent) {
      // Default is OFF per California CIPA & GDPR
      return false;
    }

    const consent: PrivacyPreferences = JSON.parse(rawConsent);
    return hasCurrentCookieChoice(consent) && consent.analytics === true;
  } catch {
    return false;
  }
}

/**
 * Universal input masking tags recognized by session replay & analytics tools:
 * - PostHog: data-private, ph-no-capture
 * - FullStory: fs-mask, data-mask
 * - Hotjar: data-hj-suppress
 * - LogRocket: data-private
 * - Microsoft Clarity: data-clarity-mask
 * - Datadog: dd-privacy="mask"
 */
const MASKING_ATTRIBUTES = [
  'data-private',
  'data-mask',
  'data-recording-optout',
  'data-hj-suppress',
  'data-clarity-mask',
];

/**
 * Applies privacy masking attributes to a given HTML element.
 */
export function maskElement(el: HTMLElement): void {
  if (!el || !(el instanceof HTMLElement)) return;

  for (const attr of MASKING_ATTRIBUTES) {
    if (!el.hasAttribute(attr)) {
      el.setAttribute(attr, 'true');
    }
  }

  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    el.classList.add('privacy-masked', 'fs-mask', 'ph-no-capture');
  }
}

/**
 * Scans the entire DOM and attaches privacy-masking attributes to:
 * - All <input> elements (passwords, emails, search, tokens)
 * - All <textarea> elements (notes, messages, editor bodies)
 * - All [contenteditable="true"] regions
 * - Form containers
 */
export function maskAllSensitiveInputs(root: Document | HTMLElement = document): void {
  if (typeof window === 'undefined') return;

  try {
    const selector = 'input, textarea, select, [contenteditable="true"], form, [role="textbox"]';
    const elements = root.querySelectorAll<HTMLElement>(selector);

    elements.forEach((el) => {
      maskElement(el);
    });
  } catch (err) {
    console.warn('Privacy masking warning:', err);
  }
}

/**
 * Installs a dynamic MutationObserver that continuously masks newly mounted inputs and forms.
 */
export function initDynamicPrivacyMasking(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Initial pass
  maskAllSensitiveInputs();

  // Watch for dynamic modal / dialog / SPA view changes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches('input, textarea, select, [contenteditable="true"], form')) {
              maskElement(node);
            }
            maskAllSensitiveInputs(node);
          }
        });
      }
    }
  });

  try {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } catch (err) {
    console.warn('MutationObserver privacy registration notice:', err);
  }

  return () => {
    observer.disconnect();
  };
}
