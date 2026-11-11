# 05. Autentikasi, Keamanan & RBAC (@org/auth)

Dokumen ini menjelaskan spesifikasi arsitektur keamanan, manajemen sesi, kontrol akses berbasis peran (RBAC), dev bypass mode, dan pencatatan audit log di seluruh ekosistem MFE.

---

## 1. Paket Terpusat: `@org/auth`

Seluruh logika autentikasi dan otorisasi dikonsolidasikan ke dalam satu paket shared di [`packages/shared/auth`](file:///c:/Users/bhar1609/Downloads/BGS/MicroFE/base/packages/shared/auth):

```
packages/shared/auth/src/
├── types.ts           # Definisi tipe sesi (UserSession, UserProfile, Role, Permission)
├── auth-store.ts      # Reactive Session Store, Storage Adapter, Dev Bypass Switch
├── use-auth.ts        # Hook useAuth() untuk komponen React
├── use-permission.ts  # Fine-grained RBAC/ABAC checker & usePermission() hook
├── can.tsx            # Komponen deklaratif <Can I="action" this="module" />
├── route-guard.tsx    # Komponen pelindung rute <RouteGuard />
├── auth-client.ts     # Wrapper authFetch (Authorization header + X-Request-ID)
└── index.ts           # Public API re-export
```

---

## 2. Manajemen Sesi & Kebijakan Keamanan

Sistem membedakan dua jenis sesi pengguna berdasarkan pilihan **"Ingat Saya" (Remember Me)**:

| Mode Sesi | Penyimpanan | Masa Aktif | Keterangan |
| :--- | :--- | :--- | :--- |
| **Normal Session** | `sessionStorage` | **30 Menit** (Idle Timeout) | Terhapus otomatis saat tab/browser ditutup atau idle > 30 menit. |
| **Remember Me** | `localStorage` | **7 Hari** | Tetap aktif saat browser dibuka kembali hingga 7 hari kalender. |

### Auto Logout
Pengguna otomatis dikeluarkan (*logged out*) dari aplikasi jika:
1. Token kedaluwarsa (*expired*).
2. Status akun diubah menjadi `inactive` atau `suspended` oleh administrator.
3. User menekan tombol **Keluar (Logout)** di header navigasi.

---

## 3. Developer Bypass Mode (`userbypass=true`)

Untuk mendukung kecepatan pengembangan antarmuka dan pengujian tanpa ketergantungan koneksi database backend, sistem menyediakan fitur **Dev Bypass Mode**.

### Cara Mengaktifkan:

#### Opsi A: Melalui File `.env` (Global)
Tambahkan variabel berikut pada file `.env`:
```bash
userbypass=true
VITE_USER_BYPASS=true
```

#### Opsi B: Melalui Browser Console (Instan Per-Browser)
Buka Developer Tools (F12) di browser, lalu ketik di Console:
```js
localStorage.setItem('mfc_dev_userbypass', 'true');
location.reload();
```
*(Untuk mematikan kembali: `localStorage.setItem('mfc_dev_userbypass', 'false'); location.reload();`)*

### Perilaku Saat Bypass Aktif:
* Pengguna otomatis terautentikasi sebagai `Developer (Bypass Mode)` dengan role `Administrator` dan izin wildcard `*:*`.
* Komponen `<RouteGuard />` akan menampilkan badge visual berwarna kuning di pojok kanan atas:
  ```
  ⚡ DEV BYPASS ACTIVE
  ```
* Seluruh proteksi rute dilonggarkan sehingga developer bebas menavigasi seluruh modul MFE.

---

## 4. Fine-Grained Role-Based Access Control (RBAC)

Izin didefinisikan menggunakan format standar enterprise: `module:action`.

Contoh izin:
* `users:view` — Melihat daftar pengguna
* `users:create` — Menambah pengguna baru
* `users:edit` — Mengubah data pengguna
* `users:delete` — Menghapus pengguna
* `roles:view` — Melihat daftar role & matriks izin
* `audit_logs:view` — Melihat riwayat audit trail

### Penggunaan di Komponen React:

#### A. Menggunakan Hook `usePermission()`:
```tsx
import { usePermission } from '@org/auth';

export function UserListActions() {
  const { can, isSuperAdmin } = usePermission();

  return (
    <div>
      {can('create', 'users') && (
        <button className="btn-primary">Tambah User</button>
      )}
      {can('delete', 'users') && (
        <button className="btn-danger">Hapus</button>
      )}
    </div>
  );
}
```

#### B. Menggunakan Komponen Deklaratif `<Can />`:
```tsx
import { Can } from '@org/auth';

export function BillingSection() {
  return (
    <Can
      I="view"
      this="billing"
      fallback={<div className="p-4 text-slate-400">Anda tidak memiliki akses ke tagihan.</div>}
    >
      <BillingInvoiceTable />
    </Can>
  );
}
```

#### C. Melindungi Rute Halaman dengan `<RouteGuard />`:
```tsx
import { RouteGuard } from '@org/auth';

<Route
  path="/settings/security"
  element={
    <RouteGuard
      requiredRole="Administrator"
      requiredPermissions={['settings:edit']}
    >
      <SecuritySettingsPage />
    </RouteGuard>
  }
/>
```

---

## 5. Distributed Tracing & `authFetch`

Untuk memastikan semua panggilan API dapat ditelusuri riwayatnya dari browser hingga ke database backend:

```ts
import { authFetch } from '@org/auth';

// Otomatis menyertakan:
// 1. Authorization: Bearer <token_sesi>
// 2. X-Request-ID: req-<timestamp>-<random_hex>
const response = await authFetch('/api/users');
const data = await response.json();
```

---

## 6. Audit Logging Terpusat (Backend NestJS)

Backend REST API di `apps/api` mencatat aktivitas keamanan ke tabel `audit_logs` MySQL:

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  action     String   @db.VarChar(50) // 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', dll.
  entity     String   @db.VarChar(50) // 'User', 'Role', 'Permission'
  entityId   String?  @map("entity_id")
  actorId    String?  @map("actor_id")
  actorName  String?  @map("actor_name")
  details    String?  @db.Text        // JSON berisi metadata (User-Agent, IP, dll.)
  ipAddress  String?  @map("ip_address")
  createdAt  DateTime @default(now()) @map("created_at")
}
```
