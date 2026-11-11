<template>
  <div class="portal-container">
    <div class="portal-hero">
      <div class="role-badge">
        <span class="shield-icon">👑</span>
        <span>Super Admin Portal</span>
      </div>
      <h1 class="portal-title">Portal Employee Well-being Survey</h1>
      <p class="portal-subtitle">
        ยินดีต้อนรับ <strong>{{ adminName }}</strong> สู่ศูนย์กลางการบริหารจัดการระบบ Employee Well-being Survey องค์กร (Super Admin สามารถดำเนินการได้ทุกส่วนของระบบ)
      </p>
    </div>

    <!-- Navigation Choices: Dashboard vs กำหนดสิทธิการเข้าถึงของ Admin vs Audit Logs -->
    <div class="portal-grid">
      <!-- Card 1: Dashboard ตรวจสอบสุขภาพใจ (Step 9) -->
      <div class="portal-card card-dashboard" @click="$emit('select-view', 'dashboard')">
        <div class="card-icon-wrap">
          <span class="card-icon">📊</span>
        </div>
        <div class="card-body">
          <div class="card-tag">ระบบสถิติและรายงาน</div>
          <h2>Dashboard Employee Well-being Survey</h2>
          <p>
            วิเคราะห์แนวโน้มสุขภาพจิตของบุคลากรทั้งองค์กร, ตัวชี้วัด 3 มิติ (Burnout, เครียด ST-20, ซึมเศร้า 9Q), กรองข้อมูลเชิงลึก (Filter) และส่งออกรายงาน (Export Excel / CSV)
          </p>
          <ul class="feature-bullets">
            <li>✓ ตรวจสอบสถิติภาพรวมและกลุ่มเสี่ยง</li>
            <li>✓ กรองข้อมูลหลายมิติ (องค์กร/ประชากร/คะแนน)</li>
            <li>✓ ส่งออกเอกสารรายงาน (Excel &amp; CSV)</li>
            <li>✓ ระบบบันทึก Log ทุกการกระทำของผู้ใช้</li>
          </ul>
        </div>
        <div class="card-footer">
          <button class="btn-enter-card">เข้าสู่ Dashboard →</button>
        </div>
      </div>

      <!-- Card 2: กำหนดสิทธิการเข้าถึงของ Admin (Step 10) -->
      <div class="portal-card card-permissions" @click="$emit('select-view', 'permissions')">
        <div class="card-icon-wrap purple">
          <span class="card-icon">🔐</span>
        </div>
        <div class="card-body">
          <div class="card-tag">การบริหารจัดการสิทธิ์</div>
          <h2>กำหนดสิทธิการเข้าถึงของ Admin</h2>
          <p>
            จัดการบัญชีผู้ดูแลระบบ (Admin Management), กำหนดบทบาทและสิทธิการเข้าใช้งานรายบุคคล เช่น สิทธิ์การส่งออกเอกสารรายงาน (Export Permission)
          </p>
          <ul class="feature-bullets">
            <li>✓ แสดงรายการผู้ดูแลระบบ (Admin) ทั้งหมด</li>
            <li>✓ เพิ่ม / แก้ไข บัญชีและสิทธิ Admin</li>
            <li>✓ กำหนดสิทธิการเข้าใช้ (สิทธิการกด Export เอกสาร)</li>
            <li>✓ ส่งออกรายชื่อผู้ดูแลและสิทธิ์ (Export เอกสาร)</li>
            <li>✓ ระบบบันทึก Log การเพิ่ม/แก้ไขสิทธิ์ทุกครั้ง</li>
          </ul>
        </div>
        <div class="card-footer">
          <button class="btn-enter-card btn-secondary">จัดการสิทธิ Admin →</button>
        </div>
      </div>

      <!-- Card 3: ตรวจสอบประวัติการใช้งาน (Audit Logs) -->
      <div class="portal-card card-audit-logs" @click="$emit('select-view', 'audit-logs')">
        <div class="card-icon-wrap green">
          <span class="card-icon">📜</span>
        </div>
        <div class="card-body">
          <div class="card-tag tag-green">ความปลอดภัยและการตรวจสอบ</div>
          <h2>ประวัติการใช้งาน (Audit Logs)</h2>
          <p>
            ตรวจสอบบันทึกกิจกรรมและประวัติการทำงานของผู้ดูแลระบบทั้งหมด (Admin &amp; Super Admin Audit Trail) เช่น การเข้าดูข้อมูลที่ละเอียดอ่อน, การ Export รายงาน, การแก้ไขสิทธิ์
          </p>
          <ul class="feature-bullets">
            <li>✓ บันทึก Real-time ทุกการกระทำของผู้ดูแลระบบ</li>
            <li>✓ บันทึก Actor, IP Address, Timestamp, Purpose</li>
            <li>✓ ตรวจสอบการเข้าถึงข้อมูลอ่อนไหวตาม PDPA &amp; ISO 27001</li>
            <li>✓ ส่งออกรายงาน Audit Trail ย้อนหลัง (Excel / CSV)</li>
          </ul>
        </div>
        <div class="card-footer">
          <button class="btn-enter-card btn-green">เข้าสู่ Audit Logs →</button>
        </div>
      </div>
    </div>

    <!-- Quick Switch to Individual Results Table -->
    <div class="portal-shortcut-row">
      <div class="shortcut-info">
        <span class="shortcut-icon">📋</span>
        <div>
          <strong>ตารางผลการประเมินรายบุคคล (Individual Results Table)</strong>
          <p>ตรวจสอบผลการประเมินสุขภาพใจรายบุคคล พร้อมระบบยืนยันวัตถุประสงค์ PDPA และ Unmasked View สำหรับ HR</p>
        </div>
      </div>
      <button class="btn-shortcut" @click="$emit('select-view', 'results')">
        เปิดตารางรายบุคคล →
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminPortal',
  props: {
    admin: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    adminName() {
      return this.admin?.fullName || this.admin?.username || 'Super Admin';
    }
  }
};
</script>

<style scoped>
.portal-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  font-family: 'IBM Plex Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.portal-hero {
  text-align: center;
  margin-bottom: 2.5rem;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
  padding: 5px 14px;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.portal-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.75rem 0;
  letter-spacing: -0.02em;
}

.portal-subtitle {
  font-size: 1.05rem;
  color: #64748b;
  max-width: 680px;
  margin: 0 auto;
  line-height: 1.6;
}

.portal-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

@media (max-width: 1024px) {
  .portal-grid {
    grid-template-columns: 1fr;
  }
}

.portal-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.85rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.portal-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.08), 0 4px 8px -4px rgba(0, 0, 0, 0.04);
}

.card-dashboard:hover {
  border-color: #0284c7;
}

.card-dashboard:hover .btn-enter-card {
  background: #0369a1;
}

.card-permissions:hover {
  border-color: #7c3aed;
}

.card-permissions:hover .btn-secondary {
  background: #5b21b6;
}

.card-audit-logs:hover {
  border-color: #059669;
}

.card-audit-logs:hover .btn-green {
  background: #047857;
}

.card-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.card-dashboard .card-icon-wrap {
  background: #eff6ff;
}

.card-permissions .card-icon-wrap,
.card-icon-wrap.purple {
  background: #f5f3ff;
}

.card-audit-logs .card-icon-wrap,
.card-icon-wrap.green {
  background: #ecfdf5;
}

.card-icon {
  font-size: 1.5rem;
}

.card-tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.02em;
  margin-bottom: 0.5rem;
}

.card-tag.tag-green {
  color: #059669;
}

.card-body h2 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
  margin: 0 0 0.75rem 0;
}

.card-body p {
  color: #475569;
  font-size: 0.88rem;
  line-height: 1.6;
  margin: 0 0 1.25rem 0;
}

.feature-bullets {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
}

.feature-bullets li {
  font-size: 0.85rem;
  color: #334155;
  margin-bottom: 0.4rem;
  line-height: 1.45;
}

.card-footer {
  margin-top: auto;
  padding-top: 0.5rem;
}

.btn-enter-card {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #0284c7;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  font-family: inherit;
}

.btn-enter-card:hover {
  background: #0369a1;
}

.btn-secondary {
  background: #6d28d9;
}

.btn-secondary:hover {
  background: #5b21b6;
}

.btn-green {
  background: #059669;
}

.btn-green:hover {
  background: #047857;
}

.portal-shortcut-row {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 1.25rem 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.shortcut-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.shortcut-icon {
  font-size: 1.8rem;
}

.shortcut-info strong {
  display: block;
  font-size: 1rem;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.shortcut-info p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.btn-shortcut {
  padding: 0.6rem 1.2rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #1e293b;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-shortcut:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}
</style>
