// Assessment Code Identifiers
const ASSESSMENT_CODES = {
  BURNOUT: 'burnout',
  STRESS: 'stress',
  RQ: 'rq',
  Q9: '9q',
  Q2PLUS: '2q_plus'
};

// Assessment Attempt Statuses
const ATTEMPT_STATUS = {
  NOTICE_ACKNOWLEDGED: 'NOTICE_ACKNOWLEDGED',
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  CANCELLED: 'CANCELLED'
};

// Overall Status Values
const OVERALL_STATUS = {
  NORMAL: 'NORMAL',
  NEEDS_ADDITIONAL_CARE: 'NEEDS_ADDITIONAL_CARE'
};

// 2Q Plus Flags
const Q2PLUS_FLAGS = {
  DEPRESSION_RISK: 'DEPRESSION_RISK',
  SUICIDE_RISK: 'SUICIDE_RISK'
};

// Privacy / Small Cohort Suppression Constants
const PRIVACY_RULES = {
  MIN_COHORT_SIZE: 5,
  SUPPRESSION_MESSAGE: 'ข้อมูลไม่เพียงพอสำหรับแสดงสถิติ'
};

// Error Codes
const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  ATTEMPT_LOCKED: 'ATTEMPT_LOCKED',
  SINGLE_SUBMISSION_VIOLATION: 'SINGLE_SUBMISSION_VIOLATION',
  SMALL_COHORT_SUPPRESSED: 'SMALL_COHORT_SUPPRESSED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXPORT_PERMISSION_DENIED: 'EXPORT_PERMISSION_DENIED',
  INVALID_PASSWORD: 'INVALID_PASSWORD'
};

// System Roles
const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN'
};

// Admin Feature Permissions
const ADMIN_PERMISSIONS = {
  CAN_EXPORT: 'can_export',
  MANAGE_ADMINS: 'manage_admins'
};

// Export Formats
const EXPORT_FORMATS = {
  EXCEL: 'excel',
  CSV: 'csv'
};

// Audit Action Types
const AUDIT_ACTIONS = {
  EMPLOYEE_LOGIN: 'employee_login',
  ADMIN_LOGIN: 'admin_login',
  SUPER_ADMIN_LOGIN: 'super_admin_login',
  ADMIN_LOGIN_FAILED: 'admin_login_failed',
  ADMIN_LOGOUT: 'admin_logout',
  ADMIN_VIEW_DASHBOARD: 'admin_view_dashboard',
  ADMIN_VIEW_INDIVIDUAL: 'admin_view_individual',
  ADMIN_REVEAL_PII: 'admin_reveal_pii',
  ADMIN_EXPORT: 'admin_export',
  ADMIN_EXPORT_FAILED_PASSWORD: 'admin_export_failed_password',
  ADMIN_DOWNLOAD_FILE: 'admin_download_file',
  ADMIN_RESET: 'admin_reset',
  ADMIN_CREATE: 'admin_create',
  ADMIN_UPDATE_ROLE: 'admin_update_role',
  ADMIN_UPDATE_PERMISSION: 'admin_update_permission',
  RETENTION_ANONYMIZE: 'retention_anonymize'
};

// Session & Draft Retention Configuration
const SESSION_CONFIG = {
  DEFAULT_DRAFT_TTL_MINUTES: 15,
  DEFAULT_DRAFT_TTL_MS: 15 * 60 * 1000
};

const {
  BURNOUT_OPTIONS,
  STRESS_OPTIONS,
  RQ_OPTIONS,
  Q9_OPTIONS,
  YES_NO_OPTIONS,
  ASSESSMENTS_CATALOG
} = require('./catalog');

const { calculateScores } = require('./scoring');
const {
  AGE_BRACKETS,
  TENURE_BRACKETS,
  getTenureYears,
  getTenureBracket,
  normalizeTenureCode,
  getAgeBracket,
  matchesFilters,
  buildSqlFilters
} = require('./filter-engine');

module.exports = {
  ASSESSMENT_CODES,
  ATTEMPT_STATUS,
  OVERALL_STATUS,
  Q2PLUS_FLAGS,
  PRIVACY_RULES,
  SESSION_CONFIG,
  ERROR_CODES,
  ROLES,
  ADMIN_PERMISSIONS,
  EXPORT_FORMATS,
  AUDIT_ACTIONS,
  BURNOUT_OPTIONS,
  STRESS_OPTIONS,
  RQ_OPTIONS,
  Q9_OPTIONS,
  YES_NO_OPTIONS,
  ASSESSMENTS_CATALOG,
  calculateScores,
  AGE_BRACKETS,
  TENURE_BRACKETS,
  getTenureYears,
  getTenureBracket,
  normalizeTenureCode,
  getAgeBracket,
  matchesFilters,
  buildSqlFilters
};
