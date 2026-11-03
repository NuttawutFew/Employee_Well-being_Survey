export declare const ASSESSMENT_CODES: {
  readonly BURNOUT: 'burnout';
  readonly STRESS: 'stress';
  readonly RQ: 'rq';
  readonly Q9: '9q';
  readonly Q2PLUS: '2q_plus';
};

export declare const ATTEMPT_STATUS: {
  readonly NOTICE_ACKNOWLEDGED: 'NOTICE_ACKNOWLEDGED';
  readonly DRAFT: 'DRAFT';
  readonly SUBMITTED: 'SUBMITTED';
  readonly CANCELLED: 'CANCELLED';
};

export declare const OVERALL_STATUS: {
  readonly NORMAL: 'NORMAL';
  readonly NEEDS_ADDITIONAL_CARE: 'NEEDS_ADDITIONAL_CARE';
};

export declare const Q2PLUS_FLAGS: {
  readonly DEPRESSION_RISK: 'DEPRESSION_RISK';
  readonly SUICIDE_RISK: 'SUICIDE_RISK';
};

export declare const PRIVACY_RULES: {
  readonly MIN_COHORT_SIZE: 5;
  readonly SUPPRESSION_MESSAGE: 'ข้อมูลไม่เพียงพอสำหรับแสดงสถิติ';
};

export declare const ERROR_CODES: {
  readonly UNAUTHORIZED: 'UNAUTHORIZED';
  readonly FORBIDDEN: 'FORBIDDEN';
  readonly NOT_FOUND: 'NOT_FOUND';
  readonly VALIDATION_FAILED: 'VALIDATION_FAILED';
  readonly ATTEMPT_LOCKED: 'ATTEMPT_LOCKED';
  readonly SINGLE_SUBMISSION_VIOLATION: 'SINGLE_SUBMISSION_VIOLATION';
  readonly SMALL_COHORT_SUPPRESSED: 'SMALL_COHORT_SUPPRESSED';
  readonly INTERNAL_ERROR: 'INTERNAL_ERROR';
};

export interface EmployeeProfile {
  employeeId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  age?: number;
  telephone?: string;
  company: string;
  department: string;
  position: string;
  workArea: string;
  startDate?: string;
}

export interface AssessmentAnswer {
  questionCode: string;
  optionCode: string | number;
}
