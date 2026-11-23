import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const PORT = Number(process.env.PORT_NOTED) || 4203;

export default defineConfig({
  envDir: path.resolve(import.meta.dirname, '../../'),
  envPrefix: ['VITE_', 'userbypass'],
  cacheDir: path.resolve(import.meta.dirname, '../../node_modules/.vite/apps/noted'),
  server: {
    port: PORT,
    strictPort: true,
    host: '0.0.0.0',
    hmr: {
      host: 'localhost',
      port: PORT,
    },
    cors: true,
    watch: {
      usePolling: true,
      interval: 300,
    },
    fs: {
      allow: [path.resolve(import.meta.dirname, '../../')],
    },
  },
  preview: { port: PORT, strictPort: true },
  build: { target: 'chrome89' },
  resolve: {
    alias: {
      '@org/ui': path.resolve(import.meta.dirname, '../../packages/shared/ui/src/index.ts'),
      '@org/auth': path.resolve(import.meta.dirname, '../../packages/shared/auth/src/index.ts'),
    },
  },
  plugins: [
    federation({
      name: 'noted',
      dts: false,
      shared: {
        react: { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.30.0' },
      },
    }),
    react(),
    tailwindcss(),
    nxReadySignal(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 15000,
    setupFiles: [path.resolve(import.meta.dirname, '../../test-setup.ts')],
  },
});
