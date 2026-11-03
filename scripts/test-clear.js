const { AssessmentSessionService } = require('../apps/api/src/modules/assessment-session');

async function testClearFull() {
  const sessionService = new AssessmentSessionService();
  const empId = 'EMP-DEV-001';

  await sessionService.acknowledgeNotice(empId, { noticeVersion: '2026-09-03' });

  const burnoutAnswers = {};
  for (let i = 1; i <= 22; i++) {
    burnoutAnswers[`B${String(i).padStart(2, '0')}`] = 2;
  }
  await sessionService.saveAnswers(empId, burnoutAnswers);
  await sessionService.nextStep(empId);

  await sessionService.clearDraft(empId);

  // Now what does getSession return?
  const session = await sessionService.getSession(empId);
  console.log('Session after clearDraft:', session);

  // What does getDraft return?
  try {
    const draft = await sessionService.getDraft(empId);
    console.log('Draft after clearDraft:', draft);
  } catch (err) {
    console.log('getDraft error after clearDraft:', err.status, err.message);
  }
}

testClearFull();
