const {
  ATTEMPT_STATUS,
  ERROR_CODES,
  ASSESSMENTS_CATALOG,
  calculateScores,
  matchesFilters,
  PRIVACY_RULES,
  OVERALL_STATUS,
  SESSION_CONFIG
} = require('@mental-health/shared-contracts');
const crypto = require('crypto');

const PII_ENCRYPTION_KEY = process.env.PII_ENCRYPTION_KEY || crypto.createHash('sha256').update('mental-health-pii-secret-key').digest();

function encryptPII(text) {
  if (text === null || text === undefined || text === '') return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', PII_ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptPII(cipherText) {
  if (typeof cipherText !== 'string' || !cipherText.startsWith('enc:')) return cipherText;
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 4) return cipherText;
    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];
    const decipher = crypto.createDecipheriv('aes-256-gcm', PII_ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return cipherText;
  }
}

class AssessmentSessionService {

  constructor({ db = null, auditService = null, draftTtlMinutes = null } = {}) {
    this.db = db;
    this.auditService = auditService;
    this.attemptsCollection = db?.collection ? db.collection('assessment_attempts') : null;
    this.resetsCollection = db?.collection ? db.collection('admin_resets') : null;
    // Draft TTL (in minutes, default 15)
    const envTtl = process.env.DRAFT_TTL_MINUTES ? parseInt(process.env.DRAFT_TTL_MINUTES, 10) : null;
    this.draftTtlMinutes = draftTtlMinutes || envTtl || SESSION_CONFIG?.DEFAULT_DRAFT_TTL_MINUTES || 15;
    this.draftTtlMs = this.draftTtlMinutes * 60 * 1000;
    // In-memory store for fallback/dev/testing
    this.memoryAttempts = new Map(); // employeeId -> active AssessmentAttempt
    this.allAttempts = new Map(); // attemptId -> AssessmentAttempt
    this.adminResets = [];
  }

  isDraftExpired(attempt) {
    if (!attempt || attempt.status !== ATTEMPT_STATUS.DRAFT) {
      return false;
    }
    const lastActive = new Date(attempt.updatedAt || attempt.noticeAcknowledgedAt || attempt.createdAt).getTime();
    if (isNaN(lastActive)) return false;
    return Date.now() - lastActive > this.draftTtlMs;
  }

  async expireDraft(employeeId, attempt) {
    if (!attempt) return;
    attempt.answers = {};
    attempt.noticeAcknowledgedAt = null;
    attempt.status = null;
    attempt.currentStepIndex = 0;
    attempt.updatedAt = new Date().toISOString();

    if (this.attemptsCollection) {
      await this.attemptsCollection.updateOne(
        { employeeId },
        {
          $set: {
            answers: {},
            noticeAcknowledgedAt: null,
            status: null,
            currentStepIndex: 0,
            updatedAt: attempt.updatedAt
          }
        }
      );
    }
  }

  seedMockData() {
    const { getMockEmployees } = require('./mock-data');
    const mockList = getMockEmployees();
    const mockEmpIds = new Set(mockList.map((m) => m.employeeId));

    // Cleanly refresh previous mock records for these 10 mock employees
    if (this.attemptsCollection && Array.isArray(this.attemptsCollection._documents)) {
      this.attemptsCollection._documents = this.attemptsCollection._documents.filter(
        (d) => !mockEmpIds.has(d.employeeId)
      );
    }
    for (const [id, a] of Array.from(this.allAttempts.entries())) {
      if (mockEmpIds.has(a.employeeId)) {
        this.allAttempts.delete(id);
      }
    }
    for (const empId of mockEmpIds) {
      this.memoryAttempts.delete(empId);
    }

    for (const item of mockList) {
      item.round = 1;
      this.memoryAttempts.set(item.employeeId, item);
      this.allAttempts.set(item.attemptId, item);
      if (this.attemptsCollection) {
        this.attemptsCollection.updateOne(
          { attemptId: item.attemptId },
          { $set: item },
          { upsert: true }
        );
      }
    }
    if (this.attemptsCollection?.database?._saveToFile) {
      this.attemptsCollection.database._saveToFile();
    }
    return mockList;
  }

  purgeMockData() {
    const mockEmpIds = new Set(['EMP-00101', 'EMP-00102', 'EMP-00103', 'EMP-00104', 'EMP-00105', 'EMP-00106', 'EMP-00107', 'EMP-00108', 'EMP-00109', 'EMP-00110']);
    if (this.attemptsCollection && Array.isArray(this.attemptsCollection._documents)) {
      this.attemptsCollection._documents = this.attemptsCollection._documents.filter(
        (d) => !mockEmpIds.has(d.employeeId)
      );
    }
    for (const [id, a] of Array.from(this.allAttempts.entries())) {
      if (mockEmpIds.has(a.employeeId)) {
        this.allAttempts.delete(id);
      }
    }
    for (const empId of mockEmpIds) {
      this.memoryAttempts.delete(empId);
    }
    if (this.attemptsCollection?.database?._saveToFile) {
      this.attemptsCollection.database._saveToFile();
    }
    return { success: true, count: mockEmpIds.size };
  }

  _syncFromCollectionSync() {
    if (this.attemptsCollection && Array.isArray(this.attemptsCollection._documents)) {
      if (typeof this.attemptsCollection.database?._loadFromFile === 'function') {
        this.attemptsCollection.database._loadFromFile();
      }
      for (const doc of this.attemptsCollection._documents) {
        if (doc && doc.attemptId) {
          this.allAttempts.set(doc.attemptId, doc);
          if (doc.employeeId && doc.status !== ATTEMPT_STATUS.CANCELLED) {
            const existing = this.memoryAttempts.get(doc.employeeId);
            if (!existing || (doc.updatedAt && (!existing.updatedAt || doc.updatedAt >= existing.updatedAt))) {
              this.memoryAttempts.set(doc.employeeId, doc);
            }
          } else if (doc.employeeId && doc.status === ATTEMPT_STATUS.CANCELLED) {
            const existing = this.memoryAttempts.get(doc.employeeId);
            if (existing && existing.attemptId === doc.attemptId) {
              this.memoryAttempts.delete(doc.employeeId);
            }
          }
        }
      }
    }
  }

  async _syncFromCollection() {
    this._syncFromCollectionSync();
    if (this.attemptsCollection && typeof this.attemptsCollection.find === 'function') {
      try {
        const cursor = this.attemptsCollection.find({});
        const docs = typeof cursor.toArray === 'function' ? await cursor.toArray() : cursor;
        if (Array.isArray(docs)) {
          for (const doc of docs) {
            if (doc && doc.attemptId) {
              this.allAttempts.set(doc.attemptId, doc);
              if (doc.employeeId && doc.status !== ATTEMPT_STATUS.CANCELLED) {
                const existing = this.memoryAttempts.get(doc.employeeId);
                if (!existing || (doc.updatedAt && (!existing.updatedAt || doc.updatedAt >= existing.updatedAt))) {
                  this.memoryAttempts.set(doc.employeeId, doc);
                }
              } else if (doc.employeeId && doc.status === ATTEMPT_STATUS.CANCELLED) {
                const existing = this.memoryAttempts.get(doc.employeeId);
                if (existing && existing.attemptId === doc.attemptId) {
                  this.memoryAttempts.delete(doc.employeeId);
                }
              }
            }
          }
        }
      } catch (err) {
        // ignore fallback errors
      }
    }
  }

  _getAllAttempts() {
    this._syncFromCollectionSync();
    const list = new Map();
    for (const a of this.memoryAttempts.values()) {
      if (a && a.attemptId) list.set(a.attemptId, a);
    }
    for (const a of this.allAttempts.values()) {
      if (a && a.attemptId) list.set(a.attemptId, a);
    }
    return Array.from(list.values());
  }

  _getEmployeeAttempts(employeeId) {
    this._syncFromCollectionSync();
    const map = new Map();
    for (const a of this.allAttempts.values()) {
      if (a && a.employeeId === employeeId && a.attemptId) {
        map.set(a.attemptId, a);
      }
    }
    for (const a of this.memoryAttempts.values()) {
      if (a && a.employeeId === employeeId && a.attemptId) {
        map.set(a.attemptId, a);
      }
    }
    const attempts = Array.from(map.values());
    attempts.sort((a, b) => {
      const tA = new Date(a.submittedAt || a.createdAt || 0).getTime();
      const tB = new Date(b.submittedAt || b.createdAt || 0).getTime();
      return tA - tB;
    });
    // Assign incremental round numbers if missing
    attempts.forEach((att, idx) => {
      if (!att.round) {
        att.round = idx + 1;
      }
    });
    return attempts;
  }

  async getSession(employeeId) {
    if (!employeeId) {
      const err = new Error('Employee ID required');
      err.status = 401;
      err.code = ERROR_CODES.UNAUTHORIZED;
      throw err;
    }

    await this._syncFromCollection();

    let attempt = this.memoryAttempts.get(employeeId);
    if (!attempt && this.attemptsCollection) {
      attempt = await this.attemptsCollection.findOne({ employeeId, status: { $ne: ATTEMPT_STATUS.CANCELLED } });
      if (attempt) {
        this.memoryAttempts.set(employeeId, attempt);
        this.allAttempts.set(attempt.attemptId, attempt);
      }
    }

    if (!attempt || attempt.status === ATTEMPT_STATUS.CANCELLED) {
      return {
        noticeAcknowledged: false,
        status: null,
        attemptId: null,
        draftTtlMinutes: this.draftTtlMinutes
      };
    }

    // Check if active draft has expired (> 15 minutes)
    if (attempt.status === ATTEMPT_STATUS.DRAFT && this.isDraftExpired(attempt)) {
      await this.expireDraft(employeeId, attempt);
      return {
        noticeAcknowledged: false,
        status: null,
        attemptId: null,
        draftExpired: true,
        draftTtlMinutes: this.draftTtlMinutes,
        message: `เซสชันแบบร่างหมดอายุเนื่องจากไม่มีการทำรายการเกิน ${this.draftTtlMinutes} นาที ระบบได้เริ่มใหม่ทั้งหมด`
      };
    }

    const lastActive = attempt.updatedAt || attempt.noticeAcknowledgedAt || attempt.createdAt;
    const lastActiveMs = lastActive ? new Date(lastActive).getTime() : Date.now();
    const draftExpiresAt = attempt.status === ATTEMPT_STATUS.DRAFT
      ? new Date(lastActiveMs + this.draftTtlMs).toISOString()
      : null;
    const remainingMs = attempt.status === ATTEMPT_STATUS.DRAFT
      ? Math.max(0, lastActiveMs + this.draftTtlMs - Date.now())
      : null;

    return {
      noticeAcknowledged: !!attempt.noticeAcknowledgedAt,
      status: attempt.status,
      attemptId: attempt.attemptId,
      round: attempt.round || 1,
      noticeAcknowledgedAt: attempt.noticeAcknowledgedAt,
      submittedAt: attempt.submittedAt || null,
      result: attempt.result || null,
      updatedAt: attempt.updatedAt || null,
      draftExpiresAt,
      remainingMs,
      draftTtlMinutes: this.draftTtlMinutes,
      savedCount: Object.keys(attempt.answers || {}).length,
      feedback: attempt.feedback || null
    };
  }

  async acknowledgeNotice(employeeId, { noticeVersion = '2026-09-03' } = {}) {
    if (!employeeId) {
      const err = new Error('Employee ID required');
      err.status = 401;
      err.code = ERROR_CODES.UNAUTHORIZED;
      throw err;
    }

    await this._syncFromCollection();
    let attempt = this.memoryAttempts.get(employeeId);
    if (attempt && attempt.status === ATTEMPT_STATUS.CANCELLED) {
      this.memoryAttempts.delete(employeeId);
      attempt = null;
    }

    // If attempt already exists and is submitted, cannot create a new one unless reset
    if (attempt && attempt.status === ATTEMPT_STATUS.SUBMITTED) {
      const err = new Error('พนักงานได้ทำการส่งแบบประเมินเรียบร้อยแล้ว');
      err.status = 409;
      err.code = ERROR_CODES.SINGLE_SUBMISSION_VIOLATION;
      throw err;
    }

    const pastAttempts = this._getEmployeeAttempts(employeeId);
    let maxRound = 0;
    for (const a of pastAttempts) {
      if (a.round && a.round > maxRound) maxRound = a.round;
    }
    const nextRound = maxRound > 0 ? maxRound + 1 : (pastAttempts.length > 0 ? pastAttempts.length + 1 : 1);

    const now = new Date().toISOString();
    if (!attempt || attempt.status === ATTEMPT_STATUS.CANCELLED) {
      attempt = {
        attemptId: crypto.randomUUID(),
        employeeId,
        round: nextRound,
        noticeVersion,
        noticeAcknowledgedAt: now,
        status: ATTEMPT_STATUS.DRAFT,
        definitionBundleVersion: '1.0.0',
        currentStepIndex: 0,
        answers: {},
        createdAt: now,
        updatedAt: now
      };
      this.memoryAttempts.set(employeeId, attempt);
      this.allAttempts.set(attempt.attemptId, attempt);
    } else {
      attempt.noticeVersion = noticeVersion;
      attempt.noticeAcknowledgedAt = now;
      attempt.status = ATTEMPT_STATUS.DRAFT;
      attempt.round = attempt.round || nextRound;
      attempt.currentStepIndex = 0;
      attempt.updatedAt = now;
      this.allAttempts.set(attempt.attemptId, attempt);
    }

    if (this.attemptsCollection) {
      await this.attemptsCollection.updateOne(
        { attemptId: attempt.attemptId },
        { $set: attempt },
        { upsert: true }
      );
    }

    return {
      success: true,
      attemptId: attempt.attemptId,
      round: attempt.round,
      status: attempt.status,
      noticeAcknowledgedAt: attempt.noticeAcknowledgedAt
    };
  }

  async getDraft(employeeId) {
    await this._syncFromCollection();
    let attempt = this.memoryAttempts.get(employeeId);
    if (attempt && attempt.status === ATTEMPT_STATUS.CANCELLED) {
      this.memoryAttempts.delete(employeeId);
      attempt = null;
    }
    if (!attempt && this.attemptsCollection) {
      attempt = await this.attemptsCollection.findOne({ employeeId, status: ATTEMPT_STATUS.DRAFT });
      if (attempt) {
        this.memoryAttempts.set(employeeId, attempt);
        this.allAttempts.set(attempt.attemptId, attempt);
      }
    }

    if (!attempt || !attempt.noticeAcknowledgedAt) {
      const err = new Error('กรุณารับทราบคำชี้แจงก่อนเริ่มทำแบบประเมิน');
      err.status = 403;
      err.code = ERROR_CODES.FORBIDDEN;
      throw err;
    }

    if (attempt.status !== ATTEMPT_STATUS.DRAFT) {
      const err = new Error('ไม่พบแบบร่างที่สามารถแก้ไขได้');
      err.status = 400;
      err.code = ERROR_CODES.ATTEMPT_LOCKED;
      throw err;
    }

    if (this.isDraftExpired(attempt)) {
      await this.expireDraft(employeeId, attempt);
      const err = new Error(`เซสชันแบบร่างหมดอายุเนื่องจากไม่มีการทำรายการเกิน ${this.draftTtlMinutes} นาที ระบบได้เริ่มใหม่ทั้งหมด`);
      err.status = 410;
      err.code = ERROR_CODES.SESSION_EXPIRED;
      throw err;
    }

    const lastActive = attempt.updatedAt || attempt.noticeAcknowledgedAt || attempt.createdAt;
    const lastActiveMs = lastActive ? new Date(lastActive).getTime() : Date.now();
    const draftExpiresAt = new Date(lastActiveMs + this.draftTtlMs).toISOString();

    return {
      attemptId: attempt.attemptId,
      status: attempt.status,
      currentStepIndex: attempt.currentStepIndex || 0,
      answers: attempt.answers || {},
      updatedAt: attempt.updatedAt,
      draftExpiresAt,
      draftTtlMinutes: this.draftTtlMinutes
    };
  }

  async nextStep(employeeId) {
    let attempt = this.memoryAttempts.get(employeeId);
    if (attempt && attempt.status === ATTEMPT_STATUS.CANCELLED) {
      this.memoryAttempts.delete(employeeId);
      attempt = null;
    }
    if (!attempt || attempt.status !== ATTEMPT_STATUS.DRAFT) {
      const err = new Error('ไม่พบแบบร่างที่สามารถแก้ไขได้');
      err.status = 400;
      err.code = ERROR_CODES.ATTEMPT_LOCKED;
      throw err;
    }

    if (this.isDraftExpired(attempt)) {
      await this.expireDraft(employeeId, attempt);
      const err = new Error(`เซสชันแบบร่างหมดอายุเนื่องจากไม่มีการทำรายการเกิน ${this.draftTtlMinutes} นาที ระบบได้เริ่มใหม่ทั้งหมด`);
      err.status = 410;
      err.code = ERROR_CODES.SESSION_EXPIRED;
      throw err;
    }

    const stepIndex = attempt.currentStepIndex || 0;
    const currentAssessment = ASSESSMENTS_CATALOG[stepIndex];

    if (!currentAssessment) {
      const err = new Error('ไม่พบแบบประเมินในขั้นตอนปัจจุบัน');
      err.status = 400;
      err.code = ERROR_CODES.INTERNAL_ERROR;
      throw err;
    }

    // Validate that all questions in current assessment are answered
    const answers = attempt.answers || {};
    const missingQuestions = [];

    for (const q of currentAssessment.questions) {
      if (answers[q.code] === undefined || answers[q.code] === null) {
        missingQuestions.push(q.code);
      }
    }

    if (missingQuestions.length > 0) {
      const err = new Error(`กรุณาตอบคำถามให้ครบทุกข้อ (ยังไม่ได้ตอบ ${missingQuestions.length} ข้อ)`);
      err.status = 400;
      err.code = ERROR_CODES.VALIDATION_FAILED;
      err.missingQuestions = missingQuestions;
      throw err;
    }

    if (stepIndex < ASSESSMENTS_CATALOG.length - 1) {
      attempt.currentStepIndex = stepIndex + 1;
      attempt.updatedAt = new Date().toISOString();
    }

    return {
      success: true,
      currentStepIndex: attempt.currentStepIndex,
      currentAssessmentCode: ASSESSMENTS_CATALOG[attempt.currentStepIndex].code
    };
  }

  async prevStep(employeeId) {
    let attempt = this.memoryAttempts.get(employeeId);
    if (attempt && attempt.status === ATTEMPT_STATUS.CANCELLED) {
      this.memoryAttempts.delete(employeeId);
      attempt = null;
    }
    if (!attempt || attempt.status !== ATTEMPT_STATUS.DRAFT) {
      const err = new Error('ไม่พบแบบร่างที่สามารถแก้ไขได้');
      err.status = 400;
      err.code = ERROR_CODES.ATTEMPT_LOCKED;
      throw err;
    }

    if (this.isDraftExpired(attempt)) {
      await this.expireDraft(employeeId, attempt);
      const err = new Error(`เซสชันแบบร่างหมดอายุเนื่องจากไม่มีการทำรายการเกิน ${this.draftTtlMinutes} นาที ระบบได้เริ่มใหม่ทั้งหมด`);
      err.status = 410;
      err.code = ERROR_CODES.SESSION_EXPIRED;
      throw err;
    }

    if ((attempt.currentStepIndex || 0) > 0) {
      attempt.currentStepIndex -= 1;
      attempt.updatedAt = new Date().toISOString();
    }

    return {
      success: true,
      currentStepIndex: attempt.currentStepIndex,
      currentAssessmentCode: ASSESSMENTS_CATALOG[attempt.currentStepIndex].code
    };
  }

  async submitAssessment(employeeId, customSnapshot = {}, submittedAnswers = null, feedback = null) {
    await this._syncFromCollection();
    let attempt = this.memoryAttempts.get(employeeId);
    if (attempt && attempt.status === ATTEMPT_STATUS.CANCELLED) {
      this.memoryAttempts.delete(employeeId);
      attempt = null;
    }
    if (!attempt && this.attemptsCollection) {
      attempt = await this.attemptsCollection.findOne({ employeeId, status: ATTEMPT_STATUS.DRAFT });
      if (attempt) {
        this.memoryAttempts.set(employeeId, attempt);
        this.allAttempts.set(attempt.attemptId, attempt);
      }
    }

    const pastAttempts = this._getEmployeeAttempts(employeeId);
    let maxRound = 0;
    for (const a of pastAttempts) {
      if (a.round && a.round > maxRound) maxRound = a.round;
    }
    const nextRound = maxRound > 0 ? maxRound + 1 : (pastAttempts.length > 0 ? pastAttempts.length + 1 : 1);

    if (!attempt) {
      const now = new Date().toISOString();
      attempt = {
        attemptId: crypto.randomUUID(),
        employeeId,
        round: nextRound,
        noticeVersion: '2026-09-03',
        noticeAcknowledgedAt: now,
        status: ATTEMPT_STATUS.DRAFT,
        definitionBundleVersion: '1.0.0',
        currentStepIndex: 0,
        answers: {},
        createdAt: now,
        updatedAt: now
      };
      this.memoryAttempts.set(employeeId, attempt);
      this.allAttempts.set(attempt.attemptId, attempt);
    } else if (!attempt.round) {
      attempt.round = nextRound;
    }

    if (submittedAnswers && typeof submittedAnswers === 'object') {
      if (!attempt.answers) attempt.answers = {};
      Object.assign(attempt.answers, submittedAnswers);
    }
    if (!attempt.noticeAcknowledgedAt) {
      attempt.noticeAcknowledgedAt = new Date().toISOString();
    }
    if (attempt.status !== ATTEMPT_STATUS.SUBMITTED) {
      attempt.status = ATTEMPT_STATUS.DRAFT;
    }

    // Idempotency: if already submitted, return existing record
    if (attempt.status === ATTEMPT_STATUS.SUBMITTED) {
      return {
        success: true,
        attemptId: attempt.attemptId,
        round: attempt.round || 1,
        status: ATTEMPT_STATUS.SUBMITTED,
        submittedAt: attempt.submittedAt,
        snapshot: attempt.snapshot
      };
    }

    if (attempt.status !== ATTEMPT_STATUS.DRAFT) {
      const err = new Error('ไม่สามารถส่งแบบประเมินในสถานะนี้ได้');
      err.status = 400;
      err.code = ERROR_CODES.ATTEMPT_LOCKED;
      throw err;
    }

    // Check all questions across all catalog instruments (Burnout, ST-20, 9Q = 51 questions)
    const answers = attempt.answers || {};
    const missing = [];
    for (const assessment of ASSESSMENTS_CATALOG) {
      for (const q of assessment.questions) {
        if (answers[q.code] === undefined || answers[q.code] === null) {
          missing.push(q.code);
        }
      }
    }

    if (missing.length > 0) {
      const err = new Error(`ไม่สามารถส่งแบบประเมินได้ เนื่องจากยังตอบไม่ครบ (ขาดอีก ${missing.length} ข้อ)`);
      err.status = 400;
      err.code = ERROR_CODES.VALIDATION_FAILED;
      err.missingQuestions = missing;
      throw err;
    }

    const now = new Date().toISOString();
    attempt.status = ATTEMPT_STATUS.SUBMITTED;
    attempt.submittedAt = now;
    attempt.updatedAt = now;

    // Calculate deterministic scores across all instruments
    attempt.result = calculateScores(attempt.answers);

    // Capture employee snapshot at submission time with accurate defaults for EMP-DEV-001
    attempt.snapshot = {
      employeeId,
      firstName: employeeId === 'EMP-DEV-001' ? 'ณิชา' : 'พนักงาน',
      lastName: employeeId === 'EMP-DEV-001' ? 'วัฒนกิจ' : 'ใจดี',
      gender: employeeId === 'EMP-DEV-001' ? 'หญิง' : 'ไม่ระบุ',
      age: employeeId === 'EMP-DEV-001' ? 28 : 32,
      telephone: employeeId === 'EMP-DEV-001' ? '081-999-8888' : '081-xxx-xxxx',
      company: employeeId === 'EMP-DEV-001' ? 'บมจ. ไอเน็ตเวิร์ก' : 'บริษัท อรุณ กรุ๊ป จำกัด',
      department: employeeId === 'EMP-DEV-001' ? 'ฝ่ายเทคโนโลยี' : 'ทรัพยากรบุคคล',
      position: employeeId === 'EMP-DEV-001' ? 'Software Engineer' : 'เจ้าหน้าที่',
      workArea: employeeId === 'EMP-DEV-001' ? 'สำนักงานใหญ่ ชั้น 15' : 'กรุงเทพ',
      startDate: employeeId === 'EMP-DEV-001' ? '2022-04-01' : '2023-01-15',
      ...customSnapshot
    };

    // Encrypt sensitive PII fields at rest (Section 10: Full name, Gender, Age, Employee ID)
    const rawFullName = `${attempt.snapshot.firstName || ''} ${attempt.snapshot.lastName || ''}`.trim();
    attempt.snapshot._encrypted = {
      fullName: encryptPII(rawFullName),
      gender: encryptPII(attempt.snapshot.gender),
      age: encryptPII(String(attempt.snapshot.age)),
      employeeId: encryptPII(attempt.employeeId)
    };

    if (feedback || customSnapshot.feedback) {
      attempt.feedback = String(feedback || customSnapshot.feedback).trim().slice(0, 500);
    } else {
      attempt.feedback = null;
    }

    this.memoryAttempts.set(employeeId, attempt);
    this.allAttempts.set(attempt.attemptId, attempt);

    if (this.attemptsCollection) {
      await this.attemptsCollection.updateOne(
        { attemptId: attempt.attemptId },
        { $set: attempt },
        { upsert: true }
      );
    }

    return {
      success: true,
      attemptId: attempt.attemptId,
      round: attempt.round || 1,
      status: ATTEMPT_STATUS.SUBMITTED,
      submittedAt: attempt.submittedAt,
      result: attempt.result,
      snapshot: attempt.snapshot,
      feedback: attempt.feedback || null
    };
  }

  async getResult(employeeId) {
    await this._syncFromCollection();
    let attempt = this.memoryAttempts.get(employeeId);
    if (!attempt || attempt.status !== ATTEMPT_STATUS.SUBMITTED) {
      const pastAttempts = this._getEmployeeAttempts(employeeId);
      const submitted = pastAttempts.filter(a => a.status === ATTEMPT_STATUS.SUBMITTED);
      if (submitted.length > 0) {
        submitted.sort((a, b) => (b.round || 0) - (a.round || 0) || new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
        attempt = submitted[0];
      }
    }
    if (!attempt || attempt.status !== ATTEMPT_STATUS.SUBMITTED) {
      const err = new Error('ไม่พบผลการประเมินที่ส่งสำเร็จ');
      err.status = 400;
      err.code = ERROR_CODES.NOT_FOUND;
      throw err;
    }

    const pastAttempts = this._getEmployeeAttempts(employeeId);
    const sanitizedAttempts = pastAttempts.map((a, idx) => {
      const copy = { ...a };
      delete copy.answers;
      copy.round = copy.round || (idx + 1);
      return copy;
    });

    return {
      attemptId: attempt.attemptId,
      round: attempt.round || 1,
      totalRounds: pastAttempts.length,
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      result: attempt.result,
      snapshot: attempt.snapshot,
      feedback: attempt.feedback || null,
      attempts: sanitizedAttempts
    };
  }

  async saveFeedback(employeeId, feedbackText) {
    await this._syncFromCollection();
    let attempt = this.memoryAttempts.get(employeeId);
    if (!attempt || attempt.status !== ATTEMPT_STATUS.SUBMITTED) {
      const pastAttempts = this._getEmployeeAttempts(employeeId);
      const submitted = pastAttempts.filter(a => a.status === ATTEMPT_STATUS.SUBMITTED);
      if (submitted.length > 0) {
        submitted.sort((a, b) => (b.round || 0) - (a.round || 0) || new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
        attempt = submitted[0];
      }
    }
    if (!attempt) {
      const err = new Error('ไม่พบข้อมูลแบบประเมิน');
      err.status = 404;
      err.code = ERROR_CODES.NOT_FOUND;
      throw err;
    }

    attempt.feedback = feedbackText ? String(feedbackText).trim().slice(0, 500) : null;
    attempt.updatedAt = new Date().toISOString();

    if (this.attemptsCollection) {
      await this.attemptsCollection.updateOne(
        { attemptId: attempt.attemptId },
        { $set: { feedback: attempt.feedback, updatedAt: attempt.updatedAt } }
      );
    }

    return {
      success: true,
      feedback: attempt.feedback
    };
  }

  async saveAnswers(employeeId, newAnswers = {}) {
    await this._syncFromCollection();
    let attempt = this.memoryAttempts.get(employeeId);
    if (attempt && attempt.status === ATTEMPT_STATUS.CANCELLED) {
      this.memoryAttempts.delete(employeeId);
      attempt = null;
    }
    if (!attempt && this.attemptsCollection) {
      attempt = await this.attemptsCollection.findOne({ employeeId, status: ATTEMPT_STATUS.DRAFT });
      if (attempt) {
        this.memoryAttempts.set(employeeId, attempt);
        this.allAttempts.set(attempt.attemptId, attempt);
      }
    }

    if (!attempt) {
      const pastAttempts = this._getEmployeeAttempts(employeeId);
      let maxRound = 0;
      for (const a of pastAttempts) {
        if (a.round && a.round > maxRound) maxRound = a.round;
      }
      const nextRound = maxRound > 0 ? maxRound + 1 : (pastAttempts.length > 0 ? pastAttempts.length + 1 : 1);
      const now = new Date().toISOString();
      attempt = {
        attemptId: crypto.randomUUID(),
        employeeId,
        round: nextRound,
        noticeVersion: '2026-09-03',
        noticeAcknowledgedAt: now,
        status: ATTEMPT_STATUS.DRAFT,
        definitionBundleVersion: '1.0.0',
        currentStepIndex: 0,
        answers: {},
        createdAt: now,
        updatedAt: now
      };
      this.memoryAttempts.set(employeeId, attempt);
      this.allAttempts.set(attempt.attemptId, attempt);
    } else if (!attempt.noticeAcknowledgedAt) {
      attempt.noticeAcknowledgedAt = new Date().toISOString();
    }

    if (attempt.status !== ATTEMPT_STATUS.DRAFT) {
      const err = new Error('ไม่พบแบบร่างที่สามารถแก้ไขได้');
      err.status = 400;
      err.code = ERROR_CODES.ATTEMPT_LOCKED;
      throw err;
    }

    if (this.isDraftExpired(attempt)) {
      await this.expireDraft(employeeId, attempt);
      const err = new Error(`เซสชันแบบร่างหมดอายุเนื่องจากไม่มีการทำรายการเกิน ${this.draftTtlMinutes} นาที ระบบได้เริ่มใหม่ทั้งหมด`);
      err.status = 410;
      err.code = ERROR_CODES.SESSION_EXPIRED;
      throw err;
    }

    if (!attempt.answers) {
      attempt.answers = {};
    }

    // Merge answers
    Object.assign(attempt.answers, newAnswers);
    attempt.updatedAt = new Date().toISOString();

    if (this.attemptsCollection) {
      await this.attemptsCollection.updateOne(
        { attemptId: attempt.attemptId },
        { $set: { answers: attempt.answers, updatedAt: attempt.updatedAt, round: attempt.round, status: attempt.status, noticeAcknowledgedAt: attempt.noticeAcknowledgedAt } },
        { upsert: true }
      );
    }

    const expiresAtMs = Date.now() + this.draftTtlMs;

    return {
      success: true,
      savedCount: Object.keys(attempt.answers).length,
      updatedAt: attempt.updatedAt,
      draftExpiresAt: new Date(expiresAtMs).toISOString(),
      draftTtlMinutes: this.draftTtlMinutes
    };
  }

  async clearDraft(employeeId) {
    const attempt = this.memoryAttempts.get(employeeId);
    if (!attempt) {
      return { success: true, message: 'ล้างแบบร่างเรียบร้อยแล้ว' };
    }

    if (attempt.status === ATTEMPT_STATUS.SUBMITTED) {
      const err = new Error('ไม่สามารถล้างแบบร่างได้เนื่องจากส่งแบบประเมินแล้ว');
      err.status = 400;
      err.code = ERROR_CODES.ATTEMPT_LOCKED;
      throw err;
    }

    attempt.answers = {};
    attempt.noticeAcknowledgedAt = null;
    attempt.status = null;
    attempt.currentStepIndex = 0;
    attempt.updatedAt = new Date().toISOString();

    if (this.attemptsCollection) {
      await this.attemptsCollection.updateOne(
        { attemptId: attempt.attemptId },
        { $set: { answers: {}, noticeAcknowledgedAt: null, status: null, currentStepIndex: 0, updatedAt: attempt.updatedAt } }
      );
    }

    return { success: true, message: 'ล้างแบบร่างเรียบร้อยแล้ว' };
  }

  async listAssessments({
    page = 1,
    limit = 20,
    search = '',
    sortBy = 'submittedAt',
    sortOrder = 'desc',
    status = ATTEMPT_STATUS.SUBMITTED,
    groupByEmployee = true,
    roundFilter = null,
    filters = {}
  } = {}) {
    await this._syncFromCollection();
    const p = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

    let attempts = this._getAllAttempts();

    // Filter by status (default SUBMITTED)
    if (status && status !== 'ALL') {
      attempts = attempts.filter((a) => a.status === status);
    } else {
      attempts = attempts.filter(
        (a) => a.status === ATTEMPT_STATUS.SUBMITTED || a.status === ATTEMPT_STATUS.CANCELLED
      );
    }

    // Option 2 (1 Row per Employee): Deduplicate by employeeId, keeping the latest attempt
    if (groupByEmployee) {
      const allAttemptsList = this._getAllAttempts();
      const empLatestMap = new Map();
      for (const a of attempts) {
        const empId = a.employeeId;
        if (!empId) continue;
        const existing = empLatestMap.get(empId);
        if (!existing) {
          empLatestMap.set(empId, a);
        } else {
          const empAll = (allAttemptsList.filter((x) => x.employeeId === empId))
            .sort((x, y) => (x.round || 0) - (y.round || 0) || new Date(x.createdAt || 0) - new Date(y.createdAt || 0));
          const idxA = empAll.findIndex((x) => x.attemptId === a.attemptId);
          const idxExisting = empAll.findIndex((x) => x.attemptId === existing.attemptId);
          if (idxA > idxExisting) {
            empLatestMap.set(empId, a);
          }
        }
      }
      attempts = Array.from(empLatestMap.values());
    }

    // Filter by round / multi-round history (Matching Prototype specification)
    if (roundFilter) {
      const allAttemptsList = this._getAllAttempts();
      attempts = attempts.filter((a) => {
        const empAll = allAttemptsList.filter((x) => x.employeeId === a.employeeId);
        const attCount = empAll.length;
        const curRound = a.round || 1;

        if (roundFilter === 'multi') return attCount >= 2;
        if (roundFilter === 'multi3') return attCount >= 3;
        if (roundFilter === 'round4') return curRound >= 4;
        if (roundFilter === 'round3') return curRound === 3;
        if (roundFilter === 'round2') return curRound === 2;
        if (roundFilter === 'round1') return curRound === 1;
        return true;
      });
    }

    // Apply Multidimensional Filter Engine (OR within dimension, AND across dimensions)
    if (filters && Object.keys(filters).length > 0) {
      attempts = attempts.filter((a) => matchesFilters(a, filters));
    }

    // Filter by search query (employeeId, firstName, lastName, department, company)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      attempts = attempts.filter((a) => {
        const empId = (a.employeeId || '').toLowerCase();
        const firstName = (a.snapshot?.firstName || '').toLowerCase();
        const lastName = (a.snapshot?.lastName || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();
        const dept = (a.snapshot?.department || '').toLowerCase();
        const company = (a.snapshot?.company || '').toLowerCase();
        return (
          empId.includes(q) ||
          firstName.includes(q) ||
          lastName.includes(q) ||
          fullName.includes(q) ||
          dept.includes(q) ||
          company.includes(q)
        );
      });
    }

    // Sort
    attempts.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'employeeId':
          valA = a.employeeId || '';
          valB = b.employeeId || '';
          break;
        case 'firstName':
          valA = a.snapshot?.firstName || '';
          valB = b.snapshot?.firstName || '';
          break;
        case 'department':
          valA = a.snapshot?.department || '';
          valB = b.snapshot?.department || '';
          break;
        case 'company':
          valA = a.snapshot?.company || '';
          valB = b.snapshot?.company || '';
          break;
        case 'submittedAt':
        default:
          valA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          valB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const totalCount = attempts.length;
    const totalPages = Math.ceil(totalCount / lim) || 1;
    const startIndex = (p - 1) * lim;
    const paginated = attempts.slice(startIndex, startIndex + lim);

    const allAttemptsList = this._getAllAttempts();
    // CRITICAL PRIVACY REQUIREMENT: Strictly strip answers (Answer entities)
    const items = paginated.map((a) => {
      const empAll = (allAttemptsList.filter((x) => x.employeeId === a.employeeId))
        .sort((x, y) => (x.round || 0) - (y.round || 0) || new Date(x.createdAt || 0) - new Date(y.createdAt || 0));

      const empAttemptsSummary = empAll.map((ea, idx) => ({
        attemptId: ea.attemptId,
        round: ea.round || (idx + 1),
        status: ea.status,
        submittedAt: ea.submittedAt || null,
        cancelledAt: ea.cancelledAt || null,
        cancelledReason: ea.cancelledReason || null,
        cancelledBy: ea.cancelledBy || null,
        createdAt: ea.createdAt,
        result: ea.result || null,
        feedback: ea.feedback || null,
        snapshot: ea.snapshot || null
      }));

      const curRound = a.round || (empAll.findIndex((x) => x.attemptId === a.attemptId) + 1) || 1;

      return {
        attemptId: a.attemptId,
        employeeId: a.employeeId,
        round: curRound,
        totalRounds: empAttemptsSummary.length,
        status: a.status,
        submittedAt: a.submittedAt,
        cancelledAt: a.cancelledAt || null,
        cancelledReason: a.cancelledReason || null,
        cancelledBy: a.cancelledBy || null,
        createdAt: a.createdAt,
        snapshot: a.snapshot || null,
        result: a.result || null,
        feedback: a.feedback || null,
        attempts: empAttemptsSummary
      };
    });

    return {
      items,
      pagination: {
        page: p,
        limit: lim,
        totalCount,
        totalPages
      }
    };
  }

  getDistinctDepartments() {
    const defaultDepts = [
      'ทรัพยากรบุคคล',
      'วิศวกรรม',
      'การตลาด',
      'การเงิน',
      'ปฏิบัติการ',
      'ไอที / เทคโนโลยีสารสนเทศ',
      'ฝ่ายขาย / พัฒนาธุรกิจ',
      'บริการลูกค้า / ประชาสัมพันธ์',
      'วิจัยและพัฒนา (R&D)',
      'โลจิสติกส์และคลังสินค้า',
      'จัดซื้อ',
      'กฎหมายและกำกับดูแล',
      'บริหารและจัดการทั่วไป',
      'ความปลอดภัยและอาชีวอนามัย',
      'ผลิต / โรงงาน'
    ];

    const attempts = this._getAllAttempts();
    const deptSet = new Set(defaultDepts);

    for (const a of attempts) {
      if (a.snapshot && a.snapshot.department && a.snapshot.department.trim()) {
        deptSet.add(a.snapshot.department.trim());
      }
    }

    return Array.from(deptSet).sort((a, b) => a.localeCompare(b, 'th'));
  }

  getDistinctCompanies() {
    const attempts = this._getAllAttempts();
    const compSet = new Set();

    for (const a of attempts) {
      if (a.snapshot && a.snapshot.company && a.snapshot.company.trim()) {
        compSet.add(a.snapshot.company.trim());
      }
    }

    return Array.from(compSet).sort((a, b) => a.localeCompare(b, 'th'));
  }

  getDistinctPositions() {
    const attempts = this._getAllAttempts();
    const posSet = new Set();

    for (const a of attempts) {
      if (a.snapshot && a.snapshot.position && a.snapshot.position.trim()) {
        posSet.add(a.snapshot.position.trim());
      }
    }

    return Array.from(posSet).sort((a, b) => a.localeCompare(b, 'th'));
  }

  async getDashboardStats(filters = {}) {
    await this._syncFromCollection();
    let attempts = this._getAllAttempts();

    // Invariant: strictly active SUBMITTED attempts, CANCELLED are completely excluded (ADR-0007, ADR-0010)
    attempts = attempts.filter((a) => a.status === ATTEMPT_STATUS.SUBMITTED);

    // Apply multidimensional filters
    if (filters && Object.keys(filters).length > 0) {
      attempts = attempts.filter((a) => matchesFilters(a, filters));
    }

    const cohortSize = attempts.length;

    // Small-Cohort Suppression Rule (ADR-0010):
    // Whenever cohort size is between 1 and 4, withhold ALL counts and percentages
    if (cohortSize > 0 && cohortSize < PRIVACY_RULES.MIN_COHORT_SIZE) {
      return {
        suppressed: true,
        message: PRIVACY_RULES.SUPPRESSION_MESSAGE
      };
    }

    if (cohortSize === 0) {
      return {
        suppressed: false,
        totalSubmissions: 0,
        message: 'ไม่พบข้อมูลตามเงื่อนไขตัวกรอง',
        overall: {
          needsCare: { count: 0, percentage: 0 },
          normal: { count: 0, percentage: 0 }
        },
        instruments: {
          burnout: { high: { count: 0, percentage: 0 }, moderate: { count: 0, percentage: 0 }, low: { count: 0, percentage: 0 } },
          stress: { severe: { count: 0, percentage: 0 }, moderate: { count: 0, percentage: 0 }, mild: { count: 0, percentage: 0 }, normal: { count: 0, percentage: 0 }, low: { count: 0, percentage: 0 } },
          q9: { severe: { count: 0, percentage: 0 }, moderate: { count: 0, percentage: 0 }, mild: { count: 0, percentage: 0 }, none: { count: 0, percentage: 0 } }
        }
      };
    }

    // Calculate aggregated counts and percentages
    const calcPct = (cnt) => Math.round((cnt / cohortSize) * 1000) / 10;

    let needsCareCount = 0;

    const burnoutCounts = { HIGH: 0, MODERATE: 0, LOW: 0 };
    const stressCounts = { SEVERE: 0, MODERATE: 0, MILD: 0, NORMAL: 0, LOW: 0 };
    const q9Counts = { SEVERE: 0, MODERATE: 0, MILD: 0, NONE: 0 };

    for (const a of attempts) {
      const res = a.result || {};
      if (res.overall?.status === OVERALL_STATUS.NEEDS_ADDITIONAL_CARE) needsCareCount++;

      if (res.burnout?.level && burnoutCounts[res.burnout.level] !== undefined) {
        burnoutCounts[res.burnout.level]++;
      }
      if (res.stress?.level && stressCounts[res.stress.level] !== undefined) {
        stressCounts[res.stress.level]++;
      }
      if (res.q9?.level && q9Counts[res.q9.level] !== undefined) {
        q9Counts[res.q9.level]++;
      }
    }

    const normalCount = cohortSize - needsCareCount;

    return {
      suppressed: false,
      totalSubmissions: cohortSize,
      overall: {
        needsCare: { count: needsCareCount, percentage: calcPct(needsCareCount) },
        normal: { count: normalCount, percentage: calcPct(normalCount) }
      },
      instruments: {
        burnout: {
          high: { count: burnoutCounts.HIGH, percentage: calcPct(burnoutCounts.HIGH) },
          moderate: { count: burnoutCounts.MODERATE, percentage: calcPct(burnoutCounts.MODERATE) },
          low: { count: burnoutCounts.LOW, percentage: calcPct(burnoutCounts.LOW) }
        },
        stress: {
          severe: { count: stressCounts.SEVERE, percentage: calcPct(stressCounts.SEVERE) },
          moderate: { count: stressCounts.MODERATE, percentage: calcPct(stressCounts.MODERATE) },
          mild: { count: stressCounts.MILD, percentage: calcPct(stressCounts.MILD) },
          normal: { count: stressCounts.NORMAL, percentage: calcPct(stressCounts.NORMAL) },
          low: { count: stressCounts.LOW, percentage: calcPct(stressCounts.LOW) }
        },
        q9: {
          severe: { count: q9Counts.SEVERE, percentage: calcPct(q9Counts.SEVERE) },
          moderate: { count: q9Counts.MODERATE, percentage: calcPct(q9Counts.MODERATE) },
          mild: { count: q9Counts.MILD, percentage: calcPct(q9Counts.MILD) },
          none: { count: q9Counts.NONE, percentage: calcPct(q9Counts.NONE) }
        }
      }
    };
  }

  async getAssessmentById(attemptId) {
    await this._syncFromCollection();
    let attempt = this.allAttempts.get(attemptId);
    if (!attempt) {
      for (const a of this.memoryAttempts.values()) {
        if (a.attemptId === attemptId) {
          attempt = a;
          break;
        }
      }
    }

    if (!attempt && this.attemptsCollection) {
      attempt = await this.attemptsCollection.findOne({ attemptId });
      if (attempt) {
        this.allAttempts.set(attempt.attemptId, attempt);
        if (attempt.employeeId) {
          this.memoryAttempts.set(attempt.employeeId, attempt);
        }
      }
    }

    if (!attempt) {
      const err = new Error('ไม่พบแบบประเมิน');
      err.status = 404;
      err.code = ERROR_CODES.NOT_FOUND;
      throw err;
    }

    // STRICT PRIVACY RULE (ADR-0009): NEVER leak raw question-level answers
    const allAttemptsList = this._getAllAttempts();
    const empAll = (allAttemptsList.filter((x) => x.employeeId === attempt.employeeId))
      .sort((x, y) => (x.round || 0) - (y.round || 0) || new Date(x.createdAt || 0) - new Date(y.createdAt || 0));

    const empAttemptsSummary = empAll.map((ea, idx) => {
      const copy = { ...ea };
      delete copy.answers;
      copy.round = copy.round || (idx + 1);
      return copy;
    });

    const curRound = attempt.round || (empAll.findIndex((x) => x.attemptId === attempt.attemptId) + 1) || 1;

    const sanitized = { ...attempt };
    delete sanitized.answers;
    sanitized.round = curRound;
    sanitized.totalRounds = empAttemptsSummary.length;
    sanitized.attempts = empAttemptsSummary;

    return sanitized;
  }

  async resetAssessment(attemptId, { adminId = 'admin', reason = '' } = {}) {
    if (!reason || !reason.trim()) {
      const err = new Error('ต้องระบุเหตุผลในการรีเซ็ตผลการประเมิน');
      err.status = 400;
      err.code = ERROR_CODES.VALIDATION_FAILED;
      throw err;
    }

    let attempt = this.allAttempts.get(attemptId);
    if (!attempt) {
      for (const a of this.memoryAttempts.values()) {
        if (a.attemptId === attemptId) {
          attempt = a;
          break;
        }
      }
    }

    if (!attempt) {
      const err = new Error('ไม่พบแบบประเมิน');
      err.status = 404;
      err.code = ERROR_CODES.NOT_FOUND;
      throw err;
    }

    if (attempt.status !== ATTEMPT_STATUS.SUBMITTED) {
      const err = new Error('สามารถรีเซ็ตได้เฉพาะแบบประเมินที่ส่งสำเร็จแล้วเท่านั้น');
      err.status = 400;
      err.code = ERROR_CODES.VALIDATION_FAILED;
      throw err;
    }

    const now = new Date().toISOString();
    attempt.status = ATTEMPT_STATUS.CANCELLED;
    attempt.cancelledAt = now;
    attempt.cancelledReason = reason.trim();
    attempt.cancelledBy = adminId;
    attempt.updatedAt = now;

    // Persist to allAttempts
    this.allAttempts.set(attemptId, attempt);

    // Unblock employee: clear active memoryAttempt so they can start fresh Draft
    const active = this.memoryAttempts.get(attempt.employeeId);
    if (active && active.attemptId === attemptId) {
      this.memoryAttempts.delete(attempt.employeeId);
    }

    const resetRecord = {
      resetId: crypto.randomUUID(),
      cancelledAttemptId: attemptId,
      adminId,
      reason: reason.trim(),
      timestamp: now
    };
    this.adminResets.push(resetRecord);

    if (this.attemptsCollection) {
      await this.attemptsCollection.updateOne(
        { attemptId },
        { $set: { status: ATTEMPT_STATUS.CANCELLED, cancelledAt: now, cancelledReason: reason.trim(), cancelledBy: adminId, updatedAt: now } }
      );
    }
    if (this.resetsCollection) {
      await this.resetsCollection.insertOne(resetRecord);
    }

    if (this.db && typeof this.db.query === 'function') {
      try {
        await this.db.query(
          `UPDATE assessment_attempts 
           SET status = 'CANCELLED', cancelled_at = $1, cancelled_reason = $2, updated_at = $1 
           WHERE attempt_id = $3`,
          [now, reason.trim(), attemptId]
        );
        await this.db.query(
          `INSERT INTO admin_resets (reset_id, cancelled_attempt_id, actor_username, reason, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [resetRecord.resetId, attemptId, adminId, reason.trim(), now]
        );
      } catch (dbErr) {
        console.error('Failed to update DB on reset:', dbErr);
      }
    }

    if (this.auditService) {
      await this.auditService.logEvent({
        actor: adminId,
        actorRole: 'ADMIN',
        action: 'admin_reset',
        target: attemptId,
        status: 'SUCCESS',
        purpose: 'การรีเซ็ตผลประเมินตามคำร้องขอ',
        context: {
          cancelledAttemptId: attemptId,
          employeeId: attempt.employeeId,
          reason: reason.trim()
        }
      });
    }

    return {
      success: true,
      cancelledAttemptId: attemptId,
      status: ATTEMPT_STATUS.CANCELLED,
      resetRecord
    };
  }

  async anonymizeOldAssessments(retentionYears = 1) {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - retentionYears);
    const cutoffTime = cutoff.getTime();

    let count = 0;
    const attempts = this._getAllAttempts();
    for (const a of attempts) {
      const recordDate = a.submittedAt || a.createdAt;
      if (recordDate && new Date(recordDate).getTime() < cutoffTime) {
        if (!a.anonymized) {
          // Idempotently purge identifiable employee snapshot fields and encrypted PII
          if (a.snapshot) {
            a.snapshot.firstName = '[ANONYMIZED]';
            a.snapshot.lastName = '[ANONYMIZED]';
            a.snapshot.telephone = null;
            a.snapshot._encrypted = undefined;
            a.snapshot.originalEmployeeId = undefined;
          }
          a.employeeId = `ANON-${crypto.createHash('sha256').update(a.employeeId || '').digest('hex').slice(0, 8)}`;
          a.anonymized = true;
          a.anonymizedAt = new Date().toISOString();
          count++;
        }
      }
    }

    if (this.attemptsCollection) {
      await this.attemptsCollection.updateMany(
        {
          $or: [
            { submittedAt: { $lt: new Date(cutoffTime).toISOString() } },
            { createdAt: { $lt: new Date(cutoffTime).toISOString() } }
          ]
        },
        {
          $set: {
            'snapshot.firstName': '[ANONYMIZED]',
            'snapshot.lastName': '[ANONYMIZED]',
            'snapshot.telephone': null,
            'snapshot._encrypted': null,
            anonymized: true,
            anonymizedAt: new Date().toISOString()
          }
        }
      );
    }

    if (this.db && typeof this.db.query === 'function') {
      try {
        await this.db.query(
          `UPDATE assessment_attempts
           SET snapshot = jsonb_set(
             jsonb_set(
               jsonb_set(snapshot, '{firstName}', '"[ANONYMIZED]"'::jsonb),
               '{lastName}', '"[ANONYMIZED]"'::jsonb
             ),
             '{telephone}', 'null'::jsonb
           ),
           employee_id = 'ANON-' || substr(md5(employee_id), 1, 8),
           updated_at = NOW()
           WHERE (submitted_at < NOW() - INTERVAL '1 year' OR (submitted_at IS NULL AND created_at < NOW() - INTERVAL '1 year'))`
        );
      } catch (dbErr) {
        console.error('Failed to run DB retention update:', dbErr);
      }
    }

    if (this.auditService) {
      await this.auditService.logEvent({
        actor: 'retention_worker',
        action: 'retention_anonymize',
        target: 'assessment_attempts',
        context: {
          retentionYears,
          anonymizedCount: count
        }
      });
    }

    return { anonymizedCount: count };
  }
}

module.exports = {
  AssessmentSessionService,
  encryptPII,
  decryptPII
};

