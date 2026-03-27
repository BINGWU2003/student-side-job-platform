import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') as unknown as ImportMetaEnv;
  return {
    envDir: resolve(__dirname, 'env'),
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@student-side-job-platform/shared': resolve(__dirname, '../../packages/shared/src'),
        '@student-side-job-platform/shared-types': resolve(
          __dirname,
          '../../packages/shared-types/src'
        ),
        '@student-side-job-platform/shared-schemas': resolve(
          __dirname,
          '../../packages/shared-schemas/src'
        ),
      },
    },
    server: {
      port: 3001,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
        },
      },
    },
  };
});
