import React from 'react';
import { usePermission } from './use-permission';

export interface CanProps {
  children: React.ReactNode;
  permission?: string;           // e.g. "users:create"
  I?: string;                    // e.g. "create"
  this?: string;                 // e.g. "users"
  role?: string | string[];      // e.g. "Administrator" or ["Administrator", "Manager"]
  fallback?: React.ReactNode;    // Opsional fallback jika tidak memiliki izin (misal placeholder atau null)
}

/**
 * Komponen Deklaratif untuk Hak Akses Granular (Fine-Grained RBAC / ABAC)
 * 
 * Penggunaan:
 * <Can permission="users:create">
 *   <Button>Tambah Pengguna</Button>
 * </Can>
 * 
 * atau:
 * <Can I="create" this="users">
 *   <Button>Tambah Pengguna</Button>
 * </Can>
 */
export function Can({
  children,
  permission,
  I,
  this: moduleName,
  role,
  fallback = null,
}: CanProps) {
  const { hasPermission, can, role: userRole, isSuperAdmin } = usePermission();

  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // 1. Cek Berbasis Role
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!userRole || !roles.includes(userRole)) {
      return <>{fallback}</>;
    }
  }

  // 2. Cek Berbasis Permission ID tunggal
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // 3. Cek Berbasis Action & Module (I & this)
  if (I && moduleName && !can(I, moduleName)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default Can;