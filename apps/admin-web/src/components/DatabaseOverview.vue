<template>
  <div class="database-view-container">
    <div class="db-header-card">
      <div class="db-title-row">
        <div class="title-with-icon">
          <span class="db-icon">🍃</span>
          <div>
            <h2>โครงสร้างฐานข้อมูล MongoDB (Document Store)</h2>
            <p class="subtitle">ภาพรวมคอลเลกชัน (Collections), จำนวนเอกสาร (Documents), และดัชนี (Indexes) ในระบบ</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-refresh" :disabled="loading" @click="fetchOverview">
            <span v-if="loading">กำลังโหลด...</span>
            <span v-else>🔄 รีเฟรชข้อมูล</span>
          </button>
        </div>
      </div>

      <!-- Status Pills -->
      <div class="status-chips-row">
        <div class="status-chip chip-success">
          <span class="chip-dot"></span>
          <span>สถานะ: <strong>เชื่อมต่อสำเร็จ (Ready)</strong></span>
        </div>
        <div class="status-chip chip-info">
          <span>ประเภท: <strong>{{ overview.type || 'MongoDB Document Store' }}</strong></span>
        </div>
        <div class="status-chip chip-neutral">
          <span>ชื่อฐานข้อมูล: <strong>{{ overview.database || 'mental_health_assessment' }}</strong></span>
        </div>
      </div>
    </div>

    <!-- Loading / Error States -->
    <div v-if="loading && !overview.collections" class="loading-box">
      <div class="spinner"></div>
      <p>กำลังดึงข้อมูลโครงสร้าง MongoDB...</p>
    </div>

    <div v-else-if="error" class="error-banner">
      <span>⚠️ {{ error }}</span>
      <button class="btn-retry" @click="fetchOverview">ลองใหม่</button>
    </div>

    <!-- Collections Grid -->
    <div v-else class="collections-grid">
      <div
        v-for="(colInfo, colName) in overview.collections"
        :key="colName"
        class="collection-card"
      >
        <div class="col-card-header">
          <div class="col-name-badge">
            <span class="col-icon">📁</span>
            <strong>{{ colName }}</strong>
          </div>
          <span class="doc-count-badge">{{ colInfo.documentCount }} documents</span>
        </div>

        <p class="col-description">{{ getCollectionDescription(colName) }}</p>

        <!-- Indexes List -->
        <div class="indexes-section">
          <span class="section-label">ดัชนี (Indexes):</span>
          <div class="indexes-list">
            <div v-for="idx in colInfo.indexes" :key="idx.name" class="index-item">
              <code>{{ formatIndexKey(idx.key) }}</code>
              <span v-if="idx.unique" class="badge-unique">UNIQUE</span>
            </div>
          </div>
        </div>

        <div class="col-card-footer">
          <button class="btn-inspect-docs" @click="inspectCollection(colName)">
            🔍 ดูตัวอย่าง Documents
          </button>
        </div>
      </div>
    </div>

    <!-- Connection Guide Card -->
    <div class="guide-card">
      <h3>🔌 ข้อมูลการเชื่อมต่อ MongoDB (Connection String Guide)</h3>
      <p class="guide-desc">
        ระบบถูกออกแบบให้รองรับสถาปัตยกรรม MongoDB Document Database โดยสมบูรณ์ หากต้องการเชื่อมต่อ MongoDB ภายนอก สามารถกำหนดค่าได้ในไฟล์ <code>.env</code>
      </p>
      <div class="connection-code-box">
        <code>MONGODB_URI=mongodb://localhost:27017/mental_health_assessment</code>
      </div>
      <p class="guide-note">
        🔒 <strong>PDPA Invariant:</strong> ข้อมูลคำตอบรายข้อ (answers) จะถูกตัดออกโดยอัตโนมัติในการเรียกดูผ่านหน้าผู้ดูแลระบบ เพื่อรักษาความเป็นส่วนตัวตามมาตรฐาน
      </p>
    </div>

    <!-- Document Inspector Modal -->
    <div v-if="selectedCollection" class="modal-backdrop" @click.self="closeInspector">
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="col-icon">📁</span>
            <h3>ตัวอย่าง Documents ในคอลเลกชัน: <code>{{ selectedCollection }}</code></h3>
          </div>
          <button class="btn-close-modal" @click="closeInspector">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="loadingDocs" class="loading-box-sm">
            <div class="spinner"></div>
            <p>กำลังโหลดเอกสารในคอลเลกชัน...</p>
          </div>

          <div v-else-if="collectionDocs.length === 0" class="empty-docs-msg">
            <p>ยังไม่มีเอกสารในคอลเลกชันนี้</p>
          </div>

          <div v-else class="documents-container">
            <div class="docs-count-header">
              <span>แสดง {{ collectionDocs.length }} จากทั้งหมด {{ collectionTotal }} รายการ</span>
            </div>

            <div v-for="(doc, idx) in collectionDocs" :key="doc._id || idx" class="doc-block">
              <div class="doc-header">
                <span class="doc-index">#{{ idx + 1 }}</span>
                <span class="doc-id">_id: <strong>{{ doc._id }}</strong></span>
                <span v-if="doc.action" class="doc-tag tag-action">Action: {{ doc.action }}</span>
                <span v-if="doc.status" class="doc-tag" :class="doc.status === 'SUCCESS' ? 'tag-status-success' : 'tag-status-failed'">
                  {{ doc.status }}
                </span>
                <span v-if="doc.purpose" class="doc-tag tag-purpose">🎯 {{ doc.purpose }}</span>
                <span v-if="doc.employeeId" class="doc-tag">Employee: {{ doc.employeeId }}</span>
              </div>
              <pre class="json-preview"><code>{{ formatJson(doc) }}</code></pre>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-modal-close" @click="closeInspector">ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DatabaseOverview',
  data() {
    return {
      loading: false,
      error: null,
      overview: {
        database: 'mental_health_assessment',
        type: 'MongoDB Document Store',
        collectionsCount: 0,
        collections: {}
      },
      selectedCollection: null,
      loadingDocs: false,
      collectionDocs: [],
      collectionTotal: 0
    };
  },
  async mounted() {
    await this.fetchOverview();
  },
  methods: {
    getAuthHeaders() {
      const token = localStorage.getItem('admin_token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
    async fetchOverview() {
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch('/api/admin/database/overview', {
          headers: this.getAuthHeaders()
        });
        if (!res.ok) {
          throw new Error(`ไม่สามารถโหลดข้อมูลฐานข้อมูลได้ (HTTP ${res.status})`);
        }
        this.overview = await res.json();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async inspectCollection(name) {
      this.selectedCollection = name;
      this.loadingDocs = true;
      this.collectionDocs = [];
      try {
        const res = await fetch(`/api/admin/database/collections/${name}?limit=10`, {
          headers: this.getAuthHeaders()
        });
        if (!res.ok) {
          throw new Error(`ไม่สามารถโหลดเอกสารได้ (HTTP ${res.status})`);
        }
        const data = await res.json();
        this.collectionDocs = data.items || [];
        this.collectionTotal = data.pagination?.totalCount || 0;
      } catch (err) {
        alert(err.message);
      } finally {
        this.loadingDocs = false;
      }
    },
    closeInspector() {
      this.selectedCollection = null;
      this.collectionDocs = [];
    },
    formatIndexKey(keyObj) {
      if (!keyObj) return '-';
      return Object.entries(keyObj)
        .map(([k, v]) => `${k}: ${v === 1 ? 'ASC' : 'DESC'}`)
        .join(', ');
    },
    formatJson(doc) {
      return JSON.stringify(doc, null, 2);
    },
    getCollectionDescription(name) {
      const descs = {
        assessment_attempts: 'จัดเก็บเอกสารแบบประเมินสุขภาพใจของพนักงาน พร้อมผลสรุปคะแนน 5 เครื่องมือ และ Snapshot',
        admin_users: 'จัดเก็บบัญชีผู้ดูแลระบบ พร้อมการเข้ารหัสรหัสผ่าน Argon2id และสถานะล็อกบัญชีชั่วคราว',
        admin_sessions: 'จัดเก็บ Session Tokens ของผู้ดูแลระบบที่กำลังออนไลน์ พร้อมกำหนดเวลาหมดอายุ (TTL)',
        audit_logs: 'บันทึกประวัติการใช้งานและเหตุการณ์สำคัญในระบบตามข้อกำหนดความปลอดภัยและ PDPA',
        admin_resets: 'บันทึกประวัติการรีเซ็ตผลการประเมินโดยแอดมินพร้อมเหตุผล'
      };
      return descs[name] || 'คอลเลกชันเอกสารในระบบ MongoDB';
    }
  }
};
</script>

<style scoped>
.database-view-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.db-header-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.db-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.db-icon {
  font-size: 2.25rem;
}

.db-title-row h2 {
  font-size: 1.25rem;
  margin: 0;
  color: #0f172a;
}

.subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0.25rem 0 0 0;
}

.btn-refresh {
  background: white;
  border: 1px solid #cbd5e1;
  padding: 0.45rem 0.9rem;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-refresh:hover:not(:disabled) {
  background: #f8fafc;
  color: #0284c7;
}

.status-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.status-chip {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8rem;
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #16a34a;
}

.chip-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.chip-info {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
}

.chip-neutral {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.25rem;
}

.collection-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.collection-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}

.col-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.col-name-badge {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 1rem;
  color: #0f172a;
}

.doc-count-badge {
  background: #e0f2fe;
  color: #0284c7;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
}

.col-description {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.45;
  margin: 0 0 1rem 0;
  flex: 1;
}

.indexes-section {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.section-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.4rem;
}

.indexes-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.index-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
}

.index-item code {
  background: #ffffff;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  color: #0369a1;
}

.badge-unique {
  font-size: 0.65rem;
  background: #fef3c7;
  color: #b45309;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-weight: 600;
}

.col-card-footer {
  margin-top: auto;
}

.btn-inspect-docs {
  width: 100%;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 0.45rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-inspect-docs:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.guide-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
}

.guide-card h3 {
  font-size: 1.05rem;
  margin: 0 0 0.5rem 0;
  color: #0f172a;
}

.guide-desc {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.75rem 0;
}

.connection-code-box {
  background: #0f172a;
  color: #38bdf8;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.guide-note {
  font-size: 0.8rem;
  color: #475569;
  margin: 0;
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1.5rem;
}

.modal-dialog.modal-lg {
  background: #ffffff;
  border-radius: 10px;
  width: 100%;
  max-width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-title-wrap h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #0f172a;
}

.btn-close-modal {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.docs-count-header {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.75rem;
}

.doc-block {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.doc-header {
  background: #f1f5f9;
  padding: 0.4rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.doc-index {
  font-weight: bold;
  color: #64748b;
}

.doc-tag {
  background: #e2e8f0;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.tag-action {
  background: #f1f5f9;
  color: #334155;
  font-family: monospace;
  font-weight: 600;
  border: 1px solid #cbd5e1;
}

.tag-status-success {
  background: #dcfce7;
  color: #166534;
  font-weight: 600;
}

.tag-status-failed {
  background: #fee2e2;
  color: #991b1b;
  font-weight: 600;
}

.tag-purpose {
  background: #eff6ff;
  color: #1e40af;
  font-size: 0.72rem;
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.json-preview {
  margin: 0;
  padding: 0.75rem;
  font-size: 0.75rem;
  color: #1e293b;
  background: #f8fafc;
  overflow-x: auto;
}

.modal-footer {
  padding: 0.75rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.btn-modal-close {
  padding: 0.45rem 1rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

/* ==========================================================================
   Responsive Multi-Device Layout (PC, iPad/Tablet, Mobile Phone)
   ========================================================================== */

/* --- iPad / Tablet (<= 1024px) --- */
@media (max-width: 1024px) {
  .collections-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

/* --- Mobile Phone (<= 768px) --- */
@media (max-width: 768px) {
  .db-title-row {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .btn-refresh {
    width: 100%;
    text-align: center;
  }

  .collections-grid {
    grid-template-columns: 1fr;
  }

  .status-chips-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .db-modal-card {
    width: 95% !important;
    max-width: 95% !important;
    margin: 1rem auto;
  }
}
</style>
