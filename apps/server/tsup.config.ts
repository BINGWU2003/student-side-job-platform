import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  // 将 workspace 内部包打包进去，避免 Render 上的符号链接问题
  noExternal: [
    '@bingwu-my-monorepo/shared',
    '@bingwu-my-monorepo/shared-types',
    '@bingwu-my-monorepo/shared-schemas',
  ],
});
