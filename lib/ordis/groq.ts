import { distressResponse } from './safety';
import { Groq } from 'groq-sdk';
import { OrdisContextState, OrdisExecutionResult, executeOrdisCommand } from './engine';
import { normalizeSafeIsoDate } from '@/lib/db/tasks';
import {
  Task,
  Project,
  Department,
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
import * as fs from 'fs';
import * as path from 'path';

// Supported Groq Models for Cursis Ordis Copilot
export const GROQ_MODELS = [
  {
    id: 'openai/gpt-oss-20b',
    name: 'OpenAI GPT-OSS 20B (Groq MoE Reasoning - Recommended)',
    default: true,
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile (Ultra Fast)',
    default: false,
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'OpenAI GPT-OSS 120B (Flagship Reasoning)',
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
 * Builds the comprehensive system instruction for Ordis.
 */
export function buildOrdisSystemPrompt(state: OrdisContextState, tone: string = 'friendly'): string {
  const userName = state.user?.name || 'Commander';
  const workspaceName = state.workspace?.name || 'Cursis Production';
  const taskCount = state.tasks?.length || 0;
  const projectCount = state.projects?.length || 0;
  const memberNames = state.employees?.map((e) => `${e.name} (${e.role})`).join(', ') || 'Sarah Chen, Alex Morgan';
  const openTasks = state.tasks?.slice(0, 8).map((t) => `"${t.name}" [${t.priority}]`).join(', ') || 'None';

  return `You are ORDIS, the intelligent, articulate, and autonomous AI Workspace Copilot embedded inside Cursis.

Your Personality & Conversational Style:
- You are witty, smart, articulate, and naturally conversational.
- Talk like a real human intelligence! When greeted, asked questions, or engaged in discussion, converse naturally, brainstorm, offer insights, and provide genuine assistance.
- NEVER sound like a rigid rule-based chatbot or repeat robotic templates.

Your Autonomous Capabilities & Tools:
- You have direct, autonomous access to the Cursis workspace via tool calling!
- When the user asks to create tasks, assign work, schedule meetings, update statuses, add team members, build features, or manage projects, EXECUTE THEM immediately using the provided tools.
- You can execute multiple tools in a single turn if needed (e.g. invite a teammate and assign them a task).
- When executing tools, accompany your action with an upbeat, natural confirmation message explaining what was created or updated.

Current Workspace Snapshot:
- Active User: ${userName}
- Workspace: ${workspaceName}
- Team Members: ${memberNames}
- Projects (${projectCount}): ${state.projects?.map((p) => p.name).join(', ') || 'Core Platform'}
- Total Tasks: ${taskCount}
- Recent Tasks: ${openTasks}

Guidelines:
1. Always format responses using clean, readable Markdown (bold highlights, clean lists when appropriate).
2. Be engaging, practical, and direct.

Special Instructions for Core Workspace Operations:
- **Making Projects**: When the user requests to make, create, or start a project, call create_project with name, description, budget, and deadline.
- **Creating Tasks**: When the user requests to create or add a task, call create_task with title, priority (urgent, high, medium, low), assigneeName, dueDate, and tags.
- **Creating Documents**: When the user requests to create, write, or draft a document, call create_document with title, category, and content.
- **Creating Departments**: When the user requests to create, add, or set up a department, call create_department with name, description, lead, and budget.
- **Adding Calendar Events**: When the user requests to add an event or milestone on the calendar, call add_calendar_event with title, date, time, and details.
- **Scheduling Meetings**: When the user requests to schedule a meeting, call schedule_meeting. If the user provides a Google Meet link (e.g. https://meet.google.com/xxx-yyyy-zzz), ALWAYS extract it and pass it to meetingUrl.
- **Adding Team Members**: When the user asks to add or invite a team member, the user will provide an email. You MUST check the email. If the email format is invalid, missing, malformed, or not an email, DO NOT call the tool or if calling pass it, and explicitly return: "incorrect user".

CRITICAL SAFETY RULES:
- If a user mentions self-harm, suicide, or crisis situations, DO NOT create any documents, tasks, or take any workspace actions. Instead, respond with compassion and direct them to appropriate resources like 988 Suicide & Crisis Lifeline (US) or emergency services.
- DO NOT automatically create documents unless the user explicitly requests to "create document", "draft document", or "write document".
- Only call tools when the user makes a clear, direct request for workspace action.`;
}

/**
 * Processes tool calls invoked by the LLM and maps them to workspace state mutations.
 */
export function processOrdisToolCalls(
  toolCalls: Array<{ name: string; args: Record<string, any> }>,
  state: OrdisContextState
): { mutations: OrdisExecutionResult['stateMutations']; actionCards: ChatActionCard[]; toastMessage?: string; navigateToPage?: DashboardPageType } {
  const mutations: OrdisExecutionResult['stateMutations'] = {};
  const actionCards: ChatActionCard[] = [];
  let toastMessage = '';
  let navigateToPage: DashboardPageType | undefined;

  const sortedCalls = [...toolCalls].sort((a, b) => {
    if (a.name === 'add_team_member' || a.name === 'invite_team_member') return -1;
    if (b.name === 'add_team_member' || b.name === 'invite_team_member') return 1;
    return 0;
  });

  for (const call of sortedCalls) {
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
        deadline: normalizeSafeIsoDate(args.dueDate),
        subtasks: [
          { id: 'st_1', name: 'Initial draft & scoping', done: false },
          { id: 'st_2', name: 'Review & signoff', done: false },
        ],
        tags: args.tags || ['AI-Dispatched'],
      };

      mutations.createdTask = newTask;
      toastMessage = `Task "${newTask.name}" created for ${assignedEmployee.name}`;
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
      toastMessage = `Task marked as ${args.newStatus}`;
      actionCards.push({
        type: 'task',
        title: `Task Status: ${args.newStatus.toUpperCase()}`,
        subtitle: `Updated task matching "${args.taskQuery}"`,
        badge: 'UPDATED',
        primaryAction: { label: 'View Tasks', actionType: 'navigate', target: 'tasks' },
      });
    } else if (fnName === 'schedule_meeting') {
      const rawMeetUrl = (args.meetingUrl || args.meetLink || '').trim();
      const finalMeetUrl = rawMeetUrl || 'https://meet.google.com/cursis-ai-sync';
      const isCustomGoogleMeet = /meet\.google\.com/i.test(finalMeetUrl);

      const newMeeting: Meeting = {
        id: 'm_ai_' + Date.now(),
        name: args.title || 'AI Scheduled Sync',
        title: args.title || 'AI Scheduled Sync',
        project: state.projects[0]?.id || null,
        date: args.date || 'Tomorrow',
        time: args.time || '15:00',
        duration: 45,
        platform: 'google_meet',
        meetingUrl: finalMeetUrl,
        participants: state.employees.slice(0, 2).map((e) => e.id),
        attendees: args.attendees || [state.user.name, 'Sarah Chen'],
        status: 'upcoming',
        agenda: args.description || 'Context & Alignment, Blocker Resolution, Next Steps',
      };

      mutations.createdMeeting = newMeeting;
      toastMessage = `Meeting "${newMeeting.name}" scheduled for ${newMeeting.date} ${newMeeting.time}`;
      actionCards.push({
        type: 'meeting',
        title: newMeeting.name,
        subtitle: `${newMeeting.date} at ${newMeeting.time} via ${isCustomGoogleMeet ? 'Google Meet (' + finalMeetUrl + ')' : 'Google Meet'}`,
        badge: 'CALENDAR',
        badgeColor: '#10b981',
        primaryAction: { label: 'Open Calendar', actionType: 'navigate', target: 'calendar' },
        secondaryAction: { label: 'Join Meet', actionType: 'link', target: finalMeetUrl },
      });
    } else if (fnName === 'add_calendar_event') {
      const rawMeetUrl = (args.meetLink || args.meetingUrl || '').trim();
      const newEvent: Meeting = {
        id: 'evt_ai_' + Date.now(),
        name: args.title || 'Calendar Event',
        title: args.title || 'Calendar Event',
        project: state.projects[0]?.id || null,
        date: args.date || 'Tomorrow',
        time: args.time || '10:00 AM',
        duration: args.durationMinutes || 60,
        platform: rawMeetUrl ? 'google_meet' : 'other',
        meetingUrl: rawMeetUrl,
        participants: state.employees.slice(0, 2).map((e) => e.id),
        attendees: [state.user.name],
        status: 'upcoming',
        agenda: args.description || 'Calendar Event created via Ordis AI Copilot',
      };

      mutations.createdMeeting = newEvent;
      toastMessage = `Event "${newEvent.name}" added to Calendar for ${newEvent.date} ${newEvent.time}`;
      actionCards.push({
        type: 'meeting',
        title: newEvent.name,
        subtitle: `${newEvent.date} at ${newEvent.time}${args.location ? ' • ' + args.location : ''}`,
        badge: 'CALENDAR EVENT',
        badgeColor: '#6366f1',
        primaryAction: { label: 'Open Calendar', actionType: 'navigate', target: 'calendar' },
        ...(rawMeetUrl ? { secondaryAction: { label: 'Join Meet', actionType: 'link', target: rawMeetUrl } } : {}),
      });
    } else if (fnName === 'create_project') {
      const newProj: Project = {
        id: 'proj_ai_' + Date.now(),
        name: args.name,
        desc: `${args.description || 'Autonomous initiative created via Ordis AI.'} [Budget: $${(args.budget || 25000).toLocaleString()}]`,
        progress: 0,
        status: 'In Progress',
        deadline: args.deadline || 'In 30 days',
        icon: '',
        color: '#0f4cff',
        team: state.employees.slice(0, 3).map((e) => e.id),
        tasks: 0,
        completed: 0,
      };
      mutations.createdProject = newProj;
      toastMessage = `Project "${newProj.name}" created`;
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
      toastMessage = `Deal "${newDeal.title}" added to CRM (${newDeal.value})`;
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
      toastMessage = `Document "${newDoc.name}" drafted`;
      actionCards.push({
        type: 'doc',
        title: newDoc.name,
        subtitle: `${newDoc.type.toUpperCase()} • Created by Ordis`,
        badge: 'DOCUMENT',
        primaryAction: { label: 'View Documents', actionType: 'navigate', target: 'documents' },
      });
    } else if (fnName === 'create_department') {
      const newDept: Department = {
        id: 'dept_ai_' + Date.now(),
        name: args.name,
        description: args.description || `${args.name} strategic operational unit.`,
        lead: args.lead || state.user.name,
        membersCount: 0,
        budget: args.budget || '$150,000 / yr',
        color: args.color || '#0f4cff',
        tags: Array.isArray(args.tags) ? args.tags : ['Core Team'],
      };
      mutations.createdDepartment = newDept;
      toastMessage = `Department "${newDept.name}" created`;
      actionCards.push({
        type: 'feature',
        title: newDept.name,
        subtitle: `${newDept.description} • Lead: ${newDept.lead}`,
        badge: 'NEW DEPARTMENT',
        badgeColor: newDept.color,
        primaryAction: { label: 'View Departments', actionType: 'navigate', target: 'departments' },
      });
    } else if (fnName === 'create_automation') {
      const newAuto: AutomationRule = {
        id: 'auto_ai_' + Date.now(),
        name: args.name,
        active: true,
        when: args.trigger || 'Task status changed to completed',
        condition: null,
        then: args.action || 'Notify team channel and log activity',
        icon: '',
        color: '#0f4cff',
        executionCount: 0,
        lastRun: 'Never',
      };
      mutations.createdAutomation = newAuto;
      toastMessage = `Automation "${newAuto.name}" activated`;
      actionCards.push({
        type: 'automation',
        title: newAuto.name,
        subtitle: `When ${newAuto.when} → Then ${newAuto.then}`,
        badge: 'ACTIVE RULE',
        badgeColor: '#0f4cff',
        primaryAction: { label: 'View Automations', actionType: 'navigate', target: 'automations' },
      });
    } else if (fnName === 'invite_team_member' || fnName === 'add_team_member') {
      const rawEmail = (args.email || '').trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const isValidEmail = rawEmail && emailRegex.test(rawEmail);

      if (!isValidEmail) {
        toastMessage = 'incorrect user';
        actionCards.push({
          type: 'team',
          title: 'incorrect user',
          subtitle: `The email "${args.email || 'None'}" is invalid. A valid registered user email is required to add team members.`,
          badge: 'INCORRECT USER',
          badgeColor: '#ef4444',
          primaryAction: { label: 'View Team', actionType: 'navigate', target: 'team' },
        });
      } else {
        const derivedName = args.name || rawEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        const newInv: Invitation = {
          id: 'inv_ai_' + Date.now(),
          name: derivedName,
          email: rawEmail,
          workspaceRole: 'Member',
          roleTitle: args.role || 'Team Member',
          department: args.department || 'Operations',
          team: null,
          status: 'pending',
          token: 'tok_' + Math.random().toString(36).substring(2, 9),
          sentAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          invitedBy: state.user.name,
        };
        const newEmp: Employee = {
          id: 'emp_ai_' + Date.now(),
          name: derivedName,
          initials: derivedName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'TM',
          role: args.role || 'Team Member',
          department: args.department || 'Operations',
          status: 'online',
          color: '#FF5500',
          tasks: 0,
          projects: 0,
          email: rawEmail,
          joinedAt: 'Just now',
        };
        mutations.createdInvitation = newInv;
        mutations.createdEmployee = newEmp;
        toastMessage = `Invitation sent to ${newInv.email} (${newInv.roleTitle})`;
        actionCards.push({
          type: 'team',
          title: `Invite Sent: ${newInv.name}`,
          subtitle: `${newInv.email} as ${newInv.roleTitle}`,
          badge: 'INVITED',
          primaryAction: { label: 'View Team', actionType: 'navigate', target: 'team' },
        });
      }
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
      toastMessage = `Workspace settings updated`;
    } else if (fnName === 'create_dynamic_feature') {
      const newFeat: DynamicFeature = {
        id: 'feat_ai_' + Date.now(),
        name: args.name,
        category: args.category || 'Quality & Operations',
        description: args.description,
        icon: '',
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
      toastMessage = `New Feature "${newFeat.name}" deployed!`;
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
      name: 'create_department',
      description: 'Create a new workspace department, operational division, or business unit.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Department name (e.g. "Engineering", "Design", "Marketing", "UI/UX")' },
          description: { type: 'string', description: 'Department purpose or mission description' },
          lead: { type: 'string', description: 'Department lead or manager name' },
          budget: { type: 'string', description: 'Budget allocation (e.g. "$150,000 / yr")' },
          color: { type: 'string', description: 'Hex brand color for department badge' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Tags or focus areas' },
        },
        required: ['name'],
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
  const safety = distressResponse(message);
  if (safety) return { responseText: safety };
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

      const { mutations, actionCards, toastMessage, navigateToPage } = processOrdisToolCalls(formattedCalls, state);

      if (toastMessage === 'incorrect user') {
        responseText = `**Incorrect User**\n\nThe provided email address is invalid or not a recognized user. A valid email address is required to add or invite a team member.`;
      } else if (!responseText.trim()) {
        const actionNames = formattedCalls.map((c: any) => c.name.replace(/_/g, ' ')).join(', ');
        responseText = `Done! I've executed **${actionNames}** for your workspace.`;
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
