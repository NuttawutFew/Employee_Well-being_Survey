<template>
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal-card">
      <div class="modal-header">
        <span class="badge-confirm">ยืนยันการส่ง</span>
        <h2 id="modal-title" class="modal-title">คุณพร้อมส่งแบบประเมินแล้วใช่หรือไม่?</h2>
      </div>

      <div class="modal-body">
        <p class="summary-line">
          ✓ ท่านได้ตอบแบบประเมินครบทั้ง 3 ชุด (จำนวน <strong>51 ข้อ</strong>) เรียบร้อยแล้ว
        </p>

        <div v-if="feedback && feedback.trim()" class="modal-feedback-box">
          <strong>💬 ข้อเสนอแนะของคุณ:</strong>
          <div class="modal-feedback-text">“{{ feedback.trim() }}”</div>
        </div>

        <div class="warning-box">
          <strong>⚠️ ข้อควรทราบก่อนยืนยัน:</strong>
          <ul>
            <li>เมื่อกดยืนยันแล้ว คำตอบทั้งหมดจะถูกล็อกและ<strong>ไม่สามารถแก้ไขได้อีก</strong></li>
            <li>ระบบจะคำนวณคะแนนและแสดงหน้าสรุปผลประเมินของคุณทันที</li>
            <li>ฝ่าย HR จะเห็นผลคะแนนและระดับ แต่ไม่สามารถดูคำตอบรายข้อของคุณได้</li>
          </ul>
        </div>

        <div v-if="error" class="error-banner" role="alert">
          {{ error }}
        </div>
      </div>

      <div class="modal-actions">
        <button
          type="button"
          class="btn-review"
          :disabled="submitting"
          @click="$emit('cancel')"
        >
          กลับไปตรวจสอบ
        </button>

        <button
          type="button"
          class="btn-confirm"
          :disabled="submitting"
          @click="confirmSubmit"
        >
          <span v-if="submitting">กำลังส่งแบบประเมิน...</span>
          <span v-else>ยืนยันส่งแบบประเมิน</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SubmissionModal',
  props: {
    answers: {
      type: Object,
      default: () => ({})
    },
    feedback: {
      type: String,
      default: ''
    },
    employee: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      submitting: false,
      error: null
    };
  },
  methods: {
    async confirmSubmit() {
      this.submitting = true;
      this.error = null;
      try {
        const token = localStorage.getItem('emp_token') || this.employee?.employeeId || 'EMP-DEV-001';
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-employee-id': token
        };

        const snapshot = {
          employeeId: this.employee?.employeeId || token,
          firstName: this.employee?.fullName ? this.employee.fullName.replace(/^คุณ/, '').trim().split(' ')[0] : 'ณิชา',
          lastName: this.employee?.fullName ? (this.employee.fullName.replace(/^คุณ/, '').trim().split(' ')[1] || 'วัฒนกิจ') : 'วัฒนกิจ',
          gender: 'หญิง',
          age: 28,
          telephone: '081-999-8888',
          company: this.employee?.company || 'บมจ. ไอเน็ตเวิร์ก',
          department: this.employee?.department || 'ฝ่ายเทคโนโลยี',
          position: this.employee?.position || 'Software Engineer',
          workArea: 'สำนักงานใหญ่ ชั้น 15',
          startDate: '2022-04-01'
        };

        const res = await fetch('/api/assessment/submit', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            answers: this.answers,
            feedback: this.feedback?.trim() || null,
            snapshot
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'เกิดข้อผิดพลาดในการส่งแบบประเมิน');
        }

        const data = await res.json();
        this.$emit('submitted', { ...data, feedback: this.feedback });
      } catch (err) {
        this.error = err.message;
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}
.modal-card {
  background: #ffffff;
  border-radius: 14px;
  width: 100%;
  max-width: 520px;
  padding: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
.badge-confirm {
  font-size: 0.75rem;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  text-transform: uppercase;
}
.modal-title {
  font-size: 1.3rem;
  color: #0f172a;
  margin: 0.5rem 0 1rem 0;
}
.summary-line {
  color: #059669;
  font-weight: 500;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}
.modal-feedback-box {
  margin: 0.75rem 0;
  padding: 0.75rem 1rem;
  background: #f0f9ff;
  border: 1px dashed #7dd3fc;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #0369a1;
}
.modal-feedback-text {
  color: #0f172a;
  margin-top: 0.25rem;
  font-style: italic;
}
.warning-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #f59e0b;
  border-radius: 6px;
  padding: 1rem;
  color: #334155;
  font-size: 0.9rem;
}
.warning-box ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.25rem;
}
.warning-box li {
  margin-bottom: 0.35rem;
}
.error-banner {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  border-radius: 6px;
  font-size: 0.85rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.75rem;
}
.btn-confirm {
  background: #059669;
  color: #ffffff;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.btn-confirm:hover:not(:disabled) {
  background: #047857;
}
.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-review {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
}
.btn-review:hover:not(:disabled) {
  background: #e2e8f0;
}
</style>
