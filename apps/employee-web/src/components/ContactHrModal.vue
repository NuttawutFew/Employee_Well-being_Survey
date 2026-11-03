<template>
  <div class="hr-modal-backdrop" @click.self="close">
    <div class="hr-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="hr-contact-title">
      <!-- Modal Header matching screenshot media_1789105239433.png -->
      <div class="hr-modal-header">
        <div class="hr-modal-title-group">
          <div class="hr-phone-icon-wrap" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          </div>
          <div>
            <h3 id="hr-contact-title" class="hr-modal-title">เบอร์ติดต่อ HR กรณีฉุกเฉิน</h3>
            <p class="hr-modal-subtitle">ฝ่ายทรัพยากรบุคคล (HR) บมจ. อินเทอร์เน็ตประเทศไทย</p>
          </div>
        </div>
        <button type="button" class="btn-close-hr-modal" @click="close" aria-label="ปิด">✕</button>
      </div>

      <!-- Modal Body: Contacts List matching screenshot -->
      <div class="hr-modal-body">
        <div class="hr-contacts-list">
          <!-- Contact 1: แป๋ม -->
          <div class="hr-contact-card">
            <div class="hr-avatar-circle">
              <span>แป๋ม</span>
            </div>
            <div class="hr-contact-info">
              <strong class="hr-contact-name">นางสาวพัชริยาภรณ์ เรืองอ่อน (แป๋ม)</strong>
              <a href="tel:0655214966" class="hr-contact-phone">065 521 4966</a>
            </div>
            <a href="tel:0655214966" class="btn-call-hr" title="โทรหานางสาวพัชริยาภรณ์ (แป๋ม)">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
              </svg>
              <span>โทร</span>
            </a>
          </div>

          <!-- Contact 2: แบม -->
          <div class="hr-contact-card">
            <div class="hr-avatar-circle">
              <span>แบม</span>
            </div>
            <div class="hr-contact-info">
              <strong class="hr-contact-name">นางสาวแพรทองธาร อินแพชร (แบม)</strong>
              <a href="tel:0613879001" class="hr-contact-phone">061 387 9001</a>
            </div>
            <a href="tel:0613879001" class="btn-call-hr" title="โทรหานางสาวแพรทองธาร (แบม)">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
              </svg>
              <span>โทร</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="hr-modal-footer">
        <button type="button" class="btn-dismiss-hr" @click="close">
          ปิด
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContactHrModal',
  props: {
    value: {
      type: Boolean,
      default: true
    },
    modelValue: {
      type: Boolean,
      default: true
    }
  },
  emits: ['close', 'input', 'update:modelValue'],
  methods: {
    close() {
      this.$emit('close');
      this.$emit('input', false);
      this.$emit('update:modelValue', false);
    }
  }
};
</script>

<style scoped>
.hr-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  animation: fadeIn 0.2s ease;
}

.hr-modal-dialog {
  background: #ffffff;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.25);
  overflow: hidden;
  animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid #e2e8f0;
}

.hr-modal-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #f1f5f9;
}

.hr-modal-title-group {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.hr-phone-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #e0f2fe;
  color: #0284c7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(2, 132, 199, 0.12);
}

.hr-modal-title {
  margin: 0 0 0.2rem 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.hr-modal-subtitle {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.35;
}

.btn-close-hr-modal {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.btn-close-hr-modal:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.hr-modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hr-contacts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hr-contact-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  transition: all 0.15s ease;
}

.hr-contact-card:hover {
  background: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.hr-avatar-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
  color: #0369a1;
  font-size: 0.82rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(3, 105, 161, 0.15);
}

.hr-contact-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  min-width: 0;
}

.hr-contact-name {
  font-size: 0.88rem;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}

.hr-contact-phone {
  font-size: 0.85rem;
  color: #0284c7;
  font-weight: 600;
  text-decoration: none;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.hr-contact-phone:hover {
  text-decoration: underline;
}

.btn-call-hr {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  background: #0284c7;
  color: #ffffff;
  padding: 0.5rem 1.15rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);
  flex-shrink: 0;
}

.btn-call-hr:hover {
  background: #0369a1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
}

.btn-call-hr:active {
  transform: translateY(0);
}

.hr-hotline-hint {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  font-size: 0.8rem;
  color: #166534;
  line-height: 1.45;
}

.hint-icon {
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 1px;
}

.hotline-link {
  color: #0284c7;
  font-weight: 700;
  text-decoration: underline;
}

.hr-modal-footer {
  padding: 0.85rem 1.5rem 1.25rem 1.5rem;
  display: flex;
  justify-content: center;
}

.btn-dismiss-hr {
  width: 100%;
  padding: 0.65rem 1rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-dismiss-hr:hover {
  background: #e2e8f0;
  color: #1e293b;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 480px) {
  .hr-modal-dialog {
    border-radius: 16px;
  }
  .hr-modal-header {
    padding: 1rem 1.25rem;
  }
  .hr-modal-body {
    padding: 1rem 1.25rem;
  }
  .hr-contact-card {
    padding: 0.75rem 0.85rem;
  }
  .btn-call-hr {
    padding: 0.45rem 0.9rem;
    font-size: 0.82rem;
  }
}
</style>
