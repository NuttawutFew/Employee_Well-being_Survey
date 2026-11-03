import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue2';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = parseInt(process.env.PORT || env.PORT || '3000', 10);
  const apiTarget = process.env.API_TARGET || env.API_TARGET || 'http://localhost:4000';

  return {
    plugins: [vue()],
    server: {
      port,
      host: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        }
      }
    }
  };
});
