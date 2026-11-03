# ADR-0024: เป้าหมาย Availability และ Disaster Recovery

- สถานะ: ยอมรับแล้ว
- วันที่: 2026-09-02

## บริบท

ระบบบันทึก Draft อัตโนมัติและอาจมีผู้ใช้พร้อมกันจำนวนมากในช่วงเปิดประเมิน จึงต้องมีเป้าหมายด้านความพร้อมใช้งานและการกู้คืนที่วัดผลได้

## การตัดสินใจ

- Availability target: 99.9%
- Recovery Time Objective (RTO): 4 ชั่วโมง
- Recovery Point Objective (RPO): 15 นาที

## ผลตามมา

- ต้องมี health checks, metrics, structured logs และ alerting สำหรับ flow สำคัญ
- ฐานข้อมูลต้องสำรองหรือ replicate ตามความถี่ที่ทำให้บรรลุ RPO 15 นาที
- ต้องจัดทำและทดสอบขั้นตอน restore เป็นระยะ ไม่ถือว่าการมี backup เพียงอย่างเดียวเพียงพอ
- maintenance window และนิยาม downtime ต้องระบุใน operational runbook
- ห้ามใส่คำตอบหรือข้อมูลอ่อนไหวลง monitoring labels และ application logs
