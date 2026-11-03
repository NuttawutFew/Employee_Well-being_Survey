const express = require('express');
const { createAdminAuthMiddleware } = require('../middlewares/admin-auth');

function createAdminAuditRouter({ adminService, auditService, retentionWorker }) {
  const router = express.Router();
  const adminAuth = createAdminAuthMiddleware({ adminService });

  router.use(adminAuth);

  // 1. GET /api/admin/audit-logs - Query 5-year audit trail
  router.get('/', async (req, res, next) => {
    try {
      const { actor, action, page = 1, limit = 50 } = req.query;
      const result = await auditService.getEvents({
        actor,
        action,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 50
      });
      res.json(result);
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
