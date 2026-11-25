export type ClassDictionary = Record<string, boolean | undefined | null>;
export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | ClassDictionary
  | ClassValue[];

function appendClass(value: ClassValue, classes: string[]): void {
  if (!value && value !== 0) return;

  if (typeof value === 'string' || typeof value === 'number') {
    const trimmed = String(value).trim();
    if (trimmed) classes.push(trimmed);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendClass(item, classes);
    }
    return;
  }

  if (typeof value === 'object') {
    for (const [key, enabled] of Object.entries(value)) {
      if (enabled) classes.push(key);
    }
  }
}

/**
 * Merges conditional class names into a single space-delimited string.
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  for (const input of inputs) {
    appendClass(input, classes);
  }
  return classes.join(' ');
}
