# 10: Admin Individual Results Table & Employee Search

**What to build:** An administrative tabular view displaying all submitted employee assessment records. Each row presents the submission date, captured `EmployeeSnapshot` details (name, employee ID, company, department, position, area, age, tenure), and evaluated score levels for all 5 assessments. Individual question-level answers are strictly excluded from API responses and the UI. The table supports server-side pagination, column sorting, and text searching by employee ID or employee name.

**Blocked by:** 06: Submission Confirmation & Atomic Idempotent Submit, 09: Admin Internal Authentication & Session Shell

**Status:** closed

- [x] Admin API endpoint (`GET /api/admin/assessments`) serves paginated assessment records joined with `EmployeeSnapshot` and evaluated results
- [x] API responses strictly exclude question-level answers (`Answer` entities) to protect employee privacy
- [x] Table displays submission date, employee identity/demographics, and categorical levels for Burnout, Stress, RQ, 9Q, and 2Q Plus
- [x] Search input filters records in real-time by employee ID or employee first/last name
- [x] Table headers support ascending and descending sort on submission date and demographic fields
- [x] Integration tests verify pagination, sorting, search accuracy, and total absence of raw question answers
