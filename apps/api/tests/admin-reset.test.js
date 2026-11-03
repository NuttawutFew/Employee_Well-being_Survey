const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');
const { AuditService } = require('../src/modules/audit-service');
const { ATTEMPT_STATUS } = require('@mental-health/shared-contracts');

test('Ticket 14: Admin Reset Assessment Workflow, Attempt Invalidation & Unblocking Employee', async (t) => {
  const auditService = new AuditService();
  const app = createApp({ auditService });

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Admin login
    const resLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@123456!' })
    });
    assert.strictEqual(resLogin.status, 200);
    const { sessionToken } = await resLogin.json();
    const adminHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`
    };

    // 2. Employee EMP-RESET-1 creates and submits an assessment
    const empHeaders = { 'Content-Type': 'application/json', 'x-employee-id': 'EMP-RESET-1' };
    await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });

    const answers = {};
    for (let i = 1; i <= 22; i++) answers[`B${String(i).padStart(2, '0')}`] = 2;
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

    const submitRes = await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({
        snapshot: {
          firstName: 'สมบูรณ์',
          lastName: 'ใจสู้',
          department: 'ฝ่ายผลิต'
        }
      })
    });
    assert.strictEqual(submitRes.status, 200);
    const submitData = await submitRes.json();
    const attemptId = submitData.attemptId;
    assert.ok(attemptId, 'Must have attemptId');

    // Verify employee is locked into SUBMITTED
    const sessionRes1 = await fetch(`${baseUrl}/api/assessment/session`, { headers: empHeaders });
    const sessionData1 = await sessionRes1.json();
    assert.strictEqual(sessionData1.status, ATTEMPT_STATUS.SUBMITTED);

    // 3. Admin views assessments list and verifies it appears
    const listResBefore = await fetch(`${baseUrl}/api/admin/assessments`, { headers: adminHeaders });
    const listDataBefore = await listResBefore.json();
    assert.strictEqual(listDataBefore.pagination.totalCount, 1);
    assert.strictEqual(listDataBefore.items[0].attemptId, attemptId);

    // 4. Test validation: Reset without reason should fail with 400
    const failResetRes = await fetch(`${baseUrl}/api/admin/assessments/${attemptId}/reset`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ reason: '' })
    });
    assert.strictEqual(failResetRes.status, 400, 'Empty reason must be rejected with 400');
    const failResetData = await failResetRes.json();
    assert.strictEqual(failResetData.code, 'VALIDATION_FAILED');

    // 5. Execute Admin Reset with valid reason
    const resetReason = 'พนักงานกรอกข้อมูลผิดพลาด และแจ้งความประสงค์ขอทำแบบประเมินใหม่อีกครั้ง';
    const resetRes = await fetch(`${baseUrl}/api/admin/assessments/${attemptId}/reset`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ reason: resetReason })
    });
    assert.strictEqual(resetRes.status, 200);
    const resetData = await resetRes.json();
    assert.strictEqual(resetData.success, true);
    assert.strictEqual(resetData.status, ATTEMPT_STATUS.CANCELLED);
    assert.strictEqual(resetData.resetRecord.reason, resetReason);
    assert.strictEqual(resetData.resetRecord.actorUsername || resetData.resetRecord.adminId, 'admin');

    // 6. Verify cancelled attempt is EXCLUDED from standard individual listing
    const listResAfter = await fetch(`${baseUrl}/api/admin/assessments`, { headers: adminHeaders });
    const listDataAfter = await listResAfter.json();
    assert.strictEqual(listDataAfter.pagination.totalCount, 0, 'Cancelled attempt must be excluded from active SUBMITTED list');

    // 7. Verify cancelled attempt is EXCLUDED from dashboard metrics
    const dashRes = await fetch(`${baseUrl}/api/admin/dashboard`, { headers: adminHeaders });
    const dashData = await dashRes.json();
    assert.strictEqual(dashData.totalSubmissions, 0, 'Cancelled attempt must be excluded from dashboard totals');

    // 8. Verify Audit Event is recorded
    const auditLogs = await auditService.getEvents({ action: 'admin_reset' });
    assert.strictEqual(auditLogs.items.length, 1);
    assert.strictEqual(auditLogs.items[0].target, attemptId);
    assert.strictEqual(auditLogs.items[0].context.reason, resetReason);

    // 9. Verify Affected Employee is unblocked!
    // When employee checks session, status is no longer SUBMITTED
    const sessionRes2 = await fetch(`${baseUrl}/api/assessment/session`, { headers: empHeaders });
    const sessionData2 = await sessionRes2.json();
    assert.strictEqual(sessionData2.status, null, 'Employee session should be reset/unblocked');

    // Employee acknowledges notice again
    const ackRes2 = await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });
    assert.strictEqual(ackRes2.status, 200, 'Employee should be able to acknowledge notice again');
    const ackData2 = await ackRes2.json();
    assert.strictEqual(ackData2.status, ATTEMPT_STATUS.DRAFT);
    assert.notStrictEqual(ackData2.attemptId, attemptId, 'New draft should have a new attemptId');

    // 10. Immutable preservation: Check that the cancelled attempt is still preserved in detail view
    const detailRes = await fetch(`${baseUrl}/api/admin/assessments/${attemptId}`, { headers: adminHeaders });
    assert.strictEqual(detailRes.status, 200);
    const detailData = await detailRes.json();
    assert.strictEqual(detailData.status, ATTEMPT_STATUS.CANCELLED);
    assert.strictEqual(detailData.cancelledReason, resetReason);
    assert.ok(!detailData.answers, 'Privacy invariant: answers must be omitted even in cancelled detail');

  } finally {
    server.close();
  }
});
