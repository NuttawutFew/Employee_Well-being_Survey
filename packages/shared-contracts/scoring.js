const OVERALL_STATUS = {
  NORMAL: 'NORMAL',
  NEEDS_ADDITIONAL_CARE: 'NEEDS_ADDITIONAL_CARE'
};

function calculateScores(answers = {}) {
  // 1. Burnout Scoring (22 items)
  // EE: 1, 2, 3, 6, 8, 13, 14, 16, 20
  const eeItems = [1, 2, 3, 6, 8, 13, 14, 16, 20];
  // DP: 5, 10, 11, 15, 22
  const dpItems = [5, 10, 11, 15, 22];
  // PA (Inverted: 6 - score): 4, 7, 9, 12, 17, 18, 19, 21
  const paItems = [4, 7, 9, 12, 17, 18, 19, 21];

  let eeScore = 0;
  eeItems.forEach((n) => {
    const val = Number(answers[`B${String(n).padStart(2, '0')}`] || 0);
    eeScore += val;
  });

  let dpScore = 0;
  dpItems.forEach((n) => {
    const val = Number(answers[`B${String(n).padStart(2, '0')}`] || 0);
    dpScore += val;
  });

  let paScore = 0;
  paItems.forEach((n) => {
    const rawVal = Number(answers[`B${String(n).padStart(2, '0')}`] ?? 0);
    // Inverted 6 - rawVal
    const inverted = 6 - rawVal;
    paScore += inverted;
  });

  // EE Level
  let eeLevel = 'LOW';
  if (eeScore >= 27) eeLevel = 'HIGH';
  else if (eeScore >= 17) eeLevel = 'MODERATE';

  // DP Level
  let dpLevel = 'LOW';
  if (dpScore >= 13) dpLevel = 'HIGH';
  else if (dpScore >= 7) dpLevel = 'MODERATE';

  // PA Level (PA score high means high burnout)
  let paLevel = 'LOW'; // Low burnout
  if (paScore >= 39) paLevel = 'HIGH'; // High burnout
  else if (paScore >= 32) paLevel = 'MODERATE';

  // Overall Burnout level
  let burnoutLevel = 'LOW';
  if (eeLevel === 'HIGH' || dpLevel === 'HIGH' || paLevel === 'HIGH') {
    burnoutLevel = 'HIGH';
  } else if (eeLevel === 'MODERATE' || dpLevel === 'MODERATE' || paLevel === 'MODERATE') {
    burnoutLevel = 'MODERATE';
  }

  // 2. Stress Scoring (20 items, 0-3, max 60)
  let stressScore = 0;
  for (let i = 1; i <= 20; i++) {
    const val = Number(answers[`S${String(i).padStart(2, '0')}`] || 0);
    stressScore += val;
  }

  let stressLevel = 'LOW'; // 0-5
  let stressLabel = 'ต่ำกว่าเกณฑ์ปกติ';
  if (stressScore >= 30) {
    stressLevel = 'SEVERE';
    stressLabel = 'สูงกว่าปกติมาก';
  } else if (stressScore >= 26) {
    stressLevel = 'MODERATE';
    stressLabel = 'สูงกว่าปกติปานกลาง';
  } else if (stressScore >= 18) {
    stressLevel = 'MILD';
    stressLabel = 'สูงกว่าปกติเล็กน้อย';
  } else if (stressScore >= 6) {
    stressLevel = 'NORMAL';
    stressLabel = 'ปกติ';
  }

  // 3. 9Q Depression (9 items, 0-3, max 27)
  let q9Score = 0;
  for (let i = 1; i <= 9; i++) {
    const val = Number(answers[`Q${String(i).padStart(2, '0')}`] || 0);
    q9Score += val;
  }
  let q9Level = 'NONE';
  let q9Label = 'ไม่มีอาการหรือมีน้อยมาก';
  if (q9Score >= 19) {
    q9Level = 'SEVERE';
    q9Label = 'รุนแรง';
  } else if (q9Score >= 13) {
    q9Level = 'MODERATE';
    q9Label = 'ปานกลาง';
  } else if (q9Score >= 7) {
    q9Level = 'MILD';
    q9Label = 'น้อย';
  }

  // 4. Overall Status Determination (based on 3 instruments)
  const needsCare =
    burnoutLevel !== 'LOW' ||
    stressScore >= 18 ||
    q9Score >= 7;

  return {
    burnout: {
      totalScore: eeScore + dpScore + paScore,
      level: burnoutLevel,
      dimensions: {
        EE: { score: eeScore, level: eeLevel, label: 'ความอ่อนล้าทางอารมณ์' },
        DP: { score: dpScore, level: dpLevel, label: 'การลดความเป็นบุคคล' },
        PA: { score: paScore, level: paLevel, label: 'ความสำเร็จส่วนบุคคล' }
      }
    },
    stress: {
      totalScore: stressScore,
      level: stressLevel,
      label: stressLabel
    },
    q9: {
      totalScore: q9Score,
      level: q9Level,
      label: q9Label
    },
    overall: {
      status: needsCare ? OVERALL_STATUS.NEEDS_ADDITIONAL_CARE : OVERALL_STATUS.NORMAL,
      label: needsCare ? 'ควรได้รับการดูแลเพิ่มเติม' : 'ปกติ',
      description: needsCare
        ? 'เมื่อพบผลการประเมินอย่างน้อย 1 ด้านที่ไม่อยู่ในเกณฑ์ปกติ'
        : 'ผลการประเมินสุขภาพใจทุกด้านอยู่ในเกณฑ์ปกติ',
      hasSuicideRisk: false
    }
  };
}

module.exports = { calculateScores };
