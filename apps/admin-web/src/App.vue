<template>
  <div class="admin-app-root">
    <!-- 1. Checking Session State -->
    <div v-if="checkingSession" class="loading-container">
      <div class="spinner"></div>
      <p>กำลังตรวจสอบข้อมูลสิทธิ์ผู้ดูแลระบบ...</p>
    </div>

    <!-- 2. Unauthenticated: Admin Portal Landing & Admin Login Pages -->
    <AdminPortalLanding
      v-else-if="!admin && unauthScreen === 'portal'"
      @start-login="unauthScreen = 'login'"
    />
    <AdminLogin
      v-else-if="!admin && unauthScreen === 'login'"
      @login-success="onLoginSuccess"
      @back-to-portal="unauthScreen = 'portal'"
    />

    <!-- 3. Authenticated: Responsive Admin Shell -->
    <div v-else class="admin-layout">
      <!-- Mobile Backdrop Overlay -->
      <div
        v-if="mobileMenuOpen"
        class="sidebar-backdrop"
        @click="closeMobileMenu"
      ></div>

      <!-- Sidebar Navigation -->
      <aside class="sidebar" :class="{ 'sidebar-open': mobileMenuOpen }">
        <div class="brand">
          <div class="brand-title-wrap">
            <img src="/logo.jpeg" alt="INET Logo" class="admin-brand-logo" />
            <h2>Well-being Survey Admin</h2>
          </div>
          <button
            class="btn-close-sidebar"
            @click="closeMobileMenu"
            aria-label="ปิดเมนู"
          >
            ✕
          </button>
        </div>
        <div class="brand-badge-wrap">
          <span :class="['badge', isSuperAdmin ? 'badge-super' : 'badge-admin']">
            {{ isSuperAdmin ? '👑 Super Admin Shell' : '👤 Admin Shell' }}
          </span>
          <span v-if="isMockEnabled" class="badge badge-prototype">🧪 Prototype Edition</span>
        </div>

        <nav class="nav-links" role="navigation" aria-label="แถบเมนูหลัก">
          <!-- Step 7: Super Admin Portal Menu (Only for Super Admin) -->
          <button
            v-if="isSuperAdmin"
            class="nav-item"
            :class="{ active: currentTab === 'portal' }"
            @click="selectTab('portal')"
          >
            <span class="nav-icon">🏠</span>
            <span>Portal Employee Well-being</span>
          </button>

          <!-- Step 9 & 17: Dashboard -->
          <button
            class="nav-item"
            :class="{ active: currentTab === 'dashboard' }"
            @click="selectTab('dashboard')"
          >
            <span class="nav-icon">📊</span>
            <span>Dashboard สถิติ</span>
          </button>

          <!-- Individual Results Table -->
          <button
            class="nav-item"
            :class="{ active: currentTab === 'results' }"
            @click="selectTab('results')"
          >
            <span class="nav-icon">📋</span>
            <span>ตารางรายบุคคล</span>
          </button>

          <!-- Step 10: กำหนดสิทธิการเข้าถึงของ Admin (Only for Super Admin) -->
          <button
            v-if="isSuperAdmin"
            class="nav-item"
            :class="{ active: currentTab === 'permissions' }"
            @click="selectTab('permissions')"
          >
            <span class="nav-icon">🔐</span>
            <span>กำหนดสิทธิ Admin</span>
          </button>

          <!-- Super Admin Audit Logs Menu (Only for Super Admin) -->
          <button
            v-if="isSuperAdmin"
            class="nav-item"
            :class="{ active: currentTab === 'audit-logs' }"
            @click="selectTab('audit-logs')"
          >
            <span class="nav-icon">📜</span>
            <span>ประวัติการใช้งาน (Audit Logs)</span>
          </button>

          <!-- MongoDB Overview -->
          <button
            class="nav-item"
            :class="{ active: currentTab === 'database' }"
            @click="selectTab('database')"
          >
            <span class="nav-icon">🍃</span>
            <span>โครงสร้าง MongoDB</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <div class="admin-user-info">
            <span class="avatar">{{ isSuperAdmin ? '👑' : '👤' }}</span>
            <div class="user-details">
              <strong class="username">{{ admin.fullName || admin.username }}</strong>
              <span class="role-tag">{{ isSuperAdmin ? 'Super Admin' : 'Admin' }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Layout Wrapper -->
      <div class="main-wrapper">
        <!-- Topbar -->
        <header class="topbar">
          <div class="topbar-left">
            <button
              class="btn-hamburger"
              @click="toggleMobileMenu"
              aria-label="เปิดเมนูนำทาง"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <span class="breadcrumb-title">
              {{ 
                currentTab === 'portal' ? 'Portal Employee Well-being Survey (Super Admin)' :
                currentTab === 'permissions' ? 'กำหนดสิทธิการเข้าถึงของ Admin (Admin Permission Management)' :
                currentTab === 'results' ? 'ตารางผลการประเมินรายบุคคล (Individual Results Table)' : 
                currentTab === 'dashboard' ? 'Dashboard Employee Well-being Survey (ผลการประเมินภาพรวม)' : 
                currentTab === 'audit-logs' ? 'บันทึกประวัติการตรวจสอบกิจกรรมระบบ (System Audit & Activity Logs)' :
                'โครงสร้างฐานข้อมูล MongoDB (Document Store)' 
              }}
            </span>
          </div>
          <div class="topbar-right">
            <span class="auth-status">
              เข้าสู่ระบบในฐานะ: <strong>{{ admin.username }}</strong>
              <span :class="['role-chip', isSuperAdmin ? 'chip-super' : 'chip-admin']">
                {{ isSuperAdmin ? '👑 Super Admin' : 'Admin' }}
              </span>
            </span>
            <button class="btn-logout" :disabled="loggingOut" @click="handleLogout" title="ออกจากระบบ">
              <span v-if="loggingOut">กำลังออก...</span>
              <span v-else class="logout-text">ออกจากระบบ 🚪</span>
              <span v-else class="logout-icon-only">🚪</span>
            </button>
          </div>
        </header>

        <!-- Prototype Notification Banner (Visible only when Mock is enabled) -->
        <div v-if="isMockEnabled" class="prototype-banner">
          <div class="prototype-banner-left">
            <span class="prototype-pill">🧪 PROTOTYPE</span>
            <span class="prototype-text">
              <strong>โหมดทดสอบและนำเสนอ (Demo Prototype Edition):</strong>
              ระบบทำงานด้วยข้อมูลจำลอง (Mock Data) ครอบคลุมภาพรวม Dashboard สถิติ, ตารางรายบุคคล และประวัติระบบ (Audit Logs) พร้อมสำหรับทดสอบ
            </span>
          </div>
          <div class="prototype-banner-right">
            <span class="prototype-status-badge">● พร้อมพรีเซนต์</span>
          </div>
        </div>

        <!-- Main Content Area -->
        <main class="content">
          <!-- View 0: Super Admin Portal (Step 7) -->
          <div v-if="currentTab === 'portal' && isSuperAdmin" class="tab-view view-portal">
            <AdminPortal :admin="admin" @select-view="selectTab($event)" />
          </div>

          <!-- View 1: Individual Results Table -->
          <div v-else-if="currentTab === 'results'" class="tab-view view-results">
            <IndividualResultsTable :admin="admin" />
          </div>

          <!-- View 2: Aggregate Statistics Dashboard (Step 9 & 17) -->
          <div v-else-if="currentTab === 'dashboard'" class="tab-view view-dashboard">
            <AggregateDashboard />
          </div>

          <!-- View 3: Admin Permissions Management (Step 10) -->
          <div v-else-if="currentTab === 'permissions' && isSuperAdmin" class="tab-view view-permissions">
            <AdminPermissionManagement />
          </div>

          <!-- View 4: Super Admin Audit Logs -->
          <div v-else-if="currentTab === 'audit-logs' && isSuperAdmin" class="tab-view view-audit-logs">
            <AuditLogs :admin="admin" />
          </div>

          <!-- View 5: MongoDB Database Overview & Inspector -->
          <div v-else-if="currentTab === 'database'" class="tab-view view-database">
            <DatabaseOverview />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script>
import AdminPortalLanding from './components/AdminPortalLanding.vue';
import AdminLogin from './components/AdminLogin.vue';
import AdminPortal from './components/AdminPortal.vue';
import AdminPermissionManagement from './components/AdminPermissionManagement.vue';
import IndividualResultsTable from './components/IndividualResultsTable.vue';
import AggregateDashboard from './components/AggregateDashboard.vue';
import DatabaseOverview from './components/DatabaseOverview.vue';
import AuditLogs from './components/AuditLogs.vue';

export default {
  name: 'AdminApp',
  components: {
    AdminPortalLanding,
    AdminLogin,
    AdminPortal,
    AdminPermissionManagement,
    IndividualResultsTable,
    AggregateDashboard,
    DatabaseOverview,
    AuditLogs
  },
  data() {
    return {
      checkingSession: true,
      loggingOut: false,
      unauthScreen: 'portal', // 'portal' | 'login'
      admin: null,
      currentTab: 'dashboard',
      mobileMenuOpen: false
    };
  },
  computed: {
    isMockEnabled() {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.has('mock')) {
          const val = params.get('mock');
          if (val === 'false' || val === '0') return false;
          if (val === 'true' || val === '1') return true;
        }
      }
      return import.meta.env.VITE_ENABLE_MOCK !== 'false' && import.meta.env.VITE_ENABLE_MOCK !== false;
    },
    isSuperAdmin() {
      return (this.admin?.role || '').toLowerCase() === 'super_admin';
    }
  },
  async mounted() {
    await this.checkSession();
  },
  methods: {
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    },
    closeMobileMenu() {
      this.mobileMenuOpen = false;
    },
    selectTab(tab) {
      this.currentTab = tab;
      this.closeMobileMenu();
    },
    async checkSession() {
      this.checkingSession = true;
      try {
        const token = localStorage.getItem('admin_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/admin/auth/me', { headers });
        if (res.ok) {
          const data = await res.json();
          this.admin = data.admin;
          if (this.isSuperAdmin) {
            this.currentTab = 'portal';
          } else {
            this.currentTab = 'dashboard';
          }
        } else {
          this.admin = null;
          localStorage.removeItem('admin_token');
        }
      } catch (err) {
        this.admin = null;
      } finally {
        this.checkingSession = false;
      }
    },
    onLoginSuccess(adminData) {
      this.admin = adminData;
      if (this.isSuperAdmin) {
        this.currentTab = 'portal';
      } else {
        this.currentTab = 'dashboard';
      }
    },
    async handleLogout() {
      this.loggingOut = true;
      try {
        const token = localStorage.getItem('admin_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await fetch('/api/admin/auth/logout', { method: 'POST', headers });
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        localStorage.removeItem('admin_token');
        this.admin = null;
        this.loggingOut = false;
      }
    }
  }
};
</script>

<style scoped>
.admin-app-root {
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #1e293b;
  background-color: #f8fafc;
}

.loading-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  background: #0f172a;
  color: #f8fafc;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.brand-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.admin-brand-logo {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.brand h2 {
  font-size: 1.15rem;
  margin: 0;
  color: #38bdf8;
}

.badge {
  display: inline-block;
  font-size: 0.7rem;
  background: #1e293b;
  color: #94a3b8;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-top: 0.25rem;
}

.badge-super {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
  font-weight: 600;
}

.badge-admin {
  background: #1e293b;
  color: #94a3b8;
}

.badge-prototype {
  background: #2563eb;
  color: #ffffff;
  border: 1px solid #1d4ed8;
  font-weight: 600;
  margin-left: 0.35rem;
}

.role-chip {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

.chip-super {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.chip-admin {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.nav-links {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 1rem;
  background: transparent;
  color: #94a3b8;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #1e293b;
  color: #f8fafc;
}

.nav-item.active {
  background: #0284c7;
  color: #ffffff;
  font-weight: 600;
}

.nav-icon {
  font-size: 1.1rem;
}

.sidebar-footer {
  padding-top: 1rem;
  border-top: 1px solid #1e293b;
}

.admin-user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  font-size: 1.5rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 0.85rem;
  color: #f8fafc;
}

.role-tag {
  font-size: 0.7rem;
  color: #38bdf8;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prototype-banner {
  background: linear-gradient(90deg, #eff6ff 0%, #f0fdf4 100%);
  border-bottom: 1px solid #bfdbfe;
  padding: 0.6rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
}

.prototype-banner-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.prototype-pill {
  background: #1d4ed8;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.72rem;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  letter-spacing: 0.5px;
  box-shadow: 0 1px 2px rgba(29, 78, 216, 0.2);
}

.prototype-text {
  color: #1e3a8a;
  line-height: 1.4;
}

.prototype-banner-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.prototype-status-badge {
  background: #dcfce7;
  color: #15803d;
  font-weight: 600;
  font-size: 0.75rem;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  border: 1px solid #86efac;
}

.breadcrumb-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.auth-status {
  font-size: 0.85rem;
  color: #64748b;
}

.btn-logout {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fca5a5;
}

.content {
  padding: 1.5rem;
  flex: 1;
  min-width: 0;
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #0f172a;
}

.badge-notice {
  font-size: 0.75rem;
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
}

.card-description {
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.empty-placeholder {
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 3rem 1.5rem;
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
}

/* ==========================================================================
   Responsive Multi-Device Layout (PC, iPad/Tablet, Mobile Phone)
   ========================================================================== */

.btn-hamburger {
  display: none;
}

.btn-close-sidebar {
  display: none;
}

.sidebar-backdrop {
  display: none;
}

.logout-icon-only {
  display: none;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

/* --- iPad / Tablet & Small Laptops (<= 1024px) --- */
@media (max-width: 1024px) {
  .btn-hamburger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    color: #1e293b;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .btn-hamburger:hover {
    background: #e2e8f0;
    border-color: #94a3b8;
  }

  .btn-hamburger:active {
    transform: scale(0.95);
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: none;
    overflow-y: auto;
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
  }

  .brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .btn-close-sidebar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 6px;
    color: #94a3b8;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-close-sidebar:hover {
    background: #334155;
    color: #ffffff;
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    z-index: 999;
    animation: fadeIn 0.2s ease;
  }

  .content {
    padding: 1.25rem 1rem;
  }
}

/* --- Mobile Phones (<= 640px) --- */
@media (max-width: 640px) {
  .topbar {
    padding: 0.65rem 0.75rem;
    gap: 0.5rem;
  }

  .breadcrumb-title {
    font-size: 0.9rem;
    max-width: 170px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .auth-status {
    display: none;
  }

  .logout-text {
    display: none;
  }

  .logout-icon-only {
    display: inline;
    font-size: 1.05rem;
  }

  .btn-logout {
    padding: 0.4rem 0.65rem;
    font-size: 0.9rem;
  }

  .content {
    padding: 0.75rem 0.5rem;
  }

  .prototype-banner {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .prototype-banner-right {
    display: none;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
