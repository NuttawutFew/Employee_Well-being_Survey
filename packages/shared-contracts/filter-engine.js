const AGE_BRACKETS = ['<25', '25-34', '35-44', '45-54', '≥55'];

const TENURE_BRACKETS = [
  { code: '<1', label: '<1 ปี', minYears: 0, maxYears: 1 },
  { code: '1-3', label: '1–3 ปี', minYears: 1, maxYears: 3 },
  { code: '3-5', label: '3–5 ปี', minYears: 3, maxYears: 5 },
  { code: '>5', label: '>5 ปี', minYears: 5, maxYears: Infinity }
];

function getTenureYears(startDateStr, referenceDateStr) {
  if (!startDateStr) return null;
  const start = new Date(startDateStr);
  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date();
  if (isNaN(start.getTime()) || isNaN(ref.getTime())) return null;
  const diffMs = ref.getTime() - start.getTime();
  const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, years);
}

function getTenureBracket(years) {
  if (years === null || years === undefined || isNaN(years)) return null;
  if (years < 1) return '<1';
  if (years < 3) return '1-3';
  if (years < 5) return '3-5';
  return '>5';
}

function normalizeTenureCode(codeOrLabel) {
  if (!codeOrLabel) return null;
  const str = String(codeOrLabel).trim();
  if (str === '<1' || str === '<1 ปี' || str === 'น้อยกว่า 1 ปี') return '<1';
  if (str === '1-3' || str === '1–3' || str === '1–3 ปี' || str === '1-3 ปี') return '1-3';
  if (str === '3-5' || str === '3–5' || str === '3–5 ปี' || str === '3-5 ปี') return '3-5';
  if (str === '>5' || str === '>5 ปี' || str === 'มากกว่า 5 ปี') return '>5';
  return str;
}

function getAgeBracket(age) {
  if (age === null || age === undefined || isNaN(age)) return null;
  const num = Number(age);
  if (num < 25) return '<25';
  if (num <= 34) return '25-34';
  if (num <= 44) return '35-44';
  if (num <= 54) return '45-54';
  return '≥55';
}

/**
 * Filter evaluation:
 * - Within the same dimension: multiple values use logical OR
 * - Across separate dimensions: conditions use logical AND
 */
function matchesFilters(attempt, filters = {}) {
  if (!attempt) return false;

  const snapshot = attempt.snapshot || {};
  const result = attempt.result || {};

  // 1. Submission Date Range
  if (filters.dateFrom) {
    const fromTime = new Date(filters.dateFrom).getTime();
    const subTime = attempt.submittedAt ? new Date(attempt.submittedAt).getTime() : 0;
    if (subTime < fromTime) return false;
  }
  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    // If only YYYY-MM-DD was provided, include the whole day
    if (filters.dateTo.length === 10) {
      toDate.setHours(23, 59, 59, 999);
    }
    const toTime = toDate.getTime();
    const subTime = attempt.submittedAt ? new Date(attempt.submittedAt).getTime() : 0;
    if (subTime > toTime) return false;
  }

  // 2. Companies (OR within dimension)
  if (filters.companies && filters.companies.length > 0) {
    const comps = Array.isArray(filters.companies) ? filters.companies : [filters.companies];
    if (!comps.includes(snapshot.company)) return false;
  }

  // 3. Departments (OR within dimension)
  if (filters.departments && filters.departments.length > 0) {
    const depts = Array.isArray(filters.departments) ? filters.departments : [filters.departments];
    if (!depts.includes(snapshot.department)) return false;
  }

  // 4. Positions (OR within dimension)
  if (filters.positions && filters.positions.length > 0) {
    const pos = Array.isArray(filters.positions) ? filters.positions : [filters.positions];
    if (!pos.includes(snapshot.position)) return false;
  }

  // 5. Work Areas (OR within dimension)
  if (filters.workAreas && filters.workAreas.length > 0) {
    const areas = Array.isArray(filters.workAreas) ? filters.workAreas : [filters.workAreas];
    if (!areas.includes(snapshot.workArea)) return false;
  }

  // 6. Genders (OR within dimension)
  if (filters.genders && filters.genders.length > 0) {
    const gen = Array.isArray(filters.genders) ? filters.genders : [filters.genders];
    if (!gen.includes(snapshot.gender)) return false;
  }

  // 7. Age Brackets (OR within dimension)
  if (filters.ageBrackets && filters.ageBrackets.length > 0) {
    const brackets = Array.isArray(filters.ageBrackets) ? filters.ageBrackets : [filters.ageBrackets];
    const empBracket = getAgeBracket(snapshot.age);
    if (!brackets.includes(empBracket)) return false;
  }

  // 8. Tenure Brackets (OR within dimension)
  if (filters.tenureBrackets && filters.tenureBrackets.length > 0) {
    const rawBrackets = Array.isArray(filters.tenureBrackets) ? filters.tenureBrackets : [filters.tenureBrackets];
    const brackets = rawBrackets.map(normalizeTenureCode);
    const years = getTenureYears(snapshot.startDate, attempt.submittedAt);
    const empTenureBracket = getTenureBracket(years);
    if (!brackets.includes(empTenureBracket)) return false;
  }

  // 9. Overall Status (OR within dimension if multiple passed)
  if (filters.overallStatuses && filters.overallStatuses.length > 0) {
    const statuses = Array.isArray(filters.overallStatuses) ? filters.overallStatuses : [filters.overallStatuses];
    const overallStatus = result.overall?.status;
    if (!statuses.includes(overallStatus)) return false;
  }
  if (filters.needsCareOnly === true || filters.needsCareOnly === 'true') {
    if (result.overall?.status !== 'NEEDS_ADDITIONAL_CARE') return false;
  }

  // 10. Specific Assessment Score Levels
  // Burnout Levels (OR)
  if (filters.burnoutLevels && filters.burnoutLevels.length > 0) {
    const levels = Array.isArray(filters.burnoutLevels) ? filters.burnoutLevels : [filters.burnoutLevels];
    if (!levels.includes(result.burnout?.level)) return false;
  }

  // Stress Levels (OR)
  if (filters.stressLevels && filters.stressLevels.length > 0) {
    const levels = Array.isArray(filters.stressLevels) ? filters.stressLevels : [filters.stressLevels];
    if (!levels.includes(result.stress?.level)) return false;
  }

  // 9Q Levels (OR)
  if (filters.q9Levels && filters.q9Levels.length > 0) {
    const levels = Array.isArray(filters.q9Levels) ? filters.q9Levels : [filters.q9Levels];
    if (!levels.includes(result.q9?.level)) return false;
  }

  return true;
}

/**
 * PostgreSQL Dynamic Query Builder applying parameterized conditions
 * OR within same dimension, AND across separate dimensions
 */
function buildSqlFilters(filters = {}) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // 1. Date Range
  if (filters.dateFrom) {
    conditions.push(`submitted_at >= $${paramIndex++}`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push(`submitted_at <= $${paramIndex++}`);
    params.push(filters.dateTo);
  }

  // 2. Organization Units (OR within dimension)
  if (filters.companies?.length > 0) {
    const comps = Array.isArray(filters.companies) ? filters.companies : [filters.companies];
    const placeholders = comps.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`snapshot->>'company' IN (${placeholders})`);
    params.push(...comps);
  }

  if (filters.departments?.length > 0) {
    const depts = Array.isArray(filters.departments) ? filters.departments : [filters.departments];
    const placeholders = depts.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`snapshot->>'department' IN (${placeholders})`);
    params.push(...depts);
  }

  if (filters.positions?.length > 0) {
    const pos = Array.isArray(filters.positions) ? filters.positions : [filters.positions];
    const placeholders = pos.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`snapshot->>'position' IN (${placeholders})`);
    params.push(...pos);
  }

  if (filters.workAreas?.length > 0) {
    const areas = Array.isArray(filters.workAreas) ? filters.workAreas : [filters.workAreas];
    const placeholders = areas.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`snapshot->>'workArea' IN (${placeholders})`);
    params.push(...areas);
  }

  // 3. Gender (OR within dimension)
  if (filters.genders?.length > 0) {
    const gens = Array.isArray(filters.genders) ? filters.genders : [filters.genders];
    const placeholders = gens.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`snapshot->>'gender' IN (${placeholders})`);
    params.push(...gens);
  }

  // 4. Overall Status
  if (filters.overallStatuses?.length > 0) {
    const statuses = Array.isArray(filters.overallStatuses) ? filters.overallStatuses : [filters.overallStatuses];
    const placeholders = statuses.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`result->'overall'->>'status' IN (${placeholders})`);
    params.push(...statuses);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

module.exports = {
  AGE_BRACKETS,
  TENURE_BRACKETS,
  getTenureYears,
  getTenureBracket,
  normalizeTenureCode,
  getAgeBracket,
  matchesFilters,
  buildSqlFilters
};
