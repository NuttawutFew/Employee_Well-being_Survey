const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

test('One-Time Assessment Invariant & Draft Management (Ticket 08)', async (t) => {
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const empHeaders = {
    'Content-Type': 'application/json',
    'x-employee-id': 'EMP-INVARIANT-001'
  };

  try {
    // 1. Initial State: not acknowledged
    const resInit = await fetch(`${baseUrl}/api/assessment/session`, { headers: empHeaders });
    assert.strictEqual(resInit.status, 200);
    const sessionInit = await resInit.json();
    assert.strictEqual(sessionInit.noticeAcknowledged, false);
    assert.strictEqual(sessionInit.status, null);

    // 2. Acknowledge Notice -> DRAFT
    const resAck = await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });
    assert.strictEqual(resAck.status, 200);
    const ackData = await resAck.json();
    assert.strictEqual(ackData.status, 'DRAFT');

    // 3. Save some draft answers
    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeaders,
      body: JSON.stringify({ answers: { B01: 2, B02: 1 } })
    });

    // 4. Test Draft Management: Clear Draft
    const resClear = await fetch(`${baseUrl}/api/assessment/draft/clear`, {
      method: 'POST',
      headers: empHeaders
    });
    assert.strictEqual(resClear.status, 200);

    // After clear, session should be reset to unacknowledged
    const resAfterClear = await fetch(`${baseUrl}/api/assessment/session`, { headers: empHeaders });
    const sessionAfterClear = await resAfterClear.json();
    assert.strictEqual(sessionAfterClear.noticeAcknowledged, false);
    assert.strictEqual(sessionAfterClear.status, null);

    // 5. Re-acknowledge after clear -> can start fresh
    await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });

    const resFreshDraft = await fetch(`${baseUrl}/api/assessment/draft`, { headers: empHeaders });
    const freshDraftData = await resFreshDraft.json();
    assert.deepStrictEqual(freshDraftData.answers, {});
    assert.strictEqual(freshDraftData.currentStepIndex, 0);

    // 6. Fill all 74 questions
    const allAnswers = {};
    for (let i = 1; i <= 22; i++) allAnswers[`B${String(i).padStart(2, '0')}`] = 1;
    for (let i = 1; i <= 20; i++) allAnswers[`S${String(i).padStart(2, '0')}`] = 0;
    for (let i = 1; i <= 20; i++) allAnswers[`R${String(i).padStart(2, '0')}`] = 3;
    for (let i = 1; i <= 9; i++) allAnswers[`Q${String(i).padStart(2, '0')}`] = 0;
    allAnswers['QP01'] = 0;
    allAnswers['QP02'] = 0;
    allAnswers['QP03'] = 0;

    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeaders,
      body: JSON.stringify({ answers: allAnswers })
    });

    // 7. Submit assessment
    const resSubmit = await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: empHeaders
    });
    assert.strictEqual(resSubmit.status, 200);
    const submitData = await resSubmit.json();
    assert.strictEqual(submitData.status, 'SUBMITTED');
    const firstSubmittedAt = submitData.submittedAt;

    // 8. Invariant Check: Subsequent Login (GET session) directly returns SUBMITTED
    const resSessionSub = await fetch(`${baseUrl}/api/assessment/session`, { headers: empHeaders });
    const sessionSub = await resSessionSub.json();
    assert.strictEqual(sessionSub.status, 'SUBMITTED');
    assert.strictEqual(sessionSub.submittedAt, firstSubmittedAt);
    assert.ok(sessionSub.result);

    // 9. Invariant Check: Cannot create a new draft or re-acknowledge notice
    const resDupAck = await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });
    assert.strictEqual(resDupAck.status, 409);
    const dupAckError = await resDupAck.json();
    assert.strictEqual(dupAckError.code, 'SINGLE_SUBMISSION_VIOLATION');

    // 10. Invariant Check: Cannot modify answers once submitted (ATTEMPT_LOCKED)
    const resLockedSave = await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeaders,
      body: JSON.stringify({ answers: { B01: 4 } })
    });
    assert.strictEqual(resLockedSave.status, 400);
    const lockedSaveError = await resLockedSave.json();
    assert.strictEqual(lockedSaveError.code, 'ATTEMPT_LOCKED');

    // 11. Invariant Check: Cannot clear a submitted assessment
    const resLockedClear = await fetch(`${baseUrl}/api/assessment/draft/clear`, {
      method: 'POST',
      headers: empHeaders
    });
    assert.strictEqual(resLockedClear.status, 400);

    // 12. Invariant Check: Idempotent submit returns identical submitted status
    const resIdempotentSubmit = await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: empHeaders
    });
    assert.strictEqual(resIdempotentSubmit.status, 200);
    const idempotentData = await resIdempotentSubmit.json();
    assert.strictEqual(idempotentData.status, 'SUBMITTED');
    assert.strictEqual(idempotentData.submittedAt, firstSubmittedAt);
  } finally {
    server.close();
  }
});
