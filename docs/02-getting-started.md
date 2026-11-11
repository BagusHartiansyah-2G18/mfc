# 02. Panduan Menjalankan Project

Panduan ini berisi instruksi lengkap untuk menyiapkan lingkungan pengembangan, mengonfigurasi database MySQL, menjalankan server pengembangan (*development mode*), menjalankan pengujian, dan membangun aplikasi untuk produksi.

---

## 1. Prasyarat Sistem

Sebelum memulai, pastikan perangkat Anda telah terpasang:
* **Node.js**: Versi `20.18.0` atau `22.x` LTS (disarankan).
* **NPM**: Versi `10.x` atau lebih baru.
* **Docker Desktop**: Untuk menjalankan service container database MySQL 8.0.
* **Git**: Untuk manajemen versi source code.

---

## 2. Instalasi Dependensi Monorepo

Buka terminal di root direktori project, lalu jalankan:

```bash
npm install
```

> [!NOTE]
> Monorepo ini menggunakan npm workspace terpadu. Perintah di atas akan menginstal seluruh dependensi untuk `portal`, `compUI`, `userMgmt`, `api`, `@org/ui`, dan `@org/auth`.

---

## 3. Konfigurasi Environment (`.env`)

Salin file template `.env.example` menjadi `.env` di root direktori:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS Bash
cp .env.example .env
```

Pastikan variabel di dalam `.env` sesuai dengan kebutuhan Anda:

```bash
# ==============================================================================
# BGS / MFC PLATFORM - CENTRAL ENVIRONMENT CONFIGURATION
# ==============================================================================

# Server Ports
PORT_PORTAL=4200
PORT_COMP_UI=4201
PORT_USER_MGMT=4202
PORT_API=3000

# Backend Database URL (MySQL)
DATABASE_URL="mysql://root:rootpassword@localhost:3306/bgs_mfe_db"

# JWT Secret Key
JWT_SECRET="bgs-microfe-enterprise-secret-key-2026"

# Portal Brand & Menu Config
VITE_BRAND_NAME="MFC Software Solutions"
VITE_FEATURE_CONFIG_URL="/feature.yml"
VITE_API_URL="http://localhost:3000"

# Remote Micro Frontend URLs (Module Federation)
VITE_COMP_UI_URL=http://localhost:4201/remoteEntry.js
VITE_USER_MGMT_URL=http://localhost:4202/remoteEntry.js

# Developer Bypass Mode (true = bypass login & auth guard untuk dev cepat)
# Set ke false untuk mengaktifkan pengujian keamanan login ketat
userbypass=true
VITE_USER_BYPASS=true
```

---

## 4. Setup Database MySQL & Prisma Seeding

Aplikasi backend (`apps/api`) membutuhkan database MySQL 8.0. Anda dapat menjalankannya dengan mudah menggunakan Docker Compose.

### Langkah 1: Jalankan Container MySQL
```bash
docker compose up -d mysql
```
*Port MySQL akan terbuka di `localhost:3306`.*

### Langkah 2: Sinkronisasi Schema Database (Prisma Push)
```bash
npm run prisma:push
```
*Perintah ini akan membaca `apps/api/prisma/schema.prisma` dan membuat tabel-tabel di MySQL.*

### Langkah 3: Seed Kredensial & Izin Awal
```bash
npm run prisma:seed
```
*Perintah ini menginisialisasi role sistem, matriks izin lengkap, dan akun pengguna default.*

#### 🔑 Daftar Kredensial Default untuk Pengujian:

| Role | Username | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- | :--- |
| **Super Administrator** | `superadmin` | `admin@bgs-software.id` | `Password123!` | Akses penuh tanpa batas |
| **Technical PM** | `sarah.jenkins` | `sarah.j@bgs-software.id` | `Password123!` | Kelola tim dev & proyek |
| **Senior Engineer** | `budi.pratama` | `budi.p@bgs-software.id` | `Password123!` | Akses fitur teknis & katalog |
| **Client Representative** | `client` | `client@company.com` | `Password123!` | Akses `/customer-portal` |
| **Staff Baru (First Login)** | `newuser` | `newuser@mfc.id` | `TempPassword123!` | Wajib ganti password |

---

## 5. Menjalankan Server Pengembangan (Dev Server)

### A. Menjalankan Seluruh Sistem Sekaligus (Direkomendasikan)
Menjalankan Host Portal, Remote CompUI, Remote UserMgmt, dan Backend REST API secara paralel:

```bash
npm run dev:all
```

Setelah berjalan, Anda dapat mengakses URL berikut di browser:
* 🌐 **Portal Host**: [http://localhost:4200](http://localhost:4200)
* 🎨 **Remote Component UI Showcase**: [http://localhost:4201](http://localhost:4201)
* 👥 **Remote User & Role Management**: [http://localhost:4202](http://localhost:4202)
* 🔌 **Backend REST API**: [http://localhost:3000/api](http://localhost:3000/api)

---

### B. Menjalankan Hanya Aplikasi Frontend
Jika Anda tidak memerlukan backend API aktif (menggunakan dev bypass atau offline simulation):

```bash
npm run dev
```

---

### C. Menjalankan Aplikasi Secara Terpisah (Individu)
Anda dapat menjalankan masing-masing aplikasi secara terisolasi:

```bash
# Menjalankan Backend API NestJS
npm run dev:api

# Menjalankan Host Portal
npm run dev:portal

# Menjalankan Remote Component UI
npm run dev:compUI

# Menjalankan Remote User Management
npm run dev:userMgmt
```

---

## 6. Menjalankan Pengujian Otomatis (Unit Testing)

Monorepo menggunakan **Vitest** untuk pengujian unit dan integrasi.

```bash
# Menjalankan seluruh test suite di semua project
npm test

# Menjalankan test suite spesifik Host Portal
npx vitest run apps/portal/src/App.spec.tsx

# Menjalankan test suite Remote Component UI
npx vitest run apps/compUI/src/App.spec.tsx

# Menjalankan test suite Remote User Management
npx vitest run apps/userMgmt/src/App.spec.tsx

# Menjalankan test suite Shared Auth Package (@org/auth)
npx vitest run packages/shared/auth/src/auth.spec.tsx

# Menjalankan test suite Backend Auth API
npx vitest run apps/api/src/auth/auth.service.spec.ts
```

---

## 7. Melakukan Build untuk Produksi (Production Build)

Untuk menghasilkan artefak produksi yang siap dideploy ke web server atau CDN:

```bash
# Build seluruh aplikasi sekaligus via Nx
npm run build

# Atau build spesifik per aplikasi
npx nx run portal:build
npx nx run compUI:build
npx nx run userMgmt:build
```

Hasil build akan tersimpan di dalam folder `dist/` masing-masing aplikasi:
* `apps/portal/dist/`
* `apps/compUI/dist/`
* `apps/userMgmt/dist/`
