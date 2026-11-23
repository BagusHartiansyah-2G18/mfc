import { Component, Suspense, useState, useEffect, type ReactNode } from 'react';
import {
  Sparkles,
  Layers,
  LayoutGrid,
  BarChart3,
  BookOpen,
  RefreshCw,
  LogOut,
  ExternalLink,
  Activity,
  AlertTriangle,
  FolderGit2,
  Lock,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Skeleton } from '@org/ui';
import { useAuth, setSession, silentRefreshToken } from '@org/auth';
import { lazyProvider } from './mf';

const RemoteNotedView = lazyProvider<{ apiBaseUrl?: string }>('compUI', 'NotedView');
const RemoteStandaloneQuestionnaire = lazyProvider<{ shareSlug?: string; apiBaseUrl?: string }>('compUI', 'StandaloneQuestionnaire');

interface ProviderBoundaryProps {
  children: ReactNode;
}

interface ProviderBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CompUIBoundary extends Component<ProviderBoundaryProps, ProviderBoundaryState> {
  override state: ProviderBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ProviderBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <Card className="border-amber-500/40 bg-amber-500/5 my-6">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-base font-bold">
                Komponen Remote compUI Belum Berjalan
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <p className="text-foreground">
              Host <strong>noted (Port 4203)</strong> membutuhkan modul <strong>compUI</strong> yang berjalan pada{' '}
              <a href="http://localhost:4201" target="_blank" rel="noreferrer" className="font-mono text-primary underline">
                http://localhost:4201
              </a>.
            </p>

            <div className="rounded-lg border bg-card p-4 space-y-2">
              <p className="font-semibold text-foreground">💡 Cara Menjalankan Remote compUI:</p>
              <div className="rounded-md bg-muted p-2 font-mono text-[11px] text-foreground select-all">
                npx nx run compUI:serve
              </div>
              <p className="text-[11px] text-muted-foreground">
                Atau jalankan seluruh service sekaligus:{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded font-mono">npm run dev</code>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={this.handleRetry}
                className="gap-2 text-xs cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Coba Sambungkan Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Suspense
        fallback={
          <div className="space-y-4 py-8">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        {this.props.children}
      </Suspense>
    );
  }
}

export function App() {
  const { session, logout, isDevBypass } = useAuth();
  const [activeTab, setActiveTab] = useState<'noted' | 'metrics' | 'info'>('noted');
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);

  // Healthcheck states
  const [authApiStatus, setAuthApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [notesApiStatus, setNotesApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Metrics
  const [metrics, setMetrics] = useState<any>(null);

  // Login Form States for Direct Auth on Port 4203
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('admin@bgs-software.id');
  const [loginPassword, setLoginPassword] = useState('Password123!');

  // 1. Proactive Token Refresh Timer (Cegah Sesi Berakhir di Latar Belakang)
  useEffect(() => {
    // Jalankan pengecekan setiap 3 menit
    const interval = setInterval(async () => {
      if (session?.expiresAt) {
        const timeRemainingMs = session.expiresAt - Date.now();
        // Jika sisa waktu kurang dari 15 menit, lakukan silent refresh secara transparan
        if (timeRemainingMs < 15 * 60 * 1000) {
          console.log('[Noted Host] Proactively refreshing access token...');
          await silentRefreshToken();
        }
      }
    }, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session?.expiresAt]);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const email = customEmail || loginEmail;
      const pass = customPass || loginPassword;
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Login gagal.');
      }
      setSession(
        {
          id: data.user.id,
          username: data.user.username,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          permissions: data.user.permissions,
          token: data.accessToken,
          refreshToken: data.refreshToken,
        },
        true
      );
      if (typeof window !== 'undefined' && data.refreshToken) {
        window.localStorage.setItem('mfc_auth_refresh_token', data.refreshToken);
      }
      checkHealth();
    } catch (err) {
      setLoginError((err as Error).message || 'Terjadi kesalahan saat login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const checkHealth = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/auth/health').catch(() => null);
      setAuthApiStatus(res && res.ok ? 'online' : 'offline');
    } catch {
      setAuthApiStatus('offline');
    }

    try {
      const res = await fetch('http://localhost:3002/api/notes/health').catch(() => null);
      setNotesApiStatus(res && res.ok ? 'online' : 'offline');
    } catch {
      setNotesApiStatus('offline');
    }
  };

  const fetchMetrics = async () => {
    try {
      const headers: Record<string, string> = {};
      if (session?.token) headers['Authorization'] = `Bearer ${session.token}`;
      const res = await fetch('http://localhost:3002/api/notes/metrics', { headers });
      if (res.ok) {
        const payload = await res.json();
        setMetrics(payload.data);
      }
    } catch {
      // quiet fallback
    }
  };

  useEffect(() => {
    checkHealth();
    fetchMetrics();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [session?.token]);

  // Deteksi rute akses formulir / kuisioner publik mandiri bebas login (/p/:slug, /survey/:slug, /formPublic/:slug atau ?shareSlug=...)
  const isPublicFormRoute =
    window.location.pathname.startsWith('/p/') ||
    window.location.pathname.startsWith('/survey/') ||
    window.location.pathname.startsWith('/formPublic') ||
    new URLSearchParams(window.location.search).has('shareSlug') ||
    new URLSearchParams(window.location.search).has('slug');

  if (isPublicFormRoute) {
    return (
      <CompUIBoundary>
        <RemoteStandaloneQuestionnaire apiBaseUrl="http://localhost:3002/api" />
      </CompUIBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground shadow-md">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                  MFC Noted
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
                  Host :4203
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Catatan Turunan &bull; Hierarchical Project Breakdown
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
            <button
              onClick={() => setActiveTab('noted')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'noted'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>Catatan Turunan</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('metrics');
                fetchMetrics();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'metrics'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
              <span>Dashboard Metrik</span>
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'info'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
              <span>Pilar & 5 Tahapan MFC</span>
            </button>
          </nav>

          {/* Actions: Health Indicator, App Switcher, User Menu */}
          <div className="flex items-center gap-3">
            {/* System Health Status Indicator */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] bg-muted/40 border border-border/60 px-2.5 py-1 rounded-lg font-mono">
              <span className="text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" /> Status:
              </span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  authApiStatus === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                }`}
                title="Auth API (Port 3001)"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${authApiStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                Auth:3001
              </span>
              <span className="text-muted-foreground/40">&bull;</span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  notesApiStatus === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                }`}
                title="Notes API (Port 3002)"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${notesApiStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                Notes:3002
              </span>
            </div>

            {/* Unified App Switcher (9-dots Launcher) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
                className="flex items-center justify-center h-9 w-9 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground transition-colors cursor-pointer shadow-xs"
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
                    <a
                      href="http://localhost:4200/"
                      className="flex flex-col p-2.5 rounded-xl border border-border/60 hover:bg-muted/60 transition-colors group"
                    >
                      <div className="flex items-center justify-between text-primary">
                        <span className="font-bold text-xs group-hover:underline">Portal Jasa</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono mt-1">:4200 (Host)</span>
                    </a>

                    <a
                      href="http://localhost:4201/"
                      className="flex flex-col p-2.5 rounded-xl border border-border/60 hover:bg-muted/60 transition-colors group"
                    >
                      <div className="flex items-center justify-between text-indigo-500">
                        <span className="font-bold text-xs group-hover:underline">Component UI</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono mt-1">:4201 (Remote)</span>
                    </a>

                    <a
                      href="http://localhost:4202/"
                      className="flex flex-col p-2.5 rounded-xl border border-border/60 hover:bg-muted/60 transition-colors group"
                    >
                      <div className="flex items-center justify-between text-emerald-500">
                        <span className="font-bold text-xs group-hover:underline">User Mgmt</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono mt-1">:4202 (Remote)</span>
                    </a>

                    <div className="flex flex-col p-2.5 rounded-xl border border-primary/40 bg-primary/10">
                      <div className="flex items-center justify-between text-primary">
                        <span className="font-bold text-xs">MFC Noted</span>
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-[10px] text-primary/80 font-mono mt-1">:4203 (Aktif)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Logout */}
            {session ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-foreground leading-tight">{session.name}</span>
                  <span className="text-[10px] text-muted-foreground">{session.role}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="h-8 text-xs gap-1 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 cursor-pointer"
                  title="Keluar dari sesi"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Keluar</span>
                </Button>
              </div>
            ) : isDevBypass ? (
              <span className="text-[11px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-1 rounded-md font-medium">
                Mode Bypass
              </span>
            ) : (
              <Button
                size="sm"
                onClick={() => handleLogin(undefined, 'admin@bgs-software.id', 'Password123!')}
                disabled={isLoggingIn}
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer gap-1.5 shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isLoggingIn ? 'Masuk...' : 'Masuk Cepat'}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {!session && !isDevBypass ? (
          <div className="max-w-md mx-auto my-12 space-y-6">
            <Card className="border-border/80 shadow-lg">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 mb-2">
                  <Lock className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold tracking-tight">
                  Autentikasi Sesi MFC Noted
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Layanan catatan turunan (Port 3002) membutuhkan token sesi JWT terverifikasi dari Identity Service (Port 3001).
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                {loginError && (
                  <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400">
                    {loginError}
                  </div>
                )}

                {/* 1-Click Quick Login Demo */}
                <Button
                  type="button"
                  onClick={() => handleLogin(undefined, 'admin@bgs-software.id', 'Password123!')}
                  disabled={isLoggingIn}
                  className="w-full h-10 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {isLoggingIn ? 'Memproses Masuk...' : 'Masuk Cepat sebagai Super Administrator'}
                </Button>

                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-border w-full" />
                  <span className="bg-card px-2 text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                    atau login kredensial
                  </span>
                </div>

                <form onSubmit={(e) => handleLogin(e)} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Email atau Username</label>
                    <input
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      placeholder="admin@bgs-software.id"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Password</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isLoggingIn}
                    className="w-full h-9 text-xs font-semibold cursor-pointer"
                  >
                    {isLoggingIn ? 'Memverifikasi...' : 'Masuk dengan Akun Terdaftar'}
                  </Button>
                </form>

                <div className="text-center pt-2">
                  <a
                    href="http://localhost:4200/"
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    &larr; Kembali ke Portal Utama (:4200)
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {activeTab === 'noted' && (
              <CompUIBoundary>
                <RemoteNotedView apiBaseUrl="http://localhost:3002/api" />
              </CompUIBoundary>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Dashboard Metrik & Serapan Proyek
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Ikhtisar capaian progres, total penganggaran kuantitatif, dan status tugas hierarki.
              </p>
            </div>

            {metrics ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Total Seluruh Catatan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-foreground">{metrics.totalNotes} item</div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {metrics.rootCount} Induk &bull; {metrics.subCount} Sub-Tingkat
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Rata-Rata Progres
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-primary">{metrics.averageProgress}%</div>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${metrics.averageProgress}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Pagu Anggaran Induk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      Rp {Number(metrics.totalBudget).toLocaleString('id-ID')}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Realisasi: Rp {Number(metrics.totalRealized).toLocaleString('id-ID')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Status Pekerjaan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600">{metrics.completedCount} Selesai</span>
                      <span className="text-muted-foreground/40">&bull;</span>
                      <span className="text-xs font-bold text-amber-500">{metrics.inProgressCount} Proses</span>
                    </div>
                    {metrics.overdueCount > 0 ? (
                      <p className="text-[11px] text-rose-500 font-semibold mt-1">
                        ⚠️ {metrics.overdueCount} tugas melewati deadline!
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-600 mt-1">✓ Seluruh jadwal tepat waktu</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">Memuat ringkasan data metrik...</div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                M Software Center (MFC)
              </span>
              <h2 className="text-2xl font-black text-foreground tracking-tight mt-1">
                4 Points For Building A Data Set & 5 Stages Information
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Konsep dasar di balik sistem Catatan Turunan (Derivative Notes): menyusun dataset terstruktur untuk
                menghasilkan informasi akurat penentu keputusan.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
                <span className="text-xs font-bold text-primary font-mono">Pilar 01</span>
                <h4 className="font-bold text-base text-foreground">Catatan (Ide Pokok)</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mengidentifikasi judul, nama, atau ide dari sebuah kegiatan kerja. Data awal yang diperlukan adalah
                  Judul kegiatan dan deskripsi ringkas.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
                <span className="text-xs font-bold text-indigo-500 font-mono">Pilar 02</span>
                <h4 className="font-bold text-base text-foreground">File & Dokumentasi</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  File berupa dokumen PDF yang menampung panduan lengkap serta dokumentasi gambar sebagai bukti dukung
                  pelaksanaan kegiatan nyata.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
                <span className="text-xs font-bold text-emerald-500 font-mono">Pilar 03</span>
                <h4 className="font-bold text-base text-foreground">Values (Nilai Kuantitatif)</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Nilai target dan realisasi anggaran yang dikelola untuk menghasilkan informasi akurat bagi pimpinan.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
                <span className="text-xs font-bold text-amber-500 font-mono">Pilar 04</span>
                <h4 className="font-bold text-base text-foreground">Sub Judul (Dekomposisi)</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Turunan dari induk judul yang menjelaskan tahapan atau rincian spesifik untuk meningkatkan akurasi
                  data.
                </p>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
}
export default App;
