# 05: Sequential Assessment Flow & Form Validation (ครบ 5 ชุด)

**What to build:** An end-to-end multi-assessment workflow that guides the employee sequentially through all 5 assessment instruments: 1. Burnout (22 items), 2. Stress (20 items), 3. RQ (20 items), 4. 9Q (9 items), and 5. 2Q Plus (3 items) across 5 dedicated pages. The system enforces completion of every question on the current page before advancing: submitting an incomplete page displays an error summary and automatically scrolls to and focuses on the first unanswered question. Employees can navigate back to earlier assessments to modify responses while in Draft status.

**Blocked by:** 04: Assessment Form Engine & Autosave (Burnout 22 ข้อ)

**Status:** closed

- [x] All 5 assessment instruments are defined with correct questions and options in the catalog
- [x] Fixed sequential navigation enforces the strict order: Burnout → Stress → RQ → 9Q → 2Q Plus
- [x] Each assessment displays on its own single page with full question list
- [x] Attempting to proceed with unanswered questions blocks navigation, displays validation errors, and scrolls/focuses to the first unanswered item
- [x] Employees can navigate back to previous pages, change answers, and have updates persisted automatically
- [x] Server-side validation rejects navigation or answers out of sequence
