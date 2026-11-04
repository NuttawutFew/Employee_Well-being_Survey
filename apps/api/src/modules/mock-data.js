const { calculateScores, ATTEMPT_STATUS } = require('@mental-health/shared-contracts');
const crypto = require('crypto');

function createAnswers({
  burnoutLevel = 'LOW',
  stressLevel = 'NORMAL',
  rqLevel = 'NORMAL',
  q9Level = 'NONE',
  depressionRisk = false,
  suicideRisk = false
} = {}) {
  const answers = {};

  // 1. Burnout (B01 - B22)
  let bVal = 1;
  let paVal = 5;
  if (burnoutLevel === 'HIGH') {
    bVal = 5;
    paVal = 1;
  } else if (burnoutLevel === 'MODERATE') {
    bVal = 3;
    paVal = 3;
  }
  for (let i = 1; i <= 22; i++) {
    const isPA = [4, 7, 9, 12, 17, 18, 19, 21].includes(i);
    answers[`B${String(i).padStart(2, '0')}`] = isPA ? paVal : bVal;
  }

  // 2. Stress (S01 - S20)
  for (let i = 1; i <= 20; i++) answers[`S${String(i).padStart(2, '0')}`] = 0;
  if (stressLevel === 'SEVERE') {
    for (let i = 1; i <= 16; i++) answers[`S${String(i).padStart(2, '0')}`] = 2; // 32 >= 30
  } else if (stressLevel === 'MODERATE') {
    for (let i = 1; i <= 14; i++) answers[`S${String(i).padStart(2, '0')}`] = 2; // 28 >= 26
  } else if (stressLevel === 'MILD') {
    for (let i = 1; i <= 20; i++) answers[`S${String(i).padStart(2, '0')}`] = 1; // 20 >= 18
  } else if (stressLevel === 'NORMAL') {
    for (let i = 1; i <= 10; i++) answers[`S${String(i).padStart(2, '0')}`] = 1; // 10 (6-17)
  } else {
    for (let i = 1; i <= 3; i++) answers[`S${String(i).padStart(2, '0')}`] = 1; // 3 (0-5)
  }

  // 3. 9Q (Q01 - Q09)
  for (let i = 1; i <= 9; i++) answers[`Q${String(i).padStart(2, '0')}`] = 0;
  if (q9Level === 'SEVERE') {
    for (let i = 1; i <= 9; i++) answers[`Q${String(i).padStart(2, '0')}`] = 3;
  } else if (q9Level === 'MODERATE') {
    for (let i = 1; i <= 7; i++) answers[`Q${String(i).padStart(2, '0')}`] = 2; // 14
  } else if (q9Level === 'MILD') {
    for (let i = 1; i <= 8; i++) answers[`Q${String(i).padStart(2, '0')}`] = 1; // 8
  }

  return answers;
}

function getMockEmployees() {
  const employees = [
    {
      employeeId: 'EMP-00101',
      firstName: 'สมชาย',
      lastName: 'ใจมั่น',
      gender: 'ชาย',
      age: 34,
      telephone: '081-456-7890',
      company: 'บ. เทค โซลูชั่นส์ จำกัด',
      department: 'วิศวกรรม',
      position: 'วิศวกรซอฟต์แวร์อาวุโส',
      workArea: 'อาคาร A ชั้น 4',
      startDate: '2023-03-15',
      submittedAt: '2026-09-01T09:15:00.000Z',
      answersOptions: { burnoutLevel: 'LOW', stressLevel: 'NORMAL', rqLevel: 'NORMAL', q9Level: 'NONE' }
    },
    {
      employeeId: 'EMP-00102',
      firstName: 'วิภาดา',
      lastName: 'รัตนโชติ',
      gender: 'หญิง',
      age: 28,
      telephone: '089-123-4567',
      company: 'บ. เทค โซลูชั่นส์ จำกัด',
      department: 'การตลาด',
      position: 'ผู้เชี่ยวชาญด้านคอนเทนต์',
      workArea: 'อาคาร A ชั้น 2',
      startDate: '2025-06-10',
      submittedAt: '2026-09-01T11:30:00.000Z',
      answersOptions: { burnoutLevel: 'MODERATE', stressLevel: 'MILD', rqLevel: 'NORMAL', q9Level: 'MILD', depressionRisk: true }
    },
    {
      employeeId: 'EMP-00103',
      firstName: 'ธีรพงศ์',
      lastName: 'เจริญสุข',
      gender: 'ชาย',
      age: 42,
      telephone: '086-789-0123',
      company: 'บ. สยาม โลจิสติกส์ จำกัด',
      department: 'ปฏิบัติการ',
      position: 'ผู้จัดการฝ่ายปฏิบัติการ',
      workArea: 'ศูนย์บางนา',
      startDate: '2020-07-01',
      submittedAt: '2026-09-02T08:45:00.000Z',
      answersOptions: { burnoutLevel: 'LOW', stressLevel: 'LOW', rqLevel: 'ABOVE_NORMAL', q9Level: 'NONE' }
    },
    {
      employeeId: 'EMP-00104',
      firstName: 'กัญญาณัฐ',
      lastName: 'วงศ์วิวัฒน์',
      gender: 'หญิง',
      age: 24,
      telephone: '095-234-5678',
      company: 'บ. เทค โซลูชั่นส์ จำกัด',
      department: 'ทรัพยากรบุคคล',
      position: 'เจ้าหน้าที่สรรหาบุคลากร',
      workArea: 'อาคาร A ชั้น 5',
      startDate: '2025-12-01',
      submittedAt: '2026-09-02T14:20:00.000Z',
      answersOptions: { burnoutLevel: 'LOW', stressLevel: 'NORMAL', rqLevel: 'NORMAL', q9Level: 'NONE' }
    },
    {
      employeeId: 'EMP-00105',
      firstName: 'พิชัย',
      lastName: 'เกียรติสกุล',
      gender: 'ชาย',
      age: 38,
      telephone: '083-987-6543',
      company: 'บ. อรุณ โฮลดิ้ง จำกัด',
      department: 'การเงิน',
      position: 'นักวิเคราะห์การเงินอาวุโส',
      workArea: 'สำนักงานใหญ่ ชั้น 18',
      startDate: '2022-05-18',
      submittedAt: '2026-09-03T10:10:00.000Z',
      answersOptions: { burnoutLevel: 'HIGH', stressLevel: 'SEVERE', rqLevel: 'BELOW_NORMAL', q9Level: 'MODERATE', depressionRisk: true }
    },
    {
      employeeId: 'EMP-00106',
      firstName: 'ศิริพร',
      lastName: 'บุญเสริม',
      gender: 'หญิง',
      age: 31,
      telephone: '092-345-6789',
      company: 'บ. เทค โซลูชั่นส์ จำกัด',
      department: 'วิศวกรรม',
      position: 'ผู้จัดการผลิตภัณฑ์',
      workArea: 'อาคาร A ชั้น 3',
      startDate: '2023-11-01',
      submittedAt: '2026-09-03T16:05:00.000Z',
      answersOptions: { burnoutLevel: 'MODERATE', stressLevel: 'NORMAL', rqLevel: 'NORMAL', q9Level: 'NONE' }
    },
    {
      employeeId: 'EMP-00107',
      firstName: 'อนันต์',
      lastName: 'ศรีสวัสดิ์',
      gender: 'ชาย',
      age: 29,
      telephone: '087-654-3210',
      company: 'บ. สยาม โลจิสติกส์ จำกัด',
      department: 'ปฏิบัติการ',
      position: 'หัวหน้าทีมบริการลูกค้า',
      workArea: 'ศูนย์ลาดกระบัง',
      startDate: '2025-02-14',
      submittedAt: '2026-09-04T09:50:00.000Z',
      answersOptions: { burnoutLevel: 'MODERATE', stressLevel: 'MODERATE', rqLevel: 'BELOW_NORMAL', q9Level: 'MODERATE', depressionRisk: true, suicideRisk: true }
    },
    {
      employeeId: 'EMP-00108',
      firstName: 'ปิยะนุช',
      lastName: 'สดใส',
      gender: 'หญิง',
      age: 36,
      telephone: '084-567-8901',
      company: 'บ. อรุณ โฮลดิ้ง จำกัด',
      department: 'การเงิน',
      position: 'ผู้ตรวจสอบภายใน',
      workArea: 'สำนักงานใหญ่ ชั้น 19',
      startDate: '2021-06-20',
      submittedAt: '2026-09-04T13:40:00.000Z',
      answersOptions: { burnoutLevel: 'LOW', stressLevel: 'LOW', rqLevel: 'NORMAL', q9Level: 'NONE' }
    },
    {
      employeeId: 'EMP-00109',
      firstName: 'ณัฐวุฒิ',
      lastName: 'ประเสริฐ',
      gender: 'ชาย',
      age: 23,
      telephone: '098-765-4321',
      company: 'บ. เทค โซลูชั่นส์ จำกัด',
      department: 'วิศวกรรม',
      position: 'วิศวกรซอฟต์แวร์ระดับต้น',
      workArea: 'อาคาร A ชั้น 4',
      startDate: '2026-04-01',
      submittedAt: '2026-09-05T08:30:00.000Z',
      answersOptions: { burnoutLevel: 'LOW', stressLevel: 'NORMAL', rqLevel: 'NORMAL', q9Level: 'NONE' }
    },
    {
      employeeId: 'EMP-00110',
      firstName: 'วรัญญา',
      lastName: 'จิตสงบ',
      gender: 'หญิง',
      age: 48,
      telephone: '081-987-6543',
      company: 'บ. อรุณ โฮลดิ้ง จำกัด',
      department: 'ทรัพยากรบุคคล',
      position: 'ผู้อำนวยการฝ่ายทรัพยากรบุคคล',
      workArea: 'สำนักงานใหญ่ ชั้น 20',
      startDate: '2018-04-10',
      submittedAt: '2026-09-05T10:15:00.000Z',
      answersOptions: { burnoutLevel: 'LOW', stressLevel: 'NORMAL', rqLevel: 'ABOVE_NORMAL', q9Level: 'NONE' }
    }
  ];

  return employees.map((emp) => {
    const answers = createAnswers(emp.answersOptions);
    const result = calculateScores(answers);
    const attemptId = crypto.randomUUID();

    return {
      attemptId,
      employeeId: emp.employeeId,
      round: 1,
      noticeVersion: '2026-09-03',
      noticeAcknowledgedAt: new Date(new Date(emp.submittedAt).getTime() - 1800000).toISOString(),
      status: ATTEMPT_STATUS.SUBMITTED,
      definitionBundleVersion: '1.0.0',
      currentStepIndex: 4,
      answers,
      createdAt: new Date(new Date(emp.submittedAt).getTime() - 1800000).toISOString(),
      updatedAt: emp.submittedAt,
      submittedAt: emp.submittedAt,
      result,
      feedback: emp.feedback || (emp.employeeId === 'EMP-00102' ? 'แบบประเมินใช้งานง่าย สะดวกดีครับ อยากให้เพิ่มคำแนะนำด้านการจัด work-life balance ในหน้าผลลัพธ์ด้วยครับ' : (emp.employeeId === 'EMP-00105' ? 'อยากให้มีกิจกรรมผ่อนคลายกล้ามเนื้อช่วงบ่ายครับ' : null)),
      snapshot: {
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        gender: emp.gender,
        age: emp.age,
        telephone: emp.telephone,
        company: emp.company,
        department: emp.department,
        position: emp.position,
        workArea: emp.workArea,
        startDate: emp.startDate
      }
    };
  });
}

module.exports = { getMockEmployees, createAnswers };
