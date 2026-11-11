import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const PORT = Number(process.env.PORT_USER_MGMT) || 4202;

export default defineConfig({
  envDir: path.resolve(import.meta.dirname, '../../'),
  cacheDir: path.resolve(import.meta.dirname, '../../node_modules/.vite/apps/userMgmt'),
  server: {
    port: PORT,
    strictPort: true,
    origin: `http://localhost:${PORT}`,
    host: '0.0.0.0',
    hmr: {
      host: 'localhost',
      port: PORT,
    },
    watch: {
      usePolling: true,
      interval: 300,
    },
    fs: {
      allow: [path.resolve(import.meta.dirname, '../../')],
    },
    cors: true,
  },
  preview: { port: PORT, strictPort: true, cors: true },
  build: { target: 'chrome89' },
  resolve: {
    alias: {
      '@org/ui': path.resolve(import.meta.dirname, '../../packages/shared/ui/src/index.ts'),
      '@org/auth': path.resolve(import.meta.dirname, '../../packages/shared/auth/src/index.ts'),
    },
  },
  plugins: [
    federation({
      name: 'user_mgmt',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.30.0' },
      },
    }),
    {
      name: 'watch-workspace-packages',
      configureServer(server) {
        const packagesDir = path.resolve(import.meta.dirname, '../../packages');
        server.watcher.add(packagesDir);
        server.watcher.on('change', (file) => {
          if (file.includes('packages')) {
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
