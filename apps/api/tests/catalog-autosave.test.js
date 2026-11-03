const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

test('Catalog serving and Autosave answers', async (t) => {
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const empHeaders = {
    'Content-Type': 'application/json',
    'x-employee-id': 'EMP-AUTOSAVE-001'
  };

  try {
    // 1. Can retrieve catalog for Burnout
    const resCatalog = await fetch(`${baseUrl}/api/assessment/catalog/burnout`, {
      headers: empHeaders
    });
    assert.strictEqual(resCatalog.status, 200);
    const catalog = await resCatalog.json();
    assert.strictEqual(catalog.code, 'burnout');
    assert.strictEqual(catalog.questions.length, 22);
    assert.strictEqual(catalog.options.length, 7);

    // 2. Initialize draft by acknowledging notice
    await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });

    // 3. Autosave answers
    const answersToSave = {
      B01: 3,
      B02: 1,
      B03: 0
    };
    const resSave = await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeaders,
      body: JSON.stringify({ answers: answersToSave })
    });
    assert.strictEqual(resSave.status, 200);
    const bodySave = await resSave.json();
    assert.strictEqual(bodySave.success, true);
    assert.strictEqual(bodySave.savedCount, 3);

    // 4. Fetch draft and verify saved answers persist
    const resDraft = await fetch(`${baseUrl}/api/assessment/draft`, {
      headers: empHeaders
    });
    assert.strictEqual(resDraft.status, 200);
    const draft = await resDraft.json();
    assert.strictEqual(draft.answers.B01, 3);
    assert.strictEqual(draft.answers.B02, 1);
    assert.strictEqual(draft.answers.B03, 0);

    // 5. Subsequent incremental autosave updates answers without losing previous answers
    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeaders,
      body: JSON.stringify({ answers: { B04: 5, B01: 4 } })
    });

    const resDraft2 = await fetch(`${baseUrl}/api/assessment/draft`, {
      headers: empHeaders
    });
    const draft2 = await resDraft2.json();
    assert.strictEqual(draft2.answers.B01, 4); // updated
    assert.strictEqual(draft2.answers.B02, 1); // preserved
    assert.strictEqual(draft2.answers.B03, 0); // preserved
    assert.strictEqual(draft2.answers.B04, 5); // newly added
  } finally {
    server.close();
  }
});
