import { useState, useEffect, useMemo } from 'react';
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
import {
  Users,
  Shield,
  Sliders,
  RefreshCw,
  AlertCircle,
  X,
  ShieldCheck,
  UserCheck,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Badge, Button } from '@org/ui';
import { userMgmtStore, type BackendStatus } from './store/user-mgmt-store';
import { UserTab } from './components/UserTab';
import { RoleTab } from './components/RoleTab';
import { PermissionMatrixTab } from './components/PermissionMatrixTab';
import { ApiLogTab } from './components/ApiLogTab';
import type { User, Role } from './types/user-mgmt';

export interface UserMgmtAppProps {
  basePath?: string;
}
import { DashShell, DashFooter, type FeatureMenu } from '@org/ui';

export function App({ basePath = '' }: UserMgmtAppProps) {
  const prefix = basePath ? basePath.replace(/\/$/, '') : '';
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Selected role for permission matrix
  const roleParam = searchParams.get('role');
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<string>(
    roleParam || 'role-superadmin'
  );

  // Sync Store State
  const [users, setUsers] = useState<User[]>(() => userMgmtStore.getUsers());
  const [roles, setRoles] = useState<Role[]>(() => userMgmtStore.getRoles());
  const [backendStatus, setBackendStatus] = useState<BackendStatus>(() =>
    userMgmtStore.getBackendStatus()
  );
  const [dismissError, setDismissError] = useState(false);

  useEffect(() => {
    const unsubscribe = userMgmtStore.subscribe(() => {
      setUsers(userMgmtStore.getUsers());
      setRoles(userMgmtStore.getRoles());
      setBackendStatus(userMgmtStore.getBackendStatus());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Backward compatibility: If ?tab=roles, ?tab=permissions, or ?tab=api-logs is present in query params,
  // route to the appropriate child path
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'roles' && !location.pathname.endsWith('/roles')) {
      navigate(`${prefix}/roles`, { replace: true });
    } else if (tab === 'permissions' && !location.pathname.endsWith('/permissions')) {
      navigate(`${prefix}/permissions`, { replace: true });
    } else if (tab === 'api-logs' && !location.pathname.endsWith('/api-logs')) {
      navigate(`${prefix}/api-logs`, { replace: true });
    } else if (tab === 'users' && location.pathname !== (prefix || '/')) {
      navigate(prefix || '/', { replace: true });
    }
  }, [searchParams, location.pathname, prefix, navigate]);

  const handleSelectRoleForMatrix = (roleId: string) => {
    setSelectedRoleForMatrix(roleId);
    navigate(`${prefix}/permissions?role=${encodeURIComponent(roleId)}`);
  };

  const handleSyncWithBackend = async () => {
    setDismissError(false);
    await userMgmtStore.syncWithBackend();
  };

  // Quick stats calculation
  const stats = useMemo(() => {
    const activeUsers = users.filter((u) => u.status === 'active').length;
    const systemRoles = roles.filter((r) => r.isSystem).length;
    return {
      activeUsers,
      totalUsers: users.length,
      systemRoles,
      totalRoles: roles.length,
    };
  }, [users, roles]);

  const standaloneMenu: FeatureMenu = useMemo(
    () => ({
      brand: 'BGS Identity & Access',
      menus: [
        {
          section: 'Identity & Access',
          items: [
            {
              id: 'users',
              label: `Pengguna (${users.length})`,
              path: prefix || '/',
              icon: 'users',
              role: 'button',
            },
            {
              id: 'roles',
              label: `Role (${roles.length})`,
              path: `${prefix}/roles`,
              icon: 'shield',
              role: 'button',
            },
            {
              id: 'permissions',
              label: 'Matriks Permission',
              path: `${prefix}/permissions`,
              icon: 'settings',
              role: 'button',
            },
          ],
        },
        {
          section: 'Administration',
          items: [
            {
              id: 'api-logs',
              label: 'Log API',
              path: `${prefix}/api-logs`,
              icon: 'code',
              role: 'button',
            },
            {
              id: 'audit',
              label: 'Audit Trail',
              path: `${prefix}/permissions`,
              icon: 'file',
              role: 'button',
            },
            {
              id: 'security',
              label: 'Security Policies',
              path: `${prefix}/roles`,
              icon: 'shield',
              role: 'button',
            },
          ],
        },
      ],
    }),
    [prefix, users.length, roles.length]
  );

  return (
    <DashShell menu={standaloneMenu} footer={<DashFooter brand="BGS Identity & Access Management (Standalone Host)" />}>
      <div data-testid="userMgmt" className="space-y-6 max-w-7xl mx-auto">
        {/* ========================================================================= */}
        {/* 1. TOP HERO HEADER & METRIC SUMMARY                                      */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-r from-card via-card/95 to-primary/5 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  User & Access Management
                </h1>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold py-0.5 px-2 bg-primary/10 text-primary border-primary/20"
                >
                  RBAC v2.0
                </Badge>

                {/* Backend Connectivity Status Indicator */}
                {backendStatus.isSyncing ? (
                  <Badge
                    variant="outline"
                    className="text-[11px] font-medium py-0.5 px-2.5 bg-blue-50/70 text-blue-700 border-blue-200/80 flex items-center gap-1.5"
                  >
                    <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
                    Syncing...
                  </Badge>
                ) : backendStatus.isConnected ? (
                  <Badge
                    variant="outline"
                    className="text-[11px] font-medium py-0.5 px-2.5 bg-emerald-50/70 text-emerald-700 border-emerald-200/80 flex items-center gap-1.5"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    API Connected
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[11px] font-medium py-0.5 px-2.5 bg-amber-50/70 text-amber-700 border-amber-200/80 flex items-center gap-1.5"
                    title="Penyimpanan lokal aktif (Local Storage). Backend tidak terhubung."
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Local Mode
                  </Badge>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSyncWithBackend}
                  disabled={backendStatus.isSyncing}
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground rounded-lg"
                  title="Sinkronkan data dengan backend API"
                >
                  <RefreshCw
                    className={`h-2.5 w-2.5 mr-1 ${
                      backendStatus.isSyncing ? 'animate-spin' : ''
                    }`}
                  />
                  Sync
                </Button>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                Pusat kendali identitas pengguna, hak akses peran (Role), dan matriks izin granular (Modul &times; Akses) dengan standar keamanan Enterprise.
              </p>
            </div>

            {/* Quick Metrics KPI Chips */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/60 px-3 py-2 text-xs shadow-xs">
                <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    Pengguna
                  </div>
                  <div className="font-semibold text-foreground text-xs">
                    {stats.activeUsers}/{stats.totalUsers} Aktif
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/60 px-3 py-2 text-xs shadow-xs">
                <Shield className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    Peran (Role)
                  </div>
                  <div className="font-semibold text-foreground text-xs">
                    {stats.totalRoles} Terdaftar
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/60 px-3 py-2 text-xs shadow-xs">
                <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    Kredensial
                  </div>
                  <div className="font-semibold text-foreground text-xs">
                    Bcrypt Hashed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Backend Sync Error Notification (if any and not dismissed) */}
        {!dismissError && backendStatus.lastError && (
          <div className="flex items-center justify-between p-3.5 text-xs rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="font-medium">{backendStatus.lastError}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissError(true)}
              className="h-6 w-6 p-0 hover:bg-amber-100 text-amber-700 rounded-lg"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. WORKSPACE CONTENT (Sidebar ditangani oleh DashShell)                   */}
        {/* ========================================================================= */}
        <div className="min-w-0 w-full">
          <Routes>
            <Route index element={<UserTab users={users} roles={roles} />} />
            <Route path="users" element={<UserTab users={users} roles={roles} />} />
            <Route
              path="roles"
              element={
                <RoleTab
                  roles={roles}
                  users={users}
                  onSelectRoleForMatrix={handleSelectRoleForMatrix}
                />
              }
            />
            <Route
              path="permissions"
              element={
                <PermissionMatrixTab
                  roles={roles}
                  initialRoleId={selectedRoleForMatrix}
                />
              }
            />
            <Route path="api-logs" element={<ApiLogTab />} />
            <Route path="*" element={<UserTab users={users} roles={roles} />} />
          </Routes>
        </div>
      </div>
    </DashShell>
    
  );
}

export default App;
