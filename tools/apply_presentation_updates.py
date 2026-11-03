import collections.abc
import pptx
import copy
import os

def update_presentation_file(file_path):
    print(f"Loading presentation: {file_path}")
    prs = pptx.Presentation(file_path)
    
    def set_shape_paragraphs(shape, lines):
        txBody = shape.text_frame._txBody
        p_elements = list(txBody.iterchildren('{http://schemas.openxmlformats.org/drawingml/2006/main}p'))
        
        for idx, line in enumerate(lines):
            if idx < len(p_elements):
                shape.text_frame.paragraphs[idx].text = line
            else:
                new_p = copy.deepcopy(p_elements[-1])
                txBody.append(new_p)
                shape.text_frame.paragraphs[idx].text = line
        
        while len(shape.text_frame.paragraphs) > len(lines):
            extra_p = shape.text_frame.paragraphs[-1]
            txBody.remove(extra_p._p)

    # -------------------------------------------------------------------------
    # SLIDE 2: Executive Summary (Index 1)
    # -------------------------------------------------------------------------
    s2 = prs.slides[1]
    # Shape 6 (Rounded Rectangle 7): 📱 แยก 2 เว็บแอปพลิเคชัน
    set_shape_paragraphs(s2.shapes[6], [
        '📱 แยก 2 เว็บแอปพลิเคชันอย่างสมบูรณ์',
        '• Employee Web (Mobile-First): OnePlatform SSO เข้าสู่หน้าคำชี้แจงโดยตรง หรือเข้าเว็บ Employee Portal ➔ เข้าสู่ระบบเพื่อทำแบบประเมิน ➔ รับทราบ (Step 3)',
        '• Admin Web (Role Hierarchy): เข้าสู่ระบบผู้ดูแลระบบ (+ Turnstile) ➔ Super Admin Portal (Step 7) หรือเข้าสู่ Dashboard โดยตรง (Admin Step 17)'
    ])
    
    # Shape 7 (Rounded Rectangle 8): 🧠 คัดกรอง 3 ด้านตามหลักจิตวิทยา
    set_shape_paragraphs(s2.shapes[7], [
        '🧠 คัดกรอง 3 ด้านตามหลักจิตวิทยา (รวม 51 ข้อ)',
        '• ภาวะหมดไฟในการทำงาน (Burnout - 22 ข้อ, 3 มิติ EE/DP/PA)',
        '• ความเครียด (ST-20 - 20 ข้อ, จำแนก 5 ระดับเกณฑ์คลินิก)',
        '• โรคซึมเศร้า (9Q - 9 ข้อ, จำแนก 4 ระดับความรุนแรง)',
        '• ปรับลดจากเดิม 5 ชุด เหลือ 3 ชุด ใช้เวลาเพียง ~8–10 นาที (ตัด RQ และ 2Q Plus ออก)'
    ])

    # -------------------------------------------------------------------------
    # SLIDE 3: System Architecture (Index 2)
    # -------------------------------------------------------------------------
    s3 = prs.slides[2]
    # Subtitle
    s3.shapes[2].text_frame.paragraphs[0].text = 'สถาปัตยกรรมและจุดเชื่อมต่อระหว่าง 3 ผู้ใช้งาน (3 Swimlanes 24 ขั้นตอน)'
    s3.shapes[3].text_frame.paragraphs[0].text = 'แสดงการเชื่อมโยงของ พนักงาน, Super Admin และ Admin พร้อมมาตรการ PDPA & Security'
    
    # Employee flow boxes
    # Shape 7 (Rounded Rectangle 8): Box 1
    set_shape_paragraphs(s3.shapes[7], [
        '1. ทางเข้า 2 ช่องทาง (Steps 1–2)',
        'OnePlatform SSO (Step 1, 1.1)',
        'หรือ เว็บ Employee Portal (Step 2, 2.1)'
    ])
    # Shape 8 (Rounded Rectangle 9): Box 2
    set_shape_paragraphs(s3.shapes[8], [
        '2. รับทราบ Consent (Step 3)',
        'อ่านคำชี้แจง PDPA',
        'กดปุ่ม \'รับทราบ\' (ปุ่มเดียว)'
    ])
    # Shape 9 (Rounded Rectangle 10): Box 3
    set_shape_paragraphs(s3.shapes[9], [
        '3. ทำแบบประเมิน 3 ชุด (Step 4)',
        'รวม 51 ข้อ Autosave',
        'ย้อนกลับตรวจทานแก้ไขได้'
    ])
    # Shape 10 (Rounded Rectangle 11): Box 4
    set_shape_paragraphs(s3.shapes[10], [
        '4. ยืนยันการส่งผล (Submit)',
        'Double Confirmation Modal',
        'ล็อกผลสถานะ Submitted'
    ])
    # Shape 11 (Rounded Rectangle 12): Box 5
    set_shape_paragraphs(s3.shapes[11], [
        '5. แสดงผลสรุป (Step 5)',
        'ผล 3 ด้าน (ตัดคำแนะนำออก)',
        'สายด่วน 1323 / สะมาริตันส์'
    ])

    # Admin flow boxes
    # Shape 14 (Rounded Rectangle 15): Box 1
    set_shape_paragraphs(s3.shapes[14], [
        '1. Login & Portal ผู้ดูแล',
        'Login ONE ID (Step 6, 16)',
        'Super Admin Portal (Step 7)'
    ])
    # Shape 15 (Rounded Rectangle 16): Box 2
    set_shape_paragraphs(s3.shapes[15], [
        '2. กำหนดสิทธิ์ Admin (Step 10)',
        'มอบ/ถอนสิทธิ์ Export',
        'Export รายชื่อ / บันทึก Log'
    ])
    # Shape 16 (Rounded Rectangle 17): Box 3
    set_shape_paragraphs(s3.shapes[16], [
        '3. Dashboard องค์กร',
        'ดูสถิติ 3 มิติ (Step 9, 17)',
        'ระงับสถิติถ้า <5 คน (Suppression)'
    ])
    # Shape 17 (Rounded Rectangle 18): Box 4
    set_shape_paragraphs(s3.shapes[17], [
        '4. กรอง & ตารางรายบุคคล',
        'ฟิลเตอร์ 52 บ. (Step 11, 19)',
        'HR ดู Unmasked (Dev เข้ารหัส DB)'
    ])
    # Shape 18 (Rounded Rectangle 19): Box 5
    set_shape_paragraphs(s3.shapes[18], [
        '5. Export & ยืนยันรหัสผ่าน',
        'ซ่อนปุ่มถ้าไร้สิทธิ์ (Step 21)',
        'Excel/CSV ยืนยันรหัส (Steps 12-15, 20-24)'
    ])

    # -------------------------------------------------------------------------
    # SLIDE 4: User Journey: End User (Index 3)
    # -------------------------------------------------------------------------
    s4 = prs.slides[3]
    # Subtitle: Steps 1-5 (not 1-6)
    s4.shapes[2].text_frame.paragraphs[0].text = 'เส้นทางของพนักงานในการทำแบบประเมิน (Steps 1–5)'
    
    # Shape 6 (Rounded Rectangle 7): ขั้นที่ 1
    set_shape_paragraphs(s4.shapes[6], [
        'ขั้นที่ 1',
        'ทางเข้า 2 ช่องทาง (Steps 1–2)',
        '• ทางเข้า 1: OnePlatform App (Step 1, 1.1)',
        '  - เมนู \'ตรวจสุขภาพใจ\' SSO shareToken ตรงสู่คำชี้แจง (ข้าม Portal)',
        '• ทางเข้า 2: เว็บไซต์ Employee Portal (Step 2, 2.1)',
        '  - เข้าหน้า Employee Portal กด \'เข้าสู่ระบบเพื่อทำแบบประเมิน\'',
        '  - ลงชื่อเข้าใช้ด้วย ONE ID พนักงาน ➔ นำสู่หน้าคำชี้แจง (Step 3)'
    ])
    
    # Shape 7 (Rounded Rectangle 8): ขั้นที่ 2
    set_shape_paragraphs(s4.shapes[7], [
        'ขั้นที่ 2',
        'คำชี้แจง & รับทราบ (Step 3)',
        '• แสดงคำชี้แจงและนโยบาย PDPA (Step 3)',
        '• แจ้งชัดเจนว่า HR เข้าถึงผลสรุปได้ เพื่อการดูแลสุขภาวะ',
        '• ย้ำว่าเป็นการคัดกรองเบื้องต้น ไม่ใช่การวินิจฉัยโรค',
        '• มีปุ่มเดี่ยว \'รับทราบ\' เพื่อเริ่มทำแบบประเมิน'
    ])
    
    # Shape 8 (Rounded Rectangle 9): ขั้นที่ 3
    set_shape_paragraphs(s4.shapes[8], [
        'ขั้นที่ 3',
        'ตอบคำถาม 3 ชุด (Step 4)',
        '• ทำแบบประเมินตามลำดับ (51 ข้อ: Burnout, Stress, 9Q)',
        '• Autosave ทุกข้อ ปิดแล้วกลับมาทำต่อได้ในสถานะ Draft',
        '• ย้อนกลับไปตรวจทานหรือล้างคำตอบเริ่มใหม่ได้',
        '• หากตอบไม่ครบ ระบบ Scroll และ Focus ชี้เป้าข้อที่ขาดให้ทันที'
    ])
    
    # Shape 9 (Rounded Rectangle 10): ขั้นที่ 4
    set_shape_paragraphs(s4.shapes[9], [
        'ขั้นที่ 4',
        'ยืนยันส่งผล (Submit Confirmation)',
        '• ตอบครบทั้ง 3 ชุด (51 ข้อ) ระบบแสดงกล่องยืนยันส่งผล',
        '• มีตัวเลือก \'กลับไปตรวจทาน\' หรือ \'ยืนยันส่งผล\'',
        '• ส่งสำเร็จ: ล็อกคำตอบสถานะ Submitted ถาวร (ห้ามแก้ไข)',
        '• กลไก Idempotent ป้องกันการกดส่งซ้ำหรือส่งข้อมูลซ้ำซ้อน'
    ])
    
    # Shape 10 (Rounded Rectangle 11): ขั้นที่ 5
    set_shape_paragraphs(s4.shapes[10], [
        'ขั้นที่ 5',
        'แสดงผลสรุปแบบประเมิน (Step 5)',
        '• แสดงสถานะภาพรวมสุขภาพใจ และข้อความคำเตือนทางการแพทย์',
        '• การ์ดผลสรุป 3 ด้าน พร้อมคะแนนและแถบสีระดับความเสี่ยง',
        '• ตัดส่วนที่เป็นคำแนะนำออก ตามความต้องการของฝ่ายบริหาร',
        '• สิทธิ์ทำ 1 ครั้งตลอดอายุระบบ (เปิดเข้ามาดูผลย้อนหลังได้ตลอด)'
    ])

    # -------------------------------------------------------------------------
    # SLIDE 5: Assessment Catalog (Index 4)
    # -------------------------------------------------------------------------
    s5 = prs.slides[4]
    
    # Shape 8 (Rounded Rectangle 9): 3. โรคซึมเศร้า (9Q)
    # FIX: Replace erroneous RQ text with true 9Q criteria!
    set_shape_paragraphs(s5.shapes[8], [
        '3. โรคซึมเศร้า (9Q)',
        '9 ข้อคำถาม (ตัวเลือก 0–3, เต็ม 27)',
        'ประเมินอาการและความรู้สึกช่วง 2 สัปดาห์:',
        '• คะแนน <7: ไม่มีอาการหรือมีน้อยมาก (ปกติ)',
        '• คะแนน 7–12: ระดับน้อย (Mild)',
        '• คะแนน 13–18: ระดับปานกลาง (Moderate)',
        '• คะแนน 19–27: ระดับรุนแรง (Severe)',
        '*ข้อ 9 รวมในคะแนน ไม่แยกตัดสินความเสี่ยงฆ่าตัวตาย'
    ])
    
    # Shape 9 (Rounded Rectangle 10): สรุปขอบเขตแบบประเมิน
    # FIX: Remove stray line "• คะแนน <7: ไม่มีหรือน้อยมาก"
    set_shape_paragraphs(s5.shapes[9], [
        'สรุปขอบเขตแบบประเมิน',
        '3 เครื่องมือมาตรฐาน รวม 51 ข้อ',
        'ปรับลดเพื่อความกระชับและแม่นยำ:',
        '• ประเมิน Burnout (22 ข้อ), ST-20 (20 ข้อ), 9Q (9 ข้อ)',
        '• ตัดแบบวัดพลังสุขภาพจิต (RQ, 20 ข้อ) ออก',
        '• ตัดแบบคัดกรองความเสี่ยง (2Q Plus, 3 ข้อ) ออก',
        '• ใช้เวลาเพียง ~8–10 นาที เพิ่มอัตราการทำจนจบ 100%',
        '*คำถามมาตรฐานทางการแพทย์และจิตวิทยา'
    ])

    # -------------------------------------------------------------------------
    # SLIDE 7: User Journey: Super Admin & Admin (Index 6)
    # -------------------------------------------------------------------------
    s7 = prs.slides[6]
    # Subtitle: Steps 6-24 (not 7-24)
    s7.shapes[2].text_frame.paragraphs[0].text = 'เส้นทางของผู้ดูแลระบบทั้ง 2 ระดับสิทธิ์ (Steps 6–24)'
    
    # Shape 6 (Rounded Rectangle 7): ขั้นที่ 1
    set_shape_paragraphs(s7.shapes[6], [
        'ขั้นที่ 1',
        'Super Admin Portal (Steps 6–10)',
        '• Super Admin Login ONE ID (Step 6) ตรวจสิทธิ์ผ่าน',
        '• แสดง Super Admin Portal มี 2 เมนูหลัก (Step 7)',
        '• เลือกเมนู Dashboard (Step 9) หรือ จัดการสิทธิ์ (Step 10)',
        '• มอบ/ถอนสิทธิ์ Export, ส่งออกรายชื่อ Admin, บันทึก Log'
    ])
    
    # Shape 7 (Rounded Rectangle 8): ขั้นที่ 2
    # FIX: Correct Step 11 to Steps 16-17, and fix Step 14 reference
    set_shape_paragraphs(s7.shapes[7], [
        'ขั้นที่ 2',
        'Admin เข้า Dashboard (Steps 16–17)',
        '• Admin ทั่วไป Login ONE ID (Step 16) ตรวจสิทธิ์ผ่าน',
        '• ตรงเข้าสู่หน้า Dashboard ตรวจสอบสุขภาพใจ (Step 17)',
        '• สแกน KPI ภาพรวม และกราฟสถิติ 3 ด้าน (Burnout, Stress, 9Q)',
        '• บังคับใช้กฎ Small-Cohort Suppression (<5 คน) อัตโนมัติ'
    ])
    
    # Shape 8 (Rounded Rectangle 9): ขั้นที่ 3
    # FIX: Correct step numbers for filter (Super Admin Step 11, Admin Step 19)
    set_shape_paragraphs(s7.shapes[8], [
        'ขั้นที่ 3',
        'กรองข้อมูลหลายมิติ 52 บริษัท (Steps 11, 19)',
        '• Super Admin กรองข้อมูล (Step 11) / Admin กรองข้อมูล (Step 19)',
        '• ค้นหาและเลือกจาก 52 บริษัทในเครือ (Searchable Dropdown)',
        '• กรองตาม แผนก, เพศ, ช่วงอายุ, พื้นที่ปฏิบัติงาน, และอายุงาน',
        '• กรองเฉพาะกลุ่มที่เข้าเกณฑ์เสี่ยง หรือระดับคะแนนรายด้าน'
    ])
    
    # Shape 9 (Rounded Rectangle 10): ขั้นที่ 4
    # FIX: Clarify Step 9/17 Individual table and Unmasked data
    set_shape_paragraphs(s7.shapes[9], [
        'ขั้นที่ 4',
        'ตารางรายบุคคล & ข้อมูล Unmasked',
        '• Dev Encrypt ใน DB (AES-256-GCM) / HR ดูข้อมูลจริงได้ทั้งหมด',
        '• แสดงชื่อ-นามสกุล, รหัสพนักงาน, แผนก, และผล 3 ด้าน Unmasked',
        '• ค้นหารายบุคคลด้วยชื่อหรือรหัสพนักงานได้แบบ Real-time',
        '• มาตรการความปลอดภัยเด็ดขาด: ไร้คำตอบรายข้อ (Zero Raw Answers)'
    ])
    
    # Shape 10 (Rounded Rectangle 11): ขั้นที่ 5
    # FIX: Correct step references for Gating Export (12-15 for Super Admin, 20-24 for Admin)
    set_shape_paragraphs(s7.shapes[10], [
        'ขั้นที่ 5',
        'Gating Export & ยืนยันรหัส (Steps 12–15, 20–24)',
        '• เช็คสิทธิ์ Export: หากไม่มีสิทธิ์ ให้ซ่อนปุ่มส่งออก (Step 21)',
        '• มีสิทธิ์: กดส่งออก (Step 12, 20) เลือก Excel หรือ CSV (UTF-8 BOM)',
        '• กรอก Password ONE ID ยืนยันตัวตนก่อนดาวน์โหลด (Step 13, 22)',
        '• รหัสผ่านถูก: ดาวน์โหลดสำเร็จ (Step 14, 23) / ผิด: แจ้งเตือนระงับ (Step 15, 24)'
    ])

    # -------------------------------------------------------------------------
    # SLIDE 9: Data Governance (Index 8)
    # -------------------------------------------------------------------------
    s9 = prs.slides[8]
    # Shape 6 (Rounded Rectangle 7): Authorized Scope
    # FIX: Remove RQ and 2Q Plus references!
    set_shape_paragraphs(s9.shapes[6], [
        '✅ ข้อมูลที่ทีม HR เข้าถึงได้ (Authorized Scope)',
        'Employee Snapshot ณ วันที่ส่งผล',
        'วันที่ส่ง, รหัสพนักงาน, ชื่อ-นามสกุล, เพศ, อายุ, บริษัท, แผนก, ตำแหน่ง, พื้นที่ปฏิบัติงาน, อายุงาน (Dev Encrypt ใน DB / HR ดูข้อมูลได้ทั้งหมดบนหน้าจอ)',
        'คะแนนรวม & ระดับผลที่แปลแล้ว (3 เครื่องมือมาตรฐาน)',
        '• Burnout: แสดงคะแนนแยก 3 มิติ (อ่อนล้า/ลดบุคคล/สำเร็จ) และผลสรุป • Stress (ST-20): แสดงคะแนนรวม 0–60 และระดับผล 5 ระดับ • 9Q: แสดงคะแนนรวม 0–27 และระดับความรุนแรง 4 ระดับ',
        'สถานะของรายการ',
        'แสดงสถานะชัดเจนว่าเป็น \'Submitted\' หรือ \'Cancelled\' (รายการที่ถูกยกเลิกไม่นำมาคิดใน Dashboard)',
        'การส่งออกข้อมูลที่ควบคุมได้',
        'ส่งออกได้ทั้ง Excel (.xlsx) และ CSV (BOM UTF-8) ตามตัวกรองปัจจุบัน, ซ่อนปุ่ม Export หากไม่มีสิทธิ์ (Step 21), ต้องยืนยันรหัสผ่าน ONE ID ซ้ำก่อนดาวน์โหลด (Steps 13, 22) และบันทึก Audit Log ทุกครั้ง'
    ])

    # -------------------------------------------------------------------------
    # SLIDE 11: Requirement Comparison Table (Index 10)
    # -------------------------------------------------------------------------
    s11 = prs.slides[10]
    tbl = s11.shapes[6].table
    
    # Row 1: การเข้าใช้งาน
    tbl.cell(1, 1).text = '2 ช่องทาง: OnePlatform SSO ตรงสู่คำชี้แจง (Step 3) หรือ เว็บไซต์ Employee Portal (Step 2) กดทำแบบประเมิน'
    tbl.cell(1, 2).text = 'Super Admin เข้า Portal (Step 7); Admin เข้า Dashboard สถิติโดยตรง (Step 17) ล็อกอินด้วย ONE ID (+ Turnstile)'
    
    # Row 2: สิทธิ์ในการทำแบบประเมิน
    tbl.cell(2, 1).text = '1 ครั้งตลอดอายุระบบ (เว้นแต่ HR สั่งคืนสิทธิ์ Reset)'
    tbl.cell(2, 2).text = 'ไม่มีสิทธิ์ทำแบบประเมินในบทบาทผู้ดูแลระบบ'
    
    # Row 3: การมองเห็นคำตอบรายข้อ
    tbl.cell(3, 1).text = 'เห็นและแก้ไขคำตอบได้ในสถานะ Draft; เมื่อ Submit แล้วเห็นเฉพาะผลสรุปคะแนนและระดับ (ตัดคำแนะนำออก)'
    tbl.cell(3, 2).text = 'ไร้คำตอบรายข้อเด็ดขาด 100%; Dev Encrypt ใน DB (AES-256) / HR ดูข้อมูลชื่อ-รหัสพนักงานได้ทั้งหมดบนหน้าจอ'
    
    # Row 4: การแก้ไขผลคะแนน
    tbl.cell(4, 1).text = 'แก้ไขผลไม่ได้หลัง Submit; หากจำเป็นต้องติดต่อ HR เพื่อขอคืนสิทธิ์พร้อมระบุเหตุผล'
    tbl.cell(4, 2).text = 'แก้ไขคะแนนไม่ได้ ทำได้เฉพาะการคืนสิทธิ์ (Reset) โดยต้องระบุเหตุผลบังคับ และบันทึก Audit Log 2 ปี'
    
    # Row 5: การส่งออกข้อมูล
    tbl.cell(5, 1).text = 'ไม่มีฟังก์ชันการส่งออกข้อมูล'
    tbl.cell(5, 2).text = 'Super Admin ส่งออกได้เสมอ; Admin ทั่วไป ซ่อนปุ่มถ้าไร้สิทธิ์ (Step 21); มีสิทธิ์ส่งออก Excel/CSV ยืนยันรหัส ONE ID (Steps 13, 22)'
    
    # Row 6: การแจ้งเตือนฉุกเฉิน
    tbl.cell(6, 1).text = 'แสดงเบอร์สายด่วนสุขภาพใจ 1323 และสะมาริตันส์บนหน้าจอผล; ไม่มีการส่ง SMS/Alert ภายนอก'
    tbl.cell(6, 2).text = 'มอนิเตอร์กลุ่มเข้าเกณฑ์ดูแลผ่าน Dashboard; มีระบบระงับสถิติกลุ่มย่อย Small-Cohort (<5 คน)'

    # -------------------------------------------------------------------------
    # SLIDE 12: Next Steps (Index 11)
    # -------------------------------------------------------------------------
    s12 = prs.slides[11]
    # Shape 7 (Rounded Rectangle 8): 🚀 แนวทางการดำเนินงานต่อเนื่อง
    set_shape_paragraphs(s12.shapes[7], [
        '🚀 แนวทางการดำเนินงานต่อเนื่อง',
        '1. ทดลองใช้งาน Prototype แบบโต้ตอบ:',
        '   เปิด \'02_Prototype/mental-health-ui-prototype.html\' (Flow ประเมิน & แอดมิน)',
        '   เปิด \'02_Prototype/portal-and-login-prototype.html\' (Portal & Login แยกอิสระ)',
        '2. ตรวจสอบเนื้อหาแบบประเมินต้นฉบับ:',
        '   เปรียบเทียบเกณฑ์คะแนนใน \'03_แบบประเมินต้นฉบับ\'',
        '3. บันทึกข้อแก้ไขเพิ่มเติม:',
        '   กรอกรายละเอียดในหัวข้อ 15 ของเอกสารหลัก (.docx)',
        '4. ลงนามยืนยันความต้องการ:',
        '   ผู้มีส่วนได้ส่วนเสีย 5 ฝ่ายลงนามในหัวข้อ 16 เพื่อเริ่มพัฒนา'
    ])

    print(f"Saving updated presentation: {file_path}")
    prs.save(file_path)
    print(f"Saved successfully: {file_path}")

if __name__ == '__main__':
    files = [
        'deliverables/HR-Requirement-Confirmation-Pack/06_สไลด์นำเสนอ_User_Journey_ระบบประเมินสุขภาพใจ.pptx',
        'deliverables/HR-Requirement-Confirmation-Pack/Mental_Health_Assessment_User_Journey_Presentation.pptx',
        'deliverables/HR-Requirement-Confirmation-Pack/Employee_Well_Being_Survey_User_Journey_Presentation.pptx',
        'deliverables/Employee Well-being Survey-Confirmation-Pack/Employee_Well_Being_Survey_User_Journey_Presentation.pptx'
    ]
    for f in files:
        if os.path.exists(f):
            update_presentation_file(f)
