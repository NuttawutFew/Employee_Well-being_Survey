const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

test('Aggregate Dashboard & Small-Cohort Suppression (Ticket 12)', async (t) => {
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Unauthenticated request should fail
    const resUnauth = await fetch(`${baseUrl}/api/admin/dashboard`);
    assert.strictEqual(resUnauth.status, 401);

    // 2. Admin Login
    const resLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@123456!' })
    });
    const { sessionToken } = await resLogin.json();
    const adminHeaders = { Authorization: `Bearer ${sessionToken}` };

    // Helper to submit an employee assessment
    async function submitEmployee(id, dept, burnoutScore = 1, stressScore = 0) {
      const empHeaders = { 'Content-Type': 'application/json', 'x-employee-id': id };
      await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
        method: 'POST',
        headers: empHeaders,
        body: JSON.stringify({ noticeVersion: '2026-09-03' })
      });

      const answers = {};
      for (let i = 1; i <= 22; i++) answers[`B${String(i).padStart(2, '0')}`] = burnoutScore;
      for (let i = 1; i <= 20; i++) answers[`S${String(i).padStart(2, '0')}`] = stressScore;
      for (let i = 1; i <= 20; i++) answers[`R${String(i).padStart(2, '0')}`] = 3;
      for (let i = 1; i <= 9; i++) answers[`Q${String(i).padStart(2, '0')}`] = 0;
      answers['QP01'] = 0; answers['QP02'] = 0; answers['QP03'] = 0;

      await fetch(`${baseUrl}/api/assessment/draft/answers`, {
        method: 'PUT',
        headers: empHeaders,
        body: JSON.stringify({ answers })
      });
      await fetch(`${baseUrl}/api/assessment/submit`, {
        method: 'POST',
        headers: empHeaders
      });
    }

    // 3. Submit 3 employees (Cohort size = 3 < 5)
    await submitEmployee('EMP-DASH-1', 'Engineering', 1, 0);
    await submitEmployee('EMP-DASH-2', 'Engineering', 2, 1);
    await submitEmployee('EMP-DASH-3', 'HR', 4, 3); // High burnout

    // 4. Test Small-Cohort Suppression (n = 3)
    const resSuppressed = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: adminHeaders
    });
    assert.strictEqual(resSuppressed.status, 200);
    const dataSuppressed = await resSuppressed.json();
    assert.strictEqual(dataSuppressed.suppressed, true);
    assert.strictEqual(dataSuppressed.message, 'ข้อมูลไม่เพียงพอสำหรับแสดงสถิติ');
    // Ensure no counts or percentages leaked
    assert.strictEqual(dataSuppressed.totalSubmissions, undefined);
    assert.strictEqual(dataSuppressed.overall, undefined);
    assert.strictEqual(dataSuppressed.instruments, undefined);

    // 5. Submit 2 more employees to reach Cohort size = 5
    await submitEmployee('EMP-DASH-4', 'Engineering', 1, 0);
    await submitEmployee('EMP-DASH-5', 'HR', 1, 0);

    // 6. Test Unsuppressed Dashboard (n = 5 >= 5)
    const resFull = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: adminHeaders
    });
    assert.strictEqual(resFull.status, 200);
    const dataFull = await resFull.json();
    assert.strictEqual(dataFull.suppressed, false);
    assert.strictEqual(dataFull.totalSubmissions, 5);
    assert.ok(dataFull.overall);
    assert.ok(dataFull.overall.needsCare);
    assert.ok(dataFull.overall.normal);
    assert.strictEqual(typeof dataFull.overall.needsCare.percentage, 'number');
    assert.ok(dataFull.instruments);
    assert.ok(dataFull.instruments.burnout);
    assert.ok(dataFull.instruments.stress);
    assert.ok(dataFull.instruments.q9);

    // 7. Test Filtered Suppression:
    // When filtering by a specific department (e.g. HR has 2 employees), suppression must trigger!
    // Note: In our mock snapshot service, default department is 'ทรัพยากรบุคคล'
    // Let's test filtering with a date or burnout level that matches only 1 employee (EMP-DASH-3 has high burnout)
    const resFilterSuppressed = await fetch(`${baseUrl}/api/admin/dashboard?burnoutLevels=HIGH`, {
      headers: adminHeaders
    });
    assert.strictEqual(resFilterSuppressed.status, 200);
    const dataFilterSuppressed = await resFilterSuppressed.json();
    assert.strictEqual(dataFilterSuppressed.suppressed, true);
    assert.strictEqual(dataFilterSuppressed.message, 'ข้อมูลไม่เพียงพอสำหรับแสดงสถิติ');
  } finally {
    server.close();
  }
});
