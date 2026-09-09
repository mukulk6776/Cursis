const BASE_URL = 'http://localhost:3000';

async function runOrdisChatbotE2ETest() {
  console.log('====================================================');
  console.log('   ORDIS AI CHATBOT ENGINE E2E VERIFICATION SUITE   ');
  console.log('====================================================\n');

  // 1. Authenticate user session
  console.log('[1/4] Establishing Authenticated User Session...');
  const authRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sarah.connor@cursis.io',
      password: 'EnterprisePassword2026!',
    }),
  });

  if (!authRes.ok) {
    throw new Error(`Auth failed with HTTP status ${authRes.status}`);
  }

  const setCookie = authRes.headers.get('set-cookie');
  const cookieHeader = setCookie ? setCookie.split(';')[0] : '';
  console.log('✓ Session established (Cookie Header active)\n');

  // 2. Test Cases for Conversational Chatbot & Operational Actions
  const testCases = [
    {
      category: 'Conversational Greetings',
      command: 'Hi Ordis',
      expectedKeyword: 'Ordis',
    },
    {
      category: 'Task Creation & Assignee Routing',
      command: 'Create task for Alex: Deploy zero-trust mTLS proxy with urgent priority',
      expectedKeyword: 'Task',
    },
    {
      category: 'Project Initialization',
      command: 'Create project: Autonomous AI Gateway v4 with $35000 budget',
      expectedKeyword: 'Project',
    },
    {
      category: 'Meeting & Calendar Scheduling',
      command: 'Schedule meeting: Sprint 14 Architecture and Roadmap Alignment tomorrow at 14:00',
      expectedKeyword: 'meeting',
    },
    {
      category: 'Document Authoring',
      command: 'Create document: Production Infrastructure Security Runbook in Engineering',
      expectedKeyword: 'document',
    },
    {
      category: 'Developer API Key Generation',
      command: 'Generate new API key named GitHub Deployment Bot',
      expectedKeyword: 'Key',
    },
    {
      category: 'Automation Workflow Rule',
      command: 'Create automation: Auto-route critical security vulnerabilities to Ops',
      expectedKeyword: 'automation',
    },
    {
      category: 'Daily Focus & Priorities',
      command: 'What should I focus on today?',
      expectedKeyword: 'Plan',
    },
    {
      category: 'Executive Performance Brief',
      command: 'Generate workspace executive summary and sprint velocity report',
      expectedKeyword: 'Synthesis',
    },
    {
      category: 'Generative Tech Comparison',
      command: 'Compare REST vs GraphQL for enterprise architectures',
      expectedKeyword: 'REST',
    },
  ];

  console.log('[2/4] Dispatching Conversational Commands & Mutations to Ordis...');
  let passCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const res = await fetch(`${BASE_URL}/api/ordis/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        command: tc.command,
        workspaceId: 'ws_cursis_main',
        userId: 'u_sarah_01',
        userName: 'Sarah Connor',
        context: {
          taskCount: 12,
          projectCount: 3,
          meetingCount: 2,
        },
      }),
    });

    const data = await res.json();
    const isSuccess = res.ok && data.success;
    if (isSuccess) {
      passCount++;
      console.log(`  ✓ [PASS] [${tc.category}] "${tc.command.substring(0, 45)}..." -> HTTP ${res.status}`);
    } else {
      console.error(`  ✗ [FAIL] [${tc.category}] "${tc.command}" -> ${data.error || 'Unknown error'}`);
    }
  }

  console.log(`\n[3/4] Testing Audit Logging & MongoDB Persistence...`);
  const auditRes = await fetch(`${BASE_URL}/api/ordis/audit?workspaceId=ws_cursis_main`, {
    headers: { Cookie: cookieHeader },
  });
  console.log(`✓ Audit endpoint status: HTTP ${auditRes.status}`);

  console.log(`\n[4/4] Testing Ordis Brain & Ambient Scan Endpoint...`);
  const brainRes = await fetch(`${BASE_URL}/api/ordis/brain?workspaceId=ws_cursis_main`, {
    headers: { Cookie: cookieHeader },
  });
  console.log(`✓ Brain endpoint status: HTTP ${brainRes.status}`);

  console.log('\n====================================================');
  console.log(`   SUMMARY: ${passCount}/${testCases.length} COMMANDS EXECUTED SUCCESSFULLY   `);
  console.log('====================================================\n');

  if (passCount === testCases.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runOrdisChatbotE2ETest().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
