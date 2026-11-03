const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

test('Assessment Notice & Draft Lifecycle', async (t) => {
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const empHeaders = {
    'Content-Type': 'application/json',
    'x-employee-id': 'EMP-TEST-001'
  };

  try {
    // 1. Initial state: notice not acknowledged, no draft
    const resInitial = await fetch(`${baseUrl}/api/assessment/session`, {
      headers: empHeaders
    });
    assert.strictEqual(resInitial.status, 200);
    const bodyInitial = await resInitial.json();
    assert.strictEqual(bodyInitial.noticeAcknowledged, false);
    assert.strictEqual(bodyInitial.status, null);

    // 2. Cannot access draft before notice acknowledgment
    const resDraftForbidden = await fetch(`${baseUrl}/api/assessment/draft`, {
      headers: empHeaders
    });
    assert.strictEqual(resDraftForbidden.status, 403);
    const bodyForbidden = await resDraftForbidden.json();
    assert.strictEqual(bodyForbidden.code, 'FORBIDDEN');

    // 3. Acknowledge notice
    const resAck = await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });
    assert.strictEqual(resAck.status, 200);
    const bodyAck = await resAck.json();
    assert.strictEqual(bodyAck.status, 'DRAFT');
    assert.ok(bodyAck.attemptId);
    assert.ok(bodyAck.noticeAcknowledgedAt);

    // 4. Session now shows acknowledged and active draft
    const resSession = await fetch(`${baseUrl}/api/assessment/session`, {
      headers: empHeaders
    });
    assert.strictEqual(resSession.status, 200);
    const bodySession = await resSession.json();
    assert.strictEqual(bodySession.noticeAcknowledged, true);
    assert.strictEqual(bodySession.status, 'DRAFT');
    assert.strictEqual(bodySession.attemptId, bodyAck.attemptId);

    // 5. Can access draft now
    const resDraft = await fetch(`${baseUrl}/api/assessment/draft`, {
      headers: empHeaders
    });
    assert.strictEqual(resDraft.status, 200);
    const bodyDraft = await resDraft.json();
    assert.strictEqual(bodyDraft.attemptId, bodyAck.attemptId);
    assert.deepStrictEqual(bodyDraft.answers, {});
  } finally {
    server.close();
  }
});
