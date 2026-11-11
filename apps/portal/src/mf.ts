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

export function lazyProvider<Props extends object = Record<string, unknown>>(
  alias: string,
  exposeName: string,
) {
  return lazy(async () => {
    try {
      const mod = await loadRemote<{ default: ComponentType<Props> }>(
        `${alias}/${exposeName}`,
      );
      if (!mod || !mod.default) {
        throw new Error(
          `Provider "${alias}/${exposeName}" did not export a default component.`,
        );
      }
      return { default: mod.default };
    } catch (err) {
      console.error(
        `[MFE Runtime] Failed to load remote component "${alias}/${exposeName}":`,
        err,
      );
      throw err;
    }
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
