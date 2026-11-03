const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');
const { AuditService } = require('../src/modules/audit-service');
const { ATTEMPT_STATUS } = require('@mental-health/shared-contracts');

test('Multi-Round History & Assessment Retention Across Resets', async (t) => {
  const auditService = new AuditService();
  const app = createApp({ auditService });

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Admin Login
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

    // 2. Employee EMP-MULTI-001 completes Round 1
    const empHeaders = { 'Content-Type': 'application/json', 'x-employee-id': 'EMP-MULTI-001' };
    const ackRes1 = await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });
    assert.strictEqual(ackRes1.status, 200);
    const ackData1 = await ackRes1.json();
    assert.strictEqual(ackData1.round, 1);

    const answersRound1 = {};
    for (let i = 1; i <= 22; i++) answersRound1[`B${String(i).padStart(2, '0')}`] = 2;
    for (let i = 1; i <= 20; i++) answersRound1[`S${String(i).padStart(2, '0')}`] = 1;
    for (let i = 1; i <= 20; i++) answersRound1[`R${String(i).padStart(2, '0')}`] = 3;
    for (let i = 1; i <= 9; i++) answersRound1[`Q${String(i).padStart(2, '0')}`] = 0;
    answersRound1['QP01'] = 0;
    answersRound1['QP02'] = 0;
    answersRound1['QP03'] = 0;

    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeaders,
      body: JSON.stringify({ answers: answersRound1 })
    });

    const subRes1 = await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({
        snapshot: {
          firstName: 'ณิชา',
          lastName: 'วัฒนกิจ',
          department: 'ฝ่ายเทคโนโลยี'
        },
        feedback: 'ข้อเสนอแนะรอบที่ 1'
      })
    });
    assert.strictEqual(subRes1.status, 200);
    const subData1 = await subRes1.json();
    const round1AttemptId = subData1.attemptId;
    assert.ok(round1AttemptId);
    assert.strictEqual(subData1.round, 1);
    assert.strictEqual(subData1.status, ATTEMPT_STATUS.SUBMITTED);

    // 3. Admin resets Round 1
    const resetReason = 'ขอทำใหม่เนื่องจากเลือกระดับความเครียดผิดพลาดในรอบแรก';
    const resetRes = await fetch(`${baseUrl}/api/admin/assessments/${round1AttemptId}/reset`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ reason: resetReason })
    });
    assert.strictEqual(resetRes.status, 200);

    // 4. Employee starts Round 2
    const sessionRes = await fetch(`${baseUrl}/api/assessment/session`, { headers: empHeaders });
    const sessionData = await sessionRes.json();
    assert.strictEqual(sessionData.status, null, 'Employee unblocked after reset');

    const ackRes2 = await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });
    assert.strictEqual(ackRes2.status, 200);
    const ackData2 = await ackRes2.json();
    assert.strictEqual(ackData2.round, 2, 'New round should be 2');
    const round2DraftId = ackData2.attemptId;
    assert.notStrictEqual(round2DraftId, round1AttemptId, 'Must be a distinct attempt ID');

    // 5. Employee submits Round 2
    const answersRound2 = { ...answersRound1 };
    // Change some stress scores
    for (let i = 1; i <= 20; i++) answersRound2[`S${String(i).padStart(2, '0')}`] = 2;

    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeaders,
      body: JSON.stringify({ answers: answersRound2 })
    });

    const subRes2 = await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({
        snapshot: {
          firstName: 'ณิชา',
          lastName: 'วัฒนกิจ',
          department: 'ฝ่ายเทคโนโลยี'
        },
        feedback: 'ข้อเสนอแนะรอบที่ 2 (ทำใหม่แล้วสบายใจขึ้น)'
      })
    });
    assert.strictEqual(subRes2.status, 200);
    const subData2 = await subRes2.json();
    const round2AttemptId = subData2.attemptId;
    assert.strictEqual(round2AttemptId, round2DraftId);
    assert.strictEqual(subData2.round, 2);

    // 6. Verify Admin List contains Round 2 with full historical attempts array
    const listRes = await fetch(`${baseUrl}/api/admin/assessments?search=EMP-MULTI-001`, { headers: adminHeaders });
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.strictEqual(listData.items.length, 1);
    const item = listData.items[0];
    assert.strictEqual(item.employeeId, 'EMP-MULTI-001');
    assert.strictEqual(item.attemptId, round2AttemptId);
    assert.strictEqual(item.round, 2);
    assert.strictEqual(item.totalRounds, 2);
    assert.ok(Array.isArray(item.attempts), 'Must include attempts array');
    assert.strictEqual(item.attempts.length, 2, 'Should keep both Round 1 and Round 2');

    // Check attempts[0] is Round 1 (Cancelled)
    assert.strictEqual(item.attempts[0].attemptId, round1AttemptId);
    assert.strictEqual(item.attempts[0].round, 1);
    assert.strictEqual(item.attempts[0].status, ATTEMPT_STATUS.CANCELLED);
    assert.strictEqual(item.attempts[0].cancelledReason, resetReason);
    assert.strictEqual(item.attempts[0].feedback, 'ข้อเสนอแนะรอบที่ 1');

    // Check attempts[1] is Round 2 (Submitted)
    assert.strictEqual(item.attempts[1].attemptId, round2AttemptId);
    assert.strictEqual(item.attempts[1].round, 2);
    assert.strictEqual(item.attempts[1].status, ATTEMPT_STATUS.SUBMITTED);
    assert.strictEqual(item.attempts[1].feedback, 'ข้อเสนอแนะรอบที่ 2 (ทำใหม่แล้วสบายใจขึ้น)');

    // 7. Verify Admin Detail for Round 2
    const detail2Res = await fetch(`${baseUrl}/api/admin/assessments/${round2AttemptId}`, { headers: adminHeaders });
    assert.strictEqual(detail2Res.status, 200);
    const detail2 = await detail2Res.json();
    assert.strictEqual(detail2.round, 2);
    assert.strictEqual(detail2.totalRounds, 2);
    assert.strictEqual(detail2.attempts.length, 2);
    assert.ok(!detail2.answers, 'PDPA Privacy: never leak answers');

    // 8. Verify Admin Detail for Round 1
    const detail1Res = await fetch(`${baseUrl}/api/admin/assessments/${round1AttemptId}`, { headers: adminHeaders });
    assert.strictEqual(detail1Res.status, 200);
    const detail1 = await detail1Res.json();
    assert.strictEqual(detail1.round, 1);
    assert.strictEqual(detail1.status, ATTEMPT_STATUS.CANCELLED);
    assert.strictEqual(detail1.cancelledReason, resetReason);
    assert.strictEqual(detail1.totalRounds, 2);
    assert.strictEqual(detail1.attempts.length, 2);
    assert.ok(!detail1.answers, 'PDPA Privacy: never leak answers');

    // 9. Verify Employee getResult endpoint returns both rounds
    const empResultRes = await fetch(`${baseUrl}/api/assessment/result`, { headers: empHeaders });
    assert.strictEqual(empResultRes.status, 200);
    const empResult = await empResultRes.json();
    assert.strictEqual(empResult.round, 2);
    assert.strictEqual(empResult.totalRounds, 2);
    assert.strictEqual(empResult.attempts.length, 2);

    // 10. Admin resets Round 2 to test Round 3 creation without overwriting Round 2
    const resetReason2 = 'อยากให้ทำใหม่รอบที่ 3';
    const resetRes2 = await fetch(`${baseUrl}/api/admin/assessments/${round2AttemptId}/reset`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ reason: resetReason2 })
    });
    assert.strictEqual(resetRes2.status, 200);

    // 11. Employee performs Round 3
    const ackRes3 = await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });
    assert.strictEqual(ackRes3.status, 200);
    const ackData3 = await ackRes3.json();
    assert.strictEqual(ackData3.round, 3, 'New round must be 3');
    const round3DraftId = ackData3.attemptId;
    assert.notStrictEqual(round3DraftId, round1AttemptId);
    assert.notStrictEqual(round3DraftId, round2AttemptId);

    // Employee submits Round 3 without feedback
    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeaders,
      body: JSON.stringify({ answers: answersRound2 })
    });

    const subRes3 = await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({
        snapshot: {
          firstName: 'ณิชา',
          lastName: 'วัฒนกิจ',
          department: 'ฝ่ายเทคโนโลยี'
        }
      })
    });
    assert.strictEqual(subRes3.status, 200);
    const subData3 = await subRes3.json();
    assert.strictEqual(subData3.round, 3);
    assert.strictEqual(subData3.feedback, null, 'Round 3 feedback must be null when not provided');

    // 12. Verify Admin List contains Round 3 and retains ALL 3 ROUNDS
    const listRes3 = await fetch(`${baseUrl}/api/admin/assessments?search=EMP-MULTI-001`, { headers: adminHeaders });
    assert.strictEqual(listRes3.status, 200);
    const listData3 = await listRes3.json();
    assert.strictEqual(listData3.items.length, 1);
    const item3 = listData3.items[0];
    assert.strictEqual(item3.round, 3);
    assert.strictEqual(item3.totalRounds, 3);
    assert.strictEqual(item3.attempts.length, 3, 'Must retain all 3 rounds in history');

    // Round 1
    assert.strictEqual(item3.attempts[0].round, 1);
    assert.strictEqual(item3.attempts[0].status, ATTEMPT_STATUS.CANCELLED);
    assert.strictEqual(item3.attempts[0].cancelledReason, resetReason);
    assert.strictEqual(item3.attempts[0].feedback, 'ข้อเสนอแนะรอบที่ 1');

    // Round 2
    assert.strictEqual(item3.attempts[1].round, 2);
    assert.strictEqual(item3.attempts[1].status, ATTEMPT_STATUS.CANCELLED);
    assert.strictEqual(item3.attempts[1].cancelledReason, resetReason2);
    assert.strictEqual(item3.attempts[1].feedback, 'ข้อเสนอแนะรอบที่ 2 (ทำใหม่แล้วสบายใจขึ้น)');

    // Round 3
    assert.strictEqual(item3.attempts[2].round, 3);
    assert.strictEqual(item3.attempts[2].status, ATTEMPT_STATUS.SUBMITTED);
    assert.strictEqual(item3.attempts[2].feedback, null);

  } finally {
    server.close();
  }
});
