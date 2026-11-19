import type { UserSession } from './types';

const STORAGE_SESSION_KEY = 'mfc_auth_session';
const STORAGE_REMEMBER_KEY = 'mfc_auth_remember';
const STORAGE_DEV_BYPASS_KEY = 'mfc_dev_userbypass';
const STORAGE_ENV_BYPASS_SNAPSHOT_KEY = 'mfc_env_userbypass_snapshot';
const STORAGE_EXPIRED_FLAG_KEY = 'mfc_auth_session_expired';
const AUTH_CHANGE_EVENT = 'mfc-auth-changed';

export const ADMIN_ROLES = ['Administrator', 'Super Administrator'] as const;
export const CUSTOMER_ROLES = ['Customer', 'Client Representative'] as const;

export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return ADMIN_ROLES.some((r) => r.toLowerCase() === normalized);
}

export function isCustomerRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return CUSTOMER_ROLES.some((r) => r.toLowerCase() === normalized);
}

type AuthListener = (session: UserSession | null) => void;
const listeners = new Set<AuthListener>();

function notify(session: UserSession | null) {
  listeners.forEach((fn) => fn(session));
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: session }));
  }
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    if (
      event.key === STORAGE_SESSION_KEY ||
      event.key === STORAGE_DEV_BYPASS_KEY ||
      event.key === STORAGE_ENV_BYPASS_SNAPSHOT_KEY
    ) {
      const current = getSession();
      listeners.forEach((fn) => fn(current));
    }
  });
}

function parseEnvFlag(val: unknown): boolean | undefined {
  if (typeof val !== 'string') return undefined;
  const normalized = val.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return undefined;
}

export function getEnvBypassSetting(): boolean {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta.env as any) : undefined;
  const procEnv = typeof process !== 'undefined' ? (process.env as any) : undefined;

  const candidates = [
    parseEnvFlag(metaEnv?.VITE_USER_BYPASS),
    parseEnvFlag(metaEnv?.userbypass),
    parseEnvFlag(procEnv?.VITE_USER_BYPASS),
    parseEnvFlag(procEnv?.userbypass),
  ];

  // Jika salah satu variabel .env secara eksplisit bernilai true, bypass diizinkan
  return candidates.some((c) => c === true);
}

function isVitestEnv(): boolean {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta.env as any) : undefined;
  const procEnv = typeof process !== 'undefined' ? (process.env as any) : undefined;
  return Boolean(procEnv?.VITEST || metaEnv?.MODE === 'test');
}

/**
 * Mengecek apakah mode dev bypass aktif melalui:
 * 1. Kontrol .env: VITE_USER_BYPASS=true / 1
 * 2. Kontrol .env: userbypass=true / 1
 * 3. LocalStorage override (otomatis disinkronkan saat nilai .env berubah)
 */
export function isDevBypassEnabled(): boolean {
  const envBypass = getEnvBypassSetting();
  const envBypassStr = String(envBypass);

  if (typeof window !== 'undefined' && window.localStorage) {
    const prevSnapshot = window.localStorage.getItem(STORAGE_ENV_BYPASS_SNAPSHOT_KEY);

    if (prevSnapshot !== envBypassStr) {
      // Saat nilai .env berubah (misal true -> false atau false -> true),
      // atau boot pertama di browser nyata (migrasi cache lama), hapus stale override.
      if (prevSnapshot !== null || !isVitestEnv()) {
        window.localStorage.removeItem(STORAGE_DEV_BYPASS_KEY);
      }
      window.localStorage.setItem(STORAGE_ENV_BYPASS_SNAPSHOT_KEY, envBypassStr);
    }

    const localOverride = window.localStorage.getItem(STORAGE_DEV_BYPASS_KEY);
    if (localOverride !== null) {
      return localOverride === 'true';
    }
  }

  return envBypass;
}

/**
 * Mengubah status Dev Bypass secara dinamis dari UI (berguna untuk testing/QA)
 */
export function setDevBypass(enabled: boolean | null): void {
  if (typeof window === 'undefined') return;
  const envBypassStr = String(getEnvBypassSetting());
  window.localStorage.setItem(STORAGE_ENV_BYPASS_SNAPSHOT_KEY, envBypassStr);

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

export function hasExpiredSessionFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(STORAGE_EXPIRED_FLAG_KEY) === 'true';
  } catch {
    return false;
  }
}

export function clearExpiredSessionFlag(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_EXPIRED_FLAG_KEY);
  } catch {
    // ignore
  }
}

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
      window.sessionStorage?.setItem(STORAGE_EXPIRED_FLAG_KEY, 'true');
    }

    // 2. Cek penyimpanan tab browser (Normal Session: 30 menit)
    const sessionRaw = window.sessionStorage.getItem(STORAGE_SESSION_KEY);
    if (sessionRaw) {
      const sess: UserSession = JSON.parse(sessionRaw);
      if (sess.expiresAt > Date.now()) {
        return sess;
      }
      window.sessionStorage.removeItem(STORAGE_SESSION_KEY);
      window.sessionStorage.setItem(STORAGE_EXPIRED_FLAG_KEY, 'true');
    }
  } catch (err) {
    console.warn('Gagal membaca auth session:', err);
  }

  // Jika tidak ada sesi tapi dev bypass aktif, kembalikan mock dev user
  if (isDevBypassEnabled()) {
    return {
      ...DEV_BYPASS_USER,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
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
      clearExpiredSessionFlag();
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
    clearExpiredSessionFlag();
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
  if (isAdminRole(sess.role)) return true;
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
  getEnvBypassSetting,
  setDevBypass,
  hasExpiredSessionFlag,
  clearExpiredSessionFlag,
  isAdminRole,
  isCustomerRole,
  hasPermission,
  can,
  subscribe: subscribeAuth,
  DEV_BYPASS_USER,
};

export default authStore;
