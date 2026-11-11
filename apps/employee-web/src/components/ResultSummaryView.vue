<template>
  <div class="result-summary-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>กำลังประมวลผลและโหลดผลการประเมิน...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-retry" @click="fetchResult">ลองใหม่อีกครั้ง</button>
    </div>

    <!-- Content State -->
    <div v-else-if="result" class="result-content">
      <!-- 1. Overall Status Card (Box 1: รวมข้อควรทราบไว้ในกล่องเดียวกับภาพรวมผลการประเมิน) -->
      <div 
        class="overall-card" 
        :class="result.overall && result.overall.status === 'NEEDS_ADDITIONAL_CARE' ? 'status-needs-care' : 'status-normal'"
      >
        <div class="overall-card-left">
          <h2 class="overall-title">ภาพรวมผลการประเมิน</h2>
          <div class="submission-timestamp">
            ส่งเมื่อ: {{ formatTime(submittedAt) }}
          </div>
          <div class="overall-disclaimer">
            <svg class="disclaimer-info-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <span class="disclaimer-text">ข้อควรทราบ : ผลลัพธ์นี้เป็นการคัดกรองเบื้องต้นเพื่อส่งเสริมสุขภาวะ ไม่ใช่การวินิจฉัยทางการแพทย์</span>
          </div>
        </div>
        <div class="overall-card-right">
          <div 
            class="overall-badge" 
            :class="result.overall && result.overall.status === 'NEEDS_ADDITIONAL_CARE' ? 'badge-needs-care' : 'badge-normal'"
            :title="(result.overall && result.overall.description) || (result.overall && result.overall.status === 'NEEDS_ADDITIONAL_CARE' ? 'เมื่อพบผลการประเมินอย่างน้อย 1 ด้านที่ไม่อยู่ในเกณฑ์ปกติ' : 'ผลการประเมินสุขภาพใจทุกด้านอยู่ในเกณฑ์ปกติ')"
          >
            <svg v-if="result.overall && result.overall.status === 'NEEDS_ADDITIONAL_CARE'" class="badge-status-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.08L2 22l5.12-1.34C8.58 21.48 10.24 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
            </svg>
            <svg v-else class="badge-status-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>{{ (result.overall && result.overall.label) || (result.overall && result.overall.status === 'NEEDS_ADDITIONAL_CARE' ? 'ควรได้รับการดูแลเพิ่มเติม' : 'ปกติ') }}</span>
          </div>
        </div>
      </div>

      <!-- 2. Assessment Cards Section (Box 2: Burnout เต็มความกว้าง + ความเครียด & ซึมเศร้า 2 คอลัมน์) -->
      <div class="assessment-section">
        <!-- Card 1: Burnout (Full Width) -->
        <div class="card assessment-card burnout-card">
          <div class="card-title-row">
            <h3>1. ภาวะหมดไฟในการทำงาน (Burnout)</h3>
            <span class="badge" :class="getLevelBadgeClass(result.burnout.level)">
              {{ formatLevelThai(result.burnout.level) }}
            </span>
          </div>
          <p class="card-instruction">
            ประเมินแยกตาม 3 มิติหลัก
          </p>
          <div class="dimension-list">
            <div class="dimension-row">
              <span class="dim-name">ความอ่อนล้าทางอารมณ์ (EE):</span>
              <div class="dim-row-right">
                <span class="dim-score">{{ result.burnout.dimensions.EE.score }} คะแนน</span>
                <span class="dim-level" :class="getLevelBadgeClass(result.burnout.dimensions.EE.level)">
                  {{ formatLevelThai(result.burnout.dimensions.EE.level) }}
                </span>
              </div>
            </div>
            <div class="dimension-row">
              <span class="dim-name">การลดความเป็นบุคคล (DP):</span>
              <div class="dim-row-right">
                <span class="dim-score">{{ result.burnout.dimensions.DP.score }} คะแนน</span>
                <span class="dim-level" :class="getLevelBadgeClass(result.burnout.dimensions.DP.level)">
                  {{ formatLevelThai(result.burnout.dimensions.DP.level) }}
                </span>
              </div>
            </div>
            <div class="dimension-row">
              <span class="dim-name">ความสำเร็จส่วนบุคคล (PA):</span>
              <div class="dim-row-right">
                <span class="dim-score">{{ result.burnout.dimensions.PA.score }} คะแนน</span>
                <span class="dim-level" :class="getLevelBadgeClass(result.burnout.dimensions.PA.level)">
                  {{ formatLevelThai(result.burnout.dimensions.PA.level) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2 Columns Grid for ST-20 and 9Q -->
        <div class="secondary-cards-grid">
          <!-- Card 2: Stress -->
          <div class="card assessment-card">
            <div class="card-title-row">
              <h3>2. ความเครียด (ST-20)</h3>
              <span class="badge" :class="getStressBadgeClass(result.stress.level)">
                {{ result.stress.label }}
              </span>
            </div>
            <div class="score-display">
              <span class="score-large">{{ result.stress.totalScore }}</span>
              <span class="score-max">/ 60 คะแนน</span>
            </div>
            <p class="card-note">
              เกณฑ์: 0-5 ต่ำกว่าเกณฑ์ปกติ, 6-17 ปกติ, 18-25 สูงกว่าปกติเล็กน้อย, 26-29 สูงกว่าปกติปานกลาง, 30-60 สูงกว่าปกติมาก
            </p>
          </div>

          <!-- Card 3: 9Q -->
          <div class="card assessment-card">
            <div class="card-title-row">
              <h3>3. โรคซึมเศร้า (9Q)</h3>
              <span class="badge" :class="get9QBadgeClass(result.q9.level)">
                {{ result.q9.label }}
              </span>
            </div>
            <div class="score-display">
              <span class="score-large">{{ result.q9.totalScore }}</span>
              <span class="score-max">/ 27 คะแนน</span>
            </div>
            <p class="card-note">
              เกณฑ์: 0-6 ไม่มีอาการหรือมีน้อยมาก, 7-12 น้อย, 13-18 ปานกลาง, ≥19 รุนแรง
            </p>
          </div>
        </div>
      </div>

      <!-- 3. Feedback Section on Result Screen -->
      <div class="result-feedback-card">
        <h3 class="result-feedback-title">คำแนะนำและข้อเสนอแนะหากต้องการปรับปรุง (ไม่บังคับ)</h3>
        <div class="result-feedback-body">
          <div v-if="feedback && feedback.trim()">
            <div class="feedback-submitted-box">
              <div class="feedback-submitted-label">ข้อเสนอแนะที่ท่านระบุไว้:</div>
              <div class="feedback-submitted-quote">“{{ feedback.trim() }}”</div>
            </div>
            <div class="feedback-success-note">
              <span>✓</span> บันทึกข้อเสนอแนะเรียบร้อยแล้ว ขอบพระคุณสำหรับทุกความคิดเห็นเพื่อการพัฒนา
            </div>
          </div>
          <div v-else>
            <div class="feedback-form-row">
              <input
                v-model="newFeedback"
                type="text"
                placeholder="เช่น ข้อเสนอแนะเกี่ยวกับการทำงาน หรือการดูแลสุขภาพใจในองค์กร"
                class="result-feedback-input"
                :disabled="submittingFeedback"
                @keyup.enter="submitFeedback"
              />
              <button
                type="button"
                class="btn-submit-feedback"
                :disabled="!newFeedback.trim() || submittingFeedback"
                @click="submitFeedback"
              >
                <span v-if="submittingFeedback">กำลังส่ง...</span>
                <span v-else>ส่งข้อเสนอแนะ</span>
              </button>
            </div>
            <div v-if="feedbackSaved" class="feedback-success-note" style="margin-top: 10px;">
              ✓ บันทึกข้อเสนอแนะเรียบร้อยแล้ว ขอบพระคุณสำหรับความคิดเห็นเพื่อการปรับปรุงครับ
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Privacy & Completion Footer -->
      <div class="completion-footer">
        <p>🔒 ข้อมูลการประเมินของท่านได้รับการจัดเก็บอย่างปลอดภัยตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResultSummaryView',
  emits: ['open-contact-hr'],
  props: {
    initialResult: {
      type: Object,
      default: null
    },
    initialSubmittedAt: {
      type: String,
      default: null
    },
    initialFeedback: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      error: null,
      result: this.initialResult,
      submittedAt: this.initialSubmittedAt,
      feedback: this.initialFeedback,
      newFeedback: '',
      submittingFeedback: false,
      feedbackSaved: false
    };
  },
  watch: {
    initialFeedback(newVal) {
      if (newVal) {
        this.feedback = newVal;
      }
    },
    initialResult(newVal) {
      if (newVal) {
        this.result = newVal;
      }
    }
  },
  async mounted() {
    if (!this.result || !this.feedback) {
      await this.fetchResult();
    }
  },
  methods: {
    async fetchResult() {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('emp_token') || 'EMP-DEV-001';
        const res = await fetch('/api/assessment/result', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-employee-id': token
          }
        });
        if (!res.ok) {
          throw new Error('ไม่สามารถโหลดผลการประเมินได้ (' + res.status + ')');
        }
        const data = await res.json();
        this.result = data.result;
        this.submittedAt = data.submittedAt;
        this.feedback = data.feedback || null;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async submitFeedback() {
      if (!this.newFeedback.trim()) return;
      this.submittingFeedback = true;
      try {
        const token = localStorage.getItem('emp_token') || 'EMP-DEV-001';
        const res = await fetch('/api/assessment/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-employee-id': token
          },
          body: JSON.stringify({ feedback: this.newFeedback.trim() })
        });
        if (res.ok) {
          this.feedback = this.newFeedback.trim();
          this.feedbackSaved = true;
        }
      } catch (e) {
        console.error('Failed to submit feedback:', e);
      } finally {
        this.submittingFeedback = false;
      }
    },
    formatTime(isoString) {
      if (!isoString) return '-';
      return new Date(isoString).toLocaleString('th-TH');
    },
    formatLevelThai(level) {
      switch (level) {
        case 'LOW': return 'ต่ำ';
        case 'MODERATE': return 'ปานกลาง';
        case 'HIGH': return 'สูง';
        default: return level || '-';
      }
    },
    getLevelBadgeClass(level) {
      if (level === 'HIGH') return 'badge-danger';
      if (level === 'MODERATE') return 'badge-warning';
      return 'badge-success';
    },
    getStressBadgeClass(level) {
      if (level === 'SEVERE' || level === 'MODERATE') return 'badge-danger';
      if (level === 'MILD') return 'badge-warning';
      return 'badge-success';
    },
    get9QBadgeClass(level) {
      if (level === 'SEVERE' || level === 'MODERATE') return 'badge-danger';
      if (level === 'MILD') return 'badge-warning';
      return 'badge-success';
    }
  }
};
</script>

<style scoped>
.result-summary-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.loading-state, .error-state {
  text-align: center;
  padding: 2.5rem 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.5rem 1.25rem;
  background: #0284c7;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* 1. Overall Status Card (Box 1) */
.overall-card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.25rem;
}

@media (min-width: 640px) {
  .overall-card {
    padding: 1.5rem 1.75rem;
  }
}

@media (max-width: 640px) {
  .overall-card {
    flex-direction: column;
    align-items: flex-start;
  }
}

.status-needs-care {
  border-left: 6px solid #f59e0b;
}

.status-normal {
  border-left: 6px solid #10b981;
}

.overall-card-left {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.overall-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.submission-timestamp {
  font-size: 0.84rem;
  color: #64748b;
  margin-bottom: 0.2rem;
}

.overall-disclaimer {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
}

.disclaimer-info-icon {
  width: 17px;
  height: 17px;
  color: #0284c7;
  flex-shrink: 0;
}

.disclaimer-text {
  color: #64748b;
}

.overall-card-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.overall-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 1.15rem;
  border-radius: 9999px;
  font-size: 0.88rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-needs-care {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.badge-normal {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.badge-status-icon {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
}

/* 2. Assessment Cards Section (Box 2) */
.assessment-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.burnout-card {
  width: 100%;
}

.secondary-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 640px) {
  .secondary-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.assessment-card {
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.35rem 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.card-title-row h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.card-instruction {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 0.85rem 0;
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.dimension-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.55rem 0.95rem;
  background-color: #f8fafc;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
  font-size: 0.88rem;
  gap: 0.75rem;
}

.dim-name {
  color: #334155;
  flex: 1;
}

.dim-row-right {
  display: flex;
  align-items: center;
  gap: 1.75rem;
}

.dim-score {
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
}

.dim-level {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.25rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid transparent;
  min-width: 60px;
}

.score-display {
  margin: 0.5rem 0 0.65rem 0;
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.score-large {
  font-size: 1.65rem;
  font-weight: 700;
  color: #0284c7;
}

.score-max {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.card-note {
  font-size: 0.78rem;
  color: #64748b;
  margin-top: 0.65rem;
  margin-bottom: 0;
  line-height: 1.45;
}

/* Header Status Badges */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.25rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid transparent;
}

.badge-success {
  background-color: #d1fae5;
  color: #065f46;
  border-color: #a7f3d0;
}

.badge-warning {
  background-color: #fef3c7;
  color: #92400e;
  border-color: #fde68a;
}

.badge-danger {
  background-color: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}

/* 3. Feedback Card */
.result-feedback-card {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.35rem 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
}

.result-feedback-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.85rem 0;
}

.feedback-submitted-box {
  background: #f0f9ff;
  border-left: 3.5px solid #0284c7;
  border-radius: 0 10px 10px 0;
  padding: 12px 16px;
  font-size: 0.92rem;
  color: #0f172a;
  margin-bottom: 10px;
}

.feedback-submitted-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #0369a1;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.feedback-submitted-quote {
  color: #0c4a6e;
  font-style: italic;
  line-height: 1.5;
}

.feedback-success-note {
  font-size: 0.82rem;
  color: #16a34a;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.feedback-form-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.result-feedback-input {
  flex: 1;
  min-width: 240px;
  padding: 9px 14px;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.88rem;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
  color: #1e293b;
}

.result-feedback-input::placeholder {
  color: #94a3b8;
}

.result-feedback-input:focus {
  border-color: #0284c7;
}

.btn-submit-feedback {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-submit-feedback:hover:not(:disabled) {
  background: #0369a1;
}

.btn-submit-feedback:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.completion-footer {
  text-align: center;
  font-size: 0.825rem;
  color: #64748b;
  padding: 0.5rem;
}
</style>
