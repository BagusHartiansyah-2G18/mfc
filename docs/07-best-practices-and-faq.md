# 07. Best Practices, Konvensi & FAQ

Dokumen ini memuat panduan standar rekayasa perangkat lunak (*engineering standards*), konvensi monorepo, serta solusi untuk kendala teknis yang sering ditemui (*troubleshooting*).

---

## 1. Aturan & Konvensi Monorepo (Best Practices)

### A. Integritas Pustaka Komponen UI
> [!IMPORTANT]
> **Jangan pernah mengubah komponen primitif di `packages/shared/ui/src/components/*` secara sembarangan.**  
> Seluruh Host dan Remote bergantung pada pustaka ini. Perubahan tanpa uji regresi dapat merusak tampilan aplikasi lain. Selalu manfaatkan komposisi (*composition*), *slot props*, atau *custom className* saat membutuhkan kustomisasi tampilan.

### B. Konvensi Import Modul
Gunakan selalu path alias standar TypeScript yang telah terdaftar di `tsconfig.base.json`:
* ✅ **BENAR**:
  ```ts
  import { Button, FormField } from '@org/ui';
  import { authStore, RouteGuard, Can } from '@org/auth';
  ```
* ❌ **SALAH** (Hindari deep relative import):
  ```ts
  import { Button } from '../../../../packages/shared/ui/src/components/ui/button';
  ```

### C. Manajemen Status Sesi (Session State)
* Jangan menyimpan status autentikasi di dalam state lokal komponen (seperti `useState` di halaman).
* Selalu konsumsi dan perbarui status login melalui `authStore` (`@org/auth`) agar tersinkronisasi secara otomatis di seluruh tab dan Micro Front-End.

### D. Singletons pada Module Federation
Untuk modul inti seperti `react`, `react-dom`, dan `react-router-dom`, selalu pastikan konfigurasi `federation` di `vite.config.mts` menyertakan `singleton: true`. Ini mencegah *runtime mismatch* seperti error `"Cannot read property of null (reading 'useState')"`.

---

## 2. Troubleshooting & FAQ (Pertanyaan Umum)

### Q1: Muncul error `NX The workspace is out of sync` saat build?
**Penyebab**: Referensi TypeScript antar-project di file `tsconfig.*.json` belum tersinkronisasi setelah penambahan project atau library baru.  
**Solusi**:
Jalankan perintah sinkronisasi otomatis Nx:
```bash
npx nx sync
```

---

### Q2: Muncul error `Failed to resolve import "@org/auth"` atau `"@org/ui"`?
**Penyebab**: File konfigurasi Vite atau Vitest belum mendaftarkan alias folder package.  
**Solusi**:
Pastikan `vite.config.mts` atau `vitest.config.mts` memiliki entri alias berikut:
```ts
resolve: {
  alias: {
    '@org/ui': path.resolve(import.meta.dirname, '../../packages/shared/ui/src/index.ts'),
    '@org/auth': path.resolve(import.meta.dirname, '../../packages/shared/auth/src/index.ts'),
  },
}
```

---

### Q3: Bagaimana cara membuka seluruh modul tanpa login saat sedang mengembangkan UI?
**Solusi**:
Aktifkan **Dev Bypass Mode**:
1. Di file `.env`, ubah:
   ```bash
   userbypass=true
   VITE_USER_BYPASS=true
   ```
2. Atau ketik di Console Browser (F12):
   ```js
   localStorage.setItem('mfc_dev_userbypass', 'true');
   location.reload();
   ```
Rute aplikasi akan langsung terbuka dengan status `[DEV BYPASS ACTIVE]`.

---

### Q4: Mengapa Remote MFE bisa dibuka langsung di port masing-masing?
**Penjelasan**:
Setiap Remote MFE (`compUI` di port 4201 dan `userMgmt` di port 4202) dilengkapi dengan dua titik masuk (*dual-entry*):
1. **Mode Remote (Module Federation)**: Diekspor melalui `exposes: { './App': './src/App.tsx' }` untuk dimuat oleh Host Portal.
2. **Mode Standalone (`bootstrap.tsx`)**: Menggunakan `DashShell` lokal sehingga tim developer dapat mengembangkan dan menguji Remote secara terisolasi tanpa perlu menjalankan Host Portal.

---

### Q5: Backend gagal terkoneksi ke database (`Can't reach database server at localhost:3306`)?
**Penyebab**: Container MySQL Docker belum berjalan.  
**Solusi**:
1. Pastikan Docker Desktop aktif di komputer Anda.
2. Jalankan container:
   ```bash
   docker compose up -d mysql
   ```
3. Lakukan sinkronisasi schema dan data seed:
   ```bash
   npm run prisma:push
   npm run prisma:seed
   ```

---

### Q6: Bagaimana jika backend API sedang mati saat saya ingin menjalankan Host Portal?
**Penjelasan**:
Halaman login (`LoginPage.tsx`) telah dilengkapi dengan **Dual Mode Resilience**:
* Jika backend online di `http://localhost:3000`, login divalidasi ke database MySQL via Bcrypt.
* Jika backend offline atau saat pengujian otomatis (*unit test*), sistem secara otomatis beralih ke simulasi kredensial lokal tanpa menampilkan error koneksi. Anda dapat login dengan akun demo seperti `admin` atau `client` dengan password `Password123!`.
