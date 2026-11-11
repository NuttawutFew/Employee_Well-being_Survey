const express = require('express');
const { ASSESSMENTS_CATALOG } = require('@mental-health/shared-contracts');
const { employeeAuthMiddleware } = require('../middlewares/employee-auth');

function createAssessmentRouter({ sessionService }) {
  const router = express.Router();

  // 0. Public Assessment Catalog
  router.get('/catalog', (req, res) => {
    res.json(ASSESSMENTS_CATALOG);
  });

  router.get('/catalog/:code', (req, res) => {
    const item = ASSESSMENTS_CATALOG.find((a) => a.code === req.params.code);
    if (!item) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'ไม่พบแบบประเมินที่ระบุ'
      });
    }
    res.json(item);
  });

  function resolveEmployeeProfile(empId) {
    if (sessionService && sessionService.memoryAttempts) {
      const att = sessionService.memoryAttempts.get(empId);
      if (att && att.snapshot) {
        return {
          employeeId: empId,
          fullName: `คุณ${att.snapshot.firstName} ${att.snapshot.lastName}`,
          company: att.snapshot.company || 'บ. สยาม โลจิสติกส์ จำกัด',
          department: att.snapshot.department || 'การเงิน',
          position: att.snapshot.position || 'นักวิเคราะห์การเงิน'
        };
      }
    }
    if (empId === 'EMP-00108') {
      return {
        employeeId: 'EMP-00108',
        fullName: 'คุณปิยะนุช สดใส',
        company: 'บ. สยาม โลจิสติกส์ จำกัด',
        department: 'การเงิน',
        position: 'นักวิเคราะห์การเงิน'
      };
    }
    return {
      employeeId: empId || 'EMP-DEV-001',
      fullName: 'คุณณิชา วัฒนกิจ',
      company: 'บมจ. ไอเน็ตเวิร์ก',
      department: 'ฝ่ายเทคโนโลยี',
      position: 'Software Engineer'
    };
  }

  // 1. Employee Auth: Login via ONE ID
  router.post('/auth/login', (req, res) => {
    let { employeeId, username } = req.body || {};
    if (!employeeId && username) {
      const u = username.toLowerCase();
      if (u.includes('00108') || u.includes('piyanuch')) {
        employeeId = 'EMP-00108';
      } else {
        employeeId = 'EMP-DEV-001';
      }
    }
    employeeId = employeeId || 'EMP-DEV-001';
    const profile = resolveEmployeeProfile(employeeId);
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000
    };
    res.cookie('emp_session', employeeId, cookieOptions);
    if (isProd) {
      res.cookie('__Host-emp-session', employeeId, cookieOptions);
    }
    res.json({
      success: true,
      token: employeeId,
      employee: profile
    });
  });

  // 2. Employee Auth: OnePlatform SSO simulation
  router.post('/auth/sso', (req, res) => {
    let { shareToken, employeeId } = req.body || {};
    employeeId = employeeId || 'EMP-DEV-001';
    const profile = {
      ...resolveEmployeeProfile(employeeId),
      sso: true
    };
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000
    };
    res.cookie('emp_session', employeeId, cookieOptions);
    if (isProd) {
      res.cookie('__Host-emp-session', employeeId, cookieOptions);
    }
    res.json({
      success: true,
      sso: true,
      token: employeeId,
      employee: profile
    });
  });

  // 3. Employee Auth: Logout
  router.post('/auth/logout', (req, res) => {
    res.clearCookie('emp_session', { path: '/' });
    res.clearCookie('__Host-emp-session', { path: '/' });
    res.json({ success: true });
  });

  // 4. Employee Auth: Get current employee profile
  router.get('/auth/me', (req, res) => {
    const empId =
      req.cookies?.['__Host-emp-session'] ||
      req.cookies?.['emp_session'] ||
      req.headers['x-employee-id'] ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!empId) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'ยังไม่ได้เข้าสู่ระบบ'
      });
    }

    res.json({
      success: true,
      employee: resolveEmployeeProfile(empId)
    });
  });

  // Protected Routes below this line
  router.use(employeeAuthMiddleware);

  // Get current assessment session status
  router.get('/session', async (req, res, next) => {
    try {
      const session = await sessionService.getSession(req.employee.employeeId);
      res.json(session);
    } catch (err) {
      next(err);
    }
  });

  // Acknowledge notice
  router.post('/notice/acknowledge', async (req, res, next) => {
    try {
      const { noticeVersion } = req.body || {};
      const result = await sessionService.acknowledgeNotice(req.employee.employeeId, { noticeVersion });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // Get active draft
  router.get('/draft', async (req, res, next) => {
    try {
      const draft = await sessionService.getDraft(req.employee.employeeId);
      res.json(draft);
    } catch (err) {
      next(err);
    }
  });

  // Autosave draft answers
  router.put('/draft/answers', async (req, res, next) => {
    try {
      const { answers } = req.body || {};
      const result = await sessionService.saveAnswers(req.employee.employeeId, answers);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // Step navigation: Next step (validates current assessment)
  router.post('/draft/step/next', async (req, res, next) => {
    try {
      if (req.body?.answers && Object.keys(req.body.answers).length > 0) {
        await sessionService.saveAnswers(req.employee.employeeId, req.body.answers);
      }
      const result = await sessionService.nextStep(req.employee.employeeId);
      res.json(result);
    } catch (err) {
      if (err.missingQuestions) {
        return res.status(400).json({
          code: err.code || 'VALIDATION_FAILED',
          message: err.message,
          missingQuestions: err.missingQuestions
        });
      }
      next(err);
    }
  });

  // Step navigation: Prev step
  router.post('/draft/step/prev', async (req, res, next) => {
    try {
      const result = await sessionService.prevStep(req.employee.employeeId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // Submit assessment (Atomic & Idempotent)
  router.post('/submit', async (req, res, next) => {
    try {
      const result = await sessionService.submitAssessment(
        req.employee.employeeId,
        req.body?.snapshot,
        req.body?.answers,
        req.body?.feedback
      );
      res.json(result);
    } catch (err) {
      if (err.missingQuestions) {
        return res.status(400).json({
          code: err.code || 'VALIDATION_FAILED',
          message: err.message,
          missingQuestions: err.missingQuestions
        });
      }
      next(err);
    }
  });

  // Submit/update feedback for assessment
  router.post('/feedback', async (req, res, next) => {
    try {
      const result = await sessionService.saveFeedback(
        req.employee.employeeId,
        req.body?.feedback
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // Get evaluated result summary for submitted assessment
  router.get('/result', async (req, res, next) => {
    try {
      const result = await sessionService.getResult(req.employee.employeeId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // Clear draft
  router.post('/draft/clear', async (req, res, next) => {
    try {
      const result = await sessionService.clearDraft(req.employee.employeeId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAssessmentRouter };
