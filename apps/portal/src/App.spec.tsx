import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { authStore } from './auth/auth-store';

describe('Portal Host App', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Reset bypass dan sesi auth ke kondisi default sebelum setiap test
    authStore.setDevBypass(null);
    authStore.clearSession();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
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

    // 4. Customer Portal (harus memiliki sesi Customer atau bypass aktif)
    authStore.setSession({
      id: 'usr-cust-demo',
      username: 'acme.enterprise',
      name: 'Acme Enterprise',
      email: 'it-lead@acme-corp.com',
      role: 'Client Representative',
      token: 'cust-demo-token',
    });

    const { unmount: unmount4 } = render(
      <MemoryRouter initialEntries={['/customer-portal']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/MFC Customer Portal/i)).toBeTruthy();
    expect(screen.getByText(/Proyek & Sprint Delivery/i)).toBeTruthy();
    unmount4();
  });

  describe('Route Guard & Dev Bypass (userbypass)', () => {
    it('redirects unauthenticated fresh visitors to /login?reason=auth_required with info notification', async () => {
      authStore.setDevBypass(false);
      authStore.clearSession();

      render(
        <MemoryRouter initialEntries={['/compUI']}>
          <App />
        </MemoryRouter>,
      );

      // Harusnya diredirect ke /login dengan pesan autentikasi diperlukan
      await waitFor(() => {
        expect(screen.getByText(/Silakan masuk terlebih dahulu untuk mengakses halaman tersebut\./i)).toBeTruthy();
        expect(screen.getByRole('button', { name: /Masuk/i })).toBeTruthy();
      });

      // Indikator Dev Bypass tidak boleh muncul
      expect(screen.queryByTestId('dev-bypass-indicator')).toBeNull();
    });

    it('redirects expired sessions to /login?reason=session_expired with warning notification', async () => {
      authStore.setDevBypass(false);
      sessionStorage.setItem(
        'mfc_auth_session',
        JSON.stringify({
          id: 'usr-old',
          username: 'old',
          name: 'Expired User',
          email: 'old@mfc.id',
          role: 'Administrator',
          token: 'expired',
          expiresAt: Date.now() - 5000,
        }),
      );

      render(
        <MemoryRouter initialEntries={['/compUI']}>
          <App />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText(/Sesi Anda telah berakhir\. Silakan login kembali\./i)).toBeTruthy();
      });
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

    it('allows access to protected routes when user has valid logged-in session and shows PortalHeader with Logout button', async () => {
      authStore.setDevBypass(false);
      authStore.setSession({
        id: 'usr-admin-1',
        username: 'superadmin',
        name: 'Principal Administrator',
        email: 'admin@bgs-software.id',
        role: 'Super Administrator',
        token: 'valid-jwt-token',
      });

      render(
        <MemoryRouter initialEntries={['/compUI']}>
          <App />
        </MemoryRouter>,
      );

      // Tidak dialihkan ke login & tampilkan user aktif di PortalHeader
      await waitFor(() => {
        expect(screen.getByTestId('portal-active-user')).toHaveTextContent('Principal Administrator');
        expect(screen.getByTestId('portal-logout-btn')).toBeTruthy();
      });
      expect(screen.queryByTestId('dev-bypass-indicator')).toBeNull();

      // Klik tombol Logout mengembalikan user ke /login?reason=logged_out
      fireEvent.click(screen.getByTestId('portal-logout-btn'));
      await waitFor(() => {
        expect(screen.getByText(/Anda telah keluar dari sistem\./i)).toBeTruthy();
        expect(authStore.getSession()).toBeNull();
      });
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

    it('allows Customer and Client Representative roles to access /customer-portal when bypass is off', async () => {
      authStore.setDevBypass(false);
      authStore.setSession({
        id: 'usr-cust-1',
        username: 'budi_client',
        name: 'Budi Santoso',
        email: 'budi@ptmaju.co.id',
        role: 'Client Representative',
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

  describe('Strict Backend Login Validation & Notifications (userbypass=false)', () => {
    it('displays inline validation error when submitting empty credentials without native silent blocking', async () => {
      authStore.setDevBypass(false);
      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>,
      );

      fireEvent.click(screen.getByRole('button', { name: /^Masuk$/i }));

      await waitFor(() => {
        expect(screen.getByTestId('login-error-alert')).toBeTruthy();
        expect(screen.getAllByText(/Email atau username wajib diisi\./i).length).toBeGreaterThan(0);
      });
    });

    it('rejects all login attempts with clear connection error when Backend API is offline', async () => {
      authStore.setDevBypass(false);
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>,
      );

      // Saat baru membuka halaman, tidak ada kotak error besar yang mengganggu form
      await waitFor(() => {
        expect(screen.getByTestId('status-api-pill')).toHaveTextContent(/\[ API: OFFLINE \]/i);
      });
      expect(screen.queryByTestId('login-error-alert')).toBeNull();
      expect(screen.queryByTestId('api-offline-notice')).toBeNull();

      fireEvent.change(screen.getByLabelText(/Email \/ Username/i), {
        target: { value: 'admin@bgs-software.id' },
      });
      fireEvent.change(screen.getByPlaceholderText(/••••••••••••/i), {
        target: { value: 'Password123!' },
      });
      fireEvent.click(screen.getByRole('button', { name: /^Masuk$/i }));

      await waitFor(() => {
        const alert = screen.getByTestId('login-error-alert');
        expect(alert).toHaveTextContent(/Koneksi ke Server Gagal/i);
        expect(alert).toHaveTextContent(/Pastikan Backend API sedang berjalan/i);
      });
      expect(authStore.getSession()).toBeNull();
    });

    it('displays 401 error message from backend and blocks wrong password even for admin usernames', async () => {
      authStore.setDevBypass(false);
      globalThis.fetch = vi.fn().mockImplementation((url: any) => {
        const u = String(url);
        if (u.includes('/auth/health')) {
          return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
        }
        if (u.includes('/auth/login')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({ statusCode: 401, message: 'Email atau password tidak valid.' }),
              { status: 401 },
            ),
          );
        }
        return Promise.reject(new Error('not found'));
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/Email \/ Username/i), {
        target: { value: 'admin@bgs-software.id' },
      });
      fireEvent.change(screen.getByPlaceholderText(/••••••••••••/i), {
        target: { value: 'WrongPassword!' },
      });
      fireEvent.click(screen.getByRole('button', { name: /^Masuk$/i }));

      await waitFor(() => {
        const alert = screen.getByTestId('login-error-alert');
        expect(alert).toHaveTextContent(/Kredensial Tidak Valid/i);
        expect(alert).toHaveTextContent(/Email atau password tidak valid\./i);
      });
      expect(authStore.getSession()).toBeNull();
    });

    it('displays 403 disabled account error with link to recovery page', async () => {
      authStore.setDevBypass(false);
      globalThis.fetch = vi.fn().mockImplementation((url: any) => {
        const u = String(url);
        if (u.includes('/auth/health')) {
          return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
        }
        if (u.includes('/auth/login')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                statusCode: 403,
                message: 'Akun Anda telah dinonaktifkan. Silakan hubungi administrator.',
              }),
              { status: 403 },
            ),
          );
        }
        return Promise.reject(new Error('not found'));
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/Email \/ Username/i), {
        target: { value: 'inactive@bgs-software.id' },
      });
      fireEvent.change(screen.getByPlaceholderText(/••••••••••••/i), {
        target: { value: 'Password123!' },
      });
      fireEvent.click(screen.getByRole('button', { name: /^Masuk$/i }));

      await waitFor(() => {
        const alert = screen.getByTestId('login-error-alert');
        expect(alert).toHaveTextContent(/Akun Dinonaktifkan/i);
        expect(screen.getByText(/Lihat Info Pemulihan Akun/i)).toBeTruthy();
      });
    });

    it('authenticates against normalized /api/auth/login without /api/api double prefix and navigates on 200 OK', async () => {
      authStore.setDevBypass(false);
      const requestedUrls: string[] = [];

      globalThis.fetch = vi.fn().mockImplementation((url: any) => {
        const u = String(url);
        requestedUrls.push(u);
        if (u.includes('/auth/health')) {
          return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
        }
        if (u.endsWith('/api/auth/login')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                success: true,
                accessToken: 'jwt-valid-token',
                user: {
                  id: 'usr-1',
                  username: 'superadmin',
                  name: 'Principal Administrator',
                  email: 'admin@bgs-software.id',
                  role: 'Super Administrator',
                  permissions: ['users:view'],
                },
              }),
              { status: 200 },
            ),
          );
        }
        return Promise.reject(new Error('unexpected url: ' + u));
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/Email \/ Username/i), {
        target: { value: 'admin@bgs-software.id' },
      });
      fireEvent.change(screen.getByPlaceholderText(/••••••••••••/i), {
        target: { value: 'Password123!' },
      });
      fireEvent.click(screen.getByRole('button', { name: /^Masuk$/i }));

      await waitFor(() => {
        expect(screen.getByTestId('portal-active-user')).toHaveTextContent('Principal Administrator');
      });

      // Pastikan tidak pernah menembak /api/api/auth/login
      expect(requestedUrls.some((u) => u.includes('/api/api/'))).toBe(false);
      expect(requestedUrls.some((u) => u.endsWith('/api/auth/login'))).toBe(true);
      expect(authStore.getToken()).toBe('jwt-valid-token');
    });
  });
});
