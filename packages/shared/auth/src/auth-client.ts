import { authStore, isDevBypassEnabled } from './auth-store';

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

let isRefreshing = false;
let refreshSubscribers: Array<(newToken: string | null) => void> = [];

function onTokenRefreshed(newToken: string | null) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (newToken: string | null) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Pemanggilan senyap untuk memperbarui token ke Auth Service (:3001)
 */
export async function silentRefreshToken(): Promise<string | null> {
  const session = authStore.getSession();
  const refreshToken =
    session?.refreshToken ||
    (typeof window !== 'undefined' ? window.localStorage.getItem('mfc_auth_refresh_token') : null);

  if (!refreshToken) return null;

  try {
    const res = await fetch('http://localhost:3001/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    if (json.success && json.accessToken && json.user) {
      authStore.setSession(
        {
          ...json.user,
          token: json.accessToken,
          refreshToken: json.refreshToken || refreshToken,
        },
        true
      );
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('mfc_auth_refresh_token', json.refreshToken || refreshToken);
      }
      return json.accessToken;
    }
  } catch (err) {
    console.warn('[authFetch] Gagal silent refresh token:', err);
  }
  return null;
}

/**
 * Fetch HTTP Client Terstandarisasi dengan:
 * 1. Distributed Tracing (X-Request-ID header)
 * 2. Automatic Authorization Bearer token injection
 * 3. Silent Refresh Token & Transparent Request Replay pada HTTP 401
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: AuthFetchOptions
): Promise<Response> {
  const options: RequestInit = { ...(init || {}) };
  const headers = new Headers(options.headers || {});

  // 1. Inject Distributed Tracing ID jika belum ada (hindari pada request publik skipAuth agar tetap Simple Request)
  if (!init?.skipAuth || init?.requestId) {
    const traceId = init?.requestId || headers.get('X-Request-ID') || generateRequestId();
    headers.set('X-Request-ID', traceId);
  }

  // 2. Inject Authorization Bearer Token
  if (!init?.skipAuth) {
    let session = authStore.getSession();
    // Jika tidak ada active access token tapi ada refresh token, lakukan silent refresh awal
    if (!session?.token && typeof window !== 'undefined') {
      const hasRefreshToken = Boolean(
        session?.refreshToken || window.localStorage.getItem('mfc_auth_refresh_token')
      );
      if (hasRefreshToken) {
        await silentRefreshToken();
        session = authStore.getSession();
      }
    }

    if (session?.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${session.token}`);
    }
  }

  // 3. Set Content-Type default jika JSON
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  options.headers = headers;

  let response = await fetch(input, options);

  // 4. Deteksi Session Expired / Token Invalid (HTTP 401)
  // Lakukan Silent Refresh & Replay secara transparan
  if (response.status === 401 && !init?.skipAuth && !isDevBypassEnabled()) {
    const session = authStore.getSession();
    const hasRefresh = Boolean(session?.refreshToken);

    if (hasRefresh) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await silentRefreshToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);

        if (newToken) {
          // Replay request awal dengan token baru
          headers.set('Authorization', `Bearer ${newToken}`);
          options.headers = headers;
          return await fetch(input, options);
        }
      } else {
        // Antre request paralel ke promise subscriber
        const retryResponse = await new Promise<Response>((resolve) => {
          addRefreshSubscriber(async (newToken) => {
            if (newToken) {
              headers.set('Authorization', `Bearer ${newToken}`);
              options.headers = headers;
              resolve(await fetch(input, options));
            } else {
              resolve(response);
            }
          });
        });
        return retryResponse;
      }
    }

    // Hanya jika refresh token gagal total atau tidak ada sama sekali
    authStore.clearSession();
  }

  return response;
}

export default authFetch;
