import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  // 将 workspace 内部包打包进去，避免 Render 上的符号链接问题
  noExternal: [
    '@student-side-job-platform/shared',
    '@student-side-job-platform/shared-types',
    '@student-side-job-platform/shared-schemas',
  ],
});
