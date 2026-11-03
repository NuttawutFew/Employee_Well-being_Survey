# 08: One-Time Assessment Invariant & Draft Management

**What to build:** System invariants enforcing the one-time assessment rule per employee lifetime and draft management capabilities. An employee who has already submitted an assessment is permanently prevented from creating a new draft or submitting again; upon subsequent login, the system automatically redirects them to their existing result summary page. For an unsubmitted active draft, the UI offers a "ล้างคำตอบและเริ่มใหม่" (clear draft and restart) action that wipes current draft answers and resets to the notice stage.

**Blocked by:** 07: Scoring Engine & Employee Result Summary View

**Status:** closed

- [x] Database constraint and API logic enforce at most one `Submitted` (and not `Cancelled`) attempt per `employeeId` across the system lifetime
- [x] Database constraint enforces at most one active `Draft` per `employeeId`
- [x] When an employee with an existing `Submitted` attempt logs in, Employee Web automatically redirects to the Result Summary view
- [x] Employee Web displays a "ล้างคำตอบและเริ่มใหม่" button on Draft screens
- [x] Triggering clear draft wipes all answered questions and resets the attempt to unacknowledged notice state
- [x] Integration tests verify that submitted employees cannot create drafts or submit duplicate attempts
