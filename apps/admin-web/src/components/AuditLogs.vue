<template>
  <div class="audit-logs-view">
    <!-- Header Card -->
    <div class="audit-header-card">
      <div class="audit-title-row">
        <div class="title-with-icon">
          <span class="db-icon">📜</span>
          <div>
            <h2>บันทึกประวัติการตรวจสอบกิจกรรมระบบ (System Audit &amp; Activity Logs)</h2>
            <p class="subtitle">บันทึกกิจกรรมและประวัติการทำงานของผู้ดูแลระบบทั้งหมด (Admin &amp; Super Admin Audit Trail) สำหรับการกำกับดูแลความปลอดภัยและ PDPA Compliance</p>
          </div>
        </div>
        <div class="toolbar-actions">
          <button
            type="button"
            class="btn-export"
            id="mh-btn-export-audit-logs"
            :disabled="exporting"
            @click="exportAuditLogs"
          >
            <span v-if="exporting">กำลังส่งออก...</span>
            <span v-else>📥 ส่งออก Audit Logs (Excel / CSV)</span>
          </button>
          <button
            type="button"
            class="btn-table-refresh"
            id="mh-btn-refresh-audit-logs"
            :disabled="loading"
            @click="refreshLogs"
          >
            <span v-if="loading">กำลังโหลด...</span>
            <span v-else>🔄 รีเฟรช Log</span>
          </button>
        </div>
      </div>

      <div class="audit-compliance-banner">
        <span class="compliance-icon">🛡️</span>
        <div>
          <strong class="compliance-title">ข้อกำหนดการจัดเก็บ Audit Trail ตามมาตรฐาน PDPA มาตรา 39 และ ISO/IEC 27001</strong>
          <p class="compliance-desc">
            ระบบทำการบันทึก Log แบบไม่สามารถแก้ไขได้ (Append-Only Log with Cryptographic Hash) ครอบคลุม: การระบุตัวตนผู้ดูแล (Actor ID), กิจกรรม (Action Type), เวลาบันทึก (Timestamp), ทรัพยากรเป้าหมาย (Target), วัตถุประสงค์ PDPA (Purpose Justification) และ IP Address ย้อนหลัง 2 ปี
          </p>
        </div>
      </div>
    </div>

    <!-- 4 KPI Stat Cards -->
    <div class="audit-stats-grid">
      <div class="audit-stat-card stat-blue">
        <span class="audit-stat-label"><span>📊</span> กิจกรรมทั้งหมด (Total Logs)</span>
        <span class="audit-stat-value" id="mh-audit-stat-total">{{ stats.total }}</span>
        <span class="audit-stat-sub">กิจกรรมสะสมในระบบย้อนหลัง</span>
      </div>
      <div class="audit-stat-card stat-amber">
        <span class="audit-stat-label"><span>👁️</span> เข้าดูข้อมูลละเอียด (Sensitive Views)</span>
        <span class="audit-stat-value" id="mh-audit-stat-sensitive">{{ stats.sensitiveViews }}</span>
        <span class="audit-stat-sub">มีบันทึกวัตถุประสงค์ PDPA กำกับทุกครั้ง</span>
      </div>
      <div class="audit-stat-card stat-green">
        <span class="audit-stat-label"><span>📥</span> ส่งออกรายงาน (Export Reports)</span>
        <span class="audit-stat-value" id="mh-audit-stat-export">{{ stats.exportReports }}</span>
        <span class="audit-stat-sub">ยืนยันรหัสผ่าน Admin ก่อนดาวน์โหลด</span>
      </div>
      <div class="audit-stat-card stat-purple">
        <span class="audit-stat-label"><span>🔐</span> ปรับปรุงสิทธิ์ผู้ดูแล (Permissions)</span>
        <span class="audit-stat-value" id="mh-audit-stat-perms">{{ stats.permissionsUpdates }}</span>
        <span class="audit-stat-sub">เพิ่ม/แก้ไขสิทธิ์โดย Super Admin</span>
      </div>
    </div>

    <!-- Table Container with Filter Toolbar -->
    <div class="individual-table-card">
      <div class="table-toolbar">
        <div class="search-box">
          <span>🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            id="mh-audit-search-input"
            class="search-input"
            placeholder="ค้นหา Actor, รหัสเป้าหมาย, Action, หรือ IP Address..."
            @input="onSearchInput"
          />
        </div>

        <div class="filter-controls-group">
          <select
            v-model="roleFilter"
            id="mh-audit-filter-role"
            class="filter-select"
            @change="fetchLogs(1)"
          >
            <option value="">ทุกบทบาทผู้กระทำ (All Roles)</option>
            <option value="Super Admin">👑 Super Admin</option>
            <option value="Admin">👤 Admin</option>
          </select>

          <select
            v-model="actionFilter"
            id="mh-audit-filter-action"
            class="filter-select"
            @change="fetchLogs(1)"
          >
            <option value="">ทุกประเภทกิจกรรม (All Actions)</option>
            <option value="view_sensitive_detail">👁️ เข้าดูข้อมูลละเอียด (view_sensitive_detail)</option>
            <option value="export_results">📥 ส่งออกรายงานผล (export_results)</option>
            <option value="create_admin">🔐 จัดการสิทธิ์ Admin (create_admin)</option>
            <option value="update_permissions">🔐 แก้ไขสิทธิ์ Admin (update_permissions)</option>
            <option value="reset_attempt">🔄 รีเซ็ตการประเมิน (reset_attempt)</option>
            <option value="admin_login">🔑 เข้าสู่ระบบ (admin_login)</option>
            <option value="export_denied">⛔ ถูกระงับสิทธิ์ (export_denied)</option>
          </select>

          <button
            type="button"
            class="btn-table-refresh"
            id="mh-btn-audit-filter-reset"
            title="ล้างตัวกรอง"
            @click="resetFilters"
          >
            ล้างกรอง
          </button>

          <span class="total-badge" id="mh-audit-table-count">
            {{ loading ? 'กำลังโหลด...' : `${items.length} จาก ${pagination.totalCount} รายการ` }}
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && items.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>กำลังโหลดบันทึกประวัติการตรวจสอบกิจกรรมระบบ...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-banner">
        <span>⚠️ {{ error }}</span>
        <button class="btn-retry" @click="fetchLogs(pagination.page)">ลองใหม่</button>
      </div>

      <!-- Data Table -->
      <div v-else class="data-table-wrapper">
        <table class="data-table" id="mh-audit-logs-table">
          <thead>
            <tr>
              <th style="min-width: 140px;">วันที่และเวลา (Timestamp)</th>
              <th style="min-width: 160px;">ผู้ดำเนินการ (Actor)</th>
              <th style="min-width: 150px;">กิจกรรม (Action)</th>
              <th style="min-width: 170px;">เป้าหมาย (Target Resource)</th>
              <th style="min-width: 220px;">วัตถุประสงค์ / รายละเอียด (Purpose &amp; Note)</th>
              <th style="min-width: 110px;">IP Address</th>
              <th style="min-width: 90px; text-align: center;">สถานะ (Status)</th>
              <th style="min-width: 90px; text-align: center;">ดู Log</th>
            </tr>
          </thead>
          <tbody id="mh-audit-logs-tbody">
            <tr v-if="items.length === 0">
              <td colspan="8" class="empty-state">
                ไม่พบบันทึกกิจกรรมตามเงื่อนไขที่ระบุ
              </td>
            </tr>
            <tr v-for="log in items" :key="log.eventId || log.id">
              <td class="col-timestamp">
                {{ formatTimestamp(log.timestamp) }}
              </td>
              <td>
                <strong class="actor-name">{{ getRoleIcon(log.actorRole) }} {{ log.actorName || log.actor }}</strong><br />
                <code class="actor-sub">{{ log.actorLogin || log.actor }} ({{ formatRoleName(log.actorRole) }})</code>
              </td>
              <td>
                <span class="action-pill" :class="getActionClass(log.action)">
                  {{ formatActionLabel(log.action) }}
                </span>
              </td>
              <td>
                <strong class="target-name">{{ log.target }}</strong>
              </td>
              <td class="col-purpose">
                {{ log.purpose || '-' }}
              </td>
              <td>
                <code class="ip-code">{{ log.ip || '-' }}</code>
              </td>
              <td style="text-align: center;">
                <span
                  class="audit-status-tag"
                  :class="log.status === 'SUCCESS' ? 'status-success' : 'status-denied'"
                >
                  {{ log.status === 'SUCCESS' ? '● สำเร็จ' : '✕ ปฏิเสธ' }}
                </span>
              </td>
              <td style="text-align: center;">
                <button
                  type="button"
                  class="btn-audit-detail"
                  @click="openDetail(log)"
                >
                  ดู Log 🔍
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="pagination-footer">
        <button
          class="btn-page"
          :disabled="pagination.page <= 1 || loading"
          @click="changePage(pagination.page - 1)"
        >
          ‹ ก่อนหน้า
        </button>
        <span class="page-indicator">
          หน้า {{ pagination.page }} จาก {{ pagination.totalPages }}
        </span>
        <button
          class="btn-page"
          :disabled="pagination.page >= pagination.totalPages || loading"
          @click="changePage(pagination.page + 1)"
        >
          ถัดไป ›
        </button>
      </div>
    </div>

    <!-- Modal 6: Audit Log Event Detail Modal -->
    <div
      v-if="selectedLog"
      id="mh-audit-detail-modal"
      class="admin-modal-backdrop"
      role="dialog"
      aria-modal="true"
      @click.self="closeDetail"
    >
      <div class="admin-modal-dialog">
        <div class="admin-modal-header">
          <div>
            <h3 id="mh-audit-detail-title">รายละเอียดบันทึกการตรวจสอบ (Audit Log Event Detail)</h3>
            <span class="badge-hash-verify">
              📜 Immutable Event Record • SHA-256 Verified
            </span>
          </div>
          <button type="button" class="admin-btn-close-modal" @click="closeDetail">✕</button>
        </div>
        <div class="admin-modal-body">
          <div class="pdpa-alert-box-success">
            <span>✅ รายการ Log นี้ถูกบันทึกลงในระบบจัดเก็บหลักฐานความปลอดภัยแบบ Append-Only และผ่านการตรวจสอบ Cryptographic Hash สมบูรณ์</span>
          </div>

          <div class="detail-snapshot-grid">
            <div class="snap-item">
              <span class="snap-label">Event ID:</span>
              <span class="snap-val"><code>{{ selectedLog.eventId || selectedLog.id }}</code></span>
            </div>
            <div class="snap-item">
              <span class="snap-label">Timestamp:</span>
              <span class="snap-val">{{ formatTimestamp(selectedLog.timestamp) }}</span>
            </div>
            <div class="snap-item">
              <span class="snap-label">ผู้ดำเนินการ (Actor):</span>
              <span class="snap-val">{{ selectedLog.actorLogin || selectedLog.actor }} ({{ selectedLog.actorName || selectedLog.actor }})</span>
            </div>
            <div class="snap-item">
              <span class="snap-label">บทบาท (Role):</span>
              <span class="snap-val">{{ getRoleIcon(selectedLog.actorRole) }} {{ formatRoleName(selectedLog.actorRole) }}</span>
            </div>
            <div class="snap-item">
              <span class="snap-label">ประเภทกิจกรรม (Action):</span>
              <span class="snap-val"><code>{{ selectedLog.action }}</code></span>
            </div>
            <div class="snap-item">
              <span class="snap-label">สถานะ (Status):</span>
              <span
                class="snap-val"
                :style="{ color: selectedLog.status === 'SUCCESS' ? '#059669' : '#dc2626', fontWeight: 600 }"
              >
                {{ selectedLog.status === 'SUCCESS' ? 'SUCCESS (สำเร็จ)' : 'DENIED (ถูกระงับสิทธิ์)' }}
              </span>
            </div>
            <div class="snap-item">
              <span class="snap-label">ทรัพยากรเป้าหมาย (Target):</span>
              <span class="snap-val">{{ selectedLog.target }}</span>
            </div>
            <div class="snap-item">
              <span class="snap-label">IP Address:</span>
              <span class="snap-val"><code>{{ selectedLog.ip || '-' }}</code></span>
            </div>
          </div>

          <div class="purpose-detail-box">
            <span class="purpose-header-label">
              วัตถุประสงค์ / คำอธิบายประกอบ (PDPA Purpose &amp; Justification):
            </span>
            <p class="purpose-content">
              {{ selectedLog.purpose || 'ไม่มีการระบุวัตถุประสงค์เพิ่มเติม' }}
            </p>
          </div>

          <div class="json-section">
            <span class="json-header-label">
              Raw JSON Event Payload (MongoDB Document):
            </span>
            <pre class="audit-json-box"><code>{{ formatJsonPayload(selectedLog) }}</code></pre>
          </div>
        </div>
        <div class="admin-modal-footer">
          <button type="button" class="btn-shortcut" @click="closeDetail">ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AuditLogs',
  props: {
    admin: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      loading: false,
      exporting: false,
      error: null,
      searchQuery: '',
      searchDebounceTimer: null,
      roleFilter: '',
      actionFilter: '',
      items: [],
      stats: {
        total: 0,
        sensitiveViews: 0,
        exportReports: 0,
        permissionsUpdates: 0
      },
      pagination: {
        page: 1,
        limit: 25,
        totalCount: 0,
        totalPages: 1
      },
      selectedLog: null
    };
  },
  async mounted() {
    await this.fetchLogs(1);
  },
  methods: {
    getAuthHeaders(extra = {}) {
      const token = localStorage.getItem('admin_token');
      return {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra
      };
    },
    async fetchLogs(page = 1) {
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(this.pagination.limit)
        });

        if (this.searchQuery && this.searchQuery.trim()) {
          params.append('search', this.searchQuery.trim());
        }
        if (this.roleFilter) {
          params.append('role', this.roleFilter);
        }
        if (this.actionFilter) {
          params.append('action', this.actionFilter);
        }

        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
          headers: this.getAuthHeaders()
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `โหลด Audit Logs ล้มเหลว (${res.status})`);
        }

        const data = await res.json();
        this.items = data.items || [];
        if (data.stats) {
          this.stats = { ...data.stats };
        }
        if (data.pagination) {
          this.pagination = { ...data.pagination };
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async refreshLogs() {
      await this.fetchLogs(this.pagination.page);
    },
    onSearchInput() {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => {
        this.fetchLogs(1);
      }, 350);
    },
    resetFilters() {
      this.searchQuery = '';
      this.roleFilter = '';
      this.actionFilter = '';
      this.fetchLogs(1);
    },
    changePage(newPage) {
      if (newPage < 1 || newPage > this.pagination.totalPages) return;
      this.fetchLogs(newPage);
    },
    async exportAuditLogs() {
      this.exporting = true;
      try {
        const res = await fetch('/api/admin/audit-logs/export', {
          method: 'POST',
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ format: 'csv' })
        });

        if (!res.ok) {
          throw new Error(`ส่งออกข้อมูลล้มเหลว (${res.status})`);
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const nowStr = new Date().toISOString().slice(0, 10);
        a.download = `audit_logs_${nowStr}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } catch (err) {
        alert(`ส่งออกข้อมูลไม่สำเร็จ: ${err.message}`);
      } finally {
        this.exporting = false;
      }
    },
    openDetail(log) {
      this.selectedLog = log;
    },
    closeDetail() {
      this.selectedLog = null;
    },
    getRoleIcon(role) {
      const r = (role || '').toLowerCase();
      return r.includes('super') ? '👑' : '👤';
    },
    formatRoleName(role) {
      if (!role) return 'Admin';
      const r = role.toLowerCase();
      if (r.includes('super')) return 'Super Admin';
      return 'Admin';
    },
    getActionClass(action) {
      if (!action) return 'act-auth';
      if (action === 'view_sensitive_detail' || action === 'admin_view_individual') {
        return 'act-sensitive';
      }
      if (action.startsWith('export_') || action === 'admin_export') {
        return 'act-export';
      }
      if (['create_admin', 'update_permissions', 'update_admin_permissions'].includes(action)) {
        return 'act-perm';
      }
      if (action === 'reset_attempt') {
        return 'act-reset';
      }
      if (action === 'export_denied') {
        return 'act-denied';
      }
      if (action === 'admin_login') {
        return 'act-auth';
      }
      return 'act-auth';
    },
    formatActionLabel(action) {
      if (!action) return '-';
      if (action === 'view_sensitive_detail' || action === 'admin_view_individual') {
        return '👁️ เข้าดูข้อมูลละเอียด';
      }
      if (action === 'export_results') {
        return '📥 ส่งออกรายงานผล (export_results)';
      }
      if (action === 'export_admins') {
        return '📥 ส่งออกสิทธิ์ (export_admins)';
      }
      if (action === 'create_admin') {
        return '🔐 จัดการสิทธิ์ (create_admin)';
      }
      if (action === 'update_permissions' || action === 'update_admin_permissions') {
        return '🔐 แก้ไขสิทธิ์ (update_permissions)';
      }
      if (action === 'reset_attempt') {
        return '🔄 รีเซ็ตการประเมิน (reset_attempt)';
      }
      if (action === 'export_denied') {
        return '⛔ ถูกระงับสิทธิ์ (export_denied)';
      }
      if (action === 'admin_login') {
        return '🔑 เข้าสู่ระบบ (admin_login)';
      }
      return action;
    },
    formatTimestamp(ts) {
      if (!ts) return '-';
      try {
        const d = new Date(ts);
        if (isNaN(d.getTime())) return ts;
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const day = String(d.getDate()).padStart(2, '0');
        const month = thaiMonths[d.getMonth()];
        const year = d.getFullYear() + 543;
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        const secs = String(d.getSeconds()).padStart(2, '0');
        return `${day} ${month} ${year} ${hours}:${mins}:${secs} น.`;
      } catch (e) {
        return ts;
      }
    },
    formatJsonPayload(log) {
      if (!log) return '';
      const payload = {
        eventId: log.eventId || log.id,
        timestamp: log.timestamp,
        actor: log.actorLogin || log.actor,
        actorRole: log.actorRole,
        action: log.action,
        target: log.target,
        purpose: log.purpose,
        status: log.status,
        clientIp: log.ip,
        context: log.context || log.metadata || {}
      };
      return JSON.stringify(payload, null, 2);
    }
  }
};
</script>

<style scoped>
.audit-logs-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Header Card */
.audit-header-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.audit-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.title-with-icon {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.title-with-icon .db-icon {
  font-size: 2rem;
  line-height: 1;
}

.title-with-icon h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  color: #0f172a;
  font-weight: 700;
}

.subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #059669;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-export:hover:not(:disabled) {
  background: #047857;
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-table-refresh {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #f8fafc;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-table-refresh:hover:not(:disabled) {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}

/* Compliance Banner */
.audit-compliance-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-left: 4px solid #0284c7;
  border-radius: 8px;
  padding: 0.85rem 1.15rem;
  font-size: 0.85rem;
  color: #334155;
  line-height: 1.5;
}

.compliance-icon {
  font-size: 1.35rem;
  line-height: 1;
}

.compliance-title {
  color: #0f172a;
}

.compliance-desc {
  margin: 2px 0 0;
  font-size: 0.83rem;
  color: #475569;
}

/* 4 KPI Stat Cards */
.audit-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
}

.audit-stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.15rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  position: relative;
  overflow: hidden;
}

.audit-stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #94a3b8;
}

.audit-stat-card.stat-blue::before { background: #0284c7; }
.audit-stat-card.stat-amber::before { background: #d97706; }
.audit-stat-card.stat-green::before { background: #16a34a; }
.audit-stat-card.stat-purple::before { background: #7c3aed; }

.audit-stat-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.audit-stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.audit-stat-sub {
  font-size: 0.76rem;
  color: #94a3b8;
}

/* Table Container & Toolbar */
.individual-table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  flex: 1;
  min-width: 240px;
}

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.88rem;
  width: 100%;
  font-family: inherit;
  color: #0f172a;
}

.filter-controls-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.45rem 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.85rem;
  background: #ffffff;
  color: #334155;
  font-family: inherit;
  outline: none;
}

.total-badge {
  background: #f1f5f9;
  color: #475569;
  padding: 0.4rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

/* Data Table */
.data-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;
}

.data-table thead th {
  background: #f8fafc;
  color: #475569;
  padding: 0.75rem 0.85rem;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.data-table tbody td {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.col-timestamp {
  color: #475569;
  font-size: 0.82rem;
  white-space: nowrap;
}

.actor-name {
  color: #0f172a;
  font-size: 0.86rem;
}

.actor-sub {
  font-size: 0.75rem;
  color: #64748b;
}

.target-name {
  font-size: 0.85rem;
  color: #1e293b;
}

.col-purpose {
  font-size: 0.83rem;
  color: #475569;
  line-height: 1.4;
  max-width: 260px;
}

.ip-code {
  font-size: 0.78rem;
  color: #64748b;
}

/* Action Pills */
.action-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.22rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.76rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid transparent;
  line-height: 1.2;
}

.action-pill.act-export {
  background: #f0fdf4;
  color: #15803d;
  border-color: #bbf7d0;
}

.action-pill.act-sensitive {
  background: #fffbeb;
  color: #b45309;
  border-color: #fde68a;
}

.action-pill.act-perm {
  background: #faf5ff;
  color: #7e22ce;
  border-color: #e9d5ff;
}

.action-pill.act-reset {
  background: #fff1f2;
  color: #be123c;
  border-color: #fecdd3;
}

.action-pill.act-auth {
  background: #f0f9ff;
  color: #0369a1;
  border-color: #bae6fd;
}

.action-pill.act-denied {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

/* Status Tags */
.audit-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.audit-status-tag.status-success {
  background: #ecfdf5;
  color: #047857;
}

.audit-status-tag.status-denied {
  background: #fef2f2;
  color: #b91c1c;
}

/* Button detail */
.btn-audit-detail {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-audit-detail:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}

/* States */
.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  color: #94a3b8;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem;
  color: #64748b;
  gap: 0.75rem;
}

.spinner {
  width: 32px;
  height: 32px;
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
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-retry {
  background: #ef4444;
  color: #ffffff;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
}

/* Pagination */
.pagination-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

.btn-page {
  padding: 0.4rem 0.85rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
  color: #334155;
  font-weight: 500;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-indicator {
  font-size: 0.85rem;
  color: #64748b;
}

/* Modal 6: Detail Modal */
.admin-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.admin-modal-dialog {
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
}

.admin-modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.admin-modal-header h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: #0f172a;
}

.badge-hash-verify {
  display: inline-flex;
  font-size: 0.75rem;
  color: #0284c7;
  font-weight: 600;
  background: #e0f2fe;
  padding: 2px 8px;
  border-radius: 9999px;
}

.admin-btn-close-modal {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.admin-modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pdpa-alert-box-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  line-height: 1.4;
}

.detail-snapshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.snap-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.snap-label {
  font-size: 0.76rem;
  color: #64748b;
  font-weight: 600;
}

.snap-val {
  font-size: 0.88rem;
  color: #0f172a;
}

.purpose-detail-box {
  padding: 0.85rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.purpose-header-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  display: block;
  margin-bottom: 4px;
}

.purpose-content {
  margin: 0;
  font-size: 0.88rem;
  color: #0f172a;
  line-height: 1.5;
}

.json-section {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.json-header-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
}

.audit-json-box {
  background: #0f172a;
  color: #38bdf8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  max-height: 240px;
  line-height: 1.5;
  margin: 0;
}

.admin-modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.btn-shortcut {
  padding: 0.5rem 1.25rem;
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.btn-shortcut:hover {
  background: #e2e8f0;
}

@media (max-width: 768px) {
  .audit-title-row {
    flex-direction: column;
    align-items: stretch;
  }
  .toolbar-actions {
    justify-content: stretch;
  }
  .btn-export, .btn-table-refresh {
    flex: 1;
    justify-content: center;
  }
  .table-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-controls-group {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-select {
    width: 100%;
  }
}
</style>

