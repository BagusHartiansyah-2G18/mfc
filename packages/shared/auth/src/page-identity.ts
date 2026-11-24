/**
 * MFC Enterprise Foundation Framework - Page Identity & Role Access Boundary
 * Menghubungkan identitas halaman unik (pageId) dengan Role dan Hak Akses Pengguna,
 * membatasi pengguna di luar ruang lingkup aktivitas operasional mereka.
 */

export interface PageIdentity {
  pageId: string;
  name: string;
  module: 'Security' | 'Identity' | 'Organization' | 'Collaboration' | 'Governance' | 'Document' | 'MasterData' | 'Noted';
  allowedRoles: string[]; // Role yang diizinkan mengakses halaman ini
  requiredPermissions?: string[]; // Izin spesifik yang harus dimiliki
  description?: string;
}

/**
 * Registry Identitas Halaman Sistem MFC Enterprise
 */
export const PAGE_REGISTRY: Record<string, PageIdentity> = {
  // Identity Module
  'PAGE_USER_MANAGEMENT': {
    pageId: 'PAGE_USER_MANAGEMENT',
    name: 'Manajemen Pengguna',
    module: 'Identity',
    allowedRoles: ['Administrator', 'Manager'],
    requiredPermissions: ['users:view'],
    description: 'Daftar dan konfigurasi akun pengguna sistem',
  },
  'PAGE_ROLE_PERMISSION': {
    pageId: 'PAGE_ROLE_PERMISSION',
    name: 'Role & Permission',
    module: 'Identity',
    allowedRoles: ['Administrator'],
    requiredPermissions: ['roles:view'],
    description: 'Pengaturan matriks hak akses dan role RBAC',
  },

  // Noted & Forms Module
  'PAGE_NOTED_DASHBOARD': {
    pageId: 'PAGE_NOTED_DASHBOARD',
    name: 'Dashboard Catatan Induk',
    module: 'Noted',
    allowedRoles: ['Administrator', 'Manager', 'Staff', 'Customer'],
    description: 'Tampilan katalog dan hierarki catatan induk',
  },
  'PAGE_NOTED_FORM_BUILDER': {
    pageId: 'PAGE_NOTED_FORM_BUILDER',
    name: 'Form Builder Pendukung',
    module: 'Noted',
    allowedRoles: ['Administrator', 'Manager', 'Staff'],
    requiredPermissions: ['notes:edit'],
    description: 'Perancang form kustom dan formulir kuisioner',
  },
  'PAGE_NOTED_RESPONSES': {
    pageId: 'PAGE_NOTED_RESPONSES',
    name: 'Rekapitulasi Respon Form',
    module: 'Noted',
    allowedRoles: ['Administrator', 'Manager'],
    description: 'Tabel data respon dan analisis survei pendukung',
  },

  // Governance & Audit
  'PAGE_AUDIT_TRAIL': {
    pageId: 'PAGE_AUDIT_TRAIL',
    name: 'Jejak Audit & Log Aktivitas',
    module: 'Governance',
    allowedRoles: ['Administrator'],
    requiredPermissions: ['audit:view'],
    description: 'Audit trail tracking perubahan data sebelum dan sesudah',
  },
};

/**
 * Memverifikasi apakah pengguna dengan role tertentu dapat mengakses identitas halaman ini
 */
export function canAccessPage(
  pageId: string,
  userRole?: string,
  userPermissions?: string[]
): { allowed: boolean; reason?: string } {
  const page = PAGE_REGISTRY[pageId];
  if (!page) {
    // Jika halaman belum teregistrasi secara eksplisit, izinkan jika role bukan customer atau tolak bila anonim
    return { allowed: true };
  }

  // Administrator selalu memiliki hak akses penuh
  if (userRole === 'Administrator' || userRole === 'SuperAdmin') {
    return { allowed: true };
  }

  // Cek apakah role terdaftar di allowedRoles
  if (!userRole || !page.allowedRoles.includes(userRole)) {
    return {
      allowed: false,
      reason: `Role '${userRole || 'Tamu'}' tidak memiliki izin mengakses halaman ${page.name} (${page.pageId}).`,
    };
  }

  // Cek apakah permission spesifik terpenuhi
  if (page.requiredPermissions && page.requiredPermissions.length > 0) {
    const hasAllPerms = page.requiredPermissions.every((perm) =>
      userPermissions?.includes(perm)
    );
    if (!hasAllPerms) {
      return {
        allowed: false,
        reason: `Pengguna tidak memiliki hak izin: ${page.requiredPermissions.join(', ')}`,
      };
    }
  }

  return { allowed: true };
}
