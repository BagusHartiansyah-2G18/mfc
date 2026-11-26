import { authFetch } from '@org/auth';

export const API_NOTED_BASE =
  (import.meta as any).env?.VITE_API_NOTED_URL || 'http://localhost:3002/api';

export const PORTAL_BASE_URL =
  (import.meta as any).env?.VITE_PORTAL_URL || 'http://localhost:4200';

// Opsional: jika host ingin menyertakan X-API-Key izin aplikasi dari env (tidak hardcode di source)
const ENV_CAKE_API_KEY = (import.meta as any).env?.VITE_CAKE_API_KEY || '';

export const CAKE_FORMS = {
  store: {
    kdNote: '3MFC8#2.1',
    formId: '00e00d5b-04d9-4e69-8048-5d18f94e65c9',
    shareSlug: 'cake-store',
    title: 'Identitas Usaha & Informasi Pendukung',
  },
  categories: {
    kdNote: '3MFC8#2.1',
    formId: '8b1c1a45-2594-4619-8bdf-b66d2e37ae71',
    shareSlug: 'cake-categories',
    title: 'Master Kategori Produk Kue',
  },
  areas: {
    kdNote: '3MFC8#2.1',
    formId: '37f07a76-c315-4fba-b71a-2880fd5993ad',
    shareSlug: 'cake-areas',
    title: 'Master Area Pengiriman & Ongkir',
  },
  products: {
    kdNote: '3MFC8#2.2',
    formId: '94bb4549-dba0-4642-8a87-97bc50421c56',
    shareSlug: 'cake-products',
    title: 'Master Produk Kue & Varian',
  },
  gallery: {
    kdNote: '3MFC8#2.2',
    formId: 'd9a81b95-a1dc-492d-87dc-3cb2714b3339',
    shareSlug: 'cake-gallery',
    title: 'Galeri Foto Produk Kue',
  },
  customCake: {
    kdNote: '3MFC8#2.3',
    formId: 'c78fc7a2-a195-42b7-96c5-9b6435e8d724',
    shareSlug: 'cake-custom',
    title: 'Order Custom Cake Masuk',
  },
  rules: {
    kdNote: '3MFC8#2.3',
    formId: 'd5bc14e1-36cb-4608-a046-1ad3118e928d',
    shareSlug: 'cake-rules',
    title: 'Aturan PO, Kuota & Harga Add-On',
  },
  promos: {
    kdNote: '3MFC8#2.4',
    formId: '93a6a92d-a917-4896-be3c-a625fdbd950e',
    shareSlug: 'cake-promos',
    title: 'Manajemen Promo & Banner',
  },
  reviews: {
    kdNote: '3MFC8#2.5',
    formId: '2b2bcdcb-2e97-4beb-b36a-414f535f445d',
    shareSlug: 'cake-reviews',
    title: 'Moderasi Review Pelanggan',
  },
  faqs: {
    kdNote: '3MFC8#2.5',
    formId: '1d2d60fd-6517-4307-88b5-0734cca5a2b9',
    shareSlug: 'cake-faqs',
    title: 'Master FAQ & Kebijakan Order',
  },
  leads: {
    kdNote: '3MFC8#2.6',
    formId: 'b950dac6-1442-4a24-bcc9-98689efe9362',
    shareSlug: null,
    title: 'Pipeline Lead & Konversi WhatsApp',
  },
} as const;

export type CakeFormKey = keyof typeof CAKE_FORMS;

export interface PaginatedFormResponse<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchPublicFormPage<T = Record<string, any>>(
  key: Exclude<CakeFormKey, 'leads'>,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    filters?: Record<string, string>;
  } = {}
): Promise<PaginatedFormResponse<T>> {
  const cfg = CAKE_FORMS[key];
  if (!cfg.shareSlug) {
    return { rows: [], total: 0, page: 1, limit: 25, totalPages: 1 };
  }

  const params = new URLSearchParams({
    page: String(options.page || 1),
    limit: String(options.limit || 50),
    sort: options.sort || 'newest',
  });
  if (options.search?.trim()) params.set('search', options.search.trim());
  if (options.filters) {
    for (const [fk, fv] of Object.entries(options.filters)) {
      if (fv && fv.trim()) params.set(`filter_${fk}`, fv.trim());
    }
  }

  const url = `${API_NOTED_BASE}/public/forms/${encodeURIComponent(cfg.shareSlug)}/data?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json?.message || `Gagal memuat data ${key}`);
  }
  return {
    rows: Array.isArray(json.rows) ? json.rows : [],
    total: Number(json.total ?? 0),
    page: Number(json.page ?? 1),
    limit: Number(json.limit ?? 25),
    totalPages: Number(json.totalPages ?? 1),
  };
}

export async function fetchCakeFormRows<T = Record<string, any>>(
  key: Exclude<CakeFormKey, 'leads'>
): Promise<T[]> {
  const res = await fetchPublicFormPage<T>(key, { page: 1, limit: 100 });
  return res.rows;
}

// Authenticated fetch (menggunakan session user JWT dari @org/auth + optional X-API-Key izin aplikasi)
export async function fetchAuthenticatedFormRows<T = Record<string, any>>(
  key: CakeFormKey
): Promise<T[]> {
  const cfg = CAKE_FORMS[key];
  const url = `${API_NOTED_BASE}/notes/${encodeURIComponent(cfg.kdNote)}/forms/${encodeURIComponent(cfg.formId)}/data?limit=100`;
  const headers: Record<string, string> = {};
  if (ENV_CAKE_API_KEY) headers['X-API-Key'] = ENV_CAKE_API_KEY;

  const res = await authFetch(url, { headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json?.message || `Gagal memuat data terautentikasi ${key}`);
  }
  return Array.isArray(json.rows) ? json.rows : [];
}

export async function submitPublicCakeForm(
  key: Exclude<CakeFormKey, 'leads'>,
  answers: Record<string, any>,
  responderName = 'Pelanggan Website',
  responderEmail?: string
) {
  const cfg = CAKE_FORMS[key];
  if (!cfg.shareSlug) {
    throw new Error(`Formulir ${key} tidak bersifat publik.`);
  }
  const url = `${API_NOTED_BASE}/public/forms/${encodeURIComponent(cfg.shareSlug)}/values`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      answers,
      responderName,
      responderEmail: responderEmail || undefined,
      originHost: window.location.host || 'portal:4200',
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json?.message || `Gagal mengirim data ${key}`);
  }
  return json.data;
}

export async function submitAuthenticatedCakeForm(
  key: CakeFormKey,
  answers: Record<string, any>,
  responderName = 'Pengguna Portal',
  responderEmail?: string
) {
  const cfg = CAKE_FORMS[key];
  const url = `${API_NOTED_BASE}/notes/${encodeURIComponent(cfg.kdNote)}/forms/${encodeURIComponent(cfg.formId)}/values`;
  const headers: Record<string, string> = {};
  if (ENV_CAKE_API_KEY) headers['X-API-Key'] = ENV_CAKE_API_KEY;

  const res = await authFetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      answers,
      responderName,
      responderEmail: responderEmail || undefined,
      originHost: window.location.host || 'portal:4200',
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json?.message || `Gagal mengirim data ${key}`);
  }
  return json.data;
}

export function getNotedFormUrl(key: CakeFormKey, tab: 'rekap' | 'isi' = 'rekap') {
  const cfg = CAKE_FORMS[key];
  return `/noted/forms/${encodeURIComponent(cfg.kdNote)}/${encodeURIComponent(cfg.formId)}/responses?tab=${tab}`;
}
