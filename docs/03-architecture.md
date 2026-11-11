# 03. Arsitektur & Diagram Sistem

Dokumen ini menjelaskan arsitektur tingkat tinggi (*high-level architecture*) dari ekosistem Micro Front-End (MFE) MFC/BGS, protokol komunikasi antar-aplikasi, serta alur otentikasi dan keamanan.

---

## 1. Topologi Arsitektur Sistem

Monorepo ini mengadopsi model **Host-Remote Micro Front-End** yang didukung oleh **Module Federation 2.0** dan paket shared terpusat.

```mermaid
flowchart TD
    subgraph Browser ["Client Web Browser"]
        User["Pengguna / Klien"]
    end

    subgraph HostApp ["Host Application (Port 4200)"]
        Portal["apps/portal (Host Shell)"]
        Router["React Router v6"]
        Guard["RouteGuard & Dev Bypass"]
        MFLoader["Runtime Remote Loader (mf.ts)"]
    end

    subgraph Remotes ["Remote Micro Front-Ends"]
        CompUI["apps/compUI (Port 4201)<br/>Component Showcase & Docs"]
        UserMgmt["apps/userMgmt (Port 4202)<br/>User & Access Management"]
    end

    subgraph SharedLibs ["Shared Packages (Zero Duplication)"]
        SharedUI["@org/ui<br/>(DashShell, PublicLayout, Form Controls)"]
        SharedAuth["@org/auth<br/>(Session Store, RBAC, Can, authFetch)"]
    end

    subgraph BackendSystem ["Backend & Persistence (Port 3000)"]
        NestAPI["apps/api (NestJS REST API)"]
        PrismaORM["Prisma ORM Client"]
        MySQL[(MySQL 8.0 Database)]
        AuditTrail[(Audit Log Records)]
    end

    User --> Portal
    Portal --> Guard
    Guard --> Router
    Router --> MFLoader

    MFLoader -.->|Dynamic HTTP Fetch remoteEntry.js| CompUI
    MFLoader -.->|Dynamic HTTP Fetch remoteEntry.js| UserMgmt

    Portal --> SharedUI
    Portal --> SharedAuth
    CompUI --> SharedUI
    CompUI --> SharedAuth
    UserMgmt --> SharedUI
    UserMgmt --> SharedAuth

    Portal -->|REST API authFetch (Bearer + X-Request-ID)| NestAPI
    UserMgmt -->|REST API authFetch (Bearer + X-Request-ID)| NestAPI
    NestAPI --> PrismaORM
    PrismaORM --> MySQL
    PrismaORM --> AuditTrail
```

---

## 2. Dynamic Runtime Module Federation 2.0

Arsitektur ini **tidak** menggunakan build-time coupling. Sebaliknya, aplikasi Host memuat aplikasi Remote secara **asinkron pada runtime** melalui file `remoteEntry.js`.

### Alur Pemuatan Remote:

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna
    participant Host as apps/portal (Host)
    participant MFLoader as mf.ts (Dynamic Loader)
    participant Remote as apps/userMgmt (Remote)
    participant Shared as @org/ui & @org/auth

    User->>Host: Navigasi ke URL /users
    Host->>Host: RouteGuard memeriksa sesi & izin ('users:view')
    Host->>MFLoader: Panggil loadRemoteApp('userMgmt')
    MFLoader->>Remote: Unduh http://localhost:4202/remoteEntry.js
    Remote-->>MFLoader: Registrasi container remote & exposed modules
    MFLoader->>Shared: Negosiasi singleton dependency (React 19, react-router-dom)
    MFLoader->>Remote: Inisialisasi komponen App remote
    Remote-->>Host: Render komponen remote ke DOM Host
    Host-->>User: Tampilan User Management muncul mulus tanpa reload
```

### Strategi Shared Dependencies:
Agar tidak terjadi duplikasi bundle React di memori browser, konfigurasi Module Federation menerapkan aturan `singleton: true`:

```ts
shared: {
  react: { singleton: true, requiredVersion: '^19.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
  'react-router-dom': { singleton: true, requiredVersion: '^6.30.0' },
}
```

---

## 3. Alur Autentikasi, Keamanan & RBAC Terpusat

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Admin
    participant LoginPage as apps/portal (LoginPage)
    participant AuthStore as @org/auth (authStore)
    participant API as apps/api (NestJS AuthModule)
    participant DB as MySQL (Prisma)
    participant Guard as RouteGuard
    participant Target as Protected Page (/dashboard)

    User->>LoginPage: Masukkan Email & Password + Submit
    LoginPage->>API: POST /api/auth/login (emailOrUsername, password, rememberMe)
    API->>DB: Query User & RolePermissions
    DB-->>API: Data User (passwordHash, status, permissions)
    API->>API: Bcrypt compare & Status Verification
    API->>DB: INSERT INTO audit_logs (LOGIN_SUCCESS, IP, UserAgent)
    API-->>LoginPage: 200 OK (accessToken, userProfile, expiresAt)
    LoginPage->>AuthStore: authStore.setSession(user, token, rememberMe)
    AuthStore->>AuthStore: Simpan ke localStorage (7 hari) / sessionStorage (30 menit)
    LoginPage->>Guard: Redirect ke target URL (/dashboard)
    Guard->>AuthStore: isAuthenticated() & hasPermission()
    AuthStore-->>Guard: Izin valid
    Guard->>Target: Render Halaman Dashboard
```

---

## 4. Distributed Tracing & Audit Logging

Setiap interaksi antara frontend dan backend dijamin dapat diaudit secara transparan (*enterprise compliance*):

```mermaid
flowchart LR
    subgraph ClientSide ["Frontend Client"]
        Call["authFetch('/api/users')"]
        Inject["1. Suntik Header:<br/>• Authorization: Bearer token<br/>• X-Request-ID: req-179436..."]
    end

    subgraph BackendSide ["NestJS REST API"]
        Intercept["Extract X-Request-ID & IP Client"]
        Audit["Prisma.auditLog.create({<br/>action: 'USER_CREATED',<br/>actorId: user.id,<br/>ipAddress: ip,<br/>details: JSON<br/>})"]
    end

    subgraph Storage ["Database Storage"]
        DB[(MySQL audit_logs)]
    end

    Call --> Inject
    Inject -->|HTTP Request| Intercept
    Intercept --> Audit
    Audit --> DB
```

1. **`X-Request-ID`**: Dibuat secara otomatis di client untuk setiap siklus HTTP request dan dapat dilacak pada log server.
2. **`AuditLog Table`**: Mencatat `action` (`LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `USER_CREATED`, dll.), `entity`, `actorId`, `actorName`, `ipAddress`, dan `createdAt`.
