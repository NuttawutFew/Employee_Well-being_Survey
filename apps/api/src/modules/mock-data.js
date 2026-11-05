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
    bVal = 2;
    paVal = 2;
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

  if (suicideRisk) {
    answers['Q09'] = 3;
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
      // Multi-round: 4 rounds showing clinical recovery trajectory across 4 quarters
      rounds: [
        {
          round: 1,
          submittedAt: '2025-11-15T09:15:00.000Z',
          answersOptions: { burnoutLevel: 'HIGH', stressLevel: 'SEVERE', rqLevel: 'BELOW_NORMAL', q9Level: 'MODERATE', depressionRisk: true },
          feedback: 'ช่วงปิดโปรเจกต์งานหนักและทำงานล่วงเวลาติดต่อกันหลายสัปดาห์ รู้สึกหมดไฟและล้าสะสม อยากได้คำปรึกษาในการจัดสรรเวลา'
        },
        {
          round: 2,
          submittedAt: '2026-02-20T10:30:00.000Z',
          answersOptions: { burnoutLevel: 'MODERATE', stressLevel: 'MODERATE', rqLevel: 'NORMAL', q9Level: 'MILD' },
          feedback: 'เข้าร่วมโปรแกรมปรึกษาของ HR และเริ่มปรับตารางงาน มีเวลาพักผ่อนมากขึ้น อาการดีขึ้นพอสมควร'
        },
        {
          round: 3,
          submittedAt: '2026-05-25T14:00:00.000Z',
          answersOptions: { burnoutLevel: 'LOW', stressLevel: 'MILD', rqLevel: 'NORMAL', q9Level: 'NONE' },
          feedback: 'ความเครียดลดลงมาก บรรยากาศในทีมดีขึ้น สามารถรับมือกับงานประจำวันได้ตามเป้าหมาย'
        },
        {
          round: 4,
          submittedAt: '2026-09-01T09:15:00.000Z',
          answersOptions: { burnoutLevel: 'LOW', stressLevel: 'NORMAL', rqLevel: 'ABOVE_NORMAL', q9Level: 'NONE' },
          feedback: 'สุขภาพจิตกลับมาอยู่ในเกณฑ์ดีเยี่ยม มีพลังในการทำงาน ขอบคุณทีมงานและระบบติดตามผลครับ'
        }
      ]
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
      // Multi-round: 2 rounds (Baseline & Follow-up)
      rounds: [
        {
          round: 1,
          submittedAt: '2026-04-12T11:30:00.000Z',
          answersOptions: { burnoutLevel: 'HIGH', stressLevel: 'MODERATE', rqLevel: 'BELOW_NORMAL', q9Level: 'MODERATE', depressionRisk: true },
          feedback: 'ต้องคิดแคมเปญใหม่ตลอดเวลา รู้สึกไอเดียตันและเหนื่อยล้า'
        },
        {
          round: 2,
          submittedAt: '2026-09-01T11:30:00.000Z',
          answersOptions: { burnoutLevel: 'MODERATE', stressLevel: 'MILD', rqLevel: 'NORMAL', q9Level: 'MILD', depressionRisk: true },
          feedback: 'แบบประเมินใช้งานง่าย สะดวกดีครับ อยากให้เพิ่มคำแนะนำด้านการจัด work-life balance ในหน้าผลลัพธ์ด้วยครับ'
        }
      ]
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
      // Multi-round: 3 rounds showing continuous financial stress monitoring
      rounds: [
        {
          round: 1,
          submittedAt: '2026-03-05T10:10:00.000Z',
          answersOptions: { burnoutLevel: 'MODERATE', stressLevel: 'MODERATE', rqLevel: 'NORMAL', q9Level: 'MILD' },
          feedback: 'ช่วงปิดงบประจำปีมีความเครียดสะสมระดับปานกลาง'
        },
        {
          round: 2,
          submittedAt: '2026-06-10T11:20:00.000Z',
          answersOptions: { burnoutLevel: 'HIGH', stressLevel: 'MODERATE', rqLevel: 'BELOW_NORMAL', q9Level: 'MODERATE', depressionRisk: true },
          feedback: 'ปริมาณงานตรวจสอบงบเพิ่มขึ้นอย่างมาก นอนไม่ค่อยหลับ'
        },
        {
          round: 3,
          submittedAt: '2026-09-03T10:10:00.000Z',
          answersOptions: { burnoutLevel: 'HIGH', stressLevel: 'SEVERE', rqLevel: 'BELOW_NORMAL', q9Level: 'MODERATE', depressionRisk: true },
          feedback: 'อยากให้มีกิจกรรมผ่อนคลายกล้ามเนื้อช่วงบ่ายครับ และต้องการคำแนะนำจากผู้เชี่ยวชาญเพิ่มเติม'
        }
      ]
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
      // Multi-round: 2 rounds showing critical risk intervention and progress
      rounds: [
        {
          round: 1,
          submittedAt: '2026-05-10T09:50:00.000Z',
          answersOptions: { burnoutLevel: 'MODERATE', stressLevel: 'SEVERE', rqLevel: 'BELOW_NORMAL', q9Level: 'MODERATE', depressionRisk: true, suicideRisk: true },
          feedback: 'เจอลูกค้าต่อว่าและแรงกดดันจากยอดจัดส่ง รู้สึกเครียดและวิตกกังวลมาก'
        },
        {
          round: 2,
          submittedAt: '2026-09-04T09:50:00.000Z',
          answersOptions: { burnoutLevel: 'MODERATE', stressLevel: 'MODERATE', rqLevel: 'NORMAL', q9Level: 'MILD', depressionRisk: true, suicideRisk: false },
          feedback: 'ได้รับการดูแลและพูดคุยจากนักจิตวิทยาที่บริษัทส่งมา ความคิดวิตกกังวลลดลง ยังคงต้องดูแลตัวเองต่อเนื่อง'
        }
      ]
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

  const allAttempts = [];

  for (const emp of employees) {
    const roundsList = emp.rounds && emp.rounds.length > 0
      ? emp.rounds
      : [
          {
            round: 1,
            submittedAt: emp.submittedAt,
            answersOptions: emp.answersOptions,
            feedback: emp.feedback || null
          }
        ];

    // Ensure rounds are ordered ascending by round number
    roundsList.sort((a, b) => a.round - b.round);

    for (const r of roundsList) {
      const answers = createAnswers(r.answersOptions);
      const result = calculateScores(answers);
      if (r.answersOptions && r.answersOptions.suicideRisk) {
        result.overall.hasSuicideRisk = true;
      }
      const attemptId = `ATT-${emp.employeeId}-R${r.round}`;

      allAttempts.push({
        attemptId,
        employeeId: emp.employeeId,
        round: r.round,
        noticeVersion: '2026-09-03',
        noticeAcknowledgedAt: new Date(new Date(r.submittedAt).getTime() - 1800000).toISOString(),
        status: ATTEMPT_STATUS.SUBMITTED,
        definitionBundleVersion: '1.0.0',
        currentStepIndex: 4,
        answers,
        createdAt: new Date(new Date(r.submittedAt).getTime() - 1800000).toISOString(),
        updatedAt: r.submittedAt,
        submittedAt: r.submittedAt,
        result,
        feedback: r.feedback || null,
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
      });
    }
  }

  return allAttempts;
}

module.exports = { getMockEmployees, createAnswers };
