import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { authStore } from './auth/auth-store';

describe('Portal Host App', () => {
  beforeEach(() => {
    // Reset bypass dan sesi auth ke kondisi default sebelum setiap test
    authStore.setDevBypass(null);
    authStore.clearSession();
  });
  it('renders public promotional landing page at root', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    // Public Header and Hero
    expect(screen.getByRole('heading', { name: /Bangun Software Kualitas Tinggi/i })).toBeTruthy();
    expect(screen.getAllByText(/Custom Web Application/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /Formulir Estimasi Proyek/i })).toBeTruthy();
  });

  it('renders 404 card for unknown routes', async () => {
    render(
      <MemoryRouter initialEntries={['/unknown-path-xyz']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/404 - Halaman Tidak Ditemukan/i)).toBeTruthy();
    });
  });

  it('renders MFC split-screen login page with trust indicators, form, and SSO at /login', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    // Left section: Headline & branding
    expect(screen.getByText(/Build Better Software\./i)).toBeTruthy();
    expect(screen.getByText(/Accelerate Your Business\./i)).toBeTruthy();
    expect(screen.getAllByText(/Trusted Partner for Digital Transformation/i).length).toBeGreaterThan(0);

    // Trust indicators
    expect(screen.getByText(/Secure Authentication/i)).toBeTruthy();
    expect(screen.getByText(/Role Based Access/i)).toBeTruthy();
    expect(screen.getByText(/Activity Audit Logging/i)).toBeTruthy();
    expect(screen.getByText(/Enterprise Ready Solutions/i)).toBeTruthy();

    // Right section: Form inputs
    expect(screen.getByLabelText(/Email \/ Username/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/••••••••••••/i)).toBeTruthy();
    expect(screen.getByText(/Ingat Saya \(Remember Me\)/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Masuk/i })).toBeTruthy();

    // SSO buttons
    expect(screen.getByRole('button', { name: /Microsoft/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Google/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /GitHub/i })).toBeTruthy();

    // Environment information
    expect(screen.getByText(/\[ DEVELOPMENT ENVIRONMENT \]/i)).toBeTruthy();
  });

  it('renders forgot password, reset password, access denied, and customer portal routes', async () => {
    // 1. Forgot password
    const { unmount: unmount1 } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Lupa Password\?/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Kirim Link Reset Password/i })).toBeTruthy();
    unmount1();

    // 2. Reset password
    const { unmount: unmount2 } = render(
      <MemoryRouter initialEntries={['/reset-password?token=valid-token']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Atur Ulang Kata Sandi/i)).toBeTruthy();
    expect(screen.getByText(/Kriteria Keamanan Kata Sandi/i)).toBeTruthy();
    unmount2();

    // 3. Access denied
    const { unmount: unmount3 } = render(
      <MemoryRouter initialEntries={['/access-denied']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/403 - Akses Ditolak/i)).toBeTruthy();
    expect(screen.getByText(/Anda tidak memiliki hak akses ke halaman ini\./i)).toBeTruthy();
    unmount3();

    // 4. Customer Portal
    const { unmount: unmount4 } = render(
      <MemoryRouter initialEntries={['/customer-portal']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/MFC Customer Portal/i)).toBeTruthy();
    expect(screen.getByText(/Proyek & Sprint Delivery/i)).toBeTruthy();
    unmount4();
  });

  describe('Route Guard & Dev Bypass (userbypass=true)', () => {
    it('redirects unauthenticated users to /login?reason=session_expired when dev bypass is off', async () => {
      authStore.setDevBypass(false);
      authStore.clearSession();

      render(
        <MemoryRouter initialEntries={['/compUI']}>
          <App />
        </MemoryRouter>,
      );

      // Harusnya diredirect ke /login dengan pesan sesi expired
      await waitFor(() => {
        expect(screen.getByText(/Sesi Anda telah berakhir/i)).toBeTruthy();
        expect(screen.getByRole('button', { name: /Masuk/i })).toBeTruthy();
      });

      // Indikator Dev Bypass tidak boleh muncul
      expect(screen.queryByTestId('dev-bypass-indicator')).toBeNull();
    });

    it('allows direct access to /compUI when dev bypass is on (userbypass=true) and shows badge', async () => {
      authStore.setDevBypass(true);

      render(
        <MemoryRouter initialEntries={['/compUI']}>
          <App />
        </MemoryRouter>,
      );

      // Indikator Dev Bypass harus muncul di pojok kanan bawah
      await waitFor(() => {
        expect(screen.getByTestId('dev-bypass-indicator')).toBeTruthy();
        expect(screen.getByText(/DEV BYPASS: ON/i)).toBeTruthy();
      });

      // Tidak boleh dialihkan ke login
      expect(screen.queryByText(/Email \/ Username/i)).toBeNull();
    });

    it('allows access to protected routes when user has valid logged-in session', async () => {
      authStore.setDevBypass(false);
      authStore.setSession({
        id: 'usr-admin-1',
        username: 'admin',
        name: 'Super Admin',
        email: 'admin@mfc.id',
        role: 'Administrator',
        token: 'valid-jwt-token',
      });

      render(
        <MemoryRouter initialEntries={['/compUI']}>
          <App />
        </MemoryRouter>,
      );

      // Tidak dialihkan ke login
      expect(screen.queryByText(/Email \/ Username/i)).toBeNull();
      // Dev bypass badge tidak muncul
      expect(screen.queryByTestId('dev-bypass-indicator')).toBeNull();
    });

    it('enforces RBAC on /customer-portal when bypass is off and role does not match', async () => {
      authStore.setDevBypass(false);
      // User dengan peran Staff mencoba membuka customer portal
      authStore.setSession({
        id: 'usr-staff-1',
        username: 'staff',
        name: 'Staff Member',
        email: 'staff@mfc.id',
        role: 'Staff',
        token: 'staff-token',
      });

      render(
        <MemoryRouter initialEntries={['/customer-portal']}>
          <App />
        </MemoryRouter>,
      );

      // Dialihkan ke /access-denied
      await waitFor(() => {
        expect(screen.getByText(/403 - Akses Ditolak/i)).toBeTruthy();
        expect(screen.getByText(/Anda tidak memiliki hak akses ke halaman ini\./i)).toBeTruthy();
      });
    });

    it('allows Customer role to access /customer-portal when bypass is off', async () => {
      authStore.setDevBypass(false);
      authStore.setSession({
        id: 'usr-cust-1',
        username: 'budi_client',
        name: 'Budi Santoso',
        email: 'budi@ptmaju.co.id',
        role: 'Customer',
        token: 'cust-token',
      });

      render(
        <MemoryRouter initialEntries={['/customer-portal']}>
          <App />
        </MemoryRouter>,
      );

      // Customer portal terbuka
      await waitFor(() => {
        expect(screen.getByText(/MFC Customer Portal/i)).toBeTruthy();
        expect(screen.getByText(/Budi Santoso/i)).toBeTruthy();
      });
    });
  });
});
