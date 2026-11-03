# 15: Audit Logging & 3-Year Data Retention Anonymization

**What to build:** An enterprise audit logging system and automated data retention service. The audit service logs all security and administrative events (logins, individual record views, export downloads, resets, and account modifications) in a tamper-resistant `AuditEvent` store retained for 5 years, strictly prohibiting passwords, tokens, or question answers from logs. An idempotent scheduled background worker identifies assessment records older than 3 years from submission, permanently wipes identifiable employee snapshot fields (name, phone, fine-grained division), and converts records into anonymized statistical summaries.

**Blocked by:** 12: Aggregate Dashboard with Small-Cohort Suppression, 13: Secure Admin Report Export (CSV/Excel & PDF), 14: Admin Reset Assessment Workflow

**Status:** closed

- [x] Audit module captures events (`admin_login`, `admin_view_individual`, `admin_export`, `admin_reset`) with actor, timestamp, IP, and resource context
- [x] Audit logging middleware filters out passwords, `shareToken`, and question-level responses to prevent sensitive data leaks
- [x] Audit events are retained in a dedicated append-only log store for 5 years
- [x] Scheduled retention worker queries for submitted and cancelled assessment records older than 3 years
- [x] Retention job anonymizes records by purging `EmployeeSnapshot` identifiable columns (name, telephone, exact employeeId) while retaining coarse statistical attributes
- [x] Automated tests verify audit trail completeness and idempotent anonymization of 3-year-old records
