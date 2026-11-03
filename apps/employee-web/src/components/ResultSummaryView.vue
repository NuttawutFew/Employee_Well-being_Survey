<template>
  <div class="result-summary-container">
    <!-- Top Screening Disclaimer -->
    <div class="disclaimer-banner">
      <span class="icon">ℹ️</span>
      <span><strong>ข้อควรทราบ:</strong> ผลลัพธ์นี้เป็นการคัดกรองเบื้องต้นเพื่อส่งเสริมสุขภาวะ ไม่ใช่การวินิจฉัยทางการแพทย์</span>
    </div>

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
      <!-- 2. Overall Status Card -->
      <div 
        class="overall-card" 
        :class="result.overall.status === 'NEEDS_ADDITIONAL_CARE' ? 'status-needs-care' : 'status-normal'"
      >
        <h2>ภาพรวมผลการประเมิน Employee Well-being Survey</h2>
        <p v-if="result.overall.status === 'NEEDS_ADDITIONAL_CARE'" class="overall-desc">
          ผลการประเมินเบื้องต้นพบว่า มีอย่างน้อยหนึ่งมิติที่ควรได้รับการดูแลเพิ่มเติม แนะนำให้ลองปรับพฤติกรรมการดูแลตนเอง หรือปรึกษาผู้เชี่ยวชาญ
        </p>
        <p v-else class="overall-desc">
          ผลการประเมินเบื้องต้นอยู่ในเกณฑ์ปกติ ขอให้ท่านรักษาสมดุลในการใช้ชีวิตและการทำงานอย่างต่อเนื่อง
        </p>
        <div class="submission-timestamp">
          <span>ส่งเมื่อ: {{ formatTime(submittedAt) }}</span>
        </div>
      </div>

      <!-- 3. Assessment Cards Grid (3 Instruments) -->
      <div class="cards-grid">
        <!-- Card 1: Burnout -->
        <div class="card assessment-card">
          <div class="card-title-row">
            <h3>1. ภาวะหมดไฟในการทำงาน (Burnout)</h3>
            <span class="badge" :class="getLevelBadgeClass(result.burnout.level)">
              {{ formatLevelThai(result.burnout.level) }}
            </span>
          </div>
          <p class="card-instruction">
            ประเมินแยกตาม 3 มิติหลัก:
          </p>
          <div class="dimension-list">
            <div class="dimension-row">
              <span class="dim-name">ความอ่อนล้าทางอารมณ์ (EE):</span>
              <span class="dim-score">{{ result.burnout.dimensions.EE.score }} คะแนน</span>
              <span class="dim-level" :class="getLevelBadgeClass(result.burnout.dimensions.EE.level)">
                {{ formatLevelThai(result.burnout.dimensions.EE.level) }}
              </span>
            </div>
            <div class="dimension-row">
              <span class="dim-name">การลดความเป็นบุคคล (DP):</span>
              <span class="dim-score">{{ result.burnout.dimensions.DP.score }} คะแนน</span>
              <span class="dim-level" :class="getLevelBadgeClass(result.burnout.dimensions.DP.level)">
                {{ formatLevelThai(result.burnout.dimensions.DP.level) }}
              </span>
            </div>
            <div class="dimension-row">
              <span class="dim-name">ความสำเร็จส่วนบุคคล (PA):</span>
              <span class="dim-score">{{ result.burnout.dimensions.PA.score }} คะแนน</span>
              <span class="dim-level" :class="getLevelBadgeClass(result.burnout.dimensions.PA.level)">
                {{ formatLevelThai(result.burnout.dimensions.PA.level) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Card 2: Stress -->
        <div class="card assessment-card">
          <div class="card-title-row">
            <h3>2. ความเครียด</h3>
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
            <h3>3. อารมณ์เศร้า</h3>
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
    }
  },
  data() {
    return {
      loading: false,
      error: null,
      result: this.initialResult,
      submittedAt: this.initialSubmittedAt
    };
  },
  async mounted() {
    if (!this.result) {
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
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
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
  gap: 1.5rem;
}

.disclaimer-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f1f5f9;
  border-left: 4px solid #64748b;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #334155;
}

.loading-state, .error-state {
  text-align: center;
  padding: 2.5rem 1rem;
  background: white;
  border-radius: 8px;
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

.alert-suicide {
  background-color: #fef2f2;
  border: 2px solid #ef4444;
  border-radius: 8px;
  padding: 1.25rem;
  color: #991b1b;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.alert-header h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #b91c1c;
}

.alert-body {
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.hotline-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem;
  background: white;
  border: 1.5px solid #fca5a5;
  border-radius: 12px;
  padding: 1.15rem;
}

@media (min-width: 640px) {
  .hotline-card {
    grid-template-columns: repeat(2, 1fr);
  }
}

.hotline-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  background: #fff5f5;
  border-radius: 8px;
}

.hotline-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #7f1d1d;
}

.hotline-number {
  font-size: 1.35rem;
  font-weight: 700;
  color: #dc2626;
  letter-spacing: 0.02em;
}

.hotline-desc {
  font-size: 0.825rem;
  color: #4b5563;
}

.overall-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .overall-card {
    padding: 2rem;
  }
}

.status-needs-care {
  border-left: 6px solid #f59e0b;
}

.status-normal {
  border-left: 6px solid #10b981;
}

.overall-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.4rem 1rem;
  border-radius: 9999px;
  font-size: 0.88rem;
  font-weight: 700;
  margin-bottom: 0.85rem;
  border: 1px solid transparent;
}

.status-needs-care .overall-badge {
  background-color: #fef3c7;
  color: #92400e;
  border-color: #fde68a;
}

.status-normal .overall-badge {
  background-color: #d1fae5;
  color: #065f46;
  border-color: #a7f3d0;
}

.overall-card h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.35rem;
}

.overall-desc {
  color: #475569;
  line-height: 1.55;
  margin-bottom: 0.75rem;
}

.submission-timestamp {
  font-size: 0.85rem;
  color: #94a3b8;
}

.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
}

.assessment-card {
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.85rem;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.card-title-row h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #0f172a;
  flex: 1;
  min-width: 180px;
}

.card-instruction {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.85rem 0;
}

.score-display {
  margin-bottom: 0.65rem;
}

.score-large {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0284c7;
}

.score-max {
  font-size: 0.9rem;
  color: #64748b;
  margin-left: 0.25rem;
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.dimension-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.55rem 0.85rem;
  background-color: #f8fafc;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
  font-size: 0.9rem;
  gap: 0.65rem;
}

.dim-name {
  color: #334155;
  flex: 1;
}

.dim-score {
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  margin-right: 0.5rem;
}

/* Sub-dimension Level Badges (Centered text & Rounded borders) */
.dim-level {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid transparent;
  min-width: 80px;
}

.card-note {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.65rem;
  margin-bottom: 0;
  line-height: 1.45;
}

/* Card Header Status Badge */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.82rem;
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

.recommendations-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
}

.recommendations-card h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
  color: #0f172a;
}

.recom-list {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.5;
}

.support-contact-banner {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #bbf7d0;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  box-shadow: 0 2px 8px rgba(22, 101, 52, 0.05);
}

.support-contact-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.support-contact-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.support-contact-text h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #166534;
  font-weight: 700;
}

.support-contact-text p {
  margin: 0;
  font-size: 0.85rem;
  color: #15803d;
  line-height: 1.45;
}

.btn-support-contact-hr {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.btn-support-contact-hr:hover {
  background: #0369a1;
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(2, 132, 199, 0.35);
}

@media (max-width: 768px) {
  .support-contact-banner {
    flex-direction: column;
    align-items: flex-start;
  }
  .btn-support-contact-hr {
    width: 100%;
    text-align: center;
  }
}

.completion-footer {
  text-align: center;
  font-size: 0.825rem;
  color: #64748b;
  padding: 0.5rem;
}
</style>
