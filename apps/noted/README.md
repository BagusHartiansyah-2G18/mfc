# MFC Noted — Panduan Pengguna, Form Fleksibel, Share Data, API Key, Friend & Hak Akses

**MFC Noted** adalah modul manajemen catatan hierarkis (*derivative notes*), dokumen, formulir fleksibel (*form builder* & kuesioner), serta dataset terstruktur dalam ekosistem BGS MicroFE.

- **Frontend Host (Standalone):** `http://localhost:4204` (`apps/noted`)
- **Route di Portal Terpadu:** `http://localhost:4200/noted`
- **Backend API (`api-noted`):** `http://localhost:3002/api` (`apps/api-noted`)

---

## 1. Navigasi & Fitur Utama (`apps/noted`)

| Menu / Halaman | Path (Standalone) | Fungsi Utama |
| :--- | :--- | :--- |
| **Catatan Saya** | `/` | Mengelola catatan induk & sub-catatan turunan (hierarki), progres, pagu/realisasi anggaran, lampiran file, approval, transaksi, dan checklist. |
| **Dibagikan ke Saya** | `/shared` | Melihat daftar catatan yang dibagikan oleh pemilik lain atau rekan kerja ke akun Anda. |
| **Katalog Publik** | `/public` | Menjelajahi catatan dan materi yang dipublikasikan dengan mode berbagi `PUBLIC`. |
| **Dokumen** | `/documents` | Pusat manajemen & pratinjau file lampiran di seluruh catatan (atau difilter dengan `?kdJudul=...`). |
| **Form Pendukung** | `/forms` | Katalog seluruh formulir fleksibel dari catatan yang dapat Anda akses. |
| **Kelola Form Catatan** | `/forms/:kdJudul` | Membuat, menyunting skema, mengatur akses, dan mengelola API Key formulir milik suatu catatan (`kdJudul`). |
| **Respon & Rekap Form** | `/forms/:kdJudul/:formId/responses` | Melihat rekap respon (`rekap`), mengisi formulir (`isi`), serta melihat info/link berbagi & ekspor data (`info`). |
| **Kuesioner Mandiri** | `/q/:shareSlug` | Tampilan pengisian kuesioner publik/mandiri yang ringkas tanpa perlu membuka dashboard penuh. |
| **Dataset** | `/dataset` | Eksplorasi gabungan data respon formulir lintas form/catatan dengan filter kolom & pencarian. |
| **Kelola Rekan** | `/friends` | Mengundang rekan via email, menerima/menolak undangan pertemanan, dan mengelola daftar koneksi aktif. |
| **Dashboard Metrik** | `/metrics` | Ringkasan total catatan, rata-rata progres, total pagu/realisasi anggaran, dan status deadline. |
| **Pilar & 5 Tahapan** | `/info` | Panduan metodologi *4 Points For Building A Data Set* & *5 Stages Information*. |

---

## 2. Penggunaan Form Fleksibel (*Form Builder* & Respon)

Setiap catatan (`kdJudul`) dapat memiliki satu atau beberapa formulir fleksibel (`DataForm`) untuk pengumpulan data terstruktur (misalnya survei, pendataan, pelaporan, hingga sumber data halaman profil/katalog).

### A. Membuat & Menyusun Skema Form
1. Buka catatan terkait lalu masuk ke **Form Pendukung** (`/forms/:kdJudul`), atau pilih dari menu **Form Pendukung** (`/forms`).
2. Isi metadata form:
   - **Tujuan (`tujuan`)** & **Keterangan (`keterangan`)**
   - **Mode Tampilan (`formLayoutMode`)**:
     - `STANDARD` — seluruh field tampil dalam satu halaman.
     - `WIZARD` — formulir dibagi per langkah (`steps` + `wizardStep` pada tiap field).
     - `CARDS` — tampilan berbasis kartu per bagian.
   - **Kontrol Pengisian**:
     - `maxResponses`: batas maksimal jumlah respon yang diterima.
     - `closeAt`: tanggal/waktu penutupan otomatis formulir.
     - `allowSelfEdit`: mengizinkan pengisi mengubah respon miliknya sendiri.
     - `isLocked`: mengunci formulir agar tidak menerima respon baru.

### B. Tipe Field yang Didukung (16 Tipe)
`text`, `number`, `currency`, `date`, `datetime-local`, `textarea`, `select`, `checkbox`, `radio`, `file`, `color`, `range`, `signature`, `rating`, `section` (pembagi bagian), dan `repeater` (tabel baris dinamis dengan `repeaterColumns`).

Fitur tambahan per field:
- **Lebar Layout (`layoutWidth`)**: `full`, `half`, atau `third`.
- **Logika Kondisional (`conditional`)**: menampilkan (`show`) atau menyembunyikan (`hide`) field berdasarkan nilai field lain (`equals`, `not_equals`, `greater_than`, `contains`, `is_filled`).
- **Formula Kalkulasi (`calculationFormula`)**: perhitungan otomatis antar field numerik.

### C. Pengisian, Verifikasi & Ekspor Respon
- **Pengisian Form**:
  - Melalui tab **Isi** di dashboard (`/forms/:kdJudul/:formId/responses`) atau link mandiri `/q/:shareSlug`.
  - Mendukung unggah file (`POST /api/notes/:kdJudul/forms/:formId/upload` atau `POST /api/public/forms/:shareSlug/upload`).
- **Status Respon & Moderasi**:
  - Status respon terdiri dari `DRAFT`, `SUBMITTED`, `VERIFIED`, dan `REJECTED` (dapat disertai catatan verifikator `verifierNotes`).
- **Ekspor Data**:
  - `GET /api/notes/:kdJudul/forms/:formId/export?format=json` atau `?format=csv` (mendukung filter `search`, `status`, `from`, `to`).

---

## 3. Share Data & Visibilitas (`PUBLIC` / `KHUSUS` / `PRIVATE`)

MFC Noted memisahkan kontrol berbagi pada level **Catatan** dan level **Formulir**.

### A. Mode Berbagi Catatan (`PUT /api/sharing/notes/:kdJudul`)
| Mode | Perilaku Akses |
| :--- | :--- |
| **`PRIVATE`** | Hanya pemilik catatan dan anggota (`members`) yang terdaftar yang dapat melihat catatan. |
| **`KHUSUS`** | Hanya pengguna/rekan yang diberi izin secara spesifik melalui daftar anggota/akses. |
| **`PUBLIC`** | Muncul di **Katalog Publik** (`/public`) dan dapat dibaca melalui endpoint publik (`GET /api/sharing/public-catalog`, `GET /api/sharing/public-sub`, `GET /api/sharing/note-detail/:kdJudul`). |

Selain mode, pemilik catatan dapat memilih elemen apa saja yang ikut dibagikan melalui `shareElements`:
- `xcatatan` — konten deskripsi & struktur catatan.
- `xfile` — lampiran file/dokumen catatan.
- `xform` — formulir fleksibel yang terhubung pada catatan tersebut.

### B. Mode Berbagi & Link Publik Formulir (`PUT /api/notes/:kdJudul/forms/:formId/access`)
Setiap formulir memiliki `shareSlug` unik untuk akses kuesioner mandiri (`/q/:shareSlug`) dan konsumsi API publik (`/api/public/forms/:shareSlug`):
- **`PUBLIC`**: Siapa saja yang memiliki `shareSlug` dapat membuka skema (`GET /api/public/forms/:shareSlug`), membaca data (`GET /api/public/forms/:shareSlug/data` sesuai kebijakan form), mengunggah file, dan mengirim respon (`POST /api/public/forms/:shareSlug/values`) tanpa wajib login.
- **`KHUSUS`**: Akses dibatasi berdasarkan aturan per rekan (`FormAccessRuleDto`):
  - `canSubmit`: boleh mengisi & mengirim respon.
  - `canViewAllResponses`: boleh melihat seluruh rekap respon.
  - `canEditSchema`: boleh mengubah struktur/field formulir.
- **`PRIVATE`**: Hanya pemilik form (atau klien dengan **API Key** yang valid untuk form tersebut).

---

## 4. API Key Integrasi Eksternal (`FormApiKey`)

API Key digunakan agar aplikasi eksternal, skrip otomasi, atau layanan MicroFE lain dapat membaca, mengekspor, atau mengirim data ke formulir tertentu secara terprogram tanpa login interaktif.

### A. Cara Membuat & Mencabut API Key
1. Masuk ke halaman pengelolaan form (`/forms/:kdJudul` atau tab pengaturan form).
2. Buka bagian **API Key** (`GET /api/notes/:kdJudul/forms/:formId/api-keys`).
3. Buat API Key baru (`POST /api/notes/:kdJudul/forms/:formId/api-keys`) dengan parameter:
   - `label`: nama aplikasi/integrasi (wajib).
   - `scopes`: kombinasi izin dipisah koma:
     - `responses:read` — membaca skema & data respon.
     - `responses:export` — mengekspor data (JSON/CSV).
     - `responses:submit` — mengirim respon baru (`POST`).
     *(Default jika kosong: `responses:read,responses:export`)*
   - `expiresInDays` *(opsional)*: masa berlaku key dalam hari (`null` = tidak kedaluwarsa).
   - `targetUserId` *(opsional)*: delegasi identitas pengguna/rekan target.
4. **Simpan key segera!** Key memiliki format prefix `mfc_live_...` dan **hanya ditampilkan satu kali** saat dibuat (server hanya menyimpan hash `SHA-256`).
5. Untuk menonaktifkan key, hapus melalui `DELETE /api/notes/:kdJudul/forms/:formId/api-keys/:keyId`.

### B. Cara Menggunakan API Key pada Request HTTP
Kirimkan API Key menggunakan salah satu header berikut:
- `x-api-key: mfc_live_xxxxxxxxxxxxxxxxxxxxxxxx`
- `Authorization: ApiKey mfc_live_xxxxxxxxxxxxxxxxxxxxxxxx`

**Contoh Membaca Data Form Publik / Terproteksi:**
```bash
curl -X GET "http://localhost:3002/api/public/forms/<shareSlug>/data?page=1&limit=20" \
  -H "x-api-key: mfc_live_xxxxxxxxxxxxxxxxxxxxxxxx"
```

**Contoh Mengirim Respon Form via API Key (`responses:submit`):**
```bash
curl -X POST "http://localhost:3002/api/public/forms/<shareSlug>/values" \
  -H "Content-Type: application/json" \
  -H "x-api-key: mfc_live_xxxxxxxxxxxxxxxxxxxxxxxx" \
  -d '{
    "responderName": "Integrasi Sistem",
    "responderEmail": "system@domain.id",
    "answers": {
      "nama_lengkap": "Contoh Data",
      "catatan": "Dikirim via API Key"
    }
  }'
```

> **Catatan Keamanan:**
> - Satu API Key terikat ke **satu `formId` spesifik**. Memakai key untuk form lain akan menghasilkan `403 Forbidden`.
> - Key tanpa scope `responses:submit` bersifat *Read-Only* dan akan ditolak untuk request selain `GET`.

---

## 5. Sistem Pertemanan / Kelola Rekan (`Friends`)

Fitur **Kelola Rekan** (`/friends`) menghubungkan antar-akun pengguna agar dapat berkolaborasi pada catatan maupun formulir mode `KHUSUS`.

### Alur Kerja Pertemanan
1. **Cari / Undang Rekan**:
   - Pencarian akun: `GET /api/friends/lookup`
   - Kirim undangan via email: `POST /api/friends/invite` (`{ friendEmail, friendName? }`)
2. **Respon Undangan**:
   - Penerima membuka `/friends` dan menerima/menolak via `PUT /api/friends/:friendshipId` dengan status `ACCEPTED` atau `DECLINED`.
3. **Daftar & Hapus Koneksi**:
   - Lihat daftar rekan & undangan tertunda: `GET /api/friends`
   - Hapus koneksi pertemanan: `DELETE /api/friends/:friendshipId`

Rekan dengan status **`ACCEPTED`** akan langsung muncul sebagai pilihan saat:
- Menambahkan anggota kolaborator pada Catatan (`/notes/:kdJudul/members`).
- Memberikan hak akses khusus (`KHUSUS`) pada Formulir (`FormAccessRuleDto`).
- Menentukan `targetUserId` saat membuat API Key delegasi.

---

## 6. Mekanisme Autentikasi & Kontrol Akses (`JwtAuthGuard`)

Seluruh endpoint privat di `api-noted` dilindungi oleh `JwtAuthGuard`:
1. **JWT Session (`Authorization: Bearer <token>`)**: digunakan oleh pengguna yang login melalui Portal / SSO.
2. **API Key (`x-api-key` / `Authorization: ApiKey <key>`)**: digunakan untuk integrasi server-to-server pada lingkup `formId` & `scopes` tertentu (identitas di-resolve sebagai role `API_CLIENT`).
3. **Endpoint Publik Bebas Login**:
   - `GET /api/notes/health` (cek kesehatan layanan).
   - `GET /api/sharing/public-catalog`, `GET /api/sharing/public-sub`, `GET /api/sharing/note-detail/:kdJudul`.
   - `GET/POST /api/public/forms/:shareSlug*` (mengikuti aturan visibilitas `PUBLIC` / `KHUSUS` / `PRIVATE` + optional Bearer/API Key).
4. **Manajemen Anggota Catatan**:
   - `GET /api/notes/:kdJudul/members` — melihat anggota catatan.
   - `POST /api/notes/:kdJudul/members` — menambah anggota.
   - `PUT /api/notes/:kdJudul/members/:accessId` — memperbarui peran/hak akses anggota.
   - `DELETE /api/notes/:kdJudul/members/:accessId` — mencabut akses anggota.
