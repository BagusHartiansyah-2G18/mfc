import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const PORT = Number(process.env.PORT_PROFILE) || 4205;

export default defineConfig({
  root: import.meta.dirname,
  envDir: path.resolve(import.meta.dirname, '../../'),
  envPrefix: ['VITE_'],
  cacheDir: path.resolve(import.meta.dirname, '../../node_modules/.vite/apps/profile'),
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
  preview: {
    port: PORT,
    strictPort: true,
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    target: 'chrome89',
  },
  resolve: {
    alias: {
      '@org/ui': path.resolve(import.meta.dirname, '../../packages/shared/ui/src/index.ts'),
      '@org/auth': path.resolve(import.meta.dirname, '../../packages/shared/auth/src/index.ts'),
    },
  },
  plugins: [react(), tailwindcss(), nxReadySignal()],
});
