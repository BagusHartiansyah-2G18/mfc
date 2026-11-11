import { Component, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Route, Routes, Navigate, Link } from 'react-router-dom';
import {
  AppShell,
  PublicLayout,
  Skeleton,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  type FeatureMenu,
} from '@org/ui';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { lazyProvider } from './mf';
import { loadFeatureMenu } from './config/feature';
import { SoftwareHouseLanding } from './pages/SoftwareHouseLanding';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { AccountDisabledPage } from './pages/AccountDisabledPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { RouteGuard } from './auth/RouteGuard';

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
  state: ProviderBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ProviderBoundaryState {
    return { error };
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      const isRemoteNotFound =
        this.state.error.message.includes('#RUNTIME-008') ||
        this.state.error.message.includes('Failed to fetch dynamically imported module');
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

export function App() {
  const [menu, setMenu] = useState<FeatureMenu | null>(null);
  const brandName = import.meta.env.VITE_BRAND_NAME || 'VITE_BRAND_NAME';

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

  return (
    <Routes>
      {/* 1. Halaman Publik: Website Promosi Jasa Software Development */}
      <Route
        path="/"
        element={
          <PublicLayout brand={brandName} dashboardPath="/compUI">
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
          <RouteGuard allowedRoles={['Customer', 'Administrator']}>
            <CustomerPortalPage />
          </RouteGuard>
        }
      />

      {/* 3. Halaman Dashboard Micro Front End (compUI) dengan AppShell & Sidebar */}
      <Route
        path="/compUI/*"
        element={
          <RouteGuard>
            {menu ? (
              <AppShell menu={menu}>
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
        }
      />

      {/* 4. Halaman User Management Micro Front End (userMgmt) */}
      <Route
        path="/user-management/*"
        element={
          <RouteGuard>
            {menu ? (
              <AppShell menu={menu} hoverOpen={true}>
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

      {/* 4. Alias Navigasi Cepat */}
      <Route path="/widgets" element={<Navigate to="/compUI/widgets" replace />} />
      <Route path="/dashboard" element={<Navigate to="/compUI" replace />} />
      <Route path="/users" element={<Navigate to="/user-management" replace />} />

      {/* 5. Fallback 404 */}
      <Route
        path="*"
        element={
          <PublicLayout brand={brandName} dashboardPath="/compUI">
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
