import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@org/ui': path.resolve(__dirname, './packages/shared/ui/src/index.ts'),
      '@org/auth': path.resolve(__dirname, './packages/shared/auth/src/index.ts'),
    },
  },
  test: {
    testTimeout: 15000,
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test-setup.ts'],
    projects: [
      '**/vite.config.{mjs,js,ts,mts}',
      '**/vitest.config.{mjs,js,ts,mts}',
    ],
  },
});
