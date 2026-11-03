const express = require('express');
const { createAdminAuthMiddleware } = require('../middlewares/admin-auth');

function createAdminExportRouter({ adminService, sessionService, exportService, auditService }) {
  const router = express.Router();
  const adminAuth = createAdminAuthMiddleware({ adminService });

  // 1. Request Report Export (requires password confirmation, generates 15-minute expiring link)
  router.post('/', adminAuth, async (req, res, next) => {
    try {
      const { format = 'excel', filters = {}, password } = req.body || {};

      // User Journey Step 12 & 20: Check export permission
      const isSuper = (req.admin.role || '').toLowerCase() === 'super_admin';
      const hasExportPermission = isSuper || (req.admin.permissions && req.admin.permissions.includes('can_export'));
      if (!hasExportPermission) {
        return res.status(403).json({
          code: 'EXPORT_PERMISSION_DENIED',
          message: 'ไม่มีสิทธิการเข้าถึงฟังก์ชันส่งออกเอกสาร กรุณาติดต่อ Super Admin'
        });
      }

      // User Journey Step 13 & 22: Password ONE ID confirmation required
      if (!password) {
        return res.status(400).json({
          code: 'PASSWORD_REQUIRED',
          message: 'กรุณากรอกรหัสผ่าน ONE ID เพื่อยืนยันการส่งออกเอกสาร'
        });
      }

      const isValid = await adminService.verifyAdminPassword(req.admin.username, password);
      if (!isValid) {
        if (auditService) {
          await auditService.logEvent({
            actor: req.admin?.username || 'admin',
            action: 'admin_export_failed_password',
            target: 'export',
            ip: req.ip || req.connection?.remoteAddress,
            context: { reason: 'INVALID_PASSWORD' }
          });
        }
        // User Journey Step 15 & 24: แสดงแจ้งเตือนรหัสผ่านไม่ถูกต้อง ไม่สามารถดาวน์โหลดเอกสารได้
        return res.status(401).json({
          code: 'INVALID_PASSWORD',
          message: 'รหัสผ่านไม่ถูกต้อง ไม่สามารถดาวน์โหลดเอกสารได้'
        });
      }

      // Fetch all matching submitted attempts for export
      const result = await sessionService.listAssessments({
        page: 1,
        limit: 10000, // export all matching
        filters,
        status: 'SUBMITTED'
      });

      const selectedFormat = format === 'csv' ? 'csv' : (format === 'pdf' ? 'pdf' : 'excel');
      const exportResult = await exportService.createExport({
        admin: req.admin,
        format: selectedFormat,
        filters,
        attempts: result.items
      });

      res.json(exportResult);
    } catch (err) {
      next(err);
    }
  });


  // 2. Download File via short-lived authenticated / expiring token
  router.get('/download/:token', async (req, res, next) => {
    try {
      const { token } = req.params;
      const fileEntry = exportService.getExportFile(token);

      if (!fileEntry) {
        return res.status(410).json({
          code: 'DOWNLOAD_EXPIRED',
          message: 'ลิงก์ดาวน์โหลดหมดอายุแล้ว (เกิน 15 นาที) หรือไม่ถูกต้อง กรุณากดส่งออกใหม่'
        });
      }

      if (auditService) {
        await auditService.logEvent({
          actor: fileEntry.adminUsername || 'admin',
          action: 'admin_download_file',
          target: fileEntry.exportId,
          ip: req.ip || req.connection?.remoteAddress,
          context: {
            fileName: fileEntry.fileName,
            contentType: fileEntry.contentType
          }
        });
      }

      res.setHeader('Content-Type', fileEntry.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileEntry.fileName)}"`);
      res.send(fileEntry.content);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAdminExportRouter };
