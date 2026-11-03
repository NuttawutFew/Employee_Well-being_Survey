from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "deliverables" / "HR-Requirement-Confirmation-Pack"
OUT.mkdir(parents=True, exist_ok=True)
DOCX = OUT / "01_เอกสารยืนยันความต้องการระบบประเมินสุขภาพใจ.docx"

BLUE = "25458B"; NAVY = "172554"; PALE = "EDF2FF"; LIGHT = "F6F8FC"; GOLD = "B7791F"; RED = "B42318"; GREEN = "287D4A"; GRAY = "667085"; WHITE = "FFFFFF"

def font(run, size=11, bold=False, color="20253A"):
    run.font.name = "Leelawadee UI"; run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), "Leelawadee UI")
    run.font.size = Pt(size); run.bold = bold; run.font.color.rgb = RGBColor.from_string(color)

def shade(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr(); shd = tcPr.find(qn("w:shd")) or OxmlElement("w:shd"); shd.set(qn("w:fill"), fill)
    if shd.getparent() is None: tcPr.append(shd)

def margins(cell, top=90, start=120, bottom=90, end=120):
    tcPr = cell._tc.get_or_add_tcPr(); tcMar = tcPr.first_child_found_in("w:tcMar") or OxmlElement("w:tcMar")
    if tcMar.getparent() is None: tcPr.append(tcMar)
    for side, val in (("top",top),("start",start),("bottom",bottom),("end",end)):
        el = tcMar.find(qn(f"w:{side}")) or OxmlElement(f"w:{side}"); el.set(qn("w:w"), str(val)); el.set(qn("w:type"), "dxa")
        if el.getparent() is None: tcMar.append(el)

def set_cell(cell, text, bold=False, color="20253A", fill=None, size=9.3):
    cell.text = ""; p = cell.paragraphs[0]; p.paragraph_format.space_after = Pt(0); p.paragraph_format.line_spacing = 1.05
    font(p.add_run(text), size, bold, color); cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER; margins(cell)
    if fill: shade(cell, fill)

def table(rows, widths=None, header=True):
    t = doc.add_table(rows=len(rows), cols=len(rows[0])); t.alignment = WD_TABLE_ALIGNMENT.CENTER; t.autofit = False
    trPr = t.rows[0]._tr.get_or_add_trPr(); tbl_header = OxmlElement("w:tblHeader"); tbl_header.set(qn("w:val"), "true"); trPr.append(tbl_header)
    for i,row in enumerate(rows):
        for j,val in enumerate(row):
            if widths: t.cell(i,j).width = Inches(widths[j])
            set_cell(t.cell(i,j), str(val), bold=(header and i==0), color=WHITE if header and i==0 else "20253A", fill=BLUE if header and i==0 else (LIGHT if i%2==0 else WHITE))
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return t

def p(text="", bold=False, color="20253A", size=11, align=None, after=6, style=None):
    x = doc.add_paragraph(style=style); x.paragraph_format.space_after = Pt(after); x.paragraph_format.line_spacing = 1.12
    if align is not None: x.alignment = align
    font(x.add_run(text), size, bold, color); return x

def h(text, level=1):
    return p(text, True, BLUE if level<3 else NAVY, {1:16,2:13,3:11.5}[level], after={1:8,2:6,3:4}[level], style=f"Heading {level}")

def bullet(text):
    x=doc.add_paragraph(style="List Bullet"); x.paragraph_format.space_after=Pt(3); x.paragraph_format.line_spacing=1.1; font(x.add_run(text),10.5); return x

def check(text): return bullet("☐ " + text)

doc = Document(); sec=doc.sections[0]
sec.page_width=Inches(8.5); sec.page_height=Inches(11); sec.top_margin=sec.bottom_margin=Inches(0.72); sec.left_margin=sec.right_margin=Inches(0.78); sec.header_distance=sec.footer_distance=Inches(0.35)
styles=doc.styles
for name in ["Normal","Heading 1","Heading 2","Heading 3","List Bullet","List Number"]:
    st=styles[name]; st.font.name="Leelawadee UI"; st._element.rPr.rFonts.set(qn("w:eastAsia"),"Leelawadee UI")
styles["Normal"].font.size=Pt(11)
header=sec.header.paragraphs[0]; header.alignment=WD_ALIGN_PARAGRAPH.RIGHT; font(header.add_run("MENTAL HEALTH ASSESSMENT  |  REQUIREMENT CONFIRMATION"),8.5,True,GRAY)
footer=sec.footer.paragraphs[0]; footer.alignment=WD_ALIGN_PARAGRAPH.CENTER; font(footer.add_run("เอกสารสำหรับตรวจสอบและยืนยันความต้องการ • ฉบับร่าง 0.1 • 3 กันยายน 2569"),8,False,GRAY)

p("เอกสารยืนยันความต้องการ",True,BLUE,14,after=14)
p("ระบบประเมินสุขภาพใจสำหรับพนักงาน",True,NAVY,28,after=5)
p("Requirement Confirmation Pack",False,GRAY,15,after=22)
table([["โครงการ","ระบบประเมินสุขภาพใจสำหรับพนักงาน"],["ผู้ตรวจสอบหลัก","ทีม HR / ผู้ว่าจ้าง"],["สถานะเอกสาร","ฉบับร่างเพื่อยืนยัน (Draft for Confirmation)"],["วันที่จัดทำ","3 กันยายน 2569"],["เทคโนโลยีเป้าหมาย","Vue • Node.js • PostgreSQL • Cloud"]],[1.55,5.15],header=False)
p("วัตถุประสงค์ของเอกสาร",True,BLUE,13,after=5)
p("ใช้เป็นขอบเขตกลางระหว่างทีม HR ผู้เชี่ยวชาญด้านสุขภาพจิต ผู้ดูแลข้อมูลส่วนบุคคล และทีมพัฒนา ก่อนจัดทำระบบจริง โดยทุกข้อความ คำแนะนำ และเกณฑ์คัดกรองต้องได้รับการยืนยันจากผู้รับผิดชอบที่ระบุในหน้าลงนาม",size=11,after=14)
table([["คำแนะนำการตรวจ","1) ตรวจหัวข้อที่เกี่ยวข้อง  2) ทำเครื่องหมายยืนยันหรือขอแก้ไข  3) ระบุรายละเอียดในตารางประเด็นค้าง  4) ลงนามเมื่อประเด็นสำคัญครบถ้วน"]],[1.55,5.15],header=False)

doc.add_page_break(); h("1. สรุปสำหรับผู้บริหาร")
p("ระบบประกอบด้วยเว็บ 2 ส่วนที่แยกจากกัน: เว็บพนักงานสำหรับทำแบบประเมินด้วยตนเอง และเว็บ Admin สำหรับ HR ตรวจดูผลสรุปรายบุคคลและภาพรวมองค์กร โดยแบบประเมินลดเหลือ 3 ชุดแบบตายตัว (รวม 51 ข้อ)")
for x in [
    "พนักงานเข้าสู่ระบบผ่าน OnePlatform SSO และระบบดึงข้อมูลพนักงานด้วย shareToken",
    "แบบประเมินเหลือ 3 ชุดตามมาตรฐาน: ภาวะหมดไฟในการทำงาน (Burnout 22 ข้อ), ความเครียด (ST-20 20 ข้อ), ภาวะเสี่ยงซึมเศร้า (9Q 9 ข้อ) รวมทั้งสิ้น 51 ข้อ",
    "ผู้ใช้ทำแบบประเมินได้หนึ่งครั้งตลอดอายุระบบ เว้นแต่ Admin คืนสิทธิ์",
    "บันทึก Draft อัตโนมัติ กลับมาทำต่อ ล้างคำตอบ และย้อนแก้ได้ก่อนส่ง",
    "เมื่อส่งครบทั้ง 3 แบบ ระบบแสดงผลรายด้าน คะแนน ระดับ และคำอธิบาย โดยตัดส่วนคำแนะนำออกทั้งหมดตามความต้องการขององค์กร",
    "การจัดเก็บข้อมูล: ทาง Dev ทำการเข้ารหัส (Encrypt at Rest) ฟิลด์ระบุตัวตนในฐานข้อมูล แต่ HR สามารถดูข้อมูลที่แสดงได้ทั้งหมด (Unmasked View) บนหน้าจอรายงานและไฟล์ Export",
    "Admin เห็นผลสรุปและคะแนน แต่ไม่เห็นคำตอบรายข้อ (Zero Raw Answers)",
    "การคืนสิทธิ์ไม่ลบประวัติเดิม: เปลี่ยนสถานะเป็น ถูกยกเลิก และไม่นำมาคำนวณ Dashboard"
]: bullet(x)
h("2. ขอบเขตโครงการ")
table([["อยู่ในขอบเขต (In scope)","ไม่อยู่ในขอบเขตระยะที่ 1 (Out of scope)"],["แบบประเมินตายตัว 3 ชุด (Burnout, ST-20, 9Q รวม 51 ข้อ)","ระบบแก้ไขคำถาม/เกณฑ์ผ่านหน้า Admin"],["Employee Web และ Admin Web แยกกัน","การวินิจฉัยโรคหรือการรักษาทางการแพทย์"],["SSO สำหรับพนักงาน; login OneID แล้ว map ข้อมูลการเป็น Admin สำหรับเข้าสู่ระบบ","2FA สำหรับ Admin"],["Dashboard, ตัวกรอง, รายงาน และ Export","การแจ้งเตือนความเสี่ยงแบบ Real-time"],["Audit log และประวัติการคืนสิทธิ์","ศูนย์ช่วยเหลือ/หมายเลขฉุกเฉินในระบบรุ่นแรก"]],[3.25,3.25])

h("3. ผู้ใช้งานและสิทธิ์")
table([["บทบาท","เข้าสู่ระบบ","สิ่งที่ทำได้","ข้อจำกัด"],["พนักงาน /HR ผู้ประเมิน","ผ่านทาง OnePlatform App โดยใช้บัญชี OneID ของตนเอง ระบบจะทำการ Single-SignOn (SSO) ให้โดยอัตโนมัติ","ทำแบบประเมิน ดูผลของตนเอง (ไม่มีส่วนคำแนะนำ)","เห็นเฉพาะข้อมูลของตนเอง"],["Admin / HR ผู้ดูแล","เข้าหน้าเว็ประบบประเมินด้วยบัญชี OneID ของตนเอง และได้รับสิทธิ์ Admin ในระบบ","ดู Dashboard ค้นหา กรอง Export คืนสิทธิ์ และดูข้อมูลที่แสดงได้ทั้งหมด","ไม่เห็นคำตอบรายข้อ"]],[1.2,2.3,2.0,1.5])
h("4. ขั้นตอนการใช้งานเว็บพนักงาน")
for i,x in enumerate(["เข้าสู่ระบบผ่าน OnePlatform และรับข้อมูลพนักงาน", "อ่านหน้าชี้แจง แล้วกด “รับทราบ”", "ทำแบบประเมิน 3 ชุด (Burnout, ST-20, 9Q รวม 51 ข้อ) ตามลำดับที่กำหนด", "ระบบบันทึกคำตอบอัตโนมัติ; ผู้ใช้กลับมาแก้ไขหรือทำต่อได้ในสถานะ Draft", "ตอบครบทุกข้อ (51 ข้อ) และกดยืนยันส่ง", "ระบบประมวลผลและแสดงหน้าสรุปผลทั้ง 3 ด้าน (แสดงคะแนน ระดับ และคำอธิบาย โดยตัดส่วนคำแนะนำออก)"],1): p(f"{i}. {x}",size=10.7,after=4)
p("กติกาสำคัญ: ต้องตอบครบทุกข้อก่อนเปลี่ยนไปขั้นถัดไป การส่งต้องรองรับการกดซ้ำโดยไม่สร้างผลซ้ำ และหลังส่งแล้วผู้ใช้แก้ไขเองไม่ได้",bold=True,color=RED,size=10.5,after=10)

h("5. แบบประเมินและลำดับหน้าจอ")
table([["ลำดับ","แบบประเมิน","จำนวนข้อ","ผลหลัก"],["1","Burnout (ภาวะหมดไฟ)","22","3 มิติของภาวะหมดไฟ (EE, DP, PA)"],["2","ความเครียด (ST-20)","20","ระดับความเครียด 5 ระดับ (0–60 คะแนน)"],["3","ภาวะเสี่ยงซึมเศร้า (9Q)","9","ระดับความเสี่ยงโรคซึมเศร้า (0–27 คะแนน)"]],[.55,2.8,.75,2.4])
p("แต่ละแบบประเมินมี 1 หน้า แสดงคำถามทั้งหมดของแบบนั้น รวม 51 ข้อ (~8–10 นาที) รองรับมือถือ แท็บเล็ต และ PC",bold=True,color=BLUE,size=10.5)

h("6. กติกาการให้คะแนนและสรุปผล")
h("6.1 Burnout (22 ข้อ)",2)
bullet("แสดงคะแนนและระดับของ 3 มิติ: ความอ่อนล้าทางอารมณ์ (EE), การลดความเป็นบุคคล (DP), ความสำเร็จส่วนบุคคล (PA)")
bullet("ข้อคำถามทางบวก 4, 7, 9, 12, 17, 18, 19, 21 กลับคะแนน 6→0 ก่อนรวมคะแนน")
table([["มิติ","ต่ำ / ดี","ปานกลาง","สูง / ควรเฝ้าระวัง"],["EE","0–16","17–26","≥27"],["DP","0–6","7–12","≥13"],["PA","0–31: ความสำเร็จสูง / หมดไฟต่ำ","32–38: ความสำเร็จปานกลาง","39–48: ความสำเร็จต่ำ / หมดไฟสูง"]],[1.15,1.8,1.65,2.25])
h("6.2 ความเครียด (ST-20, 20 ข้อ)",2); p("รวม 20 ข้อ คะแนน 0–60 และแปลผลเป็น 0–5 (ต่ำกว่าเกณฑ์), 6–17 (ปกติ), 18–25 (สูงกว่าปกติเล็กน้อย), 26–29 (สูงกว่าปกติปานกลาง) และ 30–60 (สูงกว่าปกติมาก) การคำนวณ Dashboard ถือว่าเข้าเกณฑ์ควรได้รับการดูแลเมื่อคะแนนตั้งแต่ 18 ขึ้นไป")
h("6.3 ภาวะเสี่ยงซึมเศร้า (9Q, 9 ข้อ)",2); p("แบบประเมินคัดกรองโรคซึมเศร้า 9 ข้อ คะแนนรวม 0–27 เกณฑ์การแปลผล: 0–6 (ไม่มีอาการหรือน้อยมาก), 7–12 (ระดับน้อย), 13–18 (ระดับปานกลาง), ≥19 (ระดับรุนแรง) โดยข้อ 9 เป็นส่วนหนึ่งของคะแนนรวม 9Q")

h("7. หน้าสรุปผลของผู้ประเมิน (Employee Result)")
for x in [
    "แสดงผลครบ 3 ด้าน: ภาวะหมดไฟ, ความเครียด, ภาวะเสี่ยงซึมเศร้า (แสดงคะแนน ระดับ และคำอธิบายสภาวะ)",
    "ตัดส่วนที่เป็นคำแนะนำ (Action Guidelines / Recommendations) ออกทั้งหมดตามความต้องการขององค์กร",
    "ถ้ามีมิติใดมิติหนึ่งเข้าเกณฑ์เฝ้าระวัง ให้แสดงข้อความเตือนภาพรวม 'ควรได้รับการดูแลสุขภาพใจเพิ่มเติม'",
    "ไม่สร้างคะแนนรวมสุขภาพใจแบบตัวเลขเดียว เพื่อป้องกันการตีตรา",
    "แสดงข้อความชัดเจนว่าเป็นผลคัดกรองเบื้องต้นเพื่อสุขภาวะ ไม่ใช่การวินิจฉัยทางการแพทย์"
]: bullet(x)

h("8. ข้อมูลพนักงานที่รับจาก OnePlatform หรือ OneID")
table([["ข้อมูล","การใช้งาน"],["รหัสพนักงาน, ชื่อ, นามสกุล","ระบุตัวบุคคลและค้นหา (HR ดูได้ทั้งหมด)"],["เพศ, อายุ","แสดงข้อมูลและใช้เป็นตัวกรอง"],["เบอร์โทรศัพท์","ข้อมูลประกอบในรายการ Admin"],["บริษัท, แผนก, ตำแหน่ง","แบ่งกลุ่มและวิเคราะห์"],["พื้นที่ปฏิบัติงาน","กรุงเทพ / ขอนแก่น / นครราชสีมา / สระบุรี / หาดใหญ่ / เชียงใหม่"],["วันที่เริ่มงานหรืออายุงาน","ช่วง <1 ปี, 1–3 ปี, 3–5 ปี, >5 ปี"]],[2.2,4.3])
p("จัดเก็บค่าข้อมูลพนักงาน ณ วันที่ส่งแบบประเมินเป็น snapshot ในฐานข้อมูล โดยทำการเข้ารหัสฟิลด์ข้อมูลส่วนบุคคล (Encrypt at Rest)",bold=True,color=BLUE,size=10.5)

h("9. ข้อกำหนด Admin Web")
h("9.1 Dashboard",2)
for x in [
    "จำนวนผู้ส่งแบบประเมินทั้งหมด",
    "จำนวนและร้อยละของผู้เข้าเกณฑ์ควรได้รับการดูแลเพิ่ม (Needs Care)",
    "การ์ดร้อยละแยกครบ 3 ด้าน: ภาวะหมดไฟ (Burnout), ความเครียด (Stress ST-20), ภาวะเสี่ยงซึมเศร้า (9Q)",
    "เมื่อกลุ่มที่กรองมีน้อยกว่า 5 คน ระบบต้องไม่แสดงสถิติรวม (Small-Cohort Suppression) และต้องบังคับจากฝั่ง Server",
    "รายการที่ถูกยกเลิกไม่ถูกนำไปคำนวณ"
]: bullet(x)
h("9.2 ตัวกรองและการค้นหา",2)
p("วันที่ • บริษัท (พิมพ์ค้นหา รองรับประมาณ 52 บริษัท) • แผนก • ตำแหน่ง • เพศ • ช่วงอายุ • พื้นที่ปฏิบัติงาน • ช่วงอายุงาน • สถานะภาพรวม • แบบประเมินและระดับผล 3 ด้าน • สถานะ Submitted/Cancelled • รหัสพนักงานหรือชื่อ–นามสกุล")
h("9.3 ตารางรายบุคคล",2)
table([["กลุ่มคอลัมน์","รายละเอียดที่ต้องแสดง"],["พนักงาน","วันที่ส่ง, รหัสพนักงาน, ชื่อ–นามสกุล, เพศ, อายุ, บริษัท, แผนก, ตำแหน่ง, พื้นที่, อายุงาน"],["Burnout","คะแนนแยก 3 มิติ และระดับผล"],["Stress (ST-20)","คะแนนตัวเลขที่ได้ (0–60) และระดับผล"],["9Q","คะแนนตัวเลขที่ได้ (0–27) และระดับผล"],["สถานะ","Submitted หรือ Cancelled"]],[1.55,4.95])
p("หมายเหตุการแสดงผล: ทาง Dev ทำการเข้ารหัสข้อมูลในฐานข้อมูล แต่ HR สามารถดูข้อมูลที่แสดงได้ทั้งหมด (Unmasked View) ทั้งรหัสพนักงานและชื่อ-นามสกุล",bold=True,color=BLUE,size=10)
h("9.4 การจัดการและส่งออก",2)
for x in [
    "Admin คืนสิทธิ์ทำใหม่ได้ พร้อมระบุเหตุผลและบันทึก Audit log",
    "ผลเดิมเปลี่ยนเป็น Cancelled และยังค้นดูประวัติได้",
    "Export ตามตัวกรองเป็น Excel / CSV โดยมีข้อมูลชื่อ-นามสกุลและรหัสพนักงาน แต่ไม่มีคำตอบรายข้อ (Zero Raw Answers)",
    "บันทึกผู้ใช้งาน เวลา เหตุผล และการกระทำที่สำคัญใน Audit log"
]: bullet(x)

h("10. ความเป็นส่วนตัวและการรักษาความปลอดภัย")
for x in [
    "ไม่บันทึก shareToken ใน log และไม่จัดเก็บเกินความจำเป็น",
    "กำหนดสิทธิ์แบบแยกบทบาทและตรวจสอบสิทธิ์ทุก API",
    "Export ต้องอ้างอิงตัวกรองและสิทธิ์เดียวกับหน้าจอ",
    "บันทึก Audit log สำหรับการเข้าสู่ระบบ การดูข้อมูล การส่งออกข้อมูล การคืนสิทธิ์ และกระบวนการทำงานทุกอย่าง (Event) ที่ผู้ดูแลระบบเข้าใช้งาน",
    "การ Export ข้อมูล จะต้องมีการยืนยันให้ใส่รหัสผ่านของบัญชีผู้ใช้งานอีกครั้ง ก่อนจะดำเนินการต่อ และจะต้องบันทึก Audit Log การนำข้อมูลออกทุกครั้ง",
    "การเข้ารหัสข้อมูล (Encryption at Rest): ทาง Dev ทำการ Encrypt ข้อมูลพนักงานในระบบฐานข้อมูลฟิลด์ ได้แก่ ชื่อ–นามสกุล, เพศ, อายุ, รหัสพนักงาน ด้วยอัลกอริทึม AES-256-GCM",
    "การแสดงผลสำหรับ HR: กำหนดให้ทาง Dev Encrypt ข้อมูลในฐานข้อมูล แต่ให้ฝ่าย HR สามารถดูข้อมูลที่แสดงได้ทั้งหมด (Unmasked View) บนหน้าจอรายงานและไฟล์ Export เพื่อประโยชน์ในการบริหารจัดการและดูแลสุขภาวะพนักงาน"
]: bullet(x)

h("11. Prototype ที่ใช้ประกอบการยืนยัน")
p("Prototype เป็นภาพจำลอง UX/UI เพื่อยืนยันโครงสร้างข้อมูล ลำดับหน้าจอ และรูปแบบการแสดงผล ไม่ใช่ระบบจริง")
table([["หน้าจอ","สิ่งที่ควรตรวจ"],["คำชี้แจง","ข้อความ การรับทราบ และปุ่มเริ่ม"],["แบบประเมิน","3 หน้า (Burnout 22, ST-20 20, 9Q 9 รวม 51 ข้อ) การบันทึก และการย้อนแก้"],["ผลของฉัน","คะแนน ระดับ และคำอธิบายผลทั้ง 3 ด้าน (ไม่มีส่วนคำแนะนำ)"],["Admin","Dashboard 3 ด้าน, ตัวกรองหลากมิติ, ตารางรายบุคคลแบบ HR ดูข้อมูลได้ทั้งหมด"]],[1.6,4.9])

h("12. ประเด็นที่ต้องได้รับการยืนยันก่อนพัฒนา")
table([["เลขที่","รายการยืนยัน","เจ้าของการยืนยัน","สถานะ / หมายเหตุ"],["C-01","ถ้อยคำหน้าชี้แจงและวัตถุประสงค์การประมวลผลข้อมูล","HR + PDPA","☐ ยืนยัน  ☐ ขอแก้ไข"],["C-02","คำถาม ตัวเลือก การกลับคะแนน และเกณฑ์ทั้ง 3 แบบ (51 ข้อ)","ผู้เชี่ยวชาญ/เจ้าของเกณฑ์","☐ ยืนยัน  ☐ ขอแก้ไข"],["C-03","ข้อความผลลัพธ์ทั้ง 3 ด้าน และการตัดส่วนคำแนะนำออก","ผู้เชี่ยวชาญ + HR","☐ ยืนยัน  ☐ ขอแก้ไข"],["C-04","สิทธิ์เข้าถึง รายการข้อมูล (Dev Encrypt / HR ดูได้ทั้งหมด) และขอบเขต Export","HR + PDPA","☐ ยืนยัน  ☐ ขอแก้ไข"],["C-05","Retention 3 ปี และวิธีทำให้ไม่ระบุตัวตน","PDPA + IT","☐ ยืนยัน  ☐ ขอแก้ไข"],["C-06","นิยามตัวเลขบน Dashboard ทั้ง 3 ด้าน","HR + ทีมพัฒนา","☐ ยืนยัน  ☐ ขอแก้ไข"]],[.55,2.7,1.6,1.65])

h("ภาคผนวก A — นิยามสถานะและคำศัพท์",1)
table([["คำศัพท์","ความหมาย"],["Submitted","ส่งครบทั้ง 3 แบบแล้ว (51 ข้อ) ล็อกการแก้ไข และนำไปคำนวณ Dashboard"],["Cancelled","ผลเดิมที่ Admin คืนสิทธิ์ ไม่ถูกลบ แต่ไม่นำไปคำนวณ"],["Dev Encrypt / HR Unmasked","การเข้ารหัสข้อมูลที่ Rest ในฐานข้อมูลโดย Dev แต่ HR มีสิทธิ์เข้าดูข้อมูลจริงแบบไม่ Mask เพื่อปฏิบัติงาน"]],[1.6,4.9])

h("ภาคผนวก B — นิยาม “ควรได้รับการดูแลสุขภาพใจเพิ่มเติม (Needs Care)”",1)
for x in [
    "Burnout: มิติใดมิติหนึ่ง (EE, DP, PA) อยู่ระดับปานกลางหรือสูง",
    "ความเครียด (ST-20): คะแนนตั้งแต่ 18 ขึ้นไป (ระดับสูงกว่าปกติเล็กน้อย ปานกลาง หรือมาก)",
    "ภาวะเสี่ยงซึมเศร้า (9Q): คะแนนรวมตั้งแต่ 7 ขึ้นไป (ระดับน้อย ปานกลาง หรือรุนแรง)"
]: bullet(x)

h("ภาคผนวก C — เครื่องมือมาตรฐาน 3 ชุดที่ใช้งาน",1)
for x in ["1. แบบประเมินภาวะหมดไฟในการทำงาน (Burnout) — 22 ข้อ", "2. แบบประเมินความเครียด (ST-20) — 20 ข้อ", "3. แบบประเมินโรคซึมเศร้า (9Q) — 9 ข้อ"]: bullet(x)

doc.core_properties.title="เอกสารยืนยันความต้องการระบบประเมินสุขภาพใจ"
doc.core_properties.subject="Requirement Confirmation Pack for HR"
doc.core_properties.author="Project Team"
# Save directly to the official deliverable docx file
doc.save(DOCX)
print(f"Built official docx at: {DOCX}")
