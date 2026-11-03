const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');
const { AuditService } = require('../src/modules/audit-service');
const { AssessmentSessionService } = require('../src/modules/assessment-session');
const { ATTEMPT_STATUS } = require('@mental-health/shared-contracts');

test('Ticket 15: Enterprise Audit Logging Trail & 3-Year Data Retention Anonymization', async (t) => {
  const auditService = new AuditService();
  const sessionService = new AssessmentSessionService({ auditService });
  const app = createApp({ sessionService, auditService });

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Audit Logging: Verify login logs admin_login
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

    const loginLogs = await auditService.getEvents({ action: 'admin_login' });
    assert.ok(loginLogs.items.length >= 1, 'admin_login event must be logged');
    assert.strictEqual(loginLogs.items[0].actor, 'admin');

    // 2. Sensitive Data Leak Prevention Invariant:
    // Log an event with credentials, tokens, and answers to verify they are stripped
    await auditService.logEvent({
      actor: 'security_test',
      action: 'test_scrubbing',
      context: {
        password: 'SuperSecretPassword!',
        passwordHash: 'argon2id$hash',
        sessionToken: 'token-12345',
        shareToken: 'share-999',
        answers: { B01: 3, S01: 2 },
        rawAnswers: { R01: 4 },
        scores: { burnout: 2.5, stress: 14 },
        rawScores: { rq: 42 },
        diagnosis: 'Severe depression risk',
        mentalHealthScores: [1, 2, 3],
        safeData: 'allowed_field'
      },
      actorRole: 'HR_OFFICER',
      status: 'SUCCESS',
      purpose: 'ทดสอบการคัดกรองข้อมูลตามหลัก PDPA Data Minimization',
      userAgent: 'Mozilla/5.0 TestAgent'
    });
    const scrubbedEvents = await auditService.getEvents({ action: 'test_scrubbing' });
    assert.strictEqual(scrubbedEvents.items.length, 1);
    const scrubbedItem = scrubbedEvents.items[0];
    assert.strictEqual(scrubbedItem.actorRole, 'HR_OFFICER');
    assert.strictEqual(scrubbedItem.status, 'SUCCESS');
    assert.strictEqual(scrubbedItem.purpose, 'ทดสอบการคัดกรองข้อมูลตามหลัก PDPA Data Minimization');
    assert.strictEqual(scrubbedItem.userAgent, 'Mozilla/5.0 TestAgent');
    const scrubbedCtx = scrubbedItem.context;
    assert.strictEqual(scrubbedCtx.password, undefined);
    assert.strictEqual(scrubbedCtx.passwordHash, undefined);
    assert.strictEqual(scrubbedCtx.sessionToken, undefined);
    assert.strictEqual(scrubbedCtx.shareToken, undefined);
    assert.strictEqual(scrubbedCtx.answers, undefined);
    assert.strictEqual(scrubbedCtx.rawAnswers, undefined);
    assert.strictEqual(scrubbedCtx.scores, undefined, 'Scores must be scrubbed from audit context');
    assert.strictEqual(scrubbedCtx.rawScores, undefined, 'rawScores must be scrubbed');
    assert.strictEqual(scrubbedCtx.diagnosis, undefined, 'diagnosis must be scrubbed');
    assert.strictEqual(scrubbedCtx.mentalHealthScores, undefined, 'mentalHealthScores must be scrubbed');
    assert.strictEqual(scrubbedCtx.safeData, 'allowed_field');

    // 3. Create Sample Assessments:
    // a. Recent assessment (< 3 years old)
    const empHeadersRecent = { 'Content-Type': 'application/json', 'x-employee-id': 'EMP-RECENT' };
    await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeadersRecent,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });
    const answersRecent = {};
    for (let i = 1; i <= 22; i++) answersRecent[`B${String(i).padStart(2, '0')}`] = 1;
    for (let i = 1; i <= 20; i++) answersRecent[`S${String(i).padStart(2, '0')}`] = 1;
    for (let i = 1; i <= 20; i++) answersRecent[`R${String(i).padStart(2, '0')}`] = 3;
    for (let i = 1; i <= 9; i++) answersRecent[`Q${String(i).padStart(2, '0')}`] = 0;
    answersRecent['QP01'] = 0;
    answersRecent['QP02'] = 0;
    answersRecent['QP03'] = 0;
    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeadersRecent,
      body: JSON.stringify({ answers: answersRecent })
    });
    const submitRecentRes = await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: empHeadersRecent,
      body: JSON.stringify({
        snapshot: {
          firstName: 'สมบูรณ์',
          lastName: 'คนปัจจุบัน',
          telephone: '081-111-2222',
          department: 'วิศวกรรม'
        }
      })
    });
    const { attemptId: recentAttemptId } = await submitRecentRes.json();

    // b. Old submitted assessment (> 3 years old)
    const empHeadersOld = { 'Content-Type': 'application/json', 'x-employee-id': 'EMP-OLD-1' };
    await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeadersOld,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });
    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeadersOld,
      body: JSON.stringify({ answers: answersRecent })
    });
    const submitOldRes = await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: empHeadersOld,
      body: JSON.stringify({
        snapshot: {
          firstName: 'กานต์',
          lastName: 'ผู้มาก่อน',
          telephone: '089-999-8888',
          department: 'การตลาด',
          company: 'บริษัท อรุณ กรุ๊ป จำกัด',
          age: 40
        }
      })
    });
    const { attemptId: oldAttemptId } = await submitOldRes.json();

    // c. Old cancelled assessment (> 3 years old)
    const empHeadersOldCancelled = { 'Content-Type': 'application/json', 'x-employee-id': 'EMP-OLD-2' };
    await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeadersOldCancelled,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });
    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeadersOldCancelled,
      body: JSON.stringify({ answers: answersRecent })
    });
    const submitOldCanRes = await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: empHeadersOldCancelled,
      body: JSON.stringify({
        snapshot: {
          firstName: 'วิชัย',
          lastName: 'ยกเลิกเก่า',
          telephone: '082-333-4444',
          department: 'การเงิน'
        }
      })
    });
    const { attemptId: oldCancelledAttemptId } = await submitOldCanRes.json();
    // Admin resets the attempt to Cancelled
    await fetch(`${baseUrl}/api/admin/assessments/${oldCancelledAttemptId}/reset`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ reason: 'ข้อมูลเก่าขอยกเลิก' })
    });

    // 4. Check View Individual & Export Audit Events
    await fetch(`${baseUrl}/api/admin/assessments/${recentAttemptId}`, { headers: adminHeaders });
    const viewLogs = await auditService.getEvents({ action: 'admin_view_individual' });
    assert.ok(viewLogs.items.length >= 1, 'admin_view_individual must be logged');

    await fetch(`${baseUrl}/api/admin/export`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ format: 'csv', password: 'Admin@123456!' })
    });
    const exportLogs = await auditService.getEvents({ action: 'admin_export' });
    assert.ok(exportLogs.items.length >= 1, 'admin_export must be logged');

    // Check query endpoint GET /api/admin/audit-logs
    const auditRes = await fetch(`${baseUrl}/api/admin/audit-logs?page=1&limit=50`, { headers: adminHeaders });
    assert.strictEqual(auditRes.status, 200);
    const auditData = await auditRes.json();
    assert.ok(auditData.items.length >= 4, 'Audit trail should include multiple actions');

    // 5. Backdate the 2 old records to 4 years ago (> 3 years)
    const fourYearsAgo = new Date();
    fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);
    const fourYearsAgoIso = fourYearsAgo.toISOString();

    const oldSubmittedAttempt = sessionService.allAttempts.get(oldAttemptId);
    oldSubmittedAttempt.submittedAt = fourYearsAgoIso;
    oldSubmittedAttempt.createdAt = fourYearsAgoIso;

    const oldCancelledAttempt = sessionService.allAttempts.get(oldCancelledAttemptId);
    oldCancelledAttempt.submittedAt = fourYearsAgoIso;
    oldCancelledAttempt.cancelledAt = fourYearsAgoIso;
    oldCancelledAttempt.createdAt = fourYearsAgoIso;

    // 6. Trigger Retention Worker Anonymization
    const retRes1 = await fetch(`${baseUrl}/api/admin/audit-logs/retention/run`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert.strictEqual(retRes1.status, 200);
    const retData1 = await retRes1.json();
    assert.strictEqual(retData1.success, true);
    assert.strictEqual(retData1.anonymizedCount, 2, 'Must anonymize exactly 2 old records');

    // Verify identifiable columns in the old record are permanently purged
    const anonymizedRecord = sessionService.allAttempts.get(oldAttemptId);
    assert.strictEqual(anonymizedRecord.snapshot.firstName, '[ANONYMIZED]');
    assert.strictEqual(anonymizedRecord.snapshot.lastName, '[ANONYMIZED]');
    assert.strictEqual(anonymizedRecord.snapshot.telephone, null);
    assert.ok(anonymizedRecord.employeeId.startsWith('ANON-'));

    // Verify coarse statistical attributes are PRESERVED
    assert.strictEqual(anonymizedRecord.snapshot.department, 'การตลาด');
    assert.strictEqual(anonymizedRecord.snapshot.company, 'บริษัท อรุณ กรุ๊ป จำกัด');
    assert.strictEqual(anonymizedRecord.snapshot.age, 40);
    assert.ok(anonymizedRecord.result);

    // Verify recent record is NOT anonymized
    const recentRecord = sessionService.allAttempts.get(recentAttemptId);
    assert.strictEqual(recentRecord.snapshot.firstName, 'สมบูรณ์');
    assert.strictEqual(recentRecord.snapshot.lastName, 'คนปัจจุบัน');
    assert.strictEqual(recentRecord.snapshot.telephone, '081-111-2222');
    assert.strictEqual(recentRecord.employeeId, 'EMP-RECENT');

    // 7. Idempotency: Running retention worker again must make 0 changes
    const retRes2 = await fetch(`${baseUrl}/api/admin/audit-logs/retention/run`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert.strictEqual(retRes2.status, 200);
    const retData2 = await retRes2.json();
    assert.strictEqual(retData2.anonymizedCount, 0, 'Idempotent: 0 newly anonymized');

    // Verify retention_anonymize event is recorded in audit log
    const retLogs = await auditService.getEvents({ action: 'retention_anonymize' });
    assert.ok(retLogs.items.length >= 1, 'retention_anonymize event must be in audit log');

  } finally {
    server.close();
  }
});
