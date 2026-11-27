import { authFetch } from '@org/auth';

export const API_NOTED_BASE =
  (import.meta as any).env?.VITE_API_NOTED_URL || 'http://localhost:3002/api';

export const CV_FORMS = {
  profile: {
    kdNote: '1MFC1',
    formId: '7a21fa96-7b60-4e8b-a333-cc895c658455',
    shareSlug: 'cv-profile',
    title: 'Identitas & Ringkasan Profil (CV)',
  },
  experience: {
    kdNote: '1MFC1',
    formId: 'b8122268-ed88-4751-a296-555c163e83fe',
    shareSlug: 'cv-experience',
    title: 'Pengalaman Kerja',
  },
  projects: {
    kdNote: '1MFC1',
    formId: '54c796a4-5df2-43d1-bad8-2f72137c5e55',
    shareSlug: 'cv-projects',
    title: 'Sorotan Proyek',
  },
  education: {
    kdNote: '1MFC1',
    formId: '7634552b-a08c-4e9c-9b70-532172d55d35',
    shareSlug: 'cv-education-certs',
    title: 'Pendidikan & Sertifikasi',
  },
} as const;

export type CvFormKey = keyof typeof CV_FORMS;

export interface CvProfileData {
  nama_lengkap: string;
  headline: string;
  lokasi: string;
  email: string;
  telepon: string;
  ringkasan_profesional: string;
  keahlian_frontend?: string;
  keahlian_backend?: string;
  keahlian_mobile?: string;
  keahlian_database?: string;
  keahlian_lainnya?: string;
  keunggulan_tambahan?: string;
}

export interface CvExperienceItem {
  id?: string;
  urutan: number;
  posisi: string;
  perusahaan: string;
  periode: string;
  pencapaian?: string;
}

export interface CvProjectItem {
  id?: string;
  urutan: number;
  nama_proyek: string;
  kategori?: string;
  ringkasan: string;
}

export interface CvEducationCertItem {
  id?: string;
  tipe: 'EDUCATION' | 'CERTIFICATION';
  judul: string;
  institusi: string;
  tahun?: string;
  keterangan?: string;
}

export async function fetchCvFormRows<T = Record<string, any>>(key: CvFormKey): Promise<T[]> {
  const cfg = CV_FORMS[key];
  const url = `${API_NOTED_BASE}/public/forms/${encodeURIComponent(cfg.shareSlug)}/data?limit=100&sort=oldest`;
  const res = await authFetch(url, { headers: { Accept: 'application/json' } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json?.message || `Gagal memuat data CV (${key})`);
  }
  return Array.isArray(json.rows) ? json.rows : [];
}
