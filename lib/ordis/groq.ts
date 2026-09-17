import { Groq } from 'groq-sdk';
import { OrdisContextState, OrdisExecutionResult, executeOrdisCommand } from './engine';
import { buildOrdisSystemPrompt, processGeminiToolCalls } from './gemini';
import * as fs from 'fs';
import * as path from 'path';

// Supported Groq Models for Cursis Ordis Copilot
export const GROQ_MODELS = [
  {
    id: 'openai/gpt-oss-20b',
    name: 'OpenAI GPT-OSS 20B (Groq MoE Reasoning - Ultra Fast)',
    default: true,
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile (Flagship High Capacity)',
    default: false,
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'OpenAI GPT-OSS 120B (Deep Reasoning)',
    default: false,
  },
];

/**
 * Safely resolves the Groq API key from candidate input, environment variables, or .env.local
 */
export function resolveGroqApiKey(candidateKey?: string): string {
  if (candidateKey && candidateKey.trim() !== '' && candidateKey !== 'PLACEHOLDER') {
    return candidateKey.trim();
  }
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '' && process.env.GROQ_API_KEY !== 'PLACEHOLDER') {
    return process.env.GROQ_API_KEY.trim();
  }
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('GROQ_API_KEY=')) {
          const val = trimmed.replace('GROQ_API_KEY=', '').replace(/^["']|["']$/g, '').trim();
          if (val && val !== 'PLACEHOLDER') return val;
        }
      }
    }
  } catch {}
  return '';
}

/**
 * Workspace tools formatted for Groq / OpenAI-compatible tool calling specification
 */
export const groqToolDeclarations = [
  {
    type: 'function' as const,
    function: {
      name: 'create_task',
      description: 'Create a new task or deliverable in the workspace.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task title or deliverable summary' },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Priority level of the task',
          },
          assigneeName: { type: 'string', description: 'Name or role of the team member to assign this to' },
          dueDate: { type: 'string', description: 'Due date or target day (e.g., "Tomorrow", "Next Friday", "2026-09-15")' },
          projectName: { type: 'string', description: 'Target project name if specified' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Labels/tags (e.g. ["Bug", "Frontend", "Video"])',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_task_status',
      description: 'Update the status or progress of an existing task (e.g., mark as completed, in-progress, or review).',
      parameters: {
        type: 'object',
        properties: {
          taskQuery: { type: 'string', description: 'Task title snippet or ID to identify the task' },
          newStatus: {
            type: 'string',
            enum: ['todo', 'in-progress', 'review', 'completed'],
            description: 'The updated state of the task',
          },
        },
        required: ['taskQuery', 'newStatus'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_project',
      description: 'Initialize a new project or major initiative in the workspace.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the project' },
          description: { type: 'string', description: 'Brief description of the project objective' },
          budget: { type: 'number', description: 'Allocated budget in currency units' },
          deadline: { type: 'string', description: 'Target delivery date' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'schedule_meeting',
      description: 'Schedule a calendar meeting, sprint review, or client sync. If the user provides a Google Meet link, provide it in meetingUrl.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Meeting title or purpose' },
          date: { type: 'string', description: 'Date or day (e.g. "Tomorrow", "Monday", "2026-09-10")' },
          time: { type: 'string', description: 'Time of the meeting (e.g. "14:00", "3:30 PM")' },
          meetingUrl: {
            type: 'string',
            description: 'User-provided Google Meet link (e.g. https://meet.google.com/xxx-yyyy-zzz) or other video conference URL.',
          },
          attendees: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of attendee names or emails',
          },
          platform: { type: 'string', description: 'Meeting platform: "Google Meet", "Zoom", or "Cursis Studio"' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_calendar_event',
      description: 'Add an event, milestone, deadline, or appointment to the workspace calendar.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title or name of the calendar event' },
          date: { type: 'string', description: 'Date or day (e.g. "Tomorrow", "Monday", "2026-09-20")' },
          time: { type: 'string', description: 'Time of the event (e.g. "10:00 AM", "14:30")' },
          durationMinutes: { type: 'number', description: 'Duration in minutes (e.g. 30, 60)' },
          description: { type: 'string', description: 'Event description or agenda' },
          location: { type: 'string', description: 'Location, room, or meet link' },
          meetLink: { type: 'string', description: 'Google Meet link if provided by user' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_crm_deal',
      description: 'Create a new client or enterprise sales deal in the CRM pipeline.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Deal title (e.g. "Acme Enterprise License")' },
          company: { type: 'string', description: 'Client or company organization name' },
          value: { type: 'number', description: 'Monetary value of the deal' },
          stage: {
            type: 'string',
            enum: ['lead', 'contacted', 'proposal', 'negotiation', 'won', 'lost'],
            description: 'Current sales pipeline stage',
          },
          contactName: { type: 'string', description: 'Primary client contact name' },
        },
        required: ['title', 'company', 'value'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_document',
      description: 'Create a workspace document, PRD, sprint retrospective, or technical guide.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Document title' },
          category: { type: 'string', description: 'Category (e.g. "Engineering", "Product", "Operations")' },
          content: { type: 'string', description: 'Initial markdown body or summary' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_automation',
      description: 'Create an autonomous trigger-action rule in Cursis.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Automation rule title' },
          trigger: { type: 'string', description: 'Trigger condition (e.g. "task.urgent", "deal.won", "sprint.due")' },
          action: { type: 'string', description: 'Automated action to take' },
        },
        required: ['name', 'trigger', 'action'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_team_member',
      description: 'Add or onboard a team member to the workspace using their email address. If the email is invalid or missing, flag it as incorrect user.',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'The email address of the team member to add (e.g. alex@example.com)' },
          name: { type: 'string', description: 'Full name of the team member (optional)' },
          role: { type: 'string', description: 'Job role (e.g. "Senior Engineer", "Product Designer")' },
          department: { type: 'string', description: 'Department: "Engineering", "Creative", "Operations", "Sales", "Design"' },
        },
        required: ['email'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'invite_team_member',
      description: 'Invite a team member or contractor to the workspace using their email address.',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Email address of the invitee' },
          name: { type: 'string', description: 'Full name of the team member' },
          role: { type: 'string', description: 'Job role (e.g. "Lead Engineer", "Senior Video Editor")' },
          department: { type: 'string', description: 'Department: "Engineering", "Creative", "Operations", "Sales"' },
        },
        required: ['email'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'navigate_to_page',
      description: 'Navigate the user interface to a specific Cursis dashboard page.',
      parameters: {
        type: 'object',
        properties: {
          page: {
            type: 'string',
            enum: [
              'home',
              'ordis',
              'tasks',
              'projects',
              'team',
              'calendar',
              'meetings',
              'analytics',
              'workspace',
              'automations',
              'documents',
              'integrations',
              'settings',
            ],
            description: 'The target dashboard route/page',
          },
        },
        required: ['page'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_settings',
      description: 'Update workspace visual theme, accent colors, or Ordis persona.',
      parameters: {
        type: 'object',
        properties: {
          accentColor: { type: 'string', description: 'Hex accent color (e.g. "#0f4cff", "#6366f1", "#10b981")' },
          tone: {
            type: 'string',
            enum: ['concise', 'executive', 'detailed', 'friendly'],
            description: 'Ordis conversational tone preference',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_dynamic_feature',
      description: 'Build and deploy a custom dynamic micro-feature/module inside Cursis on the fly.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the micro-feature (e.g. "Client CSAT Survey", "Bounty Coins")' },
          description: { type: 'string', description: 'What the feature does and how the team interacts with it' },
          category: { type: 'string', description: 'Category e.g. "Quality & Feedback", "Finance & Expenses"' },
        },
        required: ['name', 'description'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_workspace_telemetry',
      description: 'Inspect workspace metrics such as active tasks, team workload, deadlines, deals, or velocity.',
      parameters: {
        type: 'object',
        properties: {
          queryType: {
            type: 'string',
            enum: ['workload', 'sprint', 'deadlines', 'crm_pipeline', 'team_velocity'],
            description: 'The telemetry aspect to inspect',
          },
        },
        required: ['queryType'],
      },
    },
  },
];

/**
 * Executes a conversational query or tool dispatch using Groq Cloud SDK.
 * Defaults to `openai/gpt-oss-20b` with reasoning effort support.
 */
export async function executeGroqOrdisChat(
  message: string,
  history: Array<{ role: 'user' | 'ai'; text: string | null }>,
  state: OrdisContextState,
  options?: { apiKey?: string; model?: string }
): Promise<OrdisExecutionResult> {
  const candidateKey = options?.apiKey?.trim();
  const serverFallbackKey = resolveGroqApiKey();
  const activeApiKey = candidateKey && candidateKey !== 'PLACEHOLDER' ? candidateKey : serverFallbackKey;

  if (!activeApiKey) {
    // Fallback to local rule engine if no API key is available
    return executeOrdisCommand(message, state);
  }

  const requestedModel = options?.model || 'openai/gpt-oss-20b';
  const groq = new Groq({ apiKey: activeApiKey });

  const systemInstruction = buildOrdisSystemPrompt(state, state.ordisSettings?.tone || 'friendly');

  // Build OpenAI-compatible messages array
  const messages: any[] = [
    { role: 'system', content: systemInstruction },
  ];

  const recentHistory = history.slice(-6);
  for (const h of recentHistory) {
    if (!h.text) continue;
    messages.push({
      role: h.role === 'ai' ? 'assistant' : 'user',
      content: h.text,
    });
  }

  messages.push({
    role: 'user',
    content: message,
  });

  const isReasoningModel = requestedModel.startsWith('openai/gpt-oss');

  try {
    const completionParams: any = {
      model: requestedModel,
      messages,
      temperature: 1,
      max_completion_tokens: 2048,
      top_p: 1,
      tools: groqToolDeclarations,
      tool_choice: 'auto',
      stream: false,
    };

    if (isReasoningModel) {
      completionParams.reasoning_effort = 'medium';
    }

    const chatCompletion = await groq.chat.completions.create(completionParams);

    const choice = (chatCompletion as any).choices?.[0];
    const assistantMessage = choice?.message;
    const toolCalls = assistantMessage?.tool_calls || [];
    let responseText = assistantMessage?.content || '';

    // Handle tool execution if Groq decided to invoke any workspace functions
    if (Array.isArray(toolCalls) && toolCalls.length > 0) {
      const formattedCalls = toolCalls.map((tc: any) => {
        let parsedArgs: any = {};
        try {
          parsedArgs = typeof tc.function?.arguments === 'string'
            ? JSON.parse(tc.function.arguments)
            : (tc.function?.arguments || {});
        } catch {
          parsedArgs = {};
        }
        return {
          name: tc.function?.name,
          args: parsedArgs,
        };
      });

      const { mutations, actionCards, toastMessage, navigateToPage } = processGeminiToolCalls(formattedCalls, state);

      if (toastMessage === 'incorrect user') {
        responseText = `**⚠️ incorrect user**\n\nThe provided email address is invalid or not a recognized user. A valid email address is required to add or invite a team member.`;
      } else if (!responseText.trim()) {
        const actionNames = formattedCalls.map((c: any) => c.name.replace(/_/g, ' ')).join(', ');
        responseText = `Done! I've executed **${actionNames}** for your workspace via Groq.`;
      }

      return {
        responseText,
        toastMessage,
        actionCard: actionCards[0],
        navigateToPage,
        stateMutations: mutations,
        suggestedFollowUps: [
          'Show me active tasks',
          'What meetings do I have scheduled?',
          'Inspect team workload and deadlines',
        ],
      };
    }

    return {
      responseText: responseText.trim() || 'I am right here and ready to help. How can I assist you with your workspace today?',
      suggestedFollowUps: [
        'Create a high priority task',
        'Schedule a team catch-up',
        'Inspect sprint workload and deals',
      ],
    };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('Groq API execution error:', errorMsg);
    throw new Error(`Groq API error: ${errorMsg}`);
  }
}

/**
 * Direct streaming helper implementation as requested by user.
 * Streams completion chunks for gpt-oss-20b.
 */
export async function streamGroqCompletion(
  userPrompt: string,
  apiKey?: string,
  onChunk?: (delta: string) => void
): Promise<string> {
  const activeKey = resolveGroqApiKey(apiKey);
  const groq = new Groq({ apiKey: activeKey });

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    model: 'openai/gpt-oss-20b',
    temperature: 1,
    max_completion_tokens: 2048,
    top_p: 1,
    stream: true,
    reasoning_effort: 'medium',
    stop: null,
  });

  let fullResponse = '';
  for await (const chunk of chatCompletion) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullResponse += delta;
      if (onChunk) {
        onChunk(delta);
      }
    }
  }

  return fullResponse;
}
