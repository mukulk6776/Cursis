/** Personal distress must never be converted into a workspace mutation. */
export function distressResponse(message: string): string | null {
  const text = message.toLowerCase().replace(/[’]/g, "'");
  const personal = /\b(i|i'm|im|myself|my life)\b/.test(text);
  const danger = /\b(suicid\w*|kill myself|hurt myself|harm myself|end my life|end it all|don't want to live|do not want to live|want to die)\b/.test(text);
  if (!personal || !danger) return null;
  return "I'm sorry you're hurting this much. Are you in immediate danger, or have you already hurt yourself?\n\nIf you might act now or have already hurt yourself, call local emergency services or go to the nearest emergency department. Move away from anything you could use to hurt yourself, and contact someone you trust who can stay with you. You don't have to face this alone.";
}
