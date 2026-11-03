# 14: Admin Reset Assessment Workflow

**What to build:** An administrative workflow allowing HR/Admin to reset an employee's submitted assessment so the employee can take the assessment again. The Admin provides a mandatory reason and confirms the action. The backend marks the existing `Submitted` attempt as `Cancelled`, writes a permanent `AdminReset` audit entry, and immediately clears the employee's single-submission lock so they can initialize a new `Draft` upon next login. The cancelled attempt remains stored as an immutable audit record and is excluded from dashboards.

**Blocked by:** 08: One-Time Assessment Invariant & Draft Management, 10: Admin Individual Results Table & Employee Search

**Status:** closed

- [x] Admin Web displays a "รีเซ็ตผลการประเมิน" action button on individual employee detail views
- [x] Confirmation dialog mandates entering a specific reason before the reset can be executed
- [x] Reset endpoint (`POST /api/admin/assessments/:id/reset`) transitions attempt status to `Cancelled`
- [x] System records an `AdminReset` record containing `cancelledAttemptId`, `adminId`, `reason`, and `timestamp`
- [x] Cancelled attempts are immediately excluded from active dashboard metrics and standard individual listings
- [x] When the affected employee logs back in to Employee Web, they can create a new `Draft` and retake the assessment
- [x] Integration tests verify the full reset lifecycle, immutable preservation of cancelled records, and unblocking of the employee
