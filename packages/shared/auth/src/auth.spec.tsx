import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { authStore } from './auth-store';
import { hasUserPermission, canUser } from './use-permission';
import { Can } from './can';
import { authFetch } from './auth-client';
import type { UserSession } from './types';

describe('@org/auth - Centralized Auth & Authorization', () => {
  const mockStaffUser: Omit<UserSession, 'expiresAt'> = {
    id: 'usr-staff-1',
    username: 'staff_user',
    name: 'Staff User',
    email: 'staff@mfc.id',
    role: 'Staff',
    token: 'mock-jwt-token',
    permissions: ['users:view', 'users:create'],
  };

  const origMetaEnv = { ...(import.meta.env as any) };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Nonaktifkan dev bypass default di unit test agar bisa menguji status unauthenticated & RBAC
    authStore.setDevBypass(false);
  });

  afterEach(() => {
    (import.meta.env as any).VITE_USER_BYPASS = origMetaEnv.VITE_USER_BYPASS;
    (import.meta.env as any).userbypass = origMetaEnv.userbypass;
  });

  describe('authStore & .env userbypass sync', () => {
    it('initializes logged out when storage is empty and bypass is false', () => {
      authStore.logout();
      expect(authStore.isAuthenticated()).toBe(false);
      expect(authStore.getUser()).toBeNull();
    });

    it('logs in user and saves to storage with expiration', () => {
      authStore.login(mockStaffUser, 'mock-jwt-token', false);
      expect(authStore.isAuthenticated()).toBe(true);
      expect(authStore.getUser()?.username).toBe('staff_user');
      expect(authStore.getToken()).toBe('mock-jwt-token');

      // Logout clears session
      authStore.logout();
      expect(authStore.isAuthenticated()).toBe(false);
      expect(authStore.getUser()).toBeNull();
    });

    it('supports dev bypass mode when setDevBypass(true)', () => {
      authStore.setDevBypass(true);

      expect(authStore.isDevBypass()).toBe(true);
      expect(authStore.isAuthenticated()).toBe(true);
      expect(authStore.getUser()?.role).toBe('Administrator');
    });

    it('clears stale false override when .env switches to userbypass=true so bypass is never blocked', () => {
      // Simulasi kondisi user sebelumnya menekan "Uji Login Asli" saat .env false
      (import.meta.env as any).VITE_USER_BYPASS = 'false';
      (import.meta.env as any).userbypass = 'false';
      authStore.setDevBypass(false);
      expect(authStore.isDevBypass()).toBe(false);

      // User mengubah .env menjadi userbypass=true (atau VITE_USER_BYPASS=true)
      (import.meta.env as any).userbypass = 'true';
      expect(authStore.isDevBypass()).toBe(true);
      expect(authStore.isAuthenticated()).toBe(true);
    });

    it('clears stale true override when .env switches to userbypass=false', () => {
      (import.meta.env as any).VITE_USER_BYPASS = 'true';
      (import.meta.env as any).userbypass = 'true';
      authStore.setDevBypass(true);
      expect(authStore.isDevBypass()).toBe(true);

      // User mengubah .env menjadi false
      (import.meta.env as any).VITE_USER_BYPASS = 'false';
      (import.meta.env as any).userbypass = 'false';
      expect(authStore.isDevBypass()).toBe(false);
      expect(authStore.isAuthenticated()).toBe(false);
    });

    it('grants wildcard permissions for Super Administrator role in store', () => {
      authStore.setSession({
        id: 'usr-sa-1',
        username: 'superadmin',
        name: 'Principal Administrator',
        email: 'admin@bgs-software.id',
        role: 'Super Administrator',
        token: 'sa-token',
        permissions: [],
      });

      expect(authStore.hasPermission('billing:delete')).toBe(true);
      expect(authStore.can('delete', 'users')).toBe(true);
    });
  });

  describe('usePermission helpers', () => {
    it('checks permission by exact ID for non-admin user', () => {
      expect(hasUserPermission(mockStaffUser, 'users:view')).toBe(true);
      expect(hasUserPermission(mockStaffUser, 'billing:delete')).toBe(false);
    });

    it('checks permission by action and module for non-admin user', () => {
      expect(canUser(mockStaffUser, 'view', 'users')).toBe(true);
      expect(canUser(mockStaffUser, 'delete', 'billing')).toBe(false);
    });

    it('grants all permissions for Super Administrator role', () => {
      const superAdmin = {
        id: 'usr-sa',
        username: 'sa',
        name: 'Super Admin',
        email: 'sa@mfc.id',
        role: 'Super Administrator',
        permissions: [],
      };
      expect(hasUserPermission(superAdmin, 'anything:action')).toBe(true);
      expect(canUser(superAdmin, 'destroy', 'anything')).toBe(true);
    });
  });

  describe('<Can /> declarative component', () => {
    it('renders children when permission matches', () => {
      authStore.login(mockStaffUser, 'token');
      render(
        <Can I="create" this="users">
          <button data-testid="create-btn">Create User</button>
        </Can>
      );
      expect(screen.getByTestId('create-btn')).toBeInTheDocument();
    });

    it('renders fallback or nothing when permission does not match', () => {
      authStore.login(mockStaffUser, 'token');
      render(
        <Can I="delete" this="billing" fallback={<span data-testid="no-access">No Access</span>}>
          <button>Delete Billing</button>
        </Can>
      );
      expect(screen.queryByText('Delete Billing')).not.toBeInTheDocument();
      expect(screen.getByTestId('no-access')).toBeInTheDocument();
    });
  });

  describe('authFetch distributed tracing & token injection', () => {
    it('injects Authorization Bearer and X-Request-ID headers', async () => {
      authStore.login(mockStaffUser, 'bearer-token-123');

      let capturedHeaders: HeadersInit | undefined;
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation((url, init) => {
        capturedHeaders = init?.headers;
        return Promise.resolve(new Response(JSON.stringify({ ok: true })));
      });

      try {
        await authFetch('/api/users');
        expect(capturedHeaders).toBeDefined();
        const headers = new Headers(capturedHeaders);
        expect(headers.get('Authorization')).toBe('Bearer bearer-token-123');
        expect(headers.get('X-Request-ID')).toMatch(/^req-/);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('does not clear session or redirect on 401 when dev bypass is active', async () => {
      authStore.setDevBypass(true);
      const clearSpy = vi.spyOn(authStore, 'clearSession');
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));

      try {
        const res = await authFetch('/api/protected');
        expect(res.status).toBe(401);
        expect(clearSpy).not.toHaveBeenCalled();
        expect(authStore.isAuthenticated()).toBe(true);
      } finally {
        global.fetch = originalFetch;
        clearSpy.mockRestore();
      }
    });
  });
});
