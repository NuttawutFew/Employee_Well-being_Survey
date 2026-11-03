const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

test('Admin Internal Authentication, Argon2id & Lockout Protection (Ticket 09)', async (t) => {
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Initial attempt to access /me without auth should fail with 401
    const resUnauth = await fetch(`${baseUrl}/api/admin/auth/me`);
    assert.strictEqual(resUnauth.status, 401);

    // 2. Login with correct default credentials
    const resLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin@123456!'
      })
    });
    assert.strictEqual(resLogin.status, 200);
    const loginData = await resLogin.json();
    assert.strictEqual(loginData.success, true);
    assert.strictEqual(loginData.admin.username, 'admin');
    assert.strictEqual(loginData.admin.role, 'admin');
    assert.ok(loginData.sessionToken);

    // Verify Set-Cookie header is HTTP-Only
    const setCookie = resLogin.headers.get('set-cookie');
    assert.ok(setCookie);
    assert.ok(setCookie.includes('HttpOnly') || setCookie.includes('httponly'));

    // Extract cookie for subsequent requests
    const cookieHeader = setCookie.split(';')[0];

    // 3. Verify /me endpoint with Cookie
    const resMe = await fetch(`${baseUrl}/api/admin/auth/me`, {
      headers: { Cookie: cookieHeader }
    });
    assert.strictEqual(resMe.status, 200);
    const meData = await resMe.json();
    assert.strictEqual(meData.admin.username, 'admin');

    // 4. Verify /me endpoint with Authorization: Bearer
    const resMeBearer = await fetch(`${baseUrl}/api/admin/auth/me`, {
      headers: { Authorization: `Bearer ${loginData.sessionToken}` }
    });
    assert.strictEqual(resMeBearer.status, 200);

    // 5. Test Logout
    const resLogout = await fetch(`${baseUrl}/api/admin/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookieHeader }
    });
    assert.strictEqual(resLogout.status, 200);

    // Subsequent /me with cleared session should fail
    const resMeAfterLogout = await fetch(`${baseUrl}/api/admin/auth/me`, {
      headers: { Cookie: cookieHeader }
    });
    assert.strictEqual(resMeAfterLogout.status, 401);

    // 6. Test Failed Logins and Lockout Protection
    // Attempts 1 to 4 should return 401 with remaining attempts
    for (let i = 1; i <= 4; i++) {
      const resFail = await fetch(`${baseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'WrongPassword!'
        })
      });
      assert.strictEqual(resFail.status, 401);
      const failData = await resFail.json();
      assert.strictEqual(failData.code, 'UNAUTHORIZED');
    }

    // 5th failed attempt should trigger lockout (status 423 Locked)
    const resLockout = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'WrongPassword!'
      })
    });
    assert.strictEqual(resLockout.status, 423);
    const lockData = await resLockout.json();
    assert.strictEqual(lockData.code, 'ACCOUNT_LOCKED');

    // Attempting login with CORRECT password during lockout should still be rejected with 423
    const resLockedCorrect = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin@123456!'
      })
    });
    assert.strictEqual(resLockedCorrect.status, 423);

    // 7. Role separation: Employee request cannot access admin endpoint
    const resRoleSep = await fetch(`${baseUrl}/api/admin/auth/me`, {
      headers: { 'x-employee-id': 'EMP-DEV-001' }
    });
    assert.strictEqual(resRoleSep.status, 401);
  } finally {
    server.close();
  }
});
