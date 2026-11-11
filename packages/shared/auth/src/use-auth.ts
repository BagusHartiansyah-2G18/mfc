import { useState, useEffect } from 'react';
import {
  authStore,
  getSession,
  setSession,
  clearSession,
  isDevBypassEnabled,
  setDevBypass,
} from './auth-store';
import type { UserSession } from './types';

export function useAuth() {
  const [session, setSessionState] = useState<UserSession | null>(() => getSession());
  const [isBypass, setIsBypass] = useState<boolean>(() => isDevBypassEnabled());

  useEffect(() => {
    const unsubscribe = authStore.subscribe((newSess) => {
      setSessionState(newSess);
      setIsBypass(isDevBypassEnabled());
    });
    return () => unsubscribe();
  }, []);

  const authenticated = isBypass || (session !== null && session.expiresAt > Date.now());

  return {
    session,
    user: session,
    isAuthenticated: authenticated,
    isDevBypass: isBypass,
    role: session?.role,
    permissions: session?.permissions ?? [],
    setSession,
    logout: clearSession,
    setDevBypass,
  };
}

export default useAuth;