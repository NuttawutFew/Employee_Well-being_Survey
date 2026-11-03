const test = require('node:test');
const assert = require('node:assert');
const { calculateScores } = require('../scoring');

test('Scoring Engine - Burnout calculation & reverse scoring', () => {
  // Low burnout case
  const lowAnswers = {};
  for (let i = 1; i <= 22; i++) {
    const code = `B${String(i).padStart(2, '0')}`;
    // For normal items give 0, for PA items (reversed) give 6 (which inverts to 0)
    lowAnswers[code] = [4, 7, 9, 12, 17, 18, 19, 21].includes(i) ? 6 : 0;
  }
  const resultLow = calculateScores(lowAnswers);
  assert.strictEqual(resultLow.burnout.dimensions.EE.score, 0);
  assert.strictEqual(resultLow.burnout.dimensions.EE.level, 'LOW');
  assert.strictEqual(resultLow.burnout.dimensions.DP.score, 0);
  assert.strictEqual(resultLow.burnout.dimensions.DP.level, 'LOW');
  assert.strictEqual(resultLow.burnout.dimensions.PA.score, 0);
  assert.strictEqual(resultLow.burnout.dimensions.PA.level, 'LOW');
  assert.strictEqual(resultLow.burnout.level, 'LOW');

  // High burnout case
  const highAnswers = {};
  for (let i = 1; i <= 22; i++) {
    const code = `B${String(i).padStart(2, '0')}`;
    // For normal items give 6, for PA items give 0 (which inverts to 6)
    highAnswers[code] = [4, 7, 9, 12, 17, 18, 19, 21].includes(i) ? 0 : 6;
  }
  const resultHigh = calculateScores(highAnswers);
  assert.strictEqual(resultHigh.burnout.dimensions.EE.score, 54);
  assert.strictEqual(resultHigh.burnout.dimensions.EE.level, 'HIGH');
  assert.strictEqual(resultHigh.burnout.dimensions.DP.score, 30);
  assert.strictEqual(resultHigh.burnout.dimensions.DP.level, 'HIGH');
  assert.strictEqual(resultHigh.burnout.dimensions.PA.score, 48);
  assert.strictEqual(resultHigh.burnout.dimensions.PA.level, 'HIGH');
  assert.strictEqual(resultHigh.burnout.level, 'HIGH');
});

test('Scoring Engine - Stress threshold boundaries', () => {
  const mkStress = (score) => {
    const ans = {};
    let rem = score;
    for (let i = 1; i <= 20; i++) {
      const val = Math.min(rem, 3);
      ans[`S${String(i).padStart(2, '0')}`] = val;
      rem -= val;
    }
    return calculateScores(ans).stress;
  };

  assert.strictEqual(mkStress(5).level, 'LOW');
  assert.strictEqual(mkStress(6).level, 'NORMAL');
  assert.strictEqual(mkStress(17).level, 'NORMAL');
  assert.strictEqual(mkStress(18).level, 'MILD');
  assert.strictEqual(mkStress(25).level, 'MILD');
  assert.strictEqual(mkStress(26).level, 'MODERATE');
  assert.strictEqual(mkStress(29).level, 'MODERATE');
  assert.strictEqual(mkStress(30).level, 'SEVERE');
});

test('Scoring Engine - 9Q depression screening thresholds', () => {
  const mk9Q = (score) => {
    const ans = {};
    let rem = score;
    for (let i = 1; i <= 9; i++) {
      const val = Math.min(rem, 3);
      ans[`Q${String(i).padStart(2, '0')}`] = val;
      rem -= val;
    }
    return calculateScores(ans).q9;
  };

  assert.strictEqual(mk9Q(0).level, 'NONE');
  assert.strictEqual(mk9Q(6).level, 'NONE');
  assert.strictEqual(mk9Q(7).level, 'MILD');
  assert.strictEqual(mk9Q(12).level, 'MILD');
  assert.strictEqual(mk9Q(13).level, 'MODERATE');
  assert.strictEqual(mk9Q(18).level, 'MODERATE');
  assert.strictEqual(mk9Q(19).level, 'SEVERE');
  assert.strictEqual(mk9Q(27).level, 'SEVERE');
});

test('Scoring Engine - Overall status calculation across 3 instruments', () => {
  // Normal across all
  const normalAns = {};
  for (let i = 1; i <= 22; i++) {
    normalAns[`B${String(i).padStart(2, '0')}`] = [4, 7, 9, 12, 17, 18, 19, 21].includes(i) ? 6 : 0;
  }
  for (let i = 1; i <= 20; i++) normalAns[`S${String(i).padStart(2, '0')}`] = 0;
  for (let i = 1; i <= 9; i++) normalAns[`Q${String(i).padStart(2, '0')}`] = 0;

  const normalResult = calculateScores(normalAns);
  assert.strictEqual(normalResult.overall.status, 'NORMAL');

  // Trigger care via 9Q score >= 7
  normalAns.Q01 = 3;
  normalAns.Q02 = 3;
  normalAns.Q03 = 1;
  const careResult = calculateScores(normalAns);
  assert.strictEqual(careResult.overall.status, 'NEEDS_ADDITIONAL_CARE');
  assert.strictEqual(careResult.q9.totalScore, 7);
  assert.strictEqual(careResult.q9.level, 'MILD');
});
