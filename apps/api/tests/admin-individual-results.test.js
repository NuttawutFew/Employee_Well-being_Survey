const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

test('Admin Individual Results Table, Privacy & Search (Ticket 10)', async (t) => {
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Unauthenticated request should return 401
    const resUnauth = await fetch(`${baseUrl}/api/admin/assessments`);
    assert.strictEqual(resUnauth.status, 401);

    // 2. Login as Admin
    const resLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@123456!' })
    });
    assert.strictEqual(resLogin.status, 200);
    const { sessionToken } = await resLogin.json();
    const adminHeaders = {
      Authorization: `Bearer ${sessionToken}`
    };

    // 3. Create and submit 3 distinct employee attempts
    const employees = [
      { id: 'EMP-101', first: 'สมชาย', last: 'รักงาน', dept: 'ฝ่ายวิศวกรรม', comp: 'บริษัท เทค จำกัด' },
      { id: 'EMP-102', first: 'วิภา', last: 'ใจดี', dept: 'ฝ่ายบุคคล', comp: 'บริษัท อรุณ กรุ๊ป' },
      { id: 'EMP-103', first: 'กานต์', last: 'มุ่งมั่น', dept: 'ฝ่ายการตลาด', comp: 'บริษัท อรุณ กรุ๊ป' }
    ];

    for (const emp of employees) {
      const empHeaders = { 'Content-Type': 'application/json', 'x-employee-id': emp.id };
      // Acknowledge notice
      await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
        method: 'POST',
        headers: empHeaders,
        body: JSON.stringify({ noticeVersion: '2026-09-03' })
      });

      // Fill 74 questions
      const answers = {};
      for (let i = 1; i <= 22; i++) answers[`B${String(i).padStart(2, '0')}`] = 1;
      for (let i = 1; i <= 20; i++) answers[`S${String(i).padStart(2, '0')}`] = 1;
      for (let i = 1; i <= 20; i++) answers[`R${String(i).padStart(2, '0')}`] = 3;
      for (let i = 1; i <= 9; i++) answers[`Q${String(i).padStart(2, '0')}`] = 0;
      answers['QP01'] = 0;
      answers['QP02'] = 0;
      answers['QP03'] = 0;

      await fetch(`${baseUrl}/api/assessment/draft/answers`, {
        method: 'PUT',
        headers: empHeaders,
        body: JSON.stringify({ answers })
      });

      // Submit
      await fetch(`${baseUrl}/api/assessment/submit`, {
        method: 'POST',
        headers: empHeaders
      });
    }

    // 4. Admin fetch paginated results: page 1, limit 2
    const resPage1 = await fetch(`${baseUrl}/api/admin/assessments?page=1&limit=2`, {
      headers: adminHeaders
    });
    assert.strictEqual(resPage1.status, 200);
    const page1Data = await resPage1.json();
    assert.strictEqual(page1Data.items.length, 2);
    assert.strictEqual(page1Data.pagination.totalCount, 3);
    assert.strictEqual(page1Data.pagination.totalPages, 2);
    assert.strictEqual(page1Data.pagination.page, 1);

    // 5. PRIVACY CHECK: Total absence of raw question answers
    for (const item of page1Data.items) {
      assert.strictEqual(item.answers, undefined, 'Raw answers must NOT be exposed');
      assert.ok(item.attemptId);
      assert.ok(item.employeeId);
      assert.ok(item.status);
      assert.ok(item.submittedAt);
      assert.ok(item.snapshot);
      assert.ok(item.result);
      assert.ok(item.result.burnout);
      assert.ok(item.result.stress);
      assert.ok(item.result.q9);
      assert.ok(item.result.overall);
    }

    // 6. Test search filter by Employee ID
    const resSearchId = await fetch(`${baseUrl}/api/admin/assessments?search=EMP-102`, {
      headers: adminHeaders
    });
    assert.strictEqual(resSearchId.status, 200);
    const searchIdData = await resSearchId.json();
    assert.strictEqual(searchIdData.items.length, 1);
    assert.strictEqual(searchIdData.items[0].employeeId, 'EMP-102');

    // 7. Test sorting: by employeeId ascending
    const resSortAsc = await fetch(`${baseUrl}/api/admin/assessments?sortBy=employeeId&sortOrder=asc&limit=10`, {
      headers: adminHeaders
    });
    assert.strictEqual(resSortAsc.status, 200);
    const sortAscData = await resSortAsc.json();
    assert.strictEqual(sortAscData.items[0].employeeId, 'EMP-101');
    assert.strictEqual(sortAscData.items[1].employeeId, 'EMP-102');
    assert.strictEqual(sortAscData.items[2].employeeId, 'EMP-103');

    // 8. Test sorting: by employeeId descending
    const resSortDesc = await fetch(`${baseUrl}/api/admin/assessments?sortBy=employeeId&sortOrder=desc&limit=10`, {
      headers: adminHeaders
    });
    assert.strictEqual(resSortDesc.status, 200);
    const sortDescData = await resSortDesc.json();
    assert.strictEqual(sortDescData.items[0].employeeId, 'EMP-103');
    assert.strictEqual(sortDescData.items[1].employeeId, 'EMP-102');
    assert.strictEqual(sortDescData.items[2].employeeId, 'EMP-101');

    // 9. Test seed-mock endpoint
    const resSeed = await fetch(`${baseUrl}/api/admin/assessments/seed-mock`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert.strictEqual(resSeed.status, 200);
    const seedData = await resSeed.json();
    assert.strictEqual(seedData.count, 10);
  } finally {
    server.close();
  }
});
