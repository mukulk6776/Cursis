/**
 * Ordis Intent Router — Classifies natural language into workspace intents
 * Replaces fragile if/else string matching with a scored keyword+pattern system
 */

export type OrdisIntent =
  | 'create_task'
  | 'update_task'
  | 'create_project'
  | 'schedule_meeting'
  | 'add_calendar_event'
  | 'add_team_member'
  | 'invite_team_member'
  | 'create_document'
  | 'create_automation'
  | 'create_crm_deal'
  | 'create_dynamic_feature'
  | 'update_settings'
  | 'navigate'
  | 'workspace_report'
  | 'team_status'
  | 'sprint_status'
  | 'greeting'
  | 'general_question'
  | 'unknown';

interface IntentPattern {
  intent: OrdisIntent;
  keywords: string[];
  patterns: RegExp[];
  score: number; // base score — higher = more specific
}

const INTENT_PATTERNS: IntentPattern[] = [
  // ── Workspace Mutations ──
  {
    intent: 'create_task',
    keywords: ['create task', 'add task', 'new task', 'make task', 'assign task', 'task:'],
    patterns: [
      /\b(?:create|add|make|new)\s+(?:a\s+)?task\b/i,
      /\btask:\s*.+/i,
      /\b(?:create|add)\s+(?:a\s+)?deliverable\b/i,
    ],
    score: 10,
  },
  {
    intent: 'update_task',
    keywords: ['mark task', 'complete task', 'update task', 'finish task', 'close task', 'task status'],
    patterns: [
      /\b(?:mark|update|set|change)\s+.*?(?:task|deliverable)\s+.*?(?:as|to)\s+/i,
      /\b(?:complete|finish|close|done)\s+(?:the\s+)?task\b/i,
    ],
    score: 10,
  },
  {
    intent: 'create_project',
    keywords: ['create project', 'make project', 'new project', 'start project', 'makeing project'],
    patterns: [
      /\b(?:create|make|start|new|initialize|init)\s+(?:a\s+)?project\b/i,
      /\bproject:\s*.+/i,
    ],
    score: 10,
  },
  {
    intent: 'schedule_meeting',
    keywords: ['schedule meeting', 'book meeting', 'set up meeting', 'plan meeting', 'shedule meeting'],
    patterns: [
      /\b(?:schedule|book|set\s+up|plan|arrange)\s+(?:a\s+)?meeting\b/i,
      /\b(?:schedule|book)\s+(?:a\s+)?(?:sync|standup|call|review|retro)\b/i,
    ],
    score: 10,
  },
  {
    intent: 'add_calendar_event',
    keywords: ['add event', 'calendar event', 'event on calendar', 'event on clander'],
    patterns: [
      /\b(?:add|create|put)\s+(?:an?\s+)?event\s+(?:on|to)\s+(?:the\s+)?calendar\b/i,
      /\bcalendar\s+event\b/i,
    ],
    score: 10,
  },
  {
    intent: 'add_team_member',
    keywords: ['add team member', 'add member', 'add a team member', 'new member'],
    patterns: [
      /\b(?:add|onboard)\s+(?:a\s+)?(?:new\s+)?(?:team\s+)?member\b/i,
    ],
    score: 10,
  },
  {
    intent: 'invite_team_member',
    keywords: ['invite member', 'invite team member', 'send invite', 'invite a team member'],
    patterns: [
      /\b(?:invite|send\s+invite\s+to)\s+(?:a\s+)?(?:new\s+)?(?:team\s+)?member\b/i,
    ],
    score: 10,
  },
  {
    intent: 'create_document',
    keywords: ['create document', 'write document', 'draft document', 'new document', 'create doc', 'write doc'],
    patterns: [
      /\b(?:create|write|draft|generate|new)\s+(?:a\s+)?(?:document|doc|prd|rfc|guide|report|spec)\b/i,
    ],
    score: 10,
  },
  {
    intent: 'create_automation',
    keywords: ['create automation', 'add automation', 'new automation', 'automate', 'create rule'],
    patterns: [
      /\b(?:create|add|set\s+up|build)\s+(?:an?\s+)?(?:automation|rule|trigger)\b/i,
      /\bautomate\s+/i,
    ],
    score: 10,
  },
  {
    intent: 'create_crm_deal',
    keywords: ['create deal', 'new deal', 'add deal', 'sales deal', 'add client'],
    patterns: [
      /\b(?:create|add|new|log)\s+(?:a\s+)?(?:deal|client|lead|opportunity)\b/i,
    ],
    score: 10,
  },
  {
    intent: 'create_dynamic_feature',
    keywords: ['build feature', 'make feature', 'create feature', 'add feature', 'deploy feature'],
    patterns: [
      /\b(?:build|create|make|deploy|add)\s+(?:a\s+)?(?:custom\s+)?(?:feature|module|widget)\b/i,
    ],
    score: 10,
  },
  {
    intent: 'update_settings',
    keywords: ['update settings', 'change theme', 'change color', 'change accent', 'dark mode', 'light mode'],
    patterns: [
      /\b(?:change|update|set)\s+(?:the\s+)?(?:theme|color|accent|mode|tone)\b/i,
    ],
    score: 8,
  },
  {
    intent: 'navigate',
    keywords: ['go to', 'open', 'show me', 'navigate to', 'take me to', 'switch to'],
    patterns: [
      /\b(?:go\s+to|open|show\s+me|navigate\s+to|take\s+me\s+to|switch\s+to)\s+(?:the\s+)?(?:tasks?|projects?|team|calendar|meetings?|analytics|workspace|automations?|documents?|integrations?|settings?|ordis|home|dashboard)\b/i,
    ],
    score: 8,
  },

  // ── Reports & Analysis ──
  {
    intent: 'workspace_report',
    keywords: ['report', 'summary', 'overview', 'briefing', 'summarize', 'workspace status', 'how are we doing'],
    patterns: [
      /\b(?:generate|give\s+me|show)\s+(?:a\s+)?(?:report|summary|overview|briefing)\b/i,
      /\bhow\s+(?:are\s+we|is\s+the\s+workspace)\s+doing\b/i,
      /\bwhat\s+is\s+happening\b/i,
      /\bbatao\b/i,
      /\bkya\s+chal\s+raha\b/i,
    ],
    score: 7,
  },
  {
    intent: 'team_status',
    keywords: ['who is online', 'team status', 'team workload', 'who is working', 'team bandwidth'],
    patterns: [
      /\bwho\s+is\s+(?:online|available|working|free)\b/i,
      /\bteam\s+(?:status|workload|bandwidth|capacity)\b/i,
    ],
    score: 7,
  },
  {
    intent: 'sprint_status',
    keywords: ['sprint status', 'sprint velocity', 'deadlines', 'progress', 'sprint health'],
    patterns: [
      /\bsprint\s+(?:status|velocity|health|progress)\b/i,
      /\b(?:upcoming\s+)?deadlines\b/i,
      /\b(?:show|what\s+are)\s+(?:the\s+)?(?:overdue|pending)\s+(?:tasks?|deliverables?)\b/i,
    ],
    score: 7,
  },

  // ── Conversational ──
  {
    intent: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'sup', 'yo', 'whats up'],
    patterns: [
      /^(?:hi|hey|hello|sup|yo|good\s+(?:morning|afternoon|evening))[\s!.,?]*$/i,
      /^(?:what'?s?\s+up|how\s+are\s+you|howdy)[\s!.,?]*$/i,
    ],
    score: 5,
  },
];

export interface ClassifiedIntent {
  intent: OrdisIntent;
  confidence: number; // 0-1
  matchedKeywords: string[];
  matchedPatterns: number;
}

/**
 * Classify a user message into the most likely workspace intent.
 * Returns the highest-scoring intent with confidence.
 */
export function classifyIntent(text: string): ClassifiedIntent {
  const lower = text.toLowerCase().trim();
  let bestIntent: ClassifiedIntent = {
    intent: 'general_question',
    confidence: 0.3,
    matchedKeywords: [],
    matchedPatterns: 0,
  };
  let bestScore = 0;

  for (const pattern of INTENT_PATTERNS) {
    let score = 0;
    const matchedKeywords: string[] = [];
    let matchedPatterns = 0;

    // Check keywords
    for (const kw of pattern.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += pattern.score;
        matchedKeywords.push(kw);
      }
    }

    // Check regex patterns (higher weight)
    for (const regex of pattern.patterns) {
      if (regex.test(text)) {
        score += pattern.score * 1.5;
        matchedPatterns++;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      const confidence = Math.min(score / (pattern.score * 3), 1);
      bestIntent = {
        intent: pattern.intent,
        confidence,
        matchedKeywords,
        matchedPatterns,
      };
    }
  }

  return bestIntent;
}

/**
 * Check if a message contains compound intents (multiple actions).
 * E.g., "Add Sarah as designer and assign her the logo task"
 */
export function detectCompoundIntents(text: string): OrdisIntent[] {
  const lower = text.toLowerCase();
  const intents: OrdisIntent[] = [];

  // Check for "and" conjunctions with multiple action verbs
  const hasAnd = lower.includes(' and ');
  if (!hasAnd) {
    const primary = classifyIntent(text);
    return primary.confidence > 0.4 ? [primary.intent] : [];
  }

  // Split on "and" and classify each segment
  const segments = text.split(/\s+and\s+/i);
  for (const seg of segments) {
    const result = classifyIntent(seg.trim());
    if (result.confidence > 0.4 && !intents.includes(result.intent)) {
      intents.push(result.intent);
    }
  }

  // Deduplicate: merge add_team_member + create_task into compound
  return intents.length > 0 ? intents : [classifyIntent(text).intent];
}

/**
 * Extract the navigation target page from a navigation intent
 */
export function extractNavigationTarget(text: string): string | null {
  const lower = text.toLowerCase();
  const pages = [
    'home', 'dashboard', 'ordis', 'tasks', 'projects', 'team',
    'calendar', 'meetings', 'analytics', 'workspace', 'automations',
    'documents', 'integrations', 'settings',
  ];

  for (const page of pages) {
    if (lower.includes(page)) {
      return page === 'dashboard' ? 'home' : page;
    }
  }

  return null;
}
