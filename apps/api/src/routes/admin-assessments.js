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

function createAdminAssessmentsRouter({ adminService, sessionService, auditService }) {
  const router = express.Router();
  const adminAuth = createAdminAuthMiddleware({ adminService });

  router.use(adminAuth);

  // POST /api/admin/assessments/seed-mock - Seed mock employee assessments
  router.post('/seed-mock', async (req, res, next) => {
    try {
      const list = sessionService.seedMockData();
      const audit = auditService || sessionService.auditService;
      if (audit && typeof audit.seedMockData === 'function') {
        audit.seedMockData();
      }
      const employeeCount = new Set(list.map((m) => m.employeeId)).size;
      res.json({
        success: true,
        message: `สร้างข้อมูลจำลองสำเร็จ ${employeeCount} คน (${list.length} รายการประเมิน)`,
        count: employeeCount,
        attemptsCount: list.length
      });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/admin/assessments/departments - List available distinct departments
  router.get('/departments', async (req, res, next) => {
    try {
      const departments = typeof sessionService.getDistinctDepartments === 'function'
        ? sessionService.getDistinctDepartments()
        : [];
      res.json({ departments });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/admin/assessments/companies - List available distinct companies
  router.get('/companies', async (req, res, next) => {
    try {
      const companies = typeof sessionService.getDistinctCompanies === 'function'
        ? sessionService.getDistinctCompanies()
        : [];
      res.json({ companies });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/admin/assessments/positions - List available distinct positions
  router.get('/positions', async (req, res, next) => {
    try {
      const positions = typeof sessionService.getDistinctPositions === 'function'
        ? sessionService.getDistinctPositions()
        : [];
      res.json({ positions });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/admin/assessments - Paginated list of assessments with multidimensional filters, search and sort
  router.get(['/', ''], async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        sortBy = 'submittedAt',
        sortOrder = 'desc',
        status,
        groupByEmployee,
        roundFilter,
        round
      } = req.query;

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

      const result = await sessionService.listAssessments({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        status,
        groupByEmployee: groupByEmployee !== undefined ? (groupByEmployee === 'true' || groupByEmployee === true) : true,
        roundFilter: roundFilter || round,
        filters
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/admin/assessments/:id - View individual assessment detail (omitting raw answers)
  router.get('/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const attempt = await sessionService.getAssessmentById(id);

      // PDPA Access Purpose: Extract purpose from header or query, or default
      const rawPurpose = req.headers['x-access-purpose'] || req.query.purpose;
      let purpose = 'การปฏิบัติงานตรวจสอบทั่วไป (Routine HR Operations)';
      if (rawPurpose) {
        try {
          purpose = decodeURIComponent(String(rawPurpose).replace(/\+/g, ' '));
        } catch {
          purpose = String(rawPurpose);
        }
      }

      // Audit log: admin_view_individual
      const audit = auditService || sessionService.auditService;
      if (audit) {
        await audit.logEvent({
          actor: req.admin?.username || 'admin',
          actorRole: req.admin?.role || 'ADMIN',
          action: 'admin_view_individual',
          target: id,
          status: 'SUCCESS',
          purpose,
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'] || null,
          context: {
            employeeId: attempt.employeeId,
            fullName: attempt.snapshot ? `${attempt.snapshot.firstName || ''} ${attempt.snapshot.lastName || ''}`.trim() : undefined,
            department: attempt.snapshot?.department,
            company: attempt.snapshot?.company
          }
        });
      }

      res.json(attempt);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/admin/assessments/:id/unmask-pii - Log Audit Trail when Admin unmasks/reveals PII
  router.post('/:id/unmask-pii', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { purpose } = req.body || {};
      const attempt = await sessionService.getAssessmentById(id);

      const audit = auditService || sessionService.auditService;
      if (audit) {
        await audit.logEvent({
          actor: req.admin?.username || 'admin',
          actorRole: req.admin?.role || 'ADMIN',
          action: 'admin_reveal_pii',
          target: id,
          status: 'SUCCESS',
          purpose: purpose || 'เปิดเผยข้อมูลระบุตัวตนฉบับเต็มเพื่อติดตามดูแลและช่วยเหลือพนักงาน',
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'] || null,
          context: {
            employeeId: attempt.employeeId,
            fullName: attempt.snapshot ? `${attempt.snapshot.firstName || ''} ${attempt.snapshot.lastName || ''}`.trim() : undefined,
            department: attempt.snapshot?.department,
            company: attempt.snapshot?.company
          }
        });
      }

      res.json({
        success: true,
        message: 'Unmask PII event logged to audit trail successfully',
        employeeId: attempt.employeeId,
        fullName: attempt.snapshot ? `${attempt.snapshot.firstName || ''} ${attempt.snapshot.lastName || ''}`.trim() : '-'
      });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/admin/assessments/:id/reset - Admin Reset assessment workflow
  router.post('/:id/reset', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};

      if (!reason || !reason.trim()) {
        return res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'กรุณาระบุเหตุผลในการรีเซ็ตผลการประเมิน'
        });
      }

      const result = await sessionService.resetAssessment(id, {
        adminId: req.admin?.username || 'admin',
        reason: reason.trim()
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAdminAssessmentsRouter };
