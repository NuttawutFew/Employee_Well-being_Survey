const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { createHealthRouter } = require('./routes/health');
const { createAssessmentRouter } = require('./routes/assessment');
const { createAdminAuthRouter } = require('./routes/admin-auth');
const { createAdminAssessmentsRouter } = require('./routes/admin-assessments');
const { createAdminDashboardRouter } = require('./routes/admin-dashboard');
const { AssessmentSessionService } = require('./modules/assessment-session');
const { AdminIdentityService } = require('./modules/admin-identity');
const { AuditService } = require('./modules/audit-service');
const { ExportService } = require('./modules/export-service');
const { RetentionWorker } = require('./modules/retention-worker');
const { createAdminExportRouter } = require('./routes/admin-export');
const { createAdminAuditRouter } = require('./routes/admin-audit');
const { createAdminDatabaseRouter } = require('./routes/admin-database');
const { createAdminUsersRouter } = require('./routes/admin-users');

function createApp({ db = null, auditService = null, exportService = null, sessionService = null, retentionWorker = null, seedMock = false, serviceRole = process.env.SERVICE_ROLE || 'all' } = {}) {
  const app = express();
  const activeAuditService = auditService || new AuditService({ db });
  const activeSessionService = sessionService || new AssessmentSessionService({ db, auditService: activeAuditService });
  if (seedMock) {
    activeSessionService.seedMockData();
  }
  const adminService = new AdminIdentityService({ db, auditService: activeAuditService });
  const activeExportService = exportService || new ExportService({ auditService: activeAuditService });
  const activeRetentionWorker = retentionWorker || new RetentionWorker({ sessionService: activeSessionService, auditService: activeAuditService });

  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());

  const isUserRole = serviceRole === 'user' || serviceRole === 'all';
  const isAdminRole = serviceRole === 'admin' || serviceRole === 'all';

  // Common Health check
  app.use('/api', createHealthRouter({ db }));

  // Employee/User assessment routes
  if (isUserRole) {
    app.use('/api/assessment', createAssessmentRouter({ sessionService: activeSessionService }));
  }

  // Admin routes
  if (isAdminRole) {
    app.use('/api/admin/auth', createAdminAuthRouter({ adminService }));
    app.use('/api/admin/assessments', createAdminAssessmentsRouter({ adminService, sessionService: activeSessionService, auditService: activeAuditService }));
    app.use('/api/admin/dashboard', createAdminDashboardRouter({ adminService, sessionService: activeSessionService }));
    app.use('/api/admin/export', createAdminExportRouter({ adminService, sessionService: activeSessionService, exportService: activeExportService, auditService: activeAuditService }));
    app.use('/api/admin/audit-logs', createAdminAuditRouter({ adminService, auditService: activeAuditService, retentionWorker: activeRetentionWorker }));
    app.use('/api/admin/database', createAdminDatabaseRouter({ adminService, db }));
    app.use('/api/admin/users', createAdminUsersRouter({ adminService, auditService: activeAuditService }));
  }

  // Root route
  app.get('/', (req, res) => {
    res.json({ message: 'Mental Health Assessment API', serviceRole });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred'
    });
  });

  return app;
}

module.exports = { createApp };
