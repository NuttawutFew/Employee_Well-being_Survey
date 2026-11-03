const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

test('Employee Results Summary Calculation & API', async (t) => {
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const empHeaders = {
    'Content-Type': 'application/json',
    'x-employee-id': 'EMP-RESULT-001'
  };

  try {
    // 1. Acknowledge notice
    await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });

    // 2. Fill in all 74 questions
    const allAnswers = {};
    for (let i = 1; i <= 22; i++) allAnswers[`B${String(i).padStart(2, '0')}`] = 2;
    for (let i = 1; i <= 20; i++) allAnswers[`S${String(i).padStart(2, '0')}`] = 1;
    for (let i = 1; i <= 20; i++) allAnswers[`R${String(i).padStart(2, '0')}`] = 3;
    for (let i = 1; i <= 9; i++) allAnswers[`Q${String(i).padStart(2, '0')}`] = 1;
    allAnswers['QP01'] = 1;
    allAnswers['QP02'] = 0;
    allAnswers['QP03'] = 0;

    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeaders,
      body: JSON.stringify({ answers: allAnswers })
    });

    // 3. Submit
    await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: empHeaders
    });

    // 4. Fetch result
    const resResult = await fetch(`${baseUrl}/api/assessment/result`, {
      headers: empHeaders
    });
    assert.strictEqual(resResult.status, 200);
    const body = await resResult.json();
    assert.strictEqual(body.status, 'SUBMITTED');
    assert.ok(body.result);
    assert.ok(body.result.burnout);
    assert.ok(body.result.stress);
    assert.ok(body.result.q9);
    assert.ok(body.result.overall);
    assert.strictEqual(body.result.overall.status, 'NEEDS_ADDITIONAL_CARE');
  } finally {
    server.close();
  }
});
