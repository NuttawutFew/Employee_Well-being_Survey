import Vue from 'vue';
import App from './App.vue';

// Resolve API Base URL for Cloud Deployments (e.g. Render Static Sites)
const envApiUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';
const localApiUrl = typeof window !== 'undefined' ? (window.__API_URL__ || localStorage.getItem('API_URL') || '') : '';
const API_BASE = (localApiUrl || envApiUrl).replace(/\/$/, '');

if (API_BASE && typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string') {
      if (input.startsWith('/api') || input.startsWith('/admin/')) {
        input = `${API_BASE}${input}`;
      }
    }
    return originalFetch.call(this, input, init);
  };
}

new Vue({
  render: (h) => h(App)
}).$mount('#app');
