# Domain Model: ระบบประเมินสุขภาพใจ

เอกสารนี้ปรับปรุงระหว่างการออกแบบและต้องอ่านร่วมกับ ADR ใน `docs/adr/`

## Bounded Contexts / Modules

### Employee Identity

รับ `shareToken` จาก OnePlatform แลกโปรไฟล์ และสร้าง employee session โดยใช้รหัสพนักงานคงที่เป็น identity

### Admin Identity

จัดการการเข้าสู่ระบบด้วยบัญชี OneID และ map สิทธิ์ Admin ในระบบ (2FA อยู่นอก Scope ระยะแรก) พร้อมการยืนยันรหัสผ่านเพื่อ Export ข้อมูล

### Assessment Catalog

เก็บนิยามแบบประเมิน versioned ได้แก่ คำชี้แจง คำถาม ตัวเลือก scoring rules thresholds และข้อความผลตาม locale

### Assessment Session

ดูแล lifecycle ของการประเมินหนึ่งครั้งต่อพนักงาน: Notice Acknowledged → Draft → Submitted หรือ Submitted → Cancelled → Draft ใหม่โดย Admin Reset

### Scoring

คำนวณผล Burnout 3 มิติ, Stress, RQ 3 มิติและคะแนนรวม, 9Q และ 2Q Plus 2 ด้าน ด้วยกฎ deterministic ตาม assessment version

### Results

สร้างผลรายแบบ สถานะภาพรวม และ employee snapshot ณ เวลาส่ง โดยไม่รวมคะแนนต่างเครื่องมือเป็นคะแนนเดียว

### Reporting

ให้บริการตารางรายบุคคล (พร้อม Masking ชื่อ-สกุล และรหัสพนักงาน) dashboard ตัวกรอง small-cohort suppression และ export เฉพาะไฟล์ Excel โดยใช้เฉพาะ Submitted ที่ยังไม่ถูก Cancelled

### Audit & Retention

บันทึกเหตุการณ์ด้านสิทธิ์และการจัดการข้อมูล (Login, View/Export, Reset, และทุก Event ของ Admin) ดำเนินการ anonymization หลัง 1 ปี และเก็บ audit log 2 ปี

## Core Entities

### Employee

- `employeeId` — stable identifier จาก OnePlatform
- profile ปัจจุบันสำหรับแสดงผลระหว่าง session

### AssessmentDefinition

- `assessmentCode`
- `version`
- `locale`
- questions/options
- scoring and interpretation rules
- effective status

### AssessmentAttempt

- `attemptId`
- `employeeId`
- `definitionBundleVersion`
- `status`: Draft | Submitted | Cancelled
- current assessment/page
- notice version/acknowledged time
- submitted/cancelled timestamps

### Answer

- `attemptId`
- `questionCode`
- `optionCode`
- saved timestamp/version

### AssessmentResult

- `attemptId`
- assessment/dimension code
- raw score
- level code
- scoring version

### EmployeeSnapshot

โปรไฟล์ ณ เวลาส่ง: รหัส ชื่อ นามสกุล เพศ อายุ เบอร์โทร บริษัท แผนก ตำแหน่ง พื้นที่ และอายุงาน (เข้ารหัส PII: ชื่อ–นามสกุล, เพศ, อายุ, รหัสพนักงาน ในฐานข้อมูล และแสดงผลแบบ Masking บนรายงาน)

### AdminAccount

- corporate OneID account และ mapped Admin role ในระบบ (2FA อยู่นอก Scope ระยะแรก)
- authorization session และการยืนยันรหัสผ่านบัญชีผู้ใช้ก่อน Export

### AdminReset

- cancelled attempt
- replacement attempt
- actor/time/reason

### AuditEvent

- actor/action/target/time/context บันทึกทุก Event การทำงานของผู้ดูแลระบบ (Login, ดู/Export ข้อมูล, คืนสิทธิ์) โดยไม่มีคำตอบ password หรือ shareToken

## Invariants

- พนักงานมี Submitted ที่ยังไม่ Cancelled ได้สูงสุดหนึ่งรายการตลอดอายุระบบ
- มี Draft ที่ active ได้สูงสุดหนึ่งรายการต่อพนักงาน
- Submitted แก้คำตอบหรือคะแนนไม่ได้
- Admin Reset เปลี่ยน Submitted เป็น Cancelled และสร้างสิทธิ์สำหรับ Draft ใหม่ โดยไม่ลบประวัติเดิม
- ผลและ employee snapshot ถูกสร้างร่วมกันใน transaction ตอน submit
- dashboard ไม่นับ Cancelled และระงับสถิติเมื่อกลุ่มเล็กกว่า 5 คน
- เข้ารหัส (Encrypt) ข้อมูล PII ในระบบ: ชื่อ–นามสกุล, เพศ, อายุ, รหัสพนักงาน
- แสดงผลแบบ Masking ชื่อ-นามสกุล และรหัสพนักงาน บนหน้าจอรายงาน
- Export ได้เฉพาะไฟล์ Excel โดยต้องยืนยันรหัสผ่านบัญชีผู้ใช้ซ้ำก่อนดาวน์โหลด
- Retention ข้อมูลระบุตัวตน 1 ปี (Anonymize) และ Audit Log 2 ปี
