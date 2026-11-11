# 📚 Dokumentasi Platform BGS / MFC Micro Front-End

Selamat datang di pusat dokumentasi resmi **BGS / MFC Micro Front-End Platform**. Platform ini dibangun dengan standar arsitektur enterprise modern menggunakan monorepo berbasis **Nx 24**, **Vite 8**, **React 19**, **Tailwind CSS v4**, **Module Federation 2.0**, dan backend **NestJS 12 + Prisma 6 + MySQL 8**.

---

## 📑 Daftar Isi Dokumentasi

Dokumentasi ini dibagi menjadi beberapa modul terstruktur untuk memudahkan navigasi tim developer, arsitek, dan DevOps:

| No | Modul Dokumentasi | Deskripsi Singkat |
| :---: | :--- | :--- |
| **01** | [**Gambaran Umum & Informasi Project**](./01-overview.md) | Visi sistem, domain bisnis MFC Software Solutions, tech stack, dan arsitektur monorepo. |
| **02** | [**Panduan Menjalankan Project**](./02-getting-started.md) | Prasyarat, setup database MySQL, konfigurasi `.env`, menjalankan dev server, testing, & build. |
| **03** | [**Arsitektur & Diagram Sistem**](./03-architecture.md) | Diagram arsitektur Micro Front-End (Module Federation 2.0), lifecycle autentikasi, dan distributed tracing. |
| **04** | [**Panduan Membuat Host Baru (New Host)**](./04-create-new-host.md) | Panduan langkah demi langkah membuat aplikasi Host baru dan menghubungkannya dengan Remote MFE & Shared Packages. |
| **05** | [**Autentikasi, Keamanan & RBAC**](./05-authentication-and-security.md) | Paket `@org/auth`, manajemen sesi (30m/7d), Dev Bypass (`userbypass=true`), dan audit logging. |
| **06** | [**Pustaka Komponen Shared (@org/ui)**](./06-shared-libraries.md) | Design system, layout `DashShell` & `PublicLayout`, universal form controls, serta cross-MFE Event Bus. |
| **07** | [**Best Practices, Konvensi & FAQ**](./07-best-practices-and-faq.md) | Panduan standar coding, troubleshooting build/test, dan pertanyaan umum seputar monorepo. |

---

## ⚡ Quick Links & Ringkasan Perintah

```bash
# 1. Instalasi dependensi
npm install

# 2. Setup Database & Seed Data Kredensial
docker compose up -d mysql
npm run prisma:push
npm run prisma:seed

# 3. Jalankan Seluruh Aplikasi (Frontend MFE + Backend API)
npm run dev:all

# 4. Jalankan Pengujian Otomatis (Vitest)
npm test

# 5. Build Seluruh Aplikasi untuk Produksi
npm run build
```

---

## 👥 Tim & Kontribusi

Dokumentasi ini dikelola bersama oleh Tim Engineering MFC (Modern Future Computing) Software Solutions. Setiap perubahan arsitektur atau penambahan paket baru wajib disertai pembaruan pada modul dokumentasi ini.
