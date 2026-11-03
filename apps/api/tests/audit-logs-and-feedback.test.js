const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');
const { AuditService } = require('../src/modules/audit-service');
const { AssessmentSessionService } = require('../src/modules/assessment-session');

test('Audit Logs View, Export & Employee Feedback Integration', async (t) => {
  const auditService = new AuditService();
  const sessionService = new AssessmentSessionService({ auditService });
  const app = createApp({ sessionService, auditService });

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Admin Login to obtain token
    const resLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'superadmin', password: 'SuperAdmin@123456!' })
    });
    assert.strictEqual(resLogin.status, 200);
    const { sessionToken } = await resLogin.json();
    const adminHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`
    };

    // 2. GET /api/admin/audit-logs query with stats
    const auditRes = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: adminHeaders
    });
    assert.strictEqual(auditRes.status, 200);
    const auditData = await auditRes.json();
    assert.ok(Array.isArray(auditData.items));
    assert.ok(auditData.stats);
    assert.ok(typeof auditData.stats.total === 'number');
    assert.ok(typeof auditData.stats.sensitiveViews === 'number');
    assert.ok(typeof auditData.stats.exportReports === 'number');
    assert.ok(typeof auditData.stats.permissionsUpdates === 'number');

    // 3. Search and filter query params
    const filterRes = await fetch(`${baseUrl}/api/admin/audit-logs?role=Super+Admin`, {
      headers: adminHeaders
    });
    assert.strictEqual(filterRes.status, 200);
    const filterData = await filterRes.json();
    assert.ok(filterData.items.every(item => (item.actorRole || '').toLowerCase().includes('super')));

    // 4. POST /api/admin/audit-logs/export returns CSV with UTF-8 BOM
    const exportRes = await fetch(`${baseUrl}/api/admin/audit-logs/export`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ format: 'csv' })
    });
    assert.strictEqual(exportRes.status, 200);
    const rawBuffer = Buffer.from(await exportRes.arrayBuffer());
    assert.strictEqual(rawBuffer[0], 0xEF, 'Byte 0 must be 0xEF (BOM)');
    assert.strictEqual(rawBuffer[1], 0xBB, 'Byte 1 must be 0xBB (BOM)');
    assert.strictEqual(rawBuffer[2], 0xBF, 'Byte 2 must be 0xBF (BOM)');
    const csvContent = rawBuffer.toString('utf-8');
    assert.ok(csvContent.includes('Event ID,Timestamp,Actor'));

    // 5. Employee Assessment with Feedback
    const empHeaders = { 'Content-Type': 'application/json', 'x-employee-id': 'EMP-FEEDBACK-01' };
    await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });

    const answers = {};
    for (let i = 1; i <= 22; i++) answers[`B${String(i).padStart(2, '0')}`] = 2;
    for (let i = 1; i <= 20; i++) answers[`S${String(i).padStart(2, '0')}`] = 1;
    for (let i = 1; i <= 20; i++) answers[`R${String(i).padStart(2, '0')}`] = 2;
    for (let i = 1; i <= 9; i++) answers[`Q${String(i).padStart(2, '0')}`] = 0;
    answers['QP01'] = 0;
    answers['QP02'] = 0;
    answers['QP03'] = 0;

    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeaders,
      body: JSON.stringify({ answers })
    });

    const submitRes = await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({
        snapshot: { firstName: 'กมลวรรณ', lastName: 'สุขใจ' },
        feedback: 'อยากให้จัดกิจกรรมคลายเครียดเพิ่มเติมในออฟฟิศ'
      })
    });
    assert.strictEqual(submitRes.status, 200);
    const submitData = await submitRes.json();
    assert.strictEqual(submitData.feedback, 'อยากให้จัดกิจกรรมคลายเครียดเพิ่มเติมในออฟฟิศ');

    // 6. GET /api/assessment/result returns feedback
    const resultRes = await fetch(`${baseUrl}/api/assessment/result`, {
      headers: empHeaders
    });
    assert.strictEqual(resultRes.status, 200);
    const resultData = await resultRes.json();
    assert.strictEqual(resultData.feedback, 'อยากให้จัดกิจกรรมคลายเครียดเพิ่มเติมในออฟฟิศ');

    // 7. POST /api/assessment/feedback updates feedback
    const updateFbRes = await fetch(`${baseUrl}/api/assessment/feedback`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ feedback: 'ปรับปรุงข้อความ: ขอห้องพักผ่อนเงียบสงบ' })
    });
    assert.strictEqual(updateFbRes.status, 200);
    const updateFbData = await updateFbRes.json();
    assert.strictEqual(updateFbData.success, true);
    assert.strictEqual(updateFbData.feedback, 'ปรับปรุงข้อความ: ขอห้องพักผ่อนเงียบสงบ');

    // 8. Individual results in Admin table includes feedback
    const adminResultsRes = await fetch(`${baseUrl}/api/admin/assessments?search=EMP-FEEDBACK-01`, {
      headers: adminHeaders
    });
    assert.strictEqual(adminResultsRes.status, 200);
    const adminResultsData = await adminResultsRes.json();
    const empItem = adminResultsData.items.find(i => i.employeeId === 'EMP-FEEDBACK-01');
    assert.ok(empItem, 'Employee record must be found in admin table');
    assert.strictEqual(empItem.feedback, 'ปรับปรุงข้อความ: ขอห้องพักผ่อนเงียบสงบ');

  } finally {
    server.close();
  }
});
