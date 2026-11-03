# 07: Scoring Engine & Employee Result Summary View

**What to build:** A deterministic scoring calculation and result presentation module. The scoring engine calculates raw scores and categorized levels for all 5 assessments: Burnout (3 dimensions with inverted scoring for Personal Accomplishment items 4, 7, 9, 12, 17, 18, 19, 21), Stress (5 levels), RQ (3 dimensions and total score with inverted items 1, 5, 14, 15, 16), 9Q (4 levels), and 2Q Plus (two distinct outputs: Depression Risk and Suicide Risk). The Employee Result Summary page displays the overall status ("ควรได้รับการดูแลสุขภาพใจเพิ่มเติม" or normal), prominent suicide risk alert if positive, 5 result cards, and approved recommendation text.

**Blocked by:** 06: Submission Confirmation & Atomic Idempotent Submit

**Status:** closed

- [x] Scoring engine calculates Burnout across 3 dimensions with reversed scoring 6–0 on items 4, 7, 9, 12, 17, 18, 19, 21 per ADR-0015
- [x] Scoring engine calculates Stress (0–60) into 5 levels per clinical thresholds
- [x] Scoring engine calculates RQ across 3 dimensions and total score with reverse items 1, 5, 14, 15, 16 per ADR-0014
- [x] Scoring engine calculates 9Q into 4 levels, treating item 9 solely as part of the total score
- [x] Scoring engine evaluates 2Q Plus into two independent outputs: Depression Risk (items 1 or 2 positive) and Suicide Risk (item 3 positive) per ADR-0016
- [x] Overall status determines "ควรได้รับการดูแลสุขภาพใจเพิ่มเติม" if any dimension criteria is met; suicide risk alert takes top priority if 2Q Plus item 3 is positive per ADR-0013
- [x] Employee Web displays summary page with overall status badge, 5 assessment cards, evaluated levels, and approved recommendation text
- [x] Golden unit test suite verifies calculations against all threshold boundary edge cases
