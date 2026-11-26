export interface CakeStoreSettings {
  store_name: string;
  motto?: string;
  tagline?: string;
  whatsapp: string;
  phone?: string;
  email?: string;
  open_time: string;
  close_time: string;
  halal_cert_no?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  google_maps_url?: string;
  address: string;
  about_story?: string;
  vision?: string;
  mission?: string;
}

export interface CakeAddonRule {
  addon_name: string;
  addon_price: number;
}

export interface CakePoRule {
  rule_code: string;
  min_po_days: number;
  daily_po_quota: number;
  cutoff_time: string;
  dp_percent: number;
  addons: CakeAddonRule[];
  notes?: string;
}

export interface CakeCategory {
  kode_kategori: string;
  nama_kategori: string;
  slug: string;
  status: string;
}

export interface CakeDeliveryArea {
  kode_area: string;
  nama_area: string;
  ongkir: number;
  delivery_available: string;
  pickup_available: string;
}

export interface CakeVariant {
  nama_varian: string;
  harga: number;
}

export interface CakeProduct {
  id?: string;
  kode_produk: string;
  nama_produk: string;
  slug: string;
  kategori: CakeCategory | string;
  availability: 'READY' | 'PRE_ORDER' | string;
  preparation_time: string;
  featured: string;
  varian: CakeVariant[];
  deskripsi: string;
}

export interface CakeGalleryItem {
  produk: { kode_produk: string; nama_produk: string } | string;
  jenis_foto: string;
  image_url?: string;
  image_file?: { fileUrl?: string; url?: string; fileName?: string } | null;
}

export interface CakePromo {
  kode_promo: string;
  judul_promo: string;
  promo_type: 'PERCENTAGE' | 'FREE_SHIPPING' | string;
  produk_terkait?: { kode_produk: string; nama_produk: string } | string;
  nilai_diskon?: number;
}

export interface CakeReview {
  produk: { kode_produk: string; nama_produk: string } | string;
  customer_name: string;
  rating: number;
  status_moderasi: string;
  komentar: string;
}

export interface CakeFaq {
  pertanyaan: string;
  kategori_faq: string;
  jawaban: string;
}

export interface CakeLead {
  id?: string;
  lead_id: string;
  produk: { kode_produk: string; nama_produk: string } | string;
  area_kirim: { kode_area: string; nama_area: string; ongkir?: number } | string;
  varian_dipilih: string;
  estimasi_total: number;
  utm_source: string;
  status_lead: 'NEW_CLICK' | 'FOLLOW_UP' | 'DEAL' | 'CANCELLED' | string;
  createdAt?: string;
}
