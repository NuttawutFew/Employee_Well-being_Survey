# 04: Assessment Form Engine & Autosave (Burnout 22 ข้อ)

**What to build:** The questionnaire form engine on Employee Web displaying the first assessment instrument (Burnout, 22 questions) on a single responsive page. Selecting an answer immediately persists the response via an autosave endpoint on the backend. The UI provides real-time save indicators ("กำลังบันทึก...", "บันทึกแล้ว") and error retry handling if a network failure occurs, without erasing user selections.

**Blocked by:** 03: Pre-Assessment Notice & Draft Initialization

**Status:** closed

- [x] Assessment catalog serves question text and 0–6 frequency options for all 22 Burnout items
- [x] Employee Web displays all 22 items on a single scrollable page designed mobile-first
- [x] Answer selections trigger an immediate debounced autosave (`PUT /api/assessment/draft/answers`)
- [x] UI displays an accessible saving status indicator ("กำลังบันทึก...", "บันทึกเรียบร้อย")
- [x] Network errors trigger an inline warning ("ไม่สามารถบันทึกได้ โปรดลองอีกครั้ง") with a manual retry button
- [x] Reloading the page or logging in from another device restores all previously saved draft answers
