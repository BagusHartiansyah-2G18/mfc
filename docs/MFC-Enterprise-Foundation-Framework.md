# MFC Enterprise Application Foundation Framework v1.0

## Tujuan
Dokumen ini menjadi standar dan fondasi utama (Base Foundation) untuk seluruh pengembangan aplikasi MFC, mencakup Web Application, Mobile Application, ERP, SCM, Retail, Manufacturing, HRIS, CRM, E-Government, dan SaaS Platform.

---

## Matriks Kesiapan Implementasi Baseline (Status Tracking)

Tabel berikut memetakan pilar-pilar fondasi yang telah selesai diimplementasikan (*Implemented*) pada baseline repositori saat ini:

| Pilar Fondasi | Status Kesiapan | Lokasi Modul / File Acuan | Deskripsi & Bukti Implementasi |
| :--- | :---: | :--- | :--- |
| **Enterprise Data Table** | `[✅ IMPLEMENTED]` | [table.tsx](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/packages/shared/ui/src/components/ui/table.tsx) | Search global debounced, page size `[5..100]`, pagination transparan, ekspor Excel/CSV/PDF, multi-row selection & floating bulk action toolbar. |
| **Client-Side Hash & Wire Protection** | `[✅ IMPLEMENTED]` | [client-crypto.ts](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/packages/shared/auth/src/client-crypto.ts) | Password di-hash (SHA-256) sebelum dikirimkan ke jaringan, mencegah plaintext terlihat di Network Tab. |
| **Form Input Sanitizer & File Guard** | `[✅ IMPLEMENTED]` | [security-guard.ts](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/packages/shared/auth/src/security-guard.ts) | Anti-SQL Injection pattern detection, input sanitization, batasan ukuran 10MB, whitelist ekstensi, dan validasi magic bytes. |
| **REST API Envelope & Rate Limiter** | `[✅ IMPLEMENTED]` | [rate-limiter.middleware.ts](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/apps/api/src/common/rate-limiter.middleware.ts) | Standard response envelope `{ success, statusCode, message, data, meta }` dan sliding window rate limiter (100 req/min). |
| **Strict Error Dictionary** | `[✅ IMPLEMENTED]` | [api-envelope.interceptor.ts](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/apps/api/src/common/api-envelope.interceptor.ts) | Pesan baku presisi: `API Key is required`, `The {param} field is required`, `{param} not found`, `{param} found`. |
| **Navigasi Sidebar Mandiri & Tab Sync** | `[✅ IMPLEMENTED]` | [feature.yml](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/apps/portal/public/feature.yml), [App.tsx](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/apps/portal/src/App.tsx) | Pemisahan rute mandiri `/noted` (Catatan Saya), `/noted/shared` (Dibagikan), `/noted/public` (Katalog Publik). |
| **Public Endpoint Guard & Member Isolation** | `[✅ IMPLEMENTED]` | [sharing.service.ts](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/apps/api-noted/src/notes/sharing.service.ts) | Prioritas pencarian data via `id` UUID global dan `WHERE sharingMode = 'PUBLIC'` wajib, serta isolasi `kdMember` pada turunan hierarki. |
| **SWR Client-Side LocalStorage Cache** | `[✅ IMPLEMENTED]` | [cache-swr.ts](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/packages/shared/auth/src/cache-swr.ts) | Zero Loading Spinner: render data lokal instan dilanjutkan silent background fetch dan background update. |
| **Page Identity & Activity Boundary Matrix** | `[✅ IMPLEMENTED]` | [page-identity.ts](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/packages/shared/auth/src/page-identity.ts) | Matriks perizinan per halaman (`PAGE_NOTED_TREE`, `PAGE_USER_MGMT`, dll.) dengan verifikasi `canAccessPageAction`. |
| **Resilience & Remote Fallback Policy** | `[⏳ ARCHITECTURE UPGRADE]` | Section 11 & Section 27 | Isolasi failure Webpack Module Federation dan Exponential Backoff Retry. |
| **Distributed Tracing (W3C Traceparent)** | `[⏳ ARCHITECTURE UPGRADE]` | Section 15 | Standar trace-id & span-id melintasi Micro FE UI, Gateway, dan NestJS microservices. |
| **Transactional Outbox Pattern** | `[⏳ ARCHITECTURE UPGRADE]` | Section 11 | Pola anti-message-loss untuk Event-Driven Architecture (Prisma + Message Broker). |
| **UU PDP & PII Data Masking** | `[⏳ ARCHITECTURE UPGRADE]` | Section 3 & Section 6 | Proteksi data pribadi, dynamic UI masking, dan larangan log data sensitif. |
| **Contract-Based Schema Sync** | `[⏳ ARCHITECTURE UPGRADE]` | Section 11 & Section 17 | Sinkronisasi DTO OpenAPI/Swagger langsung ke TypeScript types frontend. |


---

# 1. Project Documentation Framework

## BRD (Business Requirement Document)
### Menjawab
- Kenapa aplikasi dibuat
- Masalah yang diselesaikan
- Siapa pengguna
- Manfaat bagi organisasi

### Isi
- Latar Belakang
- Permasalahan Saat Ini
- Tujuan Aplikasi
- Ruang Lingkup
- Stakeholder
- Manfaat Bisnis
- KPI Keberhasilan

## FRD / FSD (Functional Requirement Document)
### Menjawab
- Sistem harus dapat melakukan apa

### Isi
- Daftar Modul
- Daftar Fitur
- Use Case
- Hak Akses
- Input dan Output
- Workflow Fungsional

## SRS (Software Requirement Specification)
### Isi
- Business Requirement
- Functional Requirement
- Non Functional Requirement
- Workflow
- Hak Akses
- Integrasi
- Struktur Data
- Security Requirement

## Architecture Document
### HLD (High Level Design)
- Arsitektur Sistem
- Deployment Diagram
- Integrasi
- Infrastruktur

### LLD (Low Level Design)
- Database Design
- API Design
- Sequence Diagram
- Class Diagram
- Service Design

---

# 2. Enterprise Foundation Architecture

```text
FOUNDATION
│
├── Business Layer
├── Security Layer
├── Identity Layer
├── Organization Layer
├── Data Layer
├── Integration Layer
├── Workflow Layer
├── Communication Layer
├── Governance Layer
├── Infrastructure Layer
├── Monitoring Layer
├── Development Layer
├── Reporting Layer
├── AI Layer
└── Audit Layer
```

---

# 3. Security Foundation

## Authentication
- Login
- Logout
- Refresh Token
- Token-Based Authentication (JWT Standard: Access Token + Refresh Token)
- Session Management
- Session Auto-Lock on Inactivity (Kunci layar otomatis kasir/admin setelah 15 menit idle tanpa aktivitas untuk proteksi terminal)
- Forgot Password
- Change Password
- MFA
- SSO
- OAuth2
- OpenID Connect
- LDAP
- Active Directory

## Client-Side Password Security & Wire Protection
- Password **wajib tersembunyi (hidden)** di antarmuka input (`type="password"`).
- Password **wajib di-hash di sisi client** (misal SHA-256 pre-hash) sebelum dikirimkan ke jaringan (*wire protection*), sehingga string password mentah tidak pernah melintas di payload transit atau terlihat di Network Tab/DevTools.
- Sisi backend memverifikasi hash tersebut menggunakan algoritma `bcrypt` dengan salt rounds terstandar (10-12).

## Authorization & Access Control
- RBAC (Role-Based Access Control)
- ABAC (Attribute-Based Access Control)
- Page Identity Binding (Identitas halaman unik terikat role)
- Menu Access & Activity Boundary
- API Access & Endpoint Authorization
- Field Level Access
- Row Level Access (Multi-company & Tenant isolation)

## Public Endpoint Security & Composite Key Isolation [Pelajaran Lapangan]
- **Prinsip Composite Key**: Field kode lokal seperti `kdJudul` bukan primary key unik global, melainkan unik per kepemilikan (`@@unique([kdJudul, kdMember])`).
- **Enforced Visibility Guard**: Seluruh endpoint publik (tanpa login/JWT) wajib menerapkan filter eksplisit `WHERE (sharingMode = 'PUBLIC' OR publikasi = true)` di query database. Dilarang keras hanya mengandalkan kode lokal `kdJudul`, karena dapat menyebabkan data privat milik pengguna lain bocor ke publik.
- **Identifikasi Presisi via UUID**: Jika tersedia, request endpoint publik wajib menyertakan atau memprioritaskan parameter `id` (UUID unik global) untuk mengunci catatan target secara akurat.
- **Strict Scope Hierarki Anak (Direct Children)**: Penarikan sub-catatan anak maupun breadcrumb induk wajib menyertakan filter `kdMember: currentNote.kdMember` agar struktur data antar-pengguna terisolasi sempurna dan tidak saling silang.

## Kepatuhan UU PDP (Pelindungan Data Pribadi) & PII Data Masking `[ENTERPRISE UPGRADE]`
- **Klasifikasi Data Sensitif (PII - Personally Identifiable Information)**:
  - Meliputi: NIK (Nomor Induk Kependudukan), Nomor HP/WhatsApp, Alamat Email Pribadi, Nomor Rekening Bank, dan Data Biometrik.
- **Presentation Layer Masking (Dynamic UI Masking)**:
  - Tampilan publik atau user tanpa hak akses penuh *Privileged Data Viewer* wajib menyamarkan data sensitif:
    - Email: `bag***@domain.com`
    - Telepon: `0812-****-5678`
    - NIK: `3271************`
- **Zero PII Logging Policy**:
  - Dilarang keras mencatat (*logging*) password mentah, token otentikasi lengkap, NIK, atau data kartu kredit ke dalam file log disk server atau console stdout (`console.log` / Winston / Pino).
  - Header `Authorization` wajib disanitasi menjadi `Bearer [REDACTED]` pada access log.

## Password Policy
- Minimal 8 karakter
- Huruf besar
- Huruf kecil
- Angka
- Karakter khusus
- Password Expiration
- Password History (Mencegah penggunaan 3-5 password sebelumnya)

## Account Recovery & Emergency Access
- Forgot Password
- Reset Password
- Temporary Password
- MFA Recovery
- Break Glass Account
- Emergency Access

## Password Bypass (Enterprise Standard)
### Level 1
Forgot Password (Verifikasi OTP / Email Magic Link)

### Level 2
Admin Reset Password (Generate temporary link/password oleh Superadmin)

### Level 3
Temporary Password (One-Time Password dengan masa kedaluwarsa 24 jam)

### Level 4
MFA Recovery (Security Questions & Backup Recovery Codes)

### Level 5
Break Glass Account (Akses Darurat Khusus Audit & Bencana)

Ketentuan:
- Tidak boleh melihat password user
- Password tidak boleh plaintext di database maupun di transit jaringan
- Semua aktivitas bypass dan perubahan wajib tercatat di Audit Trail

---

# 4. Identity Foundation

## User Management
- User (Multi-role accounts)
- Role-Specific Accounts: Kasir, Purchasing, Warehouse, Manager, Superadmin
- Employee
- Vendor
- Customer
- Member

## Role Management & Activity Isolation
- Role & Permission
- **Role-Based Activity Boundary**: Setiap role dibatasi ketat hanya pada aktivitas operasionalnya:
  - *Kasir*: Hanya dapat membuat transaksi penjualan (POS), tidak dapat mengubah harga produk atau diskon master.
  - *Purchasing*: Hanya dapat membuat Purchase Order dan Purchase Request.
  - *Warehouse*: Hanya dapat mengelola pergerakan stok, gudang, dan surat jalan.
  - *Manager*: Memiliki kewenangan review, approval berjenjang, dan monitoring laporan.
- Role Mapping
- Menu Mapping
- API Mapping

## Page Identity System (Identitas Halaman)
- Setiap halaman aplikasi wajib memiliki identitas unik (`pageId`, contoh: `PAGE_SALES_POS`, `PAGE_INVENTORY_STOCK`, `PAGE_USER_MGMT`, `PAGE_NOTED_TREE`).
- Matriks Role-to-Page Permission mengatur hak operasi per halaman:
  - `can_view`
  - `can_create`
  - `can_edit`
  - `can_delete`
  - `can_export`
  - `can_approve`
- Route Guard pada frontend membatasi akses user di luar aktivitasnya dan mengalihkan ke halaman *403 Forbidden* jika hak akses tidak valid.

## Delegation
- Pengalihan Approval
- Pengalihan Tugas
- Pengganti Sementara (Temporary Delegation saat cuti)

---

# 5. Organization Foundation

```text
Tenant
└── Company (Multi-Company: PT MFC Retail & PT MFC Manufacturing)
    └── Branch (Cabang, Toko, Gudang, Pabrik)
        └── Department
            └── Employee
```

Fitur:
- **Multi Tenant & Multi Company**: Mendukung multi-perusahaan (misal: PT MFC Retail dan PT MFC Manufacturing) berjalan berdampingan dalam satu instalasi platform.
- **Company Context Switcher**: Dropdown aktif pada Topbar untuk beralih konteks perusahaan yang sedang dikelola.
- **Row-Level Isolation**: Seluruh tabel transaksi dan referensi menyertakan `company_id` untuk isolasi data otomatis.
- **Multi Branch**: Struktur lokasi operasional terpisah (Cabang Jakarta, Gudang Surabaya, Pabrik Sumbawa).
- **Multi Department**: Pemisahan departemen operasional (Finance, Warehouse, Retail, HRD).

---

# 6. Data Foundation

## Data Governance
- Owner
- Source
- Classification
- Retention
- Version

## Form Input Validation & Anti-SQL Injection
- **Pencegahan SQL Injection**: Seluruh akses database wajib menggunakan parameterized queries (Prisma ORM prepared statements). Dilarang keras melakukan string concatenation pada query SQL.
- **Sanitasi Nilai Input**: Seluruh input form divalidasi dan dibersihkan dari karakter berbahaya dan tag injeksi (`XSS` dan `SQLi`).
- **Skema Validasi DTO**: Setiap payload form wajib didefinisikan dengan skema data kuat (DTO) yang membatasi tipe data, format teks, panjang maksimum, dan nilai terizinkan.

## Data Classification
- Public
- Internal
- Confidential
- Restricted

## Audit Column Standard

```sql
created_at
created_by
updated_at
updated_by
deleted_at
deleted_by
```

## Data Lifecycle
- Create
- Update
- Archive
- Delete (Soft Delete standard)
- Restore

## UUID Standard
Seluruh tabel utama menggunakan UUID v4 sebagai Primary Key.

---

# 7. Master Data Foundation

Master data wajib terpusat.

## Core Master
- Product
- Supplier
- Customer
- Warehouse
- Currency
- Tax
- Department
- Position
- Unit Of Measure

## Dynamic Master
Dapat ditambah melalui panel admin tanpa coding.

---

# 8. Document Foundation

## File Management & Upload Security
- Upload
- Download
- Preview
- Versioning
- **Batasan & Validasi Berkas Ketat**:
  - Batasan ukuran file (Maksimal 10 MB per berkas, dapat dikonfigurasi per modul).
  - Validasi ekstensi whitelist: `.pdf`, `.png`, `.jpg`, `.jpeg`, `.xlsx`, `.docx`.
  - Pemeriksaan ganda: Verifikasi MIME Type dan Magic Bytes header berkas sebelum disimpan di server, mencegah upload skrip berbahaya (`.php`, `.sh`, `.exe`, `.js`).
  - Penamaan aman (*Anti-Path Traversal*): Seluruh berkas disimpan menggunakan UUID/random hash acak pada disk server.

## Storage Provider
- Local
- MinIO
- AWS S3
- Azure Blob
- Google Cloud Storage

## Digital Signature
- QR Signature
- Electronic Signature
- Approval Signature

---

# 9. Workflow Foundation

## Workflow Engine

```text
Draft
Submitted
Verified
Approved
Rejected
Completed
Cancelled
```

## Approval Engine
- Single Approval
- Multi Approval
- Parallel Approval
- Conditional Approval

## SLA
- Reminder
- Escalation
- Auto Escalation

---

# 10. Communication Foundation

## Notification Center
- In App
- Email
- SMS
- WhatsApp
- Push Notification

## Template Engine
- Dynamic Variable
- Multi Language
- Scheduled Notification

---

# 11. Integration Foundation

## API Gateway
- Authentication
- Authorization
- Rate Limit
- Logging
- Monitoring

## Resilience, Circuit Breaker & Remote Fallback `[ENTERPRISE UPGRADE]`
- **Micro Frontend Error Boundary & Graceful Degradation**:
  - Jika remote module (misal: remote `compUI` atau remote modul lain) gagal diunduh karena gangguan jaringan, shell host dilarang mengalami *white screen* / crash total.
  - Setiap pemanggilan remote component wajib dibungkus dengan `<ModuleBoundary fallback={<ModuleOfflineFallback project="compUI" />} />`.
- **API Client Circuit Breaker Pattern**:
  - Panggilan antar-layanan (Microservice ke Microservice atau UI ke API) menerapkan status: `CLOSED` (normal), `OPEN` (gagal berturut-turut > 5 kali, langsung return fallback tanpa menunggu timeout), `HALF-OPEN` (uji coba kirim 1 request setelah cooldown 30 detik).
  - Mekanisme *Exponential Backoff Retry* dengan jitter (misal: retry 1s, 2s, 4s) hanya untuk request idempotent (`GET`).

## Event-Driven Architecture (EDA) & Transactional Outbox Pattern `[ENTERPRISE UPGRADE]`
- **Tantangan Dual-Write**: Menyimpan data ke database dan mem-publish event ke message queue secara terpisah berisiko kehilangan event (*message loss*) jika broker jaringan terputus sesaat.
- **Pola Transactional Outbox**:
  - Setiap mutasi bisnis (misal: "Catatan Dibuat", "Transaksi Disetujui") menulis payload event ke tabel `Outbox` di dalam database transaction (`prisma.$transaction`) yang sama.
  - Worker asinkron membaca tabel `Outbox` secara periodik dan mem-publish ke message broker (RabbitMQ/Redis/Kafka) dengan jaminan *At-Least-Once Delivery*.
  - Status event diperbarui menjadi `PUBLISHED` setelah konfirmasi ACK dari broker.

## API Contract Schema-First (OpenAPI / Swagger Sync) `[ENTERPRISE UPGRADE]`
- Backend NestJS mengekspor spesifikasi kontrak endpoint dalam format OpenAPI 3.0 via Swagger (`/api/docs-json`).
- Script build otomatis (`pnpm run generate:contracts`) mentranslasikan OpenAPI schema menjadi interface TypeScript murni di package shared `@base/contracts`.
- Menghilangkan *type drift* dan bug integrasi antara developer backend dan developer frontend.

## Integration Method
- REST API
- GraphQL
- Webhook
- Message Queue
- File Transfer

## Queue
- RabbitMQ
- Kafka
- Redis Queue

---

# 12. Reporting Foundation

## Dashboard
- KPI
- Summary
- Drill Down
- Analytics

## Report Engine
- PDF
- Excel
- CSV

## Scheduled Report
- Daily
- Weekly
- Monthly

---

# 13. Governance Foundation

## Audit Trail (Diff Tracking Before vs After)
Mencatat perubahan data secara mendalam:
- **Perekam Perubahan Eksplisit (JSON Diff)**:
  - Menyimpan nilai lama (*old value*) dan nilai baru (*new value*) per kolom yang berubah.
  - *Contoh*: Mengetahui siapa yang mengubah harga produk dari 50.000 ke 45.000, kapan dilakukan, dari IP mana, dan user agent apa.
- User ID & Nama Pelaku
- Role saat mengeksekusi aksi
- Timestamp presisi (ISO-8601 dengan milidetik)
- IP Address & User Agent
- Entity Name & Entity ID

### Standar Struktur JSON Diff Payload:
```json
{
  "auditId": "aud-98b72c41-89d2-4e56-91b3-4f51e06d2026",
  "entityName": "Product",
  "entityId": "prod-e7c8b091-23a1-4e78-98e2-b892a0142026",
  "action": "UPDATE",
  "changedFields": [
    {
      "field": "price",
      "oldValue": 50000,
      "newValue": 45000
    },
    {
      "field": "discountPercent",
      "oldValue": 0,
      "newValue": 10
    }
  ],
  "changedBy": {
    "userId": "usr-kasir-01",
    "userName": "Kasir Utama",
    "role": "Kasir"
  },
  "clientMeta": {
    "ipAddress": "192.168.1.120",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  "timestamp": "2026-11-24T16:15:20.450Z"
}
```

## Activity Log
- Login
- Logout
- Create
- Update
- Delete
- Export (CSV, Excel, PDF)
- Approve
- Reject

---

# 14. Infrastructure Foundation

## Environment
- Local
- Development
- SIT
- UAT
- Staging
- Production

## Container Platform
- Docker
- Kubernetes

## Dual-Layer Cache System
- **Backend Redis Cache**:
  - Respon query API di-cache pada Redis dengan masa kedaluwarsa (TTL) default 5 menit.
  - Cache otomatis di-invalidate saat ada aksi mutasi (`POST`, `PUT`, `DELETE`).
- **Frontend LocalStorage Cache**:
  - Respon API disimpan pada storage lokal per modul.
  - Saat UI dibuka, data langsung ditampilkan dari local storage (*Zero Loading State*) dan segera diperbarui saat respon API terbaru diterima (*Stale-While-Revalidate*).
- CDN Cache (Aset statis JS, CSS, Media)

---

# 15. Monitoring & Observability Foundation

## Monitoring
- CPU
- RAM
- Disk
- Database
- API Response Time

## Logging
- INFO
- WARN
- ERROR
- DEBUG

## Distributed Tracing & W3C Trace Context `[ENTERPRISE UPGRADE]`
- **W3C `traceparent` Standard**:
  - Propagasi header `traceparent` (`00-{trace-id}-{span-id}-{trace-flags}`) melintasi UI Client React -> Shell Host -> Remote Micro FE -> API Gateway -> NestJS Microservices.
- **Correlation & End-to-End Latency Tracking**:
  - Setiap user interaction menghasilkan `trace-id` unik yang diteruskan ke setiap HTTP header.
  - Memungkinkan pelacakan presisi bottleneck query database (Prisma / MySQL) hingga ke level span komponen antarmuka.
- Request ID
- Correlation ID
- Trace ID

---

# 16. Development Foundation

## Git Flow

```text
main
│
develop
│
├── feature
├── bugfix
├── release
└── hotfix
```

## Development Rules (Alur Kerja Standar)
1. **Kerjakan 1 Bagian**: Fokus pada satu fitur atau modul terisolasi.
2. **Verifikasi & Pengujian**: Jalankan unit test, linting, dan build Nx (`npx nx build <project>`) hingga 100% lulus tanpa error.
3. **Commit Terstruktur**: Catat commit dengan pesan jelas agar riwayat pekerjaan tersusun rapi dan terdeteksi dengan baik.
4. **Push & Pull Request**: Ajukan PR untuk review tim sebelum merge.
5. **Review & Merge**: Validasi Quality Gate sebelum merge ke branch utama.

## Commit Standard
```bash
feat(module): add feature
fix(module): fix bug
refactor(module): improve code
docs(module): update docs
test(module): add or update test
```
fix(module): fix bug
refactor(module): improve code
docs(module): update docs
```

---

# 17. Testing Foundation

## Testing Layer
- Unit Test
- Integration Test
- API Test
- UAT
- Security Test
- Performance Test

## Minimum Coverage
- Unit Test >= 70%

---

# 18. Deployment Foundation

## Deployment Flow

```text
Development
→ SIT
→ UAT
→ Staging
→ Production
```

## CI/CD Pipeline
- Build
- Test
- Security Scan
- Code Analysis
- Deploy

---

# 19. Backup & Disaster Recovery

## Backup
- Daily
- Weekly
- Monthly

## Retention
- Daily 30 Hari
- Weekly 12 Minggu
- Monthly 12 Bulan

## Recovery Test
Minimal 1 kali per bulan.

---

# 20. AI Foundation

## AI Assistant
- Internal Chatbot
- Knowledge Base
- FAQ Engine

## OCR
- KTP
- NPWP
- Invoice
- Dokumen

## Forecasting
- Sales Forecast
- Stock Forecast
- Demand Forecast

---

# 21. Enterprise ERP Readiness

Modul bisnis wajib kompatibel dengan:

- Finance
- Procurement
- Inventory
- Warehouse
- Manufacturing
- Sales
- CRM
- HRIS
- Asset Management
- Project Management
- Maintenance
- Quality Control

Seluruh modul wajib menggunakan:
- Authentication
- Workflow
- Approval
- Notification
- Audit Trail
- File Management
- Reporting

---

# 22. Project Lifecycle

1. Diskusi dan Analisa
2. BRD
3. FRD/FSD
4. SRS
5. HLD
6. LLD
7. Development
8. SIT
9. UAT
10. Penyesuaian
11. Deployment
12. Go Live
13. Garansi
14. Support dan Enhancement

---

# 23. Quality Gate

Aplikasi tidak boleh Go-Live bila:

- Build gagal
- Unit Test gagal
- Security Scan gagal
- UAT belum disetujui
- Backup belum tersedia
- Monitoring belum aktif
- Audit Trail belum aktif

---

# 24. Standard UI Components: Enterprise Data Table Framework `[✅ IMPLEMENTED]`

> [!NOTE]
> Implementasi acuan baseline aktif di: [table.tsx](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/packages/shared/ui/src/components/ui/table.tsx).

Seluruh modul tabular pada ekosistem MFC wajib mengadopsi spesifikasi antarmuka terpadu:

## Global Search All
- Kolom pencarian global tunggal yang menyaring data secara instan di seluruh kolom teks yang tampil maupun kolom tersembunyi.
- Mendukung *debounced search* (300-400 ms) untuk efisiensi query server.

## Pagination & Count
- Navigasi halaman yang jelas (`Sebelumnya`, `1, 2, ... N`, `Berikutnya`).
- Indikator baris data transparan: `Menampilkan X sampai Y dari total Z data`.

## Jumlah per View (Page Size Selector)
- Dropdown fleksibel jumlah baris per halaman: **5, 10, 25, 50, 100 baris**.

## Download & Export Engine
- Tombol terpadu untuk mengekspor data yang sedang disaring:
  - **Excel (.xlsx)**: Spreadsheet terformat lengkap dengan header dan styling.
  - **CSV (.csv)**: Data terkompresi untuk pengolahan eksternal.
  - **PDF (.pdf)**: Lembar laporan formal siap cetak dengan kop dokumen resmi.

## Multi-Row Selection & Bulk Operations
- Checkbox pada setiap baris data dan *Select All* pada header tabel.
- Bar aksi massal mengambang (*floating bulk action bar*) saat ada baris yang dipilih:
  - Hapus Massal (*Bulk Delete*)
  - Persetujuan Massal (*Bulk Approve*)
  - Ekspor Data Terpilih (*Export Selected Rows*)

---

# 25. REST API Standard & Error Response Dictionary `[✅ IMPLEMENTED]`

> [!NOTE]
> Implementasi aktif di:
> - Rate Limiter: [rate-limiter.middleware.ts](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/apps/api/src/common/rate-limiter.middleware.ts)
> - Envelope & Dictionary: [api-envelope.interceptor.ts](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/apps/api/src/common/api-envelope.interceptor.ts)

## Rate Limiting Request Policy
- Pembatasan frekuensi request API per IP dan per Token akun untuk mencegah brute-force, DDoS, dan scraping ilegal.
- Standard default: Maksimal 100 request / menit per klien (dapat disesuaikan pada endpoint sensitif seperti Login: 5 request / menit).

## Standard Response Envelope
Seluruh endpoint REST API backend wajib mengembalikan struktur envelope terstandarisasi:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data berhasil dimuat",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 120,
    "totalPages": 12
  },
  "timestamp": "2026-11-24T03:30:00.000Z"
}
```

## Kamus Pesan Respon Error Baku (Strict Error Dictionary)
Pesan error REST API wajib mengikuti format kamus baku berikut:

| Kondisi / Kasus | Format Pesan Baku | Status Code |
| :--- | :--- | :--- |
| **API Key Tidak Ada** | `API Key is required` | 401 Unauthorized |
| **API Key Tidak Sesuai** | `Invalid API Key` | 403 Forbidden |
| **Parameter Wajib Tidak Ada** | `Required parameter {parameter} is missing` | 400 Bad Request |
| **Parameter Kosong / Spasi** | `The {parameter} field is required.` | 400 Bad Request |
| **Data / Entitas Salah / Tidak Ditemukan** | `{parameter} not found` | 404 Not Found |
| **Data / Entitas Ditemukan / Sukses** | `{parameter} found` | 200 OK |

---

# 26. Dual-Layer Caching Architecture (Redis & LocalStorage SWR)

> [!NOTE]
> Client-side SWR Cache Engine aktif di: [cache-swr.ts](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/packages/shared/auth/src/cache-swr.ts).
> Hot-reload container aktif via `node --watch` di [docker-compose.yml](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/docker-compose.yml).

Mekanisme cache ganda untuk mencapai performa tinggi dan rendering instan tanpa loading:

```text
Klien (Browser)                             Server (NestJS Backend)
┌──────────────────────┐                     ┌──────────────────────┐
│ LocalStorage Cache   │                     │ Redis In-Memory      │
│ (Instant UI Display) │                     │ (TTL 5 Menit)        │
└──────────┬───────────┘                     └──────────┬───────────┘
           │                                            │
           │ 1. Render data lokal langsung              │
           │ 2. Kirim API request di background         │
           ▼                                            ▼
     [Stale UI] ────────────── HTTP Fetch ────────► [Check Cache]
                                                         │
                                               Ada Cache │ Tidak Ada Cache
                                                         ▼           ▼
                                                    [Return]   [Query MySQL]
                                                         │           │
     [Update UI Baru] ◄────── Respon Baru ───────────────┴───────────┘
```

1. **Backend Cache (Redis)**:
   - Data referensi dan katalog umum disimpan di memori Redis dengan TTL 5 menit (`300 detik`).
   - Pengecekan *timestamp* mutasi terakhir: Jika data diperbarui sebelum 5 menit, cache di-refresh.
   - Mutasi data (`POST`, `PUT`, `DELETE`) secara otomatis menghapus (*invalidate*) key cache terkait.
2. **Frontend Cache (LocalStorage / IndexedDB)**:
   - Respon API disimpan ke storage browser.
   - Saat halaman dibuka kembali, UI langsung merender data dari storage (*Zero Loading Spinner*).
   - Saat respon jaringan diterima, data diperbarui secara halus (*Stale-While-Revalidate*).

---

# 27. Defensive Programming & Safe Variable Guidelines `[✅ IMPLEMENTED]`

> [!NOTE]
> Helper fungsi sanitasi, validasi nilai aman, dan file security guard aktif di: [security-guard.ts](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/packages/shared/auth/src/security-guard.ts).

Pedoman penulisan kode aman (*robust coding standards*) di seluruh modul:

## Safe Variable Verification
- Dilarang mengakses properti objek bertingkat secara langsung tanpa pemeriksaan.
- Wajib menggunakan:
  - *Optional Chaining*: `user?.profile?.address`
  - *Nullish Coalescing*: `value ?? defaultFallback`
  - *Type Guard Assertion*: Memvalidasi keberadaan dan tipe data variabel sebelum masuk ke tahap pemrosesan kalkulasi bisnis atau manipulasi array.

## Structured Try-Catch Block
- Seluruh pemrosesan data multi-sumber, integrasi microservice, dan deserialisasi JSON wajib dibungkus blok `try-catch`.
- Blok `catch` wajib:
  1. Mencatat error secara terstruktur pada logger sistem (menyertakan konteks input dan trace ID).
  2. Mengembalikan nilai fallback yang aman (*Safe Graceful Fallback*) agar antarmuka tidak mengalami *white screen* / crash total.

---

# 28. Advanced Enterprise Workflow & Core Platform Architecture

Struktur hierarki terpadu Core Platform MFC:

```text
CORE PLATFORM
├── Security
│   ├── Authentication (JWT, MFA, SSO, Client-Side Hashing, Session Inactivity Auto-Lock)
│   ├── Authorization (RBAC, Page Identity Matrix, Activity Boundary)
│   └── API Gateway (Routing, Security Throttler, Rate Limiting)
│
├── Identity
│   ├── User (Kasir, Purchasing, Warehouse, Manager, Admin)
│   ├── Role (Role Mapping, Activity Isolation)
│   └── Permission (Page Permission, Field Access)
│
├── Organization
│   ├── Multi-Company (PT MFC Retail & PT MFC Manufacturing Context Switcher)
│   ├── Branch (Cabang, Toko, Gudang, Pabrik)
│   ├── Department (Finance, SCM, Production, HRD)
│   └── Employee (Penugasan & RACI Matrix)
│
├── Collaboration
│   ├── Workflow Engine (Conditional Multi-Tier Approval Matrix: <5jt, 5-50jt, >50jt)
│   ├── Notification Center (Real-Time SSE, In-App, Email, WA, Push)
│   └── Task Management (WBS, Sub-Notes, Checklist)
│
├── Governance
│   ├── Audit Trail (Diff Tracking Before vs After)
│   ├── Activity Log (Login, Export, Approval, Update)
│   └── System Log (Error Tracking, Request ID Trace)
│
├── Document
│   ├── File Management (Batasan Ukuran, MIME Whitelist, Magic Bytes)
│   ├── Attachment (Storage Provider S3/Local)
│   └── Document Versioning & Digital Signature
│
└── Master Data
    ├── Product
    ├── Supplier
    ├── Customer
    ├── Warehouse
    ├── Tax
    ├── Currency
    └── Unit Of Measure
```

---

# MFC Enterprise Standard

Framework ini menjadi standar wajib seluruh pengembangan aplikasi MFC agar setiap sistem memiliki arsitektur, keamanan, tata kelola, proses bisnis, dan operasional yang konsisten, scalable, maintainable, dan enterprise-ready.
