const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');
const { AssessmentSessionService } = require('../src/modules/assessment-session');

test('Session Draft TTL - 15 minutes retention and auto-reset when expired', async (t) => {
  const sessionService = new AssessmentSessionService({ draftTtlMinutes: 15 });
  const app = createApp({ sessionService });
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const empHeaders = {
    'Content-Type': 'application/json',
    'x-employee-id': 'EMP-TTL-TEST-001'
  };

  try {
    // 1. Initial acknowledge notice
    const resAck = await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });
    assert.strictEqual(resAck.status, 200);

    // 2. Save draft answers
    const resSave = await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeaders,
      body: JSON.stringify({ answers: { B01: 3, B02: 2 } })
    });
    assert.strictEqual(resSave.status, 200);
    const saveBody = await resSave.json();
    assert.strictEqual(saveBody.savedCount, 2);
    assert.ok(saveBody.draftExpiresAt, 'Should return draftExpiresAt');
    assert.strictEqual(saveBody.draftTtlMinutes, 15);

    // 3. User leaves and returns within 15 minutes (e.g. 5 minutes later)
    // Verify session remembers the draft
    const resSessionActive = await fetch(`${baseUrl}/api/assessment/session`, {
      headers: empHeaders
    });
    assert.strictEqual(resSessionActive.status, 200);
    const sessionActive = await resSessionActive.json();
    assert.strictEqual(sessionActive.noticeAcknowledged, true);
    assert.strictEqual(sessionActive.status, 'DRAFT');
    assert.strictEqual(sessionActive.savedCount, 2);
    assert.ok(sessionActive.remainingMs > 0, 'Remaining ms should be positive');

    // Verify draft data is intact
    const resDraftActive = await fetch(`${baseUrl}/api/assessment/draft`, {
      headers: empHeaders
    });
    assert.strictEqual(resDraftActive.status, 200);
    const draftActive = await resDraftActive.json();
    assert.strictEqual(draftActive.answers.B01, 3);
    assert.strictEqual(draftActive.answers.B02, 2);

    // 4. Simulate user leaving for longer than 15 minutes (e.g. 16 minutes)
    const attempt = sessionService.memoryAttempts.get('EMP-TTL-TEST-001');
    assert.ok(attempt);
    attempt.updatedAt = new Date(Date.now() - 16 * 60 * 1000).toISOString();

    // 5. User returns after 16 minutes: session should auto-reset!
    const resSessionExpired = await fetch(`${baseUrl}/api/assessment/session`, {
      headers: empHeaders
    });
    assert.strictEqual(resSessionExpired.status, 200);
    const sessionExpired = await resSessionExpired.json();
    assert.strictEqual(sessionExpired.noticeAcknowledged, false, 'Should reset notice acknowledge');
    assert.strictEqual(sessionExpired.status, null, 'Status should be reset to null');
    assert.strictEqual(sessionExpired.draftExpired, true, 'draftExpired flag should be true');

    // 6. Accessing draft should return 403 / 410 because notice was cleared
    const resDraftExpired = await fetch(`${baseUrl}/api/assessment/draft`, {
      headers: empHeaders
    });
    assert.strictEqual(resDraftExpired.status, 403);

    // Attempt answers in memory should be wiped
    assert.deepStrictEqual(attempt.answers, {});

    // 7. User starts fresh again after expiration
    const resAckNew = await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });
    assert.strictEqual(resAckNew.status, 200);

    const resDraftFresh = await fetch(`${baseUrl}/api/assessment/draft`, {
      headers: empHeaders
    });
    assert.strictEqual(resDraftFresh.status, 200);
    const draftFresh = await resDraftFresh.json();
    assert.deepStrictEqual(draftFresh.answers, {}, 'New attempt answers should be completely empty');
  } finally {
    server.close();
  }
});
