<template>
  <div class="mh-portal-page">
    <!-- Top Navigation Bar matching ตัวอย่างหน้า-portal.png -->
    <header class="mh-portal-nav">
      <div class="mh-portal-nav-content">
        <div class="mh-portal-brand">
          <div class="mh-nav-logo">
            <img :src="inetLogo" alt="INET Logo" class="mh-brand-logo-img" />
          </div>
          <div class="mh-nav-titles">
            <span class="mh-nav-title-th">Employee Well-being Survey</span>
          </div>
        </div>
        <div class="mh-portal-nav-actions">
          <button type="button" class="mh-btn-nav-contact-hr" @click="$emit('open-contact-hr')" title="เบอร์ติดต่อ HR กรณีฉุกเฉิน">
            <span>📞</span>
            <span>ติดต่อฝ่ายบุคคล (HR)</span>
          </button>
          <a href="http://localhost:3001" class="mh-btn-nav-admin" title="ไปยังหน้าสำหรับผู้ดูแลระบบ">
            <span>🛡️</span>
            <span>สำหรับผู้ดูแลระบบ (Admin Portal) ↗</span>
          </a>
        </div>
      </div>
    </header>

    <!-- Channel Simulation Bar (Visible only when Mock is enabled) -->
    <div v-if="isMockEnabled" class="mh-entry-banner">
      <div class="mh-entry-banner-text">
        <strong>🌐 ทางเข้าพนักงาน (Employee Portal)</strong> — กำลังแสดงหน้าหลักสำหรับพนักงาน เพื่อเข้าสู่ระบบทำแบบประเมิน (เข้าสู่ระบบ ➔ หน้าคำชี้แจง ➔ ทำแบบประเมิน)
      </div>
      <button type="button" class="mh-entry-banner-btn" @click="$emit('switch-channel', 'oneplatform')">
        <span>📱</span> สลับจำลองเข้าผ่าน OnePlatform (SSO ตรงสู่คำชี้แจง) →
      </button>
    </div>

    <!-- Hero Grid (2 Columns) -->
    <div class="mh-portal-hero-grid">
      <!-- Left: Headline & CTAs -->
      <div class="mh-hero-text-col">
        <h1 class="mh-hero-main-title">
          Employee Well-being Survey<br>
          <span style="color:#1e293b;">สำหรับบุคลากรในองค์กร</span>
        </h1>

        <p class="mh-hero-desc">
          แบบประเมินสั้น ๆ เพื่อสำรวจพลังใจ ความเครียด และสัญญาณเสี่ยงด้านสุขภาพจิต รู้ผลทันทีพร้อมคำแนะนำเบื้องต้นที่เหมาะกับคุณ
        </p>

        <!-- Action Button (ทำแบบประเมิน สำหรับพนักงาน) -->
        <div class="mh-hero-actions-stack">
          <button type="button" class="mh-btn-hero-primary" @click="$emit('start-login', 'employee')">
            <span>เข้าสู่ระบบเพื่อทำแบบประเมิน</span>
            <span style="font-size:1.2em;">→</span>
          </button>
        </div>

        <!-- Assessment Scope Summary (3 เครื่องมือ รวม 51 ข้อ) -->
        <div class="mh-scope-summary-card">
          <div class="mh-scope-header">
            <span>📋 ขอบเขตแบบประเมินสุขภาวะ (3 ชุดมาตรฐาน รวม 51 ข้อ)</span>
            <span class="mh-scope-time">⏱️ ใช้เวลาประมาณ 8–10 นาที</span>
          </div>
          <div class="mh-scope-badges-row">
            <span class="mh-scope-badge"><span class="badge-dot dot-burnout"></span> 1. ภาวะหมดไฟ (Burnout 22 ข้อ)</span>
            <span class="mh-scope-badge"><span class="badge-dot dot-stress"></span> 2. ความเครียด (20 ข้อ)</span>
            <span class="mh-scope-badge"><span class="badge-dot dot-9q"></span> 3. สภาวะทางอารมณ์ (9 ข้อ)</span>
          </div>
          <div class="mh-scope-footer-note">
            <span>🔒 ผลการประเมินเป็นความลับเฉพาะบุคคลตามมาตรฐาน PDPA • ไม่เปิดเผยผลรายบุคคลต่อผู้อื่น</span>
          </div>
        </div>
      </div>

      <!-- Right: Circular Graphic Artwork matching image -->
      <div class="mh-hero-emblem-wrap">
        <div class="mh-emblem-track">
          <div class="mh-emblem-card-circle">
            <!-- Orbit Circle with 6 icons -->
            <div class="mh-orbit-icons-circle">
              <div class="mh-satellite-icon sat-top" title="อารมณ์สดใส">😊</div>
              <div class="mh-satellite-icon sat-top-right" title="การนอนหลับ">🛏️</div>
              <div class="mh-satellite-icon sat-bot-right" title="ออกกำลังกาย">🏋️</div>
              <div class="mh-satellite-icon sat-bot-left" title="สมาธิและความสงบ">🧘</div>
              <div class="mh-satellite-icon sat-top-left" title="โภชนาการ">🍎</div>
              <div class="mh-satellite-icon sat-top-left-sub" title="สุขภาพกายและใจ">➕</div>

              <!-- Center Profile Head Location Pin -->
              <div class="mh-orbit-pin-badge">
                <svg viewBox="0 0 100 100" style="width:48px;height:48px;fill:#fff;">
                  <path d="M50 15 C33 15 20 28 20 45 C20 65 50 88 50 88 C50 88 80 65 80 45 C80 28 67 15 50 15 Z" fill="#ffffff" opacity="0.95"/>
                  <path d="M50 28 C42 28 36 34 36 42 C36 53 50 66 50 66 C50 66 64 53 64 42 C64 34 58 28 50 28 Z" fill="#f97316"/>
                  <circle cx="50" cy="40" r="5" fill="#ffffff"/>
                </svg>
              </div>
            </div>

            <!-- Text Block -->
            <div class="mh-emblem-text-block">
              <span class="mh-emblem-title">EMPLOYEE WELL-BEING</span>
              <span class="mh-emblem-sub">SURVEY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import inetLogo from '../assets/logo.jpeg';

export default {
  name: 'EmployeePortal',
  emits: ['start-login', 'switch-channel', 'open-contact-hr'],
  data() {
    return {
      inetLogo
    };
  },
  computed: {
    isMockEnabled() {
      return import.meta.env.VITE_ENABLE_MOCK !== 'false' && import.meta.env.VITE_ENABLE_MOCK !== false;
    }
  }
};
</script>

<style scoped>
.mh-portal-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Prompt', sans-serif;
  color: #1e293b;
  min-height: 100vh;
  background: #f8fafc;
}

/* Top Navigation Bar */
.mh-portal-nav {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.85rem 1.5rem;
}
.mh-portal-nav-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mh-portal-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.mh-brand-logo-img {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}
.mh-nav-titles {
  display: flex;
  flex-direction: column;
}
.mh-nav-title-th {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1b3574;
}
.mh-nav-title-en {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.05em;
}
.mh-portal-nav-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.mh-btn-nav-contact-hr {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0284c7;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  padding: 0.5rem 0.95rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.mh-btn-nav-contact-hr:hover {
  background: #e0f2fe;
  color: #0369a1;
  border-color: #7dd3fc;
}
.mh-btn-nav-admin {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1b3574;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.mh-btn-nav-admin:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* Channel Banner */
.mh-entry-banner {
  background: #eff6ff;
  border-bottom: 1px solid #bfdbfe;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.mh-entry-banner-text {
  font-size: 0.88rem;
  color: #1e3a8a;
}
.mh-entry-banner-btn {
  background: #2563eb;
  color: #ffffff;
  border: none;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: background 0.15s ease;
}
.mh-entry-banner-btn:hover {
  background: #1d4ed8;
}

/* Hero Grid */
.mh-portal-hero-grid {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3.5rem 1.5rem;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: center;
  gap: 3rem;
}
@media (max-width: 900px) {
  .mh-portal-hero-grid {
    grid-template-columns: 1fr;
    padding: 2rem 1.25rem;
    gap: 2rem;
  }
}

/* Hero Text Column */
.mh-hero-text-col {
  max-width: 540px;
}
.mh-hero-dept-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
  padding: 0.35rem 0.8rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
}
.mh-hero-main-title {
  font-size: 2.5rem;
  line-height: 1.2;
  font-weight: 800;
  color: #1b3574;
  margin: 0 0 1.25rem 0;
  letter-spacing: -0.02em;
}
@media (max-width: 600px) {
  .mh-hero-main-title {
    font-size: 2rem;
  }
}
.mh-hero-desc {
  font-size: 1.05rem;
  line-height: 1.6;
  color: #475569;
  margin: 0 0 2rem 0;
}

/* Hero Actions Stack */
.mh-hero-actions-stack {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-width: 340px;
  margin-bottom: 1.5rem;
}
.mh-btn-hero-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #1b3574;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.95rem 1.75rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 18px -3px rgba(27, 53, 116, 0.35);
  transition: all 0.2s ease;
}
.mh-btn-hero-primary:hover {
  background: #132756;
  transform: translateY(-1px);
  box-shadow: 0 10px 22px -3px rgba(27, 53, 116, 0.45);
}
.mh-btn-hero-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #ffffff;
  color: #1b3574;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  border: 1.5px solid #cbd5e1;
  cursor: pointer;
  transition: all 0.15s ease;
}
.mh-btn-hero-secondary:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.mh-btn-hero-contact-hr {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #f0f9ff;
  color: #0369a1;
  font-size: 0.92rem;
  font-weight: 600;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: 1.5px solid #bae6fd;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mh-btn-hero-contact-hr:hover {
  background: #e0f2fe;
  color: #0284c7;
  border-color: #7dd3fc;
  transform: translateY(-1px);
}

.mh-scope-summary-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.9rem 1.15rem;
  margin-top: 0.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  text-align: left;
  width: 100%;
}
.mh-scope-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 6px;
}
.mh-scope-time {
  font-size: 0.76rem;
  color: #0284c7;
  background: #f0f9ff;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #bae6fd;
  font-weight: 600;
}
.mh-scope-badges-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.mh-scope-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.76rem;
  color: #334155;
  font-weight: 600;
}
.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}
.dot-burnout { background: #f97316; }
.dot-stress { background: #eab308; }
.dot-9q { background: #10b981; }
.mh-scope-footer-note {
  font-size: 0.74rem;
  color: #64748b;
  border-top: 1px dashed #e2e8f0;
  padding-top: 0.4rem;
  margin-top: 0.2rem;
}

.mh-assessment-scope-note {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.5;
}

/* Emblem Graphic Artwork */
.mh-hero-emblem-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
}
.mh-emblem-track {
  width: 360px;
  height: 360px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
@media (max-width: 450px) {
  .mh-emblem-track {
    width: 290px;
    height: 290px;
  }
}
.mh-emblem-card-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #f0fdf4 0%, #e0f2fe 50%, #dbeafe 100%);
  border: 2px dashed #93c5fd;
  box-shadow: 0 20px 40px -10px rgba(59, 130, 246, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}
.mh-orbit-icons-circle {
  position: absolute;
  inset: 0;
}
.mh-satellite-icon {
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  display: grid;
  place-items: center;
  font-size: 1.4rem;
  transition: transform 0.2s ease;
  user-select: none;
}
.mh-satellite-icon:hover {
  transform: scale(1.15);
}

/* Position satellite icons around orbit circle */
.sat-top { top: -14px; left: 50%; transform: translateX(-50%); }
.sat-top-right { top: 22%; right: -8px; }
.sat-bot-right { bottom: 18%; right: -4px; }
.sat-bot-left { bottom: 6%; left: 16%; }
.sat-top-left { top: 20%; left: -8px; }
.sat-top-left-sub { bottom: 22%; left: -6px; }

.mh-orbit-pin-badge {
  position: absolute;
  top: 42%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #1b3574;
  display: grid;
  place-items: center;
  box-shadow: 0 8px 20px rgba(27, 53, 116, 0.4);
}
.mh-emblem-text-block {
  margin-top: 5.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}
.mh-emblem-title {
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: #1b3574;
}
.mh-emblem-sub {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #10b981;
}
</style>
