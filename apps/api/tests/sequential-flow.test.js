const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

test('Sequential Assessment Flow & Server-side Validation', async (t) => {
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const empHeaders = {
    'Content-Type': 'application/json',
    'x-employee-id': 'EMP-FLOW-001'
  };

  try {
    // 1. Initialize draft
    await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });

    // 2. Initially at Step 0 (Burnout)
    const resDraft = await fetch(`${baseUrl}/api/assessment/draft`, {
      headers: empHeaders
    });
    const draft = await resDraft.json();
    assert.strictEqual(draft.currentStepIndex, 0);

    // 3. Attempt to advance step when incomplete -> should fail with 400 and list missing questions
    const resNextIncomplete = await fetch(`${baseUrl}/api/assessment/draft/step/next`, {
      method: 'POST',
      headers: empHeaders
    });
    assert.strictEqual(resNextIncomplete.status, 400);
    const bodyIncomplete = await resNextIncomplete.json();
    assert.strictEqual(bodyIncomplete.code, 'VALIDATION_FAILED');
    assert.ok(bodyIncomplete.missingQuestions.length > 0);

    // 4. Answer all 22 Burnout questions
    const burnoutAnswers = {};
    for (let i = 1; i <= 22; i++) {
      const code = `B${String(i).padStart(2, '0')}`;
      burnoutAnswers[code] = 2;
    }
    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeaders,
      body: JSON.stringify({ answers: burnoutAnswers })
    });

    // 5. Advance step -> should succeed and move to Step 1 (Stress)
    const resNextSuccess = await fetch(`${baseUrl}/api/assessment/draft/step/next`, {
      method: 'POST',
      headers: empHeaders
    });
    assert.strictEqual(resNextSuccess.status, 200);
    const bodyNext = await resNextSuccess.json();
    assert.strictEqual(bodyNext.currentStepIndex, 1);
    assert.strictEqual(bodyNext.currentAssessmentCode, 'stress');

    // 6. Can navigate backward to Step 0
    const resPrev = await fetch(`${baseUrl}/api/assessment/draft/step/prev`, {
      method: 'POST',
      headers: empHeaders
    });
    assert.strictEqual(resPrev.status, 200);
    const bodyPrev = await resPrev.json();
    assert.strictEqual(bodyPrev.currentStepIndex, 0);
  } finally {
    server.close();
  }
});
