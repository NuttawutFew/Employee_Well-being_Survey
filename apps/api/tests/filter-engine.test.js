const test = require('node:test');
const assert = require('node:assert');
const {
  getTenureYears,
  getTenureBracket,
  getAgeBracket,
  matchesFilters,
  buildSqlFilters
} = require('@mental-health/shared-contracts');
const { createApp } = require('../src/app');

test('Multidimensional Filter Engine - Unit Tests', (t) => {
  // 1. Tenure Brackets
  // Reference date: 2026-09-05
  const refDate = '2026-09-05T00:00:00.000Z';
  assert.strictEqual(getTenureBracket(getTenureYears('2026-03-01', refDate)), '<1');
  assert.strictEqual(getTenureBracket(getTenureYears('2024-09-01', refDate)), '1-3');
  assert.strictEqual(getTenureBracket(getTenureYears('2022-09-01', refDate)), '3-5');
  assert.strictEqual(getTenureBracket(getTenureYears('2020-01-01', refDate)), '>5');

  // 2. Age Brackets
  assert.strictEqual(getAgeBracket(22), '<25');
  assert.strictEqual(getAgeBracket(25), '25-34');
  assert.strictEqual(getAgeBracket(34), '25-34');
  assert.strictEqual(getAgeBracket(35), '35-44');
  assert.strictEqual(getAgeBracket(45), '45-54');
  assert.strictEqual(getAgeBracket(55), '≥55');
  assert.strictEqual(getAgeBracket(62), '≥55');

  // 3. SQL Query Builder Parameterization Safety
  const sqlRes = buildSqlFilters({
    companies: ["Company A", "Company'; DROP TABLE attempts; --"],
    genders: ['ชาย'],
    overallStatuses: ['NEEDS_ADDITIONAL_CARE']
  });

  assert.ok(sqlRes.whereClause.includes("snapshot->>'company' IN ($1, $2)"));
  assert.ok(sqlRes.whereClause.includes("snapshot->>'gender' IN ($3)"));
  assert.ok(sqlRes.whereClause.includes("result->'overall'->>'status' IN ($4)"));
  assert.strictEqual(sqlRes.params[1], "Company'; DROP TABLE attempts; --");
  // The SQL clause itself contains only parameter placeholders, safely preventing injection
  assert.ok(!sqlRes.whereClause.includes('DROP TABLE'));
});

test('Multidimensional Filter Engine - Logical Semantics (OR within, AND across)', (t) => {
  const attempt1 = {
    employeeId: 'EMP-01',
    submittedAt: '2026-09-01T10:00:00.000Z',
    snapshot: {
      company: 'Tech Corp',
      department: 'Engineering',
      gender: 'ชาย',
      age: 28,
      startDate: '2024-01-15' // ~2.6 years -> 1-3
    },
    result: {
      overall: { status: 'NORMAL' },
      burnout: { level: 'LOW' },
      stress: { level: 'NORMAL' },
      rq: { level: 'NORMAL' },
      q9: { level: 'NONE' },
      q2plus: { depressionRisk: false, suicideRisk: false }
    }
  };

  const attempt2 = {
    employeeId: 'EMP-02',
    submittedAt: '2026-09-02T10:00:00.000Z',
    snapshot: {
      company: 'Tech Corp',
      department: 'HR',
      gender: 'หญิง',
      age: 42,
      startDate: '2020-01-15' // >5 years
    },
    result: {
      overall: { status: 'NEEDS_ADDITIONAL_CARE' },
      burnout: { level: 'HIGH' },
      stress: { level: 'MODERATE' },
      rq: { level: 'BELOW_NORMAL' },
      q9: { level: 'MODERATE' },
      q2plus: { depressionRisk: true, suicideRisk: false }
    }
  };

  // Test 1: Department OR filter
  assert.strictEqual(matchesFilters(attempt1, { departments: ['Engineering', 'HR'] }), true);
  assert.strictEqual(matchesFilters(attempt2, { departments: ['Engineering', 'HR'] }), true);
  assert.strictEqual(matchesFilters(attempt1, { departments: ['Marketing', 'HR'] }), false);

  // Test 2: Department AND Gender cross-dimension filter
  // Dept: Engineering (matches 1), Gender: หญิง (matches 2) -> Neither matches both!
  assert.strictEqual(matchesFilters(attempt1, { departments: ['Engineering'], genders: ['หญิง'] }), false);
  assert.strictEqual(matchesFilters(attempt2, { departments: ['Engineering'], genders: ['หญิง'] }), false);

  // Match Dept Engineering AND Gender ชาย -> Matches attempt1
  assert.strictEqual(matchesFilters(attempt1, { departments: ['Engineering'], genders: ['ชาย'] }), true);

  // Test 3: Tenure filter
  assert.strictEqual(matchesFilters(attempt1, { tenureBrackets: ['1-3'] }), true);
  assert.strictEqual(matchesFilters(attempt1, { tenureBrackets: ['>5'] }), false);
  assert.strictEqual(matchesFilters(attempt2, { tenureBrackets: ['>5'] }), true);

  // Test 4: Clinical filter (Burnout)
  assert.strictEqual(matchesFilters(attempt2, { burnoutLevels: ['HIGH'] }), true);
  assert.strictEqual(matchesFilters(attempt1, { burnoutLevels: ['HIGH'] }), false);

  // Test 5: Needs care filter
  assert.strictEqual(matchesFilters(attempt1, { needsCareOnly: true }), false);
  assert.strictEqual(matchesFilters(attempt2, { needsCareOnly: true }), true);
});

test('Multidimensional Filter Engine - API Integration', async (t) => {
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Login as Admin
    const resLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@123456!' })
    });
    const { sessionToken } = await resLogin.json();
    const adminHeaders = { Authorization: `Bearer ${sessionToken}` };

    // Create 2 test attempts via employee flow
    const emp1 = 'EMP-FILTER-1';
    const emp2 = 'EMP-FILTER-2';

    // Emp 1: Normal
    await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-employee-id': emp1 }
    });
    const ans1 = {};
    for (let i = 1; i <= 22; i++) ans1[`B${String(i).padStart(2, '0')}`] = 1;
    for (let i = 1; i <= 20; i++) ans1[`S${String(i).padStart(2, '0')}`] = 0;
    for (let i = 1; i <= 20; i++) ans1[`R${String(i).padStart(2, '0')}`] = 3;
    for (let i = 1; i <= 9; i++) ans1[`Q${String(i).padStart(2, '0')}`] = 0;
    ans1['QP01'] = 0; ans1['QP02'] = 0; ans1['QP03'] = 0;
    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-employee-id': emp1 },
      body: JSON.stringify({ answers: ans1 })
    });
    await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-employee-id': emp1 }
    });

    // Emp 2: Needs Care (High burnout / stress)
    await fetch(`${baseUrl}/api/assessment/notice/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-employee-id': emp2 }
    });
    const ans2 = {};
    for (let i = 1; i <= 22; i++) ans2[`B${String(i).padStart(2, '0')}`] = 5;
    for (let i = 1; i <= 20; i++) ans2[`S${String(i).padStart(2, '0')}`] = 3;
    for (let i = 1; i <= 20; i++) ans2[`R${String(i).padStart(2, '0')}`] = 1;
    for (let i = 1; i <= 9; i++) ans2[`Q${String(i).padStart(2, '0')}`] = 2;
    ans2['QP01'] = 1; ans2['QP02'] = 0; ans2['QP03'] = 0;
    await fetch(`${baseUrl}/api/assessment/draft/answers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-employee-id': emp2 },
      body: JSON.stringify({ answers: ans2 })
    });
    await fetch(`${baseUrl}/api/assessment/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-employee-id': emp2 }
    });

    // Query 1: Filter needsCareOnly=true
    const resNeedsCare = await fetch(`${baseUrl}/api/admin/assessments?needsCareOnly=true`, {
      headers: adminHeaders
    });
    assert.strictEqual(resNeedsCare.status, 200);
    const dataNeedsCare = await resNeedsCare.json();
    assert.ok(dataNeedsCare.items.every(item => item.result.overall.status === 'NEEDS_ADDITIONAL_CARE'));

    // Query 2: Filter burnoutLevels=HIGH
    const resBurnoutHigh = await fetch(`${baseUrl}/api/admin/assessments?burnoutLevels=HIGH`, {
      headers: adminHeaders
    });
    assert.strictEqual(resBurnoutHigh.status, 200);
    const dataBurnoutHigh = await resBurnoutHigh.json();
    assert.ok(dataBurnoutHigh.items.every(item => item.result.burnout.level === 'HIGH'));

    // Query 3: Filter burnoutLevels=LOW
    const resBurnoutLow = await fetch(`${baseUrl}/api/admin/assessments?burnoutLevels=LOW`, {
      headers: adminHeaders
    });
    assert.strictEqual(resBurnoutLow.status, 200);
    const dataBurnoutLow = await resBurnoutLow.json();
    assert.ok(dataBurnoutLow.items.every(item => item.result.burnout.level === 'LOW'));
  } finally {
    server.close();
  }
});
