async function test(scenario, payload) {
  try {
    const res = await fetch('http://localhost:3000/api/ordis/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log(`[${scenario}] source: ${data.source}, model: ${data.model}`);
    console.log(`[${scenario}] snippet: ${data.data?.responseText?.substring(0, 80)}...\n`);
  } catch (err) {
    console.error(`[${scenario}] error:`, err.message);
  }
}

async function run() {
  // Test 1: with state and empty apiKey
  await test('Empty apiKey with state', {
    message: "what's your goal",
    apiKey: "",
    model: "gemini-3.6-flash",
    state: {
      activeWorkspace: { name: "User's Workspace" },
      tasks: [],
      projects: [],
      employees: [{}, {}, {}],
    }
  });

  // Test 2: with invalid apiKey saved in localStorage
  await test('Invalid apiKey', {
    message: "what's your goal",
    apiKey: "AIzaSy_some_bad_key",
    model: "gemini-3.6-flash",
    state: {
      activeWorkspace: { name: "User's Workspace" },
      tasks: [],
      projects: [],
      employees: [{}, {}, {}],
    }
  });

  // Test 3: with old model gemini-2.5-flash
  await test('Old model gemini-2.5-flash', {
    message: "what's your goal",
    apiKey: "",
    model: "gemini-2.5-flash",
    state: {
      activeWorkspace: { name: "User's Workspace" },
      tasks: [],
      projects: [],
      employees: [{}, {}, {}],
    }
  });
}

run();
