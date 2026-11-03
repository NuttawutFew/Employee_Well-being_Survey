# Project Implementation Progress: ระบบประเมินสุขภาพใจ (Mental Health Assessment System)

- **Tech Stack:**
  - Frontend: Vue 2
  - Backend: Node.js + Express
  - Database: PostgreSQL
- **Last Updated:** 2026-09-08
- **Current Status:** ✅ Fully Aligned with `User Journey ระบบตรวจสอบสุขภาพใจ.pdf` (24 Steps & 3 Distinct Swimlanes)

---

## Ticket Tracking Overview

| Ticket | Name | Status | Notes |
| :---: | :--- | :---: | :--- |
| **01** | [01-monorepo-baseline.md](docs/tasks/01-monorepo-baseline.md) | ✅ **Completed** | Monorepo scaffolding with Vue 2 + Express API + PostgreSQL compose & smoke tests |
| **02** | [02-employee-sso-auth.md](docs/tasks/02-employee-sso-auth.md) | ⏸️ **Skipped** | รอข้อมูล OnePlatform จากทีม external (ข้ามตามคำสั่งผู้ใช้ โดยมี Mock Session สำหรับพัฒนา) |
| **03** | [03-pre-assessment-notice.md](docs/tasks/03-pre-assessment-notice.md) | ✅ **Completed** | Pre-assessment notice view + acknowledgment API + Draft initialization |
| **04** | [04-assessment-form-autosave.md](docs/tasks/04-assessment-form-autosave.md) | ✅ **Completed** | Assessment Catalog + Form Engine + Autosave debounced + Network retry |
| **05** | [05-sequential-assessment-flow.md](docs/tasks/05-sequential-assessment-flow.md) | ✅ **Completed** | 5 sequential assessments + Stepper UI + Client & Server validation + Scroll/focus to error |
| **06** | [06-submission-atomic-idempotent.md](docs/tasks/06-submission-atomic-idempotent.md) | ✅ **Completed** | Submission Confirmation Modal + Atomic Idempotent Submit + EmployeeSnapshot capture |
| **07** | [07-scoring-engine-results-summary.md](docs/tasks/07-scoring-engine-results-summary.md) | ✅ **Completed** | Scoring Engine ครบ 5 ชุด (Inverted Burnout/RQ, 2Q Plus 2 มิติ) + Result Summary View + Hotline Alert |
| **08** | [08-one-time-invariant-draft-mgmt.md](docs/tasks/08-one-time-invariant-draft-mgmt.md) | ✅ **Completed** | One-time invariant (PostgreSQL partial unique indexes + API checks) + Draft reset & wipe |
| **09** | [09-admin-internal-auth.md](docs/tasks/09-admin-internal-auth.md) | ✅ **Completed** | Admin Auth (Argon2id, Lockout 5 ครั้ง/15 นาที, HTTP-only cookie, Session Shell) |
| **10** | [10-admin-individual-results-table.md](docs/tasks/10-admin-individual-results-table.md) | ✅ **Completed** | Admin Individual Results Table + Search + Sort + Pagination + PDPA Non-disclosure of raw answers |
| **11** | [11-multidimensional-filter-engine.md](docs/tasks/11-multidimensional-filter-engine.md) | ✅ **Completed** | Multidimensional Filter Engine (OR ภายในมิติ, AND ข้ามมิติ, คำนวณอายุงาน, URL Query Sync) |
| **12** | [12-aggregate-dashboard-suppression.md](docs/tasks/12-aggregate-dashboard-suppression.md) | ✅ **Completed** | Aggregate Dashboard + KPI Cards + Distribution Bars + Small-Cohort Suppression (n < 5) |
| **13** | [13-secure-admin-export.md](docs/tasks/13-secure-admin-export.md) | ✅ **Completed** | Secure Admin Export (Excel Only, Re-enter Password Confirmation, No Raw Answers, Expiring Links, Warning Banner, Audit Trail) |
| **14** | [14-admin-reset-workflow.md](docs/tasks/14-admin-reset-workflow.md) | ✅ **Completed** | Admin Reset Workflow + Reason Validation + Attempt Invalidation (CANCELLED) + Employee Unblocking |
| **15** | [15-audit-logging-data-retention.md](docs/tasks/15-audit-logging-data-retention.md) | ✅ **Completed** | 2-year Audit Trail & Comprehensive Admin Activity Log Store + 1-year Idempotent Data Retention Anonymization Worker |

---

## Detailed Log

### 2026-09-05
- **Setup Environment:** ติดตั้ง Node.js LTS (v24.19.0) และ npm (v11.17.0)
- **Ticket 01 (Monorepo Baseline) [COMPLETED]:**
  - จัดโครงสร้าง Monorepo ด้วย npm workspaces: `apps/api` (Express), `apps/employee-web` (Vue 2 + Vite), `apps/admin-web` (Vue 2 + Vite), และ `packages/shared-contracts`
  - สร้าง `docker-compose.yml` สำหรับ PostgreSQL และ backend service
  - สร้าง Health Check API (`/api/health`) และ automated test ผ่าน 100%
  - สร้างหน้า Frontend ต้นแบบ Vue 2 ทั้งสองเว็บ และผ่านการ build ทดสอบเรียบร้อย
- **Ticket 02 (Employee SSO Auth) [SKIPPED]:**
  - ข้ามตามคำสั่งของผู้ใช้ (เนื่องจากยังไม่มีข้อมูลสเปกจาก OnePlatform)
  - กำหนดให้ Ticket 03 สามารถทำงานต่อได้ผ่าน Mock Employee Identity สำหรับการพัฒนา
- **Ticket 03 (Pre-Assessment Notice & Draft) [COMPLETED]:**
  - สร้าง `AssessmentSessionService` ใน `apps/api/src/modules/assessment-session.js`
  - เพิ่ม API: `GET /api/assessment/session`, `POST /api/assessment/notice/acknowledge`, `GET /api/assessment/draft`, `POST /api/assessment/draft/clear`
  - ป้องกันการเข้าถึง Draft ก่อนกดยอมรับ Notice (HTTP 403)
  - สร้าง Vue 2 Component `NoticeView.vue` แสดงรายละเอียด PDPA, ขอบเขตการคัดกรอง, แบบประเมินทั้ง 5 ชุด และปุ่ม "รับทราบและเริ่มทำแบบประเมิน"
  - รองรับการล้างแบบร่างและเริ่มใหม่ (Clear Draft & Restart)
  - ทดสอบ TDD (`apps/api/tests/notice-draft.test.js`) และ build ทดสอบผ่าน 100%
- **Ticket 04 (Assessment Form & Autosave) [COMPLETED]:**
  - สร้าง Assessment Catalog ทั้ง 5 ชุดครบถ้วน (Burnout 22 ข้อ, Stress 20 ข้อ, RQ 20 ข้อ, 9Q 9 ข้อ, 2Q Plus 3 ข้อ)
  - เพิ่ม API: `GET /api/assessment/catalog`, `GET /api/assessment/catalog/:code`, `PUT /api/assessment/draft/answers`
  - สร้าง Vue 2 Component `AssessmentForm.vue` แสดงคำถามแบบ Scrollable Mobile-first
  - เพิ่มระบบ Autosave แบบ Debounced พร้อม Badge สถานะบันทึก ("กำลังบันทึก...", "บันทึกแล้ว", "บันทึกไม่สำเร็จ")
  - รองรับการกู้คืนคำตอบเดิม (Resume) เมื่อกลับมาทำต่อ และปุ่มลองบันทึกใหม่ (Retry) เมื่อเครือข่ายขัดข้อง
  - ทดสอบ TDD (`apps/api/tests/catalog-autosave.test.js`) และ build ทดสอบผ่าน 100%
- **Ticket 05 (Sequential Assessment Flow & Validation) [COMPLETED]:**
  - ออกแบบวงจรการทำแบบประเมินเรียงตามลำดับตายตัว 5 ชุด (Burnout → Stress → RQ → 9Q → 2Q Plus)
  - เพิ่ม API: `POST /api/assessment/draft/step/next` (ตรวจสอบความครบถ้วนของคำถามทุกข้อก่อนเลื่อนไปชุดถัดไป) และ `POST /api/assessment/draft/step/prev`
  - อัปเดต `AssessmentForm.vue` มี Stepper ด้านบน, ระบบตรวจสอบความครบถ้วน (Validation), ป้ายแจ้งเตือนข้อผิดพลาด (Error Summary) และกลไกเลื่อนหน้าจอพร้อมโฟกัสไปยังข้อแรกที่ยังไม่ตอบ (Scroll & Focus)
  - รองรับการย้อนกลับไปแก้ไขคำตอบในแบบประเมินชุดก่อนหน้าโดยไม่สูญเสียข้อมูล
  - ทดสอบ TDD (`apps/api/tests/sequential-flow.test.js`) และ build ผ่าน 100%
- **Ticket 06 (Submission Confirmation & Atomic Submit) [COMPLETED]:**
  - สร้าง `SubmissionModal.vue` สำหรับยืนยันการส่งพร้อมสรุปจำนวน 74 ข้อ และข้อความแจ้งเตือนคำตอบล็อกถาวร
  - เพิ่ม API: `POST /api/assessment/submit`
  - ตรวจสอบความครบถ้วนของคำถามทั้ง 74 ข้อก่อนยอมรับการส่ง
  - บันทึก `EmployeeSnapshot` ณ เวลาส่ง
  - จัดการการส่งแบบ Idempotent (ส่งซ้ำได้ผลเดิม ไม่เกิด Duplicate หรือ Error)
  - ล็อกคำตอบถาวรหลังส่งสำเร็จ (การพยายามแก้ไขคำตอบจะคืนค่า 400 ATTEMPT_LOCKED)
  - ทดสอบ TDD (`apps/api/tests/submission-atomic.test.js`) และ build ทดสอบผ่าน 100%
- **Ticket 07 (Scoring Engine & Employee Result Summary View) [COMPLETED]:**
  - พัฒนา Scoring Engine ครบ 5 เครื่องมือใน `packages/shared-contracts/scoring.js`:
    - Burnout 3 มิติ (EE, DP, PA) พร้อม Inverted scoring (6 - score) สำหรับ PA ตาม ADR-0015
    - Stress คำนวณ 0-60 จำแนกเป็น 5 ระดับตามเกณฑ์คลินิก
    - RQ 3 มิติและคะแนนรวม พร้อม Inverted items (1, 5, 14, 15, 16) ตาม ADR-0014
    - 9Q จำแนก 4 ระดับ โดยข้อ 9 เป็นส่วนหนึ่งของคะแนนรวม ไม่แยกตัดสินความเสี่ยงทำร้ายตนเอง
    - 2Q Plus จำแนก 2 มิติอิสระ: ความเสี่ยงซึมเศร้า และความเสี่ยงฆ่าตัวตาย ตาม ADR-0016
    - สถานะภาพรวม "ควรได้รับการดูแลสุขภาพใจเพิ่มเติม" และกำหนดความสำคัญสูงสุดของความเสี่ยงฆ่าตัวตายตาม ADR-0013
  - พัฒนา API: `GET /api/assessment/result`
  - สร้าง Vue 2 Component `ResultSummaryView.vue` แสดงข้อความคัดกรองเบื้องต้น, กล่องแจ้งเตือนความเสี่ยงฉุกเฉินพร้อมเบอร์สายด่วน 1323 และสะมาริตันส์, การ์ดผลประเมินทั้ง 5 ชุด, คำแนะนำในการดูแลตนเอง และข้อความคุ้มครอง PDPA
  - บูรณาการเข้ากับหน้า `App.vue` เมื่อสถานะเป็น `SUBMITTED`
  - ผ่านการทดสอบ Golden unit tests และ API tests 100%
- **Ticket 08 (One-Time Assessment Invariant & Draft Management) [COMPLETED]:**
  - กำหนด DDL Schema ใน `apps/api/src/db/schema.sql` พร้อม Partial Unique Indexes:
    - `uq_submitted_attempt_per_employee` บังคับส่งได้สูงสุด 1 ครั้งตลอดอายุระบบสำหรับสถานะ `SUBMITTED`
    - `uq_draft_attempt_per_employee` บังคับมีแบบร่างได้สูงสุด 1 รายการต่อพนักงานสำหรับสถานะ `DRAFT`
  - เสริมการตรวจสอบฝั่ง API Service: ป้องกันการสร้าง Draft หรือส่งซ้ำ (คืนค่า 409 `SINGLE_SUBMISSION_VIOLATION`), ป้องกันการแก้ไขคำตอบหลังส่ง (400 `ATTEMPT_LOCKED`), รองรับ Idempotent Submission
  - จัดการการเข้าสู่ระบบซ้ำ: หากพนักงานส่งเรียบร้อยแล้ว การเข้าสู่ระบบจะนำทางตรงไปยังหน้า Result Summary ทันที
  - Draft Management: เพิ่มปุ่ม "ล้างคำตอบและเริ่มใหม่" บนหน้าแบบร่างและแถบด้านบนของแบบประเมิน ซึ่งจะล้างคำตอบทั้งหมดและรีเซ็ตขั้นตอนกลับไปจุดเริ่มต้น
  - ผ่านการทดสอบ Integration Tests ใน `apps/api/tests/one-time-invariant.test.js` และ Build Vue 2 สำเร็จ 100%
- **Ticket 09 (Admin Internal Authentication & Session Shell) [COMPLETED]:**
  - พัฒนาโมดูล `AdminIdentityService` ใน `apps/api/src/modules/admin-identity.js`:
    - เข้ารหัสและตรวจรหัสผ่านด้วย Argon2id ตามมาตรฐานความปลอดภัย (hash-wasm WebAssembly)
    - ระบบป้องกันการเดารหัสผ่าน (Brute-force / Lockout): ล็อกบัญชี 15 นาทีอัตโนมัติหากใส่รหัสผ่านผิดติดต่อกัน 5 ครั้ง (HTTP 423 Account Locked)
    - จัดการ Session ฝั่ง Server พร้อมหมดอายุ 8 ชั่วโมง
  - พัฒนา Middleware และ API Routes ใน `apps/api/src/routes/admin-auth.js`:
    - `POST /api/admin/auth/login`: ตรวจสอบข้อมูลรับรอง และตั้งค่า HTTP-only Cookie (`admin_session` / `__Host-admin-session`)
    - `GET /api/admin/auth/me`: ตรวจสอบสถานะการเข้าสู่ระบบ
    - `POST /api/admin/auth/logout`: ล้าง Session และ Cookie
    - ตรวจสอบการแยกสิทธิ์ระหว่าง Admin และ Employee ชัดเจน
  - พัฒนา Desktop-First Admin UI ใน `apps/admin-web`:
    - หน้าล็อกอิน `AdminLogin.vue` แสดงข้อความเตือนเมื่อรหัสผิดพลาดหรือติดล็อกชั่วคราว
    - Authenticated Shell ใน `App.vue` พร้อม Sidebar สลับเมนู "ตารางรายบุคคล" และ "Dashboard สถิติ" พร้อมปุ่มออกจากระบบ
  - ผ่านการทดสอบความปลอดภัย TDD (`apps/api/tests/admin-auth.test.js`) และ Build Vue 2 สำเร็จ 100%
- **Ticket 10 (Admin Individual Results Table & Employee Search) [COMPLETED]:**
  - พัฒนา API: `GET /api/admin/assessments` สำหรับดึงข้อมูลผลประเมินรายบุคคลพร้อม Server-side pagination, sorting, และ search (ค้นหาด้วยรหัสพนักงาน หรือชื่อ-นามสกุล)
  - **การคุ้มครองข้อมูลส่วนบุคคล (PDPA Invariant):** ตัดคำตอบรายข้อ (`Answer` entities) ออกจาก API Response 100% โดยส่งเฉพาะ `EmployeeSnapshot` และผลลัพธ์จัดระดับ (`result`)
  - พัฒนา Vue 2 Component `IndividualResultsTable.vue`:
    - กล่องค้นหาแบบ Real-time พร้อม Debounce
    - ตาราง Desktop-first แสดงวันที่ส่ง, รหัสพนักงาน, ชื่อ-นามสกุล, แผนก, สถานะภาพรวม และระดับคะแนน 5 เครื่องมือ
    - คอลัมน์หัวตารางคลิกเรียงลำดับได้ทั้งไปข้างหน้าและย้อนกลับ (Sort Asc/Desc) พร้อมสัญลักษณ์ ▲/▼
    - ปุ่มเปิด Modal แสดงรายละเอียดมิติย่อยทั้ง 5 ด้าน พร้อมแจ้งเตือนข้อกำหนดความเป็นส่วนตัว
    - แถบเปลี่ยนหน้า (Pagination controls) พร้อมตัวเลือกจำนวนแถวต่อหน้า (10, 20, 50)
  - ผ่านการทดสอบ Integration Tests (`apps/api/tests/admin-individual-results.test.js`) และ Build Vue 2 สำเร็จ 100%
- **Ticket 11 (Multidimensional Filter Engine) [COMPLETED]:**
  - พัฒนาโมดูลกลาง `packages/shared-contracts/filter-engine.js`:
    - กฎตรรกะ: ใช้ `OR` สำหรับเงื่อนไขหลายค่าในมิติเดียวกัน และใช้ `AND` ระหว่างมิติที่ต่างกันตาม ADR-0009
    - คำนวณช่วงอายุงาน (Tenure brackets: `<1 ปี`, `1–3 ปี`, `3–5 ปี`, `>5 ปี`) แบบไดนามิกโดยเทียบระหว่าง `snapshot.startDate` และ `submittedAt`
    - คำนวณช่วงอายุ (Age brackets: `<25`, `25-34`, `35-44`, `45-54`, `≥55`)
    - ฟังก์ชัน `buildSqlFilters` สำหรับสร้าง Parameterized Query ป้องกัน SQL Injection
  - บูรณาการเข้ากับ API `GET /api/admin/assessments`: รองรับ Date Range, หน่วยงานองค์กร, ประชากรศาสตร์, อายุงาน, สถานะภาพรวม และระดับคะแนนของแต่ละเครื่องมือ
  - พัฒนา Vue 2 Component `FilterPanel.vue`: แถบตัวกรองแบบพับเก็บได้, Badge แสดงจำนวนเงื่อนไขที่ใช้งาน, ซิงโครไนซ์สถานะตัวกรองกับ URL Query Parameters, และปุ่มล้างตัวกรองทั้งหมด
  - ผ่านการทดสอบ TDD Unit/Integration (`apps/api/tests/filter-engine.test.js`) และ Build Vue 2 สำเร็จ 100%
- **Ticket 12 (Aggregate Dashboard with Small-Cohort Suppression) [COMPLETED]:**
  - พัฒนา API: `GET /api/admin/dashboard` สำหรับคำนวณสถิติภาพรวมจำแนกตาม 5 เครื่องมือมาตรฐาน และสถานะภาพรวม
  - **การคุ้มครองข้อมูลความลับขั้นสูง (Small-Cohort Suppression Invariant ตาม ADR-0010):**
    - หากจำนวนกลุ่มประชากรที่เข้าเกณฑ์ตัวกรองมีขนาด $1 \le n < 5$ ระบบจะระงับการแสดงผลสถิติและตัวเลขแจกแจงความถี่ทั้งหมดทันที โดยส่งคืน `suppressed: true` และข้อความมาตรฐาน `PRIVACY_RULES.SUPPRESSION_MESSAGE`
  - พัฒนา Vue 2 Component `AggregateDashboard.vue`: KPI Cards, แถบแจกแจงความถี่จำแนกสีตามระดับความเสี่ยง, และหน้าต่างแจ้งเตือน Small-cohort suppression
  - ผ่านการทดสอบ Integration Tests (`apps/api/tests/dashboard-suppression.test.js`) 100%
- **Ticket 13 (Secure Admin Report Export) [COMPLETED]:**
  - พัฒนาโมดูล `ExportService` ใน `apps/api/src/modules/export-service.js` และ `AuditService` ใน `apps/api/src/modules/audit-service.js`
  - เพิ่ม API: `POST /api/admin/export` และ `GET /api/admin/export/download/:token`
  - รองรับการส่งออกทั้งไฟล์ CSV (Excel BOM UTF-8) และไฟล์ Printable HTML / PDF
  - มีข้อความแจ้งเตือนข้อมูลสุขภาพส่วนบุคคลที่มีความอ่อนไหว (`เอกสารข้อมูลสุขภาพส่วนบุคคลที่มีความอ่อนไหว — ห้ามเผยแพร่ต่อผู้ไม่มีสิทธิ์`) เด่นชัดที่ส่วนหัวของรายงาน
  - **การคุ้มครองข้อมูลส่วนบุคคล (PDPA Invariant):** ตัดคำตอบรายข้อออกจากการส่งออกทั้งหมด 100%
  - ลิงก์ดาวน์โหลดใช้งาน Token สุ่มความยาว 32 bytes และหมดอายุอัตโนมัติภายใน 15 นาที (คืนค่า 410 `DOWNLOAD_EXPIRED`)
  - บันทึก `audit_events` ทุกครั้งที่มีการส่งออกรายงาน (ระบุผู้ใช้, เวลา, เกณฑ์ตัวกรอง, และชื่อไฟล์)
  - เพิ่มปุ่มส่งออกรายงานใน `IndividualResultsTable.vue`
  - ผ่านการทดสอบ TDD (`apps/api/tests/admin-export.test.js`) และ build สำเร็จ 100%
- **Ticket 14 (Admin Reset Assessment Workflow) [COMPLETED]:**
  - พัฒนา API: `POST /api/admin/assessments/:id/reset` สำหรับรีเซ็ตแบบประเมิน
  - ตรวจสอบความถูกต้อง: บังคับระบุเหตุผลในการรีเซ็ต (Reason Validation) หากเป็นค่าว่างจะคืน 400 `VALIDATION_FAILED`
  - ปรับสถานะแบบประเมินเดิมเป็น `CANCELLED` พร้อมบันทึก `cancelledAt`, `cancelledReason`, และผู้ดูแลระบบผู้ดำเนินการ (`cancelledBy`)
  - บันทึกประวัติ `admin_resets` และส่ง Event เข้า `audit_events` (`action: admin_reset`)
  - **การแยกสถิติและความถูกต้องของข้อมูล:** รายการที่ถูกยกเลิก (`CANCELLED`) จะถูกตัดออกจากตารางรายการปกติ (`SUBMITTED`) และไม่ถูกนำไปคำนวณในหน้า Aggregate Dashboard โดยอัตโนมัติ
  - **การปลดล็อกสิทธิ์พนักงาน (Unblocking Employee):** ล้าง Draft/Session เดิม เพื่อให้พนักงานที่ถูกรีเซ็ตสามารถล็อกอินเข้าสู่ระบบและสร้างแบบร่างใหม่ (`DRAFT`) ได้ทันที
  - **การจัดเก็บข้อมูลแบบถาวร (Immutable Preservation):** รายการที่ยกเลิกยังคงอยู่ในระบบเพื่อการตรวจสอบย้อนหลัง (Audit trail) และมี API `GET /api/admin/assessments/:id` ตรวจดูรายละเอียดได้โดยยังคงปิดบังคำตอบรายข้อตามกฎ PDPA
  - พัฒนาปุ่ม "รีเซ็ตผลการประเมิน" และหน้าต่างยืนยันพร้อมช่องกรอกเหตุผลใน `IndividualResultsTable.vue` ฝั่งแอดมิน
  - ผ่านการทดสอบ Integration Tests (`apps/api/tests/admin-reset.test.js`) และ build สำเร็จ 100%
- **Ticket 15 (Audit Logging & 3-Year Data Retention Anonymization) [COMPLETED]:**
  - พัฒนาโมดูล `AuditService` ใน `apps/api/src/modules/audit-service.js`:
    - บันทึกความปลอดภัยและกิจกรรมการบริหารจัดการ: `admin_login`, `admin_login_failed`, `admin_logout`, `admin_view_individual`, `admin_export`, `admin_reset`, `retention_anonymize`
    - **การป้องกันข้อมูลรั่วไหลขั้นเด็ดขาด (Security & Privacy Sanitization):** กรองและล้างข้อมูลรับรองความปลอดภัย เช่น `password`, `passwordHash`, `sessionToken`, `shareToken`, รวมถึงคำตอบรายข้อ `answers`, `rawAnswers` ออกจาก Audit Logs 100%
    - จัดเก็บลงคลัง Event Store แบบ Append-only สำหรับอายุการเก็บรักษา 5 ปี
    - ให้บริการ API `GET /api/admin/audit-logs` สำหรับการสืบค้นประวัติย้อนหลังพร้อมระบบ Pagination และฟิลเตอร์ตาม Actor / Action
  - พัฒนาโมดูล `RetentionWorker` ใน `apps/api/src/modules/retention-worker.js` และเมธอด `anonymizeOldAssessments` ใน `AssessmentSessionService`:
    - ตรวจสอบประวัติแบบประเมินทั้งสถานะ `SUBMITTED` และ `CANCELLED` ที่มีอายุเกิน 3 ปีนับจากวันที่ส่ง
    - ดำเนินการ Anonymization แบบไม่ย้อนกลับ: ล้างข้อมูลระบุตัวตนบุคคลใน `EmployeeSnapshot` (`firstName` และ `lastName` เปลี่ยนเป็น `[ANONYMIZED]`, `telephone` ตั้งเป็น `null`, รหัสพนักงานแปลงเป็น `ANON-hash`)
    - คงค่าคุณลักษณะทางสถิติและผลคะแนนรวมทั้ง 5 ด้านไว้เพื่อการวิเคราะห์แนวโน้มองค์กรระยะยาว
    - กลไกทำงานแบบ Idempotent (สามารถรันซ้ำกี่ครั้งก็ได้โดยไม่เกิดข้อผิดพลาดหรือทำลายข้อมูลที่ Anonymize แล้ว)
    - ให้บริการ API `POST /api/admin/audit-logs/retention/run` สำหรับการสั่งทำงานทั้งแบบ Scheduled และ On-demand
    - ผ่านการทดสอบ Integration Tests (`apps/api/tests/retention-anonymization.test.js`) 100%

### 2026-09-07: Alignment with Updated HR Requirements Document (`01_เอกสารยืนยันความต้องการระบบประเมินสุขภาพใจ.docx`)
- **Review and Gap Analysis:**
  - ตรวจสอบเอกสารความต้องการที่อัปเดตใหม่โดย HR (`deliverables/HR-Requirement-Confirmation-Pack/01_เอกสารยืนยันความต้องการระบบประเมินสุขภาพใจ.docx`)
  - กำหนดความต้องการสำคัญใหม่โดยเฉพาะ **ข้อที่ 10 (การคุ้มครองข้อมูลและความปลอดภัย)**:
    1. **การเข้ารหัสข้อมูลระบุตัวตน (PII Encryption at Rest):** เข้ารหัส Full Name (`full_name`), Gender (`gender`), Age (`age`), และ Employee ID (`employee_id`)
    2. **การปิดบังข้อมูลบนหน้าจอ (UI Masking):** ปิดบังชื่อ-นามสกุล และรหัสพนักงานบนตารางรายงานผลของแอดมินตามรูปแบบ เช่น `“นายสมชาย ทำงานดี”` >> `“นายสมXXXX ทำXXXX”`, `“INET9988776655”` >> `“INET99XXXXXX55”`
    3. **การส่งออกข้อมูล (Excel Only & Password Confirmation):** กำหนดรูปแบบส่งออกเฉพาะ Excel เท่านั้น, ห้ามส่งออกคำตอบรายข้อ, บังคับให้ผู้ดูแลระบบยืนยันรหัสผ่านบัญชีของตนเองอีกครั้งก่อนดาวน์โหลด, และบันทึก Audit Log ทุกครั้ง
    4. **Audit Trail ครอบคลุมทุกกิจกรรม:** บันทึกประวัติการเข้าสู่ระบบ, การดูข้อมูล, การส่งออกรายงาน, การรีเซ็ตผล, และทุกการดำเนินการของผู้ดูแลระบบ
    5. **Authentication Scope (Section 3):** ยืนยันพนักงานเข้าผ่าน OnePlatform App SSO (OneID `shareToken`), แอดมินเข้าผ่านบัญชี OneID และผูกสิทธิ์ Admin ในระบบ (2FA เป็น Out of Scope สำหรับเฟส 1)
    6. **Data Retention & Lifecycle (Section 12 & ADR-0018):** ลดระยะเวลาจัดเก็บผลประเมินที่ระบุตัวตนได้เหลือ **1 ปี** (จากเดิม 3 ปี) ก่อนทำการ Anonymize และลดระยะเวลาจัดเก็บ Audit Log เหลือ **2 ปี** (จากเดิม 5 ปี)
    7. **Confirmation Checklist:** ปรับปรุงตารางยืนยัน C-01 ถึง C-06 ให้สอดคล้องกับข้อ 12 ของเอกสารยืนยัน
- **Architecture & Decision Records (ADRs):**
  - สร้าง ADR ใหม่: `docs/adr/0031-pii-encryption-and-ui-masking.md` กำหนดอัลกอริทึม AES-256-GCM สำหรับ PII Encryption at Rest และกฎการ Masking รหัสพนักงานและชื่อ-นามสกุล
  - อัปเดต `docs/adr/0004-sso-and-employee-identity.md`: ปรับปรุงบทบาท OneID mapping และ SSO flow
  - อัปเดต `docs/adr/0017-admin-export.md`: กำหนดให้ส่งออกเฉพาะ Excel, บังคับ Re-enter Password Confirmation, บันทึก Audit Log, และรักษา PDPA Raw Answers Non-disclosure
  - อัปเดต `docs/adr/0018-assessment-data-retention.md`: ปรับเปลี่ยน Lifecycle เป็นเก็บผลประเมิน 1 ปี และ Audit Trail 2 ปี
- **Deliverables & Specifications Updated:**
  - อัปเดต Interactive Prototype (`02_Prototype/mental-health-ui-prototype.html`): เพิ่ม UI Masking บนตารางแอดมิน (`(Masked)`), ปรับปุ่มส่งออกเป็น "ส่งออกข้อมูล (Excel)", สร้าง Modal ยืนยันรหัสผ่านก่อนส่งออกพร้อมระบบตรวจสอบและข้อความแจ้งเตือน Audit Trail, ปรับปรุงคำชี้แจงก่อนทำแบบประเมิน (เก็บบันทึก 1 ปี / Audit 2 ปี และการเข้ารหัส PII)
  - อัปเดตเอกสารสไลด์นำเสนอ (`06_สไลด์นำเสนอ_User_Journey_ระบบประเมินสุขภาพใจ.pptx` และ `Mental_Health_Assessment_User_Journey_Presentation.pptx`): แก้ไขสไลด์ 2, 3, 7, 9, 10, 11, 12 ให้สอดคล้องกับ OneID Admin Login, UI Masking, Excel-only Password Confirmation, Retention 1 ปี, Audit 2 ปี, และ Checklist C-01 ถึง C-06
  - อัปเดต User Journey Document (`05_User_Journey_Admin_EndUser.md`): อัปเดต Mermaid sequence diagram และ Flow รายละเอียดทั้ง 6 เฟส
  - อัปเดต System Specification & Design Docs (`docs/specs/2026-09-05-mental-health-assessment-spec.md`, `docs/superpowers/specs/2026-09-03-mental-health-assessment-design.md`, และชุดสำเนาใน `04_เอกสารอ้างอิงโครงการ/`)
  - อัปเดต Domain Model (`docs/domain-model.md`), Glossary (`docs/glossary.md`), Pack README (`deliverables/HR-Requirement-Confirmation-Pack/README.md`), และ Script `tools/build_hr_confirmation_pack.py`
- **Application Code & Backend Implementation:**
  - `apps/admin-web/src/components/IndividualResultsTable.vue`:
    - เพิ่มฟังก์ชัน `maskEmployeeId(id)` และ `maskFullName(name)` ตามตัวอย่างที่กำหนดในเอกสาร
    - ปรับปรุงหัวตารางเป็น `รหัสพนักงาน (Masked)` และ `ชื่อ-นามสกุล (Masked)`
    - เพิ่ม Modal Popup ยืนยันรหัสผ่านแอดมินก่อนส่งออกไฟล์ Excel และแจ้งเตือนข้อกำหนดด้านความปลอดภัย
    - **UI Masking Consistency & Dynamic Reveal:** แก้ปัญหาความไม่สอดคล้องกัน โดยกำหนดให้ค่าเริ่มต้น Masked เหมือนกัน 100% ทั้งบนตารางและใน Modal (`EMP-00XXXX10`, `วรัญญูXXXX จXXXX`) พร้อมเพิ่มปุ่ม `👁️ ปลดล็อกแสดงข้อมูลจริง (Unmask PII)` / `🔒 ปิดบังข้อมูล (Mask PII)`
  - `apps/api/src/routes/admin-assessments.js`: เพิ่ม API `POST /api/admin/assessments/:id/unmask-pii` สำหรับบันทึก Audit Log (`admin_reveal_pii`) ทุกครั้งที่มีการเปิดดูข้อมูลจริงของพนักงานรายบุคคล
  - `apps/admin-web/src/components/AdminLogin.vue`: ปรับปรุงป้ายระบุสิทธิ์ OneID Account และระบุอายุการจัดเก็บ Audit Trail 2 ปี
  - `apps/api/src/modules/admin-identity.js`: เพิ่มฟังก์ชัน `verifyAdminPassword(username, password)` เพื่อตรวจสอบความถูกต้องของรหัสผ่านก่อนอนุมัติการส่งออก
  - `apps/api/src/routes/admin-export.js`: ตรวจสอบรหัสผ่านผู้ดูแลระบบก่อนสร้างลิงก์ดาวน์โหลด Excel, คืนค่า HTTP 401 เมื่อรหัสผ่านไม่ถูกต้อง พร้อมบันทึก `audit_events` การเข้าถึง
  - `apps/api/src/modules/assessment-session.js`:
    - เพิ่มฟังก์ชัน `encryptPII(text)` และ `decryptPII(payload)` ด้วย AES-256-GCM
    - จัดเก็บ `_encrypted` snapshot fields (`fullName`, `gender`, `age`, `employeeId`) ตอนพนักงานกดส่งแบบประเมิน
    - ปรับรอบการ Anonymize ข้อมูลเก่าเป็น 1 ปี (`INTERVAL '1 year'`) พร้อมล้างฟิลด์ `_encrypted`
  - `apps/api/src/modules/retention-worker.js`: ปรับอายุการเก็บรักษาเริ่มต้นเป็น 1 ปีสำหรับแบบประเมิน และ 2 ปีสำหรับ Audit Log
  - ทำการทดสอบ Verification Script ตรวจสอบการเข้ารหัส PII AES-256-GCM, การยืนยันรหัสผ่านแอดมิน, API Unmask PII พร้อม Audit Trail, และวงจรรอบการทำงานของ Retention Worker ผ่านสมบูรณ์ 100%


### 2026-09-08: Full Alignment with `User Journey ระบบตรวจสอบสุขภาพใจ.pdf` (3 Roles, 24 Steps & Enhanced Security)
- **Review and Architecture Re-Alignment:**
  - วิเคราะห์เอกสารแม่แบบ `User Journey ระบบตรวจสอบสุขภาพใจ.pdf` ที่มีการจัดแบ่ง 24 ขั้นตอนและ 3 Swimlanes (พนักงาน, Super Admin, Admin)
  - กำหนดสถาปัตยกรรม Role-based Authorization Hierarchy และ Security Constraints ใหม่
- **Component 1: Shared Contracts (`packages/shared-contracts`):**
  - กำหนด `ROLES`: `EMPLOYEE`, `ADMIN`, `SUPER_ADMIN`
  - กำหนด `ADMIN_PERMISSIONS`: `can_export` (สิทธิ์ส่งออกข้อมูล), `manage_admins` (สิทธิ์จัดการผู้ดูแลระบบ)
  - กำหนด `EXPORT_FORMATS`: `excel` (.xlsx/.xls), `csv` (UTF-8 with BOM)
  - กำหนด `AUDIT_ACTIONS`: `create_admin`, `update_admin_permissions`, `export_admin_users`, `export_results`, `verify_password_failed`
- **Component 2: Backend API Service (`apps/api`):**
  - `AdminIdentityService`: เพิ่มการจัดเก็บสิทธิ์ผู้ใช้งาน (`roles` และ `permissions`), เมธอด `listAdmins()`, `createAdmin()`, `updateAdmin()`, และ `verifyAdminPassword()`
  - Middlewares: พัฒนา `requireSuperAdmin` และ `requirePermission` เพื่อควบคุมการเข้าถึงในระดับ Route
  - เพิ่ม Route ใหม่: `/api/admin/users` สำหรับ Super Admin ในการดูรายชื่อ, เพิ่ม Admin ใหม่, แก้ไขสิทธิ์ Export, และส่งออกรายชื่อ Admin (Excel/CSV)
  - ปรับปรุง Route `/api/admin/export`: รองรับทั้งรูปแบบ Excel และ CSV, ตรวจสอบสิทธิ์ `requirePermission('can_export')` (คืน 403 Forbidden หากไม่มีสิทธิ์), ตรวจสอบรหัสผ่าน ONE ID ก่อนดาวน์โหลด (คืน 401 เมื่อรหัสผ่านผิดพลาด) และบันทึก Audit Log ทุกครั้ง
  - `ExportService`: พัฒนาการสร้างไฟล์ Excel (.xls HTML table) และ CSV (UTF-8 with BOM)
  - ผ่านการทดสอบ Automated Tests ทั้งหมด **20/20 tests** (`npm --workspace=@mental-health/api test`)
- **Component 3: Admin Web Application (`apps/admin-web`):**
  - สร้าง `AdminPortal.vue` (Step 7): หน้าแรกของ Super Admin แสดง 2 เมนูหลัก คือ (1) Dashboard ตรวจสอบสุขภาพใจ และ (2) จัดการสิทธิ์ Admin
  - สร้าง `AdminPermissionManagement.vue` (Step 10): หน้าจัดการสิทธิ์ผู้ดูแลระบบ แสดงตารางรายชื่อ, ระดับสิทธิ์, สิทธิ์การส่งออกข้อมูล (Export), Modal เพิ่ม/แก้ไขสิทธิ์ และฟังก์ชันส่งออกรายชื่อ Admin
  - อัปเดต `IndividualResultsTable.vue`:
    - **Step 21 Gating Export:** ซ่อนปุ่ม Export ข้อมูลอัตโนมัติหากผู้ใช้ไม่มีสิทธิ์ (`v-if="canExport"`)
    - **Steps 13, 21, 22, 23 Export & Password Flow:** รองรับตัวเลือกรูปแบบ Excel / CSV และ Modal ยืนยันรหัสผ่าน ONE ID พร้อมการแสดงผลข้อผิดพลาดเมื่อรหัสผ่านไม่ถูกต้อง
  - อัปเดต `App.vue`: ระบบนำทางตามบทบาท (Super Admin เข้าสู่ Portal พร้อมเมนูสลับหน้า; Admin เข้าสู่ Dashboard โดยตรงโดยไม่มีเมนูจัดการ Admin)
  - ผ่านการทดสอบการ Build ด้วย Vite สำเร็จ 100% (0 errors)
- **Component 4: Employee Web Application (`apps/employee-web`):**
  - สร้าง `EmployeePortal.vue` (Step 2.1 & 2.2): หน้า Portal พนักงาน แสดงข้อมูลโปรไฟล์ ONE ID และการ์ดบริการสุขภาพใจพร้อมปุ่ม "เข้าทำแบบประเมิน"
  - อัปเดต `NoticeView.vue` (Step 3): ปรับปุ่มยอมรับคำชี้แจงเป็นปุ่มเดี่ยว **"รับทราบ"** ตามข้อกำหนด Step 3
  - อัปเดต `App.vue`: จัดลำดับหน้าจอให้เริ่มต้นที่ Employee Portal ก่อนเข้าสู่หน้า Notice
  - ผ่านการทดสอบการ Build ด้วย Vite สำเร็จ 100% (0 errors)
- **Component 5: Interactive Prototype & Deliverables:**
  - อัปเดต Interactive Prototype (`02_Prototype/mental-health-ui-prototype.html`):
    - เพิ่ม Role Switcher จำลอง 4 บทบาท: พนักงาน, Super Admin, Admin (มีสิทธิ์ Export), Admin (ไม่มีสิทธิ์ Export)
    - จำลองหน้าจอครบทุก Step: Employee Portal (2.1), Single Notice "รับทราบ" (3), Super Admin Portal (7), Admin Permission Management (10), Dynamic Export Button Hiding (21), Format selector Excel/CSV (22), และ Password Error simulation (23)
  - อัปเดต User Journey Document (`05_User_Journey_Admin_EndUser.md`): เขียนใหม่ครอบคลุม 3 Swimlanes, ตารางแจกแจง 24 ขั้นตอน, Sequence Diagrams และ Permission Matrix
  - อัปเดตงานนำเสนอ PowerPoint (`06_สไลด์นำเสนอ_User_Journey_ระบบประเมินสุขภาพใจ.pptx` และ `Mental_Health_Assessment_User_Journey_Presentation.pptx`): ปรับปรุงสไลด์ให้สะท้อน 24 ขั้นตอนและ 3 บทบาทสมบูรณ์
  - สร้างสถาปัตยกรรมการตัดสินใจ `docs/adr/0032-role-hierarchy-and-admin-permission-management.md` และอัปเดต `docs/adr/0017-admin-export.md`

---

## Final Project Summary

- **Total Tickets Completed:** 14 of 15 (Ticket 02 Skipped as instructed; Mock Session provided for dev) + Role Hierarchy & 24-Step User Journey Extension
- **Alignment Status:** 100% Fully Aligned with `User Journey ระบบตรวจสอบสุขภาพใจ.pdf` (24 Steps, 3 Swimlanes, Super Admin Portal, Admin Permission Management, Step 21 Hide Export Button, Excel & CSV Dual Formats, Password ONE ID Verification)
- **Frontend Workspaces:**
  - `apps/employee-web`: Vue 2 + Vite — Employee Portal (Step 2.1), Single "รับทราบ" Notice (Step 3), Sequential 5-assessment flow (Steps 4 & 5), Result Summary (Step 6)
  - `apps/admin-web`: Vue 2 + Vite — Super Admin Portal (Step 7), Admin Permission Management (Step 10), Multidimensional Filters, UI Masking, Small-Cohort Suppression, Dynamic Export Button Hiding (Step 21), Password ONE ID Verification (Steps 13 & 22)
- **Backend Workspace:**
  - `apps/api`: Node.js + Express — Role & Permission Middleware, Super Admin routes (`/api/admin/users`), Dual-format Export (`/api/admin/export`), PII Encryption (AES-256-GCM), 1-yr Data Retention Worker, 2-yr Comprehensive Audit Trail
- **Shared Contracts:**
  - `packages/shared-contracts`: Roles, Permissions, Export Formats, Scoring Engines, Catalog 74 Questions, Filter Engine
- **Deliverables & Prototype:**
  - `02_Prototype/mental-health-ui-prototype.html` (Interactive Prototype ครบ 4 บทบาทจำลองและ 24 ขั้นตอน)
  - `05_User_Journey_Admin_EndUser.md` (เอกสาร User Journey 24 ขั้นตอนและ Sequence Diagrams)
  - `06_สไลด์นำเสนอ_User_Journey_ระบบประเมินสุขภาพใจ.pptx` & `Mental_Health_Assessment_User_Journey_Presentation.pptx` (สไลด์นำเสนอ 12 สไลด์ฉบับสมบูรณ์)
  - `docs/adr/0032-role-hierarchy-and-admin-permission-management.md` & `docs/adr/0017-admin-export.md`
- **Automated Tests & Verifications:** 20/20 Backend Tests Pass, 0 Vite Build Errors across both Frontends.

---

### 2026-09-08: Alignment with Management Feedback (3 Instruments, No Recommendations, Dev Encrypt / HR Unmasked)
- **User Requirements Addressed:**
  1. **รูปที่ 1 (Data Visibility & Encryption):** Dev ทำการ Encrypt ข้อมูล PII ในฐานข้อมูล (AES-256-GCM) แต่ HR สามารถดูข้อมูลชื่อ-นามสกุลและรหัสพนักงานที่แสดงได้ทั้งหมด (Unmasked)
  2. **รูปที่ 2 (Result Screen):** ตัดส่วนที่เป็นคำแนะนำ ("คำแนะนำในการดูแลตนเอง") ออกจากหน้าจอสรุปผลของพนักงาน แสดงเฉพาะคะแนน ระดับ และคำอธิบายผล
  3. **3 Assessment Forms Only:** ปรับลดแบบประเมินเหลือเพียง 3 ฟอร์ม (51 ข้อคำถาม รวม ~8–10 นาที):
     - Burn Out (22 ข้อ: B01–B22)
     - ความเครียด ST-20 (20 ข้อ: S01–S20)
     - ภาวะเสี่ยงซึมเศร้า 9Q (9 ข้อ: Q01–Q09)
     - ตัด Resilience (RQ 20 ข้อ) และ 2Q Plus (3 ข้อ) ออกทั้งหมด
- **Updates across Codebase:**
  - `packages/shared-contracts`: อัปเดต `catalog.js` (51 ข้อ), `scoring.js` (3 เครื่องมือ และ overall score), `filter-engine.js` (ลบ filter RQ/2Q+), ผ่านการทดสอบ `scoring.test.js` 100%
  - `apps/api`: อัปเดต Dashboard สถิติ, Export Service คืนค่าชื่อ-รหัสจริงและ 3 เครื่องมือ, Mock data 51 ข้อ, อัปเดตชุดทดสอบ API ผ่านครบ 20/20 tests
  - `apps/employee-web`: อัปเดตหน้า Notice, Submission Modal, Portal, และ `ResultSummaryView.vue` ตัดการ์ดคำแนะนำและ Suicide Alert ออก, ผ่านการ Build 100%
  - `apps/admin-web`: อัปเดต `IndividualResultsTable.vue` แสดงข้อมูลจริง Unmasked, ตัดปุ่ม Unmask PII, ตัดคอลัมน์ RQ/2Q+, อัปเดต `AggregateDashboard.vue` และ `FilterPanel.vue` สำหรับ 3 เครื่องมือ, ผ่านการ Build 100%
  - `deliverables/HR-Requirement-Confirmation-Pack/02_Prototype`: อัปเดต Interactive Prototype เป็น 3 แบบประเมิน, หน้าผลไม่มีปุ่มคำแนะนำ, หน้า Admin แสดงผล Unmasked
  - `deliverables/HR-Requirement-Confirmation-Pack/01_เอกสารยืนยันความต้องการระบบประเมินสุขภาพใจ.docx`: สร้างใหม่ผ่าน `tools/build_hr_confirmation_pack.py`
  - `deliverables/HR-Requirement-Confirmation-Pack/05_User_Journey_Admin_EndUser.md`: อัปเดตครบถ้วนทั้ง 24 ขั้นตอนและ Role Matrix
  - Presentations: อัปเดตทั้ง `06_สไลด์นำเสนอ_User_Journey_ระบบประเมินสุขภาพใจ.pptx` และ `Mental_Health_Assessment_User_Journey_Presentation.pptx`
  - Architecture Decision Records: สร้าง `docs/adr/0033-three-assessment-instruments-and-hr-unmasked-visibility.md`

---

### 2026-09-10: Dual Entry Channels Architecture & Portal/Login Prototype Integration
- **User Requirements Addressed:**
  1. **สถาปัตยกรรมทางเข้าพนักงาน 2 รูปแบบ (Dual Entry Channels):**
     - **ทางเข้าที่ 1: OnePlatform App**: ผู้ใช้กดเลือกเมนู "ตรวจสุขภาพใจ" บนแอป OnePlatform -> ระบบทำ SSO ด้วย ONE ID (shareToken) อัตโนมัติ -> **พาไปหน้า "คำชี้แจง" (Step 3) ทันที** (ข้ามหน้า Portal)
     - **ทางเข้าที่ 2: เข้าผ่านเว็บไซต์ตรง**: แสดง **หน้า Portal ตรวจสอบสุขภาพใจ** โดยมีปุ่มให้เลือก 2 ปุ่ม:
       - **2.1 ปุ่ม "ทำแบบประเมิน"**: พาไปหน้า **Login ONE ID (พนักงาน)** -> เมื่อล็อกอินสำเร็จ -> **พาไปหน้า "คำชี้แจง" (Step 3)**
       - **2.2 ปุ่ม "เข้าสู่ระบบผู้ดูแล"**: พาไปหน้า **Login ONE ID (ผู้ดูแลระบบ)** -> เมื่อล็อกอินสำเร็จ -> ตรวจสอบสิทธิ์ -> **พาไปหน้าสิทธิแอดมินนั้นๆ**
  2. **ถอดแบบหน้าจอตรงตามรูปภาพต้นฉบับ 100%:**
     - Portal: Hero Section, โลโก้ Mental Health Check-In, กรมสุขภาพจิต, กราฟิกวงล้อ 6 มิติสุขภาพจิต (ถอดแบบจาก `ตัวอย่างหน้า-portal.png`)
     - Login: Header สีน้ำเงินเข้มโค้งมน, Floating Card, กล่อง Cloudflare Turnstile, โหมดพนักงาน & โหมดผู้ดูแลระบบ (ถอดแบบจาก `ตัวอย่างหน้าlogin.png`)
- **Updates across Codebase:**
  - `02_Prototype/mental-health-ui-prototype.html`:
    - เพิ่มแถบควบคุมจำลองทางเข้า: `📱 1. OnePlatform (SSO ตรงสู่คำชี้แจง)` และ `🌐 2. เว็บไซต์ (หน้า Portal)`
    - เพิ่ม Banner แนะนำและปุ่มสลับจำลอง OnePlatform บนหน้า Portal
    - ปรับปุ่มบน Portal เป็น `2.1 ทำแบบประเมิน (Login ONE ID)` และ `2.2 เข้าสู่ระบบผู้ดูแล (Login ONE ID)`
    - พัฒนาหน้า Login เป็น Dual-Mode Switcher (`👤 2.1 พนักงาน` / `🛡️ 2.2 ผู้ดูแลระบบ`) อัตโนมัติตามปุ่มที่กดมาจากหน้า Portal
    - เชื่อมต่อการนำทาง: ล็อกอินพนักงาน -> คำชี้แจง (Step 3), ล็อกอินแอดมิน -> Admin App ตามสิทธิ์
  - `05_User_Journey_Admin_EndUser.md`: อัปเดตผัง Flowchart, Sequence Diagram และตาราง Step Breakdown 24 สเต็ป
  - `06_สไลด์นำเสนอ_User_Journey_ระบบประเมินสุขภาพใจ.pptx` & `Mental_Health_Assessment_User_Journey_Presentation.pptx`: อัปเดตสไลด์ 2, 3, 4 สะท้อนทางเข้าทั้ง 2 ช่องทางอย่างชัดเจน
  - JavaScript Syntax Verification: 100% Valid (Node.js syntax check passed with 0 errors).

---

### 2026-09-11: Portal Branding & Label Refinement (Mental Health Assessment)
- **User Requirements Addressed:**
  1. **เปลี่ยนชื่อเป็น Mental Health Assessment บนหน้า Portal:**
     - ปรับโลโก้และชื่อหัวตารางเป็น `Mental Health Assessment` (แทนที่ `Mental Health Check-In`)
     - ปรับข้อความในกราฟิกวงล้อ 6 มิติเป็น `MENTAL HEALTH ASSESSMENT` (แทนที่ `CHECK-IN`)
  2. **ตัดออก "กรมสุขภาพจิต กระทรวงสาธารณสุข":**
     - ลบ Badge กรมสุขภาพจิต กระทรวงสาธารณสุข ออกจากหน้า Portal ทั้งหมดเพื่อลบ Branding ของหน่วยงานภายนอก
  3. **ตัดเลขขั้นตอน "2.1" และ "2.2" ออกจากปุ่มและหน้าจอ:**
     - ปุ่มทำแบบประเมิน: เปลี่ยนเป็น `ทำแบบประเมิน (Login ONE ID)` / `ทำแบบประเมิน` (ตัด "2.1" ออก)
     - ปุ่มเข้าสู่ระบบผู้ดูแล: เปลี่ยนเป็น `เข้าสู่ระบบผู้ดูแล (Login ONE ID)` / `เข้าสู่ระบบผู้ดูแล` (ตัด "2.2" ออก)
  4. **นำ INET Logo (logo.jpeg) ไปติดตั้งในทุกจุด:**
     - `apps/employee-web`: ใส่ `logo.jpeg` ใน Navbar ของ `EmployeePortal.vue` และ Header ของ `App.vue` (แทนที่ Leaf icon)
     - `apps/admin-web`: ใส่ `logo.jpeg` ใน Sidebar Brand Header
     - `deliverables/HR-Requirement-Confirmation-Pack/02_Prototype`: ติดตั้ง `logo.jpeg` บน Navbar ของทั้ง `mental-health-ui-prototype.html` และ `portal-and-login-prototype.html`
- **Updates across Codebase:**
  - `apps/employee-web/src/components/EmployeePortal.vue`: ปรับชื่อเป็น Mental Health Assessment, ลบ Badge กรมสุขภาพจิต, ลบ prefix 2.1 และ 2.2 บน Banner และปุ่ม Action, นำ `logo.jpeg` มาแสดงเป็น Brand Logo
  - `apps/employee-web/src/App.vue`: ติดตั้ง `logo.jpeg` บน Header ระบบประเมิน
  - `apps/admin-web/src/App.vue`: ติดตั้ง `logo.jpeg` บน Sidebar ผู้ดูแลระบบ
  - `apps/employee-web/src/components/LoginView.vue`: ปรับปุ่มสลับโหมดพนักงาน/ผู้ดูแลระบบ ลบ 2.1 และ 2.2
  - `deliverables/HR-Requirement-Confirmation-Pack/02_Prototype/mental-health-ui-prototype.html`: ปรับเปลี่ยนครบทุกจุดตรงกับ Vue Component พร้อมใส่ `logo.jpeg`
  - `deliverables/HR-Requirement-Confirmation-Pack/02_Prototype/portal-and-login-prototype.html`: ปรับเปลี่ยนชื่อ โลโก้ และลบ Badge ทั้ง Main Portal และ Mini Preview พร้อมใส่ `logo.jpeg`
  - Build Verification: `npm run build` ผ่าน 100% ทั้ง `employee-web` และ `admin-web`

---

### 2026-09-11: Decoupling Portals & Removing "(Login ONE ID)"
- **User Requirements Addressed:**
  1. **แยกหน้า Portal และหน้า Login ระหว่าง Employee กับ Admin ออกจากกันเด็ดขาด 100%:**
     - **Employee:** มีเฉพาะทางเข้าทำแบบประเมิน `apps/employee-web` (พอร์ต 3000), ปราศจากปุ่ม Admin ปะปนใน Hero Actions, หน้า Login เป็นของพนักงานล้วน (ตัด Mode Switcher Tab และ CAPTCHA ออก)
     - **Admin:** สร้าง `AdminPortalLanding.vue` เฉพาะผู้ดูแลระบบบน `apps/admin-web` (พอร์ต 3001), หน้า Login แยกเฉพาะ Admin พร้อม Cloudflare Turnstile และระบบความปลอดภัยเต็มรูปแบบ
     - **Prototypes:** พัฒนา `portal-and-login-prototype.html` รองรับ 4 หน้าจอแยกอิสระ + Side-by-Side View
  2. **นำข้อความ "(Login ONE ID)" ออกจากทั้งฝั่ง Employee และ Admin:**
     - ปุ่มหลัก Employee: เปลี่ยนจาก `เข้าสู่ระบบเพื่อทำแบบประเมิน (Login ONE ID)` ➔ `เข้าสู่ระบบเพื่อทำแบบประเมิน`
     - ปุ่มหลัก Admin: เปลี่ยนจาก `เข้าสู่ระบบผู้ดูแลระบบ (Admin ONE ID)` ➔ `เข้าสู่ระบบผู้ดูแลระบบ`
     - ปุ่มส่งฟอร์ม Login: ปรับเป็น `เข้าสู่ระบบเพื่อทำแบบประเมิน →` และ `เข้าสู่ระบบผู้ดูแลระบบ →`
     - ลบ Scope Badge / Card Header ที่มี `(Employee ONE ID)` และ `(Admin ONE ID)` ออกให้กระชับ สะอาดตา

### 2026-09-22: Full Alignment of User Journey Presentation Slides (`06_สไลด์นำเสนอ_User_Journey_ระบบประเมินสุขภาพใจ.pptx`)
- **User Requirements Addressed:**
  1. **ปรับข้อมูลในสไลด์นำเสนอให้สอดคล้องกับระบบปัจจุบัน 100%:**
     - อัปเดตไฟล์หลัก `deliverables/HR-Requirement-Confirmation-Pack/06_สไลด์นำเสนอ_User_Journey_ระบบประเมินสุขภาพใจ.pptx` และไฟล์คู่ขนาน `Mental_Health_Assessment_User_Journey_Presentation.pptx`
  2. **แก้ไขความถูกต้องของเนื้อหาในแต่ละสไลด์:**
     - **Slide 2 (Executive Summary):** ลบข้อความหัวข้อย่อยที่ซ้ำซ้อน 3 บรรทัดในกล่องคัดกรอง 3 ด้าน ปรับระบุเครื่องมือมาตรฐานครบ 51 ข้อ (Burnout 22, ST-20 20, 9Q 9 ข้อ) และสะท้อนการแยก 2 เว็บแอปพลิเคชันอย่างสมบูรณ์
     - **Slide 3 (System Architecture):** ปรับหมายเลขขั้นตอนให้ตรงตามผัง 24 ขั้นตอน (Super Admin Steps 6–15, Admin Steps 16–24, พนักงาน Steps 1–5), แก้ไขขั้นตอนที่ระบุซ้ำ `(Step 10) (Step 11)` และจัดตำแหน่งกล่องให้ตรงกับบทบาทจริง
     - **Slide 4 (End User Journey):** แก้ไขจาก `Steps 1–6` เป็น `Steps 1–5`, แก้ไขคำซ้ำ `(Step 4) (Step 4)`, แก้ข้อความเก่า "ทำครบ 5 หน้า" เป็น "ตอบครบทั้ง 3 ชุด (51 ข้อ)", ปรับ "ผลของฉัน" เป็น Step 5 และระบุการเข้าสู่ระบบเพื่อทำแบบประเมินผ่าน Employee Portal ชัดเจน
     - **Slide 5 (Assessment Catalog):** แก้ไขข้อผิดพลาดร้ายแรงเดิมที่นำเกณฑ์ RQ ไปใส่ในกล่อง 9Q โดยปรับเป็นเกณฑ์ 9Q ที่แท้จริง (0–27 คะแนน, 4 ระดับ: <7 ปกติ, 7–12 น้อย, 13–18 ปานกลาง, 19–27 รุนแรง) และลบเศษข้อความตกค้าง `• คะแนน <7: ไม่มีหรือน้อยมาก` ออกจากกล่องสรุปขอบเขต
     - **Slide 7 (Admin User Journey):** ปรับหมายเลขขั้นตอนให้ถูกต้อง (Admin เข้า Dashboard คือ Steps 16–17, กรองข้อมูลคือ Steps 11 และ 19, ตารางรายบุคคล Unmasked พร้อมเข้ารหัสใน DB, Gating Export Steps 12–15 และ 20–24)
     - **Slide 9 (Data Governance):** ลบข้อความที่เอ่ยถึงแบบประเมินเก่า RQ และ 2Q Plus ในหัวข้อคะแนนรวมและระดับผลออกทั้งหมด คงเหลือเฉพาะ 3 เครื่องมือมาตรฐาน (Burnout, Stress ST-20, 9Q)
     - **Slide 11 (Requirement Comparison):** ปรับตารางเปรียบเทียบข้อกำหนด 3 บทบาทให้ระบุทางเข้า 2 ช่องทางของพนักงาน (OnePlatform SSO และเว็บตรง), ระบุ Super Admin เข้า Portal (Step 7) และ Admin เข้า Dashboard โดยตรง (Step 17)
     - **Slide 12 (Next Steps):** เพิ่มการอ้างอิงไฟล์ Prototype ทั้ง 2 ไฟล์ (`mental-health-ui-prototype.html` และ `portal-and-login-prototype.html`)
- **Verification:**
  - รันการตรวจสอบ Text Dump ครบทั้ง 12 สไลด์ของทั้งสองไฟล์ ผ่านการทดสอบ 100% สอดคล้องกับระบบจริงทุกประเด็น

---

### 2026-10-22: System Rebranding & File Renaming to "Employee Well-being Survey"
- **User Requirements Addressed:**
  1. **เปลี่ยนชื่อไฟล์เอกสาร โปรโตไทป์ และสเปก ให้สอดคล้องกับชื่อระบบ Employee Well-being Survey:**
     - `deliverables/Employee Well-being Survey-Confirmation-Pack/`:
       - `employee-well-being-survey-requirements-confirmation.docx` (ปรับ Header เป็น EMPLOYEE WELL-BEING SURVEY และชื่อระบบในเนื้อหา)
       - `employee-well-being-survey-mobile-simulator.html` (อัปเดตลิงก์ภายในไปยัง Prototype และ Presentation)
       - `employee-well-being-survey-ui-prototype.html` (อัปเดตลิงก์ไปยัง Mobile Simulator และชื่อไฟล์ Export)
       - `Employee_Well_Being_Survey_User_Journey_Presentation.pptx` (สไลด์นำเสนอ 12 สไลด์ ปรับชื่อระบบครอบคลุมทุกสไลด์)
       - `Employee-Well-Being-Mobile-UX-Presentation.pptx` (สไลด์นำเสนอ Mobile-First UX)
     - `deliverables/HR-Requirement-Confirmation-Pack/`:
       - เพิ่ม `Employee_Well_Being_Survey_User_Journey_Presentation.pptx` และ `06_สไลด์นำเสนอ_User_Journey_Employee_Well_Being_Survey.pptx`
       - `02_Prototype`: เปลี่ยนชื่อ `employee-well-being-survey-mobile-simulator.html`, `employee-well-being-survey-ui-prototype.html`, `Employee-Well-Being-Mobile-UX-Presentation.pptx` (พร้อมสร้าง Symlink รองรับชื่อเดิม)
       - `04_เอกสารอ้างอิงโครงการ`: เปลี่ยนชื่อ `2026-09-03-employee-well-being-survey-design.md`
     - `docs/specs/`:
       - เปลี่ยนชื่อ `2026-09-05-employee-well-being-survey-spec.md` (พร้อม Symlink)
       - เปลี่ยนชื่อ `docs/superpowers/specs/2026-09-03-employee-well-being-survey-design.md` (พร้อม Symlink)
     - Monorepo `package.json`:
       - ปรับชื่อแพ็กเกจหลักเป็น `employee-well-being-survey-monorepo`
- **Verification:**
  - `npm run build` สำเร็จ 100% ทั้ง `@mental-health/admin-web` และ `@mental-health/employee-web`
  - ตรวจสอบการเชื่อมโยง Hyperlink ภายใน HTML Prototype และ Simulator ทุกจุดทำงานได้อย่างถูกต้อง










