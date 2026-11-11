import { useAuth } from './use-auth';
import { hasPermission as storeHasPermission, can as storeCan } from './auth-store';

export function hasUserPermission(
  user: { role?: string; permissions?: string[] } | null,
  permissionId: string
): boolean {
  if (!user) return false;
  if (user.role === 'Administrator' || user.role === 'Super Administrator') return true;
  if (!user.permissions || user.permissions.length === 0) return false;
  if (user.permissions.includes('*:*')) return true;
  return user.permissions.includes(permissionId);
}

export function canUser(
  user: { role?: string; permissions?: string[] } | null,
  action: string,
  module: string
): boolean {
  return hasUserPermission(user, `${module}:${action}`);
}

export function usePermission() {
  const { session, isDevBypass, role } = useAuth();

  const isSuperAdmin = isDevBypass || role === 'Administrator' || role === 'Super Administrator';

  const checkPermission = (permissionId: string): boolean => {
    if (isSuperAdmin) return true;
    return storeHasPermission(permissionId);
  };

  const checkCan = (action: string, module: string): boolean => {
    if (isSuperAdmin) return true;
    return storeCan(action, module);
  };

  return {
    isSuperAdmin,
    hasPermission: checkPermission,
    can: checkCan,
    role,
    permissions: session?.permissions ?? [],
  };
}

export default usePermission;
