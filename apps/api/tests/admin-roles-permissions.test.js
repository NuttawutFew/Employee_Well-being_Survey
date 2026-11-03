const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

test('User Journey: Role Hierarchy, Super Admin Portal, Admin Permissions, and Export Gating', async () => {
  const app = createApp({ seedMock: true });
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Employee / Unknown account login attempt to Admin Portal -> 401 Unauthorized (Step 8 & 18)
    const invalidLoginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nonexistent_user', password: 'Password@123' })
    });
    assert.strictEqual(invalidLoginRes.status, 401);

    // 2. Super Admin Login (Step 6) -> Success with role SUPER_ADMIN
    const superLoginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'superadmin', password: 'SuperAdmin@123456!' })
    });
    assert.strictEqual(superLoginRes.status, 200);
    const superLoginData = await superLoginRes.json();
    assert.strictEqual(superLoginData.admin.role?.toLowerCase(), 'super_admin');
    assert.ok(superLoginData.admin.permissions.includes('can_export'));
    const superToken = superLoginData.sessionToken;
    const superHeaders = {
      'Authorization': `Bearer ${superToken}`,
      'Content-Type': 'application/json'
    };

    // 3. Admin with Export Login (Step 16) -> Success with role ADMIN and can_export
    const adminExportLoginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@123456!' })
    });
    assert.strictEqual(adminExportLoginRes.status, 200);
    const adminExportLoginData = await adminExportLoginRes.json();
    assert.strictEqual(adminExportLoginData.admin.role?.toLowerCase(), 'admin');
    assert.ok(adminExportLoginData.admin.permissions.includes('can_export'));
    const adminExportToken = adminExportLoginData.sessionToken;
    const adminExportHeaders = {
      'Authorization': `Bearer ${adminExportToken}`,
      'Content-Type': 'application/json'
    };

    // 4. Admin without Export Login (Step 16) -> Success with role ADMIN but NO can_export
    const adminViewLoginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin_view', password: 'Admin@123456!' })
    });
    assert.strictEqual(adminViewLoginRes.status, 200);
    const adminViewLoginData = await adminViewLoginRes.json();
    assert.strictEqual(adminViewLoginData.admin.role?.toLowerCase(), 'admin');
    assert.strictEqual(adminViewLoginData.admin.permissions.includes('can_export'), false);
    const adminViewToken = adminViewLoginData.sessionToken;
    const adminViewHeaders = {
      'Authorization': `Bearer ${adminViewToken}`,
      'Content-Type': 'application/json'
    };

    // 5. Super Admin accesses Admin Permission Management (Step 10: GET /api/admin/users)
    const listAdminsRes = await fetch(`${baseUrl}/api/admin/users`, { headers: superHeaders });
    assert.strictEqual(listAdminsRes.status, 200);
    const listAdminsData = await listAdminsRes.json();
    assert.ok(listAdminsData.items.length >= 3, 'Should have at least 3 seeded admins');

    // 6. Regular Admin tries to access Admin Permission Management -> 403 Forbidden
    const forbiddenListRes = await fetch(`${baseUrl}/api/admin/users`, { headers: adminExportHeaders });
    assert.strictEqual(forbiddenListRes.status, 403, 'Regular admin must not access admin management');

    // 7. Super Admin creates a new Admin (Step 10: เพิ่ม สิทธิ Admin)
    const createAdminRes = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: superHeaders,
      body: JSON.stringify({
        username: 'hr_nurse_01',
        password: 'Password@123456!',
        role: 'ADMIN',
        permissions: [],
        fullName: 'พว. สมหญิง สุขใจ',
        email: 'nurse01@company.com'
      })
    });
    assert.strictEqual(createAdminRes.status, 201);
    const createAdminData = await createAdminRes.json();
    assert.strictEqual(createAdminData.admin.username, 'hr_nurse_01');
    const createdAdminId = createAdminData.admin.adminId;

    // 8. Super Admin updates permissions (Step 10: เพิ่ม/แก้ไขสิทธิการเข้าใช้ - Grant Export)
    const updatePermRes = await fetch(`${baseUrl}/api/admin/users/${createdAdminId}`, {
      method: 'PUT',
      headers: superHeaders,
      body: JSON.stringify({
        permissions: ['can_export']
      })
    });
    assert.strictEqual(updatePermRes.status, 200);
    const updatePermData = await updatePermRes.json();
    assert.ok(updatePermData.admin.permissions.includes('can_export'));

    // 9. Super Admin exports Admin List (Step 10: Export เอกสาร)
    const exportUsersCsvRes = await fetch(`${baseUrl}/api/admin/users/export?format=csv`, { headers: superHeaders });
    assert.strictEqual(exportUsersCsvRes.status, 200);
    assert.ok(exportUsersCsvRes.headers.get('content-type').includes('text/csv'));
    const exportUsersCsv = await exportUsersCsvRes.text();
    assert.ok(exportUsersCsv.includes('hr_nurse_01'));

    const exportUsersExcelRes = await fetch(`${baseUrl}/api/admin/users/export?format=excel`, { headers: superHeaders });
    assert.strictEqual(exportUsersExcelRes.status, 200);
    assert.ok(exportUsersExcelRes.headers.get('content-type').includes('vnd.ms-excel'));

    // 10. Admin without export permission attempts to export -> 403 EXPORT_PERMISSION_DENIED (Step 21)
    const deniedExportRes = await fetch(`${baseUrl}/api/admin/export`, {
      method: 'POST',
      headers: adminViewHeaders,
      body: JSON.stringify({
        format: 'excel',
        password: 'Admin@123456!'
      })
    });
    assert.strictEqual(deniedExportRes.status, 403);
    const deniedExportData = await deniedExportRes.json();
    assert.strictEqual(deniedExportData.code, 'EXPORT_PERMISSION_DENIED');

    // 11. Admin with export permission attempts export with WRONG password -> 401 INVALID_PASSWORD (Step 24)
    const wrongPwExportRes = await fetch(`${baseUrl}/api/admin/export`, {
      method: 'POST',
      headers: adminExportHeaders,
      body: JSON.stringify({
        format: 'excel',
        password: 'IncorrectPassword!'
      })
    });
    assert.strictEqual(wrongPwExportRes.status, 401);
    const wrongPwExportData = await wrongPwExportRes.json();
    assert.strictEqual(wrongPwExportData.code, 'INVALID_PASSWORD');
    assert.ok(wrongPwExportData.message.includes('ไม่สามารถดาวน์โหลดเอกสารได้'));

    // 12. Admin with export permission exports with CORRECT password -> 200 SUCCESS (Step 20 & 23)
    const successExportRes = await fetch(`${baseUrl}/api/admin/export`, {
      method: 'POST',
      headers: adminExportHeaders,
      body: JSON.stringify({
        format: 'excel',
        password: 'Admin@123456!'
      })
    });
    assert.strictEqual(successExportRes.status, 200);
    const successExportData = await successExportRes.json();
    assert.ok(successExportData.downloadUrl);

    // 13. Super Admin exports Excel (Step 12, 13, 14)
    const superExportRes = await fetch(`${baseUrl}/api/admin/export`, {
      method: 'POST',
      headers: superHeaders,
      body: JSON.stringify({
        format: 'excel',
        password: 'SuperAdmin@123456!'
      })
    });
    assert.strictEqual(superExportRes.status, 200);
    const superExportData = await superExportRes.json();
    assert.ok(superExportData.downloadUrl);

    // 14. Download the generated Excel file
    const downloadRes = await fetch(`${baseUrl}${superExportData.downloadUrl}`);
    assert.strictEqual(downloadRes.status, 200);
    assert.ok(downloadRes.headers.get('content-type').includes('vnd.ms-excel'));

  } finally {
    server.close();
  }
});
