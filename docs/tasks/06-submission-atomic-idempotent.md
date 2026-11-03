# 06: Submission Confirmation & Atomic Idempotent Submit

**What to build:** The final submission interaction following completion of the 5th assessment (2Q Plus). A confirmation dialog presents options to "กลับไปตรวจสอบ" (review) or "ยืนยันส่งแบบประเมิน" (confirm). Triggering submission executes an atomic, idempotent database transaction that verifies all 74 questions are answered, locks the answers against further modification, captures the employee's current demographic profile as an immutable `EmployeeSnapshot`, and marks the attempt as `Submitted`.

**Blocked by:** 05: Sequential Assessment Flow & Form Validation (ครบ 5 ชุด)

**Status:** closed

- [x] Modal dialog prompts the employee for final confirmation after finishing the 5th assessment
- [x] Submitting executes within a single PostgreSQL transaction with row-level locking on the `AssessmentAttempt`
- [x] System verifies all 74 required answers are present before transitioning state to `Submitted`
- [x] System captures demographic data (name, company, department, position, area, age, tenure) from OnePlatform into `EmployeeSnapshot`
- [x] Submission endpoint (`POST /api/assessment/submit`) is strictly idempotent: duplicate or retried requests return the original submission result without error or duplication
- [x] Answers and attempt state become immutable; any subsequent mutation attempts return an HTTP 409 Conflict error
