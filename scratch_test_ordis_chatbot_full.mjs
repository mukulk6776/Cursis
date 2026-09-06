import { executeOrdisCommand } from './lib/ordis/engine.ts';
import { formatChatMarkdown } from './lib/dashboard/data.ts';

// Mock state
const mockState = {
  user: {
    id: 'u_test',
    name: 'Sarah Connor',
    initials: 'SC',
    email: 'sarah@cursis.io',
    role: 'Principal Engineer',
    avatar: null,
    color: '#0f4cff',
  },
  workspace: {
    name: 'Cursis Enterprise HQ',
    plan: 'Enterprise Pro',
  },
  activeWorkspace: {
    id: 'ws_test',
    name: 'Cursis Enterprise HQ',
    shortName: 'Cursis',
    type: 'public',
    tagline: 'Autonomous AI Workspace',
    description: 'Master enterprise hub',
    isCustomClient: false,
    badge: 'Enterprise',
    color: '#0f4cff',
    ownerId: 'u_test',
    createdAt: '2026-09-01',
  },
  employees: [
    {
      id: 'e_alex',
      name: 'Alex Mercer',
      initials: 'AM',
      role: 'Staff Systems Architect',
      department: 'Engineering',
      status: 'online',
      color: '#10b981',
      tasks: 3,
      projects: 2,
      email: 'alex@cursis.io',
    },
    {
      id: 'e_elena',
      name: 'Elena Rostova',
      initials: 'ER',
      role: 'Head of Product Design',
      department: 'Design',
      status: 'online',
      color: '#8b5cf6',
      tasks: 2,
      projects: 1,
      email: 'elena@cursis.io',
    },
  ],
  projects: [
    {
      id: 'p_1',
      name: 'AI Copilot v3.0',
      icon: '🚀',
      color: '#0f4cff',
      desc: 'Next-gen enterprise autonomous assistant',
      progress: 65,
      status: 'In Progress',
      deadline: '2026-09-30',
      team: ['e_alex', 'e_elena'],
      tasks: 8,
      completed: 5,
    },
  ],
  tasks: [
    {
      id: 't_1',
      name: 'Deploy WebSocket telemetry cluster',
      project: 'p_1',
      assignee: 'e_alex',
      priority: 'urgent',
      status: 'todo',
      deadline: '2026-09-10',
      tags: ['Infra'],
    },
    {
      id: 't_2',
      name: 'Design high-density data grid',
      project: 'p_1',
      assignee: 'e_elena',
      priority: 'high',
      status: 'in-progress',
      deadline: '2026-09-12',
      tags: ['UI'],
    },
  ],
  meetings: [
    {
      id: 'm_1',
      name: 'Sprint 14 Architecture Review',
      platform: 'google_meet',
      meetingUrl: 'https://meet.google.com/crs-sync-test',
      date: '2026-09-08',
      time: '14:00',
      duration: 30,
      participants: ['e_alex'],
      project: 'p_1',
      status: 'scheduled',
    },
  ],
  notifications: [],
  activity: [],
  automations: [
    {
      id: 'a_1',
      name: 'Auto-Assign Urgent Sprints',
      active: true,
      when: 'When task is urgent',
      condition: null,
      then: 'Notify lead engineer',
      icon: '⚡',
      color: '#0f4cff',
    },
  ],
  documents: [
    {
      id: 'd_1',
      title: 'Distributed State Sync RFC',
      category: 'Engineering',
      author: 'Sarah Connor',
      lastModified: 'Yesterday',
      tags: ['Architecture'],
      content: '# Distributed State Sync RFC',
      starred: true,
    },
  ],
  crm: {
    deals: [
      {
        id: 'cd_1',
        title: 'Acme Cloud Contract',
        company: 'Acme Corp',
        value: 120000,
        stage: 'Proposal',
        probability: 60,
        contact: 'John Doe',
        email: 'john@acme.com',
        closingDate: '2026-10-01',
        source: 'Inbound',
        customFields: {},
      },
    ],
    contacts: [],
    customPipelines: [],
  },
  integrations: [],
  webhooks: [],
  apiKeys: [],
  workspaceSettings: {
    accentColor: '#0f4cff',
    theme: 'dark',
    density: 'comfortable',
    reducedMotion: false,
    fontSize: 'medium',
    sidebarDefaultCollapsed: false,
    cardElevation: 'subtle',
    borderStyle: 'subtle',
    codeFont: 'monospace',
    chartPalette: 'cursis-neon',
    allowPublicProjects: true,
    require2FAForAdmins: false,
    ipAllowlist: '',
    sessionTimeoutMinutes: 60,
    dataRetentionDays: 365,
    slackWebhookUrl: '',
    githubSync: false,
    googleCalendarSync: true,
    emailNotifications: true,
    browserPushNotifications: true,
    weeklyDigest: true,
  },
  teamSettings: {
    allowMemberInvites: true,
    defaultMemberRole: 'member',
    requireAdminApprovalForInvites: false,
    allowedEmailDomains: '',
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    timezone: 'UTC',
    customRoles: [],
  },
  notificationSettings: {
    emailNotifications: true,
    browserPushNotifications: true,
    desktopNotifications: true,
    taskAssignments: true,
    deadlineReminders: true,
    mentionAlerts: true,
    dailyDigest: true,
    weeklyDigest: true,
    systemAlerts: true,
    digestTime: '09:00',
    reminderHoursBefore: 24,
  },
  meetingCalendarSettings: {
    defaultMeetingDuration: 30,
    bufferTimeMinutes: 5,
    autoRecordMeetings: false,
    aiTranscriptionEnabled: true,
    aiSummaryEnabled: true,
    defaultPlatform: 'google_meet',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    allowOverlap: false,
  },
  ordisSettings: {
    enabled: true,
    autonomousActionsEnabled: true,
    autoTriageTasks: true,
    proactiveSuggestions: true,
    voiceInputEnabled: true,
    voiceOutputEnabled: false,
    confidenceThreshold: 0.8,
    ambientScanIntervalMinutes: 15,
    maxAutonomousActionsPerDay: 50,
    requireApprovalForDeletions: true,
    requireApprovalForInvites: false,
    allowedScopes: ['tasks', 'projects', 'meetings', 'team', 'crm', 'docs', 'automations'],
  },
};

console.log('--- STARTING ORDIS CHATBOT FULL TEST SUITE ---');

let passed = 0;
let total = 0;

function assert(condition, testName, details = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`✓ [PASS] ${testName}`);
  } else {
    console.error(`✗ [FAIL] ${testName}: ${details}`);
  }
}

// 1. Greeting
const r1 = executeOrdisCommand('Hi Ordis', mockState);
assert(r1.responseText.includes('Good day, Sarah Connor'), 'Conversational Greeting', r1.responseText);
assert(r1.suggestedFollowUps?.length > 0, 'Greeting includes suggested follow-up chips');

// 2. Daily Focus
const r2 = executeOrdisCommand('What should I focus on today?', mockState);
assert(r2.responseText.includes('Action Plan for Today'), 'Daily Focus Action Plan', r2.responseText);
assert(r2.responseText.includes('Deploy WebSocket telemetry cluster'), 'Identifies urgent tasks in daily focus');

// 3. Executive Brief
const r3 = executeOrdisCommand('Generate workspace executive brief', mockState);
assert(r3.responseText.includes('Executive Performance Synthesis'), 'Executive Performance Synthesis');
assert(r3.responseText.includes('120,000'), 'Includes live CRM pipeline amount in executive brief');

// 4. Task Creation with Assignee, Priority, Deadline
const r4 = executeOrdisCommand('Create task for Alex: Implement zero-trust mTLS proxy due tomorrow with urgent priority', mockState);
assert(r4.stateMutations?.createdTask !== undefined, 'Task creation returns state mutation');
assert(r4.stateMutations?.createdTask?.assignee === 'e_alex', 'Task assignee matches Alex Mercer');
assert(r4.stateMutations?.createdTask?.priority === 'urgent', 'Task priority is urgent');
assert(r4.actionCard?.type === 'task', 'Returns interactive Task Action Card');

// 5. Complete Task
const r5 = executeOrdisCommand('Complete task: Deploy WebSocket telemetry cluster', mockState);
assert(r5.stateMutations?.updatedTasks?.find((t) => t.id === 't_1')?.status === 'completed', 'Task status set to completed');
assert(r5.actionCard?.badge === 'DONE ✓', 'Action card shows DONE badge');

// 6. Reassign Task
const r6 = executeOrdisCommand('Reassign task Deploy WebSocket to Elena', mockState);
assert(r6.stateMutations?.updatedTasks?.find((t) => t.id === 't_1')?.assignee === 'e_elena', 'Task reassigned to Elena');

// 7. Schedule Google Meet
const r7 = executeOrdisCommand('Schedule meeting: Q4 Strategy and AI Roadmap Sync tomorrow at 15:00', mockState);
assert(r7.stateMutations?.createdMeeting !== undefined, 'Meeting creation returns state mutation');
assert(r7.stateMutations?.createdMeeting?.platform === 'google_meet', 'Meeting platform is Google Meet');
assert(r7.stateMutations?.createdMeeting?.meetingUrl?.includes('meet.google.com'), 'Meeting URL generated properly');
assert(r7.actionCard?.type === 'meeting', 'Returns Meeting Action Card');

// 8. Team Bandwidth Scan
const r8 = executeOrdisCommand('What is my team working on right now?', mockState);
assert(r8.responseText.includes('Real-Time Team Bandwidth'), 'Team workload scan');
assert(r8.responseText.includes('Alex Mercer'), 'Lists team members');

// 9. Add / Invite Member
const r9 = executeOrdisCommand('Invite marcus.vance@cursis.io as Lead Cloud Architect', mockState);
assert(r9.stateMutations?.createdInvitation !== undefined, 'Invitation mutation created');
assert(r9.stateMutations?.createdInvitation?.email === 'marcus.vance@cursis.io', 'Invitation email preserved');
assert(r9.stateMutations?.createdEmployee !== undefined, 'Employee profile initialized');

// 10. Create CRM Deal
const r10 = executeOrdisCommand('Create deal: Tesla Global Telemetry $250000 in negotiation stage', mockState);
assert(r10.stateMutations?.createdDeal !== undefined, 'CRM Deal mutation created');
assert(r10.stateMutations?.createdDeal?.value === 250000, 'Deal value parsed to 250000');
assert(r10.stateMutations?.createdDeal?.stage === 'Negotiation', 'Deal stage parsed to Negotiation');

// 11. Move Deal Stage
const r11 = executeOrdisCommand('Mark deal as won', mockState);
assert(r11.responseText.includes('CLOSED WON'), 'Deal stage updated to Closed Won');

// 12. Create Document in Engineering
const r12 = executeOrdisCommand('Create document: Zero-Knowledge Encryption Protocols in Engineering', mockState);
assert(r12.stateMutations?.createdDocument !== undefined, 'Document mutation created');
assert(r12.stateMutations?.createdDocument?.category === 'Engineering', 'Document category is Engineering');
assert(r12.stateMutations?.createdDocument?.content.includes('Executive Summary'), 'Document contains structured content');

// 13. Create Automation Rule
const r13 = executeOrdisCommand('Create automation: Auto-route critical security vulnerabilities to Ops', mockState);
assert(r13.stateMutations?.createdAutomation !== undefined, 'Automation rule created');
assert(r13.stateMutations?.createdAutomation?.active === true, 'Automation rule is active');

// 14. Theme Customization
const r14 = executeOrdisCommand('Set accent color to #10b981', mockState);
assert(r14.stateMutations?.updatedWorkspaceSettings?.accentColor === '#10b981', 'Accent color updated in settings');

// 15. Generate API Key
const r15 = executeOrdisCommand('Generate API key named GitHub Deployment Bot', mockState);
assert(r15.stateMutations?.createdApiKey !== undefined, 'API Key generated');
assert(r15.stateMutations?.createdApiKey?.key.startsWith('crs_live_'), 'Key has standard live prefix');

// 16. Generative User Story
const r16 = executeOrdisCommand('Draft user story for Single Sign-On SAML Integration', mockState);
assert(r16.responseText.includes('User Story'), 'Generates user story');
assert(r16.responseText.includes('Acceptance Criteria'), 'Includes acceptance criteria');

// 17. Generative Client Follow-Up Email
const r17 = executeOrdisCommand('Draft follow up email to client', mockState);
assert(r17.responseText.includes('Subject:'), 'Drafts professional email');

// 18. Technical Spec RFC
const r18 = executeOrdisCommand('Draft technical spec for Distributed Redis Caching Layer', mockState);
assert(r18.responseText.includes('RFC Technical Architecture Document'), 'Drafts RFC technical spec');

// 19. Architecture Comparison
const r19 = executeOrdisCommand('Compare REST vs GraphQL', mockState);
assert(r19.responseText.includes('Architectural Comparison: REST vs GraphQL'), 'Generates architecture comparison table');

// 20. Markdown Formatter
const testMd = '### Title\n**Bold** and `code`\n- [x] Done\n> Quote\n```js\nconst a = 1;\n```';
const formatted = formatChatMarkdown(testMd);
assert(formatted.includes('<strong>Bold</strong>'), 'Markdown bold formatted');
assert(formatted.includes('<pre'), 'Markdown pre block formatted');
assert(formatted.includes('☑'), 'Markdown checklist formatted');
assert(formatted.includes('<blockquote'), 'Markdown blockquote formatted');

console.log(`\n--- ALL TESTS COMPLETE: ${passed}/${total} PASSED ---`);
if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
