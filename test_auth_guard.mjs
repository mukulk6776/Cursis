// Comprehensive verification script for dashboard login guard and backdoor elimination
const BASE_URL = 'http://localhost:3000';

async function runVerification() {
  console.log('================================================================');
  console.log('🛡️  CURSIS DASHBOARD AUTHENTICATION & ZERO-BYPASS VERIFICATION  ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: Direct unauthenticated access to /dashboard
  // -------------------------------------------------------------
  console.log('[Test 1] Testing unauthenticated GET /dashboard...');
  try {
    const res = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual',
    });
    const status = res.status;
    const location = res.headers.get('location') || '';
    assert(
      (status === 307 || status === 302 || status === 303) && location.includes('/login?redirect=%2Fdashboard'),
      `Redirected unauthenticated request (HTTP ${status} -> ${location})`
    );
  } catch (err) {
    assert(false, `Request failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 2: Direct unauthenticated access to /dashboard/projects
  // -------------------------------------------------------------
  console.log('\n[Test 2] Testing unauthenticated GET /dashboard/projects...');
  try {
    const res = await fetch(`${BASE_URL}/dashboard/projects`, {
      redirect: 'manual',
    });
    const status = res.status;
    const location = res.headers.get('location') || '';
    assert(
      (status === 307 || status === 302 || status === 303) && location.includes('/login?redirect=%2Fdashboard%2Fprojects'),
      `Redirected sub-route request (HTTP ${status} -> ${location})`
    );
  } catch (err) {
    assert(false, `Request failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 3: Attempt access using developer backdoor token
  // -------------------------------------------------------------
  console.log('\n[Test 3] Testing developer backdoor token (cursis_dev_token)...');
  try {
    const res = await fetch(`${BASE_URL}/dashboard`, {
      headers: {
        'Cookie': 'cursis_session=cursis_dev_token_99999',
      },
      redirect: 'manual',
    });
    const status = res.status;
    const location = res.headers.get('location') || '';
    assert(
      (status === 307 || status === 302 || status === 303) && location.includes('/login'),
      `Developer bypass blocked (HTTP ${status} -> ${location})`
    );
  } catch (err) {
    assert(false, `Request failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 4: Attempt access using forged unsigned token
  // -------------------------------------------------------------
  console.log('\n[Test 4] Testing forged unsigned token (cursis_usr_eyJ...)...');
  try {
    const fakeJson = JSON.stringify({ email: 'hacker@cursis.ai', uid: 'usr_hacker', role: 'owner' });
    const fakeB64 = Buffer.from(fakeJson).toString('base64url');
    const forgedToken = `cursis_usr_${fakeB64}`;

    const res = await fetch(`${BASE_URL}/dashboard`, {
      headers: {
        'Cookie': `cursis_session=${forgedToken}`,
      },
      redirect: 'manual',
    });
    const status = res.status;
    const location = res.headers.get('location') || '';
    assert(
      (status === 307 || status === 302 || status === 303) && location.includes('/login'),
      `Forged unsigned token blocked (HTTP ${status} -> ${location})`
    );
  } catch (err) {
    assert(false, `Request failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 5: Attempt raw unauthenticated POST /api/auth/session
  // -------------------------------------------------------------
  console.log('\n[Test 5] Testing raw unauthenticated POST /api/auth/session...');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ceo@enterprise.com',
      }),
    });
    const data = await res.json().catch(() => ({}));
    assert(
      res.status === 401,
      `Unauthenticated session creation rejected (HTTP ${res.status}: ${data.error})`
    );
  } catch (err) {
    assert(false, `Request failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 6: Attempt POST /api/auth/session with fake dev token
  // -------------------------------------------------------------
  console.log('\n[Test 6] Testing fake dev token in POST /api/auth/session...');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: 'cursis_google_dev_token_12345',
      }),
    });
    const data = await res.json().catch(() => ({}));
    assert(
      res.status === 401,
      `Fake dev idToken rejected (HTTP ${res.status}: ${data.error})`
    );
  } catch (err) {
    assert(false, `Request failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 7: Legitimate Login via POST /api/auth/login
  // -------------------------------------------------------------
  console.log('\n[Test 7] Authenticating genuine user via POST /api/auth/login...');
  let sessionToken = '';
  let cookieHeader = '';
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test.admin@cursis.io',
        password: 'AdminPassword2026!',
      }),
    });
    const data = await res.json().catch(() => ({}));
    sessionToken = data.token || '';
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      cookieHeader = setCookie.split(';')[0];
    } else if (sessionToken) {
      cookieHeader = `cursis_session=${sessionToken}`;
    }

    assert(
      res.status === 200 && sessionToken.startsWith('cursis_usr_'),
      `Legitimate login successful, received signed token: ${sessionToken.substring(0, 24)}...`
    );
  } catch (err) {
    assert(false, `Login failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 8: Access /dashboard with Legitimate Session Token
  // -------------------------------------------------------------
  console.log('\n[Test 8] Testing authorized GET /dashboard with valid session...');
  try {
    const res = await fetch(`${BASE_URL}/dashboard`, {
      headers: {
        'Cookie': cookieHeader,
      },
      redirect: 'manual',
    });
    assert(
      res.status === 200,
      `Authorized dashboard access granted (HTTP ${res.status} OK)`
    );
  } catch (err) {
    assert(false, `Authorized request failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 9: Access /login while authenticated
  // -------------------------------------------------------------
  console.log('\n[Test 9] Testing GET /login while authenticated...');
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      headers: {
        'Cookie': cookieHeader,
      },
      redirect: 'manual',
    });
    const status = res.status;
    const location = res.headers.get('location') || '';
    assert(
      (status === 307 || status === 302 || status === 303) && location.includes('/dashboard'),
      `Authenticated user automatically redirected to dashboard (HTTP ${status} -> ${location})`
    );
  } catch (err) {
    assert(false, `Request failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 10: Sign out and verify /dashboard is locked again
  // -------------------------------------------------------------
  console.log('\n[Test 10] Testing session termination and re-locking /dashboard...');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      method: 'DELETE',
      headers: {
        'Cookie': cookieHeader,
      },
    });
    assert(res.status === 200, 'Session terminated successfully');

    // Access dashboard after logout (without cookie)
    const dashRes = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual',
    });
    const location = dashRes.headers.get('location') || '';
    assert(
      (dashRes.status === 307 || dashRes.status === 302 || dashRes.status === 303) && location.includes('/login'),
      `Dashboard re-locked after session termination (HTTP ${dashRes.status} -> ${location})`
    );
  } catch (err) {
    assert(false, `Sign out test failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`📊 FINAL RESULT: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
