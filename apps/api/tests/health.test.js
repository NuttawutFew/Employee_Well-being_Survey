const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

test('GET /api/health returns 200 and healthy status', async (t) => {
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.service, 'mental-health-api');
    assert.ok(body.timestamp);
    assert.strictEqual(body.database, 'not_configured');
  } finally {
    server.close();
  }
});

test('GET /api/health with mock DB connection returns connected', async (t) => {
  const mockDb = {
    query: async (sql) => {
      if (sql === 'SELECT 1') return { rows: [{ '?column?': 1 }] };
      throw new Error('Unexpected query');
    }
  };

  const app = createApp({ db: mockDb });
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.database, 'connected');
  } finally {
    server.close();
  }
});
