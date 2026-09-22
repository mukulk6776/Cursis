/**
 * Ordis Entity Parser — Extract structured data from natural language
 * Extracts: dates, emails, names, priorities, project names, durations, URLs
 */

export interface ParsedEntities {
  emails: string[];
  names: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  dates: string[];
  durations: number[];  // in minutes
  urls: string[];
  meetLinks: string[];
  budget: number | null;
  projectName: string | null;
  taskTitle: string | null;
  rawText: string;
}

/**
 * Parse a natural language input to extract structured entities
 */
export function parseEntities(text: string): ParsedEntities {
  const result: ParsedEntities = {
    emails: [],
    names: [],
    priority: null,
    dates: [],
    durations: [],
    urls: [],
    meetLinks: [],
    budget: null,
    projectName: null,
    taskTitle: null,
    rawText: text,
  };

  const lower = text.toLowerCase().trim();

  // ── Email extraction ──
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  result.emails = (text.match(emailPattern) || []).map((e) => e.toLowerCase());

  // ── Google Meet link extraction ──
  const meetPattern = /https?:\/\/meet\.google\.com\/[a-zA-Z0-9_-]+/gi;
  result.meetLinks = text.match(meetPattern) || [];

  // ── General URL extraction ──
  const urlPattern = /https?:\/\/[^\s,'"<>]+/gi;
  const allUrls = text.match(urlPattern) || [];
  result.urls = allUrls.filter((u) => !result.meetLinks.includes(u));

  // ── Priority extraction ──
  if (lower.includes('urgent') || lower.includes('asap') || lower.includes('critical')) {
    result.priority = 'urgent';
  } else if (lower.includes('high priority') || lower.includes('high prio') || lower.includes('important')) {
    result.priority = 'high';
  } else if (lower.includes('medium priority') || lower.includes('medium prio') || lower.includes('normal')) {
    result.priority = 'medium';
  } else if (lower.includes('low priority') || lower.includes('low prio') || lower.includes('not urgent')) {
    result.priority = 'low';
  }

  // ── Date extraction ──
  const datePatterns = [
    /\b(\d{4}-\d{2}-\d{2})\b/g,  // ISO dates
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g,  // US dates
    /\b(today|tomorrow|yesterday|tonight)\b/gi,
    /\b(next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month))\b/gi,
    /\b(this\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|weekend))\b/gi,
    /\b(in\s+\d+\s+(?:days?|hours?|weeks?|months?))\b/gi,
    /\b(\d+\s+(?:days?|hours?|weeks?|months?)\s+from\s+now)\b/gi,
  ];
  for (const pat of datePatterns) {
    const matches = text.match(pat);
    if (matches) result.dates.push(...matches);
  }

  // ── Duration extraction ──
  const durMatch = text.match(/(\d+)\s*(?:min(?:utes?)?|mins?|hr|hrs|hours?)/gi);
  if (durMatch) {
    for (const d of durMatch) {
      const num = parseInt(d, 10);
      if (d.toLowerCase().includes('hr') || d.toLowerCase().includes('hour')) {
        result.durations.push(num * 60);
      } else {
        result.durations.push(num);
      }
    }
  }

  // ── Budget extraction ──
  const budgetMatch = text.match(/(?:budget|cost|allocated|worth|value)\s*(?:of|is|:)?\s*\$?([0-9,]+)/i);
  if (budgetMatch && budgetMatch[1]) {
    result.budget = parseInt(budgetMatch[1].replace(/,/g, ''), 10) || null;
  }
  // Also match standalone $ amounts
  if (!result.budget) {
    const dollarMatch = text.match(/\$([0-9,]+(?:\.\d{2})?)/);
    if (dollarMatch && dollarMatch[1]) {
      result.budget = parseInt(dollarMatch[1].replace(/,/g, ''), 10) || null;
    }
  }

  // ── Name extraction (Capitalized words that aren't common words) ──
  const COMMON_WORDS = new Set([
    'the', 'and', 'for', 'with', 'from', 'into', 'about', 'create',
    'task', 'project', 'meeting', 'schedule', 'add', 'member', 'team',
    'invite', 'assign', 'please', 'can', 'you', 'make', 'new', 'set',
    'update', 'delete', 'remove', 'change', 'view', 'show', 'get',
    'today', 'tomorrow', 'next', 'this', 'urgent', 'high', 'medium', 'low',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'called', 'named', 'titled', 'due', 'by', 'deadline', 'priority',
    'engineering', 'design', 'marketing', 'operations', 'sales', 'creative',
    'not', 'just', 'chat', 'real', 'actions', 'sprint', 'deliverable',
  ]);

  // Match capitalized name-like patterns (e.g., "Sarah Chen", "Alex R.")
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z.]+)?)\b/g;
  let nameMatch;
  while ((nameMatch = namePattern.exec(text)) !== null) {
    const candidate = nameMatch[1];
    const words = candidate.toLowerCase().split(/\s+/);
    if (!words.every((w) => COMMON_WORDS.has(w.replace(/\.$/, '')))) {
      result.names.push(candidate);
    }
  }

  // ── Project name extraction ──
  const projMatch = text.match(/(?:project|initiative|campaign)\s+(?:named?\s+|called\s+|:)?\s*["']?([^"',.]+?)["']?(?:\s+(?:with|due|budget|deadline)|$)/i);
  if (projMatch && projMatch[1]) {
    const cleaned = projMatch[1].trim();
    if (cleaned.length > 2 && cleaned.length < 80 && !cleaned.toLowerCase().includes('create') && !cleaned.toLowerCase().includes('make')) {
      result.projectName = cleaned;
    }
  }

  // ── Task title extraction ──
  const taskMatch = text.match(/(?:create\s+task|add\s+task|new\s+task|task:)\s*(?:named?\s+|called\s+|:)?\s*["']?([^"']+?)["']?\s*(?:for|to|assigned|due|with|priority|$)/i);
  if (taskMatch && taskMatch[1]) {
    const cleaned = taskMatch[1].trim();
    if (cleaned.length > 2 && cleaned.length < 120) {
      result.taskTitle = cleaned;
    }
  }

  return result;
}

/**
 * Normalize natural language dates to ISO format
 */
export function normalizeDateExpression(expr: string): string {
  const lower = expr.toLowerCase().trim();
  const now = new Date();

  if (lower === 'today') {
    return now.toISOString().split('T')[0];
  }
  if (lower === 'tomorrow') {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  if (lower === 'yesterday') {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  // "in X days/weeks/months"
  const relMatch = lower.match(/in\s+(\d+)\s+(days?|weeks?|months?)/);
  if (relMatch) {
    const num = parseInt(relMatch[1], 10);
    const d = new Date(now);
    if (relMatch[2].startsWith('day')) d.setDate(d.getDate() + num);
    else if (relMatch[2].startsWith('week')) d.setDate(d.getDate() + num * 7);
    else if (relMatch[2].startsWith('month')) d.setMonth(d.getMonth() + num);
    return d.toISOString().split('T')[0];
  }

  // "next Monday/Tuesday/..." 
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const nextDayMatch = lower.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (nextDayMatch) {
    const targetDay = dayNames.indexOf(nextDayMatch[1]);
    const currentDay = now.getDay();
    let daysAhead = targetDay - currentDay;
    if (daysAhead <= 0) daysAhead += 7;
    const d = new Date(now);
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  }

  // "next week"
  if (lower.includes('next week')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }

  // ISO date pass-through
  if (/^\d{4}-\d{2}-\d{2}$/.test(expr)) return expr;

  // Fallback: return the original expression
  return expr;
}

/**
 * Validate an email address format
 */
export function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

/**
 * Extract a human-readable name from an email address
 */
export function nameFromEmail(email: string): string {
  return email
    .split('@')[0]
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
