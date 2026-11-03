# ADR-0025: ใช้ Vue, Node.js และ Cloud Deployment

- สถานะ: ยอมรับแล้ว
- วันที่: 2026-09-02

## บริบท

ต้องเลือกเทคโนโลยีให้สอดคล้องกับมาตรฐานและทักษะขององค์กร

## การตัดสินใจ

- Frontend: Vue ecosystem
- Backend: Node.js ecosystem
- Runtime environment: Cloud
- Cloud provider: ยังไม่กำหนด
- Deployment packaging: Container-based และหลีกเลี่ยงการผูกแกนหลักกับบริการเฉพาะค่าย
- Primary database: PostgreSQL

## ผลตามมา

- Employee Assessment Web และ Admin Web ควรใช้ shared design system และ typed API contracts แต่แยก build/deployment ได้
- backend ควรแยก authentication adapters, assessment domain, reporting และ admin operations เป็นโมดูลที่มีขอบเขตชัดเจน
- ยังไม่ตัดสินใจ Vue meta-framework, Node.js framework และ deployment topology
- การเลือกบริการ cloud ต้องรองรับ SLO/RPO/RTO และข้อกำหนดข้อมูลอ่อนไหวที่ตกลงไว้
- ใช้มาตรฐานเปิดสำหรับ database, object storage interface, observability และ secret configuration เพื่อย้าย cloud ได้โดยไม่เปลี่ยน domain logic
- PostgreSQL ใช้ transaction และ constraints บังคับ invariants ของ Draft/Submitted/Cancelled, การส่งหนึ่งครั้งต่อพนักงาน และ audit records
