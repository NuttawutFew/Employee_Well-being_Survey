const express = require('express');
const { createAdminAuthMiddleware } = require('../middlewares/admin-auth');

function parseArrayQuery(val) {
  if (!val) return undefined;
  if (Array.isArray(val)) return val;
  return String(val)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function createAdminDashboardRouter({ adminService, sessionService }) {
  const router = express.Router();
  const adminAuth = createAdminAuthMiddleware({ adminService });

  router.use(adminAuth);

  // GET /api/admin/dashboard - Aggregate Dashboard with Small-Cohort Suppression (n < 5)
  router.get(['/', ''], async (req, res, next) => {
    try {
      const filters = {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        companies: parseArrayQuery(req.query.companies || req.query.company),
        departments: parseArrayQuery(req.query.departments || req.query.department),
        positions: parseArrayQuery(req.query.positions || req.query.position),
        workAreas: parseArrayQuery(req.query.workAreas || req.query.workArea),
        genders: parseArrayQuery(req.query.genders || req.query.gender),
        ageBrackets: parseArrayQuery(req.query.ageBrackets || req.query.ageBracket),
        tenureBrackets: parseArrayQuery(req.query.tenureBrackets || req.query.tenureBracket),
        overallStatuses: parseArrayQuery(req.query.overallStatuses || req.query.overallStatus),
        needsCareOnly: req.query.needsCareOnly === 'true' || req.query.needsCareOnly === true,
        burnoutLevels: parseArrayQuery(req.query.burnoutLevels || req.query.burnoutLevel),
        stressLevels: parseArrayQuery(req.query.stressLevels || req.query.stressLevel),
        rqLevels: parseArrayQuery(req.query.rqLevels || req.query.rqLevel),
        q9Levels: parseArrayQuery(req.query.q9Levels || req.query.q9Level),
        q2plusDepressionRisk: req.query.q2plusDepressionRisk,
        q2plusSuicideRisk: req.query.q2plusSuicideRisk
      };

      const stats = await sessionService.getDashboardStats(filters);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAdminDashboardRouter };
