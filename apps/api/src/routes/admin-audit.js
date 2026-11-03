const express = require('express');
const { createAdminAuthMiddleware } = require('../middlewares/admin-auth');

function createAdminAuditRouter({ adminService, auditService, retentionWorker }) {
  const router = express.Router();
  const adminAuth = createAdminAuthMiddleware({ adminService });

  router.use(adminAuth);

  // 1. GET /api/admin/audit-logs - Query audit trail
  router.get('/', async (req, res, next) => {
    try {
      const { actor, action, role, search, status, page = 1, limit = 50 } = req.query;
      const result = await auditService.getEvents({
        actor,
        action,
        role,
        search,
        status,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 50
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // 1.1 POST /api/admin/audit-logs/export - Export audit logs as CSV
  router.post('/export', async (req, res, next) => {
    try {
      const { format = 'csv' } = req.body || {};
      const { items } = await auditService.getEvents({ limit: 1000 });
      
      const BOM = '\uFEFF';
      let csv = 'Event ID,Timestamp,Actor,Actor Role,Action,Target,Purpose,IP Address,Status\n';
      items.forEach(item => {
        const row = [
          `"${item.eventId || item.id || ''}"`,
          `"${item.timestamp || ''}"`,
          `"${(item.actorName || item.actor || '').replace(/"/g, '""')}"`,
          `"${(item.actorRole || '').replace(/"/g, '""')}"`,
          `"${(item.action || '').replace(/"/g, '""')}"`,
          `"${(item.target || '').replace(/"/g, '""')}"`,
          `"${(item.purpose || '').replace(/"/g, '""')}"`,
          `"${(item.ip || '').replace(/"/g, '""')}"`,
          `"${item.status || 'SUCCESS'}"`
        ];
        csv += row.join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().slice(0, 10)}.csv"`);
      res.send(BOM + csv);
    } catch (err) {
      next(err);
    }
  });

  // 2. POST /api/admin/retention/run - Trigger data retention anonymization worker
  router.post('/retention/run', async (req, res, next) => {
    try {
      if (!retentionWorker) {
        return res.status(501).json({
          code: 'NOT_CONFIGURED',
          message: 'Retention worker is not configured'
        });
      }

      const result = await retentionWorker.runRetentionJob();
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAdminAuditRouter };
