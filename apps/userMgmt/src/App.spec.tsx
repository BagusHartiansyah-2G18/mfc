import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { userMgmtStore } from './store/user-mgmt-store';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

describe('User Management Remote MFE', () => {
  beforeEach(() => {
    userMgmtStore.resetToDefault();
  });

  it('renders user management header and default user list with hidden password', () => {
    render(
      <MemoryRouter>
        <App basePath="" />
      </MemoryRouter>
    );

    // Title
    expect(screen.getByText(/User & Access Management/i)).toBeTruthy();

    // Default users from seed
    expect(screen.getByText(/Principal Administrator/i)).toBeTruthy();
    expect(screen.getByText(/@superadmin/i)).toBeTruthy();

    // Password must be hidden
    const hiddenMasks = screen.getAllByText(/••••••••/);
    expect(hiddenMasks.length).toBeGreaterThan(0);
    const hiddenBadges = screen.getAllByText(/Hidden/i);
    expect(hiddenBadges.length).toBeGreaterThan(0);
  });

  it('navigates to Roles tab and displays list of roles', () => {
    render(
      <MemoryRouter>
        <App basePath="" />
      </MemoryRouter>
    );

    const roleTabButton = screen.getByRole('button', { name: /Role \(/i });
    fireEvent.click(roleTabButton);

    expect(screen.getByText(/Daftar Role Akses Sistem/i)).toBeTruthy();
    expect(screen.getByText(/Super Administrator/i)).toBeTruthy();
    expect(screen.getByText(/Technical Project Manager/i)).toBeTruthy();
    expect(screen.getByText(/Senior Software Engineer/i)).toBeTruthy();
  });

  it('navigates to Permission Matrix and toggles select all for a module', () => {
    render(
      <MemoryRouter>
        <App basePath="" />
      </MemoryRouter>
    );

    // Click Matriks Permission tab
    const matrixTabButton = screen.getByRole('button', { name: /Matriks Permission/i });
    fireEvent.click(matrixTabButton);

    expect(screen.getByText(/Matriks Akses Granular Role/i)).toBeTruthy();
    expect(screen.getByText(/Manajemen Pengguna/i)).toBeTruthy();
    expect(screen.getByText(/Proyek & Delivery/i)).toBeTruthy();

    // Find row toggle buttons
    const rowButtons = screen.getAllByRole('button', { name: /Semua|Batal/i });
    expect(rowButtons.length).toBeGreaterThan(0);

    // Click row toggle button
    fireEvent.click(rowButtons[0]);

    // Check that save button enables
    const saveButton = screen.getByRole('button', { name: /Simpan Matriks|Tersimpan/i });
    expect(saveButton).toBeTruthy();
  });

  it('allows adding a new user with secure password fields', async () => {
    render(
      <MemoryRouter>
        <App basePath="" />
      </MemoryRouter>
    );

    // Click "Tambah Pengguna"
    const addButton = screen.getByRole('button', { name: /Tambah Pengguna/i });
    fireEvent.click(addButton);

    // Fill form
    fireEvent.change(screen.getByLabelText(/^Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^Nama Lengkap/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/^Alamat Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password Kredensial/i), { target: { value: 'Secret123!' } });
    fireEvent.change(screen.getByLabelText(/^Konfirmasi Password/i), { target: { value: 'Secret123!' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Simpan Pengguna/i }));

    // User should appear in list
    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeTruthy();
      expect(screen.getAllByText(/@testuser/i).length).toBeGreaterThan(0);
    });
  }, 15000);

  it('validates form inputs dynamically and displays error message in FormField replacing helper text', async () => {
    render(
      <MemoryRouter>
        <App basePath="" />
      </MemoryRouter>
    );

    // Click "Tambah Pengguna"
    fireEvent.click(screen.getByRole('button', { name: /Tambah Pengguna/i }));

    const usernameInput = screen.getByLabelText(/^Username/i);
    const emailInput = screen.getByLabelText(/^Alamat Email/i);

    // Initial helper text is visible
    expect(screen.getByText(/Huruf kecil tanpa spasi/i)).toBeTruthy();

    // Type invalid username with spaces
    fireEvent.change(usernameInput, { target: { value: 'john doe' } });
    expect(screen.getByText(/Username tidak boleh mengandung spasi/i)).toBeTruthy();

    // Type uppercase username
    fireEvent.change(usernameInput, { target: { value: 'JohnDoe' } });
    expect(screen.getByText(/Gunakan huruf kecil saja/i)).toBeTruthy();

    // Fix username
    fireEvent.change(usernameInput, { target: { value: 'johndoe' } });
    expect(screen.queryByText(/Username tidak boleh mengandung spasi/i)).toBeNull();
    expect(screen.getByText(/Huruf kecil tanpa spasi/i)).toBeTruthy();

    // Type invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    expect(screen.getByText(/Format email tidak valid/i)).toBeTruthy();

    // Fix email
    fireEvent.change(emailInput, { target: { value: 'valid@bgs.id' } });
    expect(screen.queryByText(/Format email tidak valid/i)).toBeNull();
  });

  it('renders radio switch when options has 2 items and combobox when > 2 items', async () => {
    render(
      <MemoryRouter>
        <App basePath="" />
      </MemoryRouter>
    );

    // Click "Tambah Pengguna"
    fireEvent.click(screen.getByRole('button', { name: /Tambah Pengguna/i }));

    // Status selection has 2 options (Aktif & Nonaktif) -> rendered as radiogroup
    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toBeTruthy();

    const activeRadio = screen.getByRole('radio', { name: /^Aktif$/i });
    const inactiveRadio = screen.getByRole('radio', { name: /^Nonaktif$/i });

    expect(activeRadio.getAttribute('aria-checked')).toBe('true');
    expect(inactiveRadio.getAttribute('aria-checked')).toBe('false');

    // Toggle to Nonaktif
    fireEvent.click(inactiveRadio);
    expect(inactiveRadio.getAttribute('aria-checked')).toBe('true');
    expect(activeRadio.getAttribute('aria-checked')).toBe('false');

    // Role selection has 4 options -> rendered as combobox button
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes.length).toBeGreaterThan(0);

    // Switch to Profile Tab
    const profileTabBtn = screen.getByRole('button', { name: /2\. Profil & Biodata/i });
    fireEvent.click(profileTabBtn);

    const lakiRadio = screen.getByRole('radio', { name: /^Laki-laki$/i });
    const peremRadio = screen.getByRole('radio', { name: /^Perempuan$/i });

    expect(lakiRadio.getAttribute('aria-checked')).toBe('true');
    expect(peremRadio.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(peremRadio);
    expect(peremRadio.getAttribute('aria-checked')).toBe('true');
    expect(lakiRadio.getAttribute('aria-checked')).toBe('false');
  });

  it('opens user profile information dialog and displays contact, gender, address', async () => {
    render(
      <MemoryRouter>
        <App basePath="" />
      </MemoryRouter>
    );

    // Click on the detail button
    const detailButtons = screen.getAllByTitle(/Lihat \/ Edit Informasi Tambahan/i);
    expect(detailButtons.length).toBeGreaterThan(0);
    fireEvent.click(detailButtons[0]);

    // Modal should show contact, gender, address
    await waitFor(() => {
      expect(screen.getByText(/Informasi Personal/i)).toBeTruthy();
      expect(screen.getByText(/Kontak & Komunikasi/i)).toBeTruthy();
      expect(screen.getByText(/Alamat Domisili/i)).toBeTruthy();
      expect(screen.getByText(/Keamanan & Kredensial/i)).toBeTruthy();
    });
  });

  it('synchronizes active tab with URL search params', () => {
    render(
      <MemoryRouter initialEntries={['/?tab=roles']}>
        <App basePath="" />
      </MemoryRouter>
    );

    // Should directly render Roles tab because ?tab=roles is set
    expect(screen.getByText(/Daftar Role Akses Sistem/i)).toBeTruthy();
  });

  it('displays connection status badge and sync button', () => {
    render(
      <MemoryRouter>
        <App basePath="" />
      </MemoryRouter>
    );

    expect(screen.getByText(/Local Mode|API Connected|Syncing/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Sync/i })).toBeTruthy();
  });

  it('allows creating a new role with custom permissions via modern role form', async () => {
    render(
      <MemoryRouter>
        <App basePath="" />
      </MemoryRouter>
    );

    // Click Role tab in SubNav
    const roleTabButton = screen.getByRole('button', { name: /Role \(/i });
    fireEvent.click(roleTabButton);

    const addRoleBtn = screen.getByRole('button', { name: /Tambah Role Baru/i });
    fireEvent.click(addRoleBtn);

    // Form title in modern dialog
    expect(screen.getByText(/Tambah Role & Hak Akses Baru/i)).toBeTruthy();

    // Fill form info
    fireEvent.change(screen.getByPlaceholderText(/Masukkan nama role/i), {
      target: { value: 'QA Automation Lead' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Bertanggung jawab/i), {
      target: { value: 'Mengatur pipeline testing' },
    });

    // Navigate to Tab 2 (Modul & Wewenang)
    const nextTabBtn = screen.getByRole('button', { name: /Lanjut ke Modul & Wewenang/i });
    fireEvent.click(nextTabBtn);

    // Verify Tab 2 is visible
    expect(screen.getByText(/Konfigurasi Wewenang Granular per Modul/i)).toBeTruthy();

    // Submit form
    const saveRoleBtn = screen.getByRole('button', { name: /Simpan Role & Wewenang Baru/i });
    fireEvent.click(saveRoleBtn);

    // Role should appear in the list
    await waitFor(() => {
      expect(screen.getAllByText(/QA Automation Lead/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Mengatur pipeline testing/i)).toBeTruthy();
    });
  });

  it('allows adding a new system module & permissions in Permission Matrix tab', async () => {
    render(
      <MemoryRouter>
        <App basePath="" />
      </MemoryRouter>
    );

    // Click Matriks Permission tab in SubNav
    const matrixTabButton = screen.getByRole('button', { name: /Matriks Permission/i });
    fireEvent.click(matrixTabButton);

    const addModBtn = screen.getByRole('button', { name: /Tambah Modul & Wewenang/i });
    fireEvent.click(addModBtn);

    // Form Dialog title
    expect(screen.getByText(/Form Tambah Modul & Wewenang/i)).toBeTruthy();

    // Fill module form
    fireEvent.change(screen.getByPlaceholderText(/Masukkan nama modul baru/i), {
      target: { value: 'Inventaris & Logistik' },
    });

    // Submit module
    const saveModBtn = screen.getByRole('button', { name: /Simpan Modul & Wewenang/i });
    fireEvent.click(saveModBtn);

    // Module should now appear in the table
    await waitFor(() => {
      expect(screen.getAllByText(/Inventaris & Logistik/i).length).toBeGreaterThan(0);
    });
  });

  it('navigates to Log API tab and renders table columns and standard messages', async () => {
    render(
      <MemoryRouter initialEntries={['/api-logs']}>
        <App basePath="" />
      </MemoryRouter>
    );

    // Header & Badge
    expect(screen.getByRole('heading', { name: /Log API/i })).toBeTruthy();

    // Verify all required column headers exist including connected User
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'REQUEST_DATE' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: /PENGGUNA/i })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'BASE_URL' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'ENDPOINT' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'CERTIFICATE_NUMBER' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'STATUS' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'STATUS_CODE' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'MESSAGE' })).toBeTruthy();

    // Verify connected users are displayed in the log rows
    expect(screen.getAllByText(/@superadmin/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/@pm_alex/i).length).toBeGreaterThan(0);

    // Verify all 6 standard messages are rendered in seeds or standard card
    expect(screen.getAllByText(/API Key is required/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Invalid API Key/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Required parameter certificate_number is missing/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/The certificate_number field is required\./i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/certificate_number not found/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/certificate_number found/i).length).toBeGreaterThan(0);
  });

  it('allows running simulated API request and adding new log entry', async () => {
    render(
      <MemoryRouter initialEntries={['/api-logs']}>
        <App basePath="" />
      </MemoryRouter>
    );

    // Open Simulation Dialog
    const simButton = screen.getByRole('button', { name: /Simulasi Request API/i });
    fireEvent.click(simButton);

    // Verify dialog opens
    expect(screen.getByText(/Simulasi Uji Request API/i)).toBeTruthy();

    // Click "Parameter Salah (404)" preset
    const presetBtn = screen.getByRole('button', { name: /Parameter Salah \(404\)/i });
    fireEvent.click(presetBtn);

    // Verify instant response result
    await waitFor(() => {
      expect(screen.getAllByText(/Hasil Respon API/i).length).toBeGreaterThan(0);
    });
  });
});
