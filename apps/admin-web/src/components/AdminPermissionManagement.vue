<template>
  <div class="permission-mgmt-container">
    <!-- Header with Breadcrumbs & Actions -->
    <div class="mgmt-header">
      <div>
        <div class="kicker-tag">🔐 Super Admin Management</div>
        <h1 class="mgmt-title">กำหนดสิทธิการเข้าถึงของ Admin</h1>
        <p class="mgmt-subtitle">
          บริหารจัดการบัญชีผู้ดูแลระบบ กำหนดบทบาท และมอบหมายสิทธิการเข้าใช้งานระบบ เช่น สิทธิ์การกด Export เอกสาร
        </p>
      </div>

      <div class="mgmt-actions">
        <!-- Export Admin List -->
        <button class="btn-outline-export" :disabled="loading || exporting" @click="handleExportAdmins">
          <span v-if="exporting">กำลังส่งออก...</span>
          <span v-else>📥 Export รายชื่อ Admin</span>
        </button>

        <!-- Add Admin Button -->
        <button class="btn-primary-add" @click="openAddModal">
          <span>➕ เพิ่มสิทธิ Admin ใหม่</span>
        </button>
      </div>
    </div>

    <!-- Audit Notification Banner -->
    <div class="audit-badge-banner">
      <span class="badge-icon">🛡️</span>
      <span class="badge-text">
        <strong>ระบบเก็บ Log เพิ่ม/แก้ไข สิทธิ Admin / สิทธิการเข้าใช้:</strong> 
        ทุกการสร้าง แก้ไขบทบาท หรือเปลี่ยนแปลงสิทธิ์การเข้าถึง จะถูกบันทึกประวัติการตรวจสอบ (Audit Trail) อย่างถาวร
      </span>
    </div>

    <!-- Error/Success Feedback Alerts -->
    <div v-if="alertMessage" :class="['alert-banner', alertType === 'error' ? 'alert-error' : 'alert-success']">
      <span>{{ alertType === 'error' ? '⚠️' : '✅' }}</span>
      <span class="alert-content">{{ alertMessage }}</span>
      <button class="btn-close-alert" @click="alertMessage = null">✕</button>
    </div>

    <!-- Admin Accounts Table (Step 10: แสดงรายการ Admin ทั้งหมด) -->
    <div class="table-card">
      <div class="table-card-header">
        <h3 class="table-title">รายการผู้ดูแลระบบทั้งหมด ({{ admins.length }} ท่าน)</h3>
        <button class="btn-refresh" :disabled="loading" @click="fetchAdmins">
          <span>🔄 รีเฟรชข้อมูล</span>
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>กำลังโหลดรายชื่อผู้ดูแลระบบ...</p>
      </div>

      <div v-else-if="admins.length === 0" class="empty-state">
        <p>ยังไม่มีข้อมูลผู้ดูแลระบบ</p>
      </div>

      <div v-else class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>รหัสผู้ดูแล</th>
              <th>Username</th>
              <th>ชื่อ-นามสกุล</th>
              <th>บทบาท (Role)</th>
              <th>สิทธิการเข้าใช้ (Permissions)</th>
              <th>สถานะบัญชี</th>
              <th>วันที่สร้าง</th>
              <th class="th-actions">จัดการสิทธิ์</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="adm in admins" :key="adm.adminId" :class="{ 'row-inactive': adm.status === 'inactive' }">
              <td>
                <span class="col-mono" :title="adm.adminId">{{ formatAdminId(adm.adminId) }}</span>
              </td>
              <td class="col-username">
                <strong class="user-main">{{ adm.username }}</strong>
                <span v-if="adm.email" class="sub-email" :title="adm.email">{{ adm.email }}</span>
              </td>
              <td class="col-fullname">{{ adm.fullName || '-' }}</td>
              <td>
                <span :class="['role-pill', adm.role.toLowerCase() === 'super_admin' ? 'role-super' : 'role-admin']">
                  <span class="role-icon">{{ adm.role.toLowerCase() === 'super_admin' ? '👑' : '👤' }}</span>
                  <span class="role-text">{{ adm.role.toLowerCase() === 'super_admin' ? 'Super Admin' : 'Admin' }}</span>
                </span>
              </td>
              <td>
                <div class="perm-tags">
                  <span
                    v-if="adm.role.toLowerCase() === 'super_admin' || (adm.permissions && adm.permissions.includes('can_export'))"
                    class="perm-badge perm-export"
                    title="อนุญาตให้ส่งออกเอกสารรายงาน (Excel/CSV)"
                  >
                    <svg class="perm-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span>Export เอกสาร</span>
                  </span>
                  <span
                    v-else
                    class="perm-badge perm-none"
                    title="ไม่มีสิทธิ์ส่งออกเอกสารรายงาน: ปุ่ม Export บนตารางจะถูกซ่อน"
                  >
                    <svg class="perm-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                    <span>ไม่มีสิทธิ์ Export</span>
                  </span>
                </div>
              </td>
              <td>
                <span :class="['status-badge', adm.status === 'active' ? 'status-active' : 'status-inactive']">
                  <span class="status-indicator"></span>
                  <span>{{ adm.status === 'active' ? 'ปกติ' : 'ระงับใช้งาน' }}</span>
                </span>
              </td>
              <td class="col-date">{{ formatDate(adm.createdAt) }}</td>
              <td class="col-actions">
                <button
                  class="btn-edit-perm"
                  title="แก้ไขสิทธิ์"
                  @click="openEditModal(adm)"
                >
                  <svg class="btn-icon-svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <span>แก้ไขสิทธิ์</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: เพิ่ม Admin ใหม่ -->
    <div v-if="showAddModal" class="modal-backdrop" @click.self="showAddModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>➕ เพิ่มผู้ดูแลระบบใหม่ (Add Admin)</h3>
          <button class="btn-modal-close" @click="showAddModal = false">✕</button>
        </div>

        <form @submit.prevent="submitCreateAdmin">
          <div class="modal-body">
            <div class="form-group">
              <label>ชื่อผู้ใช้งาน (Username ONE ID) *</label>
              <input v-model.trim="addForm.username" type="text" required placeholder="เช่น hr_user_01" />
            </div>

            <div class="form-group">
              <label>รหัสผ่านตั้งต้น (Password) *</label>
              <input v-model="addForm.password" type="password" required placeholder="รหัสผ่านปลอดภัย" />
            </div>

            <div class="form-group">
              <label>ชื่อ-นามสกุล *</label>
              <input v-model.trim="addForm.fullName" type="text" required placeholder="เช่น คุณสมชาย สุขสบาย" />
            </div>

            <div class="form-group">
              <label>อีเมลติดต่อ</label>
              <input v-model.trim="addForm.email" type="email" placeholder="email@company.com" />
            </div>

            <div class="form-group">
              <label>บทบาท (Role) *</label>
              <select v-model="addForm.role">
                <option value="admin">Admin ทั่วไป</option>
                <option value="super_admin">Super Admin (สิทธิ์สูงสุด)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="addForm.canExport" type="checkbox" />
                <span>อนุญาตให้ส่งออกเอกสารรายงาน (Export เอกสาร Excel / CSV)</span>
              </label>
              <small class="field-hint">หากไม่เลือก ปุ่ม Export บน Dashboard ของผู้ดูแลคนนี้จะถูกซ่อน</small>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="showAddModal = false">ยกเลิก</button>
            <button type="submit" class="btn-save" :disabled="saving">
              <span v-if="saving">กำลังบันทึก...</span>
              <span v-else>บันทึกและสร้างบัญชี</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: แก้ไขสิทธิ์ Admin (Edit Permissions) -->
    <div v-if="showEditModal && editingAdmin" class="modal-backdrop" @click.self="showEditModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>✏️ แก้ไขสิทธิผู้ดูแล: {{ editingAdmin.username }}</h3>
          <button class="btn-modal-close" @click="showEditModal = false">✕</button>
        </div>

        <form @submit.prevent="submitUpdateAdmin">
          <div class="modal-body">
            <div class="info-row">
              <span class="info-label">รหัสผู้ดูแล:</span>
              <span class="info-val col-mono">{{ editingAdmin.adminId }}</span>
            </div>

            <div class="form-group">
              <label>ชื่อ-นามสกุล</label>
              <input v-model.trim="editForm.fullName" type="text" />
            </div>

            <div class="form-group">
              <label>อีเมล</label>
              <input v-model.trim="editForm.email" type="email" />
            </div>

            <div class="form-group">
              <label>บทบาท (Role)</label>
              <select v-model="editForm.role">
                <option value="admin">Admin ทั่วไป</option>
                <option value="super_admin">Super Admin (สิทธิ์สูงสุด)</option>
              </select>
            </div>

            <div class="form-group">
              <label>สถานะบัญชี</label>
              <select v-model="editForm.status">
                <option value="active">ปกติ (Active)</option>
                <option value="inactive">ระงับการใช้งาน (Inactive)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="editForm.canExport" type="checkbox" />
                <span>อนุญาตให้ส่งออกเอกสารรายงาน (Export เอกสาร: Excel / CSV)</span>
              </label>
              <small class="field-hint">หากปิดสิทธิ์ ระบบจะซ่อนปุ่ม Export เอกสารบน Dashboard ของผู้ใช้รายนี้</small>
            </div>

            <div class="form-group">
              <label>เปลี่ยนรหัสผ่าน (เว้นว่างหากไม่ต้องการเปลี่ยน)</label>
              <input v-model="editForm.newPassword" type="password" placeholder="รหัสผ่านใหม่" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="showEditModal = false">ยกเลิก</button>
            <button type="submit" class="btn-save" :disabled="saving">
              <span v-if="saving">กำลังบันทึก...</span>
              <span v-else>บันทึกการแก้ไขสิทธิ์</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminPermissionManagement',
  data() {
    return {
      admins: [],
      loading: false,
      exporting: false,
      saving: false,
      alertMessage: null,
      alertType: 'success',
      showAddModal: false,
      showEditModal: false,
      editingAdmin: null,
      addForm: {
        username: '',
        password: '',
        fullName: '',
        email: '',
        role: 'admin',
        canExport: true
      },
      editForm: {
        fullName: '',
        email: '',
        role: 'admin',
        status: 'active',
        canExport: false,
        newPassword: ''
      }
    };
  },
  mounted() {
    this.fetchAdmins();
  },
  methods: {
    async fetchAdmins() {
      this.loading = true;
      try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'ไม่สามารถโหลดรายชื่อแอดมินได้');
        }
        const data = await res.json();
        this.admins = data.items || [];
      } catch (err) {
        this.showAlert(err.message, 'error');
      } finally {
        this.loading = false;
      }
    },
    showAlert(msg, type = 'success') {
      this.alertMessage = msg;
      this.alertType = type;
      setTimeout(() => {
        if (this.alertMessage === msg) {
          this.alertMessage = null;
        }
      }, 5000);
    },
    openAddModal() {
      this.addForm = {
        username: '',
        password: '',
        fullName: '',
        email: '',
        role: 'admin',
        canExport: true
      };
      this.showAddModal = true;
    },
    openEditModal(adm) {
      this.editingAdmin = adm;
      const isSuper = (adm.role || '').toLowerCase() === 'super_admin';
      const hasExport = isSuper || (adm.permissions && adm.permissions.includes('can_export'));
      this.editForm = {
        fullName: adm.fullName || '',
        email: adm.email || '',
        role: (adm.role || 'admin').toLowerCase(),
        status: adm.status || 'active',
        canExport: hasExport,
        newPassword: ''
      };
      this.showEditModal = true;
    },
    async submitCreateAdmin() {
      this.saving = true;
      try {
        const permissions = [];
        if (this.addForm.canExport) permissions.push('can_export');
        if (this.addForm.role === 'super_admin') permissions.push('manage_admins');

        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: this.addForm.username,
            password: this.addForm.password,
            fullName: this.addForm.fullName,
            email: this.addForm.email,
            role: this.addForm.role,
            permissions
          })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'เกิดข้อผิดพลาดในการสร้างบัญชี');
        }

        this.showAddModal = false;
        this.showAlert('เพิ่มผู้ดูแลระบบเรียบร้อยแล้ว');
        await this.fetchAdmins();
      } catch (err) {
        this.showAlert(err.message, 'error');
      } finally {
        this.saving = false;
      }
    },
    async submitUpdateAdmin() {
      if (!this.editingAdmin) return;
      this.saving = true;
      try {
        const permissions = [];
        if (this.editForm.canExport) permissions.push('can_export');
        if (this.editForm.role === 'super_admin') permissions.push('manage_admins');

        const payload = {
          fullName: this.editForm.fullName,
          email: this.editForm.email,
          role: this.editForm.role,
          status: this.editForm.status,
          permissions
        };
        if (this.editForm.newPassword) {
          payload.password = this.editForm.newPassword;
        }

        const res = await fetch(`/api/admin/users/${this.editingAdmin.adminId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์');
        }

        this.showEditModal = false;
        this.showAlert('อัปเดตสิทธิ์และข้อมูลผู้ดูแลระบบสำเร็จ (ระบบบันทึก Log เรียบร้อย)');
        await this.fetchAdmins();
      } catch (err) {
        this.showAlert(err.message, 'error');
      } finally {
        this.saving = false;
      }
    },
    async handleExportAdmins() {
      this.exporting = true;
      try {
        window.open('/api/admin/users/export?format=excel', '_blank');
        this.showAlert('เริ่มดาวน์โหลดไฟล์สรุปสิทธิ์ผู้ดูแลระบบแล้ว');
      } catch (err) {
        this.showAlert(err.message, 'error');
      } finally {
        this.exporting = false;
      }
    },
    formatAdminId(id) {
      if (!id) return '-';
      if (id === 'admin-super-0000-0000') return 'ADM-SUPER';
      if (id === 'admin-export-0000-0000') return 'ADM-EXPORT';
      if (id === 'admin-view-0000-0000') return 'ADM-VIEW';
      if (id.startsWith('admin-')) {
        const raw = id.replace('admin-', '');
        return 'ADM-' + raw.slice(0, 6).toUpperCase();
      }
      return id;
    },
    formatDate(iso) {
      if (!iso) return '-';
      return new Date(iso).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }
};
</script>

<style scoped>
.permission-mgmt-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  font-family: 'IBM Plex Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.mgmt-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.kicker-tag {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #8b5cf6;
  letter-spacing: 0.05em;
  margin-bottom: 0.35rem;
}

.mgmt-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.4rem 0;
}

.mgmt-subtitle {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
  max-width: 680px;
  line-height: 1.5;
}

.mgmt-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.btn-primary-add {
  padding: 0.65rem 1.25rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary-add:hover {
  background: #1d4ed8;
}

.btn-outline-export {
  padding: 0.65rem 1.25rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #334155;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline-export:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.audit-badge-banner {
  background: #fdf4ff;
  border: 1px solid #f0abfc;
  border-radius: 10px;
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  color: #86198f;
  font-size: 0.88rem;
  line-height: 1.4;
}

.badge-icon {
  font-size: 1.2rem;
}

.alert-banner {
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.alert-success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.alert-content {
  flex: 1;
}

.btn-close-alert {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: inherit;
}

.table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
}

.btn-refresh {
  background: transparent;
  border: 1px solid #cbd5e1;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #475569;
}

.btn-refresh:hover {
  background: #f1f5f9;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.83rem;
  table-layout: auto;
}

.admin-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  font-size: 0.78rem;
  padding: 0.75rem 0.65rem;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.admin-table td {
  padding: 0.75rem 0.65rem;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
  vertical-align: middle;
}

.admin-table tbody tr {
  transition: background-color 0.15s ease;
}

.admin-table tbody tr:hover {
  background-color: #f8fafc;
}

.row-inactive {
  background: #fafafa;
  opacity: 0.65;
}

.col-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.74rem;
  color: #475569;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
  display: inline-block;
  white-space: nowrap;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.col-username {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.user-main {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.83rem;
}

.sub-email {
  font-size: 0.72rem;
  color: #64748b;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-fullname {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.82rem;
  line-height: 1.35;
  min-width: 110px;
  max-width: 180px;
}

/* 2. Role Badge (Refined) */
.role-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.22rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.74rem;
  font-weight: 600;
  white-space: nowrap;
  line-height: 1;
  transition: all 0.2s ease;
}

.role-super {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  color: #92400e;
  border: 1px solid #fde68a;
  box-shadow: 0 1px 2px rgba(217, 119, 6, 0.08);
}

.role-super .role-icon {
  font-size: 0.8rem;
  line-height: 1;
}

.role-admin {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #0369a1;
  border: 1px solid #bae6fd;
  box-shadow: 0 1px 2px rgba(3, 105, 161, 0.06);
}

.role-admin .role-icon {
  font-size: 0.8rem;
  line-height: 1;
}

/* Permissions Badges */
.perm-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.perm-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.73rem;
  padding: 0.22rem 0.5rem;
  border-radius: 9999px;
  font-weight: 500;
  white-space: nowrap;
  line-height: 1.2;
}

.perm-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.perm-export {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.perm-none {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

/* Account Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.74rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.status-active {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.status-badge.status-active .status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25);
}

.status-badge.status-inactive {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.status-badge.status-inactive .status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
}

.col-date {
  font-size: 0.78rem;
  color: #64748b;
  white-space: nowrap;
}

/* 3. Manage Permissions Action Button (Refined) */
.col-actions {
  text-align: center;
}

.th-actions {
  text-align: center;
}

.btn-edit-perm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.35rem 0.65rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
}

.btn-icon-svg {
  width: 13px;
  height: 13px;
  color: #64748b;
  transition: color 0.2s ease;
}

.btn-edit-perm:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
  box-shadow: 0 4px 10px -2px rgba(37, 99, 235, 0.12), 0 2px 4px -1px rgba(37, 99, 235, 0.06);
  transform: translateY(-1px);
}

.btn-edit-perm:hover .btn-icon-svg {
  color: #2563eb;
}

.btn-edit-perm:active {
  transform: translateY(0);
  background: #dbeafe;
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 1000;
}

.modal-card {
  background: #ffffff;
  border-radius: 14px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #0f172a;
}

.btn-modal-close {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #94a3b8;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 70vh;
  overflow-y: auto;
}

.info-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.info-label {
  color: #64748b;
  font-weight: 500;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.form-group input[type="text"],
.form-group input[type="password"],
.form-group input[type="email"],
.form-group select {
  padding: 0.6rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.field-hint {
  font-size: 0.78rem;
  color: #64748b;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-cancel {
  padding: 0.6rem 1.1rem;
  background: transparent;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  cursor: pointer;
}

.btn-save {
  padding: 0.6rem 1.25rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.loading-state, .empty-state {
  padding: 3rem;
  text-align: center;
  color: #64748b;
}

/* ==========================================================================
   Responsive Multi-Device Layout (PC, iPad/Tablet, Mobile Phone)
   ========================================================================== */

/* --- iPad / Tablet (<= 1024px) --- */
@media (max-width: 1024px) {
  .mgmt-title {
    font-size: 1.5rem;
  }
  .mgmt-subtitle {
    font-size: 0.9rem;
  }
  .table-card-header {
    padding: 1rem 1.25rem;
  }
}

/* --- Mobile Phones (<= 640px) --- */
@media (max-width: 640px) {
  .mgmt-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .mgmt-title {
    font-size: 1.3rem;
  }

  .mgmt-subtitle {
    font-size: 0.85rem;
  }

  .mgmt-actions {
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
  }

  .btn-outline-export,
  .btn-primary-add {
    width: 100%;
    text-align: center;
    justify-content: center;
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }

  .audit-badge-banner {
    padding: 0.65rem 0.85rem;
    font-size: 0.8rem;
    gap: 0.5rem;
  }

  .badge-icon {
    font-size: 1rem;
  }

  .table-card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.65rem;
    padding: 0.85rem 1rem;
  }

  .table-title {
    font-size: 0.95rem;
  }

  .btn-refresh {
    width: 100%;
    text-align: center;
  }

  .table-responsive {
    -webkit-overflow-scrolling: touch;
  }

  /* Modals on Mobile Phones */
  .modal-backdrop {
    padding: 0.75rem;
    align-items: flex-end;
  }

  .modal-card {
    max-width: 100%;
    border-radius: 16px 16px 0 0;
    max-height: 88vh;
    display: flex;
    flex-direction: column;
  }

  .modal-body {
    padding: 1rem 1.25rem;
    overflow-y: auto;
  }

  .modal-footer {
    padding: 0.85rem 1.25rem;
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .btn-cancel,
  .btn-save {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
}
</style>
