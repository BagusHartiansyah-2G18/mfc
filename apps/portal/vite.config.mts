import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const PORT = Number(process.env.PORT_PORTAL) || 4200;

export default defineConfig({
  envDir: path.resolve(import.meta.dirname, '../../'),
  envPrefix: ['VITE_', 'userbypass'],
  cacheDir: path.resolve(import.meta.dirname, '../../node_modules/.vite/apps/portal'),
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
      name: 'portal',
      shared: {
        react: { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.30.0' },
      },
    }),
    {
      name: 'watch-workspace-changes',
      configureServer(server) {
        const workspaceRoots = [
          path.resolve(import.meta.dirname, '../../packages'),
          path.resolve(import.meta.dirname, '../../apps/compUI/src'),
          path.resolve(import.meta.dirname, '../../apps/userMgmt/src'),
        ];
        server.watcher.add(workspaceRoots);
        server.watcher.on('change', (file) => {
          if (
            file.includes('packages') ||
            file.includes('apps/compUI') ||
            file.includes('apps/userMgmt') ||
            file.includes('apps\\compUI') ||
            file.includes('apps\\userMgmt')
          ) {
            server.ws.send({ type: 'full-reload' });
          }
        });
      },
    },
    react(),
    tailwindcss(),
    nxReadySignal(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 15000,
  },
});
