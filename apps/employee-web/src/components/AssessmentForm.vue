<template>
  <div class="assessment-container">
    <!-- Stepper Header -->
    <div class="stepper-header">
      <!-- Desktop & Tablet Stepper (>= 640px) -->
      <div class="sequence-steps desktop-stepper" role="navigation" aria-label="ขั้นตอนการประเมิน">
        <div
          v-for="(stepName, sIdx) in stepNames"
          :key="sIdx"
          class="step-item"
          :class="{
            'is-active': sIdx === assessmentIndex,
            'is-done': sIdx < assessmentIndex
          }"
        >
          <div class="step-indicator">
            <span v-if="sIdx < assessmentIndex">✓</span>
            <span v-else>{{ sIdx + 1 }}</span>
          </div>
          <span class="step-title">{{ stepName }}</span>
        </div>
      </div>

      <!-- Mobile Adaptive Stepper (< 640px) -->
      <div class="mobile-stepper" role="navigation" aria-label="ขั้นตอนการประเมิน (มือถือ)">
        <div class="mobile-steps-track">
          <template v-for="(stepName, sIdx) in stepNames">
            <div
              :key="'m-step-' + sIdx"
              class="mobile-step-node"
              :class="{
                'is-active': sIdx === assessmentIndex,
                'is-done': sIdx < assessmentIndex
              }"
            >
              <div class="step-indicator">
                <span v-if="sIdx < assessmentIndex">✓</span>
                <span v-else>{{ sIdx + 1 }}</span>
              </div>
            </div>
            <div
              v-if="sIdx < stepNames.length - 1"
              :key="'m-line-' + sIdx"
              class="mobile-step-connector"
              :class="{ 'connector-done': sIdx < assessmentIndex }"
            ></div>
          </template>
        </div>
        <div class="mobile-current-step-label">
          <span class="step-current-tag">ชุดที่ {{ assessmentIndex + 1 }}/{{ totalAssessments }}</span>
          <span class="step-current-name">{{ stepNames[assessmentIndex] }}</span>
        </div>
      </div>
    </div>

    <!-- Sticky Bar -->
    <div class="sticky-bar">
      <div class="assessment-info">
        <span class="badge-index">แบบประเมินชุดที่ {{ assessmentIndex + 1 }} จาก {{ totalAssessments }}</span>
        <h2 class="assessment-title">{{ assessment.title }}</h2>
      </div>
    </div>

    <!-- Validation Error Summary -->
    <div
      v-if="validationError"
      id="error-summary"
      class="validation-error-banner"
      role="alert"
      tabindex="-1"
    >
      <div class="error-banner-content">
        <strong>⚠️ กรุณาตอบคำถามให้ครบทุกข้อก่อนดำเนินการต่อ</strong>
        <p>ยังคงมีคำถามที่ยังไม่ได้ตอบอีก {{ missingCount }} ข้อ (ดูแถบสีแดงด้านล่าง)</p>
      </div>
    </div>


    <!-- Instructions & Progress -->
    <div class="intro-box">
      <div class="instruction-header">
        <span class="instruction-icon">📋</span>
        <p class="instruction-text">{{ assessment.instruction }}</p>
      </div>
      <div class="progress-info">
        <div class="progress-labels">
          <span class="progress-text">ความคืบหน้าชุดนี้: <strong>{{ answeredCount }}</strong> จาก {{ assessment.questions.length }} ข้อ</span>
          <span class="progress-badge">{{ progressPercent }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Questions Form -->
    <form class="questions-form" @submit.prevent="validateAndProceed">
      <div
        v-for="(q, idx) in assessment.questions"
        :key="q.code"
        :id="'q-item-' + q.code"
        :ref="'question_' + q.code"
        class="question-card"
        :class="{
          'is-answered': localAnswers[q.code] !== undefined,
          'has-error': isMissing(q.code)
        }"
      >
        <div class="question-header">
          <div class="q-number" :class="{ 'error-number': isMissing(q.code) }">
            <span>{{ idx + 1 }}</span>
          </div>
          <div class="q-content">
            <p class="q-text">{{ q.text }}</p>
            <span v-if="q.timeframe" class="q-timeframe">⏱️ {{ q.timeframe }}</span>
            <span v-if="isMissing(q.code)" class="missing-text" role="alert">⚠️ โปรดเลือกคำตอบสำหรับข้อนี้ก่อนดำเนินการต่อ</span>
          </div>
        </div>

        <div class="options-grid" role="radiogroup" :aria-label="q.text">
          <label
            v-for="opt in assessment.options"
            :key="opt.code"
            class="option-tile"
            :class="{ 'is-selected': localAnswers[q.code] === opt.code }"
          >
            <input
              type="radio"
              :name="q.code"
              :value="opt.code"
              :checked="localAnswers[q.code] === opt.code"
              class="sr-only"
              @change="onSelectAnswer(q.code, opt.code)"
            />
            <span class="opt-indicator"></span>
            <span class="opt-label">{{ opt.label }}</span>
          </label>
        </div>
      </div>

      <!-- Bottom Validation Alert -->
      <div v-if="validationError" class="bottom-validation-alert" role="alert">
        <strong>⚠️ ยังตอบไม่ครบ: ขาดอีก {{ missingCount }} ข้อ</strong>
        <p>กรุณาตอบข้อที่มีกรอบสีแดง หรือคลิกข้อด้านล่างเพื่อเลื่อนไปตอบ:</p>
        <div class="missing-chips">
          <button 
            v-for="code in missingQuestions" 
            :key="code" 
            type="button" 
            class="chip-missing" 
            @click="scrollToQuestion(code)"
          >
            ข้อ {{ getQuestionNumber(code) }}
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <div class="primary-nav-buttons">
          <button
            v-if="assessmentIndex > 0"
            type="button"
            class="btn-prev"
            @click="$emit('prev')"
          >
            ← ย้อนกลับ
          </button>

          <button type="submit" class="btn-next">
            <span v-if="assessmentIndex === totalAssessments - 1">ตรวจสอบและส่งแบบประเมิน →</span>
            <span v-else>ไปยังแบบประเมินถัดไป →</span>
          </button>
        </div>

        <!-- Secondary Utilities Bar -->
        <div class="secondary-utilities">
          <button type="button" class="btn-clear" @click="clearCurrentPage">
            ล้างคำตอบชุดนี้
          </button>

          <button type="button" class="btn-dev-fill" title="เติมคำตอบชุดนี้เพื่อความสะดวกในการทดสอบ" @click="autoFillDev">
            ⚡ เติมคำตอบอัตโนมัติ (สำหรับทดสอบ)
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'AssessmentForm',
  props: {
    assessment: {
      type: Object,
      required: true
    },
    assessmentIndex: {
      type: Number,
      default: 0
    },
    totalAssessments: {
      type: Number,
      default: 3
    },
    initialAnswers: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      localAnswers: { ...this.initialAnswers },
      validationError: false,
      missingQuestions: [],
      stepNames: [
        'ภาวะหมดไฟ (Burnout)',
        'ความเครียด (Stress)',
        'โรคซึมเศร้า (9Q)'
      ]
    };
  },
  computed: {
    answeredCount() {
      return this.assessment.questions.filter(
        (q) => this.localAnswers[q.code] !== undefined && this.localAnswers[q.code] !== null
      ).length;
    },
    missingCount() {
      return this.assessment.questions.length - this.answeredCount;
    },
    progressPercent() {
      if (!this.assessment.questions.length) return 0;
      return Math.round((this.answeredCount / this.assessment.questions.length) * 100);
    }
  },
  watch: {
    assessment: {
      immediate: true,
      handler() {
        this.validationError = false;
        this.missingQuestions = [];
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    initialAnswers: {
      deep: true,
      handler(newVal) {
        this.localAnswers = { ...newVal };
        if (!newVal || Object.keys(newVal).length === 0) {
          this.validationError = false;
          this.missingQuestions = [];
        }
      }
    }
  },
  methods: {
    isMissing(code) {
      return this.missingQuestions.includes(code);
    },
    onSelectAnswer(questionCode, optionCode) {
      this.$set(this.localAnswers, questionCode, optionCode);

      // Remove from missing questions if answered
      const mIdx = this.missingQuestions.indexOf(questionCode);
      if (mIdx !== -1) {
        this.missingQuestions.splice(mIdx, 1);
        if (this.missingQuestions.length === 0) {
          this.validationError = false;
        }
      }

      this.$emit('answers-updated', {
        answers: this.localAnswers
      });
    },
    clearCurrentPage() {
      if (!confirm('คุณต้องการล้างคำตอบในหน้านี้ทั้งหมดใช่หรือไม่?')) return;
      this.assessment.questions.forEach((q) => {
        this.$delete(this.localAnswers, q.code);
      });
      this.validationError = false;
      this.missingQuestions = [];
      this.$emit('answers-updated', {
        answers: this.localAnswers
      });
    },
    getQuestionNumber(code) {
      const idx = this.assessment.questions.findIndex((q) => q.code === code);
      return idx !== -1 ? idx + 1 : code;
    },
    scrollToQuestion(code) {
      const el = document.getElementById('q-item-' + code);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const radio = el.querySelector('input[type="radio"]');
        if (radio) radio.focus();
      }
    },
    autoFillDev() {
      // Pick a valid option for any unanswered questions in this form
      for (const q of this.assessment.questions) {
        if (this.localAnswers[q.code] === undefined || this.localAnswers[q.code] === null) {
          const opt = this.assessment.options[0] || { code: 0 };
          this.$set(this.localAnswers, q.code, opt.code);
        }
      }
      this.validationError = false;
      this.missingQuestions = [];
      this.$emit('answers-updated', {
        answers: this.localAnswers
      });
    },
    validateAndProceed() {
      const missing = [];
      for (const q of this.assessment.questions) {
        if (this.localAnswers[q.code] === undefined || this.localAnswers[q.code] === null) {
          missing.push(q.code);
        }
      }

      if (missing.length > 0) {
        this.missingQuestions = missing;
        this.validationError = true;

        this.$nextTick(() => {
          this.scrollToQuestion(missing[0]);
        });
        return;
      }

      this.validationError = false;
      this.missingQuestions = [];
      this.$emit('next', {
        answers: this.localAnswers,
        isComplete: true
      });
    }
  }
};
</script>

<style scoped>
.assessment-container {
  width: 100%;
  box-sizing: border-box;
  padding-bottom: 5rem;
}

/* ==========================================================================
   Stepper Header (Desktop vs Mobile Adaptive)
   ========================================================================== */
.stepper-header {
  margin-bottom: 1.25rem;
}

/* Desktop & Tablet Stepper (>= 640px) */
.desktop-stepper {
  display: none;
  justify-content: space-between;
  gap: 0.5rem;
  background: #ffffff;
  padding: 0.85rem 1.25rem;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

@media (min-width: 768px) {
  .desktop-stepper {
    display: flex;
  }
  .mobile-stepper {
    display: none !important;
  }
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.55;
  font-size: 0.82rem;
  font-weight: 500;
  color: #64748b;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.step-item.is-active {
  opacity: 1;
  color: #2563eb;
  font-weight: 700;
}

.step-item.is-done {
  opacity: 0.9;
  color: #059669;
}

.step-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 1.5px solid #cbd5e1;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.is-active .step-indicator {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

.is-done .step-indicator {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
}

/* Mobile Stepper (< 640px) */
.mobile-stepper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  background: #ffffff;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.mobile-steps-track {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 320px;
}

.mobile-step-node {
  position: relative;
  z-index: 2;
}

.mobile-step-node .step-indicator {
  width: 28px;
  height: 28px;
  font-size: 0.8rem;
}

.mobile-step-connector {
  flex: 1;
  height: 3px;
  background: #e2e8f0;
  margin: 0 4px;
  border-radius: 2px;
  transition: background 0.2s ease;
}

.mobile-step-connector.connector-done {
  background: #10b981;
}

.mobile-current-step-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  text-align: center;
}

.step-current-tag {
  background: #eff6ff;
  color: #2563eb;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.step-current-name {
  font-weight: 600;
  color: #0f172a;
}

/* ==========================================================================
   Sticky Bar
   ========================================================================== */
.sticky-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.badge-index {
  font-size: 0.75rem;
  font-weight: 700;
  color: #2563eb;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.assessment-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0.2rem 0 0 0;
  line-height: 1.3;
}

@media (min-width: 640px) {
  .assessment-title {
    font-size: 1.45rem;
  }
}

/* ==========================================================================
   Instruction & Progress Card
   ========================================================================== */
.intro-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.15rem 1.35rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.instruction-header {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.instruction-icon {
  font-size: 1.25rem;
  line-height: 1.4;
  flex-shrink: 0;
}

.instruction-text {
  font-size: 0.92rem;
  color: #334155;
  margin: 0;
  line-height: 1.6;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  color: #64748b;
}

.progress-text strong {
  color: #1e293b;
}

.progress-badge {
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.1rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.78rem;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 9999px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ==========================================================================
   Question Cards
   ========================================================================== */
.questions-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

@media (min-width: 640px) {
  .questions-form {
    gap: 1.5rem;
  }
}

.question-card {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
}

@media (min-width: 640px) {
  .question-card {
    padding: 1.5rem 1.75rem;
  }
}

.question-card.is-answered {
  border-color: #bfdbfe;
  background-color: #fbfdff;
}

.question-card.has-error {
  border-color: #ef4444;
  background-color: #fffaf9;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.question-header {
  display: flex;
  gap: 0.85rem;
  margin-bottom: 1.15rem;
}

.q-number {
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
  font-size: 0.9rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1.5px solid #bfdbfe;
}

.q-number.error-number {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #f87171;
}

.q-content {
  flex: 1;
}

.q-text {
  font-size: 1.05rem;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
  line-height: 1.6;
}

.q-timeframe {
  display: inline-block;
  font-size: 0.78rem;
  color: #475569;
  background: #f1f5f9;
  padding: 0.15rem 0.55rem;
  border-radius: 6px;
  margin-top: 0.35rem;
}

.missing-text {
  display: block;
  font-size: 0.82rem;
  color: #dc2626;
  font-weight: 600;
  margin-top: 0.45rem;
}

/* ==========================================================================
   Option Tiles (Responsive Touch Targets)
   ========================================================================== */
.options-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
}

@media (min-width: 640px) {
  .options-grid {
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 0.75rem;
  }
}

.option-tile {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-height: 52px;
  padding: 0.85rem 1.15rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  box-sizing: border-box;
}

.option-tile:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.option-tile:active {
  transform: scale(0.985);
}

.option-tile.is-selected {
  background: #eff6ff;
  border-color: #2563eb;
  color: #1d4ed8;
  font-weight: 600;
  box-shadow: 0 0 0 1.5px #2563eb, 0 4px 6px -1px rgba(37, 99, 235, 0.12);
}

.opt-indicator {
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
  position: relative;
  transition: all 0.18s ease;
}

.option-tile.is-selected .opt-indicator {
  border-color: #2563eb;
  background: #2563eb;
  box-shadow: inset 0 0 0 4px #ffffff;
}

.opt-label {
  font-size: 0.92rem;
  line-height: 1.35;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* ==========================================================================
   Validation Error Banners
   ========================================================================== */
.validation-error-banner {
  background: #fef2f2;
  border: 2px solid #ef4444;
  border-radius: 12px;
  padding: 1.15rem;
  margin-bottom: 1.25rem;
  color: #991b1b;
}

.validation-error-banner p {
  margin: 0.35rem 0 0 0;
  font-size: 0.88rem;
}


.bottom-validation-alert {
  margin-top: 1.75rem;
  padding: 1.25rem;
  background: #fef2f2;
  border: 2px solid #ef4444;
  border-radius: 12px;
  color: #991b1b;
}

.bottom-validation-alert strong {
  display: block;
  font-size: 1rem;
  margin-bottom: 0.35rem;
}

.bottom-validation-alert p {
  margin: 0 0 0.65rem 0;
  font-size: 0.88rem;
  color: #b91c1c;
}

.missing-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip-missing {
  padding: 0.35rem 0.75rem;
  background: #fee2e2;
  border: 1px solid #f87171;
  border-radius: 9999px;
  color: #991b1b;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chip-missing:hover {
  background: #ef4444;
  color: white;
  transform: scale(1.03);
}

/* ==========================================================================
   Form Action Buttons
   ========================================================================== */
.form-actions {
  margin-top: 2.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.primary-nav-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
}

.btn-next {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff;
  border: none;
  padding: 0.95rem 1.85rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  margin-left: auto;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
  transition: all 0.15s ease;
}

.btn-next:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.38);
}

.btn-next:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-prev {
  background: #ffffff;
  color: #334155;
  border: 1.5px solid #cbd5e1;
  padding: 0.9rem 1.5rem;
  border-radius: 10px;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-prev:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.secondary-utilities {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px dashed #e2e8f0;
  flex-wrap: wrap;
}

.btn-clear {
  background: transparent;
  color: #94a3b8;
  border: 1px solid transparent;
  padding: 0.5rem 0.85rem;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-clear:hover {
  color: #dc2626;
  background: #fef2f2;
}

.btn-dev-fill {
  background: #fef3c7;
  color: #92400e;
  border: 1px dashed #f59e0b;
  padding: 0.5rem 0.95rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-left: auto;
}

.btn-dev-fill:hover {
  background: #fde68a;
  color: #78350f;
}
</style>
