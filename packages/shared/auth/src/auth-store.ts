import type { UserSession } from './types';

const STORAGE_SESSION_KEY = 'mfc_auth_session';
const STORAGE_REMEMBER_KEY = 'mfc_auth_remember';
const STORAGE_DEV_BYPASS_KEY = 'mfc_dev_userbypass';

type AuthListener = (session: UserSession | null) => void;
const listeners = new Set<AuthListener>();

function notify(session: UserSession | null) {
  listeners.forEach((fn) => fn(session));
}

/**
 * Mengecek apakah mode dev bypass aktif melalui:
 * 1. Kontrol .env: VITE_USER_BYPASS=true / 1
 * 2. Kontrol .env: userbypass=true / 1
 * 3. LocalStorage override untuk pengujian cepat di browser
 */
export function isDevBypassEnabled(): boolean {
  if (typeof window !== 'undefined' && window.localStorage) {
    const localOverride = window.localStorage.getItem(STORAGE_DEV_BYPASS_KEY);
    if (localOverride !== null) {
      return localOverride === 'true';
    }
  }

  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta.env as any) : undefined;
  const procEnv = typeof process !== 'undefined' ? (process.env as any) : undefined;

  const viteBypass =
    metaEnv?.VITE_USER_BYPASS === 'true' ||
    metaEnv?.VITE_USER_BYPASS === '1' ||
    metaEnv?.userbypass === 'true' ||
    metaEnv?.userbypass === '1' ||
    procEnv?.VITE_USER_BYPASS === 'true' ||
    procEnv?.userbypass === 'true';

  return Boolean(viteBypass);
}

/**
 * Mengubah status Dev Bypass secara dinamis dari UI (berguna untuk testing/QA)
 */
export function setDevBypass(enabled: boolean | null): void {
  if (typeof window === 'undefined') return;
  if (enabled === null) {
    window.localStorage.removeItem(STORAGE_DEV_BYPASS_KEY);
  } else {
    window.localStorage.setItem(STORAGE_DEV_BYPASS_KEY, String(enabled));
  }
  notify(getSession());
}

/**
 * Default mock user untuk development bypass mode (Superadmin lengkap hak akses)
 */
export const DEV_BYPASS_USER: UserSession = {
  id: 'usr-dev-bypass',
  username: 'dev_admin',
  name: 'Developer (Bypass Mode)',
  email: 'dev@mfc.id',
  role: 'Administrator',
  permissions: ['*:*'], // Full wildcard permissions
  token: 'dev-bypass-token-2026',
  rememberMe: true,
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
};

/**
 * Mengambil sesi pengguna aktif
 */
export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Cek penyimpanan persisten (Remember Me: 7 hari)
    const persistentRaw = window.localStorage.getItem(STORAGE_SESSION_KEY);
    if (persistentRaw) {
      const sess: UserSession = JSON.parse(persistentRaw);
      if (sess.expiresAt > Date.now()) {
        return sess;
      }
      window.localStorage.removeItem(STORAGE_SESSION_KEY);
    }

    // 2. Cek penyimpanan tab browser (Normal Session: 30 menit)
    const sessionRaw = window.sessionStorage.getItem(STORAGE_SESSION_KEY);
    if (sessionRaw) {
      const sess: UserSession = JSON.parse(sessionRaw);
      if (sess.expiresAt > Date.now()) {
        return sess;
      }
      window.sessionStorage.removeItem(STORAGE_SESSION_KEY);
    }
  } catch (err) {
    console.warn('Gagal membaca auth session:', err);
  }

  // Jika tidak ada sesi tapi dev bypass aktif, kembalikan mock dev user
  if (isDevBypassEnabled()) {
    return DEV_BYPASS_USER;
  }

  return null;
}

/**
 * Menyimpan sesi login baru
 */
export function setSession(
  user: Omit<UserSession, 'expiresAt'>,
  rememberMe: boolean = false
): UserSession {
  const durationMs = rememberMe
    ? 7 * 24 * 60 * 60 * 1000 // 7 hari
    : 30 * 60 * 1000;         // 30 menit

  const session: UserSession = {
    ...user,
    rememberMe,
    expiresAt: Date.now() + durationMs,
  };

  try {
    if (typeof window !== 'undefined') {
      const serialized = JSON.stringify(session);
      if (rememberMe) {
        window.localStorage.setItem(STORAGE_SESSION_KEY, serialized);
        window.localStorage.setItem(STORAGE_REMEMBER_KEY, 'true');
        window.sessionStorage.removeItem(STORAGE_SESSION_KEY);
      } else {
        window.sessionStorage.setItem(STORAGE_SESSION_KEY, serialized);
        window.localStorage.removeItem(STORAGE_SESSION_KEY);
        window.localStorage.removeItem(STORAGE_REMEMBER_KEY);
      }
    }
  } catch (err) {
    console.warn('Gagal menyimpan sesi:', err);
  }

  notify(session);
  return session;
}

/**
 * Menghapus sesi aktif (Logout)
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_SESSION_KEY);
    window.localStorage.removeItem(STORAGE_REMEMBER_KEY);
    window.sessionStorage.removeItem(STORAGE_SESSION_KEY);
  }
  notify(null);
}

/**
 * Memeriksa apakah pengguna memiliki otentikasi valid
 */
export function isAuthenticated(): boolean {
  if (isDevBypassEnabled()) return true;
  const sess = getSession();
  return sess !== null && sess.expiresAt > Date.now();
}

/**
 * Pengecekan izin granular (Fine-Grained RBAC / ABAC)
 */
export function hasPermission(permissionId: string): boolean {
  if (isDevBypassEnabled()) return true;
  const sess = getSession();
  if (!sess) return false;
  if (sess.role === 'Administrator') return true;
  if (!sess.permissions || sess.permissions.length === 0) return false;
  if (sess.permissions.includes('*:*')) return true;

  return sess.permissions.includes(permissionId);
}

/**
 * Helper izin tindakan dan modul (contoh: can('create', 'users'))
 */
export function can(action: string, module: string): boolean {
  return hasPermission(`${module}:${action}`);
}

export function subscribeAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const authStore = {
  getSession,
  setSession,
  clearSession,
  login: (user: Omit<UserSession, 'expiresAt'>, token?: string, rememberMe: boolean = false) => {
    return setSession({ ...user, token: token || user.token }, rememberMe);
  },
  logout: clearSession,
  getUser: () => getSession(),
  getToken: () => getSession()?.token || null,
  isAuthenticated,
  isDevBypassEnabled,
  isDevBypass: isDevBypassEnabled,
  setDevBypass,
  hasPermission,
  can,
  subscribe: subscribeAuth,
  DEV_BYPASS_USER,
};

export default authStore;