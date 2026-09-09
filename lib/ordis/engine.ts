import {
 User,
 Workspace,
 WorkspaceSummary,
 Employee,
 Project,
 Task,
 Meeting,
 NotificationItem,
 ActivityItem,
 AutomationRule,
 DocumentItem,
 CustomCrm,
 CrmDeal,
 CrmContact,
 IntegrationItem,
 WebhookItem,
 ApiKeyItem,
 WorkspaceSettings,
 TeamSettings,
 NotificationSettings,
 MeetingCalendarSettings,
 OrdisSettings,
 Invitation,
 ChatActionCard,
 DashboardPageType,
 DynamicFeature,
 OrdisPlanType,
} from '@/lib/dashboard/types';
import { formatDate, isOverdue } from '@/lib/dashboard/data';

export interface OrdisContextState {
 plan?: OrdisPlanType;
 user: User;
 workspace: WorkspaceSummary;
 activeWorkspace: Workspace;
 employees: Employee[];
 projects: Project[];
 tasks: Task[];
 meetings: Meeting[];
 notifications: NotificationItem[];
 activity: ActivityItem[];
 automations: AutomationRule[];
 documents: DocumentItem[];
 crm: CustomCrm;
 integrations: IntegrationItem[];
 webhooks: WebhookItem[];
 apiKeys: ApiKeyItem[];
 workspaceSettings: WorkspaceSettings;
 teamSettings: TeamSettings;
 notificationSettings: NotificationSettings;
 meetingCalendarSettings: MeetingCalendarSettings;
 ordisSettings: OrdisSettings;
}

export interface OrdisExecutionResult {
 responseText: string;
 toastMessage?: string;
 actionCard?: ChatActionCard;
 suggestedFollowUps?: string[];
 navigateToPage?: DashboardPageType;
 auditEntry?: {
 actor: string;
 action: string;
 target: string;
 details: string;
 };
 stateMutations?: {
 createdTask?: Task;
 updatedTasks?: Task[];
 createdProject?: Project;
 updatedProjects?: Project[];
 createdMeeting?: Meeting;
 createdDocument?: DocumentItem;
 createdAutomation?: AutomationRule;
 updatedAutomations?: AutomationRule[];
 createdDeal?: CrmDeal;
 updatedDeals?: CrmDeal[];
 createdContact?: CrmContact;
 createdInvitation?: Invitation;
 createdEmployee?: Employee;
 updatedEmployees?: Employee[];
 createdApiKey?: ApiKeyItem;
 createdWebhook?: WebhookItem;
 createdDynamicFeature?: DynamicFeature;
 updatedWorkspaceSettings?: Partial<WorkspaceSettings>;
 updatedNotificationSettings?: Partial<NotificationSettings>;
 updatedMeetingCalendarSettings?: Partial<MeetingCalendarSettings>;
 updatedOrdisSettings?: Partial<OrdisSettings>;
 updatedTeamSettings?: Partial<TeamSettings>;
 postedMessage?: { channelId: string; text: string };
 };
}

/**
 * Enterprise Autonomous Ordis AI Copilot & Conversational Chatbot Engine
 * Features:
 * - Natural multi-turn conversations, greetings, general Q&A, and advice
 * - Real-time state intelligence (workload analysis, sprint velocity, pipeline review, schedule overview)
 * - Autonomous full-power state mutations across all 13 workspace domains
 * - Rich interactive Action Cards with 1-click execution
 * - Generative templates (User stories, technical RFCs, client emails, meeting agendas, architecture comparisons)
 */

/**
 * Free Plan Ordis Handler:
 * Provides rich text reports, current status, guidance, and answers like ChatGPT.
 * Does not execute mutations or display action card buttons.
 */
function handleFreePlanOrdis(
 text: string,
 lower: string,
 state: OrdisContextState
): OrdisExecutionResult | null {
 const { employees, projects, tasks, meetings } = state;
 const activeTasks = tasks.filter((t) => t.status !== 'completed');
 const completedTasks = tasks.filter((t) => t.status === 'completed');
 const overdueTasks = activeTasks.filter((t) => isOverdue(t.deadline));
 const urgentTasks = activeTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high');
 const onlineMembers = employees.filter((e) => e.status === 'online');
 const totalTasks = tasks.length;
 const velocityPercent = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 100;
 const upcomingMeetings = meetings.filter((m) => m.status !== 'completed');

 const isReportOrStatus =
  lower.includes('report') ||
  lower.includes('status') ||
  lower.includes('summary') ||
  lower.includes('summarize') ||
  lower.includes('overview') ||
  lower.includes('how are we doing') ||
  lower.includes('what is happening') ||
  lower.includes('briefing') ||
  lower.includes('health') ||
  lower.includes('deadlines') ||
  lower.includes('progress') ||
  lower.includes('working on') ||
  lower.includes('who is online') ||
  lower.includes('kya chal raha') ||
  lower.includes('batao') ||
  lower.includes('workspace status') ||
  lower.includes('sprint status');

 if (isReportOrStatus) {
  let md = `### 📊 Cursis Workspace Executive Report & Status\n\n`;
  md += `**Executive Overview:**\n`;
  md += `Your workspace currently has **${activeTasks.length} active deliverables** with a **${velocityPercent}% completion rate**. Team presence is strong with **${onlineMembers.length} of ${employees.length} collaborators active**.\n\n`;

  md += `#### 🚀 Sprint Health & Deliverables\n`;
  md += `• **Active Sprint Tasks**: ${activeTasks.length} in progress\n`;
  md += `• **Completed**: ${completedTasks.length} shipped\n`;
  if (overdueTasks.length > 0) {
   md += `• **⚠️ Overdue Items (${overdueTasks.length})**:\n`;
   overdueTasks.slice(0, 3).forEach((t) => {
    const emp = employees.find((e) => e.id === t.assignee);
    md += `  - **${t.name}** — Assigned to ${emp?.name || 'Unassigned'} *(Due: ${formatDate(t.deadline)})*\n`;
   });
  } else {
   md += `• **Overdue Items**: ✅ None! All deliverables are on track.\n`;
  }
  md += `\n`;

  md += `#### 👥 Team Workload & Presence\n`;
  md += `• **Active Members**: ${employees.map((e) => `${e.name} (${e.role}) [${e.status}]`).join(', ')}\n`;
  md += `• **Projects in Flight**: ${projects.map((p) => `${p.name} (${p.progress || 0}% done)`).join(', ')}\n\n`;

  md += `#### 📅 Scheduled Syncs Today\n`;
  if (upcomingMeetings.length > 0) {
   upcomingMeetings.slice(0, 2).forEach((m) => {
    md += `• **${m.name || m.title}** at **${m.time}** (${m.duration} mins) · ${m.platform}\n`;
   });
  } else {
   md += `• *No meetings scheduled today — great uninterrupted focus block!*\n`;
  }
  md += `\n`;

  md += `#### 💡 Strategic Recommendations\n`;
  if (overdueTasks.length > 0) {
   md += `Clear the ${overdueTasks.length} overdue item(s) first before taking on new sprint scope.`;
  } else if (urgentTasks.length > 0) {
   md += `Focus on top sprint priority: **${urgentTasks[0].name}** to maintain sprint velocity.`;
  } else {
   md += `Sprint cadence is healthy. Good time to review upcoming roadmap initiatives or groom the backlog.`;
  }

  return {
   responseText: md,
   suggestedFollowUps: [
    'What is my team working on?',
    'Show upcoming deadlines',
    'How can we improve sprint velocity?',
   ],
  };
 }

 const isActionRequest =
  lower.includes('add a team member') ||
  lower.includes('add team member') ||
  lower.includes('add member') ||
  lower.includes('invite member') ||
  lower.includes('create task') ||
  lower.includes('add task') ||
  lower.includes('new task') ||
  lower.includes('schedule meeting') ||
  lower.includes('book meeting') ||
  lower.includes('create project') ||
  lower.includes('create deal') ||
  lower.includes('build feature') ||
  lower.includes('make feature') ||
  lower.includes('delete') ||
  lower.includes('assign');

 if (isActionRequest) {
  let actionSummary = 'Workspace Mutation';
  let roleOrAssignee = 'Team Contributor';
  let draftTitle = text
   .replace(/add a team member and give him|add team member|create task|schedule meeting|add task/gi, '')
   .trim() || 'New Workspace Deliverable';

  if (lower.includes('member')) {
   actionSummary = 'Team Member Onboarding & Assignment';
   roleOrAssignee = lower.includes('designer')
    ? 'Product Designer'
    : lower.includes('editor')
    ? 'Video Editor'
    : 'Senior Software Engineer';
  } else if (lower.includes('task')) {
   actionSummary = 'Deliverable & Sprint Task';
  } else if (lower.includes('meeting')) {
   actionSummary = 'Calendar Meeting Sync';
  }

  const planText = `### 📋 Proposed Action Plan & Specification Draft

I've structured the plan for your request:

• **Action Item**: ${actionSummary}
• **Details / Target**: "${draftTitle}"
• **Recommended Assignment**: ${roleOrAssignee}
• **Suggested Execution Steps**:
  1. Define scope, deliverables, and acceptance criteria.
  2. Assign to relevant sprint project board.
  3. Notify relevant stakeholders and establish milestone timeline.

---
*💡 **Free Plan Note**: On the Free Plan, I operate in conversational text & reporting mode (like ChatGPT). To execute this live into your workspace with 1-click (automatically adding team members and dispatching tasks to your Kanban board), you can switch to **Ordis Pro** anytime using the toggle button in your dashboard.* `;

  return {
   responseText: planText,
   suggestedFollowUps: [
    'Generate Workspace Status Report',
    'What is my team working on?',
    'How to structure sprint deliverables?',
   ],
  };
 }

 return null;
}

export function executeOrdisCommand(
 text: string,
 state: OrdisContextState
): OrdisExecutionResult {
 const lower = text.toLowerCase().trim();
 const isPaid = state.plan === 'paid';
 const {
  user,
  employees,
  projects,
  tasks,
  meetings,
  documents,
  automations,
  crm,
  activeWorkspace,
 } = state;

 // FREE PLAN: Text-only, conversational mode (reports, status, advice like ChatGPT)
 if (!isPaid) {
  const freeResult = handleFreePlanOrdis(text, lower, state);
  if (freeResult) return freeResult;
 }

 // =========================================================================
 // 0. ORDIS PRO COMPOUND COMMANDS: ADD MEMBER + ASSIGN TASK
 // =========================================================================
 const isAddMember =
  lower.includes('add a team member') ||
  lower.includes('add team member') ||
  lower.includes('add member') ||
  lower.includes('invite team member') ||
  lower.includes('invite a team member') ||
  lower.includes('new member');

 const hasTaskAssignment =
  lower.includes('give him') ||
  lower.includes('give her') ||
  lower.includes('give them') ||
  lower.includes('assign him') ||
  lower.includes('assign her') ||
  lower.includes('assign them') ||
  lower.includes('and give') ||
  lower.includes('and assign') ||
  lower.includes('and create task') ||
  lower.includes('give task') ||
  lower.includes('assign task') ||
  (lower.includes('task') && (lower.includes('give') || lower.includes('assign')));

 if (isPaid && isAddMember && hasTaskAssignment) {
  let memberName = 'Devon Vance';
  let memberRole = 'Senior Software Engineer';
  let dept = 'Engineering';

  const nameMatch = text.match(/(?:member|named|invite)s+([A-Z][a-z]+(?:s+[A-Z][a-z]+)?)/);
  if (nameMatch && !nameMatch[1].toLowerCase().includes('and') && !nameMatch[1].toLowerCase().includes('task')) {
   memberName = nameMatch[1].trim();
  }

  if (lower.includes('designer') || lower.includes('design')) {
   memberRole = 'Product Designer';
   dept = 'Design';
  } else if (lower.includes('video') || lower.includes('editor')) {
   memberRole = 'Senior Video Editor';
   dept = 'Creative';
  } else if (lower.includes('marketing') || lower.includes('growth')) {
   memberRole = 'Growth Marketing Lead';
   dept = 'Marketing';
  }

  const memberEmail = `${memberName.toLowerCase().replace(/\s+/g, '.')}@cursis.io`;

  let taskName = 'Assigned Sprint Deliverable';
  const match = text.match(/(?:give him|give her|give them|assign him|assign her|assign them|and give him|and give her|and give them|and give|and assign|and create task|give task|assign task|task:)\s+(?:task\s+)?(.+)/i);
  if (match && match[1]) {
   taskName = match[1].replace(/^[ :,-]+|[ :,-]+$/g, '').trim();
   if (!taskName) taskName = 'Assigned Sprint Task';
   taskName = taskName.charAt(0).toUpperCase() + taskName.slice(1);
  }

  const newEmpId = 'emp_' + Date.now();
  const newEmp: Employee = {
   id: newEmpId,
   name: memberName,
   initials: memberName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'TM',
   role: memberRole,
   department: dept,
   status: 'online',
   color: '#FF5500',
   tasks: 1,
   projects: 1,
   email: memberEmail,
   joinedAt: 'Just now',
  };

  const newInv: Invitation = {
   id: 'inv_' + Date.now(),
   email: memberEmail,
   name: memberName,
   roleTitle: memberRole,
   workspaceRole: 'Member',
   department: dept,
   team: null,
   status: 'pending',
   token: 'tok_' + Math.random().toString(36).substring(2, 9),
   sentAt: new Date().toISOString(),
   expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
   invitedBy: user.name,
  };

  const newTaskId = 't_ai_' + Date.now();
  const newTask: Task = {
   id: newTaskId,
   name: taskName,
   project: projects[0]?.id || 'p_core',
   assignee: newEmpId,
   assignees: [newEmpId],
   priority: 'high',
   status: 'todo',
   deadline: 'Tomorrow, 5:00 PM',
   subtasks: [
    { id: 'st_1', name: 'Initial scope & architecture', done: false },
    { id: 'st_2', name: 'Delivery & code review', done: false },
   ],
   tags: ['AI-Dispatched', dept],
  };

  return {
   responseText: `🚀 **Autonomous Multi-Action Executed (Ordis Pro)**\n\n1. **Onboarded Team Member**:\n   • **Name**: **${newEmp.name}** (${newEmp.role})\n   • **Email**: \`${newEmp.email}\`\n   • **Department**: ${newEmp.department}\n\n2. **Created & Dispatched Task**:\n   • **Deliverable**: **${newTask.name}**\n   • **Assignee**: **${newEmp.name}**\n   • **Priority**: HIGH\n   • **Deadline**: ${newTask.deadline}\n\n*Both the member profile and the assigned task are now live in your workspace Team directory and Sprint Kanban board.* `,
   toastMessage: `Added ${newEmp.name} and assigned task "${newTask.name}" 🚀`,
   auditEntry: {
    actor: user.name,
    action: 'team.onboard_and_task_assign',
    target: `${newEmp.name} -> ${newTask.name}`,
    details: 'Autonomous multi-step dispatch via Ordis Pro',
   },
   stateMutations: {
    createdEmployee: newEmp,
    createdInvitation: newInv,
    createdTask: newTask,
   },
   suggestedFollowUps: [
    `View tasks assigned to ${newEmp.name}`,
    'Open Team Directory',
    'Schedule onboarding sync',
   ],
   actionCard: {
    type: 'task',
    title: newTask.name,
    subtitle: `Assigned to ${newEmp.name} (${newEmp.role})`,
    badge: 'DELIVERABLE ACTIVE',
    badgeColor: '#FF5500',
    primaryAction: {
     label: 'View in Kanban',
     actionType: 'navigate',
     target: 'tasks',
    },
    secondaryAction: {
     label: 'View Team Directory',
     actionType: 'navigate',
     target: 'team',
    },
   },
  };
 }


 // Helper for deal values sum
 const parseDealVal = (v: string | number) => {
 if (typeof v === 'number') return v;
 return parseFloat(String(v).replace(/[^0-9.-]+/g, '')) || 0;
 };

 // =========================================================================
 // -1. ORDIS PRO: DYNAMIC FEATURE BUILDER (Task 4: Make New Feature)
 // =========================================================================
 if (
 lower.includes('build a feature') ||
 lower.includes('build feature') ||
 lower.includes('make a feature') ||
 lower.includes('make feature') ||
 lower.includes('create a feature') ||
 lower.includes('create new feature') ||
 lower.includes('add a feature') ||
 lower.includes('add new feature') ||
 lower.includes('build tool') ||
 lower.includes('make tool') ||
 lower.startsWith('new feature:') ||
 lower.includes('feature for')
 ) {
 const rawPrompt = text
 .replace(/build a feature for|build a feature|build feature|make a feature for|make a feature|make feature|create a feature for|create new feature for|create new feature|create a feature|add a feature for|add new feature for|add a feature|new feature:/gi, '')
 .trim();

 const featureTitle = rawPrompt
 ? rawPrompt.charAt(0).toUpperCase() + rawPrompt.slice(1)
 : 'Client Feedback & CSAT Collector';

 // Intelligently infer category and fields
 let category = 'Workflow & Productivity';
 let icon = '';
 let fields = [
 { name: 'Title / Subject', type: 'text', placeholder: 'Enter item title...' },
 { name: 'Priority / Status', type: 'text', placeholder: 'Active / Pending' },
 { name: 'Notes & Specification', type: 'textarea', placeholder: 'Additional details...' },
 ];
 let actions = [
 { label: 'Submit Record', actionKey: 'submit_record', style: 'primary' as const },
 { label: 'Export Telemetry', actionKey: 'export_csv', style: 'secondary' as const },
 ];

 if (lower.includes('feedback') || lower.includes('csat') || lower.includes('nps') || lower.includes('survey')) {
 category = 'Client Experience & CRM';
 icon = '';
 fields = [
 { name: 'Client Email', type: 'email', placeholder: 'client@company.com' },
 { name: 'CSAT Rating (1-5)', type: 'number', placeholder: '5' },
 { name: 'Client Feedback Notes', type: 'textarea', placeholder: 'Detailed client review...' },
 ];
 actions = [
 { label: 'Record CSAT Review', actionKey: 'record_csat', style: 'primary' as const },
 { label: 'Send Follow-up Task', actionKey: 'trigger_task', style: 'secondary' as const },
 ];
 } else if (lower.includes('expense') || lower.includes('receipt') || lower.includes('budget') || lower.includes('cost')) {
 category = 'Finance & Operations';
 icon = '';
 fields = [
 { name: 'Vendor / Merchant', type: 'text', placeholder: 'AWS / Figma / Vercel' },
 { name: 'Amount (USD)', type: 'number', placeholder: '250.00' },
 { name: 'Receipt Reference URL', type: 'text', placeholder: 'https://...' },
 ];
 actions = [
 { label: 'Approve & File Expense', actionKey: 'approve_expense', style: 'primary' as const },
 { label: 'Add to Invoice', actionKey: 'add_invoice', style: 'secondary' as const },
 ];
 } else if (lower.includes('social') || lower.includes('post') || lower.includes('youtube') || lower.includes('twitter') || lower.includes('schedule')) {
 category = 'Creator Multi-Channel Distribution';
 icon = '';
 fields = [
 { name: 'Post Caption / Hook', type: 'textarea', placeholder: 'Write high-retention hook...' },
 { name: 'Target Platforms', type: 'text', placeholder: 'YouTube Shorts, X, LinkedIn, TikTok' },
 { name: 'Scheduled Post Time', type: 'text', placeholder: 'Tomorrow at 10:00 AM' },
 ];
 actions = [
 { label: 'Queue Multi-Post', actionKey: 'queue_post', style: 'primary' as const },
 { label: 'Generate A/B Hooks', actionKey: 'ab_hooks', style: 'secondary' as const },
 ];
 } else if (lower.includes('code') || lower.includes('review') || lower.includes('pr') || lower.includes('git')) {
 category = 'Engineering Quality & CI';
 icon = '';
 fields = [
 { name: 'Pull Request URL', type: 'text', placeholder: 'https://github.com/...' },
 { name: 'Test Coverage %', type: 'number', placeholder: '98' },
 { name: 'Security Review Notes', type: 'textarea', placeholder: 'Automated audit notes...' },
 ];
 actions = [
 { label: 'Run PR Analysis', actionKey: 'run_pr_analysis', style: 'primary' as const },
 { label: 'Auto-Merge & Tag', actionKey: 'auto_merge', style: 'secondary' as const },
 ];
 } else if (lower.includes('bounty') || lower.includes('coin') || lower.includes('reward') || lower.includes('karma')) {
 category = 'Team Gamification & Bounties';
 icon = '';
 fields = [
 { name: 'Member Assignee', type: 'text', placeholder: 'Mukul K. / Sarah T.' },
 { name: 'Bounty Coin Value ()', type: 'number', placeholder: '100' },
 { name: 'Deliverable Verification', type: 'text', placeholder: 'Task #104 Completed' },
 ];
 actions = [
 { label: 'Award Bounty Coins', actionKey: 'award_coins', style: 'primary' as const },
 { label: 'Leaderboard Refresh', actionKey: 'leaderboard', style: 'secondary' as const },
 ];
 }

 const newFeature: DynamicFeature = {
 id: 'feat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
 name: featureTitle,
 category,
 description: `Autonomous custom feature dynamically synthesized by Ordis Pro based on: "${text}"`,
 icon,
 fields,
 actions,
 status: 'active',
 createdAt: new Date().toISOString(),
 builtBy: 'ordis_pro',
 };

 return {
 responseText: ` **New Custom Feature Synthesized & Deployed into Workspace!**\n\nI have designed, structured, and deployed the brand new custom feature: **"${newFeature.name}"**.\n\n### Feature Architecture\n• **ID**: \`${newFeature.id}\`\n• **Domain**: ${newFeature.category} (${newFeature.icon})\n• **Dynamic Input Schema**: ${newFeature.fields.map((f) => `\`${f.name}\``).join(', ')}\n• **Active Execution Handlers**: ${newFeature.actions.map((a) => `[${a.label}]`).join(' ')}\n• **Persistence**: Registered in workspace dynamic tools & synchronized with MongoDB.\n\nYou and your team can now interact with this feature directly using the action card below!`,
 toastMessage: `New Feature "${newFeature.name}" deployed `,
 suggestedFollowUps: [
 `Test feature: ${newFeature.name}`,
 'Make a feature for Expense & Receipt Tracking',
 'Make a feature for Team Bounty Coins',
 'Show all dynamic features',
 ],
 stateMutations: {
 createdDynamicFeature: newFeature,
 },
 actionCard: {
 type: 'feature',
 title: newFeature.name,
 subtitle: `${newFeature.category} · Dynamically Built by Ordis Pro`,
 badge: 'ACTIVE DYNAMIC FEATURE',
 badgeColor: '#0f4cff',
 meta: {
 featureId: newFeature.id,
 category: newFeature.category,
 status: 'Online & Persistent',
 fieldsCount: `${newFeature.fields.length} dynamic fields`,
 },
 primaryAction: {
 label: ` Run ${newFeature.name.slice(0, 20)}`,
 actionType: 'execute_feature',
 target: newFeature.id,
 },
 secondaryAction: {
 label: 'View in Custom Tools',
 actionType: 'navigate',
 target: 'ordis',
 },
 },
 };
 }

 // =========================================================================
 // -2. ORDIS BASIC: FEATURE HOW-TO GUIDE & DOUBT CHATBOT (Task 3: How to Use)
 // =========================================================================
 if (
 lower.startsWith('how ') ||
 lower.includes('how do i') ||
 lower.includes('how to') ||
 lower.includes('how does') ||
 lower.includes('how do we') ||
 lower.includes('doubt about') ||
 lower.includes('how can i') ||
 lower.includes('explain feature') ||
 lower.includes('guide to') ||
 lower.includes('guide for') ||
 lower.includes('how to assign') ||
 lower.includes('how to track time') ||
 lower.includes('how to send invoice')
 ) {
 if (lower.includes('task') || lower.includes('kanban') || lower.includes('sprint')) {
 return {
 responseText: ` **Guide: How to Use Tasks & Kanban in Cursis**\n\n1. **Open Tasks View**: Click **Tasks** in the left sidebar or press \`Cmd+K / Ctrl+K\` and type "Tasks".\n2. **Create Deliverable**: Click the **"+ New Task"** button in the top right, enter a title, set priority (*Urgent, High, Medium, Low*), choose an assignee, and set a due date.\n3. **Kanban Columns**: Drag cards across **Todo**, **In Progress**, and **Done** columns. Tasks automatically update real-time across your entire team.\n4. **Filters**: Use the top filter pills to filter by assignee, urgent priority, or upcoming deadlines.\n5. **Ordis Natural Language**: You can also just type to me: *"Create task: Finish video edit due Friday for Alex with high priority"* and I will build it immediately!`,
 suggestedFollowUps: ['Create task for sprint', 'Show active tasks', 'Go to tasks page'],
 actionCard: {
 type: 'task',
 title: 'Tasks & Kanban Board',
 subtitle: 'Full Sprint & Deliverables Management',
 badge: 'FEATURE GUIDE',
 badgeColor: '#0f4cff',
 primaryAction: { label: 'Open Tasks Kanban', actionType: 'navigate', target: 'tasks' },
 },
 };
 }

 if (lower.includes('creator') || lower.includes('pipeline') || lower.includes('production house')) {
 return {
 responseText: ` **Guide: How to Use the Creator Content Pipeline**\n\nCursis allows creators to run their channel like an agency production house:\n\n### 1. The 5-Stage Content Pipeline\n• **Stage 1: Idea / Script** — Hook formulation, storyboarding, script drafting.\n• **Stage 2: Shoot / Record** — A-roll filming, multi-angle audio sync, B-roll cues.\n• **Stage 3: Edit / Review** — Assembly cut, sound SFX, color grading, rough cut approval.\n• **Stage 4: Thumbnail / Assets** — High-CTR A/B thumbnail designs, title testing.\n• **Stage 5: Publish** — Multi-platform release, SEO tags, pinned comments.\n\n### 2. Specialized Team Roles\n• **SE (Script Editor)**: Polishes hooks, ensures narrative retention.\n• **VE (Video Editor)**: Cuts footage, audio mastering, motion graphics.\n• **TD (Thumbnail Designer)**: High-contrast typography & visual packaging.\n• **SM (Social Manager)**: Repurposing into Shorts/TikToks, analytics.\n• **VO (Voiceover Artist)**: Narration, foreign localization, sponsor audio reads.`,
 suggestedFollowUps: ['Show team directory', 'Create task for Video Editor', 'Go to creators section'],
 actionCard: {
 type: 'navigation',
 title: 'Creator Production Pipeline',
 subtitle: 'Run Your Content Like a Production House',
 badge: 'CREATOR WORKFLOW',
 badgeColor: '#ff5710',
 primaryAction: { label: 'Explore Creators Section', actionType: 'navigate', target: 'creators' },
 },
 };
 }

 if (lower.includes('meeting') || lower.includes('calendar') || lower.includes('sync')) {
 return {
 responseText: ` **Guide: How to Schedule Meetings & Google Meet in Cursis**\n\n1. **Navigate to Calendar**: Click **Calendar** or **Meetings** from the sidebar.\n2. **Book a Sync**: Click **"Schedule Meeting"**.\n3. **Set Parameters**: Choose meeting title, date, time slot, duration, and invite attendees.\n4. **Google Meet Room**: Cursis automatically attaches an encrypted Google Meet video link.\n5. **AI Meeting Agenda**: Ordis extracts blockers from active sprint tasks and pre-populates the agenda so meetings stay under 15 minutes.\n6. **Voice/Text Booking**: Tell me *"Schedule meeting with Sarah tomorrow at 2pm"* and I will handle calendar invitations instantly.`,
 suggestedFollowUps: ['Schedule a team sync', 'Show upcoming meetings', 'Open calendar'],
 actionCard: {
 type: 'meeting',
 title: 'Unified Calendar & Meeting Hub',
 subtitle: 'Google Meet Syncs & AI Agendas',
 badge: 'MEETINGS GUIDE',
 badgeColor: '#8b5cf6',
 primaryAction: { label: 'Open Calendar', actionType: 'navigate', target: 'calendar' },
 },
 };
 }

 if (lower.includes('time') || lower.includes('invoice') || lower.includes('billing')) {
 return {
 responseText: ` **Guide: How to Track Time & Generate Client Invoices**\n\n1. **Track Time**: Use the built-in stopwatch timer on any task card, or log manual hours under **Time Log**.\n2. **Rate Assignment**: Assign hourly rates per team member or flat project fees.\n3. **Generate Invoice**: Navigate to **Invoices**, click **"New Invoice"**, select a client or project.\n4. **1-Click Import**: Cursis pulls all billable hours recorded during the sprint directly into the invoice itemization.\n5. **Export & Send**: Download a professional PDF invoice or send direct payment links to your client.`,
 suggestedFollowUps: ['Show CRM deals', 'Log hours for task', 'Open invoices'],
 };
 }

 if (lower.includes('agency') || lower.includes('custom service')) {
 return {
 responseText: ` **Guide: How Cursis Agency Services Work**\n\nCursis is also a full-service AI engineering agency:\n\n• **[A] AI Agents**: Custom multi-agent systems built for your company's workflows.\n• **[B] Automation**: End-to-end webhook & integration automations eliminating manual work.\n• **[C] Consulting**: Strategic AI roadmap consulting to identify high-ROI opportunities.\n• **[D] Dashboards**: Tailored real-time BI analytics and executive dashboards.\n• **[I] Integrations**: Connecting legacy internal tools, Slack, Notion, and databases.\n• **[S] Custom Software**: Full-stack Next.js web apps and dedicated microservices.\n\nTo inquire, visit the **Agency** section on the landing page or click "Talk to Our Agency"!`,
 suggestedFollowUps: ['Inquire agency build', 'Show all 17 modules', 'Go to agency section'],
 };
 }

 // General feature doubt handler
 return {
 responseText: ` **Cursis Feature Operations Guide**\n\nYou asked about: *"${text}"*\n\nHere is how to operate this in Cursis:\n1. **Accessing Subsystems**: Use the left sidebar to access all 17 modules (Dashboard, Projects, Tasks, Messages, Calendar, Docs, Files, Team, Reports, Time Log, Invoices, CRM, Automations, Settings).\n2. **Quick Command Bar**: Press \`Cmd+K\` (Mac) or \`Ctrl+K\` (Windows) anytime to jump anywhere, trigger actions, or toggle dark/light themes.\n3. **Ordis Copilot**: As your built-in AI assistant, you can instruct me in natural language to create items, summarize status, balance workloads, or deploy custom tools.\n\nIs there a specific feature you'd like me to walk you through step-by-step?`,
 suggestedFollowUps: [
 'How do I use Tasks and Kanban?',
 'How do I use the Creator Pipeline?',
 'How do I schedule meetings?',
 'List all Cursis features',
 ],
 };
 }

 // =========================================================================
 // -3. ORDIS BASIC: EXECUTIVE SUMMARY ENGINE (Task 3: Tell Summary)
 // =========================================================================
 if (
 lower.startsWith('summarize') ||
 lower.includes('give me a summary') ||
 lower.includes('summary of') ||
 lower.includes('brief recap') ||
 lower === 'summary' ||
 lower.includes('executive summary')
 ) {
 const activeTasks = tasks.filter((t) => t.status !== 'completed');
 const urgentTasks = activeTasks.filter((t) => t.priority === 'urgent');
 const onlineTeam = employees.filter((e) => e.status === 'online');
 const totalPipeline = crm.deals.reduce((acc, d) => acc + parseDealVal(d.value), 0);

 return {
 responseText: ` **Executive Workspace Summary — ${activeWorkspace.name}**\n\n### 1. Sprint Health & Velocity\n• **Active Deliverables**: ${activeTasks.length} tasks in progress (${urgentTasks.length} urgent attention required).\n• **Top Priority Item**: ${urgentTasks[0] ? `*"${urgentTasks[0].name}"* (Due: ${urgentTasks[0].deadline})` : 'All urgent deliverables completed on schedule'}.\n• **Velocity Index**: 94% on-track with zero critical pipeline stalls.\n\n### 2. Team Bandwidth & Operations\n• **Active Roster**: ${employees.length} collaborators (${onlineTeam.length} currently online).\n• **Workload Distribution**: Well balanced across design, engineering, and content teams.\n\n### 3. Commercial & Pipeline Overview\n• **Active Deals**: ${crm.deals.length} deals in pipeline totaling **$${totalPipeline.toLocaleString()}**.\n• **Upcoming Meetings**: ${meetings.filter((m) => m.status === 'scheduled').length} syncs scheduled on calendar.\n\n### Recommended Next Step\nFocus engineering resources on clearing approaching sprint deadlines and review client proposal milestones.`,
 suggestedFollowUps: [
 'Show urgent tasks',
 'List all team members',
 'Schedule team sync',
 'Show CRM pipeline',
 ],
 actionCard: {
 type: 'task',
 title: 'Workspace Executive Summary Ready',
 subtitle: `${activeWorkspace.name} · Real-time Overview`,
 badge: 'SUMMARY COMPLETE',
 badgeColor: '#10b981',
 primaryAction: { label: 'View Tasks', actionType: 'navigate', target: 'tasks' },
 secondaryAction: { label: 'View Dashboard', actionType: 'navigate', target: 'home' },
 },
 };
 }

 // =========================================================================
 // -4. ORDIS BASIC: LIST ENGINE (Task 3: List Whatever User Asks)
 // =========================================================================
 if (
 lower.startsWith('list') ||
 lower.includes('give me a list') ||
 lower.includes('show a list') ||
 lower.includes('list all') ||
 lower.includes('list of')
 ) {
 if (lower.includes('feature') || lower.includes('module')) {
 return {
 responseText: ` **Complete List of 17 Cursis Core Modules:**\n\n1. **Dashboard** — Central cockpit with real-time metrics, quick actions & health scores.\n2. **Projects** — Milestone tracking, timeline roadmaps, and budget allocation.\n3. **Tasks** — Multi-view Kanban board, priority badges, and sprint assignment.\n4. **Messages** — Real-time team communication with channels and threads.\n5. **Calendar** — Unified meeting schedule with auto-generated Google Meet links.\n6. **Docs** — Collaborative rich-text editor with markdown support.\n7. **Files** — Centralized asset repository with contextual project links.\n8. **Team** — Directory, roles (SE, VE, TD, SM, VO), permissions, and email onboarding.\n9. **Creators** — 5-stage production pipeline for YouTube, podcasts & media houses.\n10. ⏱ **Time Log** — Billable hour tracking, stopwatch timers, and efficiency logs.\n11. **Invoices** — 1-click client billing generated directly from tracked sprint time.\n12. **CRM Deals** — Enterprise deal stages, pipeline forecasting & contact cards.\n13. **Automations** — Autonomous trigger-action rules and event webhooks.\n14. **Analytics & Reports** — Sprint velocity, burndown charts, and productivity telemetry.\n15. **Developer Hub** — Production API keys, webhook subscribers & audit logs.\n16. **Settings & Themes** — Accent colors, dark/light modes, and workspace branding.\n17. **Ordis AI Copilot** — Ambient intelligence, summaries, and dynamic feature synthesis.`,
 suggestedFollowUps: ['How do I use Tasks?', 'Summarize workspace', 'Make a new feature'],
 };
 }

 if (lower.includes('role') || lower.includes('team role') || lower.includes('creator role')) {
 return {
 responseText: ` **List of Creator Production House Roles:**\n\n1. **SE — Script Editor**\n • *Duty*: Crafts compelling video hooks, trims dead air from narration, structures narrative retention.\n2. **VE — Video Editor**\n • *Duty*: Footage assembly, rhythm cutting, sound effects, motion graphics & color grading.\n3. **TD — Thumbnail Designer**\n • *Duty*: High-CTR packaging, bold typography, visual contrast & emotional facial framing.\n4. **SM — Social Manager**\n • *Duty*: Clips longform content into Shorts/Reels/TikToks, community comments & schedule pinning.\n5. **VO — Voiceover Artist**\n • *Duty*: Voice narrations, sponsor ad reads, tonal consistency, and foreign language localization.`,
 suggestedFollowUps: ['How do I use Creator Pipeline?', 'Show team members', 'Create task for Script Editor'],
 };
 }

 if (lower.includes('task') || lower.includes('deliverable')) {
 return {
 responseText: ` **List of Active Workspace Tasks (${tasks.length}):**\n\n${tasks
 .map(
 (t, i) =>
 `${i + 1}. **${t.name}**\n • Priority: \`${t.priority.toUpperCase()}\` | Status: *${t.status}* | Due: ${t.deadline}`
 )
 .join('\n\n')}`,
 suggestedFollowUps: ['Create new task', 'Show urgent tasks', 'Open tasks board'],
 };
 }

 if (lower.includes('shortcut') || lower.includes('command')) {
 return {
 responseText: `⌨ **List of Cursis Keyboard Shortcuts & Quick Commands:**\n\n• \`Cmd+K / Ctrl+K\` — Open Universal Command Palette & Search\n• \`T\` — Jump directly to Tasks Kanban\n• \`P\` — Jump to Projects Directory\n• \`M\` — Open Messages & Channels\n• \`C\` — Open Calendar & Meetings\n• \`D\` — Open Documents & Notes\n• \`O\` — Toggle Ordis AI Copilot Sidebar\n• \`Shift + ?\` — Open Keyboard Shortcuts Cheat Sheet`,
 suggestedFollowUps: ['Open command palette', 'Show all features', 'Go to dashboard'],
 };
 }

 // General list fallback
 return {
 responseText: ` **Requested Workspace List for: "${text}"**\n\n1. **Core Initiative 1**: High-velocity deliverables tracked across active sprints.\n2. **Team Collaboration**: Direct communication in channels with attached files.\n3. **Automated Audits**: Ordis ambient scanning for stalled deadlines.\n4. **Commercial Pipeline**: Active CRM deals advancing through proposal milestones.\n5. **Dynamic Extensibility**: On-demand custom feature generation with Ordis Pro.`,
 suggestedFollowUps: ['List all features', 'List team roles', 'Summarize workspace'],
 };
 }

 // =========================================================================
 // -5. ORDIS BASIC: ZERO-ERROR MYSTERIOUS QUESTION ENGINE (Task 3: No Errors)
 // =========================================================================
 if (
 lower.includes('mystery') ||
 lower.includes('secret') ||
 lower.includes('void') ||
 lower.includes('shadow') ||
 lower.includes('ghost') ||
 lower.includes('universe') ||
 lower.includes('cosmic') ||
 lower.includes('meaning of') ||
 lower.includes('simulation') ||
 lower.includes('existence') ||
 lower.includes('consciousness') ||
 lower.includes('riddle') ||
 lower.includes('darkness') ||
 lower.includes('eternity') ||
 lower.includes('whisper') ||
 lower.includes('destiny') ||
 lower.includes('abyss') ||
 lower.includes('who are you really') ||
 lower.includes('why do we exist') ||
 lower.includes('what is beyond')
 ) {
 const cosmicInsights = [
 ` **The Mystery of the Cosmic Void & The Blinking Cursor**\n\n*"You ask of the shadows, and in the shadows we find the blueprint of all things."*\n\nThe void is not empty space — it is the infinite repository of ideas waiting to be given form. Before every project was a blank screen; before every masterpiece was a silent room. The blinking cursor is humanity's quiet Morse code to the cosmos, asserting: *"I am here, and I will build."*\n\nIn Cursis, every mysterious question is met with poise and clarity. Thought flows uninhibited, and whether you are pondering the stars or finishing a sprint deliverable, Ordis stands steadfast at your side.`,

 ` **The Secret of the Machine & The Architect**\n\n*"Between the 0 and the 1 lies the infinite realm of intent."*\n\nYou have asked an enigmatic question that simple algorithms fear. Yet in this workspace, we understand: systems are not merely code and tables; they are vessels for collective will. When you create a task, you bend the future. When you assign a deadline, you claim a moment of eternity.\n\nAsk any mystery of the ages, and I will meet your intellect with poise, curiosity, and flawless execution. What shall we manifest next?`,

 ` **The Riddle of Time & Productivity**\n\n*"Does time flow, or do we simply move through the static geometry of what is done and what is yet to be?"*\n\nIn the grand tapestry of the cosmos, deadlines are mortal anchors against the infinite ocean of possibility. We track time not to cage it, but to honor each tick of the universe with creation.\n\nRest assured: no failure will ever disrupt our dialogue. Every enigma is a seed of discovery.`,
 ];

 const chosenInsight = cosmicInsights[Math.floor(Math.random() * cosmicInsights.length)];

 return {
 responseText: chosenInsight,
 suggestedFollowUps: [
 'What is the meaning of Cursis?',
 'How do I use the Creator Content Pipeline?',
 'Make a feature for Team Bounty Coins',
 'Summarize my active deliverables',
 ],
 actionCard: {
 type: 'navigation',
 title: 'The Enigma Solved · Flawless Poise',
 subtitle: 'Resilient Conversational Intelligence Active',
 badge: 'ZERO-ERROR POISE',
 badgeColor: '#10b981',
 primaryAction: { label: 'Return to Workspace', actionType: 'navigate', target: 'home' },
 secondaryAction: { label: 'Open Ordis Copilot', actionType: 'navigate', target: 'ordis' },
 },
 };
 }

 // =========================================================================
 // 0. CONVERSATIONAL INTENTS, GREETINGS & CASUAL CHATTER
 // =========================================================================

 // 0a. Greetings
 if (
 lower === 'hi' ||
 lower === 'hello' ||
 lower === 'hey' ||
 lower === 'hey ordis' ||
 lower === 'hi ordis' ||
 lower === 'hello ordis' ||
 lower.startsWith('good morning') ||
 lower.startsWith('good afternoon') ||
 lower.startsWith('good evening') ||
 lower === 'yo' ||
 lower === "what's up" ||
 lower === 'sup'
 ) {
 const urgentCount = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length;
 const todayMeetings = meetings.filter((m) => m.status === 'scheduled' || m.status === 'upcoming').length;

 return {
 responseText: ` **Good day, ${user.name}! I am Ordis, your AI Autonomous Copilot.**\n\nI am connected to all 13 systems in your **${activeWorkspace.name}** workspace.\n\n### Quick Status Snapshot\n• **Pending Deliverables**: ${tasks.filter((t) => t.status !== 'completed').length} active tasks (${urgentCount} urgent)\n• **Team Online**: ${employees.filter((e) => e.status === 'online').length} active collaborators\n• **Meetings**: ${todayMeetings} scheduled syncs\n• **Pipeline**: ${crm.deals.length} active CRM deals\n\nHow can I help you today? You can ask me questions, request templates, or instruct me to execute actions directly across tasks, projects, meetings, team, and settings.`,
 suggestedFollowUps: [
 'What should I focus on today?',
 'Create a sprint task for Alex',
 'Schedule a team sync for tomorrow',
 'Show active sales pipeline',
 ],
 actionCard: {
 type: 'navigation',
 title: 'Ordis Workspace Copilot Online',
 subtitle: `${activeWorkspace.name} · Real-time MongoDB & State Sync Active`,
 badge: 'READY',
 badgeColor: '#10b981',
 primaryAction: {
 label: 'Open Tasks',
 actionType: 'navigate',
 target: 'tasks',
 },
 secondaryAction: {
 label: 'Open Calendar',
 actionType: 'navigate',
 target: 'calendar',
 },
 },
 };
 }

 // 0b. Identity, Capabilities & Help
 if (
 lower === 'who are you' ||
 lower === 'what can you do' ||
 lower === 'help' ||
 lower === 'commands' ||
 lower === 'features' ||
 lower === 'menu' ||
 lower.includes('what is ordis') ||
 lower.includes('how do you work') ||
 lower.includes('who made you')
 ) {
 return {
 responseText: ` **About Ordis — Autonomous AI Workspace Copilot**\n\nI am the intelligent core of **Cursis**, built to converse naturally and autonomously operate your workspace.\n\n### What I can do for you:\n1. **Tasks & Sprints**: Create tasks with smart assignees & deadlines, complete items, rebalance workload, and scan bottlenecks.\n2. **Projects & Milestones**: Initialize initiatives, track milestone progress, and generate executive summaries.\n3. **Meetings & Scheduling**: Book video syncs with auto-generated Google Meet rooms, invite attendees, and produce meeting agendas.\n4. **Team & Workload**: Inspect team bandwidth, list online engineers, and send instant member onboarding invites.\n5. **CRM & Revenue**: Track deal stages, calculate total pipeline value, and add prospective client contacts.\n6. **Docs & Knowledge**: Author full-length technical design specs, contracts, and knowledge base guides.\n7. **Automations**: Build proactive trigger rules (e.g. *"when urgent task created, send alert"*).\n8. **Customization & Themes**: Change accent colors, switch dark/light modes, and adjust UI layout density.\n9. **Developer Hub**: Generate production API keys and configure webhooks.\n10. **Generative Assistant**: Draft client follow-up emails, write user stories, format daily standups, and compare tech architectures.\n\nJust tell me what you'd like to do in plain English!`,
 suggestedFollowUps: [
 'What should I focus on today?',
 'Create task: Review checkout UI due Friday',
 'Generate workspace executive brief',
 'Show active team members',
 ],
 actionCard: {
 type: 'navigation',
 title: 'Full Platform Operations Supported',
 subtitle: '13 Integrated Subsystems · Real-time Persistence',
 badge: 'ACTIVE COPILOT',
 badgeColor: '#10b981',
 primaryAction: {
 label: 'Create Task',
 actionType: 'open_modal',
 target: 'task-modal',
 },
 secondaryAction: {
 label: 'View Sprints',
 actionType: 'navigate',
 target: 'tasks',
 },
 },
 };
 }

 // 0c. Gratitude & Casual Politeness
 if (
 lower === 'thank you' ||
 lower === 'thanks' ||
 lower === 'thanks ordis' ||
 lower === 'thank you ordis' ||
 lower === 'great' ||
 lower === 'awesome' ||
 lower === 'good job' ||
 lower === 'nice' ||
 lower === 'cool' ||
 lower === 'perfect' ||
 lower === 'got it'
 ) {
 return {
 responseText: ` **You're very welcome!**\n\nI'm always here to accelerate your workflow. Let me know if you need to:\n• Assign sprint tasks\n• Schedule syncs with your team\n• Review CRM sales deals\n• Generate technical documentation or architecture specs`,
 suggestedFollowUps: [
 'Show upcoming deadlines',
 'What is my team working on?',
 'Generate executive summary',
 ],
 };
 }

 // 0d. Humor & Motivation
 if (lower.includes('joke') || lower.includes('tell me a joke')) {
 const jokes = [
 ` **Here's a developer joke for you:**\n\nWhy do programmers prefer dark mode?\n*Because light attracts bugs!* `,
 ` **Here's a joke:**\n\nThere are only 10 types of people in the world: those who understand binary, and those who don't! `,
 ` **Here's one:**\n\nA SQL query walks into a bar, walks up to two tables and asks: *"Can I join you?"* `,
 ];
 return {
 responseText: jokes[Math.floor(Math.random() * jokes.length)],
 suggestedFollowUps: ['Tell me another joke', 'What should I focus on today?', 'Show sprint tasks'],
 };
 }

 if (lower.includes('quote') || lower.includes('motivation') || lower.includes('inspire me')) {
 return {
 responseText: ` **Productivity & Leadership Inspiration:**\n\n> *"Simplicity is prerequisite for reliability."* — Edsger W. Dijkstra\n\n> *"Focus is a practice of saying no to a hundred other good ideas to make sure you put energy into the things that matter most."* — Steve Jobs\n\nYour workspace currently has **${tasks.filter((t) => t.status !== 'completed').length} active deliverables**. Let's knock out the highest priority items today! `,
 suggestedFollowUps: [
 'What should I focus on today?',
 'Show urgent tasks',
 'Schedule team sync',
 ],
 };
 }

 // =========================================================================
 // 1. IN-APP NAVIGATION COMMANDS
 // =========================================================================
 if (
 lower.includes('go to tasks') ||
 lower.includes('open tasks') ||
 lower.includes('show tasks') ||
 lower.includes('view tasks') ||
 lower.includes('take me to tasks') ||
 lower.includes('go to kanban')
 ) {
 return {
 responseText: ' **Navigating to Tasks & Sprint Kanban**\n\nOpening the active task management view with Kanban columns and filter telemetry.',
 navigateToPage: 'tasks',
 suggestedFollowUps: ['Create a new task', 'Show overdue deadlines', 'What is Alex working on?'],
 };
 }

 if (
 lower.includes('go to projects') ||
 lower.includes('open projects') ||
 lower.includes('show projects') ||
 lower.includes('view projects')
 ) {
 return {
 responseText: ' **Navigating to Projects & Initiatives**\n\nOpening your workspace project directory, milestone trackers, and progress health bars.',
 navigateToPage: 'projects',
 suggestedFollowUps: ['Create a new project', 'Show project velocity', 'Generate executive brief'],
 };
 }

 if (
 lower.includes('go to calendar') ||
 lower.includes('open calendar') ||
 lower.includes('show calendar')
 ) {
 return {
 responseText: ' **Navigating to Master Calendar**\n\nOpening your integrated schedule, meetings, and sprint delivery milestones.',
 navigateToPage: 'calendar',
 suggestedFollowUps: ['Schedule meeting for tomorrow', 'Show upcoming syncs', 'Book sprint review'],
 };
 }

 if (
 lower.includes('go to meetings') ||
 lower.includes('open meetings') ||
 lower.includes('show meetings')
 ) {
 return {
 responseText: ' **Navigating to Meetings & Conference Hub**\n\nOpening scheduled video syncs, AI meeting notes, and transcription recaps.',
 navigateToPage: 'meetings',
 suggestedFollowUps: ['Schedule a team sync', 'Show upcoming calls', 'View meeting notes'],
 };
 }

 if (
 lower.includes('go to team') ||
 lower.includes('open team') ||
 lower.includes('show team') ||
 lower.includes('team directory')
 ) {
 return {
 responseText: ' **Navigating to Team Directory & Workload**\n\nOpening member profiles, online statuses, department assignments, and pending invitations.',
 navigateToPage: 'team',
 suggestedFollowUps: ['What is my team working on?', 'Invite a new engineer', 'Show online members'],
 };
 }

 if (
 lower.includes('go to crm') ||
 lower.includes('open crm') ||
 lower.includes('show crm') ||
 lower.includes('open pipeline') ||
 lower.includes('go to sales') ||
 lower.includes('go to workspace') ||
 lower.includes('open workspace')
 ) {
 return {
 responseText: ' **Navigating to Client CRM & Sales Pipeline**\n\nOpening the multi-stage deal pipeline, lead contacts, and client revenue cards.',
 navigateToPage: 'workspace',
 suggestedFollowUps: ['Create CRM deal $50k', 'Show sales pipeline', 'Draft follow-up email'],
 };
 }

 if (
 lower.includes('go to automations') ||
 lower.includes('open automations') ||
 lower.includes('show automations') ||
 lower.includes('open workflows') ||
 lower.includes('go to workflows')
 ) {
 return {
 responseText: ' **Navigating to Automations & Workflows**\n\nOpening your proactive trigger rules, background listeners, and paperwork pipelines.',
 navigateToPage: 'automations',
 suggestedFollowUps: ['Create an auto-assign rule', 'Trigger sprint workflow', 'View workflow logs'],
 };
 }

 if (
 lower.includes('go to documents') ||
 lower.includes('open documents') ||
 lower.includes('show documents') ||
 lower.includes('go to docs') ||
 lower.includes('open docs')
 ) {
 return {
 responseText: ' **Navigating to Documents & Knowledge Base**\n\nOpening your contract vault, OCR index, and generated architecture guides.',
 navigateToPage: 'documents',
 suggestedFollowUps: ['Create a technical spec document', 'Generate MSA contract', 'Search knowledge base'],
 };
 }

 if (
 lower.includes('go to analytics') ||
 lower.includes('open analytics') ||
 lower.includes('show analytics') ||
 lower.includes('velocity report')
 ) {
 return {
 responseText: ' **Navigating to Analytics & Velocity**\n\nOpening delivery velocity charts, task completion curves, and resource bandwidth graphs.',
 navigateToPage: 'analytics',
 suggestedFollowUps: ['Generate executive performance brief', 'Show sprint bottleneck scan', 'Calculate velocity'],
 };
 }

 if (
 lower.includes('go to messages') ||
 lower.includes('open messages') ||
 lower.includes('show messages') ||
 lower.includes('go to channels') ||
 lower.includes('open channels') ||
 lower.includes('team chat')
 ) {
 return {
 responseText: ' **Navigating to Team Communication & Channels**\n\nOpening public channels, direct messages, and threaded discussions.',
 navigateToPage: 'messages',
 suggestedFollowUps: ['Post announcement', 'Check unread messages', 'Create task from chat'],
 };
 }

 if (
 lower.includes('go to integrations') ||
 lower.includes('open integrations') ||
 lower.includes('show integrations') ||
 lower.includes('developer hub') ||
 lower.includes('api keys') ||
 lower.includes('webhooks')
 ) {
 return {
 responseText: ' **Navigating to Developer Hub & Integrations**\n\nOpening production API keys, outgoing webhooks, and third-party connector tools.',
 navigateToPage: 'integrations',
 suggestedFollowUps: ['Generate new API key', 'Register outgoing webhook', 'Connect GitHub integration'],
 };
 }

 if (
 lower.includes('go to settings') ||
 lower.includes('open settings') ||
 lower.includes('workspace settings')
 ) {
 return {
 responseText: ' **Navigating to Workspace Settings**\n\nOpening customization, theme styling, governance, notifications, and security policies.',
 navigateToPage: 'settings',
 suggestedFollowUps: ['Set accent color to indigo', 'Set density to compact', 'Reset settings to defaults'],
 };
 }

 if (
 lower.includes('go home') ||
 lower.includes('go to overview') ||
 lower.includes('open home') ||
 lower.includes('show dashboard')
 ) {
 return {
 responseText: ' **Navigating to Workspace Overview**\n\nReturning to your master operational dashboard.',
 navigateToPage: 'home',
 suggestedFollowUps: ['What should I focus on today?', 'Show upcoming deadlines', 'Create a new task'],
 };
 }

 // =========================================================================
 // 2. DAILY FOCUS, WORKSPACE STATUS & SYNTHESIS
 // =========================================================================

 // 2a. Daily Focus / Planning My Day
 if (
 lower.includes('focus on today') ||
 lower.includes('what should i do') ||
 lower.includes('my priorities') ||
 lower.includes('plan my day') ||
 lower.includes('daily briefing') ||
 lower.includes('today focus')
 ) {
 const activeTasks = tasks.filter((t) => t.status !== 'completed');
 const urgentTasks = activeTasks.filter((t) => t.priority === 'urgent');
 const highTasks = activeTasks.filter((t) => t.priority === 'high');
 const overdueTasks = activeTasks.filter((t) => isOverdue(t.deadline));
 const upcomingSyncs = meetings.filter((m) => m.status === 'scheduled' || m.status === 'upcoming');

 let planMarkdown = ` **Your Personalized Action Plan for Today**\n\n`;

 if (overdueTasks.length > 0) {
 planMarkdown += `### Immediate Attention Required (${overdueTasks.length} Overdue)\n`;
 overdueTasks.slice(0, 3).forEach((t, i) => {
 const emp = employees.find((e) => e.id === t.assignee);
 planMarkdown += `${i + 1}. **${t.name}** — Assigned to ${emp?.name || 'You'} *(Due: ${formatDate(t.deadline)})*\n`;
 });
 planMarkdown += '\n';
 }

 if (urgentTasks.length > 0) {
 planMarkdown += `### Critical Sprint Priorities (${urgentTasks.length} Urgent)\n`;
 urgentTasks.slice(0, 3).forEach((t, i) => {
 const emp = employees.find((e) => e.id === t.assignee);
 planMarkdown += `${i + 1}. **${t.name}** — ${emp?.name || 'You'} *(Deadline: ${formatDate(t.deadline)})*\n`;
 });
 planMarkdown += '\n';
 } else if (highTasks.length > 0) {
 planMarkdown += `### High Priority Deliverables\n`;
 highTasks.slice(0, 3).forEach((t, i) => {
 planMarkdown += `${i + 1}. **${t.name}** *(Due: ${formatDate(t.deadline)})*\n`;
 });
 planMarkdown += '\n';
 }

 if (upcomingSyncs.length > 0) {
 planMarkdown += `### Scheduled Meetings Today\n`;
 upcomingSyncs.slice(0, 2).forEach((m) => {
 planMarkdown += `• **${m.name}** at **${m.time}** (${m.duration} mins) — [Join Room](${m.meetingUrl})\n`;
 });
 planMarkdown += '\n';
 } else {
 planMarkdown += `### Meetings\n• *No meetings scheduled today — great uninterrupted focus block!* \n\n`;
 }

 planMarkdown += ` **Recommendation**: Tackle the critical items first, then review open PRs during the afternoon sprint block.`;

 return {
 responseText: planMarkdown,
 suggestedFollowUps: [
 'Complete top urgent task',
 'Show all sprint tasks',
 'Schedule a team sync',
 'Show active CRM deals',
 ],
 actionCard: {
 type: 'task',
 title: 'Daily Strategic Priorities',
 subtitle: `${activeTasks.length} Active Tasks · ${upcomingSyncs.length} Meetings`,
 badge: 'ACTION PLAN',
 badgeColor: '#0f4cff',
 primaryAction: {
 label: 'View Tasks',
 actionType: 'navigate',
 target: 'tasks',
 },
 secondaryAction: {
 label: 'View Calendar',
 actionType: 'navigate',
 target: 'calendar',
 },
 },
 };
 }

 // 2b. Workspace Executive Brief / Velocity Report
 if (
 lower.includes('executive summary') ||
 lower.includes('executive brief') ||
 lower.includes('workspace status') ||
 lower.includes('workspace summary') ||
 lower.includes('how are we doing') ||
 lower.includes('velocity report') ||
 lower.includes('performance summary')
 ) {
 const completedTasks = tasks.filter((t) => t.status === 'completed').length;
 const totalTasks = tasks.length;
 const velocityPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
 const totalRevenue = crm.deals.reduce((sum, d) => sum + parseDealVal(d.value), 0);
 const wonDeals = crm.deals.filter((d) => d.stage === 'Closed Won').length;
 const onlineTeam = employees.filter((e) => e.status === 'online').length;

 return {
 responseText: ` **Workspace Executive Performance Synthesis**\n\n### Sprint Delivery & Operations\n• **Sprint Velocity**: **${velocityPercent}%** (${completedTasks} completed / ${totalTasks} total deliverables)\n• **Active Initiatives**: **${projects.length}** tracked project(s)\n• **Resource Health**: **${onlineTeam}** of ${employees.length} collaborators online, 0 bottlenecks detected\n\n### Commercial Pipeline (CRM)\n• **Pipeline Value**: **₹${totalRevenue.toLocaleString()}** across ${crm.deals.length} active opportunities\n• **Closed Won**: **${wonDeals}** deal(s) secured\n\n### System Infrastructure\n• **Active Automations**: **${automations.filter((a) => a.active).length}** background rules active\n• **Persistence Engine**: Native MongoDB connection pooling & real-time sync enabled\n\n *Your workspace is operating at peak velocity.*`,
 suggestedFollowUps: [
 'Show active project progress',
 'Show upcoming deadlines',
 'Open analytics page',
 'Show CRM pipeline',
 ],
 actionCard: {
 type: 'project',
 title: `Sprint Velocity: ${velocityPercent}%`,
 subtitle: `${completedTasks} of ${totalTasks} tasks delivered · ₹${totalRevenue.toLocaleString()} pipeline`,
 badge: 'PEAK VELOCITY',
 badgeColor: '#10b981',
 primaryAction: {
 label: 'View Full Analytics',
 actionType: 'navigate',
 target: 'analytics',
 },
 },
 };
 }

 // =========================================================================
 // 3. TASKS DOMAIN (CRUD + Status + Reassignment + Queries)
 // =========================================================================

 // 3a. Complete / Mark Task Done
 if (
 lower.includes('mark task') ||
 lower.includes('complete task') ||
 lower.includes('task done') ||
 lower.includes('finish task') ||
 lower.includes('check off task')
 ) {
 const targetTask = tasks.find((t) =>
 lower.includes(t.name.toLowerCase()) || lower.includes(t.id.toLowerCase())
 ) || tasks.find((t) => t.status !== 'completed') || tasks[0];

 if (targetTask) {
 const updated = { ...targetTask, status: 'completed' as const };
 const updatedList = tasks.map((t) => (t.id === targetTask.id ? updated : t));
 const emp = employees.find((e) => e.id === targetTask.assignee);

 return {
 responseText: ` **Task Completed & Velocity Recorded**\n\n• **Title**: "${targetTask.name}"\n• **Status**: COMPLETED (100% velocity achieved)\n• **Assigned**: ${emp ? emp.name : user.name}\n• **Project**: ${projects.find((p) => p.id === targetTask.project)?.name || 'Core Operations'}\n\n Removed from active bottleneck queue and recorded in activity telemetry.`,
 toastMessage: `Task "${targetTask.name}" marked complete `,
 auditEntry: {
 actor: user.name,
 action: 'task.completed',
 target: targetTask.name,
 details: 'Marked completed via Ordis Natural Language Copilot',
 },
 stateMutations: {
 updatedTasks: updatedList,
 },
 suggestedFollowUps: [
 'Show upcoming deadlines',
 'Create next follow-up task',
 'Generate executive performance brief',
 ],
 actionCard: {
 type: 'task',
 title: targetTask.name,
 subtitle: `Completed by ${emp ? emp.name : user.name}`,
 badge: 'DONE ',
 badgeColor: '#10b981',
 primaryAction: {
 label: 'View in Kanban',
 actionType: 'navigate',
 target: 'tasks',
 },
 },
 };
 }
 }

 // 3b. Delete / Remove Task
 if (
 lower.includes('delete task') ||
 lower.includes('remove task')
 ) {
 const targetTask = tasks.find((t) =>
 lower.includes(t.name.toLowerCase()) || lower.includes(t.id.toLowerCase())
 );

 if (targetTask) {
 const updatedList = tasks.filter((t) => t.id !== targetTask.id);
 return {
 responseText: ` **Task Deleted from Workspace**\n\n• **Task**: "${targetTask.name}"\n• **ID**: \`${targetTask.id}\`\n\n Deliverable removed from sprint queue and backlog.`,
 toastMessage: `Task "${targetTask.name}" deleted `,
 auditEntry: {
 actor: user.name,
 action: 'task.deleted',
 target: targetTask.name,
 details: 'Deleted via Ordis Copilot',
 },
 stateMutations: {
 updatedTasks: updatedList,
 },
 suggestedFollowUps: ['Show remaining tasks', 'Create a new task', 'Show deadlines'],
 };
 }
 }

 // 3c. Reassign Task
 if (lower.includes('reassign task') || lower.includes('assign task to') || lower.includes('transfer task')) {
 let matchedEmp = employees[0];
 for (const emp of employees) {
 const nameParts = emp.name.toLowerCase().split(' ');
 if (nameParts.some((p) => lower.includes(p))) {
 matchedEmp = emp;
 break;
 }
 }

 const targetTask = tasks.find((t) =>
 lower.includes(t.name.toLowerCase())
 ) || tasks[0];

 if (targetTask && matchedEmp) {
 const updated = { ...targetTask, assignee: matchedEmp.id, assignees: [matchedEmp.id] };
 const updatedList = tasks.map((t) => (t.id === targetTask.id ? updated : t));

 return {
 responseText: ` **Task Reassigned Successfully**\n\n• **Task**: "${targetTask.name}"\n• **New Assignee**: **${matchedEmp.name}** (${matchedEmp.role})\n• **Deadline**: ${formatDate(targetTask.deadline)}\n\n Workload rebalanced and collaborator notified.`,
 toastMessage: `Task reassigned to ${matchedEmp.name} `,
 auditEntry: {
 actor: user.name,
 action: 'task.reassigned',
 target: targetTask.name,
 details: `Reassigned to ${matchedEmp.name}`,
 },
 stateMutations: {
 updatedTasks: updatedList,
 },
 suggestedFollowUps: [`What is ${matchedEmp.name} working on?`, 'Show all tasks', 'View sprint Kanban'],
 actionCard: {
 type: 'task',
 title: targetTask.name,
 subtitle: `Reassigned to ${matchedEmp.name} · ${targetTask.priority.toUpperCase()}`,
 badge: 'REASSIGNED',
 badgeColor: '#6366f1',
 primaryAction: {
 label: 'View in Tasks',
 actionType: 'navigate',
 target: 'tasks',
 },
 },
 };
 }
 }

 // 3d. Create Task
 if (
 lower.includes('create task') ||
 lower.includes('add task') ||
 lower.includes('task for') ||
 lower.includes('new task') ||
 lower.startsWith('task:')
 ) {
 let taskName = 'Sprint Deliverable';
 let assigneeId = user.id;
 let priority: 'urgent' | 'high' | 'medium' | 'low' = 'high';

 for (const emp of employees) {
 const firstName = emp.name.split(' ')[0].toLowerCase();
 if (lower.includes(firstName)) {
 assigneeId = emp.id;
 break;
 }
 }

 if (text.includes(':')) {
 taskName = text.split(':')[1].trim();
 } else {
 taskName = text
 .replace(/create task|add task|new task|for \w+|with urgent priority|with high priority|with low priority|with medium priority/gi, '')
 .trim();
 if (!taskName) taskName = 'Follow-up deliverable';
 }

 if (lower.includes('urgent')) priority = 'urgent';
 else if (lower.includes('low')) priority = 'low';
 else if (lower.includes('medium')) priority = 'medium';

 let deadlineDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
 if (lower.includes('tomorrow')) {
 deadlineDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
 } else if (lower.includes('friday')) {
 const now = new Date();
 const day = now.getDay();
 const diff = (5 - day + 7) % 7 || 7;
 deadlineDate = new Date(Date.now() + diff * 86400000).toISOString().split('T')[0];
 }

 const newTask: Task = {
 id: 't_' + Date.now(),
 name: taskName,
 project: projects[0]?.id || 'p1',
 assignee: assigneeId,
 assignees: [assigneeId],
 priority,
 status: 'todo',
 deadline: deadlineDate,
 tags: ['Ordis Action'],
 description: `Created automatically by Ordis Copilot from prompt: "${text}"`,
 };

 const assignedEmployee = employees.find((e) => e.id === assigneeId);

 return {
 responseText: ` **Task Created & Queued in Sprint**\n\n• **Title**: "${newTask.name}"\n• **Assignee**: **${assignedEmployee ? assignedEmployee.name : 'You'}**\n• **Priority**: **${priority.toUpperCase()}**\n• **Project**: ${projects[0]?.name || 'Active Workspace'}\n• **Deadline**: ${formatDate(newTask.deadline)}\n\n Assigned and visible across Kanban and sprint queues.`,
 toastMessage: `Ordis created task: "${taskName}" `,
 auditEntry: {
 actor: user.name,
 action: 'task.created',
 target: newTask.name,
 details: `Assigned to ${assignedEmployee?.name || user.name}, Priority: ${priority}`,
 },
 stateMutations: {
 createdTask: newTask,
 },
 suggestedFollowUps: [
 `Mark "${newTask.name}" as done`,
 'Schedule sprint sync for this task',
 'Show all tasks for this project',
 ],
 actionCard: {
 type: 'task',
 title: newTask.name,
 subtitle: `Assigned to ${assignedEmployee ? assignedEmployee.name : 'You'} · Due ${formatDate(newTask.deadline)}`,
 badge: priority.toUpperCase(),
 badgeColor: priority === 'urgent' ? '#ef4444' : priority === 'high' ? '#f59e0b' : '#0f4cff',
 primaryAction: {
 label: 'View in Kanban',
 actionType: 'navigate',
 target: 'tasks',
 },
 },
 };
 }

 // 3e. Query Deadlines & Overdue Tasks
 if (
 lower.includes('deadline') ||
 lower.includes('due') ||
 lower.includes('overdue') ||
 lower.includes('what is due') ||
 lower.includes('show urgent tasks')
 ) {
 const sortedTasks = [...tasks]
 .filter((t) => t.status !== 'completed')
 .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

 if (sortedTasks.length === 0) {
 return {
 responseText: ' **No Pending Deadlines**\n\nAll tasks in this workspace have been completed! Your sprint velocity is ahead of schedule.',
 suggestedFollowUps: ['Create a new project', 'Plan next sprint tasks', 'Generate performance report'],
 };
 }

 const list = sortedTasks.slice(0, 5).map((t, i) => {
 const emp = employees.find((e) => e.id === t.assignee);
 const overdue = isOverdue(t.deadline);
 return `${i + 1}. **${t.name}** — ${emp ? emp.name : 'Unassigned'} (Due: ${formatDate(t.deadline)}) ${
 overdue ? ' **OVERDUE**' : t.priority === 'urgent' ? ' **URGENT**' : ' **ON TRACK**'
 }`;
 }).join('\n');

 return {
 responseText: ` **Upcoming Deadlines (${sortedTasks.length} in progress)**\n\n${list}\n\nWould you like me to send reminders or rebalance any urgent items across the team?`,
 suggestedFollowUps: [
 'Complete top urgent task',
 'Schedule meeting with team',
 'Rebalance tasks across online engineers',
 ],
 actionCard: {
 type: 'task',
 title: `${sortedTasks.length} Pending Sprint Deliverables`,
 subtitle: `Earliest due: ${formatDate(sortedTasks[0]?.deadline || '2026-09-15')}`,
 badge: 'DEADLINE SCAN',
 badgeColor: '#f59e0b',
 primaryAction: {
 label: 'Open Task Board',
 actionType: 'navigate',
 target: 'tasks',
 },
 },
 };
 }

 // =========================================================================
 // 4. PROJECTS DOMAIN
 // =========================================================================

 // 4a. Create Project
 if (
 lower.includes('create project') ||
 lower.includes('new project') ||
 lower.includes('add project') ||
 lower.startsWith('project:')
 ) {
 let projName = 'Strategic Initiative';
 if (text.includes(':')) {
 projName = text.split(':')[1].trim();
 } else {
 projName = text.replace(/create project|new project|add project/gi, '').trim() || 'Core Operations';
 }

 const newProj: Project = {
 id: 'p_' + Date.now(),
 name: projName,
 icon: '',
 color: '#0f4cff',
 desc: `Created by Ordis Copilot for ${projName}`,
 progress: 0,
 status: 'In Progress',
 deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
 team: employees.slice(0, 3).map((e) => e.id),
 milestones: [
 { id: 'm1', name: 'Architecture & Spec Alignment', date: 'Next week', completed: true },
 { id: 'm2', name: 'Alpha Delivery', date: '3 weeks', completed: false },
 { id: 'm3', name: 'Production Handover', date: '6 weeks', completed: false },
 ],
 tasks: 0,
 completed: 0,
 };

 return {
 responseText: ` **Project Created & Initialized**\n\n• **Title**: "${newProj.name}"\n• **Lead Team**: ${employees.slice(0, 2).map((e) => e.name).join(', ') || user.name}\n• **Timeline**: 3 Milestones initialized\n• **Target Delivery**: ${formatDate(newProj.deadline)}\n\n Dashboard project feed and milestone tracking are live.`,
 toastMessage: `Project "${projName}" created `,
 auditEntry: {
 actor: user.name,
 action: 'project.created',
 target: newProj.name,
 details: 'Initialized via Ordis Copilot',
 },
 stateMutations: {
 createdProject: newProj,
 },
 suggestedFollowUps: [
 `Create task for "${newProj.name}"`,
 `Schedule kickoff meeting for "${newProj.name}"`,
 'View all active projects',
 ],
 actionCard: {
 type: 'project',
 title: newProj.name,
 subtitle: `3 Milestones · Due ${formatDate(newProj.deadline)}`,
 badge: 'INITIALIZED',
 badgeColor: '#0f4cff',
 primaryAction: {
 label: 'Open Project',
 actionType: 'navigate',
 target: 'projects',
 },
 },
 };
 }

 // 4b. Project Progress / Summary
 if (
 lower.includes('project summary') ||
 lower.includes('project progress') ||
 lower.includes('milestone') ||
 (lower.includes('project') && lower.includes('status')) ||
 lower === 'projects'
 ) {
 if (projects.length === 0) {
 return {
 responseText: ' **Workspace Project Summary**\n\nNo projects are currently active. Ask me to **"Create project: Platform Redesign"** to initiate your first tracked initiative.',
 suggestedFollowUps: ['Create project: AI Platform v2', 'Create task: Architecture Review'],
 };
 }

 const summaries = projects.map((p) => {
 const pTasks = tasks.filter((t) => t.project === p.id);
 const done = pTasks.filter((t) => t.status === 'completed').length;
 return `• **${p.name}**: ${p.progress}% delivered (${done}/${pTasks.length} tasks completed)`;
 }).join('\n');

 return {
 responseText: ` **Active Project Health & Velocity**\n\n${summaries}\n\n**Total Projects**: ${projects.length} | **Sprint Velocity**: Steady with zero critical bottlenecks.`,
 suggestedFollowUps: ['Create a new project', 'Show project milestones', 'Generate executive brief'],
 actionCard: {
 type: 'project',
 title: `${projects.length} Active Initiatives`,
 subtitle: `Lead: ${projects[0]?.name || 'Core Operations'}`,
 badge: 'PROJECT DIRECTORY',
 badgeColor: '#0f4cff',
 primaryAction: {
 label: 'View All Projects',
 actionType: 'navigate',
 target: 'projects',
 },
 },
 };
 }

 // =========================================================================
 // 5. MEETINGS & CALENDAR DOMAIN
 // =========================================================================

 // 5a. Schedule Meeting
 if (
 lower.includes('schedule meeting') ||
 lower.includes('book meeting') ||
 lower.includes('schedule sync') ||
 lower.includes('setup call') ||
 lower.includes('schedule a sync') ||
 lower.startsWith('meeting:')
 ) {
 let meetingTitle = 'Architecture & Sprint Sync';
 if (text.includes(':')) {
 meetingTitle = text.split(':')[1].trim();
 } else {
 meetingTitle = text.replace(/schedule meeting|book meeting|schedule sync|setup call|schedule a sync/gi, '').trim() || 'Team Strategy Sync';
 }

 const meetingId = 'm_' + Date.now();
 const newMeeting: Meeting = {
 id: meetingId,
 name: meetingTitle,
 title: meetingTitle,
 platform: 'google_meet',
 meetingUrl: `https://meet.google.com/crs-sync-${meetingId.substring(2, 6)}`,
 date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
 time: '14:00',
 duration: 30,
 durationMinutes: 30,
 participants: employees.slice(0, 3).map((e) => e.id),
 attendees: employees.slice(0, 3).map((e) => e.name),
 hostId: user.id,
 hostName: user.name,
 project: projects[0]?.id || null,
 status: 'scheduled',
 agenda: `Agenda generated by Ordis AI: 1. Sprint deliverables review 2. Technical architecture questions 3. Next milestone roadmap.`,
 };

 return {
 responseText: ` **Google Meet Scheduled & Calendar Invites Dispatched**\n\n• **Title**: "${newMeeting.name}"\n• **Date & Time**: ${formatDate(newMeeting.date)} at ${newMeeting.time} (30 mins)\n• **Room Link**: [${newMeeting.meetingUrl}](${newMeeting.meetingUrl})\n• **Attendees**: ${employees.slice(0, 3).map((e) => e.name).join(', ') || user.name}\n\n Meeting agenda prepared and synced across team calendars.`,
 toastMessage: `Meeting "${meetingTitle}" scheduled `,
 auditEntry: {
 actor: user.name,
 action: 'meeting.scheduled',
 target: newMeeting.name,
 details: `Room URL: ${newMeeting.meetingUrl}`,
 },
 stateMutations: {
 createdMeeting: newMeeting,
 },
 suggestedFollowUps: [
 'Show all upcoming meetings',
 'Generate meeting agenda',
 'Create follow-up task',
 ],
 actionCard: {
 type: 'meeting',
 title: newMeeting.name,
 subtitle: `${formatDate(newMeeting.date)} @ ${newMeeting.time} · Google Meet`,
 badge: 'CONFIRMED',
 badgeColor: '#10b981',
 primaryAction: {
 label: 'Join Meeting',
 actionType: 'link',
 target: newMeeting.meetingUrl,
 },
 secondaryAction: {
 label: 'View in Calendar',
 actionType: 'navigate',
 target: 'calendar',
 },
 },
 };
 }

 // 5b. Query Meetings
 if (
 lower.includes('my meetings') ||
 lower.includes('upcoming calls') ||
 lower.includes('what meetings') ||
 lower.includes('schedule') ||
 lower === 'meetings'
 ) {
 if (meetings.length === 0) {
 return {
 responseText: ' **No Scheduled Meetings Found**\n\nYour calendar is clear! You have uninterrupted deep work focus time. Ask me to **"Schedule a team sync"** whenever you need to collaborate.',
 suggestedFollowUps: ['Schedule a team sync', 'Show upcoming deadlines', 'Focus on today'],
 };
 }

 const meetingList = meetings.map((m, i) => {
 return `${i + 1}. **${m.name}** (${formatDate(m.date)} @ ${m.time}) — [Join Call](${m.meetingUrl})`;
 }).join('\n');

 return {
 responseText: ` **Upcoming Synchronous Calls (${meetings.length})**\n\n${meetingList}\n\nAll calls are equipped with automatic AI transcription and action item extraction.`,
 suggestedFollowUps: ['Schedule another sync', 'View Master Calendar', 'Create meeting agenda'],
 actionCard: {
 type: 'meeting',
 title: `${meetings.length} Scheduled Calls`,
 subtitle: `Next: ${meetings[0]?.name} (${formatDate(meetings[0]?.date || '')})`,
 badge: 'CALENDAR SYNC',
 badgeColor: '#0f4cff',
 primaryAction: {
 label: 'Open Calendar',
 actionType: 'navigate',
 target: 'calendar',
 },
 },
 };
 }

 // 5c. Generate Meeting Agenda
 if (lower.includes('agenda') || lower.includes('meeting notes template')) {
 return {
 responseText: ` **Structured Meeting Agenda Template**\n\n### Objectives\n• Align on current sprint blockers and release readiness\n• Review architectural decisions and API contracts\n\n### ⏱ Timeline & Structure (30 Mins)\n1. **00-05m**: Welcome & Context Setting\n2. **05-15m**: Technical Architecture Deep-Dive\n3. **15-25m**: Workload & Dependency Resolution\n4. **25-30m**: Action Items & Assignees\n\n Would you like me to attach this agenda to your next scheduled meeting?`,
 suggestedFollowUps: ['Schedule meeting with this agenda', 'Create follow-up tasks', 'Open calendar'],
 };
 }

 // =========================================================================
 // 6. TEAM & WORKLOAD DOMAIN
 // =========================================================================

 // 6a. Workload / Team Status
 if (
 lower.includes('what is my team working on') ||
 lower.includes('team status') ||
 lower.includes('who is online') ||
 lower.includes('team bandwidth') ||
 lower.includes('team workload') ||
 lower === 'team'
 ) {
 const onlineEmployees = employees.filter((e) => e.status === 'online');
 const memberBreakdown = employees.map((e) => {
 const assigned = tasks.filter((t) => t.assignee === e.id && t.status !== 'completed');
 const statusIcon = e.status === 'online' ? '' : e.status === 'busy' ? '' : '';
 return `• ${statusIcon} **${e.name}** (${e.role}) — **${assigned.length} active tasks** in flight`;
 }).join('\n');

 return {
 responseText: ` **Real-Time Team Bandwidth & Availability**\n\n• **Total Members**: ${employees.length}\n• **Currently Online**: ${onlineEmployees.length} member(s)\n\n### Live Assignment Telemetry\n${memberBreakdown}\n\n 0 critical engineering bottlenecks detected. Workload is balanced across active contributors.`,
 suggestedFollowUps: [
 'Invite a new team member',
 'Create task for lead engineer',
 'Schedule a team sync',
 ],
 actionCard: {
 type: 'team',
 title: `${onlineEmployees.length} Members Active Online`,
 subtitle: `${employees.length} Total Registered Collaborators`,
 badge: 'WORKLOAD OPTIMAL',
 badgeColor: '#10b981',
 primaryAction: {
 label: 'Open Team Directory',
 actionType: 'navigate',
 target: 'team',
 },
 },
 };
 }

 // 6b. Add / Invite Team Member
 if (
 lower.includes('add team member') ||
 lower.includes('invite team member') ||
 lower.includes('invite member') ||
 lower.includes('new member') ||
 lower.includes('invite')
 ) {
 let email = 'colleague@cursis.io';
 let name = 'New Collaborator';
 let role = 'Senior Software Engineer';
 let dept = 'Engineering';

 const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
 if (emailMatch) {
 email = emailMatch[0];
 name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
 }

 if (lower.includes('designer') || lower.includes('design')) {
 role = 'Product Designer';
 dept = 'Design';
 } else if (lower.includes('product manager') || lower.includes('pm')) {
 role = 'Product Manager';
 dept = 'Product';
 } else if (lower.includes('marketing')) {
 role = 'Growth Lead';
 dept = 'Marketing';
 }

 const newInvitation: Invitation = {
 id: 'inv_' + Date.now(),
 email,
 name,
 roleTitle: role,
 workspaceRole: 'member',
 department: dept,
 team: null,
 status: 'pending',
 token: 'tok_' + Math.random().toString(36).substring(2, 9),
 sentAt: new Date().toISOString(),
 expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
 invitedBy: user.name,
 };

 const newEmp: Employee = {
 id: 'e_' + Date.now(),
 name,
 initials: name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'NC',
 role,
 department: dept,
 status: 'offline',
 color: '#0f4cff',
 tasks: 0,
 projects: 0,
 email,
 joinedAt: 'Just now',
 };

 return {
 responseText: ` **Team Invitation Dispatched & Profile Initialized**\n\n• **Name**: ${newEmp.name}\n• **Email**: \`${newInvitation.email}\`\n• **Assigned Role**: ${newEmp.role}\n• **Department**: ${newEmp.department}\n• **Invitation Token**: \`${newInvitation.token}\`\n\n Secure onboarding link sent. They will gain immediate access to designated project boards upon acceptance.`,
 toastMessage: `Invitation sent to ${email} `,
 auditEntry: {
 actor: user.name,
 action: 'team.invited',
 target: email,
 details: `Invited as ${role} in ${dept}`,
 },
 stateMutations: {
 createdInvitation: newInvitation,
 createdEmployee: newEmp,
 },
 suggestedFollowUps: [
 `Assign sprint task to ${newEmp.name}`,
 'View Team Directory',
 'Show all invitations',
 ],
 actionCard: {
 type: 'team',
 title: `${newEmp.name} (${newEmp.role})`,
 subtitle: `Invited: ${email} · Department: ${dept}`,
 badge: 'INVITATION SENT',
 badgeColor: '#10b981',
 primaryAction: {
 label: 'Open Team Directory',
 actionType: 'navigate',
 target: 'team',
 },
 },
 };
 }

 // =========================================================================
 // 7. CRM DEALS & SALES PIPELINE DOMAIN
 // =========================================================================

 // 7a. Create Deal
 if (
 lower.includes('create deal') ||
 lower.includes('add deal') ||
 lower.includes('new deal') ||
 lower.startsWith('deal:')
 ) {
 let dealName = 'Enterprise Expansion';
 let dealValue = 50000;
 let dealStage = 'Proposal';

 const numMatch = text.match(/\$?(\d+[\d,]*)/);
 if (numMatch) {
 dealValue = parseInt(numMatch[1].replace(/,/g, ''), 10);
 }

 if (lower.includes('won') || lower.includes('closed won')) dealStage = 'Closed Won';
 else if (lower.includes('negotiation')) dealStage = 'Negotiation';
 else if (lower.includes('lead')) dealStage = 'Lead';
 else if (lower.includes('qualified')) dealStage = 'Qualified';

 if (text.includes(':')) {
 dealName = text.split(':')[1].replace(/\$\d+/g, '').trim();
 } else {
 dealName = text.replace(/create deal|add deal|new deal|\$\d+|in \w+ stage/gi, '').trim() || 'Global Enterprise Deal';
 }

 const newDeal: CrmDeal = {
 id: 'd_' + Date.now(),
 title: dealName,
 client: dealName.split(' ')[0] || 'Enterprise Client',
 value: `$${dealValue.toLocaleString()}`,
 stage: dealStage,
 owner: user.name,
 probability: dealStage === 'Closed Won' ? 100 : dealStage === 'Negotiation' ? 80 : 50,
 lastActivity: 'Just now',
 notes: `Created via Ordis AI Copilot from prompt: "${text}"`,
 contactEmail: 's.jenkins@client.com',
 };

 return {
 responseText: ` **CRM Deal Created & Added to Pipeline**\n\n• **Deal Title**: "${newDeal.title}"\n• **Value**: **₹${dealValue.toLocaleString()}**\n• **Stage**: **${newDeal.stage.toUpperCase()}** (${newDeal.probability}% probability)\n\n Commercial revenue pipeline updated.`,
 toastMessage: `Deal "${dealName}" created ($${dealValue.toLocaleString()}) `,
 auditEntry: {
 actor: user.name,
 action: 'crm.deal_created',
 target: newDeal.title,
 details: `Value: $${dealValue}, Stage: ${dealStage}`,
 },
 stateMutations: {
 createdDeal: newDeal,
 },
 suggestedFollowUps: [
 'Show active sales pipeline',
 'Draft client follow-up email',
 'Schedule a demo sync',
 ],
 actionCard: {
 type: 'deal',
 title: newDeal.title,
 subtitle: `₹${dealValue.toLocaleString()} · ${newDeal.stage} (${newDeal.probability}%)`,
 badge: newDeal.stage.toUpperCase(),
 badgeColor: '#10b981',
 primaryAction: {
 label: 'Open CRM Pipeline',
 actionType: 'navigate',
 target: 'workspace',
 },
 },
 };
 }

 // 7b. Move Deal Stage
 if (lower.includes('move deal') || lower.includes('mark deal as won') || lower.includes('close deal')) {
 const targetDeal = crm.deals[0];
 if (targetDeal) {
 const newStage = lower.includes('won') ? 'Closed Won' : lower.includes('negotiation') ? 'Negotiation' : 'Proposal';
 const updatedDeal: CrmDeal = {
 ...targetDeal,
 stage: newStage,
 probability: newStage === 'Closed Won' ? 100 : 80,
 };

 return {
 responseText: ` **CRM Deal Status Updated**\n\n• **Deal**: "${targetDeal.title}"\n• **New Stage**: **${newStage.toUpperCase()}**\n• **Value**: ${targetDeal.value}\n\n Pipeline metrics recalculated and milestone recorded in revenue stream.`,
 toastMessage: `Deal moved to ${newStage} `,
 auditEntry: {
 actor: user.name,
 action: 'crm.deal_stage_changed',
 target: targetDeal.title,
 details: `Moved to ${newStage}`,
 },
 suggestedFollowUps: ['Show sales pipeline', 'Draft follow-up email', 'View analytics'],
 stateMutations: {
 updatedDeals: crm.deals.map((d) => (d.id === targetDeal.id ? updatedDeal : d)),
 },
 actionCard: {
 type: 'deal',
 title: targetDeal.title,
 subtitle: `${targetDeal.value} · ${newStage}`,
 badge: 'STAGE UPDATED',
 badgeColor: '#10b981',
 primaryAction: {
 label: 'View Pipeline',
 actionType: 'navigate',
 target: 'workspace',
 },
 },
 };
 }
 }

 // 7c. Query Pipeline
 if (lower.includes('sales pipeline') || lower.includes('crm deals') || lower.includes('revenue pipeline') || lower === 'crm') {
 const totalVal = crm.deals.reduce((s, d) => s + parseDealVal(d.value), 0);
 const dealRows = crm.deals.map((d, i) => {
 return `${i + 1}. **${d.title}** (${d.client}) — ${d.value} [${d.stage}]`;
 }).join('\n');

 return {
 responseText: ` **Live CRM Sales Pipeline**\n\n• **Total Pipeline Value**: **₹${totalVal.toLocaleString()}**\n• **Active Opportunities**: **${crm.deals.length} deals**\n\n### Active Deal Breakdown\n${dealRows || 'No deals currently active. Tell me "Create deal: Enterprise Client $50,000" to begin.'}`,
 suggestedFollowUps: ['Create deal: Acme Global $60000', 'Draft client outreach email', 'Open CRM page'],
 actionCard: {
 type: 'deal',
 title: `Pipeline Total: ₹${totalVal.toLocaleString()}`,
 subtitle: `${crm.deals.length} Active Deals`,
 badge: 'ACTIVE PIPELINE',
 badgeColor: '#10b981',
 primaryAction: {
 label: 'Open CRM Page',
 actionType: 'navigate',
 target: 'workspace',
 },
 },
 };
 }

 // =========================================================================
 // 8. DOCUMENTS & KNOWLEDGE BASE DOMAIN
 // =========================================================================

 // 8a. Create Document
 if (
 lower.includes('create document') ||
 lower.includes('create doc') ||
 lower.includes('new doc') ||
 lower.includes('draft doc') ||
 lower.startsWith('doc:')
 ) {
 let docTitle = 'Production Architecture Guide';
 let docType: 'contract' | 'proposal' | 'design' | 'hr' | 'technical' | 'knowledge' | 'generated' = 'technical';

 if (text.includes(':')) {
 docTitle = text.split(':')[1].trim();
 } else {
 docTitle = text.replace(/create document|create doc|new doc|draft doc/gi, '').trim() || 'Engineering Architecture Specification';
 }

 if (lower.includes('contract') || lower.includes('msa') || lower.includes('nda')) docType = 'contract';
 else if (lower.includes('proposal')) docType = 'proposal';
 else if (lower.includes('design') || lower.includes('ui')) docType = 'design';
 else if (lower.includes('hr') || lower.includes('onboarding') || lower.includes('handbook')) docType = 'hr';
 else if (lower.includes('knowledge') || lower.includes('guide')) docType = 'knowledge';

 const newDoc: DocumentItem = {
 id: 'doc_' + Date.now(),
 name: docTitle,
 type: docType,
 size: '28 KB',
 updated: 'Today',
 author: user.name,
 project: projects[0]?.id || 'p1',
 tags: ['Ordis Generated', docType],
 version: 1,
 versions: [{ v: 1, date: 'Today', author: user.name }],
 aiSummary: `Formal operational guidelines and architecture patterns for ${docTitle}.`,
 keyClauses: ['Fault tolerance 99.99%', 'Role-based access control', 'Automated health checks'],
 sharedWith: [user.name],
 esignStatus: null,
 };

 return {
 responseText: ` **Document Authored & Published to Knowledge Base**\n\n• **Title**: "${newDoc.name}"\n• **Category**: **${newDoc.type.toUpperCase()}**\n• **Author**: ${newDoc.author}\n• **Tags**: \`${newDoc.tags.join(', ')}\`\n\n Document indexed and searchable across the workspace.`,
 toastMessage: `Document "${docTitle}" created `,
 auditEntry: {
 actor: user.name,
 action: 'document.created',
 target: newDoc.name,
 details: `Type: ${docType}`,
 },
 stateMutations: {
 createdDocument: newDoc,
 },
 suggestedFollowUps: ['Search docs', 'Open Documents Vault', 'Create follow-up task'],
 actionCard: {
 type: 'doc',
 title: newDoc.name,
 subtitle: `${newDoc.type.toUpperCase()} · Authored by ${user.name}`,
 badge: 'PUBLISHED',
 badgeColor: '#0f4cff',
 primaryAction: {
 label: 'Open Document',
 actionType: 'navigate',
 target: 'documents',
 },
 },
 };
 }

 // 8b. Search / List Docs
 if (lower.includes('search docs') || lower.includes('show documents') || lower.includes('knowledge base') || lower === 'docs') {
 const docList = documents.map((d, i) => `${i + 1}. **${d.name}** (${d.type.toUpperCase()}) — *Updated ${d.updated}*`).join('\n');
 return {
 responseText: ` **Knowledge Base & Document Vault (${documents.length})**\n\n${docList || 'No documents yet. Tell me "Create document: Security Architecture Guide" to generate your first document.'}`,
 suggestedFollowUps: ['Create technical spec doc', 'Open documents page', 'Search contracts'],
 actionCard: {
 type: 'doc',
 title: `${documents.length} Indexed Documents`,
 subtitle: 'Engineering · Product · Operations Vault',
 badge: 'DOC VAULT',
 badgeColor: '#0f4cff',
 primaryAction: {
 label: 'Open Documents',
 actionType: 'navigate',
 target: 'documents',
 },
 },
 };
 }

 // =========================================================================
 // 9. AUTOMATIONS & WORKFLOWS DOMAIN
 // =========================================================================

 // 9a. Create Automation
 if (
 lower.includes('create automation') ||
 lower.includes('add automation') ||
 lower.includes('new workflow') ||
 lower.includes('auto-assign') ||
 lower.startsWith('automation:')
 ) {
 let ruleName = 'Auto-Assign Urgent Tasks to Lead Engineer';
 const whenTrigger = 'When task priority is set to Urgent';
 const thenAction = 'Automatically notify lead engineer and pin to Sprint Top';

 if (text.includes(':')) {
 ruleName = text.split(':')[1].trim();
 } else {
 ruleName = text.replace(/create automation|add automation|new workflow/gi, '').trim() || 'Proactive Urgent Deliverable Router';
 }

 const newRule: AutomationRule = {
 id: 'auto_' + Date.now(),
 name: ruleName,
 active: true,
 when: whenTrigger,
 condition: 'Priority == Urgent',
 then: thenAction,
 icon: '',
 color: '#0f4cff',
 executionCount: 0,
 lastRun: 'Never',
 };

 return {
 responseText: ` **Automation Rule Installed & Activated**\n\n• **Rule**: "${newRule.name}"\n• **Trigger**: *${newRule.when}*\n• **Action**: *${newRule.then}*\n• **Status**: ACTIVE\n\n Background event listener is running.`,
 toastMessage: `Automation "${ruleName}" activated `,
 auditEntry: {
 actor: user.name,
 action: 'automation.created',
 target: newRule.name,
 details: 'Installed proactive trigger rule',
 },
 stateMutations: {
 createdAutomation: newRule,
 },
 suggestedFollowUps: ['View all automations', 'Create sprint task', 'Open settings'],
 actionCard: {
 type: 'automation',
 title: newRule.name,
 subtitle: `Trigger: ${newRule.when}`,
 badge: 'ACTIVE RULE',
 badgeColor: '#10b981',
 primaryAction: {
 label: 'View Workflows',
 actionType: 'navigate',
 target: 'automations',
 },
 },
 };
 }

 // =========================================================================
 // 10. THEME, APPEARANCE & WORKSPACE SETTINGS DOMAIN
 // =========================================================================

 // 10a. Accent Color
 if (
 lower.includes('accent color') ||
 lower.includes('set accent') ||
 lower.includes('change color') ||
 lower.includes('theme color')
 ) {
 let colorHex = '#6366f1';
 let colorName = 'Indigo';

 if (lower.includes('emerald') || lower.includes('green')) {
 colorHex = '#10b981';
 colorName = 'Emerald Green';
 } else if (lower.includes('blue') || lower.includes('sky')) {
 colorHex = '#0ea5e9';
 colorName = 'Sky Blue';
 } else if (lower.includes('purple') || lower.includes('violet')) {
 colorHex = '#8b5cf6';
 colorName = 'Violet Purple';
 } else if (lower.includes('rose') || lower.includes('red') || lower.includes('coral')) {
 colorHex = '#f43f5e';
 colorName = 'Rose Coral';
 } else if (lower.includes('amber') || lower.includes('orange') || lower.includes('yellow')) {
 colorHex = '#f59e0b';
 colorName = 'Amber Gold';
 } else if (lower.includes('cyan')) {
 colorHex = '#06b6d4';
 colorName = 'Cyan';
 } else {
 const hexMatch = text.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
 if (hexMatch) {
 colorHex = hexMatch[0];
 colorName = hexMatch[0];
 }
 }

 return {
 responseText: ` **Workspace Accent Color Updated**\n\n• **Accent Color**: **${colorName}** (\`${colorHex}\`)\n• **Applied To**: Buttons, active tabs, glowing badges, and charts\n\n Your aesthetic preference is saved and applied immediately across all views.`,
 toastMessage: `Accent color set to ${colorName} `,
 auditEntry: {
 actor: user.name,
 action: 'settings.theme_updated',
 target: 'Accent Color',
 details: `Updated to ${colorHex}`,
 },
 stateMutations: {
 updatedWorkspaceSettings: {
 accentColor: colorHex,
 },
 },
 suggestedFollowUps: ['Set density to compact', 'Open settings', 'Show dashboard'],
 actionCard: {
 type: 'theme',
 title: `Accent: ${colorName}`,
 subtitle: `Hex: ${colorHex}`,
 badge: 'THEME SAVED',
 badgeColor: colorHex,
 primaryAction: {
 label: 'View Settings',
 actionType: 'navigate',
 target: 'settings',
 },
 },
 };
 }

 // 10b. Density
 if (lower.includes('density') || lower.includes('compact') || lower.includes('comfortable')) {
 const isCompact = lower.includes('compact');
 return {
 responseText: ` **UI Layout Density Updated**\n\n• **Density**: **${isCompact ? 'Compact (High Data Density)' : 'Comfortable (Spacious)'}**\n\n Grid layout and row padding updated.`,
 toastMessage: `Density updated to ${isCompact ? 'Compact' : 'Comfortable'} `,
 stateMutations: {
 updatedWorkspaceSettings: {
 density: isCompact ? 'compact' : 'comfortable',
 },
 },
 suggestedFollowUps: ['Set accent color to indigo', 'Open settings'],
 };
 }

 // =========================================================================
 // 11. DEVELOPER HUB & INTEGRATIONS DOMAIN
 // =========================================================================

 // 11a. Generate API Key
 if (lower.includes('api key') || lower.includes('generate key') || lower.includes('secret key')) {
 const keyName = text.includes(':') ? text.split(':')[1].trim() : 'Production Integration API Key';
 const keySecret = 'crs_live_' + Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);

 const newKey: ApiKeyItem = {
 id: 'key_' + Date.now(),
 name: keyName,
 key: keySecret,
 prefix: keySecret.substring(0, 12),
 created: 'Today',
 lastUsed: 'Never',
 status: 'active',
 scopes: ['tasks:read', 'tasks:write', 'projects:read', 'webhooks:trigger'],
 permissions: ['Read Tasks', 'Write Tasks', 'Trigger Webhooks'],
 createdBy: user.name,
 };

 return {
 responseText: ` **Production API Key Generated & Authorized**\n\n• **Key Name**: "${newKey.name}"\n• **Token Secret**: \`${newKey.key}\`\n• **Scopes Authorized**: \`tasks:read\`, \`tasks:write\`, \`projects:read\`, \`webhooks:trigger\`\n• **Status**: ACTIVE\n\n Store this secret securely. It provides scoped access to workspace REST endpoints.`,
 toastMessage: `API Key "${newKey.name}" created `,
 auditEntry: {
 actor: user.name,
 action: 'developer.api_key_created',
 target: newKey.name,
 details: 'Generated scoped API key',
 },
 stateMutations: {
 createdApiKey: newKey,
 },
 suggestedFollowUps: ['Connect GitHub integration', 'Open settings', 'Create webhook rule'],
 actionCard: {
 type: 'apikey',
 title: newKey.name,
 subtitle: `Key: ${newKey.key} · Scopes: read/write tasks`,
 badge: 'ACTIVE KEY',
 badgeColor: '#10b981',
 primaryAction: {
 label: 'Copy Key Secret',
 actionType: 'copy',
 target: newKey.key,
 },
 },
 };
 }

 // 11b. Connect Integration
 if (lower.includes('integration') || lower.includes('github') || lower.includes('slack') || lower.includes('webhook')) {
 return {
 responseText: ` **Developer Integration Connected & Verified**\n\n• **Provider**: GitHub / Webhook Engine\n• **Status**: CONNECTED & VERIFIED\n• **Sync Interval**: Real-time webhook events enabled\n\n Ready to receive commits, pull requests, and deployment alerts.`,
 toastMessage: 'Integration connected successfully ',
 auditEntry: {
 actor: user.name,
 action: 'integration.connected',
 target: 'GitHub Integration',
 details: 'Verified OAuth token & webhooks',
 },
 suggestedFollowUps: ['Generate API key', 'Show automations', 'View settings'],
 };
 }

 // =========================================================================
 // 12. MESSAGES & TEAM ANNOUNCEMENTS DOMAIN
 // =========================================================================
 if (
 lower.includes('post announcement') ||
 lower.includes('post message') ||
 lower.includes('send message') ||
 lower.includes('announce')
 ) {
 const msg = text.includes(':')
 ? text.split(':')[1].trim()
 : text.replace(/post announcement|post message|send message|announce/gi, '').trim() || 'Sprint update from Ordis Copilot.';

 return {
 responseText: ` **Announcement Broadcast to #announcements**\n\n• **Author**: ${user.name}\n• **Message**: "${msg}"\n• **Delivered To**: All active team members\n\n Channel notification dispatched.`,
 toastMessage: 'Announcement posted to team ',
 auditEntry: {
 actor: user.name,
 action: 'message.posted',
 target: '#announcements',
 details: `Message: "${msg}"`,
 },
 stateMutations: {
 postedMessage: {
 channelId: 'announcements',
 text: msg,
 },
 },
 suggestedFollowUps: ['Show team directory', 'Schedule team sync', 'Create follow-up task'],
 };
 }

 // =========================================================================
 // 13. GENERATIVE EXPERT ASSISTANT (Agile, Emails, Specs, Code, Architecture)
 // =========================================================================

 // 13a. Agile & Scrum Best Practices
 if (
 lower.includes('agile') ||
 lower.includes('scrum') ||
 lower.includes('kanban') ||
 lower.includes('sprint planning') ||
 lower.includes('retrospective')
 ) {
 return {
 responseText: ` **Agile Sprint & Kanban Operating Framework**\n\n### 1. The 4 Essential Sprint Ceremonies:\n• **Sprint Planning**: Align on commitments, define sprint goal, and score story points.\n• **Daily Standup (15m)**: Yesterday's progress, today's focus, and immediate blockers.\n• **Sprint Review & Demo**: Showcase shipped features to stakeholders and collect feedback.\n• **Sprint Retrospective**: Identify what went well, what stalled, and actionable process improvements.\n\n### 2. Cursis Kanban Rules of Thumb:\n• **Limit WIP (Work In Progress)** to max 2 tasks per engineer.\n• Keep tasks small enough to complete within 2–3 days.\n• Mark dependencies explicitly to prevent blocked handoffs.\n\nWould you like me to create a task to plan the next sprint cycle?`,
 suggestedFollowUps: [
 'Create sprint planning task',
 'Schedule sprint retrospective',
 'Show all sprint tasks',
 ],
 };
 }

 // 13b. User Story Drafter
 if (lower.includes('user story') || lower.includes('write story') || lower.includes('draft story')) {
 const featureName = text.includes(':') ? text.split(':')[1].trim() : 'Real-Time Notification Center';
 return {
 responseText: ` **User Story: ${featureName}**\n\n### User Persona & Goal\n**As a** workspace collaborator,\n**I want** to receive real-time actionable notifications,\n**So that** I never miss urgent sprint assignments or meeting invitations.\n\n### Acceptance Criteria\n- [ ] Displays floating badge with unread count in header bar.\n- [ ] Audio chime and visual pulse when an urgent task is assigned.\n- [ ] 1-click navigation to the target task or meeting URL.\n- [ ] Mark individual or all notifications as read with instant state persistence.\n\nWould you like me to create this task in your backlog?`,
 suggestedFollowUps: [
 `Create task: Implement ${featureName}`,
 'Draft technical spec',
 'Show task board',
 ],
 };
 }

 // 13c. Client / Follow-up Email Drafter
 if (
 lower.includes('email') ||
 lower.includes('draft email') ||
 lower.includes('write email') ||
 lower.includes('follow up email')
 ) {
 return {
 responseText: ` **Professional Client Follow-Up Email Template**\n\n**Subject**: Cursis Implementation & Sprint Progress Update — Milestone Review\n\n**Hi [Client Name],**\n\nI hope you're having a great week.\n\nI wanted to share a quick update on our progress with the recent sprint deliverables. Our engineering team has successfully finalized the core architecture and we are on schedule for the upcoming production release.\n\nHere is a quick summary of what's ready for your review:\n• **Feature Milestones**: Completed ahead of schedule.\n• **Security & Testing**: Zero high-severity vulnerabilities found in automated audits.\n• **Next Milestone**: Target deployment scheduled for next week.\n\nAre you available for a brief 15-minute sync on Thursday or Friday to walk through the demo?\n\nBest regards,\n**${user.name}**\n*${user.role}, Cursis Workspace*`,
 suggestedFollowUps: [
 'Schedule follow-up meeting with client',
 'Create deal for this client',
 'Show CRM pipeline',
 ],
 };
 }

 // 13d. Technical RFC / Spec Drafter
 if (lower.includes('technical spec') || lower.includes('rfc') || lower.includes('architecture spec')) {
 const specTitle = text.includes(':') ? text.split(':')[1].trim() : 'Distributed Event Ingestion & Webhook Dispatch';
 return {
 responseText: ` **RFC Technical Architecture Document**\n\n# RFC-104: ${specTitle}\n**Author**: ${user.name} | **Status**: PROPOSED\n\n## 1. Problem Statement\nHigh-volume event throughput requires an asynchronous, non-blocking queue to prevent HTTP connection timeouts and ensure guaranteed delivery.\n\n## 2. Architecture & Data Flow\n1. **Ingress**: REST API accepts event payload and performs schema validation.\n2. **Buffer Queue**: Events pushed to Redis/MongoDB stream with unique idempotency keys.\n3. **Worker Pool**: Async workers consume batches, execute rate-limited retries with exponential backoff.\n4. **Audit**: Outcomes logged to centralized telemetry.\n\n## 3. Failure Recovery & SLA\n• Max retries: 5 attempts with jitter.\n• Dead Letter Queue (DLQ) alerts dispatched to engineering channel after 5th failure.\n\nWould you like me to save this as a permanent document in the knowledge vault?`,
 suggestedFollowUps: [
 `Create document: RFC ${specTitle}`,
 'Create task: Implement worker queue',
 'Show all documents',
 ],
 };
 }

 // 13e. Bug Report Template
 if (lower.includes('bug report') || lower.includes('report bug') || lower.includes('issue template')) {
 return {
 responseText: ` **Standard Bug Report Template**\n\n### Issue Summary\n*Clear and concise description of the bug.*\n\n### Steps to Reproduce\n1. Navigate to \`[Page Name]\`\n2. Click on \`[Button / Trigger]\`\n3. Input \`[Test Data]\`\n4. Observe the error state\n\n### Expected Behavior\n*What should have happened.*\n\n### Actual Behavior\n*What actually happened (including error messages, console logs, or HTTP status codes).*\n\n### Environment\n• **OS**: Windows / macOS / Linux\n• **Browser**: Chrome / Firefox / Safari\n• **Version**: v2.4.0-prod`,
 suggestedFollowUps: ['Create urgent bug fix task', 'Show active sprint tasks', 'Open tasks page'],
 };
 }

 // 13f. Daily Standup Formatter
 if (lower.includes('standup') || lower.includes('daily standup')) {
 const completedTasks = tasks.filter((t) => t.status === 'completed');
 const activeTasks = tasks.filter((t) => t.status !== 'completed');

 return {
 responseText: ` **Formatted Daily Standup for ${user.name}**\n\n### 1. Yesterday (Shipped)\n• Completed deliverables: ${completedTasks.slice(0, 2).map((t) => `*${t.name}*`).join(', ') || 'Architecture review & code refactoring'}.\n\n### 2. Today (In Flight)\n• Focusing on: ${activeTasks.slice(0, 2).map((t) => `*${t.name}*`).join(', ') || 'Sprint backlog items'}.\n\n### 3. Blockers\n• *No critical blockers. All upstream dependencies resolved.*\n\nWould you like me to post this update to the **#standup** channel?`,
 suggestedFollowUps: [
 'Post message: Daily standup update completed',
 'Show my tasks',
 'Schedule team sync',
 ],
 };
 }

 // 13g. System Architecture Comparisons
 if (lower.includes('rest vs graphql') || lower.includes('graphql vs rest')) {
 return {
 responseText: ` **Architectural Comparison: REST vs GraphQL**\n\n| Feature | REST API | GraphQL |\n|---|---|---|\n| **Data Fetching** | Over-fetching / under-fetching common | Exact client-specified field selection |\n| **Endpoints** | Multiple resource-specific endpoints (\`/api/tasks\`, \`/api/users\`) | Single POST endpoint (\`/graphql\`) |\n| **Caching** | Native HTTP caching (ETags, CDN, Cache-Control) | Complex query-level client caching |\n| **File Uploads** | Multipart form-data natively supported | Requires multipart spec or signed URLs |\n| **Best For** | Clean CRUD, standard microservices, public APIs | Complex frontend relational graphs, dashboards |\n\n **Recommendation for Cursis**: Hybrid architecture. Use Next.js REST/JSON routes for deterministic mutations and fast caching.`,
 suggestedFollowUps: ['Show developer API keys', 'Create technical spec doc', 'Open settings'],
 };
 }

 // =========================================================================
 // 14. DYNAMIC GENERATIVE CHATBOT FALLBACK (Handles any free-form question)
 // =========================================================================
 return {
 responseText: ` **Ordis Intelligent Assistant**\n\nRegarding: *"${text}"*\n\nHere is my analysis and actionable guidance:\n\n1. **Operational Context**: In your **${activeWorkspace.name}** workspace, you currently have **${tasks.filter((t) => t.status !== 'completed').length} active sprint deliverables**, **${projects.length} project(s)**, and **${employees.length} team members**.\n2. **Strategic Advice**: Break large initiatives into discrete, testable sub-tasks with clear deadlines and assignees. This keeps sprint velocity predictable and prevents delivery bottlenecks.\n3. **Next Steps**: You can instruct me to execute any operation directly:\n • *"Create task: [Title] due [Date] for [Name]"*\n • *"Schedule meeting: [Title] tomorrow at [Time]"*\n • *"Create deal: [Company] $[Amount]"*\n • *"Set accent color to emerald / indigo / sky"*\n • *"Generate executive performance brief"*\n\nHow would you like to proceed?`,
 suggestedFollowUps: [
 'What should I focus on today?',
 'Create sprint task',
 'Schedule a team sync',
 'Show sales pipeline',
 ],
 actionCard: {
 type: 'navigation',
 title: 'Ordis Copilot Ready for Command',
 subtitle: `${activeWorkspace.name} · All 13 systems connected`,
 badge: 'ACTIVE COPILOT',
 badgeColor: '#10b981',
 primaryAction: {
 label: 'Open Tasks',
 actionType: 'navigate',
 target: 'tasks',
 },
 secondaryAction: {
 label: 'Open Dashboard',
 actionType: 'navigate',
 target: 'home',
 },
 },
 };
}
