/** Personal distress must never be converted into a workspace mutation. */
export function distressResponse(message: string): string | null {
  const text = message.toLowerCase().replace(/[’]/g, "'");
  const personal = /\b(i|i'm|im|myself|my life)\b/.test(text);
  const danger = /\b(suicid\w*|kill myself|hurt myself|harm myself|end my life|end it all|don't want to live|do not want to live|want to die)\b/.test(text);
  if (!personal || !danger) return null;
  return "I'm sorry you're hurting this much. I'm here with you. Are you in immediate danger, or have you already done anything to hurt yourself? If you might act now or have already hurt yourself, please contact local emergency services or go to the nearest emergency department. If you can, move away from anything you could use to hurt yourself and reach out to someone you trust who can stay with you. What country are you in so I can help you find local crisis support?";
}
