const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');
const { getMongoDatabase, resetMongoDatabase } = require('../src/db/mongo-client');

test('MongoDB Architecture & Document Store Simulation Integration', async (t) => {
  const db = resetMongoDatabase('mental_health_test');
  const app = createApp({ db, seedMock: true });
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Health check reports MongoDB Document Store
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'ok');
    assert.strictEqual(healthData.database, 'connected');
    assert.ok(healthData.databaseDetails);
    assert.strictEqual(healthData.databaseDetails.database, 'mental_health_test');

    // 2. Admin Login
    const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@123456!' })
    });
    assert.strictEqual(loginRes.status, 200);
    const { sessionToken } = await loginRes.json();
    const adminHeaders = { Authorization: `Bearer ${sessionToken}` };

    // 3. Database Overview endpoint returns MongoDB collections & document counts
    const overviewRes = await fetch(`${baseUrl}/api/admin/database/overview`, {
      headers: adminHeaders
    });
    assert.strictEqual(overviewRes.status, 200);
    const overview = await overviewRes.json();
    assert.strictEqual(overview.database, 'mental_health_test');
    assert.ok(overview.collections.assessment_attempts);
    assert.ok(overview.collections.admin_users);
    assert.ok(overview.collections.admin_sessions);
    assert.ok(overview.collections.audit_logs);
    // Seeded mock data: 17 employee assessment attempts in collection across 10 employees (multi-round simulations)
    assert.strictEqual(overview.collections.assessment_attempts.documentCount, 17);
    // At least 1 admin user in collection
    assert.ok(overview.collections.admin_users.documentCount >= 1);
    // At least 1 active session in collection
    assert.ok(overview.collections.admin_sessions.documentCount >= 1);

    // 4. Inspect assessment_attempts collection documents
    const colRes = await fetch(`${baseUrl}/api/admin/database/collections/assessment_attempts?limit=5`, {
      headers: adminHeaders
    });
    assert.strictEqual(colRes.status, 200);
    const colData = await colRes.json();
    assert.strictEqual(colData.collection, 'assessment_attempts');
    assert.strictEqual(colData.items.length, 5);
    assert.strictEqual(colData.pagination.totalCount, 17);

    // Critical PDPA compliance: verify raw survey answers are NOT leaked in collection inspector!
    const sampleDoc = colData.items[0];
    assert.ok(sampleDoc._id, 'Document must have MongoDB _id');
    assert.ok(sampleDoc.employeeId);
    assert.ok(sampleDoc.snapshot);
    assert.ok(sampleDoc.result);
    assert.strictEqual(sampleDoc.answers, undefined, 'Raw survey answers must not be included');

    // 5. Inspect admin_users collection documents
    const usersColRes = await fetch(`${baseUrl}/api/admin/database/collections/admin_users`, {
      headers: adminHeaders
    });
    assert.strictEqual(usersColRes.status, 200);
    const usersColData = await usersColRes.json();
    assert.strictEqual(usersColData.collection, 'admin_users');
    assert.ok(usersColData.items.length >= 1);
    const sampleUser = usersColData.items[0];
    assert.strictEqual(sampleUser.username, 'admin');
    assert.strictEqual(sampleUser.passwordHash, undefined, 'Password hash must be excluded');

    // 6. Audit log collection documents
    const auditColRes = await fetch(`${baseUrl}/api/admin/database/collections/audit_logs`, {
      headers: adminHeaders
    });
    assert.strictEqual(auditColRes.status, 200);
    const auditColData = await auditColRes.json();
    assert.strictEqual(auditColData.collection, 'audit_logs');
    assert.ok(auditColData.items.length >= 1);
    assert.ok(auditColData.items.some((e) => e.action === 'admin_login'));
  } finally {
    server.close();
  }
});
