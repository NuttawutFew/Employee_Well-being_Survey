# 11: Multidimensional Filter Engine

**What to build:** A multidimensional filtering engine accessible across administrative views. HR/Admin can filter assessment records across multiple criteria: submission date range, organization units (company, department, position, work area), demographics (gender, age bracket), tenure brackets (`<1 ปี`, `1–3 ปี`, `3–5 ปี`, `>5 ปี`), overall status, and specific assessment score levels. The filter engine applies logical `OR` within each dimension and logical `AND` across separate dimensions.

**Blocked by:** 10: Admin Individual Results Table & Employee Search

**Status:** closed

- [x] Filter panel UI allows selecting criteria across all required demographic and clinical dimensions
- [x] Backend query builder constructs dynamic SQL applying `OR` for multiple values in the same dimension and `AND` across different dimensions
- [x] Filter handles tenure brackets (`<1 ปี`, `1–3 ปี`, `3–5 ปี`, `>5 ปี`) dynamically based on snapshot start dates
- [x] Filter state synchronizes cleanly with URL query parameters for bookmarkable and shareable views
- [x] Reset filters action restores the default unfiltered view
- [x] Automated tests verify complex filter combinations and SQL injection safety
