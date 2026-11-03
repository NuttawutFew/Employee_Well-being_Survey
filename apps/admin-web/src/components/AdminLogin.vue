<template>
  <div class="mh-login-app">
    <!-- Top Deep Blue Curved Header matching ตัวอย่างหน้าlogin.png -->
    <div class="mh-login-header">
      <div class="mh-login-nav">
        <button type="button" class="mh-btn-back-portal" @click="goToPortal">
          <span>←</span> <span>กลับหน้าหลัก Portal</span>
        </button>
      </div>
      <div class="mh-login-header-content">
        <h2>ระบบประเมินสุขภาพใจสำหรับบุคลากร</h2>
        <div class="mh-login-scope-pill">
          <span>🛡️</span>
          <span>บัญชีผู้ดูแลระบบ</span>
        </div>
      </div>
    </div>

    <!-- Floating White Login Card -->
    <div class="mh-login-card-wrap">
      <div class="mh-login-card">
        <div class="mh-login-card-header">
          <h3>เข้าสู่ระบบ (ผู้ดูแลระบบ)</h3>
          <p>เข้าสู่ระบบเพื่อยืนยันสิทธิ์ Admin และเข้าถึงข้อมูลผลประเมินองค์กร</p>
        </div>

        <!-- Error Alert Banner -->
        <div v-if="error" class="mh-error-banner" :class="{ 'is-locked': isLocked }" role="alert">
          <span v-if="isLocked">🚫 บัญชีถูกระงับชั่วคราว: {{ error }}</span>
          <span v-else>⚠️ {{ error }}</span>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="mh-form-group">
            <label for="username">ชื่อผู้ใช้บัญชี OneID (Username)</label>
            <input
              id="username"
              v-model.trim="username"
              type="text"
              placeholder="เช่น admin@company หรือ superadmin"
              required
              :disabled="loading"
              autocomplete="username"
            />
          </div>

          <div class="mh-form-group">
            <label for="password">รหัสผ่าน OneID (Password)</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              :disabled="loading"
              autocomplete="current-password"
            />
          </div>

          <div class="mh-forgot-pwd">
            <a href="javascript:void(0)" @click="alertForgot">ลืมรหัสผ่าน ?</a>
          </div>

          <!-- Cloudflare Turnstile Box -->
          <div
            class="mh-turnstile-box"
            title="คลิกเพื่อสลับสถานะจำลอง CAPTCHA"
            @click="turnstilePassed = !turnstilePassed"
          >
            <div class="mh-turnstile-left">
              <div class="mh-turnstile-check" :class="{ 'is-passed': turnstilePassed }">
                {{ turnstilePassed ? '✓' : '' }}
              </div>
              <span class="mh-turnstile-status">{{ turnstilePassed ? 'สำเร็จ!' : 'ยืนยันตัวตน' }}</span>
            </div>
            <div class="mh-turnstile-right">
              <div class="mh-turnstile-brand">
                <svg class="mh-cf-cloud" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                </svg>
                <span>CLOUDFLARE</span>
              </div>
              <div class="mh-turnstile-links">
                <span>ความเป็นส่วนตัว</span> • <span>ช่วยเหลือ</span>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="mh-btn-login-submit" :disabled="loading || !canSubmit || !turnstilePassed">
            <span v-if="loading">⟳ กำลังตรวจสอบสิทธิ์...</span>
            <span v-else>เข้าสู่ระบบผู้ดูแลระบบ →</span>
          </button>

          <!-- Quick Persona Selector Helper -->
          <div class="mh-login-persona-helper">
            <span class="helper-title">⚡ เลือกบทบาทผู้ดูแลเพื่อทดสอบเข้าสู่ระบบ:</span>
            <div class="helper-buttons">
              <button type="button" class="btn-persona" @click="selectPersona('super_admin')">
                👑 Super Admin
              </button>
              <button type="button" class="btn-persona" @click="selectPersona('admin_export')">
                👤 Admin (มีสิทธิ์ Export)
              </button>
              <button type="button" class="btn-persona" @click="selectPersona('admin_no_export')">
                👤 Admin (ไม่มีสิทธิ์ Export)
              </button>
            </div>
          </div>
        </form>
      </div>

      <p class="mh-login-bottom-audit">
        🔒 การเข้าใช้งานสำหรับผู้ดูแลระบบผูกกับบัญชี OneID และ map สิทธิ์ Admin ในระบบ ทุก Event และการเข้าถึงข้อมูลจะถูกบันทึก Audit Log ไว้อย่างปลอดภัยเป็นเวลา 2 ปี
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminLogin',
  data() {
    return {
      username: 'admin',
      password: 'Admin@123456!',
      turnstilePassed: true,
      loading: false,
      error: null,
      isLocked: false
    };
  },
  computed: {
    canSubmit() {
      return this.username.length > 0 && this.password.length > 0;
    }
  },
  methods: {
    selectPersona(role) {
      this.error = null;
      this.isLocked = false;
      this.turnstilePassed = true;
      if (role === 'super_admin') {
        this.username = 'superadmin';
        this.password = 'SuperAdmin@123456!';
      } else if (role === 'admin_export') {
        this.username = 'admin';
        this.password = 'Admin@123456!';
      } else if (role === 'admin_no_export') {
        this.username = 'admin_view';
        this.password = 'Admin@123456!';
      }
    },
    goToPortal() {
      if (window.location.port === '3001') {
        window.location.href = 'http://' + window.location.hostname + ':3000';
      } else {
        window.location.href = '/';
      }
    },
    alertForgot() {
      alert('ระบบ ONE ID: กรุณาติดต่อทีม One Platform Support หรือส่งอีเมลไปยัง support@one.th เพื่อรีเซ็ตรหัสผ่าน');
    },
    async handleSubmit() {
      this.loading = true;
      this.error = null;
      this.isLocked = false;

      try {
        const res = await fetch('/api/admin/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: this.username,
            password: this.password
          })
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 423 || data.code === 'ACCOUNT_LOCKED') {
            this.isLocked = true;
          }
          throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
        }

        if (data.sessionToken) {
          localStorage.setItem('admin_token', data.sessionToken);
        }

        this.$emit('login-success', data.admin);
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    goToPortal() {
      this.$emit('back-to-portal');
    }
  }
};
</script>

<style scoped>
.mh-login-app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Prompt', sans-serif;
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
  padding: 2.25rem 2rem;
  box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
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
.mh-error-banner.is-locked {
  background: #fff1f2;
  border-color: #f43f5e;
  color: #9f1239;
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
  flex-wrap: wrap;
  gap: 0.4rem;
}
.btn-persona {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 0.75rem;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-persona:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
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
