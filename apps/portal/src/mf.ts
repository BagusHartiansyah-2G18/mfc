import { lazy, type ComponentType } from 'react';
import { registerRemotes, loadRemote, init } from '@module-federation/runtime';

export interface RemoteProviderConfig {
  alias: string;
  name: string;
  entry: string;
  type?: 'module';
}

// Read remote entry URLs from environment variables, runtime window injection, or localhost fallback
const COMP_UI_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_COMP_UI_URL) ||
  (typeof window !== 'undefined' &&
    (window as unknown as { __ENV__?: { VITE_COMP_UI_URL?: string } }).__ENV__?.VITE_COMP_UI_URL) ||
  'http://localhost:4201/remoteEntry.js';

const USER_MGMT_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_USER_MGMT_URL) ||
  (typeof window !== 'undefined' &&
    (window as unknown as { __ENV__?: { VITE_USER_MGMT_URL?: string } }).__ENV__?.VITE_USER_MGMT_URL) ||
  'http://localhost:4202/remoteEntry.js';

export const PROVIDERS: RemoteProviderConfig[] = [
  {
    alias: 'compUI',
    name: 'comp_ui',
    entry: COMP_UI_URL,
    type: 'module',
  },
  {
    alias: 'userMgmt',
    name: 'user_mgmt',
    entry: USER_MGMT_URL,
    type: 'module',
  },
];

// Register all remote providers with ESM module type
try {
  registerRemotes(PROVIDERS.map((remote) => ({ type: 'module', ...remote })));
} catch {
  // Fallback for test runners (Vitest / JSDOM) where Vite plugin runtime init is absent
  try {
    init({
      name: 'portal',
      remotes: PROVIDERS.map((remote) => ({ type: 'module', ...remote })),
    });
  } catch {
    // Graceful no-op in non-browser unit test environment
  }
}

const LOCAL_FALLBACKS: Record<string, () => Promise<any>> = {
  NotedView: () => import('../../compUI/src/components/noted/NotedView'),
  StandaloneQuestionnaire: () =>
    import('../../compUI/src/components/noted/forms/StandaloneQuestionnairePage'),
  StandaloneNotePage: () => import('../../compUI/src/components/noted/StandaloneNotePage'),
  NotedFormsPage: () => import('../../compUI/src/components/noted/forms/NoteFormsPage'),
  NotedFormResponsesPage: () =>
    import('../../compUI/src/components/noted/forms/NoteFormResponsesPage'),
  NotedDocumentsPage: () => import('../../compUI/src/components/noted/NoteDocumentsPage'),
  CakeApp: () => import('../../cake/src/app/app'),
  App: () => import('../../compUI/src/App'),
};

export function lazyProvider<Props extends object = Record<string, unknown>>(
  alias: string,
  exposeName: string,
) {
  return lazy(async () => {
    try {
      const mod = await loadRemote<{ default?: ComponentType<Props> }>(
        `${alias}/${exposeName}`,
      );
      const Component = mod?.default || (mod as any)?.[exposeName];
      if (Component) return { default: Component as ComponentType<Props> };
    } catch (err) {
      console.warn(
        `[MFE Runtime] Remote "${alias}/${exposeName}" unavailable, trying local fallback:`,
        err,
      );
    }

    const localLoader =
      alias === 'compUI' || alias === 'cake' ? LOCAL_FALLBACKS[exposeName] : undefined;
    if (localLoader) {
      try {
        const localMod = await localLoader();
        const LocalComponent =
          localMod?.default ||
          localMod?.[exposeName] ||
          Object.values(localMod || {}).find((value) => typeof value === 'function');
        if (LocalComponent) return { default: LocalComponent as ComponentType<Props> };
        throw new Error(
          `Local fallback for "${alias}/${exposeName}" loaded without component export. Keys: ${Object.keys(localMod || {}).join(',')} Types: ${Object.keys(localMod || {}).map((k) => `${k}:${typeof (localMod as any)[k]}`).join(',')}`,
        );
      } catch (localErr) {
        console.error(`[MFE Runtime] Local fallback failed for "${alias}/${exposeName}":`, localErr);
        throw localErr;
      }
    }

    throw new Error(`Remote module "${alias}/${exposeName}" could not be loaded.`);
  });
}

// In development, listen to remote microfrontend HMR WebSockets to trigger automatic reload when remotes update
if (typeof window !== 'undefined' && typeof WebSocket !== 'undefined' && import.meta.env?.DEV) {
  [COMP_UI_URL, USER_MGMT_URL].forEach((entryUrl) => {
    try {
      const parsed = new URL(entryUrl, window.location.origin);
      const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${parsed.hostname}:${parsed.port}`;
      const ws = new WebSocket(wsUrl, 'vite-hmr');
      ws.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'update' || payload.type === 'full-reload') {
            window.location.reload();
          }
        } catch {
          // ignore non-json messages
        }
      });
    } catch {
      // quiet fallback in testing or unsupported environments
    }
  });
}
