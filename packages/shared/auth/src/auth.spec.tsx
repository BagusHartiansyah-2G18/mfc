import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { authStore } from './auth-store';
import { hasUserPermission, canUser } from './use-permission';
import { Can } from './can';
import { authFetch } from './auth-client';
import type { UserProfile } from './types';

describe('@org/auth - Centralized Auth & Authorization', () => {
  const mockStaffUser: UserProfile = {
    id: 'usr-staff-1',
    username: 'staff_user',
    name: 'Staff User',
    email: 'staff@mfc.id',
    role: 'Staff',
    permissions: ['users:view', 'users:create'],
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Nonaktifkan dev bypass default di unit test agar bisa menguji status unauthenticated & RBAC
    localStorage.setItem('mfc_dev_userbypass', 'false');
  });

  describe('authStore', () => {
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

    it('supports dev bypass mode when userbypass=true', () => {
      localStorage.setItem('mfc_dev_userbypass', 'true');

      expect(authStore.isDevBypass()).toBe(true);
      expect(authStore.isAuthenticated()).toBe(true);
      expect(authStore.getUser()?.role).toBe('Administrator');
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
      const superAdmin: UserProfile = {
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
  });
});
