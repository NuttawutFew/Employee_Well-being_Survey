# Spec: ระบบประเมินสุขภาพใจ (Mental Health Assessment System)

## Problem Statement

พนักงานในองค์กรอาจเผชิญกับความเครียด ภาวะหมดไฟในการทำงาน (Burnout) หรือความเสี่ยงด้านสุขภาพจิต เช่น โรคซึมเศร้าและความเสี่ยงในการทำร้ายตนเอง โดยที่ไม่มีเครื่องมือคัดกรองตนเอง (Self-assessment) ที่ได้มาตรฐาน น่าเชื่อถือ ปลอดภัย และเป็นความลับ ขณะเดียวกันฝ่ายบริหารทรัพยากรบุคคล (HR/Admin) ขาดข้อมูลภาพรวมสุขภาพจิตขององค์กรในเชิงสถิติเพื่อนำไปวางแผนนโยบายสนับสนุนและดูแลพนักงานได้อย่างตรงจุด โดยยังคงรักษาความเป็นส่วนตัวตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) อย่างเคร่งครัด

## Solution

พัฒนาระบบประเมินสุขภาพใจภายในองค์กรในรูปแบบ Modular Monolith ประกอบด้วย 2 เว็บแอปพลิเคชันแยกจากกันอย่างเด็ดขาด:
1. **Employee Assessment Web**: เว็บแอปพลิเคชันแบบ Mobile-first สำหรับพนักงานทุกคน ยืนยันตัวตนผ่าน OnePlatform SSO ทำแบบประเมินมาตรฐาน 5 ชุดตามลำดับตายตัว (Burnout, Stress, RQ, 9Q, 2Q Plus) พร้อมระบบบันทึกคำตอบอัตโนมัติ (Autosave) สามารถทำและส่งได้ 1 ครั้งตลอดอายุระบบ (เว้นแต่ได้รับการ Reset โดย Admin) เมื่อส่งแล้วจะแสดงผลลัพธ์รายชุดและสถานะภาพรวม พร้อมคำแนะนำที่ผ่านการอนุมัติจากผู้เชี่ยวชาญ
2. **Admin Web**: เว็บแอปพลิเคชันแบบ Desktop-first สำหรับ HR/Admin ยืนยันตัวตนด้วยบัญชี OneID และ map สิทธิ์ Admin ในระบบ (2FA อยู่นอก Scope ระยะแรก) สามารถดูตารางผลประเมินรายบุคคล (เห็นเฉพาะคะแนนและระดับผล มีการ Masking ชื่อ-นามสกุล และรหัสพนักงานบนหน้าจอรายงาน ไม่เห็นคำตอบรายข้อ), มีระบบตัวกรองหลายมิติ, มี Dashboard แสดงสถิติภาพรวมพร้อมกลไก Small-cohort suppression (ระงับการแสดงสถิติเมื่อกลุ่มตัวอย่างน้อยกว่า 5 คน เพื่อป้องกันการระบุตัวตน), ส่งออกรายงานเป็นไฟล์ Excel เท่านั้น (ต้องยืนยันรหัสผ่านบัญชีผู้ใช้ซ้ำก่อนดาวน์โหลด และบันทึก Audit Log ทุกครั้ง) และมีระบบ Admin Reset พร้อม Audit Trail ครบถ้วนทุก Event ของผู้ดูแลระบบ

---

## User Stories

1. As an employee, I want to authenticate seamlessly via OnePlatform SSO using my `shareToken`, so that I can access the assessment without creating or remembering a separate password.
2. As an employee, I want to see a clear pre-assessment notice before beginning, so that I understand the screening purpose, the 5 assessments, PDPA data retention, and HR access boundaries.
3. As an employee, I want to explicitly click "รับทราบและเริ่มทำแบบประเมิน" on the notice page, so that my assessment draft is initialized only after I have given informed acknowledgment.
4. As an employee, I want my active draft to automatically restore my progress if I close the browser or if my session expires, so that I do not lose previously selected answers.
5. As an employee, I want the option to clear my active draft and restart from the beginning before submission, so that I can re-evaluate my answers from scratch if desired.
6. As an employee, I want to complete the assessments in a fixed, clinically sequential order (Burnout → Stress → RQ → 9Q → 2Q Plus), so that I undergo screening in the validated sequence without skipping steps.
7. As an employee, I want all questions of an assessment displayed on a single page (5 pages in total), so that I can see the assessment context clearly and navigate smoothly.
8. As an employee, I want each answer selection to be autosaved immediately to the server, so that my progress is continuously persisted against network or device disruptions.
9. As an employee, I want immediate visual feedback and a retry mechanism if an autosave operation fails, so that I am aware of unsaved changes and can trigger a save manually.
10. As an employee, I want the form to validate that all required questions on the current page are answered before allowing me to proceed to the next assessment, so that incomplete datasets cannot be submitted.
11. As an employee, I want the interface to scroll to and focus on the first unanswered question with an inline error message when validation fails, so that I can immediately fix missed questions.
12. As an employee, I want to be able to navigate back to previous assessment pages to review or modify my answers while in draft status, so that I can adjust responses before final submission.
13. As an employee, I want a final confirmation dialog upon completing the 5th assessment (2Q Plus), so that I can choose to either double-check my answers or proceed with permanent submission.
14. As an employee, I want the submission operation to be atomic and idempotent, so that duplicate button presses or network retries do not produce corrupted or duplicated records.
15. As an employee, I want my submitted answers and calculated scores to become immutable, so that my submitted record is permanently protected from accidental modification.
16. As an employee, I want to see my overall mental health status on the summary page, so that I immediately understand whether my overall state is normal or whether I should seek additional care.
17. As an employee, I want to see individual result cards for all 5 assessments displaying raw scores, evaluated levels, descriptions, and expert-approved recommendations, so that I gain actionable personal insights.
18. As an employee, I want my Burnout results displayed across all 3 dimensions (Emotional Exhaustion, Depersonalization, Personal Accomplishment), so that I can distinguish emotional fatigue from personal efficacy.
19. As an employee, I want my RQ results displayed across all 3 dimensions and total score, so that I understand my emotional stability, morale, and problem-solving resilience.
20. As an employee, I want my 2Q Plus results separated into Depression Risk and Suicide Risk, so that distinct mental health flags are not conflated.
21. As an employee with positive suicide risk (Question 3 of 2Q Plus = "มี"), I want the suicide risk message to take top visual priority on my summary page, so that critical support information is immediately prominent.
22. As an employee who has already submitted, I want any subsequent logins to redirect me directly to my result summary page, so that I can review my results without being able to submit duplicate attempts.
23. As an employee, I want the web interface to be responsive, mobile-first, and compliant with WCAG 2.1 AA standards, so that I can complete the assessment comfortably on any smartphone, tablet, or PC using touch or screen readers.
24. As an Admin/HR user, I want to log in to a dedicated Admin Web application using my corporate OneID account mapped to the Admin role in the system (with 2FA out of scope for Phase 1), so that administrative access is secured and tied to my verified corporate identity.
25. As an Admin/HR user, I want to view a paginated, searchable, and sortable table of all submitted employee assessments with employee names and employee IDs masked on screen (e.g. “นายสมXXXX ทำXXXX” and “INET99XXXXXX55”), so that individual privacy is safeguarded while inspecting score levels and snapshots.
26. As an Admin/HR user, I want employee demographic details captured as an immutable Employee Snapshot at the moment of submission, so that historical reports remain stable even if employee profiles change in OnePlatform later.
27. As an Admin/HR user, I want to search individual records by employee ID or employee name, so that I can quickly verify specific employee submissions.
28. As an Admin/HR user, I want multi-dimensional filters (date range, company, department, position, work area, gender, age range, tenure brackets, overall status, and specific assessment levels), so that I can analyze targeted employee segments.
29. As an Admin/HR user, I want filter logic to use OR within the same dimension and AND across different dimensions, so that filtering behavior is intuitive and powerful.
30. As an Admin/HR user, I want an aggregate dashboard displaying total submissions, counts/percentages of employees needing additional care, and level breakdowns per assessment, so that I can monitor organizational mental health trends.
31. As an Admin/HR user, I want the dashboard, APIs, and exports to automatically suppress statistics when the filtered cohort is fewer than 5 employees, so that sensitive individual health data cannot be deduced in small groups.
32. As an Admin/HR user, I want to export filtered assessment tables to Excel only (without question-level answers) and be required to re-enter my account password before downloading, so that sensitive health records cannot be exported without intentional confirmation and mandatory audit logging.
33. As an Admin/HR user, I want export download URLs to be short-lived and securely authenticated, so that exported health files cannot be accessed via shared or leaked links.
34. As an Admin/HR user, I want to perform an Admin Reset by providing a mandatory reason and confirmation, so that an employee who made an error can be granted permission to re-take the assessment.
35. As an Admin/HR user, I want any reset assessment attempt to be marked as Cancelled and excluded from active dashboards while maintaining an immutable audit log, so that organizational statistics remain accurate while preserving full historical accountability.
36. As a Data Protection Officer (DPO) / Auditor, I want all administrative events (logins, individual record views, data exports, resets, and all admin operations/events) logged in a tamper-resistant audit trail retained for 2 years, so that compliance with PDPA and security standards is verifiable.
37. As a Data Protection Officer (DPO), I want employee assessment records to be retained with identifiable snapshots for exactly 1 year and subsequently anonymized into non-identifiable statistical aggregates, so that corporate data retention policies are enforced.
38. As a Data Protection Officer (DPO), I want sensitive employee PII fields (Full Name, Gender, Age, and Employee ID) encrypted at rest in the database, so that confidential identity attributes remain secure against data exposure.

---

## Implementation Decisions

### 1. Modular Monolith Architecture (ADR-0030, ADR-0025)
- The codebase is structured as a Monorepo containing:
  - `apps/employee-web`: Vue 3 application, mobile-first, client-side routing, Pinia state, WCAG 2.1 AA compliant.
  - `apps/admin-web`: Vue 3 application, desktop-first responsive, role-based routing, server-driven table & chart states.
  - `apps/api`: Node.js modular monolith backend organized into bounded context modules:
    - `modules/employee-identity`: OnePlatform token verification, profile exchange, employee session management.
    - `modules/admin-identity`: OneID token verification / corporate admin mapping, session management, and password re-confirmation for export.
    - `modules/assessment-catalog`: Versioned assessment definitions (questions, options, localized text, scoring configurations).
    - `modules/assessment-session`: State machine managing Notice Acknowledgment, Drafts, Autosave, Submissions, and PII encryption at rest.
    - `modules/scoring`: Pure, deterministic calculation functions for Burnout, Stress, RQ, 9Q, and 2Q Plus.
    - `modules/results`: Result record creation, overall status determination, recommendation mapping.
    - `modules/reporting`: Filter engine, individual tabular queries with UI masking, dashboard aggregations, and small-cohort suppression.
    - `modules/export`: Ephemeral Excel-only generation with password confirmation and mandatory audit logging.
    - `modules/audit-retention`: Tamper-resistant audit logging for all admin operations/events, 1-year anonymization cron job, 2-year log retention.
  - `packages/shared-contracts`: Shared TypeScript types, Zod schemas, HTTP error contracts, and domain constants.
- **Database**: PostgreSQL as the single source of truth with foreign key constraints, row-level locking during submit, and index optimization for filter dimensions.
- **File/Export Storage**: S3-compatible object storage for ephemeral export artifacts with short TTL (e.g. 15 minutes).
- **Technology Constraints**: Cloud-agnostic containerized services (Docker). Domain logic has zero dependencies on specific cloud provider services, HTTP frameworks, or database drivers.

### 2. State Machine & Invariants (ADR-0007, ADR-0008, ADR-0009, ADR-0019)
- **AssessmentAttempt Lifecycle**:
  `Notice Acknowledged` → `Draft` → `Submitted`
  (Admin Reset: `Submitted` → `Cancelled` → new `Draft`)
- **Key Invariants**:
  - Each employee (`employeeId`) can have at most one active `Draft`.
  - Each employee can have at most one `Submitted` (and not `Cancelled`) attempt across the lifetime of the system.
  - Submitting an assessment locks all answers and creates the `EmployeeSnapshot` and `AssessmentResult` atomically in a single database transaction.
  - `Submitted` records cannot be updated or deleted by any user or administrator.
  - `Admin Reset` transitions an existing `Submitted` attempt to `Cancelled` with mandatory `actorId`, `timestamp`, and `reason`, enabling a new active `Draft` for that employee.
  - `Cancelled` attempts are excluded from Admin Dashboard aggregates and exports.

### 3. Assessment Catalog & Scoring Rules (ADR-0003, ADR-0006, ADR-0014, ADR-0015, ADR-0016)
- The 5 assessments are completed strictly in order:
  1. **Burnout (22 items)**:
     - 3 Dimensions: Emotional Exhaustion (EE, items 1, 2, 3, 6, 8, 13, 14, 16, 20), Depersonalization (DP, items 5, 10, 11, 15, 22), Personal Accomplishment (PA, items 4, 7, 9, 12, 17, 18, 19, 21).
     - Standard frequency scale 0–6 for negative items.
     - Inverted scoring 6–0 for positive PA items (4, 7, 9, 12, 17, 18, 19, 21) per ADR-0015 so that higher raw score uniformly represents higher burnout.
     - EE thresholds: Low 0–16, Moderate 17–26, High ≥ 27.
     - DP thresholds: Low 0–6, Moderate 7–12, High ≥ 13.
     - PA thresholds: Low (High Burnout) 39–48, Moderate 32–38, High (Low Burnout) 0–31.
  2. **Stress (20 items, max score 60)**:
     - 4-point scale (0–3).
     - Levels: 0–5 (น้อย/ปกติ), 6–17 (ปานกลาง), 18–25 (สูง), 26–29 (รุนแรง), 30–60 (รุนแรงมาก).
  3. **Resilience / RQ (20 items, max score 80)**:
     - Normal scoring items: 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 17, 18, 19, 20.
     - Inverted scoring items: 1, 5, 14, 15, 16 (1↔4, 2↔3).
     - 3 Dimensions: Emotional Stability (`<27`, `27–34`, `>34`), Morale (`<14`, `14–19`, `>19`), Problem Solving (`<13`, `13–18`, `>18`). Total RQ: `<55` (ต่ำกว่าเกณฑ์ปกติ), `55–66` (เกณฑ์ปกติ), `>66` (สูงกว่าเกณฑ์ปกติ).
  4. **Depression / 9Q (9 items, max score 27)**:
     - 4-point scale (0–3).
     - Levels: `<7` (ไม่มี/น้อยมาก), `7–12` (น้อย), `13–18` (ปานกลาง), `≥19` (รุนแรง).
     - Item 9 contributes to total score only; it does not trigger a standalone suicide risk state.
  5. **Suicide Risk / 2Q Plus (3 items)**:
     - Two distinct outputs (ADR-0016):
       - Depression Risk: Positive if Question 1 or 2 is "มี".
       - Suicide Risk: Positive if Question 3 is "มี". Positive output is labeled "พบความเสี่ยงฆ่าตัวตาย" without arbitrary high/medium/low severity grading.
- **Overall Result Status (ADR-0013)**:
  - Categorized as "ควรได้รับการดูแลสุขภาพใจเพิ่มเติม" if any dimension criteria is met (Burnout moderate/high, Stress ≥ 18, RQ dimension below normal, 9Q ≥ 7, or 2Q Plus positive).
  - If 2Q Plus Question 3 is positive, "พบความเสี่ยงฆ่าตัวตาย" takes top communication precedence.

### 4. Admin Reporting & Privacy Rules (ADR-0005, ADR-0009, ADR-0010, ADR-0017)
- **Role Access Boundary**: Admin/HR users can see employee snapshots, overall status, assessment scores, and categorical levels. Admin/HR users CANNOT view individual question answers.
- **Filter Query Engine**:
  - Intra-dimension: Multiple selections within the same filter dimension use logical `OR`.
  - Inter-dimension: Combinations across different dimensions use logical `AND`.
  - Tenure brackets: `<1 ปี`, `1–3 ปี`, `3–5 ปี`, `>5 ปี`.
- **Small-Cohort Suppression (ADR-0010)**:
  - When a query for aggregate statistics returns a count of fewer than 5 submitted employees (`count < 5`), the backend responds with a suppressed payload:
  ```json
  {
    "suppressed": true,
    "reason": "SMALL_COHORT",
    "message": "ข้อมูลไม่เพียงพอสำหรับแสดงสถิติ"
  }
  ```
  - Both UI and export engines must render the suppression notice instead of revealing exact numbers or percentages.

### 5. Security, Retention & Auditing (ADR-0011, ADR-0018, ADR-0022, ADR-0023, ADR-0031)
- **Session Separation**: Employee and Admin sessions use separate cookies (`__Host-emp-session`, `__Host-admin-session`) with `Secure`, `HttpOnly`, `SameSite=Lax/Strict`.
- **Admin Identity & Password Confirmation**: Admin users log in with corporate OneID accounts mapped to Admin roles in the system (2FA out of scope for Phase 1). Exporting data requires re-entry of the account password before processing.
- **PII Encryption at Rest**: Sensitive employee demographic fields (Full Name, Gender, Age, and Employee ID) are encrypted at rest using AES-256-GCM.
- **UI Masking on Reports**: On report and tabular displays, Full Name and Employee ID are masked to prevent inadvertent visual leakage (e.g. `นายสมชาย ทำงานดี` → `นายสมXXXX ทำXXXX`, `INET9988776655` → `INET99XXXXXX55`).
- **Retention**:
  - Full identifiable assessment attempts (with encrypted `EmployeeSnapshot`) are stored for exactly 1 year from submission date.
  - Automated anonymization job strips `employeeId`, names, phone numbers, and fine-grained department data after 1 year, converting remaining data into non-identifiable statistical rows.
  - Audit logs are retained for 2 years, recording all administrative logins, views, exports, resets, and every operational event, while strictly never logging sensitive answers, passwords, or OnePlatform tokens.

---

## Testing Decisions

### 1. Definition of a Good Test
Tests must focus exclusively on **observable external behavior**, contracts, and state transitions, not internal implementation details or refactorable private functions:
- HTTP API tests verify request inputs, status codes, response bodies, header security, and database state invariants.
- Domain scoring tests verify that given specific answer permutations, the exact score, dimension breakdown, and risk categories match clinical standards.
- Tests must be deterministic, isolated, and run without external dependencies (OnePlatform is mocked via an adapter contract).

### 2. Tested Modules & Boundaries
1. **Scoring & Interpretation Engine (Unit / Seam 1 - Pure Domain)**:
   - Exhaustive golden test suites covering all 74 questions across the 5 assessments.
   - Threshold boundary tests for all scores: e.g. Stress at 5 vs 6, 17 vs 18, 25 vs 26, 29 vs 30; Burnout EE at 16 vs 17, 26 vs 27; RQ at 54 vs 55, 66 vs 67.
   - Inverted scoring verification for Burnout PA items (4, 7, 9, 12, 17, 18, 19, 21) and RQ items (1, 5, 14, 15, 16).
   - 2Q Plus two-output evaluation logic (Q1=มี/Q2=ไม่มี vs Q3=มี).
2. **Assessment Session & State Machine (Integration / Seam 2 - HTTP API)**:
   - Notice acknowledgment verification: cannot create draft without acknowledgment.
   - Autosave idempotency and state persistence.
   - Sequential page transition enforcement (cannot answer 9Q before Burnout).
   - Atomic submission transaction: ensures concurrent submit requests result in exactly one submitted record and snapshot.
   - Attempt immutability: verifying that PUT/POST to answers on a `Submitted` attempt returns 409/403.
   - Admin Reset: transitions attempt to `Cancelled`, records audit log with reason, and allows new employee draft creation.
3. **Reporting, Filters & Small-Cohort Suppression (Integration / Seam 2 - HTTP API)**:
   - Filter query tests for OR within dimension, AND across dimensions.
   - Suppression tests: verifying that queries matching 1, 2, 3, or 4 employees return `suppressed: true` without counts or percentages, while queries matching ≥ 5 return full metrics.
4. **Security, Authentication & Authorization**:
   - OnePlatform token verification and invalid token rejection.
   - Admin credential verification with Argon2id and lockout after repeated failed attempts.
   - Role boundaries: ensuring employee endpoints reject admin sessions and vice-versa.
   - Privacy test: ensuring GET employee results by admin never serializes individual answers.
5. **Accessibility & Responsive UI (E2E / Playwright)**:
   - Automated WCAG 2.1 AA audits on both Employee and Admin web applications.
   - Keyboard navigation verification: tab order, focus trap in modals, error summary focus scroll.

### 3. Prior Art in Codebase
- Accessibility test baselines recorded in `deliverables/_qa/qa-a11y-final.json`.
- UI interactions and data fields prototyped in `deliverables/HR-Requirement-Confirmation-Pack/02_Prototype/mental-health-ui-prototype.html`.
- Formal clinical scoring specifications documented across `docs/adr/0014-rq-scoring-corrections.md`, `0015-burnout-personal-accomplishment-scoring.md`, and `0016-two-output-model-for-2q-plus.md`.

---

## Out of Scope

1. **Annual Campaigns or Recurring Waves**: The system is designed strictly for a single assessment submission per employee lifetime (unless reset by Admin). Periodic assessment campaigns or scheduled re-assessments are not supported in v1 (ADR-0007).
2. **Microservices Architecture**: The system is implemented as a Modular Monolith in a single codebase with clean module boundaries; distributed microservices and event brokers are excluded (ADR-0030).
3. **Real-time Emergency Notifications**: The system provides screening insights only. There are no automated SMS, email alerts, or webhook triggers sent to HR or external emergency response teams upon detection of high risk or suicidal ideation (ADR-0029).
4. **Multi-language UI / Content**: The first release is exclusively in Thai. While catalog data models support localization codes, no additional languages are translated or supported in v1 (ADR-0020).
5. **Item-level Answer Visibility for Admin**: HR/Admin users cannot view individual question answers under any circumstance, either on the UI or via export files (ADR-0005, ADR-0017).
6. **Self-service Admin Account Management UI**: Admin accounts are provisioned and managed directly via backend administrative scripts by authorized technical personnel; there is no web UI for user self-registration or admin user management (ADR-0011).
7. **Longitudinal Individual Trend Charts**: There is no historical trend graphing for individual employees over time.

---

## Further Notes

1. **Production Quality & Clinical Sign-off Gates**:
   - Question texts, scoring algorithms, thresholds, and all recommendation copy must be formally reviewed and signed off by a licensed mental health professional prior to production deployment (`docs/content/recommendations-draft.md`).
   - The policy of not offering direct emergency contact options on the suicide risk result card must be re-evaluated and confirmed by clinical and legal stakeholders prior to public release.
2. **PDPA and Legal Compliance**:
   - The pre-assessment notice is an acknowledgment statement, not a substitute for corporate lawful basis under PDPA. Formal consent or employment contract basis must be ratified by corporate legal counsel.
3. **Capacity & Performance Targets**:
   - Target employee population: 5,000 employees.
   - Peak concurrent users: 500 active employees.
   - System Availability: 99.9%, RTO: 4 hours, RPO: 15 minutes.
