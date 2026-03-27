import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const envDir = resolve(__dirname, 'env');
  const env = loadEnv(mode, envDir, '') as unknown as ImportMetaEnv;

  return {
    envDir,
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
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  };
});
