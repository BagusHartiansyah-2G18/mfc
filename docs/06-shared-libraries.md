# 06. Pustaka Komponen Shared (@org/ui)

Pustaka `@org/ui` yang berlokasi di [`packages/shared/ui`](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/packages/shared/ui) merupakan sentralisasi seluruh elemen visual, token desain, tata letak (*layout systems*), dan utilitas komunikasi antar-MFE.

---

## 1. Prinsip Desain UI Library

1. **Zero Component Duplication**: Tidak ada komponen antarmuka yang dibuat ulang di dalam folder `apps/*`. Semua aplikasi (`portal`, `compUI`, `userMgmt`) mengonsumsi komponen yang sama dari `@org/ui`.
2. **Framework Agnostic Headless Primitives**: Dibangun di atas **Radix UI** untuk menjamin aksesibilitas penuh (WCAG / ARIA compliant), navigasi keyboard, dan fleksibilitas *styling*.
3. **Tailwind CSS v4 Native**: Menggunakan sistem tema modern Tailwind v4 tanpa konfigurasi `tailwind.config.js` warisan yang rumit.
4. **Context-Aware Layouts**: Komponen tata letak dapat mendeteksi apakah aplikasi sedang berjalan mandiri (*standalone*) atau di-embed di dalam portal host, sehingga tidak merender navigasi ganda.

---

## 2. Sistem Tata Letak (Layout Systems)

### A. `DashShell` ([`packages/shared/ui/src/layout/dashx1`](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/packages/shared/ui/src/layout/dashx1))
Layout standar untuk dashboard internal, portal administrator, dan halaman aplikasi remote.

Fitur `DashShell`:
* **Collapsible Sidebar**: Sidebar responsif yang dapat diperkecil atau diperluas.
* **Top Header**: Menampilkan nama aplikasi, pencarian cepat, notifikasi, dan menu profil user.
* **Integrated Profile & Logout**: Terhubung langsung dengan `@org/auth` untuk menampilkan inisial user dan memicu aksi keluar sesi.
* **Dynamic Menus**: Menerima array menu navigasi hierarkis dengan badge status dan ikon Lucide.

```tsx
import { DashShell } from '@org/ui';

export function DashboardApp() {
  const menus = [
    { id: 'overview', label: 'Ringkasan', path: '/dashboard', icon: 'layout-dashboard' },
    { id: 'users', label: 'Pengguna', path: '/users', icon: 'users', badge: '12' },
  ];

  return (
    <DashShell brand="MFC Platform" menus={menus}>
      <div className="p-6">
        <h2>Konten Dashboard</h2>
      </div>
    </DashShell>
  );
}
```

---

### B. `PublicLayout` ([`packages/shared/ui/src/layout/publicx1`](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/packages/shared/ui/src/layout/publicx1))
Layout elegan untuk halaman promosi publik, landing page software house, dan halaman legal:

Fitur `PublicLayout`:
* **Modern Header**: Brand logo MFC, link produk & solusi, serta tombol aksi **"Masuk / Login"**.
* **Hero Banner Support**: Dukungan slot visual gradient modern dan *trust indicators*.
* **Enterprise Footer**: Tautan *Privacy Policy*, *Terms of Service*, *Security Compliance*, dan hak cipta resmi.

```tsx
import { PublicLayout } from '@org/ui';

export function LandingPage() {
  return (
    <PublicLayout brandName="MFC Software Solutions">
      <section className="py-20 text-center">
        <h1 className="text-4xl font-extrabold">Build Better Software</h1>
      </section>
    </PublicLayout>
  );
}
```

---

### C. `TabNav` ([`packages/shared/ui/src/components/ui/tab-nav.tsx`](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/packages/shared/ui/src/components/ui/tab-nav.tsx))
Switcher tab modular yang mendukung 3 varian desain: `segmented` (macOS style), `underline` (dashboard style), dan `pills` (modern tags).

```tsx
import { TabNav } from '@org/ui';

<TabNav
  variant="segmented"
  tabs={[
    { id: 'overview', label: 'Ikhtisar' },
    { id: 'forms', label: 'Formulir' },
    { id: 'data', label: 'Tabel Data' },
  ]}
  activeTab={currentTab}
  onChange={(id) => setCurrentTab(id)}
/>
```

---

## 3. Komponen Form Enterprise & Validasi

| Komponen | Lokasi File | Fungsi & Keunggulan |
| :--- | :--- | :--- |
| **`FormField`** | `components/ui/form-field.tsx` | Universal wrapper input yang menangani label, tanda bintang wajib (`required`), pesan error dinamis, dan teks bantuan (*helper text*). |
| **`InputWithIcon`** | `components/ui/input-with-icon.tsx` | Input teks dengan slot ikon kiri/kanan, tombol bersihkan (*clearable*), status pemuatan (*loading spinner*), dan validasi visual. |
| **`PasswordInput`** | `components/ui/password-input.tsx` | Input kata sandi dengan toggle intip (show/hide), pendeteksi Caps Lock aktif, meter kekuatan password (Weak/Medium/Strong), dan masked badge. |
| **`InputWithBtnPopUp`** | `components/ui/input-with-btn-popup.tsx` | Input terpadu tombol aksi & Popover trigger untuk filter atau picker data kompleks. |
| **`SelectField`** | `components/ui/select-field.tsx` | Dropdown select box berpenampilan modern dengan chevron kustom dan penanganan error. |
| **`StatusBadge`** | `components/ui/status-badge.tsx` | Pill status berwarna untuk status `active`, `inactive`, `suspended`, dan `pending`. |

---

## 4. Komunikasi Lintas MFE: `EventBus`

Ketika dua Remote Micro Front-End yang berada di halaman yang sama perlu berkomunikasi tanpa dependensi langsung, gunakan `eventBus` bawaan `@org/ui`:

```ts
import { eventBus } from '@org/ui';

// 1. Mengirim pesan dari MFE User Management
eventBus.emit('USER_UPDATED', { userId: 'usr-123', status: 'active' });

// 2. Menerima pesan di MFE Component UI atau Host Portal
const unsubscribe = eventBus.on('USER_UPDATED', (payload) => {
  console.log('Menerima update user:', payload);
});

// 3. Berhenti mendengarkan saat komponen unmount
unsubscribe();
```
