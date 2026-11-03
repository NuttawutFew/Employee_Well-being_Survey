const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

test('Atomic Idempotent Submission & Snapshot Creation', async (t) => {
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const empHeaders = {
    'Content-Type': 'application/json',
    'x-employee-id': 'EMP-SUBMIT-001'
  };

  try {
    // 1. Initialize draft
    await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });

    // 2. Submit prematurely (before answering all 74 questions) -> should fail 400
    const resSubmitIncomplete = await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: empHeaders
    });
    assert.strictEqual(resSubmitIncomplete.status, 400);
    const bodyIncomplete = await resSubmitIncomplete.json();
    assert.strictEqual(bodyIncomplete.code, 'VALIDATION_FAILED');

    // 3. Fill in all 74 questions
    const allAnswers = {};
    // Burnout (22)
    for (let i = 1; i <= 22; i++) allAnswers[`B${String(i).padStart(2, '0')}`] = 2;
    // Stress (20)
    for (let i = 1; i <= 20; i++) allAnswers[`S${String(i).padStart(2, '0')}`] = 1;
    // RQ (20)
    for (let i = 1; i <= 20; i++) allAnswers[`R${String(i).padStart(2, '0')}`] = 3;
    // 9Q (9)
    for (let i = 1; i <= 9; i++) allAnswers[`Q${String(i).padStart(2, '0')}`] = 1;
    // 2Q Plus (3)
    allAnswers['QP01'] = 0;
    allAnswers['QP02'] = 0;
    allAnswers['QP03'] = 0;

    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeaders,
      body: JSON.stringify({ answers: allAnswers })
    });

    // 4. Submit assessment -> should succeed with status SUBMITTED
    const resSubmit = await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: empHeaders
    });
    assert.strictEqual(resSubmit.status, 200);
    const bodySubmit = await resSubmit.json();
    assert.strictEqual(bodySubmit.status, 'SUBMITTED');
    assert.ok(bodySubmit.submittedAt);
    assert.ok(bodySubmit.snapshot);
    assert.strictEqual(bodySubmit.snapshot.employeeId, 'EMP-SUBMIT-001');

    // 5. Idempotent check: calling submit again returns the same submitted record
    const resSubmitDuplicate = await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: empHeaders
    });
    assert.strictEqual(resSubmitDuplicate.status, 200);
    const bodyDup = await resSubmitDuplicate.json();
    assert.strictEqual(bodyDup.attemptId, bodySubmit.attemptId);
    assert.strictEqual(bodyDup.status, 'SUBMITTED');

    // 6. Mutating answers after submission is forbidden (409 Conflict / Locked)
    const resMutateAfterSubmit = await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeaders,
      body: JSON.stringify({ answers: { B01: 5 } })
    });
    assert.strictEqual(resMutateAfterSubmit.status, 400);
    const bodyMutate = await resMutateAfterSubmit.json();
    assert.strictEqual(bodyMutate.code, 'ATTEMPT_LOCKED');
  } finally {
    server.close();
  }
});
