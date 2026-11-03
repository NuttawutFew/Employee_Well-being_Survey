# 03: Pre-Assessment Notice & Draft Initialization

**What to build:** A pre-assessment disclosure screen presented immediately after employee authentication. The page clearly explains the screening scope, the 5 assessment instruments, HR aggregate/individual access rules, and the 3-year data retention policy. When the employee clicks "รับทราบและเริ่มทำแบบประเมิน", the backend persists the acknowledgment event (with notice version and timestamp) and creates the employee's active `Draft` in PostgreSQL.

**Blocked by:** 01: Monorepo Baseline & Health Probe (Ticket 02 skipped; uses mock employee session for dev)

**Status:** closed

- [x] Employee Web displays the pre-assessment notice with all required PDPA disclosures and screening limitations
- [x] Backend forbids creating a draft or saving answers before explicit notice acknowledgment
- [x] Clicking "รับทราบและเริ่มทำแบบประเมิน" sends acknowledgment to `POST /api/assessment/notice/acknowledge`
- [x] Backend creates or loads the employee's active `Draft` assessment record (`AssessmentAttempt` in `Draft` status) with current catalog bundle version
- [x] Employee Web navigates smoothly to the first assessment upon successful draft creation
- [x] Automated tests verify that unacknowledged sessions cannot access or create drafts
