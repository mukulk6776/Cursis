export const DEMO_SESSION_KEY = "dataora-auth";

export function hasDemoSession() {
  return typeof window !== "undefined" && window.localStorage.getItem(DEMO_SESSION_KEY) === "true";
}

export function createDemoSession() {
  window.localStorage.setItem(DEMO_SESSION_KEY, "true");
}

export function clearDemoSession() {
  window.localStorage.removeItem(DEMO_SESSION_KEY);
}
