/**
 * Type-safe Cross-Micro Frontend Event Bus
 * Uses browser-native CustomEvent for decoupled host-remote communication.
 */

export interface MFEEventPayloads {
  'bgs:navigate': { path: string };
  'bgs:notification': {
    title: string;
    message?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
  };
  'bgs:auth-change': {
    isAuthenticated: boolean;
    user?: Record<string, unknown>;
  };
  'bgs:theme-toggle': {
    theme: 'light' | 'dark' | 'system';
  };
}

export type MFEEventType = keyof MFEEventPayloads;

/**
 * Emit an event across the Host Shell and Remote Micro Frontends
 */
export function emitMFEEvent<K extends MFEEventType>(
  type: K,
  detail: MFEEventPayloads[K],
): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

/**
 * Listen to an event emitted by another Micro Frontend or the Host Shell.
 * Returns an unsubscribe callback for clean useEffect teardown.
 */
export function onMFEEvent<K extends MFEEventType>(
  type: K,
  handler: (detail: MFEEventPayloads[K]) => void,
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<MFEEventPayloads[K]>;
    handler(customEvent.detail);
  };

  window.addEventListener(type, listener);
  return () => {
    window.removeEventListener(type, listener);
  };
}
