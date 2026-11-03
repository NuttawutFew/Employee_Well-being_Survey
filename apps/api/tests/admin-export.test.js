const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');
const { AuditService } = require('../src/modules/audit-service');
const { ExportService, SENSITIVE_WARNING } = require('../src/modules/export-service');

test('Ticket 13: Secure Admin Report Export (CSV & HTML/PDF) and Audit Logging', async (t) => {
  const auditService = new AuditService();
  const exportService = new ExportService({ auditService });
  const app = createApp({ auditService, exportService });

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Admin login
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

    // 2. Submit sample assessments
    const empHeaders = { 'Content-Type': 'application/json', 'x-employee-id': 'EMP-EXP-1' };
    await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ noticeVersion: '2026-09-03' })
    });

    const answers = {};
    for (let i = 1; i <= 22; i++) answers[`B${String(i).padStart(2, '0')}`] = 2;
    for (let i = 1; i <= 20; i++) answers[`S${String(i).padStart(2, '0')}`] = 1;
    for (let i = 1; i <= 20; i++) answers[`R${String(i).padStart(2, '0')}`] = 3;
    for (let i = 1; i <= 9; i++) answers[`Q${String(i).padStart(2, '0')}`] = 0;
    answers['QP01'] = 0;
    answers['QP02'] = 0;
    answers['QP03'] = 0;

    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: empHeaders,
      body: JSON.stringify({ answers })
    });

    await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({
        snapshot: {
          firstName: 'สมบูรณ์',
          lastName: 'ส่งออก',
          company: 'บริษัท เอ็กซ์ปอร์ต จำกัด',
          department: 'ฝ่ายส่งออก',
          position: 'ผู้จัดการ',
          workArea: 'สำนักงานใหญ่'
        }
      })
    });

    // 3. Unauthorized access check
    const unauthRes = await fetch(`${baseUrl}/api/admin/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'csv' })
    });
    assert.strictEqual(unauthRes.status, 401);

    // 3.1 Verify Invalid Password (Step 15, 24)
    const invalidPwRes = await fetch(`${baseUrl}/api/admin/export`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ format: 'csv', password: 'WrongPassword!' })
    });
    assert.strictEqual(invalidPwRes.status, 401);
    const invalidPwData = await invalidPwRes.json();
    assert.strictEqual(invalidPwData.code, 'INVALID_PASSWORD');
    assert.ok(invalidPwData.message.includes('ไม่สามารถดาวน์โหลดเอกสารได้'));

    // 4. Request CSV Export with correct password
    const csvExportRes = await fetch(`${baseUrl}/api/admin/export`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        format: 'csv',
        password: 'Admin@123456!',
        filters: { department: ['ฝ่ายส่งออก'] }
      })
    });
    assert.strictEqual(csvExportRes.status, 200);
    const csvExportData = await csvExportRes.json();

    assert.ok(csvExportData.downloadUrl, 'Should return downloadUrl');
    assert.ok(csvExportData.downloadToken, 'Should return downloadToken');
    assert.strictEqual(csvExportData.warning, SENSITIVE_WARNING);
    assert.strictEqual(csvExportData.recordCount, 1);

    // 5. Download CSV via Token
    const downloadCsvRes = await fetch(`${baseUrl}${csvExportData.downloadUrl}`);
    assert.strictEqual(downloadCsvRes.status, 200);
    assert.ok(downloadCsvRes.headers.get('content-type').includes('text/csv'));
    const csvText = await downloadCsvRes.text();

    // Verify warning header in CSV
    assert.ok(csvText.includes(SENSITIVE_WARNING), 'CSV must include sensitive warning banner');
    assert.ok(csvText.includes('สมบูรณ์ ส่งออก'), 'CSV must include employee full name');
    assert.ok(csvText.includes('EMP-EXP-1'), 'CSV must include employee ID');

    // STRICT INVARIANT: Question-level answers must NOT be present
    assert.ok(!csvText.includes('"B01"'), 'CSV must not contain raw question ID B01');
    assert.ok(!csvText.includes('"QP01"'), 'CSV must not contain raw question ID QP01');

    // 6. Request Excel Export (Step 12 & 20)
    const excelExportRes = await fetch(`${baseUrl}/api/admin/export`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ format: 'excel', password: 'Admin@123456!' })
    });
    assert.strictEqual(excelExportRes.status, 200);
    const excelExportData = await excelExportRes.json();

    const downloadExcelRes = await fetch(`${baseUrl}${excelExportData.downloadUrl}`);
    assert.strictEqual(downloadExcelRes.status, 200);
    assert.ok(downloadExcelRes.headers.get('content-type').includes('vnd.ms-excel'));
    const excelText = await downloadExcelRes.text();
    assert.ok(excelText.includes(SENSITIVE_WARNING), 'Excel export must include sensitive warning');
    assert.ok(excelText.includes('สมบูรณ์ ส่งออก'));

    // 7. Verify Expired Link (simulate expiration)
    const expiredToken = csvExportData.downloadToken;
    const entry = exportService.exports.get(expiredToken);
    entry.expiresAt = new Date(Date.now() - 1000).toISOString(); // set expired

    const expiredRes = await fetch(`${baseUrl}/api/admin/export/download/${expiredToken}`);
    assert.strictEqual(expiredRes.status, 410, 'Expired link must return 410 DOWNLOAD_EXPIRED');
    const expiredData = await expiredRes.json();
    assert.strictEqual(expiredData.code, 'DOWNLOAD_EXPIRED');

    // 8. Verify Audit Logging
    const auditLogs = await auditService.getEvents({ action: 'admin_export' });
    assert.strictEqual(auditLogs.items.length, 2, 'Should have logged 2 export events');
    assert.strictEqual(auditLogs.items[0].actor, 'admin');
    assert.ok(auditLogs.items[0].context.fileName.length > 0);

  } finally {
    server.close();
  }
});
