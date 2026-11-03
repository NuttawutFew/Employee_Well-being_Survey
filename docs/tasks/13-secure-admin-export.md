# 13: Secure Admin Report Export (CSV/Excel & PDF)

**What to build:** An administrative export service generating downloadable CSV, Excel, and PDF reports matching the active multidimensional filters. Export files contain submission dates, demographic snapshots, and evaluated score levels, while strictly omitting question-level answers. Downloads are delivered via short-lived authenticated URLs (expiring in 15 minutes) with a prominent sensitive data warning, and every export action is recorded in the audit log.

**Blocked by:** 11: Multidimensional Filter Engine

**Status:** closed

- [x] Export endpoint generates CSV/Excel and PDF formats corresponding to current filter parameters
- [x] Export files include metadata warning: "เอกสารข้อมูลสุขภาพส่วนบุคคลที่มีความอ่อนไหว — ห้ามเผยแพร่ต่อผู้ไม่มีสิทธิ์"
- [x] Raw question answers are excluded from all generated export files
- [x] If small-cohort suppression applies to aggregate exports, suppressed data is omitted or flagged accordingly
- [x] Files are stored temporarily in object storage with pre-signed URLs expiring after 15 minutes
- [x] System writes an audit event recording the admin user, timestamp, filter criteria, and export file type
- [x] Automated tests verify file contents, omission of raw answers, expiration of download links, and audit logging
