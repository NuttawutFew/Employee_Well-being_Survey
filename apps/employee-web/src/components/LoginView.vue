<template>
  <div class="mh-login-app">
    <!-- Top Deep Blue Curved Header -->
    <div class="mh-login-header">
      <div class="mh-login-nav">
        <button type="button" class="mh-btn-back-portal" @click="$emit('back-to-portal')">
          <span>←</span> <span>กลับหน้าหลัก Portal พนักงาน</span>
        </button>
        <button type="button" class="mh-btn-login-contact-hr" @click="$emit('open-contact-hr')" title="เบอร์ติดต่อ HR กรณีฉุกเฉิน">
          <span>📞</span> <span>ติดต่อฝ่ายบุคคล (HR)</span>
        </button>
      </div>
      <div class="mh-login-header-content">
        <h2>Employee Well-being Survey สำหรับบุคลากร</h2>
        <div class="mh-login-scope-pill">
          <span>👤</span>
          <span>บัญชีพนักงานองค์กร</span>
        </div>
      </div>
    </div>

    <!-- Floating White Login Card (Overlaps Blue Header) -->
    <div class="mh-login-card-wrap">
      <div class="mh-login-card">
        <div class="mh-login-card-header">
          <h3>เข้าสู่ระบบ (พนักงาน)</h3>
          <p>เข้าสู่ระบบเพื่อยืนยันตัวตนก่อนเข้าสู่หน้าคำชี้แจงและเริ่มทำแบบประเมิน</p>
        </div>

        <!-- Error Alert Banner -->
        <div v-if="error" class="mh-error-banner" role="alert">
          <span>⚠️ {{ error }}</span>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="mh-form-group">
            <label for="username">Email / บัญชีพนักงาน</label>
            <input
              id="username"
              v-model.trim="username"
              type="text"
              placeholder="example@email.com"
              required
              :disabled="loading"
            />
          </div>

          <div class="mh-form-group">
            <label for="password">รหัสผ่าน</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              :disabled="loading"
            />
          </div>

          <div class="mh-forgot-pwd">
            <a href="javascript:void(0)" @click="alertForgot">ลืมรหัสผ่าน ?</a>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="mh-btn-login-submit" :disabled="loading">
            <span v-if="loading">⟳ กำลังตรวจสอบสิทธิ์...</span>
            <span v-else>เข้าสู่ระบบเพื่อทำแบบประเมิน →</span>
          </button>

          <!-- Register Link -->
          <div class="mh-login-footer">
            <span>ยังไม่มีบัญชี ?</span>
            <a href="javascript:void(0)" @click="alertRegister">ติดต่อฝ่ายทรัพยากรบุคคล (HR)</a>
          </div>

          <!-- Quick Persona Selector Helper (Visible only when Mock is enabled) -->
          <div v-if="isMockEnabled" class="mh-login-persona-helper">
            <span class="helper-title">⚡ บัญชีทดสอบสำหรับพนักงาน (Persona Mock Users):</span>
            <div class="helper-buttons">
              <button 
                type="button" 
                class="btn-persona" 
                :class="{ active: selectedEmployeeId === 'EMP-DEV-001' }"
                @click="selectPersona('EMP-DEV-001')"
                title="พนักงานที่ยังไม่ได้ทำแบบประเมิน - เข้าสู่หน้าคำชี้แจงเพื่อเริ่มทำ"
              >
                <span>👤 คุณณิชา วัฒนกิจ (EMP-DEV-001)</span>
                <span class="persona-tag tag-new">ยังไม่ได้ทำ</span>
              </button>
              <button 
                type="button" 
                class="btn-persona" 
                :class="{ active: selectedEmployeeId === 'EMP-00108' }"
                @click="selectPersona('EMP-00108')"
                title="พนักงานที่ทำแบบประเมินเสร็จแล้ว - เข้าหน้าสรุปผลทันที (สถานะ: ปกติ)"
              >
                <span>🟢 คุณปิยะนุช สดใส (EMP-00108)</span>
                <span class="persona-tag tag-done">ทำแล้ว • ผลปกติ</span>
              </button>
            </div>
          </div>
        </form>

        <div v-if="successMessage" class="mh-login-feedback">
          {{ successMessage }}
        </div>
      </div>

      <p class="mh-login-bottom-audit">
        🔒 ระบบบันทึก Log การ Login ของพนักงาน (employee_login) ตามข้อกำหนด PDPA
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginView',
  emits: ['login-success', 'back-to-portal', 'open-contact-hr'],
  data() {
    const isMock = import.meta.env.VITE_ENABLE_MOCK !== 'false' && import.meta.env.VITE_ENABLE_MOCK !== false;
    return {
      selectedEmployeeId: isMock ? 'EMP-DEV-001' : '',
      username: isMock ? 'nichaw@inet.co.th' : '',
      password: isMock ? 'Employee@1234!' : '',
      loading: false,
      error: null,
      successMessage: null
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
    }
  },
  methods: {
    selectPersona(id) {
      this.error = null;
      this.successMessage = null;
      this.selectedEmployeeId = id;
      if (id === 'EMP-00108') {
        this.username = 'piyanuch@inet.co.th';
        this.password = 'Employee@1234!';
      } else {
        this.selectedEmployeeId = 'EMP-DEV-001';
        this.username = 'nichaw@inet.co.th';
        this.password = 'Employee@1234!';
      }
    },
    async handleSubmit() {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      try {
        const targetEmpId = this.selectedEmployeeId || 'EMP-DEV-001';
        const res = await fetch('/api/assessment/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: targetEmpId,
            username: this.username,
            password: this.password
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'เข้าสู่ระบบพนักงานไม่สำเร็จ');
        }

        const data = await res.json();
        const empToken = data.token || data.employee?.employeeId || targetEmpId;
        localStorage.setItem('emp_token', empToken);
        
        if (empToken === 'EMP-00108') {
          this.successMessage = '🔒 เข้าสู่ระบบสำเร็จ (คุณปิยะนุช สดใส) กำลังนำสู่หน้าสรุปผลประเมิน...';
        } else {
          this.successMessage = '🔒 เข้าสู่ระบบพนักงานสำเร็จ กำลังเข้าสู่หน้าคำชี้แจง...';
        }

        setTimeout(() => {
          this.$emit('login-success', {
            mode: 'employee',
            employee: data.employee || {
              employeeId: empToken,
              fullName: empToken === 'EMP-00108' ? 'คุณปิยะนุช สดใส' : 'คุณณิชา วัฒนกิจ'
            }
          });
        }, 400);
      } catch (err) {
        this.error = err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
      } finally {
        this.loading = false;
      }
    },
    alertForgot() {
      alert('ระบบ ONE ID: กรุณาติดต่อ One Platform Support หรือส่งอีเมลไปยัง support@one.th เพื่อรีเซ็ตรหัสผ่าน');
    },
    alertRegister() {
      alert('ระบบ ONE ID: สำหรับองค์กรที่ต้องการลงทะเบียนใช้งาน กรุณาติดต่อฝ่ายขาย บมจ. อินเทอร์เน็ตประเทศไทย (INET)');
    }
  }
};
</script>

<style scoped>
.mh-login-app {
  font-family: var(--app-font-family, inherit);
  color: #1e293b;
  min-height: 100vh;
  background: #f1f5f9;
}

/* Deep Blue Header */
.mh-login-header {
  background: linear-gradient(135deg, #0d1e4c 0%, #1b3574 100%);
  padding: 1.5rem 1.5rem 5rem 1.5rem;
  border-bottom-left-radius: 40px;
  border-bottom-right-radius: 40px;
  box-shadow: 0 10px 25px rgba(13, 30, 76, 0.25);
}
.mh-login-nav {
  max-width: 520px;
  margin: 0 auto 1.25rem auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}
.mh-btn-back-portal {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.15s ease;
}
.mh-btn-back-portal:hover {
  background: rgba(255, 255, 255, 0.25);
}
.mh-btn-login-contact-hr {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.15s ease;
}
.mh-btn-login-contact-hr:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.45);
}
.mh-login-header-content {
  max-width: 520px;
  margin: 0 auto;
  text-align: center;
  color: #ffffff;
}
.mh-login-header-content h2 {
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0 0 0.6rem 0;
}
.mh-login-scope-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.3rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 500;
}

/* Floating White Login Card */
.mh-login-card-wrap {
  max-width: 520px;
  margin: -3.5rem auto 3rem auto;
  padding: 0 1rem;
}
.mh-login-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 2rem 2.25rem;
  box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

/* Mode Switcher Tabs */
.mh-login-mode-switcher {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  background: #f1f5f9;
  padding: 0.35rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}
.mh-mode-btn {
  background: transparent;
  border: none;
  padding: 0.65rem 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}
.mh-mode-btn.is-active {
  background: #ffffff;
  color: #1b3574;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.mh-login-card-header {
  margin-bottom: 1.5rem;
  text-align: center;
}
.mh-login-card-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.35rem 0;
}
.mh-login-card-header p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.mh-error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

/* Form Styles */
.mh-form-group {
  margin-bottom: 1.15rem;
}
.mh-form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.4rem;
}
.mh-form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.95rem;
  color: #0f172a;
  box-sizing: border-box;
  transition: border-color 0.15s ease;
}
.mh-form-group input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.mh-forgot-pwd {
  text-align: right;
  margin-bottom: 1.25rem;
}
.mh-forgot-pwd a {
  font-size: 0.82rem;
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}
.mh-forgot-pwd a:hover {
  text-decoration: underline;
}

/* Turnstile Box */
.mh-turnstile-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.65rem 1rem;
  margin-bottom: 1.25rem;
  cursor: pointer;
  user-select: none;
}
.mh-turnstile-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}
.mh-turnstile-check {
  width: 22px;
  height: 22px;
  border: 2px solid #94a3b8;
  border-radius: 4px;
  display: grid;
  place-items: center;
  font-weight: bold;
  font-size: 0.85rem;
  color: #ffffff;
}
.mh-turnstile-check.is-passed {
  background: #10b981;
  border-color: #10b981;
}
.mh-turnstile-status {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}
.mh-turnstile-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.mh-turnstile-brand {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  font-weight: 800;
  color: #f97316;
}
.mh-cf-cloud {
  width: 14px;
  height: 14px;
}
.mh-turnstile-links {
  font-size: 0.65rem;
  color: #94a3b8;
}

/* Submit Button */
.mh-btn-login-submit {
  width: 100%;
  background: #1b3574;
  color: #ffffff;
  border: none;
  padding: 0.85rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 4px 12px rgba(27, 53, 116, 0.25);
}
.mh-btn-login-submit:hover:not(:disabled) {
  background: #132756;
}
.mh-btn-login-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Login Footer */
.mh-login-footer {
  text-align: center;
  margin-top: 1.25rem;
  font-size: 0.82rem;
  color: #64748b;
}
.mh-login-footer a {
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
  margin-left: 0.35rem;
}
.mh-login-footer a:hover {
  text-decoration: underline;
}

/* Helper Persona Switcher */
.mh-login-persona-helper {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px dashed #e2e8f0;
}
.helper-title {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.6rem;
}
.helper-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.btn-persona {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 0.8rem;
  padding: 0.55rem 0.85rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}
.btn-persona:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}
.btn-persona.active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
  font-weight: 600;
  box-shadow: 0 0 0 1.5px #3b82f6;
}
.persona-tag {
  display: inline-block;
  font-size: 0.72rem;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-weight: 600;
}
.tag-new {
  background: #e2e8f0;
  color: #475569;
}
.tag-done {
  background: #dcfce7;
  color: #166534;
}

.mh-login-feedback {
  margin-top: 1rem;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  text-align: center;
  font-weight: 500;
}

.mh-login-bottom-audit {
  text-align: center;
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 1.25rem;
  line-height: 1.4;
}

@media (max-width: 480px) {
  .mh-login-header {
    padding: 1.25rem 1rem 3.5rem 1rem;
    border-bottom-left-radius: 24px;
    border-bottom-right-radius: 24px;
  }
  .mh-login-header-content h2 {
    font-size: 1.35rem;
  }
  .mh-login-card-wrap {
    margin-top: -2.5rem;
    padding: 0 0.75rem;
  }
  .mh-login-card {
    padding: 1.5rem 1.25rem;
    border-radius: 16px;
  }
  .btn-persona {
    width: 100%;
    text-align: center;
  }
}
</style>
