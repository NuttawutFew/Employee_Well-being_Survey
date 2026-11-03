# ชุดเอกสารสำหรับ HR ตรวจสอบและยืนยัน Requirement

วันที่จัดทำ: 3 กันยายน 2569  
สถานะ: Draft for Confirmation

## ลำดับการตรวจ

1. เปิด `01_เอกสารยืนยันความต้องการระบบประเมินสุขภาพใจ.docx`
2. เปิด Prototype ใน `02_Prototype/employee-well-being-survey-ui-prototype.html` ด้วยเว็บเบราว์เซอร์
3. เปรียบเทียบรายละเอียดแบบประเมินกับไฟล์ต้นฉบับใน `03_แบบประเมินต้นฉบับ`
4. ศึกษาเส้นทางผู้ใช้งานใน `05_User_Journey_Admin_EndUser.md` และสไลด์นำเสนอ `Employee_Well_Being_Survey_User_Journey_Presentation.pptx` (หรือ `06_สไลด์นำเสนอ_User_Journey_ระบบประเมินสุขภาพใจ.pptx`)
5. ตรวจสอบข้อกำหนดด้านความปลอดภัย (หัวข้อ 10): การเข้ารหัส PII, การ Masking บนรายงาน, การยืนยันรหัสผ่านเพื่อ Export Excel และ Retention 1 ปี / Audit 2 ปี
6. ให้ผู้รับผิดชอบแต่ละด้านตรวจรายการ C-01 ถึง C-06 ในหัวข้อ 12 และร่วมลงนามยืนยัน

## ผู้ที่ควรตรวจ

- HR / ผู้ว่าจ้าง: ขอบเขต ขั้นตอนใช้งาน Dashboard ตัวกรอง และรายงาน
- ผู้เชี่ยวชาญด้านสุขภาพจิต / เจ้าของแบบประเมิน: คำถาม การให้คะแนน เกณฑ์ผล และคำแนะนำ
- PDPA / กฎหมาย: หน้าชี้แจง สิทธิ์เข้าถึง มาตรการ PII Encryption, UI Masking, Retention 1 ปี และการส่งออกข้อมูล
- IT / Information Security: OnePlatform SSO, การ Login ผ่าน OneID และ Map สิทธิ์ Admin, Audit Log 2 ปี, Availability, RTO/RPO
- ทีมพัฒนา: ความเป็นไปได้ทางเทคนิค Acceptance Criteria และรายการยืนยัน C-01 ถึง C-06

## โครงสร้างโฟลเดอร์

- `01_เอกสารยืนยันความต้องการระบบประเมินสุขภาพใจ.docx` — เอกสารหลักสำหรับตรวจและลงนามยืนยัน
- `02_Prototype` — UX/UI Prototype แบบโต้ตอบ:
  - `portal-and-login-prototype.html` — Prototype หน้า Portal และหน้า เข้าสู่ระบบ (Admin/Organization Login) ตรงตามตัวอย่างภาพล่าสุด
  - `employee-well-being-survey-ui-prototype.html` — Interactive Prototype ครบวงจร (Notice, แบบประเมิน 3 ชุด, ผลประเมิน, Admin Dashboard/Table พร้อม UI Masking, PII Unmask และ Export Password Modal)
  - `employee-well-being-survey-mobile-simulator.html` — Mobile Phone Simulator สำหรับทดสอบการแสดงผลบนโทรศัพท์มือถือ
  - `Employee-Well-Being-Mobile-UX-Presentation.pptx` — สไลด์นำเสนอ Mobile-First UX
- `03_แบบประเมินต้นฉบับ` — เอกสารแบบประเมินต้นฉบับ 3 ชุดมาตรฐาน (แบบประเมินภาวะหมดไฟในการทำงาน (Burnout) — 22 ข้อ, แบบประเมินความเครียด (ST-20) — 20 ข้อ, แบบประเมินโรคซึมเศร้า (9Q) — 9 ข้อ)
- `04_เอกสารอ้างอิงโครงการ` — Design Specification, Domain Model และ Glossary
- `05_User_Journey_Admin_EndUser.md` — เส้นทางผู้ใช้งานอย่างละเอียดทั้งฝั่ง End User และ Admin
- `06_สไลด์นำเสนอ_User_Journey_ระบบประเมินสุขภาพใจ.pptx` — สไลด์นำเสนอ 12 สไลด์สำหรับผู้บริหาร

> Prototype และข้อมูลพนักงาน 8 รายเป็นข้อมูลจำลอง ไม่ใช่ระบบ Production

