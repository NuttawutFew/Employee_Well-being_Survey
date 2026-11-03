<template>
  <div class="notice-container">
    <div class="notice-card">
      <div class="badge-notice">คำชี้แจงก่อนเริ่มทำแบบประเมิน</div>
      <h2 class="title">Employee Well-being Survey</h2>

      <div class="notice-content">
        <section class="section">
          <h3>1. วัตถุประสงค์และขอบเขต</h3>
          <p>
            แบบประเมินนี้จัดทำขึ้นเพื่อประเมินความคิดเห็น ความรู้สึก หรืออารมณ์ของผู้ตอบในลักษณะทั่วไปเท่านั้น มิได้มีวัตถุประสงค์เพื่อวินิจฉัย ประเมิน หรือคาดการณ์ภาวะสุขภาพหรือภาวะทางสุขภาพจิตของผู้ตอบ และผลจากแบบประเมินไม่ถือเป็นการวินิจฉัยทางการแพทย์แต่อย่างใด
          </p>
        </section>

        <section class="section">
          <h3>2. แบบประเมินทั้ง 3 ชุด</h3>
          <p>การประเมินประกอบด้วยเครื่องมือมาตรฐาน 3 ชุด เรียงตามลำดับ รวม 51 ข้อ (ใช้เวลาประมาณ 8-10 นาที):</p>
          <div class="assessment-cards-preview">
            <div class="preview-item">
              <span class="preview-num">1</span>
              <div class="preview-info">
                <strong>ภาวะหมดไฟในการทำงาน (Burnout)</strong>
                <span class="preview-meta">22 ข้อ</span>
              </div>
            </div>
            <div class="preview-item">
              <span class="preview-num">2</span>
              <div class="preview-info">
                <strong>ความเครียด</strong>
                <span class="preview-meta">20 ข้อ</span>
              </div>
            </div>
            <div class="preview-item">
              <span class="preview-num">3</span>
              <div class="preview-info">
                <strong>สภาวะทางอารมณ์</strong>
                <span class="preview-meta">9 ข้อ</span>
              </div>
            </div>
          </div>
        </section>

        <section class="section alert-section">
          <div class="alert-title-row">
            <span class="alert-icon">🔒</span>
            <h3>3. การเข้าถึงข้อมูลและความเป็นส่วนตัว (PDPA)</h3>
          </div>
          <ul>
            <li>ผลการประเมินจะถูกบันทึกผูกกับรหัสพนักงานของคุณ โดยข้อมูลระบุตัวตน (ชื่อ-นามสกุล, เพศ, อายุ, รหัสพนักงาน) ได้รับการเข้ารหัสที่ปลอดภัยด้วยมาตรฐาน <strong>AES-256-GCM</strong></li>
            <li><strong>ฝ่ายบริหารทรัพยากรบุคคล (HR/Admin):</strong> สามารถดูคะแนนรวมและระดับผลรายบุคคลเพื่อการวางแผนดูแลพนักงาน มีการปิดบังข้อมูลบนหน้าจอ (UI Masking) และ <em>ไม่สามารถเข้าถึงคำตอบรายข้อของคุณได้เด็ดขาด</em></li>
            <li><strong>สถิติองค์กร (Dashboard):</strong> มีระบบระงับการแสดงสถิติหากกลุ่มตัวอย่างน้อยกว่า 5 คน เพื่อป้องกันการสืบย้อนถึงตัวบุคคล</li>
            <li><strong>อายุการเก็บรักษา:</strong> ข้อมูลระบุตัวตนจะถูกจัดเก็บเป็นเวลา <strong>1 ปี</strong> นับจากวันที่ส่งแบบประเมิน หลังจากนั้นจะถูกลบข้อมูลส่วนบุคคลออก และเก็บบันทึกประวัติการใช้งาน (Audit Logs) เป็นเวลา <strong>2 ปี</strong></li>
            <li>
              <a href="https://www.inet.co.th/api/v1/pdf/Privacy_Policy/%E0%B8%99%E0%B9%82%E0%B8%A2%E0%B8%9A%E0%B8%B2%E0%B8%A2%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%84%E0%B8%B8%E0%B9%89%E0%B8%A1%E0%B8%84%E0%B8%A3%E0%B8%AD%E0%B8%87%E0%B8%82%E0%B9%89%E0%B8%AD%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B8%AA%E0%B9%88%E0%B8%A7%E0%B8%99%E0%B8%9A%E0%B8%B8%E0%B8%84%E0%B8%84%E0%B8%A5%E0%B8%AA%E0%B8%B3%E0%B8%AB%E0%B8%A3%E0%B8%B1%E0%B8%9A%E0%B8%9E%E0%B8%99%E0%B8%B1%E0%B8%81%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%9C%E0%B8%B9%E0%B9%89%E0%B8%AA%E0%B8%A1%E0%B8%B1%E0%B8%84%E0%B8%A3%E0%B8%87%E0%B8%B2%E0%B8%99.pdf" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: underline; font-weight: 500;">
                นโยบายคุ้มครองข้อมูลส่วนบุคคลสำหรับพนักงานและผู้สมัคร
              </a>
            </li>
          </ul>
        </section>

        <section class="section">
          <h3>4. สิทธิ์และการส่งแบบประเมิน</h3>
          <p>
            กรุณาทำแบบประเมินให้เสร็จสิ้นในคราวเดียว หากออกจากระบบหรือปิดหน้าต่าง คำตอบจะไม่ถูกบันทึก และต้องเริ่มต้นใหม่ตั้งแต่ต้น
          </p>
        </section>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="actions">
        <button 
          id="mh-btn-consent"
          class="btn-acknowledge" 
          :disabled="loading" 
          @click="acknowledge"
        >
          <span v-if="loading">กำลังบันทึก...</span>
          <span v-else>รับทราบ</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NoticeView',
  emits: ['acknowledged', 'open-contact-hr'],
  props: {
    noticeVersion: {
      type: String,
      default: '2026-09-03'
    }
  },
  data() {
    return {
      loading: false,
      error: null
    };
  },
  methods: {
    async acknowledge() {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('emp_token') || 'EMP-DEV-001';
        const res = await fetch('/api/assessment/notice/acknowledge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-employee-id': token
          },
          body: JSON.stringify({
            noticeVersion: this.noticeVersion
          })
        });

        if (!res.ok) {
          throw new Error('บันทึกการรับทราบไม่สำเร็จ (' + res.status + ')');
        }

        const data = await res.json();
        this.$emit('acknowledged', data);
      } catch (e) {
        this.error = e.message || 'เกิดข้อผิดพลาดในการบันทึกการรับทราบ กรุณาลองใหม่อีกครั้ง';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.notice-container {
  width: 100%;
  box-sizing: border-box;
}

.notice-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

@media (min-width: 640px) {
  .notice-card {
    padding: 2.25rem 2.5rem;
  }
}

.badge-notice {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #0284c7;
  background-color: #e0f2fe;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  margin-bottom: 0.85rem;
  letter-spacing: 0.02em;
}

.title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1.5rem 0;
  line-height: 1.4;
}

@media (min-width: 640px) {
  .title {
    font-size: 1.6rem;
  }
}

.notice-content {
  color: #334155;
  font-size: 0.95rem;
  line-height: 1.65;
}

.section {
  margin-bottom: 1.75rem;
}

.section h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.65rem 0;
}

.assessment-cards-preview {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
  margin-top: 0.75rem;
}

@media (min-width: 640px) {
  .assessment-cards-preview {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.85rem;
  }
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem 1rem;
}

.preview-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  color: #2563eb;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preview-info {
  display: flex;
  flex-direction: column;
}

.preview-info strong {
  font-size: 0.88rem;
  color: #1e293b;
}

.preview-meta {
  font-size: 0.76rem;
  color: #64748b;
}

.alert-section {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-left: 5px solid #16a34a;
  padding: 1.25rem 1.5rem;
  border-radius: 12px;
}

.alert-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.alert-title-row h3 {
  margin: 0;
  color: #166534;
}

.alert-section ul {
  padding-left: 1.25rem;
  margin: 0.5rem 0 0 0;
  color: #15803d;
}

.alert-section li {
  margin-bottom: 0.45rem;
  font-size: 0.9rem;
}

.alert-section li strong {
  color: #14532d;
}

.actions {
  margin-top: 2.25rem;
  text-align: center;
}

.btn-acknowledge {
  width: 100%;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff;
  font-size: 1.05rem;
  font-weight: 600;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
  transition: all 0.15s ease;
}

.btn-acknowledge:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.38);
}

.btn-acknowledge:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 0.85rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  border-radius: 8px;
  font-size: 0.9rem;
}
</style>
