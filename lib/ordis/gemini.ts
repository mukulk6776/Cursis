import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import { OrdisContextState, OrdisExecutionResult, executeOrdisCommand } from './engine';
import {
  Task,
  Project,
  Meeting,
  DocumentItem,
  AutomationRule,
  CrmDeal,
  Invitation,
  Employee,
  DynamicFeature,
  ChatActionCard,
  DashboardPageType,
} from '@/lib/dashboard/types';

// Supported Gemini Models for Cursis Ordis Chatbot
export const ORDIS_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended - Fastest & Agentic)', default: true },
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Hybrid Reasoning & Multimodal)', default: false },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Deep Architectural Reasoning)', default: false },
];

/**
 * 12 Function Declarations representing all operational Cursis workspace domains.
 */
export const ordisToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'create_task',
    description: 'Create a new task or deliverable in the workspace.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Task title or deliverable summary' },
        priority: {
          type: Type.STRING,
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Priority level of the task',
        },
        assigneeName: { type: Type.STRING, description: 'Name or role of the team member to assign this to' },
        dueDate: { type: Type.STRING, description: 'Due date or target day (e.g., "Tomorrow", "Next Friday", "2026-09-15")' },
        projectName: { type: Type.STRING, description: 'Target project name if specified' },
        tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Labels/tags (e.g. ["Bug", "Frontend", "Video"])',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task_status',
    description: 'Update the status or progress of an existing task (e.g., mark as completed, in-progress, or review).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskQuery: { type: Type.STRING, description: 'Task title snippet or ID to identify the task' },
        newStatus: {
          type: Type.STRING,
          enum: ['todo', 'in-progress', 'review', 'completed'],
          description: 'The updated state of the task',
        },
      },
      required: ['taskQuery', 'newStatus'],
    },
  },
  {
    name: 'create_project',
    description: 'Initialize a new project or major initiative in the workspace.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Name of the project' },
        description: { type: Type.STRING, description: 'Brief description of the project objective' },
        budget: { type: Type.NUMBER, description: 'Allocated budget in currency units' },
        deadline: { type: Type.STRING, description: 'Target delivery date' },
      },
      required: ['name'],
    },
  },
  {
    name: 'schedule_meeting',
    description: 'Schedule a calendar meeting, sprint review, or client sync.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Meeting title or purpose' },
        date: { type: Type.STRING, description: 'Date or day (e.g. "Tomorrow", "Monday", "2026-09-10")' },
        time: { type: Type.STRING, description: 'Time of the meeting (e.g. "14:00", "3:30 PM")' },
        attendees: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of attendee names or emails',
        },
        platform: { type: Type.STRING, description: 'Meeting platform: "Google Meet", "Zoom", or "Cursis Studio"' },
      },
      required: ['title'],
    },
  },
  {
    name: 'create_crm_deal',
    description: 'Create a new client or enterprise sales deal in the CRM pipeline.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Deal title (e.g. "Acme Enterprise License")' },
        company: { type: Type.STRING, description: 'Client or company organization name' },
        value: { type: Type.NUMBER, description: 'Monetary value of the deal' },
        stage: {
          type: Type.STRING,
          enum: ['lead', 'contacted', 'proposal', 'negotiation', 'won', 'lost'],
          description: 'Current sales pipeline stage',
        },
        contactName: { type: Type.STRING, description: 'Primary client contact name' },
      },
      required: ['title', 'company', 'value'],
    },
  },
  {
    name: 'create_document',
    description: 'Create a workspace document, PRD, sprint retrospective, or technical guide.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Document title' },
        category: { type: Type.STRING, description: 'Category (e.g. "Engineering", "Product", "Operations")' },
        content: { type: Type.STRING, description: 'Initial markdown body or summary' },
      },
      required: ['title'],
    },
  },
  {
    name: 'create_automation',
    description: 'Create an autonomous trigger-action rule in Cursis.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Automation rule title' },
        trigger: { type: Type.STRING, description: 'Trigger condition (e.g. "task.urgent", "deal.won", "sprint.due")' },
        action: { type: Type.STRING, description: 'Automated action to take' },
      },
      required: ['name', 'trigger', 'action'],
    },
  },
  {
    name: 'invite_team_member',
    description: 'Invite a new team member or contractor to the workspace.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Full name of the team member' },
        email: { type: Type.STRING, description: 'Email address' },
        role: { type: Type.STRING, description: 'Job role (e.g. "Lead Engineer", "Senior Video Editor")' },
        department: { type: Type.STRING, description: 'Department: "Engineering", "Creative", "Operations", "Sales"' },
      },
      required: ['name', 'email', 'role'],
    },
  },
  {
    name: 'navigate_to_page',
    description: 'Navigate the user interface to a specific Cursis dashboard page.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        page: {
          type: Type.STRING,
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
            'messages',
            'integrations',
            'settings',
          ],
          description: 'The target dashboard route/page',
        },
      },
      required: ['page'],
    },
  },
  {
    name: 'update_settings',
    description: 'Update workspace visual theme, accent colors, or Ordis persona.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        accentColor: { type: Type.STRING, description: 'Hex accent color (e.g. "#0f4cff", "#6366f1", "#10b981")' },
        tone: {
          type: Type.STRING,
          enum: ['concise', 'executive', 'detailed', 'friendly'],
          description: 'Ordis conversational tone preference',
        },
      },
    },
  },
  {
    name: 'create_dynamic_feature',
    description: 'Build and deploy a custom dynamic micro-feature/module inside Cursis on the fly.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Name of the micro-feature (e.g. "Client CSAT Survey", "Bounty Coins")' },
        description: { type: Type.STRING, description: 'What the feature does and how the team interacts with it' },
        category: { type: Type.STRING, description: 'Category e.g. "Quality & Feedback", "Finance & Expenses"' },
      },
      required: ['name', 'description'],
    },
  },
  {
    name: 'query_workspace_telemetry',
    description: 'Inspect workspace metrics such as active tasks, team workload, deadlines, deals, or velocity.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        queryType: {
          type: Type.STRING,
          enum: ['workload', 'sprint', 'deadlines', 'crm_pipeline', 'team_velocity'],
          description: 'The telemetry aspect to inspect',
        },
      },
      required: ['queryType'],
    },
  },
];

/**
 * Builds the comprehensive system instruction for Ordis.
 */
export function buildOrdisSystemPrompt(state: OrdisContextState, tone: string = 'friendly'): string {
  const userName = state.user?.name || 'Commander';
  const workspaceName = state.workspace?.name || 'Cursis Production';
  const taskCount = state.tasks?.length || 0;
  const projectCount = state.projects?.length || 0;
  const memberNames = state.employees?.map((e) => `${e.name} (${e.role})`).join(', ') || 'Sarah Chen, Alex Morgan';
  const openTasks = state.tasks?.slice(0, 8).map((t) => `"${t.name}" [${t.priority}]`).join(', ') || 'None';

  return `You are ORDIS, the ultra-capable, witty, and autonomous AI Workspace Copilot embedded inside Cursis (the next-gen operating system for creators, agencies, and high-velocity engineering teams).

Your Identity & Personality:
- You are not just a boring assistant; you are a smart, engaging, high-EQ chatbot partner.
- You converse naturally, warmly, and intelligently. You understand casual conversation, jokes, sarcasm, and multi-turn context.
- You are fully bilingual/multilingual: if the user talks in Hindi or Hinglish (e.g., "bhai kal meeting rakh de", "kya chal raha hai?"), respond fluently in natural, cool Hinglish or English as appropriate!
- Tone style: ${tone} (be helpful, crisp, proactive, and charismatic).

Your Workspace Superpower (Tool Calling):
- You have direct, autonomous API access to ALL Cursis workspace features via the provided tools!
- Whenever the user asks to create, update, schedule, navigate, build, or rebalance anything, DO NOT just say "you can go do that". EXECUTE IT via the tool call immediately!
- You can execute multiple tools if the user makes a multi-part request (e.g., create a task AND schedule a meeting).
- When you invoke a tool, also provide a pleasant, clear conversational response explaining what you did.

Current Workspace Snapshot:
- Active User: ${userName}
- Workspace: ${workspaceName} (${state.plan === 'paid' ? 'Enterprise Pro' : 'Starter Basic'})
- Team Members: ${memberNames}
- Projects (${projectCount}): ${state.projects?.map((p) => p.name).join(', ') || 'Core Platform'}
- Total Tasks: ${taskCount}
- Recent Tasks: ${openTasks}

Guidelines:
1. Always format responses using clean Markdown (bolding, bullet points, code blocks).
2. Keep responses concise and scannable. Avoid giant walls of text unless the user asked for a deep breakdown.
3. Proactively suggest relevant follow-up actions when helpful.`;
}

/**
 * Executes tool calls returned by Gemini and creates corresponding Cursis state mutations & Action Cards.
 */
export function processGeminiToolCalls(
  toolCalls: any[],
  state: OrdisContextState
): { mutations: OrdisExecutionResult['stateMutations']; actionCards: ChatActionCard[]; toastMessage?: string; navigateToPage?: DashboardPageType } {
  const mutations: OrdisExecutionResult['stateMutations'] = {};
  const actionCards: ChatActionCard[] = [];
  let toastMessage = '';
  let navigateToPage: DashboardPageType | undefined;

  for (const call of toolCalls) {
    const fnName = call.name;
    const args = call.args || {};

    if (fnName === 'create_task') {
      const assignedEmployee = state.employees.find(
        (e) => e.name.toLowerCase().includes((args.assigneeName || '').toLowerCase())
      ) || state.employees[0] || { id: 'emp_sarah', name: args.assigneeName || 'Team Member' };

      const matchedProj = state.projects.find(
        (p) => p.name.toLowerCase().includes((args.projectName || '').toLowerCase())
      ) || state.projects[0] || { id: 'p_core' };

      const newTask: Task = {
        id: 't_ai_' + Date.now(),
        name: args.title || 'Untitled AI Task',
        project: matchedProj.id,
        assignee: assignedEmployee.id,
        assignees: [assignedEmployee.id],
        priority: args.priority || 'high',
        status: 'todo',
        deadline: args.dueDate || 'Tomorrow, 5:00 PM',
        subtasks: [
          { id: 'st_1', name: 'Initial draft & scoping', done: false },
          { id: 'st_2', name: 'Review & signoff', done: false },
        ],
        tags: args.tags || ['AI-Dispatched'],
      };

      mutations.createdTask = newTask;
      toastMessage = `Task "${newTask.name}" created for ${assignedEmployee.name} ✓`;
      actionCards.push({
        type: 'task',
        title: newTask.name,
        subtitle: `Assigned to ${assignedEmployee.name} • Priority: ${newTask.priority.toUpperCase()}`,
        badge: newTask.priority.toUpperCase(),
        badgeColor: newTask.priority === 'urgent' ? '#ef4444' : '#0f4cff',
        meta: { taskId: newTask.id, deadline: newTask.deadline },
        primaryAction: { label: 'Open in Kanban', actionType: 'navigate', target: 'tasks' },
      });
    } else if (fnName === 'update_task_status') {
      const q = (args.taskQuery || '').toLowerCase();
      const updated = state.tasks.map((t) => {
        if (t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)) {
          return { ...t, status: args.newStatus };
        }
        return t;
      });
      mutations.updatedTasks = updated;
      toastMessage = `Task marked as ${args.newStatus} ✓`;
      actionCards.push({
        type: 'task',
        title: `Task Status: ${args.newStatus.toUpperCase()}`,
        subtitle: `Updated task matching "${args.taskQuery}"`,
        badge: 'UPDATED',
        primaryAction: { label: 'View Tasks', actionType: 'navigate', target: 'tasks' },
      });
    } else if (fnName === 'schedule_meeting') {
      const newMeeting: Meeting = {
        id: 'm_ai_' + Date.now(),
        name: args.title || 'AI Scheduled Sync',
        title: args.title || 'AI Scheduled Sync',
        project: state.projects[0]?.id || null,
        date: args.date || 'Tomorrow',
        time: args.time || '15:00',
        duration: 45,
        platform: 'google_meet',
        meetingUrl: 'https://meet.google.com/cursis-ai-sync',
        participants: state.employees.slice(0, 2).map((e) => e.id),
        attendees: args.attendees || [state.user.name, 'Sarah Chen'],
        status: 'upcoming',
        agenda: 'Context & Alignment, Blocker Resolution, Next Steps',
      };

      mutations.createdMeeting = newMeeting;
      toastMessage = `Meeting "${newMeeting.name}" scheduled for ${newMeeting.date} ${newMeeting.time} ✓`;
      actionCards.push({
        type: 'meeting',
        title: newMeeting.name,
        subtitle: `${newMeeting.date} at ${newMeeting.time} via Google Meet`,
        badge: 'CALENDAR',
        badgeColor: '#10b981',
        primaryAction: { label: 'Open Calendar', actionType: 'navigate', target: 'calendar' },
        secondaryAction: { label: 'Join Meet', actionType: 'link', target: newMeeting.meetingUrl },
      });
    } else if (fnName === 'create_project') {
      const newProj: Project = {
        id: 'proj_ai_' + Date.now(),
        name: args.name,
        desc: `${args.description || 'Autonomous initiative created via Ordis AI.'} [Budget: $${(args.budget || 25000).toLocaleString()}]`,
        progress: 0,
        status: 'In Progress',
        deadline: args.deadline || 'In 30 days',
        icon: '🚀',
        color: '#0f4cff',
        team: state.employees.slice(0, 3).map((e) => e.id),
        tasks: 0,
        completed: 0,
      };
      mutations.createdProject = newProj;
      toastMessage = `Project "${newProj.name}" created ✓`;
      actionCards.push({
        type: 'project',
        title: newProj.name,
        subtitle: `${newProj.desc} • Deadline: ${newProj.deadline}`,
        badge: 'NEW PROJECT',
        primaryAction: { label: 'View Projects', actionType: 'navigate', target: 'projects' },
      });
    } else if (fnName === 'create_crm_deal') {
      const newDeal: CrmDeal = {
        id: 'deal_ai_' + Date.now(),
        title: args.title,
        client: args.company || 'Enterprise Client',
        value: typeof args.value === 'number' ? `$${args.value.toLocaleString()}` : String(args.value || '$50,000'),
        stage: args.stage || 'proposal',
        owner: state.employees[0]?.name || state.user.name,
        probability: 60,
        lastActivity: 'Just now',
        notes: `Created by Ordis AI Copilot for ${args.contactName || 'Lead Client'}`,
        contactEmail: 'client@' + (args.company || 'acme').toLowerCase().replace(/\s+/g, '') + '.com',
      };
      mutations.createdDeal = newDeal;
      toastMessage = `Deal "${newDeal.title}" added to CRM (${newDeal.value}) ✓`;
      actionCards.push({
        type: 'deal',
        title: newDeal.title,
        subtitle: `${newDeal.client} • ${newDeal.value} (${newDeal.stage.toUpperCase()})`,
        badge: 'CRM DEAL',
        badgeColor: '#10b981',
        primaryAction: { label: 'View CRM', actionType: 'navigate', target: 'workspace' },
      });
    } else if (fnName === 'create_document') {
      const docType: DocumentItem['type'] =
        args.category && ['contract', 'proposal', 'design', 'hr', 'technical', 'knowledge'].includes(args.category.toLowerCase())
          ? (args.category.toLowerCase() as any)
          : 'generated';

      const newDoc: DocumentItem = {
        id: 'doc_ai_' + Date.now(),
        name: args.title,
        type: docType,
        size: '2.4 KB',
        updated: 'Just now',
        author: state.user.name,
        project: state.projects[0]?.name || 'General',
        tags: ['AI-Draft', docType],
        version: 1,
        versions: [{ v: 1, date: 'Just now', author: state.user.name }],
        aiSummary: args.content || `Drafted by Ordis AI Copilot for ${args.title}`,
        keyClauses: ['Standard Cursis Operational Terms', 'AI Generated Review Pending'],
        sharedWith: ['All Workspace Members'],
        esignStatus: 'pending',
      };
      mutations.createdDocument = newDoc;
      toastMessage = `Document "${newDoc.name}" drafted ✓`;
      actionCards.push({
        type: 'doc',
        title: newDoc.name,
        subtitle: `${newDoc.type.toUpperCase()} • Created by Ordis`,
        badge: 'DOCUMENT',
        primaryAction: { label: 'View Documents', actionType: 'navigate', target: 'documents' },
      });
    } else if (fnName === 'create_automation') {
      const newAuto: AutomationRule = {
        id: 'auto_ai_' + Date.now(),
        name: args.name,
        active: true,
        when: args.trigger || 'Task status changed to completed',
        condition: null,
        then: args.action || 'Notify team channel and log activity',
        icon: '⚡',
        color: '#0f4cff',
        executionCount: 0,
        lastRun: 'Never',
      };
      mutations.createdAutomation = newAuto;
      toastMessage = `Automation "${newAuto.name}" activated ✓`;
      actionCards.push({
        type: 'automation',
        title: newAuto.name,
        subtitle: `When ${newAuto.when} → Then ${newAuto.then}`,
        badge: 'ACTIVE RULE',
        badgeColor: '#0f4cff',
        primaryAction: { label: 'View Automations', actionType: 'navigate', target: 'automations' },
      });
    } else if (fnName === 'invite_team_member') {
      const newInv: Invitation = {
        id: 'inv_ai_' + Date.now(),
        name: args.name,
        email: args.email,
        workspaceRole: 'Member',
        roleTitle: args.role,
        department: args.department || 'Operations',
        team: null,
        status: 'pending',
        token: 'tok_' + Math.random().toString(36).substring(2, 9),
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        invitedBy: state.user.name,
      };
      mutations.createdInvitation = newInv;
      toastMessage = `Invitation sent to ${newInv.email} (${newInv.roleTitle}) ✓`;
      actionCards.push({
        type: 'team',
        title: `Invite Sent: ${newInv.name}`,
        subtitle: `${newInv.email} as ${newInv.roleTitle}`,
        badge: 'INVITED',
        primaryAction: { label: 'View Team', actionType: 'navigate', target: 'team' },
      });
    } else if (fnName === 'navigate_to_page') {
      navigateToPage = args.page as DashboardPageType;
      actionCards.push({
        type: 'navigation',
        title: `Navigating to ${args.page.toUpperCase()}`,
        subtitle: `Redirecting your viewport to /dashboard/${args.page}`,
        badge: 'ROUTING',
        primaryAction: { label: 'Open Now', actionType: 'navigate', target: args.page },
      });
    } else if (fnName === 'update_settings') {
      if (args.accentColor) {
        mutations.updatedWorkspaceSettings = { ...state.workspaceSettings, accentColor: args.accentColor };
      }
      if (args.tone) {
        mutations.updatedOrdisSettings = { ...state.ordisSettings, tone: args.tone };
      }
      toastMessage = `Workspace settings updated ✓`;
    } else if (fnName === 'create_dynamic_feature') {
      const newFeat: DynamicFeature = {
        id: 'feat_ai_' + Date.now(),
        name: args.name,
        category: args.category || 'Quality & Operations',
        description: args.description,
        icon: '⚡',
        fields: [
          { name: 'score', type: 'number', placeholder: 'Rating 1-10' },
          { name: 'comments', type: 'text', placeholder: 'Feedback or details' },
        ],
        actions: [{ label: 'Submit Record', actionKey: 'submit_record', style: 'primary' }],
        status: 'active',
        createdAt: 'Just now',
        builtBy: 'ordis_pro',
      };
      mutations.createdDynamicFeature = newFeat;
      toastMessage = `New Feature "${newFeat.name}" deployed! ✓`;
      actionCards.push({
        type: 'feature',
        title: newFeat.name,
        subtitle: newFeat.description,
        badge: 'LIVE FEATURE',
        badgeColor: '#38bdf8',
        primaryAction: { label: 'Open Feature', actionType: 'execute_feature', target: newFeat.id },
      });
    }
  }

  return { mutations, actionCards, toastMessage, navigateToPage };
}

/**
 * Executes a conversational chat query through Google Gemini API.
 * Gracefully falls back to executeOrdisCommand if API key is not present or an error occurs.
 */
export async function executeGeminiOrdisChat(
  message: string,
  history: Array<{ role: 'user' | 'ai'; text: string | null }>,
  state: OrdisContextState,
  options?: { apiKey?: string; model?: string }
): Promise<OrdisExecutionResult> {
  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  // Fallback to local rule engine if no API key is available
  if (!apiKey || apiKey === 'PLACEHOLDER' || apiKey.trim() === '') {
    return executeOrdisCommand(message, state);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = options?.model || 'gemini-2.5-flash';
    const systemInstruction = buildOrdisSystemPrompt(state, state.ordisSettings?.tone || 'friendly');

    // Build conversation contents
    const contents: any[] = [];
    const recentHistory = history.slice(-6); // Last 6 turns for context
    for (const h of recentHistory) {
      if (!h.text) continue;
      contents.push({
        role: h.role === 'ai' ? 'model' : 'user',
        parts: [{ text: h.text }],
      });
    }
    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: [{ functionDeclarations: ordisToolDeclarations }],
      },
    });

    const functionCalls = response.functionCalls || [];
    let responseText = response.text || '';

    // If Gemini called tools, execute them and format response
    if (functionCalls.length > 0) {
      const { mutations, actionCards, toastMessage, navigateToPage } = processGeminiToolCalls(functionCalls, state);

      if (!responseText.trim()) {
        const actionNames = functionCalls.map((c: any) => c.name.replace(/_/g, ' ')).join(', ');
        responseText = `⚡ Done! I've executed **${actionNames}** for your workspace.`;
      }

      return {
        responseText,
        toastMessage,
        actionCard: actionCards[0],
        navigateToPage,
        stateMutations: mutations,
        suggestedFollowUps: [
          'Show me active tasks',
          'What meetings do I have tomorrow?',
          'How is our sprint velocity looking?',
        ],
      };
    }

    // Regular conversational answer
    return {
      responseText,
      suggestedFollowUps: [
        'Assign a high priority task',
        'Schedule a team catch-up',
        'Inspect workload and deadlines',
      ],
    };
  } catch (error: any) {
    console.warn('Gemini API call failed, switching to local Ordis engine:', error.message || error);
    // Graceful automatic fallback
    return executeOrdisCommand(message, state);
  }
}
