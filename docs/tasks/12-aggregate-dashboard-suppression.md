# 12: Aggregate Dashboard with Small-Cohort Suppression

**What to build:** An organizational dashboard visualizing aggregate mental health metrics and level distributions for active `Submitted` assessments based on the currently applied filters. To prevent individual re-identification, the system enforces small-cohort suppression: if the filtered cohort contains fewer than 5 employees (`count < 5`), the backend withholds all numerical counts and percentages, and the UI displays "ข้อมูลไม่เพียงพอสำหรับแสดงสถิติ".

**Blocked by:** 11: Multidimensional Filter Engine

**Status:** closed

- [x] Dashboard API (`GET /api/admin/dashboard`) calculates total submissions, counts/percentages of employees in need of additional care, and level breakdowns per assessment instrument
- [x] Aggregations strictly exclude `Cancelled` attempts
- [x] Small-cohort suppression activates whenever the filtered cohort size is between 1 and 4 employees
- [x] Suppressed response returns `{ suppressed: true, message: "ข้อมูลไม่เพียงพอสำหรับแสดงสถิติ" }` without leaking numeric values
- [x] Admin Web dashboard renders metric cards and distribution charts when cohort ≥ 5, and renders an accessible suppression alert banner when cohort < 5
- [x] Integration tests verify exact calculation accuracy on large cohorts and strict data withholding on cohorts under 5
