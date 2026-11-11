export type UserStatus = 'active' | 'inactive' | 'suspended';

export type UserGender = 'Laki-laki' | 'Perempuan' | 'Lainnya';

export interface UserProfile {
  id?: string;
  phone?: string;
  address?: string;
  gender?: UserGender | string;
  birthDate?: string;
  jobTitle?: string;
  department?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  roleId: string;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
  deletedAt?: string;
  profile?: UserProfile;
  // Catatan Keamanan: Password ASLI tidak pernah disimpan dalam objek User publik
  // ataupun dikirimkan ke tabel.
}

export interface UserCredentials {
  userId: string;
  passwordHash: string; // Representasi hash / terenkripsi
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean; // Jika true, role bawaan sistem (tidak boleh dihapus)
  createdAt: string;
}

export type PermissionModule =
  | 'users'
  | 'roles'
  | 'projects'
  | 'billing'
  | 'audit_logs'
  | 'settings'
  | (string & {});

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export type PermissionMatrix = Record<string, Record<PermissionAction, boolean>>;

export interface RolePermissionConfig {
  roleId: string;
  permissions: PermissionMatrix;
  updatedAt: string;
}

export interface ModuleDefinition {
  key: PermissionModule;
  label: string;
  description: string;
  iconName: string;
}

export const SYSTEM_MODULES: ModuleDefinition[] = [
  {
    key: 'users',
    label: 'Manajemen Pengguna',
    description: 'Kelola akun user, status, dan reset kredensial.',
    iconName: 'Users',
  },
  {
    key: 'roles',
    label: 'Manajemen Role',
    description: 'Konfigurasi kelompok hak akses dan role sistem.',
    iconName: 'Shield',
  },
  {
    key: 'projects',
    label: 'Proyek & Delivery',
    description: 'Akses ke workspace client, sprint, dan repositori proyek.',
    iconName: 'Briefcase',
  },
  {
    key: 'billing',
    label: 'Keuangan & Billing',
    description: 'Invoicing, kontrak software, dan riwayat pembayaran.',
    iconName: 'CreditCard',
  },
  {
    key: 'audit_logs',
    label: 'Audit Log & Keamanan',
    description: 'Jejak audit aktivitas user, login history, dan event sistem.',
    iconName: 'FileText',
  },
  {
    key: 'settings',
    label: 'Pengaturan Sistem',
    description: 'Konfigurasi environment, API keys, dan integrasi global.',
    iconName: 'Settings',
  },
];

export const ACTIONS: { key: PermissionAction; label: string; description: string }[] = [
  { key: 'view', label: 'View (Lihat)', description: 'Izin membaca dan melihat data' },
  { key: 'create', label: 'Create (Tambah)', description: 'Izin membuat entri baru' },
  { key: 'edit', label: 'Edit (Ubah)', description: 'Izin memperbarui data' },
  { key: 'delete', label: 'Delete (Hapus)', description: 'Izin menghapus data secara permanen' },
];

/* =========================================================================
 * API Log Models & Standard Messages
 * ========================================================================= */
export type ApiLogStatus = 'SUCCESS' | 'BAD_REQUEST' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'INTERNAL_ERROR';

export interface ApiLogEntry {
  id: string; // ID
  requestDate: string; // REQUEST_DATE
  userId?: string; // ID Pengguna (Relasi ke User)
  username: string; // USERNAME (e.g. '@superadmin', 'guest')
  userFullName?: string; // Nama Lengkap Pengguna (e.g. 'Principal Administrator')
  roleName?: string; // Nama Role Pengguna (e.g. 'Super Administrator')
  baseUrl: string; // BASE_URL
  endpoint: string; // ENDPOINT
  certificateNumber: string; // CERTIFICATE_NUMBER
  status: ApiLogStatus; // STATUS
  statusCode: number; // STATUS_CODE
  message: string; // MESSAGE
  ipAddress?: string;
  method?: string;
  responseDurationMs?: number;
}

export interface ApiLogStandardCondition {
  key: string;
  condition: string;
  defaultMessage: string;
  statusCode: number;
  status: ApiLogStatus;
  createMessage: (paramName?: string) => string;
}

export const API_LOG_STANDARDS: Record<string, ApiLogStandardCondition> = {
  MISSING_API_KEY: {
    key: 'MISSING_API_KEY',
    condition: 'api key tidak ada',
    defaultMessage: 'API Key is required',
    statusCode: 401,
    status: 'UNAUTHORIZED',
    createMessage: () => 'API Key is required',
  },
  INVALID_API_KEY: {
    key: 'INVALID_API_KEY',
    condition: 'api key tidak sesuai',
    defaultMessage: 'Invalid API Key',
    statusCode: 401,
    status: 'UNAUTHORIZED',
    createMessage: () => 'Invalid API Key',
  },
  MISSING_PARAMETER: {
    key: 'MISSING_PARAMETER',
    condition: 'parameter tidak ada',
    defaultMessage: 'Required parameter parameter is missing',
    statusCode: 400,
    status: 'BAD_REQUEST',
    createMessage: (param = 'parameter') => `Required parameter ${param} is missing`,
  },
  WHITESPACE_PARAMETER: {
    key: 'WHITESPACE_PARAMETER',
    condition: 'parameter space',
    defaultMessage: 'The parameter field is required.',
    statusCode: 400,
    status: 'BAD_REQUEST',
    createMessage: (param = 'parameter') => `The ${param} field is required.`,
  },
  NOT_FOUND_PARAMETER: {
    key: 'NOT_FOUND_PARAMETER',
    condition: 'parameter ada tapi salah',
    defaultMessage: 'parameter not found',
    statusCode: 404,
    status: 'NOT_FOUND',
    createMessage: (param = 'parameter') => `${param} not found`,
  },
  FOUND_PARAMETER: {
    key: 'FOUND_PARAMETER',
    condition: 'perameter benar',
    defaultMessage: 'parameter found',
    statusCode: 200,
    status: 'SUCCESS',
    createMessage: (param = 'parameter') => `${param} found`,
  },
};

