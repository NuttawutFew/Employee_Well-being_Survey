# ADR-0030: ใช้ Modular Monolith พร้อมสอง Vue Web Apps

- สถานะ: ยอมรับแล้ว
- วันที่: 2026-09-02

## บริบท

ระบบมีเว็บพนักงานและเว็บ Admin แยกกัน แต่ใช้ข้อมูลและกฎการประเมินร่วมกัน รองรับพนักงาน 5,000 คนและผู้ใช้พร้อมกัน 500 คน โดยทีมกำหนด Vue, Node.js, PostgreSQL และ cloud-neutral containers

## ทางเลือก

1. Modular Monolith: สอง Vue SPAs, Node.js API ชุดเดียวแบ่งโมดูล, PostgreSQL
2. แยก Employee API และ Admin API ตั้งแต่ต้น
3. Microservices แยก Identity, Assessment, Reporting และ Admin Operations

## การตัดสินใจ

เลือก Modular Monolith ใน monorepo:

- `employee-web` — Vue application
- `admin-web` — Vue application
- `api` — Node.js modular application
- `shared-contracts` — API types และ validation schemas
- PostgreSQL — transactional system of record
- Object storage — ไฟล์ export ชั่วคราว

## เหตุผล

- รองรับขนาดเป้าหมายได้โดยไม่เพิ่ม operational complexity ของ distributed transactions และหลาย deployments
- กฎคะแนนและสถานะใช้ร่วมกันได้จาก domain module เดียว
- สองเว็บยังแยก UX, session และ deployment ได้
- ขอบเขตโมดูลช่วยให้แยก service ภายหลังได้หากมีเหตุผลจริง

## ผลตามมา

- ห้ามให้โมดูลเข้าถึงตารางของกันโดยไม่มี domain interface ที่กำหนด
- Employee และ Admin endpoints ต้องแยก route/auth guard ชัดเจน
- background jobs อยู่ใน deployable เดียวกันได้ในช่วงแรก แต่ต้องมี locking/idempotency
- ไม่ใช้ microservices ในเวอร์ชันแรก
