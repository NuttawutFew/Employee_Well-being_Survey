const express = require('express');
const { createAdminAuthMiddleware, requireSuperAdmin } = require('../middlewares/admin-auth');
const { ERROR_CODES, EXPORT_FORMATS } = require('@mental-health/shared-contracts');

function createAdminUsersRouter({ adminService, auditService }) {
  const router = express.Router();
  const adminAuth = createAdminAuthMiddleware({ adminService });

  // Require both admin authentication and Super Admin role
  router.use(adminAuth);
  router.use(requireSuperAdmin);

  // 1. List all admins (Step 10)
  router.get('/', async (req, res, next) => {
    try {
      const admins = await adminService.listAdmins();
      res.json({
        success: true,
        items: admins,
        total: admins.length
      });
    } catch (err) {
      next(err);
    }
  });

  // 2. Create new admin (Step 10: เพิ่ม สิทธิ Admin)
  router.post('/', async (req, res, next) => {
    try {
      const { username, password, role = 'ADMIN', permissions = [], fullName, email } = req.body || {};
      const newAdmin = await adminService.createAdmin({
        username,
        password,
        role,
        permissions,
        fullName,
        email
      }, req.admin.username);

      res.status(201).json({
        success: true,
        admin: newAdmin,
        message: 'เพิ่มผู้ดูแลระบบสำเร็จ'
      });
    } catch (err) {
      next(err);
    }
  });

  // 3. Update admin role & permissions (Step 10: แก้ไข สิทธิ Admin / เพิ่ม/แก้ไขสิทธิการเข้าใช้)
  router.put('/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { role, permissions, status, fullName, email, password } = req.body || {};
      const updatedAdmin = await adminService.updateAdmin(id, {
        role,
        permissions,
        status,
        fullName,
        email,
        password
      }, req.admin.username);

      res.json({
        success: true,
        admin: updatedAdmin,
        message: 'อัปเดตข้อมูลและสิทธิ์ผู้ดูแลระบบสำเร็จ'
      });
    } catch (err) {
      next(err);
    }
  });

  // 4. Export admin list as CSV/Excel (Step 10: Export เอกสาร)
  router.get('/export', async (req, res, next) => {
    try {
      const format = req.query.format === 'csv' ? 'csv' : 'excel';
      const admins = await adminService.listAdmins();

      if (auditService) {
        await auditService.logEvent({
          actor: req.admin.username,
          actorRole: req.admin.role,
          action: 'admin_export_users',
          target: 'admin_users_list',
          status: 'SUCCESS',
          purpose: 'ส่งออกรายชื่อและสิทธิ์ผู้ดูแลระบบ',
          context: { format, count: admins.length }
        });
      }

      if (format === 'csv') {
        const bom = '\uFEFF';
        const headers = ['รหัสผู้ดูแล', 'Username', 'ชื่อ-นามสกุล', 'อีเมล', 'บทบาท', 'สิทธิ์พิเศษ', 'สถานะ', 'วันที่สร้าง'];
        const rows = admins.map(a => [
          `"${a.adminId}"`,
          `"${a.username}"`,
          `"${a.fullName}"`,
          `"${a.email}"`,
          `"${a.role}"`,
          `"${(a.permissions || []).join(', ')}"`,
          `"${a.status}"`,
          `"${a.createdAt ? new Date(a.createdAt).toLocaleString('th-TH') : ''}"`
        ]);

        const csvContent = bom + headers.join(',') + '\r\n' + rows.map(r => r.join(',')).join('\r\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="admin-users-${new Date().toISOString().slice(0, 10)}.csv"`);
        return res.send(csvContent);
      }

      // Default Excel HTML table with MIME vnd.ms-excel
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
        <h2>รายชื่อผู้ดูแลระบบและสิทธิ์การเข้าถึง</h2>
        <table border="1">
          <thead>
            <tr style="background-color: #0b2545; color: #ffffff;">
              <th>รหัสผู้ดูแล</th>
              <th>Username</th>
              <th>ชื่อ-นามสกุล</th>
              <th>อีเมล</th>
              <th>บทบาท</th>
              <th>สิทธิ์การเข้าใช้</th>
              <th>สถานะ</th>
              <th>วันที่สร้าง</th>
            </tr>
          </thead>
          <tbody>
            ${admins.map(a => `
              <tr>
                <td>${a.adminId}</td>
                <td>${a.username}</td>
                <td>${a.fullName}</td>
                <td>${a.email}</td>
                <td>${a.role}</td>
                <td>${(a.permissions || []).includes('can_export') ? 'มีสิทธิ์ Export เอกสาร' : 'ไม่มีสิทธิ์ Export'}</td>
                <td>${a.status === 'active' ? 'ปกติ' : 'ระงับการใช้งาน'}</td>
                <td>${a.createdAt ? new Date(a.createdAt).toLocaleString('th-TH') : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body></html>`;

      res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="admin-users-${new Date().toISOString().slice(0, 10)}.xls"`);
      return res.send(html);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAdminUsersRouter };
