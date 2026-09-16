import { executeOrdisCommand } from './lib/ordis/engine.ts';
import { processGeminiToolCalls, ordisToolDeclarations } from './lib/ordis/gemini.ts';

const mockState = {
  plan: 'paid',
  user: { id: 'usr_admin', name: 'Commander', email: 'admin@cursis.io', role: 'Owner' },
  workspace: { name: 'Cursis Production', plan: 'standard' },
  activeWorkspace: { id: 'ws_test', name: 'Cursis Production' },
  employees: [
    { id: 'emp_1', name: 'Sarah Chen', role: 'Lead Architect', department: 'Engineering', status: 'online' },
    { id: 'emp_2', name: 'Alex Morgan', role: 'Product Designer', department: 'Design', status: 'online' },
  ],
  projects: [
    { id: 'proj_main', name: 'Core Platform', desc: 'Main app' },
  ],
  tasks: [],
  meetings: [],
  notifications: [],
  activity: [],
  automations: [],
  documents: [],
  crm: { deals: [], contacts: [] },
  integrations: [],
  webhooks: [],
  apiKeys: [],
  workspaceSettings: {},
  teamSettings: {},
  notificationSettings: {},
  meetingCalendarSettings: {},
  ordisSettings: { tone: 'friendly' },
};

console.log('=== RUNNING ORDIS CAPABILITIES VERIFICATION SUITE ===\n');

let allPassed = true;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
  } else {
    console.error(`❌ FAIL: ${message}`);
    allPassed = false;
  }
}

// 1. Making Project (Local Engine)
console.log('\n--- 1. Making Project ---');
const projRes = executeOrdisCommand('Make project Apollo Launch with budget 50000 and deadline next month', mockState);
assert(projRes.stateMutations?.createdProject !== undefined, 'Project stateMutation created');
assert(projRes.stateMutations?.createdProject?.name.includes('Apollo Launch'), `Project name preserved: ${projRes.stateMutations?.createdProject?.name}`);
assert(projRes.actionCard?.type === 'project', 'Project action card returned');

// 2. Creating Task (Local Engine)
console.log('\n--- 2. Creating Task ---');
const taskRes = executeOrdisCommand('Create task Implement OAuth2 login, urgent priority for Sarah Chen', mockState);
assert(taskRes.stateMutations?.createdTask !== undefined, 'Task stateMutation created');
assert(taskRes.stateMutations?.createdTask?.priority === 'urgent', 'Task priority set to urgent');
assert(taskRes.actionCard?.type === 'task', 'Task action card returned');

// 3. Add Event on Calendar (Local Engine)
console.log('\n--- 3. Add Event on Calendar ---');
const calRes = executeOrdisCommand('Add event on calendar: Quarterly Architecture Review tomorrow at 10 AM', mockState);
assert(calRes.stateMutations?.createdMeeting !== undefined, 'Calendar event meeting stateMutation created');
assert(calRes.stateMutations?.createdMeeting?.name.includes('Quarterly Architecture Review'), 'Calendar event title preserved');
assert(calRes.actionCard?.badge === 'CALENDAR EVENT', 'Calendar event action card badge verified');

// 4. Schedule Meeting with Google Meet Link (Local Engine)
console.log('\n--- 4. Schedule Meeting with Google Meet Link ---');
const customMeetUrl = 'https://meet.google.com/xyz-pqrs-tuv';
const mtgRes = executeOrdisCommand(`Schedule meeting Client Onboarding Sync with link ${customMeetUrl} tomorrow at 3pm`, mockState);
assert(mtgRes.stateMutations?.createdMeeting !== undefined, 'Meeting stateMutation created');
assert(mtgRes.stateMutations?.createdMeeting?.meetingUrl === customMeetUrl, `User Google Meet link preserved: ${mtgRes.stateMutations?.createdMeeting?.meetingUrl}`);
assert(mtgRes.actionCard?.secondaryAction?.target === customMeetUrl, 'Action card secondary action points to Google Meet link');

// 5. Add Team Member with Email Validation (Local Engine)
console.log('\n--- 5. Add Team Member (Email Validation & Incorrect User) ---');
// 5a. Invalid / Missing Email -> MUST return "incorrect user"
const invalidUserRes = executeOrdisCommand('Add team member without valid email', mockState);
assert(invalidUserRes.toastMessage === 'incorrect user', 'Invalid email triggers "incorrect user" toast');
assert(invalidUserRes.responseText.includes('incorrect user'), 'Response text flags "incorrect user"');
assert(invalidUserRes.stateMutations?.createdInvitation === undefined, 'No invitation created for invalid user');

// 5b. Valid Email -> Successfully creates invitation & employee
const validUserRes = executeOrdisCommand('Add team member Elena Vance with email elena.vance@blackmesa.org', mockState);
assert(validUserRes.stateMutations?.createdInvitation !== undefined, 'Invitation stateMutation created for valid user');
assert(validUserRes.stateMutations?.createdInvitation?.email === 'elena.vance@blackmesa.org', 'Invitee email preserved');
assert(validUserRes.stateMutations?.createdEmployee !== undefined, 'Employee stateMutation created');

// 6. Gemini Tool Calls Processing Test
console.log('\n--- 6. Gemini Agentic Tool Calling Integration ---');
// 6a. schedule_meeting with user Google Meet link
const geminiMtgCall = [
  {
    name: 'schedule_meeting',
    args: {
      title: 'Design Sprint Retro',
      date: '2026-09-22',
      time: '14:00',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
    },
  },
];
const geminiMtgProcessed = processGeminiToolCalls(geminiMtgCall, mockState);
assert(geminiMtgProcessed.mutations?.createdMeeting?.meetingUrl === 'https://meet.google.com/abc-defg-hij', 'Gemini schedule_meeting preserved Google Meet link');

// 6b. add_calendar_event
const geminiCalCall = [
  {
    name: 'add_calendar_event',
    args: {
      title: 'Company All-Hands Q3',
      date: 'Friday',
      time: '16:00',
      description: 'Quarterly roadmap updates',
    },
  },
];
const geminiCalProcessed = processGeminiToolCalls(geminiCalCall, mockState);
assert(geminiCalProcessed.mutations?.createdMeeting?.name === 'Company All-Hands Q3', 'Gemini add_calendar_event created calendar event');
assert(geminiCalProcessed.actionCards[0]?.badge === 'CALENDAR EVENT', 'Gemini action card marked as CALENDAR EVENT');

// 6c. add_team_member invalid email -> incorrect user
const geminiInvalidEmailCall = [
  {
    name: 'add_team_member',
    args: {
      name: 'Bob',
      email: 'not_an_email',
    },
  },
];
const geminiInvalidProcessed = processGeminiToolCalls(geminiInvalidEmailCall, mockState);
assert(geminiInvalidProcessed.toastMessage === 'incorrect user', 'Gemini invalid email returns "incorrect user"');
assert(geminiInvalidProcessed.mutations?.createdInvitation === undefined, 'Gemini did not create invitation for invalid email');

// 6d. add_team_member valid email
const geminiValidEmailCall = [
  {
    name: 'add_team_member',
    args: {
      name: 'Dr. Gordon Freeman',
      email: 'gordon@blackmesa.org',
      role: 'Research Scientist',
      department: 'Engineering',
    },
  },
];
const geminiValidProcessed = processGeminiToolCalls(geminiValidEmailCall, mockState);
assert(geminiValidProcessed.mutations?.createdInvitation?.email === 'gordon@blackmesa.org', 'Gemini created invitation for valid email');

console.log('\n=============================================');
if (allPassed) {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
} else {
  console.error('⚠️ SOME TESTS FAILED.');
  process.exit(1);
}
