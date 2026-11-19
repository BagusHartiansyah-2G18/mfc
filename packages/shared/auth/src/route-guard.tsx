import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import {
  authStore,
  isDevBypassEnabled,
  setDevBypass,
  hasPermission,
  hasExpiredSessionFlag,
  isAdminRole,
  isCustomerRole,
} from './auth-store';
import type { UserSession } from './types';

export interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  redirectTo?: string;
}

function matchesAllowedRole(userRole: string | undefined, allowedRoles: string[]): boolean {
  if (!userRole) return false;
  const normalizedUserRole = userRole.trim().toLowerCase();

  return allowedRoles.some((allowed) => {
    const normalizedAllowed = allowed.trim().toLowerCase();
    if (normalizedAllowed === normalizedUserRole) return true;
    if (isAdminRole(allowed) && isAdminRole(userRole)) return true;
    if (isCustomerRole(allowed) && isCustomerRole(userRole)) return true;
    return false;
  });
}

export function RouteGuard({
  children,
  allowedRoles,
  requiredPermissions,
  redirectTo = '/login',
}: RouteGuardProps) {
  const location = useLocation();
  const [session, setSession] = useState<UserSession | null>(() => authStore.getSession());
  const [isBypass, setIsBypass] = useState<boolean>(() => isDevBypassEnabled());
  const [showDevPill, setShowDevPill] = useState(true);

  useEffect(() => {
    const syncState = (newSess: UserSession | null) => {
      setSession(newSess);
      setIsBypass(isDevBypassEnabled());
    };
    const unsubscribe = authStore.subscribe(syncState);
    return () => unsubscribe();
  }, []);

  const authenticated = isBypass || (session !== null && session.expiresAt > Date.now());

  // 1. Jika pengguna belum terotentikasi dan Dev Bypass tidak aktif
  if (!authenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    const reason = hasExpiredSessionFlag() ? 'session_expired' : 'auth_required';
    return (
      <Navigate
        to={`${redirectTo}?redirect=${returnUrl}&reason=${reason}`}
        replace
      />
    );
  }

  // 2. Jika ada pembatasan hak akses berbasis peran (RBAC) - dilewati bila dev bypass aktif
  if (allowedRoles && allowedRoles.length > 0 && !isBypass) {
    const hasRole = matchesAllowedRole(session?.role, allowedRoles);
    if (!hasRole) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  // 3. Jika ada pembatasan hak akses berbasis permission granular - dilewati bila dev bypass aktif
  if (requiredPermissions && requiredPermissions.length > 0 && !isBypass) {
    const hasAllPermissions = requiredPermissions.every((p) => hasPermission(p));
    if (!hasAllPermissions) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return (
    <>
      {/* Dev Bypass Floating Indicator (Hanya muncul saat mode dev bypass aktif) */}
      {isBypass && showDevPill && (
        <div
          data-testid="dev-bypass-indicator"
          className="fixed bottom-3 right-3 z-50 flex items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-500/10 dark:bg-amber-950/80 px-3 py-1.5 text-xs text-amber-900 dark:text-amber-200 shadow-lg backdrop-blur-md animate-in fade-in"
        >
          <div className="flex items-center gap-1.5 font-bold font-mono text-[11px]">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>DEV BYPASS: ON</span>
          </div>

          <div className="flex items-center gap-1 pl-1 border-l border-amber-300 dark:border-amber-700">
            <button
              type="button"
              onClick={() => {
                setDevBypass(false);
                window.location.reload();
              }}
              title="Nonaktifkan bypass dan uji login normal"
              className="px-1.5 py-0.5 rounded text-[10px] bg-amber-200/80 dark:bg-amber-900 hover:bg-amber-300 dark:hover:bg-amber-800 font-semibold transition-colors cursor-pointer"
            >
              Uji Login Asli
            </button>
            <button
              type="button"
              onClick={() => setShowDevPill(false)}
              className="p-0.5 text-amber-700 dark:text-amber-300 hover:opacity-75 cursor-pointer"
              title="Sembunyikan badge"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {children}
    </>
  );
}

export default RouteGuard;
