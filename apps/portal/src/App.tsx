import { Component, Suspense, useEffect, useState, useMemo, type ReactNode } from 'react';
import { Route, Routes, Navigate, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  AppShell,
  PublicLayout,
  DashHeader,
  DashHeaderBrand,
  DashHeaderActions,
  DashHeaderUserMenu,
  Skeleton,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  type FeatureMenu,
  SubNav,
  DashSidebar,
} from '@org/ui';
import { AlertTriangle, RefreshCw, LogOut, LayoutGrid, ExternalLink, Layers, Users, Globe, FolderOpen, ClipboardList, Database, UserPlus } from 'lucide-react';
import { lazyProvider } from './mf';
import { loadFeatureMenu } from './config/feature';
import { SoftwareHouseLanding } from './pages/SoftwareHouseLanding';
import { LoginPage, getApiBaseUrl } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { AccountDisabledPage } from './pages/AccountDisabledPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { RouteGuard } from './auth/RouteGuard';
import { useAuth } from './auth/auth-store';

interface ProviderBoundaryProps {
  children: ReactNode;
  name: string;
}

interface ProviderBoundaryState {
  error: Error | null;
}

class ProviderBoundary extends Component<
  ProviderBoundaryProps,
  ProviderBoundaryState
> {
  override state: ProviderBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ProviderBoundaryState {
    return { error };
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  override render() {
    if (this.state.error) {
      const remotePort = this.props.name === 'userMgmt' ? 4202 : 4201;
      const remoteUrl = `http://localhost:${remotePort}`;

      return (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-lg">Micro Frontend Belum Aktif</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <p className="text-sm text-foreground">
              Komponen remote <strong>&quot;{this.props.name}&quot;</strong> saat ini belum berjalan di{' '}
              <a href={remoteUrl} target="_blank" rel="noreferrer" className="font-mono text-primary underline">
                {remoteUrl}
              </a>.
            </p>

            <div className="rounded-lg border bg-card p-4 space-y-2">
              <p className="font-semibold text-foreground">💡 Cara Menjalankan Remote Ini:</p>
              <div className="rounded-md bg-muted p-2 font-mono text-[11px] text-foreground select-all">
                npx nx run {this.props.name}:serve
              </div>
              <p className="text-[11px] text-muted-foreground">
                Atau jalankan seluruh remote dan host bersamaan:{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded font-mono">npm run dev</code>
              </p>
            </div>

            <div className="rounded-md bg-muted/60 p-3 font-mono text-[11px] text-muted-foreground overflow-x-auto">
              {this.state.error.message}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={this.handleRetry}
                className="gap-2 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Coba Sambungkan Lagi
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <a href={remoteUrl} target="_blank" rel="noreferrer">
                  Buka Standalone ({remoteUrl})
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        {this.props.children}
      </Suspense>
    );
  }
}

const CompUIApp = lazyProvider<{ basePath?: string }>('compUI', 'App');
const UserMgmtApp = lazyProvider<{ basePath?: string }>('userMgmt', 'App');
const RemoteNotedView = lazyProvider<{
  apiBaseUrl?: string;
  onNavigate?: (path: string) => void;
}>('compUI', 'NotedView');
const RemoteNotedFormsPage = lazyProvider<{
  kdJudul?: string;
  apiBaseUrl?: string;
  onNavigate?: (path: string) => void;
}>('compUI', 'NotedFormsPage');
const RemoteNotedFormResponsesPage = lazyProvider<{
  kdJudul?: string;
  formId?: string;
  apiBaseUrl?: string;
  onNavigate?: (path: string) => void;
}>('compUI', 'NotedFormResponsesPage');
const RemoteNotedDocumentsPage = lazyProvider<{
  kdJudul?: string;
  apiBaseUrl?: string;
  onNavigate?: (path: string) => void;
}>('compUI', 'NotedDocumentsPage');
const RemoteNotedFormsCatalogPage = lazyProvider<{
  apiBaseUrl?: string;
  onNavigate?: (path: string) => void;
}>('compUI', 'NoteFormsCatalogPage');
const RemoteNotedDatasetPage = lazyProvider<{
  apiBaseUrl?: string;
  onNavigate?: (path: string) => void;
}>('compUI', 'NoteDatasetPage');
const RemoteFriendsHubPage = lazyProvider<{
  apiBaseUrl?: string;
  onNavigate?: (path: string) => void;
}>('compUI', 'FriendsHubPage');
const RemoteStandaloneQuestionnaire = lazyProvider<{ shareSlug?: string; apiBaseUrl?: string }>('compUI', 'StandaloneQuestionnaire');
const RemoteStandaloneNotePage = lazyProvider<{ kdJudul?: string; apiBaseUrl?: string }>('compUI', 'StandaloneNotePage');
const RemoteCakeApp = lazyProvider<{
  initialPage?: 'catalog' | 'custom' | 'about' | 'analytics' | 'admin';
  onNavigate?: (path: string) => void;
}>('cake', 'CakeApp');
const RemoteProfileApp = lazyProvider<{
  initialPage?: 'profile' | 'admin';
  onNavigate?: (path: string) => void;
}>('profile', 'ProfileApp');

function PortalHeader({ brand }: { brand: string }) {
  const navigate = useNavigate();
  const { session, isDevBypass, logout } = useAuth();
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);

  const initials = (session?.name || 'OP')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    try {
      if (session?.id && !isDevBypass) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000);
        await fetch(`${getApiBaseUrl()}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.id, userName: session.name }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timer));
      }
    } catch {
      // Tetap lanjut membersihkan sesi lokal walau server offline
    } finally {
      logout();
      navigate('/login?reason=logged_out', { replace: true });
    }
  };

  return (
    <div className="px-2 pt-2 print:hidden">
      <DashHeader className="py-2">
        <div className="flex items-center justify-between gap-4">
          <DashHeaderBrand title={brand} href="/compUI" />
          <DashHeaderActions>
            {/* App Switcher Launcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-border/80 bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
                title="Buka Aplikasi Ekosistem MFC"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>

              {isAppMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-2xl border border-border/80 bg-card p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setIsAppMenuOpen(false)}
                >
                  <p className="text-xs font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                    Ekosistem Micro Frontend
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAppMenuOpen(false);
                        navigate('/');
                      }}
                      className="flex flex-col p-2.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 transition-colors group text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-primary">
                        <span className="font-bold text-xs">Portal Jasa</span>
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-[10px] text-primary/80 font-mono mt-1">:4200 (Aktif)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAppMenuOpen(false);
                        navigate('/noted');
                      }}
                      className="flex flex-col p-2.5 rounded-xl border border-border/60 hover:bg-muted/60 transition-colors group text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-primary">
                        <span className="font-bold text-xs group-hover:underline">MFC Noted</span>
                        <Layers className="h-3 w-3 opacity-60" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono mt-1">Hierarki WBS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAppMenuOpen(false);
                        navigate('/user-management');
                      }}
                      className="flex flex-col p-2.5 rounded-xl border border-border/60 hover:bg-muted/60 transition-colors group text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-emerald-500">
                        <span className="font-bold text-xs group-hover:underline">User Mgmt</span>
                        <Users className="h-3 w-3 opacity-60" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono mt-1">Akses & Tim</span>
                    </button>

                    {isDevBypass && (
                      <a
                        href="http://localhost:4201/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col p-2.5 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 transition-colors group"
                      >
                        <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                          <span className="font-bold text-xs group-hover:underline">Dev compUI</span>
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono mt-1">:4201 (Raw)</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {session && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground pr-1">
                <span className="font-semibold text-foreground" data-testid="portal-active-user">
                  {session.name}
                </span>
                <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium bg-muted/60">
                  {session.role}
                </span>
              </div>
            )}
            <DashHeaderUserMenu
              user={{
                name: session?.name || 'Guest',
                role: session?.role || 'User',
                avatarFallback: initials || 'U',
              }}
              onLogout={handleLogout}
            />
            {!isDevBypass && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="portal-logout-btn"
                className="h-8 text-xs gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/60 dark:hover:bg-rose-950/40"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Keluar</span>
              </Button>
            )}
          </DashHeaderActions>
        </div>
      </DashHeader>
    </div>
  );
}

const NOTED_WORKSPACE_ITEMS = [
  { path: '/noted', label: 'Catatan Saya', description: 'Catatan & sub-tahapan', icon: Layers, end: true },
  { path: '/noted/shared', label: 'Dibagikan ke Saya', description: 'Catatan dari rekan', icon: Users },
  { path: '/noted/public', label: 'Katalog Publik', description: 'Catatan terbuka', icon: Globe },
  { path: '/noted/documents', label: 'Dokumen', description: 'Berkas & bukti', icon: FolderOpen },
  { path: '/noted/forms', label: 'Form Pendukung', description: 'Katalog formulir', icon: ClipboardList },
  { path: '/noted/dataset', label: 'Dataset', description: 'Data respon form', icon: Database },
  { path: '/noted/friends', label: 'Kelola Rekan', description: 'Relasi & kolaborasi', icon: UserPlus },
];

const NOTED_WORKSPACE_MENU: FeatureMenu = {
  brand: 'Ruang Kerja Noted',
  menus: [
    {
      section: 'Catatan',
      items: [
        { id: 'noted-root', label: 'Catatan Saya', path: '/noted', icon: 'layers', order: 10, end: true },
        { id: 'noted-shared', label: 'Dibagikan ke Saya', path: '/noted/shared', icon: 'users', order: 20 },
        { id: 'noted-public', label: 'Katalog Publik', path: '/noted/public', icon: 'globe', order: 30 },
      ],
    },
    {
      section: 'Workspace',
      items: [
        { id: 'noted-documents', label: 'Dokumen', path: '/noted/documents', icon: 'folder-open', order: 10 },
        { id: 'noted-forms', label: 'Form Pendukung', path: '/noted/forms', icon: 'clipboard-list', order: 20 },
        { id: 'noted-dataset', label: 'Dataset', path: '/noted/dataset', icon: 'database', order: 30 },
        { id: 'noted-friends', label: 'Kelola Rekan', path: '/noted/friends', icon: 'user-plus', order: 40 },
      ],
    },
  ],
};

function NotedWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-0">
      <div className="relative hidden shrink-0 md:z-50 md:block md:sticky md:top-0 md:h-[calc(100vh-4.5rem)] md:w-[72px]">
        <div className="absolute inset-y-0 left-0 z-40">
          <DashSidebar menu={NOTED_WORKSPACE_MENU} hoverOpen onToggle={()=>{}}/>
        </div>
      </div>
      <div className="min-w-0 flex-1 md:pl-4">
        <div className="md:hidden mb-3">
          <SubNav title="Ruang Kerja Noted" items={NOTED_WORKSPACE_ITEMS} />
        </div>
        {children}
      </div>
    </div>
  );
}

function NotedRouteHandler({
  effectiveMenu,
  brandName,
  defaultTab = 'MY_NOTES',
}: {
  effectiveMenu: FeatureMenu | null;
  brandName: string;
  defaultTab?: 'MY_NOTES' | 'SHARED_WITH_ME' | 'PUBLIC_CATALOG';
}) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const hasViewParam = Boolean(searchParams.get('viewNote') || searchParams.get('note') || searchParams.get('kdJudul'));

  // Tentukan tab aktif berdasarkan rute URL saat ini atau defaultTab
  const activeTab: 'MY_NOTES' | 'SHARED_WITH_ME' | 'PUBLIC_CATALOG' = useMemo(() => {
    if (location.pathname.endsWith('/shared')) return 'SHARED_WITH_ME';
    if (location.pathname.endsWith('/public') || location.pathname.endsWith('/katalog-publik')) return 'PUBLIC_CATALOG';
    if (location.pathname.endsWith('/my-notes') || location.pathname === '/noted') return 'MY_NOTES';
    return defaultTab;
  }, [location.pathname, defaultTab]);

  // Jika pengunjung belum login dan mengakses catatan spesifik (misal ?viewNote=1)
  // atau Katalog Publik (/noted/public), sajikan mode publik tanpa me-redirect ke login!
  if (!session && hasViewParam) {
    return (
      <ProviderBoundary name="compUI">
        <RemoteStandaloneNotePage apiBaseUrl="http://localhost:3002/api" />
      </ProviderBoundary>
    );
  }

  if (!session && activeTab === 'PUBLIC_CATALOG') {
    return (
      <PublicLayout brand={brandName} dashboardPath="/noted/public">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <ProviderBoundary name="compUI">
            <RemoteNotedView
              apiBaseUrl="http://localhost:3002/api"
              initialTab="PUBLIC_CATALOG"
              activeTab="PUBLIC_CATALOG"
              showInternalTabs={false}
              onNavigate={(path) => {
                if (path === '/public') navigate('/noted/public');
                else navigate(path.startsWith('/noted') ? path : `/noted${path}`);
              }}
            />
          </ProviderBoundary>
        </div>
      </PublicLayout>
    );
  }

  // Jika sudah login atau akses ke root dashboard /noted:
  return (
    <RouteGuard requiredPermissions={['noted:view']}>
      {effectiveMenu ? (
        <AppShell menu={effectiveMenu} hoverOpen={true} header={<PortalHeader brand={brandName} />}>
          <ProviderBoundary name="compUI">
            <div className="py-4 min-h-[calc(100vh-4rem)]">
              <NotedWorkspaceLayout>
                <RemoteNotedView
                  apiBaseUrl="http://localhost:3002/api"
                  initialTab={activeTab}
                  activeTab={activeTab}
                  showInternalTabs={false}
                  onNavigate={(path) => {
                    if (path === '/shared') navigate('/noted/shared');
                    else if (path === '/public') navigate('/noted/public');
                    else if (path === '/' || path === '/my-notes') navigate('/noted');
                    else navigate(path.startsWith('/noted') ? path : `/noted${path}`);
                  }}
                />
              </NotedWorkspaceLayout>
            </div>
          </ProviderBoundary>
        </AppShell>
      ) : (
        <div className="flex h-screen gap-4 p-4">
          <Skeleton className="h-full w-64" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      )}
    </RouteGuard>
  );
}

type NotedWorkspaceKind = 'forms' | 'responses' | 'documents' | 'forms-catalog' | 'dataset' | 'friends';

function NotedWorkspaceRoute({
  kind,
  effectiveMenu,
  brandName,
}: {
  kind: NotedWorkspaceKind;
  effectiveMenu: FeatureMenu | null;
  brandName: string;
}) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { kdJudul, formId } = useParams();
  const authToken = session?.token || 'dev-bypass-token-2026';
  const apiBaseUrl = 'http://localhost:3002/api';
  const onNavigate = (path: string) => {
    const target = path === '/' ? '/noted' : path.startsWith('/noted') ? path : `/noted${path}`;
    navigate(target);
  };

  return (
    <RouteGuard
      requiredPermissions={
        kind === 'forms' || kind === 'responses' || kind === 'forms-catalog' || kind === 'dataset'
          ? ['noted_forms:view']
          : ['noted:view']
      }
    >
      {effectiveMenu ? (
        <AppShell menu={effectiveMenu} hoverOpen={true} header={<PortalHeader brand={brandName} />}>
          <ProviderBoundary name="compUI">
            <div className="py-4 min-h-[calc(100vh-4rem)]">
              <NotedWorkspaceLayout>
                {kind === 'forms' && kdJudul ? (
                  <RemoteNotedFormsPage
                    kdJudul={kdJudul}
                    apiBaseUrl={apiBaseUrl}
                    onNavigate={onNavigate}
                  />
                ) : kind === 'responses' && kdJudul && formId ? (
                  <RemoteNotedFormResponsesPage
                    kdJudul={kdJudul}
                    formId={formId}
                    apiBaseUrl={apiBaseUrl}
                    onNavigate={onNavigate}
                  />
                ) : kind === 'documents' ? (
                  <RemoteNotedDocumentsPage
                    kdJudul={kdJudul}
                    apiBaseUrl={apiBaseUrl}
                    onNavigate={onNavigate}
                  />
                ) : kind === 'forms-catalog' ? (
                  <RemoteNotedFormsCatalogPage apiBaseUrl={apiBaseUrl} onNavigate={onNavigate} />
                ) : kind === 'dataset' ? (
                  <RemoteNotedDatasetPage apiBaseUrl={apiBaseUrl} onNavigate={onNavigate} />
                ) : kind === 'friends' ? (
                  <RemoteFriendsHubPage apiBaseUrl={apiBaseUrl} onNavigate={onNavigate} />
                ) : (
                  <div className="text-sm text-muted-foreground">Parameter route tidak lengkap.</div>
                )}
              </NotedWorkspaceLayout>
            </div>
          </ProviderBoundary>
        </AppShell>
      ) : (
        <div className="flex h-screen gap-4 p-4">
          <Skeleton className="h-full w-64" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      )}
    </RouteGuard>
  );
}

export function App() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState<FeatureMenu | null>(null);
  const brandName = import.meta.env.VITE_BRAND_NAME || 'VITE_BRAND_NAME';
  const { isDevBypass } = useAuth();

  useEffect(() => {
    let mounted = true;
    const configUrl = import.meta.env.VITE_FEATURE_CONFIG_URL || '/feature.yml';
    loadFeatureMenu(configUrl).then((m) => {
      if (mounted) setMenu(m);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const effectiveMenu = useMemo(() => {
    if (!menu) return null;
    if (isDevBypass) return menu;
    return {
      ...menu,
      menus: menu.menus.filter((sec) => sec.section !== 'Micro Front End (compUI)'),
    };
  }, [menu, isDevBypass]);

  const defaultDashboardPath = isDevBypass ? '/compUI' : '/noted';

  return (
    <Routes>
      {/* 1. Halaman Publik: Website Promosi Jasa Software Development */}
      <Route
        path="/"
        element={
          <PublicLayout brand={brandName} 
            dashboardPath={defaultDashboardPath} 
            icon={<img src="mfc/android-chrome-192x192.png" alt="MFC Logo" className="h-10 w-10 rounded-full object-cover" />}>
            <SoftwareHouseLanding />
          </PublicLayout>
        }
      />

      {/* 2. Modul Autentikasi Sistem MFC (Split Screen Login & Related Auth Flows) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="/account-disabled" element={<AccountDisabledPage />} />
      <Route
        path="/customer-portal"
        element={
          <RouteGuard allowedRoles={['Customer', 'Client Representative', 'Administrator', 'Super Administrator']}>
            <CustomerPortalPage />
          </RouteGuard>
        }
      />

      {/* 2b. Halaman Formulir / Kuisioner Publik Mandiri Bebas Login (MFC Dynamic Forms) */}
      <Route
        path="/p/:shareSlug"
        element={
          <ProviderBoundary name="compUI">
            <RemoteStandaloneQuestionnaire apiBaseUrl="http://localhost:3002/api" />
          </ProviderBoundary>
        }
      />
      <Route
        path="/survey/:shareSlug"
        element={
          <ProviderBoundary name="compUI">
            <RemoteStandaloneQuestionnaire apiBaseUrl="http://localhost:3002/api" />
          </ProviderBoundary>
        }
      />
      <Route
        path="/formPublic/:shareSlug"
        element={
          <ProviderBoundary name="compUI">
            <RemoteStandaloneQuestionnaire apiBaseUrl="http://localhost:3002/api" />
          </ProviderBoundary>
        }
      />
      <Route
        path="/formPublic"
        element={
          <ProviderBoundary name="compUI">
            <RemoteStandaloneQuestionnaire apiBaseUrl="http://localhost:3002/api" />
          </ProviderBoundary>
        }
      />

      {/* 2c. Halaman Catatan Mandiri di Luar Dashboard / Bebas Login (MFC Note Viewer) */}
      <Route
        path="/n/:kdJudul"
        element={
          <ProviderBoundary name="compUI">
            <RemoteStandaloneNotePage apiBaseUrl="http://localhost:3002/api" />
          </ProviderBoundary>
        }
      />
      <Route
        path="/n"
        element={
          <ProviderBoundary name="compUI">
            <RemoteStandaloneNotePage apiBaseUrl="http://localhost:3002/api" />
          </ProviderBoundary>
        }
      />
      <Route
        path="/noted/view/:kdJudul"
        element={
          <ProviderBoundary name="compUI">
            <RemoteStandaloneNotePage apiBaseUrl="http://localhost:3002/api" />
          </ProviderBoundary>
        }
      />

      {/* 3. Halaman Dashboard Micro Front End (compUI) dengan AppShell & Sidebar */}
      <Route
        path="/compUI/*"
        element={
          // !isDevBypass ? (
          //   <Navigate to="/noted" replace />
          // ) : (
            <RouteGuard>
              {effectiveMenu ? (
                <AppShell menu={effectiveMenu} header={<PortalHeader brand={brandName} />}>
                  <ProviderBoundary name="compUI">
                    <CompUIApp basePath="/compUI" />
                  </ProviderBoundary>
                </AppShell>
              ) : (
                <div className="flex h-screen gap-4 p-4">
                  <Skeleton className="h-full w-64" />
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                </div>
              )}
            </RouteGuard>
          // )
        }
      />

      {/* 4. Halaman User Management Micro Front End (userMgmt) */}
      <Route
        path="/user-management/*"
        element={
          <RouteGuard allowedRoles={['Super Administrator', 'Administrator', 'Admin']}>
            {effectiveMenu ? (
              <AppShell menu={effectiveMenu} hoverOpen={true} header={<PortalHeader brand={brandName} />}>
                <ProviderBoundary name="userMgmt">
                  <UserMgmtApp basePath="/user-management" />
                </ProviderBoundary>
              </AppShell>
            ) : (
              <div className="flex h-screen gap-4 p-4">
                <Skeleton className="h-full w-64" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            )}
          </RouteGuard>
        }
      />

      {/* 5. Halaman Aplikasi Noted: Catatan Saya, Dibagikan ke Saya, dan Katalog Terbuka Publik */}
      <Route
        path="/noted/forms"
        element={<NotedWorkspaceRoute kind="forms-catalog" effectiveMenu={effectiveMenu} brandName={brandName} />}
      />
      <Route
        path="/noted/forms/:kdJudul"
        element={<NotedWorkspaceRoute kind="forms" effectiveMenu={effectiveMenu} brandName={brandName} />}
      />
      <Route
        path="/noted/forms/:kdJudul/:formId/responses"
        element={<NotedWorkspaceRoute kind="responses" effectiveMenu={effectiveMenu} brandName={brandName} />}
      />
      <Route
        path="/noted/documents"
        element={<NotedWorkspaceRoute kind="documents" effectiveMenu={effectiveMenu} brandName={brandName} />}
      />
      <Route
        path="/noted/dataset"
        element={<NotedWorkspaceRoute kind="dataset" effectiveMenu={effectiveMenu} brandName={brandName} />}
      />
      <Route
        path="/noted/friends"
        element={<NotedWorkspaceRoute kind="friends" effectiveMenu={effectiveMenu} brandName={brandName} />}
      />
      <Route
        path="/noted/shared"
        element={<NotedRouteHandler defaultTab="SHARED_WITH_ME" effectiveMenu={effectiveMenu} brandName={brandName} />}
      />
      <Route
        path="/noted/public"
        element={<NotedRouteHandler defaultTab="PUBLIC_CATALOG" effectiveMenu={effectiveMenu} brandName={brandName} />}
      />
      <Route
        path="/noted/katalog-publik"
        element={<Navigate to="/noted/public" replace />}
      />
      <Route
        path="/noted/my-notes"
        element={<Navigate to="/noted" replace />}
      />
      <Route
        path="/noted"
        element={<NotedRouteHandler defaultTab="MY_NOTES" effectiveMenu={effectiveMenu} brandName={brandName} />}
      />
      <Route
        path="/noted/*"
        element={<NotedRouteHandler defaultTab="MY_NOTES" effectiveMenu={effectiveMenu} brandName={brandName} />}
      />

      {/* 5b. Cake Marketing Platform (Terintegrasi Portal 4200 + Redirect Admin ke Noted) */}
      <Route
        path="/cake/admin"
        element={
          <RouteGuard requiredPermissions={['cake:view']}>
            {effectiveMenu ? (
              <AppShell menu={effectiveMenu} hoverOpen={true} header={<PortalHeader brand={brandName} />}>
                <ProviderBoundary name="cake">
                  <RemoteCakeApp initialPage="admin" onNavigate={(path) => navigate(path)} />
                </ProviderBoundary>
              </AppShell>
            ) : (
              <div className="flex h-screen gap-4 p-4">
                <Skeleton className="h-full w-64" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            )}
          </RouteGuard>
        }
      />
      <Route
        path="/cake/produk/:slug"
        element={
          effectiveMenu ? (
            <AppShell menu={effectiveMenu} hoverOpen={true} header={<PortalHeader brand={brandName} />}>
              <ProviderBoundary name="cake">
                <RemoteCakeApp initialPage="catalog" onNavigate={(path) => navigate(path)} />
              </ProviderBoundary>
            </AppShell>
          ) : (
            <div className="flex h-screen gap-4 p-4">
              <Skeleton className="h-full w-64" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          )
        }
      />
      <Route
        path="/cake"
        element={
          effectiveMenu ? (
            <AppShell menu={effectiveMenu} hoverOpen={true} header={<PortalHeader brand={brandName} />}>
              <ProviderBoundary name="cake">
                <RemoteCakeApp initialPage="catalog" onNavigate={(path) => navigate(path)} />
              </ProviderBoundary>
            </AppShell>
          ) : (
            <div className="flex h-screen gap-4 p-4">
              <Skeleton className="h-full w-64" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          )
        }
      />

      <Route
        path="/profile/admin"
        element={
          <RouteGuard requiredPermissions={['profile:view']}>
            {effectiveMenu ? (
              <AppShell menu={effectiveMenu} hoverOpen={true} header={<PortalHeader brand={brandName} />}>
                <ProviderBoundary name="profile">
                  <RemoteProfileApp initialPage="admin" onNavigate={(path) => navigate(path)} />
                </ProviderBoundary>
              </AppShell>
            ) : (
              <div className="flex h-screen gap-4 p-4">
                <Skeleton className="h-full w-64" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            )}
          </RouteGuard>
        }
      />
      <Route
        path="/profile"
        element={
          effectiveMenu ? (
            <AppShell menu={effectiveMenu} hoverOpen={true} header={<PortalHeader brand={brandName} />}>
              <ProviderBoundary name="profile">
                <RemoteProfileApp initialPage="profile" onNavigate={(path) => navigate(path)} />
              </ProviderBoundary>
            </AppShell>
          ) : (
            <div className="flex h-screen gap-4 p-4">
              <Skeleton className="h-full w-64" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          )
        }
      />

      {/* 6. Alias Navigasi Cepat */}
      <Route path="/widgets" element={<Navigate to={isDevBypass ? "/compUI/widgets" : "/noted"} replace />} />
      <Route path="/dashboard" element={<Navigate to={isDevBypass ? "/compUI" : "/noted"} replace />} />
      <Route path="/users" element={<Navigate to="/user-management" replace />} />

      {/* 5. Fallback 404 */}
      <Route
        path="*"
        element={
          <PublicLayout brand={brandName} dashboardPath={defaultDashboardPath}>
            <div className="mx-auto max-w-md py-20 px-4 text-center">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">404 - Halaman Tidak Ditemukan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Rute yang Anda cari tidak ditemukan.
                  </p>
                  <Button asChild>
                    <Link to="/">Kembali ke Halaman Publik</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </PublicLayout>
        }
      />
    </Routes>
  );
}

export default App;
