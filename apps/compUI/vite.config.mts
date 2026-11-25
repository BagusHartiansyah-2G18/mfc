import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const PORT = Number(process.env.PORT_COMP_UI) || 4201;

export default defineConfig({
  envDir: path.resolve(import.meta.dirname, '../../'),
  envPrefix: ['VITE_', 'userbypass'],
  cacheDir: path.resolve(import.meta.dirname, '../../node_modules/.vite/apps/compUI'),
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
      name: 'comp_ui',
      dts: false,
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.tsx',
        './NotedView': './src/components/noted/NotedView.tsx',
        './FlexibleFormRenderer': './src/components/noted/forms/NoteDynamicFormRenderer.tsx',
        './FlexibleFormTable': './src/components/noted/forms/NoteDynamicFormTable.tsx',
        './PublicFormPage': './src/components/noted/forms/PublicFormPage.tsx',
        './StandaloneQuestionnaire': './src/components/noted/forms/StandaloneQuestionnairePage.tsx',
        './StandaloneNotePage': './src/components/noted/StandaloneNotePage.tsx',
        './NotedFormsPage': './src/components/noted/forms/NoteFormsPage.tsx',
        './NotedFormResponsesPage': './src/components/noted/forms/NoteFormResponsesPage.tsx',
        './NotedDocumentsPage': './src/components/noted/NoteDocumentsPage.tsx',
        './NoteFormsCatalogPage': './src/components/noted/NoteFormsCatalogPage.tsx',
        './NoteDatasetPage': './src/components/noted/NoteDatasetPage.tsx',
        './FriendsHubPage': './src/components/noted/FriendsHubPage.tsx',
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
    setupFiles: [path.resolve(import.meta.dirname, '../../test-setup.ts')],
  },
});
