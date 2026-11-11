# 01. Gambaran Umum & Informasi Project

## 1. Latar Belakang & Visi Project

Project ini adalah platform enterprise berbasis **Micro Front-End (MFE)** yang dikembangkan untuk **MFC (Modern Future Computing) Software Solutions** / **BGS Platform**.

> **Headline**: *Build Better Software. Accelerate Your Business.*  
> **Tagline**: *Trusted Partner for Digital Transformation.*

MFC membantu perusahaan, institusi, organisasi, UMKM, dan sektor industri dalam membangun ekosistem digital melalui:
1. Pengembangan aplikasi web & mobile skala enterprise.
2. Konsultasi arsitektur IT & transformasi cloud.
3. Pelatihan teknologi dan standardisasi rekayasa perangkat lunak.

Platform ini mengintegrasikan seluruh layanan internal, portal klien, manajemen pengguna, dan katalog komponen ke dalam satu ekosistem monorepo terpadu tanpa *vendor lock-in* dan tanpa dependensi sirkular.

---

## 2. Tech Stack & Ekosistem Perangkat Lunak

Platform ini menggunakan teknologi modern dengan performa tinggi dan standarisasi ketat:

### A. Frontend & Micro Front-End
* **Monorepo Engine**: [Nx 24](https://nx.dev) — Pengelolaan dependency graph, task caching, dan orkestrasi build.
* **Build Tool & Bundler**: [Vite 8](https://vite.dev) & [Rolldown](https://rolldown.rs) — Kecepatan bundle instan, HMR ultra-cepat, dan native ESM.
* **MFE Protocol**: `@module-federation/vite` (Module Federation 2.0) — Dynamic runtime code-sharing, chunk deduplication, dan type-safe federated modules.
* **UI Framework**: [React 19](https://react.dev) & [React Router v6](https://reactrouter.com).
* **Styling & Design System**: [Tailwind CSS v4](https://tailwindcss.com) (dengan engine native CSS `@theme`), [Lucide React](https://lucide.dev) icons.
* **Headless UI Primitives**: [Radix UI](https://www.radix-ui.com) (Dialog, Popover, Dropdown, Tabs, Tooltip, Avatar, Switch, Progress).
* **Data Presentation**: [TanStack Table v8](https://tanstack.com/table/v8).

### B. Backend REST API & Database
* **Framework Backend**: [NestJS 12](https://nestjs.com) (Express-based, modul terstruktur, Dependency Injection).
* **ORM & Database Modeling**: [Prisma ORM 6](https://www.prisma.io).
* **Database**: [MySQL 8.0](https://www.mysql.com) (ACID compliant, relation enforcement, InnoDB engine).
* **Keamanan & Hashing**: [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) & Node.js Native Crypto (HS256 tokens).
* **Audit Trail**: Pencatatan riwayat keamanan dan audit log terpusat di database.

### C. Testing & Kualitas Kode
* **Testing Framework**: [Vitest 5](https://vitest.dev) + `@testing-library/react` + `jsdom`.
* **Linting & Code Formatting**: ESLint 9 flat config + TypeScript 5.8.

---

## 3. Struktur Direktori Monorepo

```
MicroFE/base/
├── apps/
│   ├── portal/                   # HOST APPLICATION (Shell Utama, Port 4200)
│   │   ├── src/
│   │   │   ├── auth/             # Adapter & Re-export auth terpusat
│   │   │   ├── config/           # Parser feature.yml (Dynamic Menu Registry)
│   │   │   ├── pages/            # Halaman Publik Promosi, Login Split-Screen, Dashboard, 404
│   │   │   ├── App.tsx           # Router Shell Host & Dynamic MFE Mount
│   │   │   └── mf.ts             # Registry & Fallback Loader Remote Module Federation
│   │   ├── public/feature.yml    # Konfigurasi menu navigasi terpusat
│   │   └── vite.config.mts       # Host Module Federation Configuration
│   │
│   ├── compUI/                   # REMOTE MFE 1: Component UI Showcase & Docs (Port 4201)
│   │   ├── src/
│   │   │   ├── pages/            # Overview, Forms, Overlays & Widgets, Data Showcase
│   │   │   ├── App.tsx           # Router remote component catalog
│   │   │   └── bootstrap.tsx     # Runner standalone saat dikembangkan terpisah
│   │   └── vite.config.mts       # Remote Module Federation Config (Exposes: './App')
│   │
│   ├── userMgmt/                 # REMOTE MFE 2: User, Role & Access Control / RBAC (Port 4202)
│   │   ├── src/
│   │   │   ├── components/       # UserTab, RoleTab, PermissionMatrixTab, LogApiTab
│   │   │   ├── store/            # Store state management & synchronization
│   │   │   ├── App.tsx           # Router remote user management
│   │   │   └── bootstrap.tsx     # Standalone dev runner dengan DashShell
│   │   └── vite.config.mts       # Remote Module Federation Config (Exposes: './App')
│   │
│   └── api/                      # BACKEND REST API (NestJS + Prisma + MySQL, Port 3000)
│       ├── prisma/
│       │   ├── schema.prisma     # Definisi schema MySQL (User, Profile, Role, Permission, AuditLog)
│       │   └── seed.ts           # Seeding kredensial default & matriks izin sistem
│       └── src/
│           ├── auth/             # Modul Autentikasi (Login, Logout, Me, Audit Log)
│           ├── users/            # Modul CRUD User & Manajemen Profil
│           ├── roles/            # Modul CRUD Role & Role-Permission Matrix
│           ├── prisma/           # PrismaService lifecycle connection
│           └── main.ts           # Entry point NestJS (Global Prefix: /api, CORS)
│
├── packages/
│   └── shared/
│       ├── ui/                   # SHARED UI LIBRARY (@org/ui)
│       │   └── src/
│       │       ├── layout/       # DashShell (Dashboard layout), PublicLayout (Promotional layout)
│       │       ├── components/ui/# Pustaka komponen form, dialog, badge, table, switcher
│       │       └── utils/        # cn (tailwind-merge) & cross-MFE Event Bus
│       │
│       └── auth/                 # CENTRALIZED AUTH & AUTHORIZATION (@org/auth)
│           └── src/
│               ├── auth-store.ts # Session storage (30m normal, 7d remember), Dev Bypass mode
│               ├── use-auth.ts   # Hook reaktif useAuth()
│               ├── use-permission.ts # Hook & helper fine-grained RBAC/ABAC
│               ├── can.tsx       # Deklaratif <Can I="action" this="module" />
│               ├── route-guard.tsx # Protected RouteGuard dengan status dev bypass
│               └── auth-client.ts# HTTP fetch wrapper (Authorization token + X-Request-ID)
│
├── docs/                         # Pusat Dokumentasi Resmi Project
├── .env                          # Konfigurasi Environment Aktif (Port, URL, Bypass)
├── .env.example                  # Template Environment Variables
├── docker-compose.yml            # Konfigurasi container Docker MySQL
├── nx.json                       # Konfigurasi target default & sync plugin Nx
├── package.json                  # Script npm monorepo & shared dependencies
├── tsconfig.base.json            # Path alias TypeScript (@org/ui, @org/auth)
└── vitest.config.mts             # Runner unit test terintegrasi lintas project
```

---

## 4. Keunggulan Desain Sistem

1. **True Micro Front-End (Decoupled & Federated)**:
   Masing-masing aplikasi remote dapat di-*build*, di-*test*, dan di-*deploy* secara independen tanpa perlu membangun ulang seluruh monorepo.
2. **Dual-Mode Execution (Integrated vs Standalone)**:
   * **Integrated**: Dimuat di dalam portal host melalui runtime dynamic import, berbagi navigasi dan sesi global.
   * **Standalone**: Setiap remote dapat dijalankan secara mandiri pada port masing-masing dengan shell layout lokal untuk kenyamanan pengembang (*developer experience*).
3. **No Duplicate Navigation**:
   Remote MFE secara otomatis mendeteksi apakah dirinya berjalan di dalam Host Portal atau Standalone, mencegah munculnya header atau sidebar ganda.
4. **Resilient Dual Mode Auth**:
   Frontend mendukung koneksi langsung ke backend REST API NestJS, namun tetap menyertakan *fallback local simulation* saat pengujian offline atau testing agar tidak menghambat produktivitas developer.
