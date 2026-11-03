<template>
  <div class="dashboard-container">
    <!-- Filter Panel -->
    <FilterPanel @filters-changed="onFiltersChanged" />

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>กำลังประมวลผลสถิติภาพรวมองค์กร...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-banner">
      <span>⚠️ {{ error }}</span>
      <button class="btn-retry" @click="fetchDashboard">ลองใหม่</button>
    </div>

    <!-- State 1: Small-Cohort Suppression Active (n < 5) -->
    <div v-else-if="data && data.suppressed" class="suppression-alert-card" role="alert">
      <div class="shield-icon">🛡️</div>
      <div class="suppression-content">
        <h3>{{ data.message || 'ข้อมูลไม่เพียงพอสำหรับแสดงสถิติ' }}</h3>
        <p class="suppression-desc">
          <strong>Small-Cohort Suppression (n &lt; 5):</strong> เพื่อปกป้องความเป็นส่วนตัวของพนักงานตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) และมาตรฐานสากล ระบบจะระงับการแสดงผลสถิติ ร้อยละ และการกระจายตัว เมื่อกลุ่มตัวอย่างที่เลือกมีจำนวนน้อยกว่า 5 คน
        </p>
        <span class="suppression-hint">💡 คำแนะนำ: ลองขยายช่วงเวลา หรือลดเงื่อนไขตัวกรองเพื่อดูสถิติในระดับภาพรวมที่กว้างขึ้น</span>
      </div>
    </div>

    <!-- State 2: Empty results (0 records) -->
    <div v-else-if="data && data.totalSubmissions === 0" class="empty-card">
      <span class="empty-icon">📭</span>
      <h3>ไม่พบข้อมูลการส่งแบบประเมินตามเงื่อนไขตัวกรอง</h3>
      <p>ยังไม่มีพนักงานส่งแบบประเมินที่ตรงกับช่วงเวลาหรือตัวกรองที่เลือก</p>
    </div>

    <!-- State 3: Active Dashboard (Cohort size >= 5) -->
    <div v-else-if="data" class="dashboard-content">
      <!-- KPI Metric Cards Grid -->
      <div class="kpi-grid">
        <!-- Total Submissions -->
        <div class="kpi-card">
          <div class="kpi-icon">👥</div>
          <div class="kpi-info">
            <span class="kpi-label">ผู้ส่งแบบประเมินทั้งหมด</span>
            <strong class="kpi-value">{{ data.totalSubmissions }} คน</strong>
          </div>
        </div>

        <!-- Needs Additional Care -->
        <div class="kpi-card kpi-warning">
          <div class="kpi-icon">⚠️</div>
          <div class="kpi-info">
            <span class="kpi-label">ควรได้รับการดูแลเพิ่ม</span>
            <strong class="kpi-value text-amber">
              {{ data.overall.needsCare.count }} คน
              <small>({{ data.overall.needsCare.percentage }}%)</small>
            </strong>
          </div>
        </div>

        <!-- Normal Range -->
        <div class="kpi-card kpi-success">
          <div class="kpi-icon">✅</div>
          <div class="kpi-info">
            <span class="kpi-label">ระดับปกติ</span>
            <strong class="kpi-value text-green">
              {{ data.overall.normal.count }} คน
              <small>({{ data.overall.normal.percentage }}%)</small>
            </strong>
          </div>
        </div>

      </div>

      <!-- Instrument Distribution Breakdown Cards -->
      <div class="charts-grid">
        <!-- 1. Burnout Distribution -->
        <div class="chart-card">
          <h3>1. ภาวะหมดไฟในการทำงาน (Burnout)</h3>
          <p class="chart-desc">การกระจายตัวตามระดับความรุนแรงสูงสุดใน 3 มิติ</p>
          <div class="distribution-bars">
            <div class="bar-row">
              <span class="bar-label">สูง:</span>
              <div class="bar-track">
                <div 
                  class="bar-fill fill-danger" 
                  :style="{ width: data.instruments.burnout.high.percentage + '%' }"
                ></div>
              </div>
              <span class="bar-val">{{ data.instruments.burnout.high.count }} คน ({{ data.instruments.burnout.high.percentage }}%)</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">ปานกลาง:</span>
              <div class="bar-track">
                <div 
                  class="bar-fill fill-warning" 
                  :style="{ width: data.instruments.burnout.moderate.percentage + '%' }"
                ></div>
              </div>
              <span class="bar-val">{{ data.instruments.burnout.moderate.count }} คน ({{ data.instruments.burnout.moderate.percentage }}%)</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">ต่ำ:</span>
              <div class="bar-track">
                <div 
                  class="bar-fill fill-success" 
                  :style="{ width: data.instruments.burnout.low.percentage + '%' }"
                ></div>
              </div>
              <span class="bar-val">{{ data.instruments.burnout.low.count }} คน ({{ data.instruments.burnout.low.percentage }}%)</span>
            </div>
          </div>
        </div>

        <!-- 2. Stress Test Distribution -->
        <div class="chart-card">
          <h3>2. ความเครียด (Stress Test)</h3>
          <p class="chart-desc">การกระจายตัวตาม 5 ระดับเกณฑ์คลินิก</p>
          <div class="distribution-bars">
            <div class="bar-row">
              <span class="bar-label">สูงกว่าปกติมาก:</span>
              <div class="bar-track">
                <div class="bar-fill fill-danger" :style="{ width: data.instruments.stress.severe.percentage + '%' }"></div>
              </div>
              <span class="bar-val">{{ data.instruments.stress.severe.count }} คน ({{ data.instruments.stress.severe.percentage }}%)</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">สูงกว่าปกติปานกลาง:</span>
              <div class="bar-track">
                <div class="bar-fill fill-warning" :style="{ width: data.instruments.stress.moderate.percentage + '%' }"></div>
              </div>
              <span class="bar-val">{{ data.instruments.stress.moderate.count }} คน ({{ data.instruments.stress.moderate.percentage }}%)</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">สูงกว่าปกติเล็กน้อย:</span>
              <div class="bar-track">
                <div class="bar-fill fill-yellow" :style="{ width: data.instruments.stress.mild.percentage + '%' }"></div>
              </div>
              <span class="bar-val">{{ data.instruments.stress.mild.count }} คน ({{ data.instruments.stress.mild.percentage }}%)</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">ปกติ:</span>
              <div class="bar-track">
                <div class="bar-fill fill-success" :style="{ width: data.instruments.stress.normal.percentage + '%' }"></div>
              </div>
              <span class="bar-val">{{ data.instruments.stress.normal.count }} คน ({{ data.instruments.stress.normal.percentage }}%)</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">ต่ำกว่าเกณฑ์ปกติ:</span>
              <div class="bar-track">
                <div class="bar-fill fill-muted" :style="{ width: data.instruments.stress.low.percentage + '%' }"></div>
              </div>
              <span class="bar-val">{{ data.instruments.stress.low.count }} คน ({{ data.instruments.stress.low.percentage }}%)</span>
            </div>
          </div>
        </div>

        <!-- 3. 9Q Depression Distribution -->
        <div class="chart-card">
          <h3>3. ภาวะเสี่ยงซึมเศร้า (9Q)</h3>
          <p class="chart-desc">การกระจายตัวตามระดับความเสี่ยง 4 กลุ่ม</p>
          <div class="distribution-bars">
            <div class="bar-row">
              <span class="bar-label">รุนแรง (≥19):</span>
              <div class="bar-track">
                <div class="bar-fill fill-danger" :style="{ width: data.instruments.q9.severe.percentage + '%' }"></div>
              </div>
              <span class="bar-val">{{ data.instruments.q9.severe.count }} คน ({{ data.instruments.q9.severe.percentage }}%)</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">ปานกลาง (13-18):</span>
              <div class="bar-track">
                <div class="bar-fill fill-warning" :style="{ width: data.instruments.q9.moderate.percentage + '%' }"></div>
              </div>
              <span class="bar-val">{{ data.instruments.q9.moderate.count }} คน ({{ data.instruments.q9.moderate.percentage }}%)</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">น้อย (7-12):</span>
              <div class="bar-track">
                <div class="bar-fill fill-yellow" :style="{ width: data.instruments.q9.mild.percentage + '%' }"></div>
              </div>
              <span class="bar-val">{{ data.instruments.q9.mild.count }} คน ({{ data.instruments.q9.mild.percentage }}%)</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">ไม่มีหรือน้อยมาก:</span>
              <div class="bar-track">
                <div class="bar-fill fill-success" :style="{ width: data.instruments.q9.none.percentage + '%' }"></div>
              </div>
              <span class="bar-val">{{ data.instruments.q9.none.count }} คน ({{ data.instruments.q9.none.percentage }}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FilterPanel from './FilterPanel.vue';

export default {
  name: 'AggregateDashboard',
  components: {
    FilterPanel
  },
  data() {
    return {
      loading: false,
      error: null,
      filters: {},
      data: null
    };
  },
  async mounted() {
    await this.fetchDashboard();
  },
  methods: {
    onFiltersChanged(newFilters) {
      this.filters = { ...newFilters };
      this.fetchDashboard();
    },
    async fetchDashboard() {
      this.loading = true;
      this.error = null;

      try {
        const queryParams = new URLSearchParams();
        Object.entries(this.filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            if (Array.isArray(val)) {
              if (val.length > 0) queryParams.set(key, val.join(','));
            } else {
              queryParams.set(key, String(val));
            }
          }
        });

        const token = localStorage.getItem('admin_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/admin/dashboard?${queryParams.toString()}`, { headers });
        if (!res.ok) {
          throw new Error(`ไม่สามารถโหลดสถิติได้ (HTTP ${res.status})`);
        }

        this.data = await res.json();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.loading-state {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #64748b;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.suppression-alert-card {
  background: #fffbeb;
  border: 2px solid #f59e0b;
  border-radius: 8px;
  padding: 1.75rem;
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
  color: #92400e;
}

.shield-icon {
  font-size: 2.25rem;
  line-height: 1;
}

.suppression-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  color: #b45309;
}

.suppression-desc {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.suppression-hint {
  font-size: 0.85rem;
  color: #78350f;
}

.empty-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4rem 2rem;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.75rem;
}

.empty-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.15rem;
  color: #0f172a;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.kpi-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.kpi-icon {
  font-size: 2rem;
}

.kpi-info {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.825rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.kpi-value {
  font-size: 1.35rem;
  color: #0f172a;
}

.kpi-value small {
  font-size: 0.85rem;
  font-weight: normal;
  color: #64748b;
  margin-left: 0.25rem;
}

.text-amber { color: #d97706; }
.text-green { color: #059669; }
.text-red { color: #dc2626; }

.kpi-warning { border-left: 5px solid #f59e0b; }
.kpi-success { border-left: 5px solid #10b981; }
.kpi-danger { border-left: 5px solid #ef4444; }

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 1.25rem;
}

.chart-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.chart-card h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.05rem;
  color: #0f172a;
}

.chart-desc {
  margin: 0 0 1rem 0;
  font-size: 0.8rem;
  color: #64748b;
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.825rem;
}

.bar-label {
  width: 120px;
  color: #475569;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  background: #f1f5f9;
  border-radius: 9999px;
  height: 10px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.fill-danger { background-color: #ef4444; }
.fill-warning { background-color: #f59e0b; }
.fill-yellow { background-color: #eab308; }
.fill-success { background-color: #10b981; }
.fill-teal { background-color: #06b6d4; }
.fill-muted { background-color: #94a3b8; }

.bar-val {
  font-weight: 500;
  color: #334155;
  width: 105px;
  text-align: right;
  flex-shrink: 0;
  font-size: 0.8rem;
}

/* ==========================================================================
   Responsive Multi-Device Layout (PC, iPad/Tablet, Mobile Phone)
   ========================================================================== */

/* --- iPad / Tablet (<= 1024px) --- */
@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }
}

/* --- Small Tablet & Large Mobile (<= 768px) --- */
@media (max-width: 768px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .chart-card {
    padding: 1rem;
  }
}

/* --- Mobile Phone (<= 480px) --- */
@media (max-width: 480px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  .kpi-card {
    padding: 1rem;
  }
  .kpi-icon {
    font-size: 1.65rem;
  }
  .kpi-value {
    font-size: 1.15rem;
  }
  .bar-row {
    gap: 0.4rem;
    font-size: 0.76rem;
  }
  .bar-label {
    width: 80px;
    font-size: 0.74rem;
  }
  .bar-val {
    width: 75px;
    font-size: 0.72rem;
  }
  .suppression-alert-card {
    flex-direction: column;
    padding: 1.25rem 1rem;
    gap: 0.75rem;
  }
  .shield-icon {
    font-size: 1.75rem;
  }
}
</style>
