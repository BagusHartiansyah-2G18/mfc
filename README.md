# BGS Micro Front-End (MFE) Platform

Platform arsitektur **Micro Front-End Enterprise** berbasis **Nx Monorepo 24**, **Vite 8**, **React 19**, **Tailwind CSS v4**, dan **@module-federation/vite**.

---

## 🏛️ Arsitektur Monorepo

```
MicroFE/base/
├── apps/
│   ├── portal/              # HOST SHELL (Port 4200)
│   │   ├── src/pages/       # Halaman Publik Promosi Software House & Fallback SPA
│   │   ├── src/mf.ts        # Dynamic Runtime Module Federation & Provider Registry
│   │   └── public/          # feature.yml (Konfigurasi Menu Terpusat)
│   │
│   ├── compUI/              # REMOTE MFE 1: Component UI Showcase & Docs (Port 4201)
│   │   ├── src/pages/       # Overview, Forms Showcase, Widgets & Overlays, Data Showcase
│   │   └── src/bootstrap    # Standalone dev runner dengan DashShell
│   │
│   ├── userMgmt/            # REMOTE MFE 2: User, Profile & Access Management / RBAC (Port 4202)
│   │   ├── src/components/  # UserTab, UserProfileDialog, RoleTab, PermissionMatrixTab
│   │   ├── src/store/       # Reactive Store + LocalStorage persistence
│   │   └── src/bootstrap    # Standalone dev runner dengan DashShell
│   │
│   └── api/                 # BACKEND REST API (NestJS + Prisma + MySQL) (Port 3000)
│       ├── prisma/          # Schema Prisma & Migration (users, profiles, roles, permissions)
│       └── src/             # NestJS Modules: Users, Roles, PrismaService
│
├── packages/
│   └── shared/ui/           # SHARED UI LIBRARY (@org/ui) - Sentralisasi Seluruh Komponen
│       ├── src/layout/
│       │   ├── dashx1/      # Dashboard Layout System (DashShell, Header, Sidebar, Footer)
│       │   ├── publicx1/    # Public Landing Layout System (PublicLayout, Header, Footer, Banner)
│       │   └── SubNav.tsx   # Sidebar Navigasi Sub-fitur Modular
│       ├── src/components/ui/
│       │   ├── input-with-icon.tsx     # Input dengan slot ikon, clearable, loading, & error
│       │   ├── input-with-btn-popup.tsx# Input terpadu tombol aksi & Popover trigger
│       │   ├── password-input.tsx      # Password input show/hide, strength meter, masked badge
│       │   ├── form-field.tsx          # Wrapper form standard (label, error, asterisk, helper)
│       │   ├── select-field.tsx        # Styled native select box dengan chevron
│       │   ├── status-badge.tsx        # Status pill badge (active, inactive, suspended, pending)
│       │   ├── tab-nav.tsx             # Universal segmented / underline / pills tab switcher
│       │   └── ...                     # Primitif Radix UI (Button, Dialog, Popover, Card, dll.)
│       └── src/utils/       # cn (tailwind-merge) & cross-MFE Event Bus
│
├── .env                     # Konfigurasi Environment Terpusat (ignored di git)
├── .env.example             # Template Environment Variables
└── docker-compose.yml       # Orkestrasi Docker Multi-Container Dev Server
```

---

## ⚙️ Konfigurasi Environment (`.env`)

Seluruh konfigurasi port dan remote entry dikelola secara terpusat melalui file `.env`:

```bash
# Server Ports
PORT_PORTAL=4200
PORT_COMP_UI=4201
PORT_USER_MGMT=4202

# Portal Configuration
VITE_BRAND_NAME="BGS Platform"
VITE_FEATURE_CONFIG_URL="/feature.yml"

# Remote Micro Frontend URLs (Module Federation)
VITE_COMP_UI_URL=http://localhost:4201/remoteEntry.js
VITE_USER_MGMT_URL=http://localhost:4202/remoteEntry.js
```

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Prasyarat
- Node.js 20+ atau Node.js 22
- NPM 10+

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Menjalankan Server Pengembangan (Dev Mode)

Anda dapat menjalankan tiap aplikasi secara mandiri atau bersamaan:

```bash
# 1. Jalankan Backend REST API NestJS + Prisma + MySQL (Port 3000)
npx nx run @org/api:serve

# 2. Jalankan Host Portal (Port 4200)
npx nx run portal:serve

# 3. Jalankan Remote Component UI (Port 4201)
npx nx run compUI:serve

# 4. Jalankan Remote User Management (Port 4202)
npx nx run userMgmt:serve
```

Akses di browser:
- **Halaman Publik (Promosi Software House)**: `http://localhost:4200/`
- **Dashboard Component UI**: `http://localhost:4200/compUI` atau `http://localhost:4201/` (Standalone)
- **User & Access Management (RBAC)**: `http://localhost:4200/user-management` atau `http://localhost:4202/` (Standalone)
- **Backend REST API**: `http://localhost:3000/api/users` & `http://localhost:3000/api/roles`
- **phpMyAdmin**: `http://localhost:8080` (User: `root`, Password: `root`)

### 4. Menjalankan dengan Docker Compose
```bash
docker compose up --build
```
Container `portal` (4200), `compui` (4201), dan `usermgmt` (4202) akan aktif dan saling terhubung otomatis.

---

## 🧪 Testing & Verifikasi

Pengujian unit menggunakan **Vitest** dan **React Testing Library**:

```bash
# Jalankan seluruh unit test suite MFE
npx vitest run apps/userMgmt/src/App.spec.tsx apps/portal/src/App.spec.tsx apps/compUI/src/App.spec.tsx packages/shared/ui/src/layout/layout.spec.tsx

# Periksa sinkronisasi dependensi & project reference Nx
npx nx sync:check
```

---

## 📦 Build untuk Produksi

```bash
# Build Remote compUI
npx nx run compUI:build

# Build Remote userMgmt
npx nx run userMgmt:build

# Build Host portal
npx nx run portal:build

# Atau build seluruh project sekaligus
npx nx run-many -t build --projects=compUI,userMgmt,portal
```

---

## 🎨 Sistem Layout Modular (`dashx1` & `publicx1`)

Layout dirancang dengan pola **Compound Components** di mana setiap komponen memiliki slot `children?: React.ReactNode` untuk fleksibilitas maksimal:

### A. Dashboard Layout (`dashx1`)
- `DashShell`: Container dashboard utama dengan drawer mobile otomatis dan slot header/sidebar/footer/breadcrumb.
- `DashHeader`: Header bar terpadu (`DashHeaderBrand`, `DashHeaderNav`, `DashHeaderNavItem`, `DashHeaderActions`, `DashHeaderUserMenu`, `DashHeaderMobileToggle`).
- `DashSidebar`: Sidebar navigasi collapsible (`DashSidebarHeader`, `DashSidebarNav`, `DashSidebarSection`, `DashSidebarItem`, `DashSidebarBadge`, `DashSidebarFooter`, `DashSidebarToggle`).
- `DashFooter`: Footer status sistem (`DashFooterLeft`, `DashFooterRight`, `DashFooterItem`).
- `DashBreadcrumb`: Navigasi hierarki breadcrumb (`DashBreadcrumbItem`, `DashBreadcrumbSeparator`).

### B. Public Layout (`publicx1`)
- `PublicLayout`: Container landing page dengan slot banner, header, content (`PublicLayoutMain`), dan footer.
- `PublicHeader`: Sticky navbar dengan toggle tema (dark/light), brand logo, links, dan tombol direct access ke Client Portal.
- `PublicFooter`: Footer modular 5 kolom (Layanan Utama, Solusi Industri, Ekosistem, Brand Info, Legal).
- `PublicTopBanner`: Announcement bar promo khusus (`PublicTopBannerBadge`, `PublicTopBannerText`, `PublicTopBannerAction`).

---

## 🧩 Sentralisasi Komponen UI (`@org/ui`)

Semua komponen UI **wajib terpusat** di `@org/ui` (`packages/shared/ui/src/components/ui/` dan `layout/`). Tidak ada komponen UI yang didefinisikan secara ad-hoc di dalam host maupun remote MFE.

| Komponen | Path File | Deskripsi & Fitur |
|---|---|---|
| `InputWithIcon` | `components/ui/input-with-icon.tsx` | Input dengan slot ikon `left`/`right`, tombol reset/clearable (X), loader putar (async), status validasi error. |
| `InputWithBtnPopUp` | `components/ui/input-with-btn-popup.tsx` | Input terpadu tombol aksi (`Button`) atau pemicu Popover (`popupContent`) untuk aksi copy, kalkulator, dsb. |
| `PasswordInput` | `components/ui/password-input.tsx` | Input kata sandi aman: toggle show/hide eye, kalkulator kekuatan (*strength meter* 0-100%), atau mode masked badge (`••••••••`). |
| `FormField` | `components/ui/form-field.tsx` | Pembungkus field formulir: label, tanda bintang required `*`, helper text, error message, dan slot aksi. |
| `SelectField` | `components/ui/select-field.tsx` | Dropdown select terstandarisasi dengan ikon chevron, array opsi bertipe (`SelectOption[]`), dan styling seragam. |
| `StatusBadge` | `components/ui/status-badge.tsx` | Badge indikator status (`active`, `inactive`, `suspended`, `pending`) dilengkapi dot pulsing dinamis. |
| `TabNav` | `components/ui/tab-nav.tsx` | Pengalih tab universal (`segmented`, `underline`, `pills`) dengan slot ikon dan badge counter. |
| `SubNav` | `layout/SubNav.tsx` | Sidebar navigasi sekunder modular dan responsif untuk sub-halaman aplikasi. |
| `DashShell` / `PublicLayout` | `layout/dashx1/` & `layout/publicx1/` | Standarisasi header dan menu yang wajib membungkus setiap host maupun remote MFE standalone. |

---

## 🛡️ Modul User & Access Management (RBAC)

Modul `apps/userMgmt` mengimplementasikan sistem manajemen identitas dan hak akses standar korporasi:
1. **Keamanan Kredensial User**:
   - Password **HARUS HIDDEN** (`••••••••` terenkripsi, tidak pernah diekspos dalam list/table).
   - Input password dilengkapi tombol toggle *Show/Hide*, pengukur kekuatan password (*Password Strength Meter*), dan konfirmasi password.
   - Proteksi akun Super Administrator utama (*anti-lockout*).
2. **User Profile & Informasi Tambahan**:
   - Setiap akun user memiliki dialog detail **User Profile** (Informasi Tambahan Akun).
   - Menyimpan data nomor handphone/WhatsApp, alamat lengkap, jenis kelamin (Laki-laki / Perempuan / Lainnya), tanggal lahir, dan bio deskripsi singkat.
   - Sinkronisasi instan ke state management & MySQL backend.
3. **Role Management**:
   - Pengelompokan peran sistem (*System Role*) dan peran kustom (*Custom Role*).
   - Pelacakan jumlah user aktif per role.
4. **Matriks Permission Granular**:
   - Matriks dua dimensi: **Modul** (`users`, `roles`, `projects`, `billing`, `audit_logs`, `settings`) &times; **Hak Akses** (`View`, `Create`, `Edit`, `Delete`).
   - Toggle **"Pilih Semua" (Select All)** per baris modul dan per kolom aksi.
   - Shortcut preset: *Full Access*, *Read Only*, dan *Kosongkan*.

---

## 🖼️ Showcase Komponen di `compUI` (`apps/compUI`)

Aplikasi `compUI` berfungsi sebagai live catalog dan dokumentasi interaktif seluruh komponen `@org/ui`:
- **Overview Page (`/`)**: Value cards arsitektur terpusat, status badge matrix, dan tabel preview status.
- **Forms Showcase (`/forms`)**: Playground interaktif `InputWithIcon`, `InputWithBtnPopUp`, `PasswordInput` (toggle & masked), `SelectField`, dan live form simulator.
- **Widgets & Overlays (`/widgets`)**: Showcase varian `TabNav` (segmented, underline, pills), dialog modal, popover, tooltip, sheet drawer, collapsible, dan scroll area.
- **Data Showcase (`/data`)**: Integrasi tabel dinamis dengan search bar berikon, filter status dropdown, dan kolom password ter-masking aman.

---

## ➕ Panduan Menambahkan Remote MFE Baru

Untuk menambahkan aplikasi Micro Front-End baru ke ekosistem monorepo:

1. **Buat direktori aplikasi**: `apps/<namaApp>/` dengan `project.json`, `package.json`, `tsconfig.json`, dan `vite.config.mts`.
2. **Daftarkan Module Federation** di `apps/<namaApp>/vite.config.mts`:
   ```ts
   federation({
     name: '<nama_app>',
     filename: 'remoteEntry.js',
     exposes: { './App': './src/App.tsx' },
     shared: { react: { singleton: true }, 'react-dom': { singleton: true }, 'react-router-dom': { singleton: true } }
   })
   ```
3. **Tambahkan Port & URL di `.env`**:
   ```bash
   PORT_<NAMA_APP>=4203
   VITE_<NAMA_APP>_URL=http://localhost:4203/remoteEntry.js
   ```
4. **Daftarkan di `apps/portal/src/mf.ts`**:
   Tambahkan entry ke array `PROVIDERS`.
5. **Tambahkan Rute di `apps/portal/src/App.tsx`**:
   ```tsx
   const NewApp = lazyProvider('<alias>', 'App');
   <Route path="/<path>/*" element={<AppShell menu={menu}><ProviderBoundary name="<alias>"><NewApp basePath="/<path>" /></ProviderBoundary></AppShell>} />
   ```
6. **Perbarui Menu di `apps/portal/public/feature.yml`**.
7. **Jalankan `npx nx sync`**.
