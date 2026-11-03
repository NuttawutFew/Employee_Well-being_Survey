# ADR-0023: รองรับพนักงาน 5,000 คนและ concurrent users 500 คน

- สถานะ: ยอมรับแล้ว
- วันที่: 2026-09-02

## บริบท

ต้องกำหนดขนาดระบบเพื่อออกแบบ capacity, indexing, autosave และการทดสอบประสิทธิภาพให้เหมาะสมโดยไม่สร้างสถาปัตยกรรมเกินจำเป็น

## การตัดสินใจ

- จำนวนพนักงานเป้าหมาย: 5,000 คน
- ผู้ใช้งานพร้อมกันสูงสุด: 500 คน

## ผลตามมา

- load test ต้องจำลองอย่างน้อย 500 concurrent users พร้อม safety margin ที่ตกลงในแผนทดสอบ
- scenario หลักของ load test ได้แก่ login/profile exchange, โหลด Draft, autosave คำตอบ, ส่งรอบประเมิน และโหลด dashboard
- endpoint autosave และ submit ต้องรองรับ idempotency และ connection pool ที่เหมาะสม
- dashboard ต้องมี index/aggregation ที่ตอบสนองได้โดยไม่ lock ตารางคำตอบ
- สถาปัตยกรรมเริ่มต้นสามารถใช้ application service และ relational database ที่ scale แนวนอนได้ตามความจำเป็น โดยยังไม่ต้องใช้ microservices
