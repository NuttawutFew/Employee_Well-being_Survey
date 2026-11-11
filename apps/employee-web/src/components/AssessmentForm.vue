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

        <div class="scale-rating-wrapper">
          <div class="scale-track" role="radiogroup" :aria-label="'ระดับคำตอบสำหรับข้อที่ ' + (idx + 1)">
            <div class="scale-track-line" aria-hidden="true"></div>
            <label
              v-for="(opt, optIdx) in assessment.options"
              :key="opt.code !== undefined ? opt.code : optIdx"
              class="scale-item"
              :class="{ 'is-selected': isOptSelected(q.code, opt.code) }"
              :style="getScaleItemStyle(optIdx, assessment.options.length)"
              :title="opt.label"
            >
              <input
                type="radio"
                :name="q.code"
                :value="opt.code"
                :checked="isOptSelected(q.code, opt.code)"
                class="sr-only"
                @change="onSelectAnswer(q.code, opt.code)"
              />
              <div class="scale-label-wrap">
                <span class="scale-label" v-html="formatScaleLabel(opt.label)"></span>
              </div>
              <div class="scale-circle-wrap">
                <span class="scale-circle">
                  <span class="scale-circle-dot"></span>
                </span>
              </div>
            </label>
          </div>
          <div
            class="scale-live-feedback"
            :class="{ 'has-value': localAnswers[q.code] !== undefined && localAnswers[q.code] !== null }"
            :style="getLiveFeedbackStyle(q.code)"
          >
            <span v-if="localAnswers[q.code] !== undefined && localAnswers[q.code] !== null" class="feedback-badge">
              ✓ คำตอบที่เลือก: <strong :style="{ color: getSelectedStepInfo(q.code)?.dark }">{{ getSelectedOptionLabel(q.code) }}</strong>
            </span>
            <span v-else class="feedback-placeholder">
              👆 โปรดแตะเลือกวงกลมด้านบน
            </span>
          </div>
        </div>
      </div>

      <!-- Feedback Section (ส่วนสุดท้าย: คำแนะนำและข้อเสนอแนะเพื่อการปรับปรุง) -->
      <div v-if="assessmentIndex === totalAssessments - 1" class="mh-assessment-feedback-wrap">
        <div class="feedback-card">
          <div class="feedback-card-header">
            <div class="feedback-icon-box">💬</div>
            <div class="feedback-card-title-group">
              <div class="feedback-card-badge-row">
                <span class="feedback-section-badge">ส่วนสุดท้าย</span>
                <span class="feedback-optional-pill">ไม่บังคับตอบ (Optional)</span>
              </div>
              <h3 class="feedback-card-title">คำแนะนำและข้อเสนอแนะหากต้องการปรับปรุง</h3>
            </div>
          </div>
          <p class="feedback-invitation-quote">
            “เรายินดีรับฟังทุกข้อเสนอแนะ เพื่อนำไปปรับปรุงและพัฒนาให้ดียิ่งขึ้น”
          </p>
          <div class="feedback-input-wrapper">
            <textarea
              v-model="feedbackText"
              class="feedback-textarea"
              rows="3"
              maxlength="500"
              placeholder="พิมพ์ข้อความสั้นๆ หรือข้อเสนอแนะของคุณที่นี่ (เช่น ข้อแนะนำเกี่ยวกับการทำงาน บรรยากาศ หรือการดูแลสุขภาพใจในองค์กร)..."
            ></textarea>
            <div class="feedback-helper-row">
              <span class="feedback-hint">💡 ตอบข้อความสั้นๆ หรือเว้นว่างไว้ได้ตามความสะดวกของท่าน</span>
              <span class="feedback-counter">{{ feedbackText.length }}/500 ตัวอักษร</span>
            </div>
          </div>
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

          <button 
            v-if="isMockEnabled" 
            type="button" 
            class="btn-dev-fill" 
            title="เติมคำตอบชุดนี้เพื่อความสะดวกในการทดสอบ" 
            @click="autoFillDev"
          >
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
    },
    initialFeedback: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      localAnswers: { ...this.initialAnswers },
      feedbackText: this.initialFeedback || '',
      validationError: false,
      missingQuestions: [],
      stepNames: [
        'ภาวะหมดไฟ (Burnout)',
        'ความเครียด (ST-20)',
        'โรคซึมเศร้า (9Q)'
      ]
    };
  },
  computed: {
    isMockEnabled() {
      return import.meta.env.VITE_ENABLE_MOCK !== 'false' && import.meta.env.VITE_ENABLE_MOCK !== false;
    },
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
    },
    initialFeedback(newVal) {
      this.feedbackText = newVal || '';
    },
    feedbackText(newVal) {
      this.$emit('feedback-updated', newVal);
    }
  },
  methods: {
    isMissing(code) {
      return this.missingQuestions.includes(code);
    },
    isOptSelected(qCode, optCode) {
      if (this.localAnswers[qCode] === undefined || this.localAnswers[qCode] === null) return false;
      return String(this.localAnswers[qCode]) === String(optCode);
    },
    getScaleColor(index, total) {
      const stops7 = [
        { color: '#10b981', dark: '#047857', light: '#ecfdf5', border: '#6ee7b7', text: '#065f46', glow: 'rgba(16, 185, 129, 0.35)', ring: 'rgba(16, 185, 129, 0.25)' }, // 0
        { color: '#22c55e', dark: '#15803d', light: '#f0fdf4', border: '#86efac', text: '#166534', glow: 'rgba(34, 197, 94, 0.35)', ring: 'rgba(34, 197, 94, 0.25)' }, // 1
        { color: '#84cc16', dark: '#4d7c0f', light: '#f7fee7', border: '#bef264', text: '#3f6212', glow: 'rgba(132, 204, 22, 0.35)', ring: 'rgba(132, 204, 22, 0.25)' }, // 2
        { color: '#eab308', dark: '#a16207', light: '#fefce8', border: '#fde047', text: '#854d0e', glow: 'rgba(234, 179, 8, 0.35)', ring: 'rgba(234, 179, 8, 0.25)' }, // 3
        { color: '#f59e0b', dark: '#b45309', light: '#fffbeb', border: '#fcd34d', text: '#92400e', glow: 'rgba(245, 158, 11, 0.35)', ring: 'rgba(245, 158, 11, 0.25)' }, // 4
        { color: '#f97316', dark: '#c2410c', light: '#fff7ed', border: '#fdba74', text: '#9a3412', glow: 'rgba(249, 115, 22, 0.35)', ring: 'rgba(249, 115, 22, 0.25)' }, // 5
        { color: '#ef4444', dark: '#b91c1c', light: '#fef2f2', border: '#fca5a5', text: '#991b1b', glow: 'rgba(239, 68, 68, 0.35)', ring: 'rgba(239, 68, 68, 0.25)' }, // 6
      ];
      if (total === 7) return stops7[index] || stops7[0];
      if (total === 4) {
        const stops4 = [stops7[0], stops7[2], stops7[4], stops7[6]];
        return stops4[index] || stops4[0];
      }
      if (total === 2) {
        return [stops7[0], stops7[6]][index] || stops7[0];
      }
      const ratio = (total > 1) ? index / (total - 1) : 0;
      const stopIndex = Math.min(6, Math.max(0, Math.round(ratio * 6)));
      return stops7[stopIndex];
    },
    getScaleItemStyle(index, total) {
      const step = this.getScaleColor(index, total);
      return {
        '--step-color': step.color,
        '--step-dark': step.dark,
        '--step-light': step.light,
        '--step-border': step.border,
        '--step-text': step.text,
        '--step-glow': step.glow,
        '--step-ring': step.ring
      };
    },
    formatScaleLabel(text) {
      if (!text) return '';
      const line = (t, extraClass = '') => `<span class="scale-line ${extraClass}">${t}</span>`;
      if (text === 'ไม่เคยรู้สึกเช่นนั้นเลย') {
        return line('ไม่เคย') + line('รู้สึก') + line('เช่นนั้นเลย');
      }
      if (text.includes('ไม่เคยรู้สึก')) {
        const sub = text.replace('ไม่เคยรู้สึก', '').trim();
        return line('ไม่เคย') + line('รู้สึก') + line(sub || '&nbsp;');
      }
      if (text.startsWith('ปีละ ')) {
        const num = text.replace('ปีละ ', '').replace(' ครั้ง', '').trim();
        return line('ปีละ') + line(num) + line('ครั้ง');
      }
      if (text.startsWith('เดือนละ ')) {
        const num = text.replace('เดือนละ ', '').replace(' ครั้ง', '').trim();
        return line('เดือนละ') + line(num) + line('ครั้ง');
      }
      if (text.startsWith('สัปดาห์ละ ')) {
        const num = text.replace('สัปดาห์ละ ', '').replace(' ครั้ง', '').trim();
        return line('สัปดาห์ละ') + line(num) + line('ครั้ง');
      }
      if (text === 'ทุกวัน') {
        return line('&nbsp;') + line('ทุกวัน') + line('&nbsp;');
      }
      if (text === 'เป็นครั้งคราว') return line('เป็น') + line('ครั้งคราว') + line('&nbsp;');
      if (text === 'เป็นบ่อย ๆ' || text === 'เป็นบ่อย') return line('เป็น') + line('บ่อย ๆ') + line('&nbsp;');
      if (text === 'เป็นประจำ') return line('เป็น') + line('ประจำ') + line('&nbsp;');
      if (text === 'จริงบางครั้ง') return line('จริง') + line('บางครั้ง') + line('&nbsp;');
      if (text === 'ค่อนข้างจริง') return line('ค่อนข้าง') + line('จริง') + line('&nbsp;');
      if (text === 'ไม่มีเลย (<1 วัน)') return line('ไม่มีเลย') + line('(&lt;1 วัน)') + line('&nbsp;');
      if (text === 'เป็นบางวัน (1–7 วัน)') return line('เป็นบางวัน') + line('(1–7 วัน)') + line('&nbsp;');
      if (text === 'เป็นบ่อย (>7 วัน)') return line('เป็นบ่อย') + line('(&gt;7 วัน)') + line('&nbsp;');
      if (text === 'เป็นทุกวัน') return line('&nbsp;') + line('เป็นทุกวัน') + line('&nbsp;');
      if (text === 'ไม่มีเลย') return line('&nbsp;') + line('ไม่มีเลย') + line('&nbsp;');
      if (text === 'น้อยมาก') return line('&nbsp;') + line('น้อยมาก') + line('&nbsp;');
      if (text === 'ปานกลาง') return line('&nbsp;') + line('ปานกลาง') + line('&nbsp;');
      if (text === 'มาก') return line('&nbsp;') + line('มาก') + line('&nbsp;');
      if (text === 'มากที่สุด') return line('&nbsp;') + line('มากที่สุด') + line('&nbsp;');

      const parts = text.split(' ');
      if (parts.length >= 2) {
        return parts.map(p => line(p)).join('');
      }
      return line(text, 'single-line');
    },
    getSelectedOptionLabel(qCode) {
      const val = this.localAnswers[qCode];
      if (val === undefined || val === null) return '';
      const opt = this.assessment.options.find(o => String(o.code) === String(val));
      return opt ? opt.label : '';
    },
    getSelectedStepInfo(qCode) {
      const val = this.localAnswers[qCode];
      if (val === undefined || val === null) return null;
      const idx = this.assessment.options.findIndex(o => String(o.code) === String(val));
      if (idx === -1) return null;
      return this.getScaleColor(idx, this.assessment.options.length);
    },
    getLiveFeedbackStyle(qCode) {
      const step = this.getSelectedStepInfo(qCode);
      if (!step) return {};
      return {
        background: step.light,
        borderColor: step.border,
        color: step.text
      };
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
      if (this.assessmentIndex === this.totalAssessments - 1 && !this.feedbackText) {
        this.feedbackText = 'แบบประเมินใช้งานง่าย สะดวกดีครับ';
      }
      this.validationError = false;
      this.missingQuestions = [];
      this.$emit('answers-updated', {
        answers: this.localAnswers,
        feedback: this.feedbackText
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
        feedback: this.feedbackText,
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
   Scale Rating Track & Colored Circles (Matching Prototype)
   ========================================================================== */
.scale-rating-wrapper {
  margin-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.scale-track {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 4px;
  padding: 6px 4px;
  margin: 0.25rem 0;
  width: 100%;
  box-sizing: border-box;
}
.scale-track-line {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 24px;
  height: 4px;
  background: linear-gradient(90deg, #10b981 0%, #84cc16 28%, #eab308 50%, #f97316 75%, #ef4444 100%);
  border-radius: 999px;
  z-index: 1;
  pointer-events: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}
.scale-item {
  position: relative;
  z-index: 2;
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  padding: 6px 2px 6px 2px;
  border-radius: 10px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}
.scale-item::after {
  content: '';
  position: absolute;
  inset: -4px 0 -4px 0;
  z-index: 1;
}
.scale-item:hover {
  background: var(--step-light, rgba(239, 246, 255, 0.6));
}
.scale-label-wrap {
  min-height: 3.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-bottom: 6px;
  width: 100%;
}
.scale-label {
  font-size: 0.82rem;
  line-height: 1.25;
  color: #334155;
  text-align: center;
  font-weight: 300;
  transition: color 0.15s ease, font-weight 0.15s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}
::v-deep .scale-line {
  display: block;
  white-space: nowrap !important;
  overflow: visible;
  text-align: center;
  line-height: 1.25;
  font-weight: 300;
  letter-spacing: 0;
}
::v-deep .scale-line.single-line {
  line-height: 2.4;
}
.scale-item:hover .scale-label,
.scale-item:hover ::v-deep .scale-line {
  color: var(--step-text, #1d4ed8);
  font-weight: 400;
}
.scale-circle-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  height: 28px;
}
.scale-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2.5px solid var(--step-color, #cbd5e1);
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.06), 0 0 0 2px var(--step-light, transparent);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.scale-circle-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ffffff;
  transform: scale(0);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: block;
}
.scale-item:hover .scale-circle {
  border-color: var(--step-dark, #3b82f6);
  background: var(--step-light, #eff6ff);
  transform: translateY(-2px) scale(1.15);
  box-shadow: 0 4px 10px var(--step-glow, rgba(37, 99, 235, 0.25));
}
.scale-item.is-selected {
  background: var(--step-light, rgba(239, 246, 255, 0.85));
}
.scale-item.is-selected .scale-label,
.scale-item.is-selected ::v-deep .scale-line {
  color: var(--step-dark, #1d4ed8);
  font-weight: 500;
}
.scale-item.is-selected .scale-circle {
  background: linear-gradient(135deg, var(--step-color, #2563eb) 0%, var(--step-dark, #1d4ed8) 100%);
  border-color: var(--step-dark, #1d4ed8);
  transform: translateY(-2px) scale(1.2);
  box-shadow: 0 0 0 3px var(--step-ring, rgba(37, 99, 235, 0.22)), 0 4px 12px var(--step-glow, rgba(37, 99, 235, 0.3));
}
.scale-item.is-selected .scale-circle-dot {
  background: #ffffff;
  transform: scale(1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}
.scale-item input:focus-visible + .scale-label-wrap + .scale-circle-wrap .scale-circle {
  outline: 3px solid var(--step-color, #3b82f6);
  outline-offset: 3px;
}
.scale-live-feedback {
  padding: 7px 16px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1.5px dashed #cbd5e1;
  font-size: 0.86rem;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
  min-height: 38px;
  text-align: center;
}
.scale-live-feedback.has-value {
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  color: #1e40af;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}
.feedback-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}
.feedback-badge strong {
  color: #1d4ed8;
  font-weight: 800;
}
.feedback-placeholder {
  color: #94a3b8;
  font-size: 0.82rem;
}

/* Feedback Section (ส่วนสุดท้าย: คำแนะนำและข้อเสนอแนะเพื่อการปรับปรุง) */
.feedback-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%);
  border: 1.5px solid #bae6fd;
  border-radius: 16px;
  padding: 1.4rem 1.5rem;
  margin-top: 1.25rem;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.06);
  transition: all 0.2s ease;
}
.feedback-card:hover {
  border-color: #7dd3fc;
  box-shadow: 0 6px 18px rgba(2, 132, 199, 0.1);
}
.feedback-card-header {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  margin-bottom: 0.75rem;
}
.feedback-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #e0f2fe;
  border: 1.5px solid #7dd3fc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
  color: #0284c7;
  box-shadow: 0 2px 5px rgba(2, 132, 199, 0.12);
}
.feedback-card-title-group {
  flex: 1;
}
.feedback-card-badge-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
  flex-wrap: wrap;
}
.feedback-section-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #0369a1;
  background: #e0f2fe;
  border: 1px solid #bae6fd;
  padding: 0.15rem 0.55rem;
  border-radius: 6px;
}
.feedback-optional-pill {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 500;
  color: #64748b;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
}
.feedback-card-title {
  font-size: 1.08rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  line-height: 1.4;
}
.feedback-invitation-quote {
  font-size: 0.95rem;
  font-weight: 500;
  color: #0369a1;
  background: rgba(255, 255, 255, 0.85);
  border-left: 3.5px solid #0284c7;
  padding: 0.75rem 1rem;
  border-radius: 0 10px 10px 0;
  margin: 0.65rem 0 1rem 0;
  line-height: 1.55;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}
.feedback-input-wrapper {
  position: relative;
}
.feedback-textarea {
  width: 100%;
  min-height: 96px;
  padding: 0.85rem 1rem;
  font-size: 0.92rem;
  color: #1e293b;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 12px;
  resize: vertical;
  line-height: 1.55;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
  font-family: inherit;
}
.feedback-textarea:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
}
.feedback-textarea::placeholder {
  color: #94a3b8;
  font-weight: 300;
}
.feedback-helper-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.82rem;
  color: #64748b;
  flex-wrap: wrap;
  gap: 6px;
}
.feedback-hint {
  color: #64748b;
}
.feedback-counter {
  font-weight: 600;
  color: #0369a1;
  font-family: monospace;
}

@media (max-width: 640px) {
  .question-card {
    padding: 0.95rem 0.45rem;
  }
  .scale-track {
    gap: 3px;
    padding: 4px 0;
    margin: 0.25rem 0;
  }
  .scale-track-line {
    left: 14px;
    right: 14px;
    bottom: 19px;
    height: 3.5px;
  }
  .scale-item {
    padding: 4px 1px 6px 1px;
    border-radius: 8px;
    background: transparent !important;
    border: none !important;
  }
  .scale-label-wrap {
    min-height: 2.75rem;
    margin-bottom: 4px;
  }
  .scale-label {
    font-size: 0.65rem;
    line-height: 1.15;
  }
  ::v-deep .scale-line {
    font-size: 0.65rem;
    line-height: 1.15;
  }
  ::v-deep .scale-line.single-line {
    line-height: 1.8;
  }
  .scale-circle-wrap {
    height: 22px;
  }
  .scale-circle {
    width: 22px;
    height: 22px;
    border-width: 2px;
  }
  .scale-circle-dot {
    width: 8px;
    height: 8px;
  }
  .scale-live-feedback {
    font-size: 0.82rem;
    padding: 6px 10px;
    min-height: 34px;
  }
}

.options-grid {
  display: none;
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
