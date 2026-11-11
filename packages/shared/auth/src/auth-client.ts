import { authStore } from './auth-store';

/**
 * Generate Distributed Tracing Correlation ID (X-Request-ID)
 */
export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `req-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `req-${Math.random().toString(36).substring(2, 10)}`;
}

export interface AuthFetchOptions extends RequestInit {
  skipAuth?: boolean;
  requestId?: string;
}

/**
 * Fetch HTTP Client Terstandarisasi dengan:
 * 1. Distributed Tracing (X-Request-ID header)
 * 2. Automatic Authorization Bearer token injection
 * 3. 401 Unauthorized handling & session cleanup
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: AuthFetchOptions
): Promise<Response> {
  const options: RequestInit = { ...(init || {}) };
  const headers = new Headers(options.headers || {});

  // 1. Inject Distributed Tracing ID jika belum ada
  const traceId = init?.requestId || headers.get('X-Request-ID') || generateRequestId();
  headers.set('X-Request-ID', traceId);

  // 2. Inject Authorization Bearer Token
  if (!init?.skipAuth) {
    const session = authStore.getSession();
    if (session?.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${session.token}`);
    }
  }

  // 3. Set Content-Type default jika JSON
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  options.headers = headers;

  const response = await fetch(input, options);

  // 4. Deteksi Session Expired / Token Invalid (401)
  if (response.status === 401 && !init?.skipAuth) {
    authStore.clearSession();
    if (typeof window !== 'undefined') {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${returnUrl}&reason=session_expired`;
    }
  }

  return response;
}

export default authFetch;