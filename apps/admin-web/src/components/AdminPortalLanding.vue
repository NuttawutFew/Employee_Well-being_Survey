<template>
  <div class="mh-admin-portal-page">
    <!-- Top Navigation Bar -->
    <header class="mh-admin-nav">
      <div class="mh-admin-nav-content">
        <div class="mh-admin-brand">
          <img src="/logo.jpeg" alt="INET Logo" class="mh-admin-logo-img" />
          <div class="mh-admin-titles">
            <span class="mh-admin-title-th">Mental Health Assessment</span>
            <span class="mh-admin-title-en">Admin Portal • ระบบบริหารจัดการสำหรับผู้ดูแลระบบ</span>
          </div>
        </div>
        <div class="mh-admin-nav-actions">
          <a :href="employeePortalUrl" class="mh-btn-nav-employee" title="สลับไปยังหน้าหลักของพนักงาน">
            <span>👤</span>
            <span>ไปยังหน้าพนักงาน (Employee) ↗</span>
          </a>
        </div>
      </div>
    </header>

    <!-- Admin Hero Grid -->
    <div class="mh-admin-hero-container">
      <div class="mh-admin-hero-content">
        <div class="mh-admin-badge">
          <span class="badge-icon">🛡️</span>
          <span>ศูนย์กลางข้อมูลสำหรับฝ่ายทรัพยากรบุคคล (HR / Admin Portal)</span>
        </div>

        <h1 class="mh-admin-hero-title">
          ระบบบริหารจัดการ<br>
          <span class="title-highlight">และประเมินสุขภาพใจองค์กร</span>
        </h1>

        <p class="mh-admin-hero-desc">
          ศูนย์รวมข้อมูลสถิติสุขภาพจิตบุคลากร การเฝ้าระวังกลุ่มเสี่ยง การวิเคราะห์แนวโน้มองค์กร 
          และเครื่องมือกำหนดสิทธิ์เข้าถึงข้อมูลตามมาตรฐานความปลอดภัยขั้นสูง (PDPA)
        </p>

        <!-- CTA Action -->
        <div class="mh-admin-actions">
          <button type="button" class="btn-admin-login-cta" @click="$emit('start-login')">
            <span>เข้าสู่ระบบผู้ดูแลระบบ</span>
            <span class="arrow-icon">→</span>
          </button>
        </div>

        <!-- Security & PDPA Guarantee -->
        <div class="mh-admin-security-note">
          🔒 <strong>ระบบความปลอดภัยขั้นสูง:</strong> การเข้ารหัส PII ด้วย AES-256-GCM • ระบบระงับสถิติกลุ่มตัวอย่างขนาดเล็ก (&lt; 5 คน) • บันทึก Audit Log ทุกรายการ
        </div>
      </div>

      <!-- Feature Grid Showcase -->
      <div class="mh-admin-feature-grid">
        <div class="admin-feature-card">
          <div class="feature-icon-wrap icon-blue">📊</div>
          <h3>Dashboard สถิติองค์กร</h3>
          <p>วิเคราะห์ภาพรวม 3 มิติ (Burnout, Stress, 9Q) คัดกรองกลุ่มเสี่ยง และแสดงสถิติตามแผนก</p>
        </div>

        <div class="admin-feature-card">
          <div class="feature-icon-wrap icon-teal">📋</div>
          <h3>ตารางผลประเมินรายบุคคล</h3>
          <p>ตรวจสอบคะแนนและระดับความเสี่ยงรายพนักงาน พร้อมระบบ Masking ข้อมูลส่วนตัวตามกฎหมาย PDPA</p>
        </div>

        <div class="admin-feature-card">
          <div class="feature-icon-wrap icon-purple">🔐</div>
          <h3>กำหนดสิทธิ์ผู้ดูแล (Admin)</h3>
          <p>Super Admin สามารถมอบหมายสิทธิ์การดูข้อมูล และสิทธิ์การ Export รายงานให้แก่ Admin แต่ละคนได้</p>
        </div>

        <div class="admin-feature-card">
          <div class="feature-icon-wrap icon-amber">📥</div>
          <h3>ส่งออกรายงาน (Export)</h3>
          <p>ดาวน์โหลดรายงานเชิงสถิติในรูปแบบ Excel (.xlsx) และ CSV พร้อมประทับตรายืนยันความปลอดภัย</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminPortalLanding',
  computed: {
    employeePortalUrl() {
      return import.meta.env.VITE_EMPLOYEE_URL || 'http://localhost:3000';
    }
  }
};
</script>

<style scoped>
.mh-admin-portal-page {
  font-family: var(--app-font-family, inherit);
  color: #1e293b;
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%);
}

/* Top Navigation Bar */
.mh-admin-nav {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.85rem 1.5rem;
}
.mh-admin-nav-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mh-admin-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.mh-admin-logo-img {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}
.mh-admin-titles {
  display: flex;
  flex-direction: column;
}
.mh-admin-title-th {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1b3574;
  white-space: nowrap;
}
.mh-admin-title-en {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.05em;
  white-space: nowrap;
}
.mh-btn-nav-employee {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  text-decoration: none;
  transition: all 0.15s ease;
}
.mh-btn-nav-employee:hover {
  background: #dbeafe;
  color: #1d4ed8;
}

@media (max-width: 640px) {
  .mh-admin-nav {
    padding: 0.65rem 1rem;
  }
  .mh-admin-nav-content {
    flex-direction: column;
    align-items: stretch;
    gap: 0.65rem;
  }
  .mh-admin-brand {
    justify-content: flex-start;
  }
  .mh-admin-logo-img {
    width: 36px;
    height: 36px;
  }
  .mh-admin-title-th {
    font-size: 1rem;
    white-space: nowrap;
  }
  .mh-btn-nav-employee {
    justify-content: center;
    width: 100%;
    padding: 0.45rem 0.5rem;
    font-size: 0.78rem;
    white-space: nowrap;
    text-align: center;
  }
}

/* Hero Container */
.mh-admin-hero-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3.5rem 1.5rem;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: center;
  gap: 3rem;
}

@media (max-width: 960px) {
  .mh-admin-hero-container {
    grid-template-columns: 1fr;
    padding: 2rem 1.25rem;
    gap: 2.5rem;
  }
}

.mh-admin-hero-content {
  max-width: 580px;
}

.mh-admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #eff6ff;
  color: #1e3a8a;
  border: 1px solid #bfdbfe;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
}

.mh-admin-hero-title {
  font-size: 2.5rem;
  line-height: 1.2;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 1.25rem 0;
  letter-spacing: -0.02em;
}
.title-highlight {
  color: #1b3574;
}

@media (max-width: 640px) {
  .mh-admin-hero-title {
    font-size: 2rem;
  }
}

.mh-admin-hero-desc {
  font-size: 1.05rem;
  line-height: 1.6;
  color: #475569;
  margin: 0 0 2rem 0;
}

.mh-admin-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn-admin-login-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  background: linear-gradient(135deg, #0d1e4c 0%, #1b3574 100%);
  color: #ffffff;
  font-size: 1.05rem;
  font-weight: 600;
  padding: 1rem 2rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 20px -3px rgba(13, 30, 76, 0.4);
  transition: all 0.2s ease;
}
.btn-admin-login-cta:hover {
  background: linear-gradient(135deg, #091536 0%, #132756 100%);
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -3px rgba(13, 30, 76, 0.5);
}
.arrow-icon {
  font-size: 1.25rem;
  transition: transform 0.2s ease;
}
.btn-admin-login-cta:hover .arrow-icon {
  transform: translateX(4px);
}

.mh-admin-security-note {
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.5;
}

/* Feature Grid */
.mh-admin-feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

@media (max-width: 600px) {
  .mh-admin-actions {
    flex-direction: column;
  }
  .btn-admin-login-cta {
    width: 100%;
  }
  .mh-admin-feature-grid {
    grid-template-columns: 1fr;
  }
}

.admin-feature-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
}
.admin-feature-card:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}
.feature-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  margin-bottom: 1rem;
}
.icon-blue {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}
.icon-teal {
  background: #f0fdfa;
  border: 1px solid #99f6e4;
}
.icon-purple {
  background: #faf5ff;
  border: 1px solid #e9d5ff;
}
.icon-amber {
  background: #fffbeb;
  border: 1px solid #fde68a;
}
.admin-feature-card h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.45rem 0;
}
.admin-feature-card p {
  font-size: 0.85rem;
  line-height: 1.5;
  color: #64748b;
  margin: 0;
}
</style>
