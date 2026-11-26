# 🍰 Cake Marketing Platform
## Full Foundation Plan

Version: 1.1

---

# 1. Executive Summary

Cake Marketing Platform adalah sistem katalog dan pemasaran produk kue berbasis website yang ditujukan untuk publik.

Fokus utama tahap awal:

- Menampilkan katalog produk
- Membangun branding usaha
- Mengarahkan pelanggan ke WhatsApp
- Mempermudah pengelolaan produk
- Mengumpulkan data minat pelanggan

Tahap awal tidak berfokus pada transaksi online penuh, melainkan meningkatkan konversi penjualan melalui katalog digital yang profesional.

---

# 2. Business Goals

## Jangka Pendek

- Memiliki katalog online resmi
- Meningkatkan kepercayaan pelanggan
- Memudahkan pelanggan melihat produk
- Meningkatkan order melalui WhatsApp

## Jangka Menengah

- Mengumpulkan data produk terlaris
- Mengumpulkan data pelanggan
- Mengurangi pertanyaan berulang

## Jangka Panjang

- Sistem Order Online
- Payment Gateway
- Loyalty Program
- Membership Customer
- Multi Branch Management

---

# 3. Customer Flow

```text
Customer
    │
    ▼
Landing Page
    │
    ▼
Product Catalog
    │
    ▼
Product Detail
    │
    ▼
Klik WhatsApp
    │
    ▼
Chat Admin
    │
    ▼
Konfirmasi Pemesanan
    │
    ▼
Produksi
    │
    ▼
Pengiriman / Pickup
```

---

# 4. Public Website Modules

## Home

Menampilkan:

- Hero Banner
- Logo Toko
- Produk Unggulan
- Promo Berjalan
- Best Seller
- Review Pelanggan
- WhatsApp CTA
- Area Pengiriman

---

## Product Catalog

Fitur:

- Search Produk
- Filter Kategori
- Sort Harga
- Sort Terlaris
- Filter Ready Stock
- Filter Pre Order

---

## Product Detail

Menampilkan:

### Informasi Dasar

- Nama Produk
- Harga
- Kategori
- Status

### Galeri Produk

- Foto Utama
- Foto Detail
- Foto Kemasan
- Foto Potongan

### Deskripsi

- Bahan
- Rasa
- Ukuran
- Berat

### Informasi Produksi

- Ready Stock
- Pre Order
- Estimasi Pembuatan

### Review

- Rating
- Komentar

### WhatsApp Order

Tombol Pesan Sekarang

---

## Tentang Kami

Informasi:

- Profil Usaha
- Visi
- Misi
- Cerita Bisnis
- Sertifikasi
- Foto Workshop

---

## FAQ

Contoh:

### Apakah bisa custom?

Ya

### Apakah halal?

Ya

### Minimal order berapa hari?

Minimal H-2

### Apakah bisa delivery?

Ya

---

## Kontak

Menampilkan:

- WhatsApp
- Instagram
- TikTok
- Facebook
- Email
- Google Maps

---

# 5. Product Management

## Product

```json
{
  "id": "PRD001",
  "name": "Brownies Premium",
  "slug": "brownies-premium",
  "categoryId": "CAT001",
  "description": "Brownies premium",
  "featured": true,
  "status": "ACTIVE",
  "availability": "READY",
  "preparationTime": "1 Hari"
}
```

---

# 6. Product Variants

Karena bisnis kue hampir selalu memiliki ukuran berbeda.

Contoh:

```json
{
  "productId": "PRD001",
  "variants": [
    {
      "name": "500 Gram",
      "price": 75000
    },
    {
      "name": "1 Kg",
      "price": 130000
    }
  ]
}
```

Contoh lainnya:

```json
{
  "name": "Birthday Cake",
  "variants": [
    {
      "size": "15 cm",
      "price": 150000
    },
    {
      "size": "20 cm",
      "price": 250000
    }
  ]
}
```

---

# 7. Product Categories

```text
Brownies
Birthday Cake
Wedding Cake
Cheesecake
Tart
Donat
Cookies
Cupcake
Dessert Box
Pudding
```

---

# 8. Product Gallery

Setiap produk dapat memiliki banyak gambar.

```json
{
  "productId": "PRD001",
  "images": [
    "/images/1.jpg",
    "/images/2.jpg",
    "/images/3.jpg"
  ]
}
```

Jenis Foto:

- Full Product
- Packaging
- Slice View
- Event Decoration

---

# 9. Custom Cake Module

Banyak pelanggan memesan kue custom.

Field:

```json
{
  "customizable": true
}
```

Pilihan:

- Custom Nama
- Custom Ucapan
- Custom Warna
- Custom Tema
- Upload Referensi Gambar

---

# 10. Delivery Areas

```json
{
  "areas": [
    "Bekasi",
    "Cikarang",
    "Tambun",
    "Karawang"
  ]
}
```

Fitur:

- Delivery Available
- Pickup Available

---

# 11. Customer Reviews

```json
{
  "customerName": "Siti",
  "rating": 5,
  "comment": "Kuenya enak dan cantik."
}
```

Rating:

```text
1 Bintang
2 Bintang
3 Bintang
4 Bintang
5 Bintang
```

---

# 12. Promotions Module

## Banner Promo

Contoh:

```text
Diskon 10%
Gratis Ongkir Bekasi
Promo Akhir Tahun
```

---

## Promo Type

```json
{
  "type": "PERCENTAGE"
}
```

atau

```json
{
  "type": "FREE_SHIPPING"
}
```

---

# 13. WhatsApp Integration

## Auto Message

Template:

```text
Halo Admin,

Saya tertarik dengan produk:

Nama Produk:
Brownies Premium

Variant:
1 Kg

Mohon informasi ketersediaannya.

Terima kasih.
```

---

## WhatsApp URL

```text
https://wa.me/628xxxxxxxxxx
```

---

## Tracking Parameter

```text
source=website
product=brownies-premium
```

Tujuan:

- Mengetahui produk yang paling banyak diklik
- Mengetahui sumber order

---

# 14. SEO Module

Setiap produk memiliki:

```json
{
  "metaTitle": "",
  "metaDescription": "",
  "keywords": []
}
```

Contoh:

```json
{
  "keywords": [
    "kue ulang tahun bekasi",
    "birthday cake bekasi",
    "cake custom bekasi"
  ]
}
```

---

# 15. Social Media Module

```json
{
  "instagram": "",
  "facebook": "",
  "tiktok": "",
  "youtube": ""
}
```

---

# 16. Store Settings

## Basic Information

```json
{
  "storeName": "",
  "phone": "",
  "email": "",
  "address": ""
}
```

---

## Operational Hours

```json
{
  "open": "08:00",
  "close": "21:00"
}
```

Tampilkan:

```text
Sedang Buka
Sedang Tutup
```

---

# 17. Analytics Module

## Product Analytics

Mencatat:

```text
Total View
Total Click WhatsApp
Total Favorite
```

---

## Dashboard Example

```text
Brownies Premium

View : 1.245
WA Click : 124
Conversion : 9.95%
```

---

# 18. Admin Panel

## Dashboard

Menampilkan:

- Total Produk
- Total Kategori
- Total Review
- Total Promo
- Total Klik WA
- Produk Terlaris

---

## Master Product

Fitur:

- Create
- Update
- Delete
- Upload Multiple Images

---

## Master Category

Fitur:

- Create
- Update
- Delete

---

## Master Variant

Fitur:

- Create
- Update
- Delete

---

## Review Management

Fitur:

- Approve
- Reject

---

## Promo Management

Fitur:

- Tambah Promo
- Jadwalkan Promo
- Nonaktifkan Promo

---

## FAQ Management

Fitur:

- Create
- Update
- Delete

---

## SEO Management

Fitur:

- Meta Tag
- Meta Description
- Sitemap

---

## Store Configuration

Fitur:

- WhatsApp
- Alamat
- Jam Operasional
- Media Sosial

---

# 19. Database Foundation

```text
MASTER

├── Products
├── Categories
├── Variants
├── ProductImages
├── Promotions
├── Reviews
├── FAQs
├── DeliveryAreas
├── SocialMedias
├── StoreSettings

TRANSACTION

├── ProductViews
├── ProductClicks
├── WhatsAppClicks

SYSTEM

├── Users
├── Roles
├── Permissions
```

---

# 20. Technology Stack

## Frontend

```text
Next.js 16
React
Tailwind CSS
Shadcn UI
```

---

## Backend

```text
Next.js API
```

---

## Database

Tahap Awal:

```text
PostgreSQL
```

Rekomendasi:

```text
Supabase PostgreSQL
```

---

## ORM

```text
Prisma ORM
```

---

## File Storage

```text
Supabase Storage
```

atau

```text
Cloudinary
```

---

# 21. Security

Minimal:

```text
Authentication
Authorization
RBAC
Input Validation
Rate Limiting
Audit Log
```

---

# 22. Future Roadmap

## Version 1

✅ Public Catalog

✅ Product Detail

✅ WhatsApp Order

✅ SEO

✅ Admin Product

✅ Analytics

---

## Version 2

✅ Shopping Cart

✅ Checkout

✅ Order Management

✅ Midtrans

✅ Xendit

✅ Invoice

---

## Version 3

✅ Membership

✅ Loyalty Point

✅ Voucher

✅ Referral

✅ Email Marketing

✅ WhatsApp Marketing

---

## Version 4

✅ Multi Branch

✅ Franchise Management

✅ Inventory

✅ Production Planning

✅ Delivery Tracking

✅ ERP Integration

---

# 23. Success Metrics

Target 6 Bulan Pertama

```text
100+ Produk
5.000+ Pengunjung
500+ WhatsApp Click
100+ Order
4.5+ Rating Review
```

---

# 24. Enterprise & Operational Upgrade Standards

Penambahan standar operasional, keamanan, dan integrasi untuk kesiapan produksi:

## 24.1 Slot Kapasitas Produksi & Cut-Off Pre-Order

- **Daily Production Quota**: Batas maksimal pesanan custom/PO per hari (misal 10–15 slot/hari); tanggal penuh otomatis dinonaktifkan di *date picker*.
- **Cut-Off Time**: Pesanan yang masuk melewati jam batas operasional (misal `> 15:00`) otomatis dihitung sebagai hari produksi berikutnya (`H+1`).
- **Lead Time Validation**: Validasi otomatis minimal H-2 untuk kue custom sebelum pelanggan diarahkan ke WhatsApp.

## 24.2 Kalkulator Add-On Harga & Ongkir per Zona

- **Pricing Add-On (Custom Cake)**: Tambahan biaya terstruktur untuk opsi custom (tambah tier/lapisan, topper fondant, lilin angka, kartu ucapan, *rush order fee*).
- **Zone Delivery Fee**: Tarif estimasi ongkos kirim berdasarkan `DeliveryAreas` sebelum pesan WhatsApp dibuat.
- **Auto-Message Summary**: Template WhatsApp menyertakan rincian varian, add-on custom, zona kirim, dan **estimasi total harga** yang transparan.

## 24.3 Lead & Conversion Tracking (CRM Mini)

Menjembatani gap antara *klik WhatsApp* dan *order terjadi*:

```json
{
  "leadId": "LD-20261126-001",
  "productId": "PRD001",
  "variant": "1 Kg",
  "estimatedTotal": 150000,
  "utmSource": "instagram",
  "status": "NEW_CLICK"
}
```

- **Status Pipeline**: `NEW_CLICK` → `FOLLOW_UP` → `DEAL` → `CANCELLED`.
- Mengukur **Real Conversion Rate** di Admin Dashboard, bukan hanya jumlah klik tombol WA.

## 24.4 Optimasi Media & Rich Preview (OpenGraph + Schema.org)

- **Image Pipeline**: Auto-konversi upload gambar ke format `WebP`, pembuatan *thumbnail* responsif, dan *lazy loading* pada halaman katalog.
- **OpenGraph & WA Preview**: Metadata `og:title`, `og:description`, dan `og:image` dinamis per produk agar link yang dibagikan ke WhatsApp/Instagram langsung menampilkan foto dan harga.
- **Structured Data (JSON-LD)**: Schema `Product`, `AggregateRating`, dan `LocalBusiness` untuk *Google Rich Snippets*.

## 24.5 Keamanan Publik, Anti-Spam & Kepatuhan UU PDP

- **Public Upload Guard**: Upload referensi gambar custom cake wajib melewati whitelist ekstensi (`.jpg`, `.png`, `.webp`), pengecekan *MIME & Magic Bytes*, serta batas ukuran maks. 5–10 MB.
- **Anti-Spam & Rate Limiting**: Pembatasan frekuensi request pada endpoint `Review`, `ProductView`, dan `WhatsAppClick` untuk mencegah manipulasi rating atau *bot traffic*.
- **Legal & UU PDP Compliance**: Halaman wajib **Syarat & Ketentuan Order** (aturan DP, batas revisi desain, kebijakan pembatalan) dan **Kebijakan Privasi** untuk perlindungan data nomor WA/alamat pelanggan.

## 24.6 Penyelarasan Ekosistem MFC

- **API Standard**: Mengadopsi format response envelope baku (`{ success, statusCode, message, data, meta }`), kamus error terstandar, dan *Request-ID tracing*.
- **Caching**: Dual-layer cache (Redis / CDN untuk katalog publik & SWR di sisi client) agar katalog terbuka instan di perangkat mobile.
- **Integration Ready**: Menyediakan kontrak API (OpenAPI/Swagger) serta scoped `X-API-Key` bila diintegrasikan dengan modul ERP/Noted MFC (Version 4).

## 24.7 Go-Live Operational & Quality Gate

- **Backup & Recovery**: Backup harian database dan media storage dengan retensi minimal 30 hari.
- **Observability**: Uptime monitoring, error logging terstruktur (tanpa mencatat PII sensitif), dan pelacakan performa API.
- **Performance Gate**: Skor Lighthouse Mobile SEO & Performance minimal **85+** sebelum rilis publik.

---

# Kesimpulan

Platform ini dirancang sebagai fondasi bisnis kue modern yang dimulai dari katalog digital sederhana namun sudah memiliki struktur enterprise-ready untuk berkembang menjadi sistem penjualan, CRM pelanggan, loyalty program, hingga manajemen produksi dan distribusi tanpa perlu melakukan redesign besar di masa depan.