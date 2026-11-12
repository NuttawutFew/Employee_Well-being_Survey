<template>
  <div class="app-container" :class="{ 'is-standard-view': isAuthenticatedScreen }">
    <!-- Authenticated Header (Displayed ONLY in Notice, Assessment, and Submitted states) -->
    <header v-if="isAuthenticatedScreen" class="header">
      <div class="header-content">
        <div class="brand-wrap">
          <img :src="inetLogo" alt="INET Logo" class="brand-logo-img" />
          <div class="brand-text">
            <h1 class="brand-title">Employee Well-being Survey</h1>
            <span class="brand-subtitle">ระบบประเมินสุขภาพใจ บุคลากรในองค์กร</span>
          </div>
        </div>
        <div class="header-right-group">
          <div class="header-emp-pill" :title="employeeProfile.company || 'องค์กร'">
            <span class="emp-pill-icon">👤</span>
            <span class="emp-pill-name">{{ (employeeProfile && employeeProfile.fullName) || employeeId }}</span>
            <span class="emp-pill-id">({{ employeeId }})</span>
          </div>
          <button 
            type="button" 
            class="btn-switch-account-header" 
            @click="logout" 
            :title="isMockEnabled ? 'สลับบัญชีผู้ใช้งานเพื่อทดสอบ' : 'ออกจากระบบ'"
          >
            <span>{{ isMockEnabled ? '🔄' : '🚪' }}</span>
            <span>{{ isMockEnabled ? 'สลับบัญชี' : 'ออกจากระบบ' }}</span>
          </button>
          <button type="button" class="btn-contact-hr-header" @click="showContactModal = true" title="เบอร์ติดต่อ HR กรณีฉุกเฉิน">
            <span class="btn-contact-icon">📞</span>
            <span class="btn-contact-text">ติดต่อฝ่ายบุคคล (HR)</span>
          </button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>กำลังโหลดข้อมูลการประเมิน...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-banner">
        <p>{{ error }}</p>
        <button class="btn-retry" @click="fetchSession">ลองใหม่</button>
      </div>

      <!-- Screen 0: Public Portal Screen (Channel 2: Direct Website Landing Page) -->
      <EmployeePortal
        v-else-if="currentScreen === 'portal'"
        @start-login="onStartLogin"
        @switch-channel="onSwitchChannel"
        @open-contact-hr="showContactModal = true"
      />

      <!-- Screen 1: Employee ONE ID Login Screen -->
      <LoginView
        v-else-if="currentScreen === 'login'"
        @login-success="onLoginSuccess"
        @back-to-portal="currentScreen = 'portal'"
        @open-contact-hr="showContactModal = true"
      />

      <!-- Screen 2: Notice View (Step 3: ปุ่มรับทราบ) -->
      <NoticeView 
        v-else-if="currentScreen === 'notice'" 
        @acknowledged="onNoticeAcknowledged" 
        @open-contact-hr="showContactModal = true"
      />

      <!-- Screen 3: Taking Assessment Form (Steps 0 to 2) -->
      <div v-else-if="currentScreen === 'assessment' && currentAssessment" class="assessment-container">
        <div class="form-navigation-top">
          <button type="button" class="btn-back-overview" @click="exitAssessment">
            <span class="nav-icon">←</span>
            <span>ออกจากแบบประเมิน</span>
          </button>

          <button type="button" class="btn-clear-in-form" :disabled="clearing" @click="clearDraft">
            <span>🗑️ ล้างคำตอบและเริ่มใหม่</span>
          </button>
        </div>
        <AssessmentForm
          :key="'form-' + currentStepIndex"
          :assessment="currentAssessment"
          :assessment-index="currentStepIndex"
          :total-assessments="totalAssessments"
          :initial-answers="draftAnswers"
          :initial-feedback="userFeedback"
          @answers-updated="onAnswersUpdated"
          @feedback-updated="onFeedbackUpdated"
          @next="onNextAssessment"
          @prev="onPrevAssessment"
        />
      </div>

      <!-- Screen 4: Submitted (Result Summary View) -->
      <ResultSummaryView
        v-else-if="currentScreen === 'submitted'"
        :initial-result="session.result"
        :initial-submitted-at="session.submittedAt"
        :initial-feedback="session.feedback || userFeedback"
        @open-contact-hr="showContactModal = true"
      />
    </main>

    <!-- Submission Confirmation Modal -->
    <SubmissionModal
      v-if="showSubmitModal"
      :answers="draftAnswers"
      :feedback="userFeedback"
      :employee="employeeProfile"
      @cancel="showSubmitModal = false"
      @submitted="onSubmitted"
    />

    <!-- Contact HR Emergency Modal -->
    <ContactHrModal
      v-if="showContactModal"
      @close="showContactModal = false"
    />
  </div>
</template>

<script>
import EmployeePortal from './components/EmployeePortal.vue';
import LoginView from './components/LoginView.vue';
import NoticeView from './components/NoticeView.vue';
import AssessmentForm from './components/AssessmentForm.vue';
import SubmissionModal from './components/SubmissionModal.vue';
import ResultSummaryView from './components/ResultSummaryView.vue';
import ContactHrModal from './components/ContactHrModal.vue';
import inetLogo from './assets/logo.jpeg';

export default {
  name: 'App',
  components: {
    EmployeePortal,
    LoginView,
    NoticeView,
    AssessmentForm,
    SubmissionModal,
    ResultSummaryView,
    ContactHrModal
  },
  data() {
    return {
      inetLogo,
      currentScreen: 'portal', // 'portal' | 'login' | 'notice' | 'assessment' | 'submitted'
      loginMode: 'employee',
      entryChannel: 'web', // 'web' | 'oneplatform'
      employeeId: 'EMP-DEV-001',
      employeeProfile: {
        employeeId: 'EMP-DEV-001',
        fullName: 'คุณณิชา วัฒนกิจ',
        company: 'บริษัท ไอเน็ตเวิร์ก จำกัด (มหาชน)',
        department: 'ฝ่ายเทคโนโลยีและนวัตกรรม',
        position: 'Software Engineer'
      },
      loading: true,
      clearing: false,
      loadingAssessment: false,
      isTakingAssessment: false,
      showSubmitModal: false,
      showContactModal: false,
      catalog: [],
      currentStepIndex: 0,
      draftAnswers: {},
      userFeedback: '',
      error: null,
      session: {
        noticeAcknowledged: false,
        status: null,
        attemptId: null,
        noticeAcknowledgedAt: null,
        submittedAt: null,
        result: null
      }
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
    isAuthenticatedScreen() {
      return ['notice', 'assessment', 'submitted'].includes(this.currentScreen);
    },
    totalAssessments() {
      return this.catalog.length || 3;
    },
    currentAssessment() {
      return this.catalog[this.currentStepIndex] || null;
    },
    savedAnswerCount() {
      return Object.keys(this.draftAnswers).length;
    }
  },
  async mounted() {
    await this.fetchCatalog();
    
    // Check if entered via Channel 1: OnePlatform App (SSO)
    const params = new URLSearchParams(window.location.search);
    const isOnePlatform = params.get('channel') === 'oneplatform' || params.get('sso') === 'true' || params.has('shareToken');
    
    if (isOnePlatform) {
      this.entryChannel = 'oneplatform';
      await this.performOnePlatformSSO();
    } else {
      // Channel 2: Direct Website Portal
      this.entryChannel = 'web';
      this.currentScreen = 'portal';
      this.loading = false;
    }
  },
  methods: {
    getAuthHeaders() {
      const token = localStorage.getItem('emp_token') || this.employeeId || 'EMP-DEV-001';
      return {
        'Authorization': `Bearer ${token}`,
        'x-employee-id': token
      };
    },
    async performOnePlatformSSO() {
      this.loading = true;
      try {
        const res = await fetch('/api/assessment/auth/sso', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: 'EMP-DEV-001', shareToken: 'sso_share_token_sim' })
        });
        if (res.ok) {
          const data = await res.json();
          this.employeeId = data.employee?.employeeId || 'EMP-DEV-001';
          this.employeeProfile = data.employee;
          if (data.token || data.employee?.employeeId) {
            localStorage.setItem('emp_token', data.token || data.employee?.employeeId);
          }
          await this.fetchSession();
          if (this.session.status === 'SUBMITTED') {
            this.currentScreen = 'submitted';
          } else {
            this.currentScreen = 'notice';
          }
        } else {
          this.currentScreen = 'portal';
        }
      } catch (e) {
        this.currentScreen = 'portal';
      } finally {
        this.loading = false;
      }
    },
    onStartLogin(mode) {
      this.loginMode = mode || 'employee';
      this.currentScreen = 'login';
    },
    async onSwitchChannel(channel) {
      if (channel === 'oneplatform') {
        this.entryChannel = 'oneplatform';
        await this.performOnePlatformSSO();
      } else {
        this.entryChannel = 'web';
        this.currentScreen = 'portal';
      }
    },
    async onLoginSuccess(payload) {
      if (payload.mode === 'employee') {
        if (payload.employee) {
          this.employeeId = payload.employee.employeeId || 'EMP-DEV-001';
          this.employeeProfile = payload.employee;
        }
        await this.fetchSession();
        if (this.session.status === 'SUBMITTED') {
          this.currentScreen = 'submitted';
        } else {
          this.currentScreen = 'notice';
        }
      }
    },
    logout() {
      localStorage.removeItem('emp_token');
      document.cookie = 'emp_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = '__Host-emp-session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      this.currentScreen = 'login';
      this.employeeId = 'EMP-DEV-001';
      this.employeeProfile = {
        employeeId: 'EMP-DEV-001',
        fullName: 'คุณณิชา วัฒนกิจ',
        company: 'บมจ. ไอเน็ตเวิร์ก',
        department: 'ฝ่ายเทคโนโลยี',
        position: 'Software Engineer'
      };
      this.session = {
        noticeAcknowledged: false,
        status: null,
        attemptId: null,
        noticeAcknowledgedAt: null,
        submittedAt: null,
        result: null
      };
      this.draftAnswers = {};
      this.userFeedback = '';
    },
    async fetchCatalog() {
      try {
        const res = await fetch('/api/assessment/catalog');
        if (res.ok) {
          this.catalog = await res.json();
        }
      } catch (err) {
        console.error('Failed to fetch catalog', err);
      }
    },
    async fetchSession() {
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch('/api/assessment/session', {
          headers: this.getAuthHeaders()
        });
        if (!res.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูลรอบการประเมินได้ (' + res.status + ')');
        }
        const data = await res.json();
        this.session = data;

        if (data.status === 'SUBMITTED') {
          this.isTakingAssessment = false;
          if (data.feedback) {
            this.userFeedback = data.feedback;
          }
        } else {
          this.draftAnswers = {};
          this.userFeedback = '';
          this.currentStepIndex = 0;
          this.isTakingAssessment = false;
          this.session.noticeAcknowledged = false;
          try {
            await fetch('/api/assessment/draft/clear', {
              method: 'POST',
              headers: this.getAuthHeaders()
            });
          } catch (e) {
            // ignore network errors on fresh start
          }
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async onNoticeAcknowledged(data) {
      this.session.noticeAcknowledged = true;
      this.session.status = data.status || 'DRAFT';
      this.session.attemptId = data.attemptId;
      this.session.noticeAcknowledgedAt = data.noticeAcknowledgedAt;
      this.currentStepIndex = 0;
      this.draftAnswers = {};
      this.userFeedback = '';
      this.isTakingAssessment = true;
      this.currentScreen = 'assessment';
      this.scrollToTop();
    },
    startAssessment() {
      this.isTakingAssessment = true;
      this.currentStepIndex = 0;
      this.draftAnswers = {};
      this.userFeedback = '';
      this.currentScreen = 'assessment';
      this.scrollToTop();
    },
    async exitAssessment() {
      const confirmed = confirm(
        'คุณต้องการออกจากแบบประเมินใช่หรือไม่?\n\n' +
        'คำชี้แจง: ระบบจะไม่มีการจำคำตอบ หากคุณออกจากหน้านี้ คำตอบที่เลือกไว้จะถูกรีเซ็ต และจะต้องเริ่มต้นใหม่เมื่อเข้าใช้งานอีกครั้ง'
      );
      if (!confirmed) return;

      try {
        await fetch('/api/assessment/draft/clear', {
          method: 'POST',
          headers: this.getAuthHeaders()
        });
      } catch (e) {
        // ignore
      }
      this.draftAnswers = {};
      this.userFeedback = '';
      this.currentStepIndex = 0;
      this.isTakingAssessment = false;
      this.session.noticeAcknowledged = false;
      this.currentScreen = 'portal';
    },
    onAnswersUpdated(payload) {
      if (payload && payload.answers) {
        this.draftAnswers = { ...payload.answers };
      } else if (payload) {
        this.draftAnswers = { ...payload };
      }
      if (payload && payload.feedback !== undefined) {
        this.userFeedback = payload.feedback;
      }
    },
    onFeedbackUpdated(val) {
      this.userFeedback = val || '';
    },
    scrollToTop() {
      // 1. Immediate scroll (instant for mobile/iPad)
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;

      // 2. Next tick scroll
      this.$nextTick(() => {
        window.scrollTo(0, 0);
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;

        const topEl = document.querySelector('.assessment-container') ||
                      document.querySelector('.form-navigation-top') ||
                      document.querySelector('.assessment-header') ||
                      document.querySelector('.app-container');
        if (topEl && typeof topEl.scrollIntoView === 'function') {
          topEl.scrollIntoView({ behavior: 'auto', block: 'start' });
        }

        // 3. Timed fallbacks for mobile/iPad Safari touch inertia
        setTimeout(() => {
          window.scrollTo(0, 0);
          if (document.documentElement) document.documentElement.scrollTop = 0;
          if (document.body) document.body.scrollTop = 0;
        }, 50);

        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 150);
      });
    },
    async onNextAssessment(payload) {
      if (payload?.answers) {
        this.draftAnswers = { ...this.draftAnswers, ...payload.answers };
      }
      if (payload?.feedback !== undefined) {
        this.userFeedback = payload.feedback;
      }

      // If at final step: open confirmation modal
      if (this.currentStepIndex === this.totalAssessments - 1) {
        this.showSubmitModal = true;
        return;
      }

      // Advance to next step directly on client
      this.currentStepIndex++;
      this.scrollToTop();

      // Non-blocking sync to backend if session is active
      fetch('/api/assessment/draft/step/next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ answers: this.draftAnswers })
      }).catch(() => {});
    },
    async onPrevAssessment() {
      if (this.currentStepIndex <= 0) return;
      this.currentStepIndex--;
      this.scrollToTop();

      fetch('/api/assessment/draft/step/prev', {
        method: 'POST',
        headers: this.getAuthHeaders()
      }).catch(() => {});
    },
    onSubmitted(submitData) {
      this.showSubmitModal = false;
      this.isTakingAssessment = false;
      this.session.status = submitData.status;
      this.session.submittedAt = submitData.submittedAt;
      this.session.result = submitData.result;
      this.session.feedback = submitData.feedback || null;
      this.userFeedback = '';
      this.currentScreen = 'submitted';
      this.scrollToTop();
    },
    async clearDraft() {
      const confirmed = confirm('คุณต้องการล้างคำตอบทั้งหมดและเริ่มต้นทำแบบประเมินใหม่ใช่หรือไม่?');
      if (!confirmed) return;

      this.clearing = true;
      try {
        // Sync draft clear with backend
        await fetch('/api/assessment/draft/clear', {
          method: 'POST',
          headers: this.getAuthHeaders()
        }).catch(() => {});

        // Re-acknowledge notice on backend to establish a clean active DRAFT attempt for Step 1
        const ackRes = await fetch('/api/assessment/notice/acknowledge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          },
          body: JSON.stringify({ noticeVersion: '2026-09-03' })
        }).catch(() => null);

        if (ackRes && ackRes.ok) {
          const ackData = await ackRes.json().catch(() => ({}));
          this.session.status = ackData.status || 'DRAFT';
          this.session.attemptId = ackData.attemptId;
          this.session.noticeAcknowledged = true;
        } else {
          this.session.status = 'DRAFT';
          this.session.noticeAcknowledged = true;
        }
      } catch (err) {
        console.warn('Clear draft sync error:', err);
      } finally {
        // Always reset client-side answers and set step index back to Step 1 (index 0)
        this.draftAnswers = {};
        this.userFeedback = '';
        this.currentStepIndex = 0;
        this.isTakingAssessment = true;
        this.currentScreen = 'assessment';
        this.clearing = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    formatTime(isoString) {
      if (!isoString) return '-';
      return new Date(isoString).toLocaleString('th-TH');
    }
  }
};
</script>

<style>
/* Global CSS reset ensuring consistent layout and box-sizing across all components */
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  -webkit-text-size-adjust: 100%;
}
</style>

<style scoped>
.app-container {
  font-family: var(--app-font-family, inherit);
  color: #1e293b;
  min-height: 100vh;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.app-container.is-standard-view {
  max-width: 920px;
  margin: 0 auto;
  padding: 0.75rem 0.75rem 2.5rem 0.75rem;
  box-sizing: border-box;
  width: 100%;
}

@media (max-width: 480px) {
  .app-container.is-standard-view {
    padding: 0.5rem 0.5rem 2rem 0.5rem;
  }
}

@media (min-width: 640px) {
  .app-container.is-standard-view {
    padding: 1.5rem 1.75rem 3rem 1.75rem;
  }
}

@media (min-width: 1024px) {
  .app-container.is-standard-view {
    padding: 2rem 2.5rem 3.5rem 2.5rem;
  }
}

/* Modern App Header */
.header {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  width: 100%;
}

@media (max-width: 640px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 0.65rem;
  }
  .brand-wrap {
    justify-content: flex-start;
  }
  .brand-logo-img {
    width: 38px;
    height: 38px;
  }
  .brand-title {
    font-size: 1.05rem;
    white-space: nowrap;
  }
  .header-right-group {
    width: 100%;
    margin-left: 0;
    gap: 0.4rem;
    display: flex;
    flex-wrap: wrap;
  }
  .header-emp-pill {
    max-width: 100%;
    font-size: 0.75rem;
    padding: 0.3rem 0.6rem;
  }
  .btn-switch-account-header,
  .btn-contact-hr-header {
    font-size: 0.75rem;
    padding: 0.35rem 0.65rem;
  }
  .form-navigation-top {
    gap: 0.5rem;
  }
  .btn-back-overview,
  .btn-clear-in-form {
    flex: 1;
    justify-content: center;
    text-align: center;
    padding: 0.45rem 0.5rem;
    font-size: 0.78rem;
    white-space: nowrap;
  }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.brand-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-logo-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.45rem;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.08);
  flex-shrink: 0;
}

.brand-logo-img {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

@media (min-width: 640px) {
  .brand-title {
    font-size: 1.45rem;
  }
}

.brand-subtitle {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 400;
}

.header-right-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-left: auto;
  flex-wrap: wrap;
}

.header-emp-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  color: #334155;
}
.badge-emp-icon {
  font-size: 0.85rem;
}
.badge-emp-name {
  color: #0f172a;
  font-weight: 600;
}
.badge-emp-id {
  color: #64748b;
  font-size: 0.75rem;
}

.btn-switch-account-header {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.38rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-switch-account-header:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #1e293b;
}

.btn-contact-hr-header {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-contact-hr-header:hover {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1e40af;
  transform: translateY(-1px);
}

.btn-contact-icon {
  font-size: 0.95rem;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: #334155;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.user-icon {
  font-size: 0.95rem;
}

.user-id strong {
  color: #2563eb;
  font-family: monospace;
  font-size: 0.85rem;
}

/* Loading & Error States */
.loading-state {
  text-align: center;
  padding: 4rem 1.5rem;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 38px;
  height: 38px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
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
  padding: 1.25rem;
  border-radius: 12px;
  text-align: center;
  margin: 1.5rem 0;
}

.btn-retry {
  margin-top: 0.75rem;
  background: #ef4444;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

/* Assessment Navigation Top */
.form-navigation-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.btn-back-overview {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-back-overview:hover {
  background: #f8fafc;
  color: #1e293b;
  border-color: #94a3b8;
}

.btn-clear-in-form {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.45rem 0.8rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-clear-in-form:hover:not(:disabled) {
  background: #fee2e2;
}

.btn-clear-in-form:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-nav-right-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}
</style>
