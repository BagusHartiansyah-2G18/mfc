import { Component, Suspense, useState, useEffect, type ReactNode } from 'react';
import {
  Sparkles, LayoutGrid, BarChart3, BookOpen, RefreshCw, LogOut, ExternalLink, Activity,
  AlertTriangle, FolderGit2, Lock, Database,
} from 'lucide-react';
import {
  Button, Card, CardHeader, CardTitle, CardContent, Skeleton, DashShell, DashFooter,
  type FeatureMenu,
} from '@org/ui';
import { useAuth, setSession, silentRefreshToken, hasPermission } from '@org/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { lazyProvider } from './mf';

type NavigateFn = (path: string) => void;

const RemoteNotedView = lazyProvider<{
  apiBaseUrl?: string;
  onNavigate?: NavigateFn;
  initialTab?: 'MY_NOTES' | 'SHARED_WITH_ME' | 'PUBLIC_CATALOG';
  activeTab?: 'MY_NOTES' | 'SHARED_WITH_ME' | 'PUBLIC_CATALOG';
  showInternalTabs?: boolean;
}>('compUI', 'NotedView');
const RemoteStandaloneQuestionnaire = lazyProvider<{ shareSlug?: string; apiBaseUrl?: string }>('compUI', 'StandaloneQuestionnaire');
const RemoteNotedFormsPage = lazyProvider<{
  kdJudul: string;
  apiBaseUrl?: string;
  onNavigate?: NavigateFn;
}>('compUI', 'NotedFormsPage');
const RemoteNotedFormResponsesPage = lazyProvider<{
  kdJudul: string;
  formId: string;
  apiBaseUrl?: string;
  initialTab?: 'rekap' | 'isi' | 'info';
  onNavigate?: NavigateFn;
}>('compUI', 'NotedFormResponsesPage');
const RemoteNotedDocumentsPage = lazyProvider<{
  kdJudul?: string;
  apiBaseUrl?: string;
  onNavigate?: NavigateFn;
}>('compUI', 'NotedDocumentsPage');
const RemoteNotedFormsCatalogPage = lazyProvider<{ apiBaseUrl?: string; onNavigate?: NavigateFn }>('compUI', 'NoteFormsCatalogPage');
const RemoteNotedDatasetPage = lazyProvider<{ apiBaseUrl?: string; onNavigate?: NavigateFn }>('compUI', 'NoteDatasetPage');
const RemoteFriendsHubPage = lazyProvider<{ apiBaseUrl?: string; onNavigate?: NavigateFn }>('compUI', 'FriendsHubPage');

const API_BASE = 'http://localhost:3002/api';

const notedMenu: FeatureMenu = {
  brand: 'MFC Noted',
  shell: { sidebar: { collapsible: true, defaultOpen: true } },
  menus: [
    {
      section: 'Noted',
      items: [
        { id: 'noted-root', label: 'Catatan Saya', path: '/', icon: 'layers', order: 10 },
        { id: 'noted-shared', label: 'Dibagikan ke Saya', path: '/shared', icon: 'users', order: 20 },
        { id: 'noted-public', label: 'Katalog Publik', path: '/public', icon: 'globe', order: 30 },
        { id: 'noted-documents', label: 'Dokumen', path: '/documents', icon: 'folder-open', order: 40 },
        { id: 'noted-forms', label: 'Form Pendukung', path: '/forms', icon: 'clipboard-list', order: 50 },
        { id: 'noted-dataset', label: 'Dataset', path: '/dataset', icon: 'database', order: 60 },
        { id: 'noted-friends', label: 'Kelola Rekan', path: '/friends', icon: 'user-plus', order: 70 },
      ],
    },
    {
      section: 'Wawasan',
      items: [
        { id: 'noted-metrics', label: 'Dashboard Metrik', path: '/metrics', icon: 'chart', order: 10 },
        { id: 'noted-info', label: 'Pilar & 5 Tahapan', path: '/info', icon: 'file', order: 20 },
      ],
    },
  ],
};

interface ProviderBoundaryProps { children: ReactNode; }
interface ProviderBoundaryState { hasError: boolean; error: Error | null; }

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
              <CardTitle className="text-base font-bold">Komponen Remote compUI Belum Berjalan</CardTitle>
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
              <p className="font-semibold text-foreground">Cara Menjalankan Remote compUI:</p>
              <div className="rounded-md bg-muted p-2 font-mono text-[11px] text-foreground select-all">
                npx nx run compUI:serve
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button variant="default" size="sm" onClick={this.handleRetry} className="gap-2 text-xs cursor-pointer">
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
  const location = useLocation();
  const navigate = useNavigate();

  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const [authApiStatus, setAuthApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [notesApiStatus, setNotesApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('admin@bgs-software.id');
  const [loginPassword, setLoginPassword] = useState('Password123!');

  useEffect(() => {
    const interval = setInterval(async () => {
      if (session?.expiresAt) {
        const timeRemainingMs = session.expiresAt - Date.now();
        if (timeRemainingMs < 15 * 60 * 1000) {
          await silentRefreshToken();
        }
      }
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session?.expiresAt]);

  const checkHealth = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/auth/health').catch(() => null);
      setAuthApiStatus(res && res.ok ? 'online' : 'offline');
    } catch { setAuthApiStatus('offline'); }
    try {
      const res = await fetch('http://localhost:3002/api/notes/health').catch(() => null);
      setNotesApiStatus(res && res.ok ? 'online' : 'offline');
    } catch { setNotesApiStatus('offline'); }
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
      if (!res.ok) throw new Error(data?.message || 'Login gagal.');
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

  // Rute publik mandiri (tanpa login): /p/:slug, /survey/:slug, /formPublic, /public, ?shareSlug=...
  const isPublicFormRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/p/') ||
      window.location.pathname.startsWith('/survey/') ||
      window.location.pathname.startsWith('/formPublic') ||
      window.location.pathname.replace(/\/+$/, '') === '/public' ||
      new URLSearchParams(window.location.search).has('shareSlug') ||
      new URLSearchParams(window.location.search).has('slug'));

  if (isPublicFormRoute) {
    if (window.location.pathname.replace(/\/+$/, '') === '/public') {
      return (
        <div className="max-w-7xl w-full mx-auto p-4 sm:p-6">
          <CompUIBoundary>
            <RemoteNotedView
              apiBaseUrl={API_BASE}
              onNavigate={navigate}
              initialTab="PUBLIC_CATALOG"
              activeTab="PUBLIC_CATALOG"
              showInternalTabs={false}
            />
          </CompUIBoundary>
        </div>
      );
    }
    return (
      <CompUIBoundary>
        <RemoteStandaloneQuestionnaire apiBaseUrl={API_BASE} />
      </CompUIBoundary>
    );
  }

  const safeDecode = (value: string) => {
    try { return decodeURIComponent(value); } catch { return value; }
  };

  if (!session && !isDevBypass) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full space-y-6">
          <Card className="border-border/80 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 mb-2"><Lock className="h-6 w-6" /></div>
              <CardTitle className="text-xl font-bold tracking-tight">Autentikasi Sesi MFC Noted</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Layanan catatan turunan (Port 3002) membutuhkan token sesi JWT terverifikasi dari Identity Service (Port 3001).</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {loginError && <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600">{loginError}</div>}
              <Button
                type="button"
                onClick={() => handleLogin(undefined, 'admin@bgs-software.id', 'Password123!')}
                disabled={isLoggingIn}
                className="w-full h-10 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm gap-2"
              >
                <Sparkles className="h-4 w-4" />{isLoggingIn ? 'Memproses Masuk...' : 'Masuk Cepat sebagai Super Administrator'}
              </Button>
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-border w-full" />
                <span className="bg-card px-2 text-[10px] text-muted-foreground uppercase font-mono tracking-wider">atau login kredensial</span>
              </div>
              <form onSubmit={(e) => handleLogin(e)} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Email atau Username</label>
                  <input type="text" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required placeholder="admin@bgs-software.id" className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Password</label>
                  <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required placeholder="••••••••" className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono" />
                </div>
                <Button type="submit" variant="outline" disabled={isLoggingIn} className="w-full h-9 text-xs font-semibold cursor-pointer">
                  {isLoggingIn ? 'Memverifikasi...' : 'Masuk dengan Akun Terdaftar'}
                </Button>
              </form>
              <div className="text-center pt-2">
                <a href="http://localhost:4200/" className="text-xs text-muted-foreground hover:text-foreground underline">&larr; Kembali ke Portal Utama (:4200)</a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isDevBypass && !hasPermission('noted:view')) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans">
        <Card className="max-w-md w-full border-rose-500/30 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 mb-2"><Lock className="h-6 w-6" /></div>
            <CardTitle className="text-lg font-bold">Akses Ditolak (403)</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Peran akun Anda ({session?.role || 'User'}) tidak memiliki izin <code className="font-mono">noted:view</code> dari User Management.</p>
          </CardHeader>
          <CardContent className="pt-2 flex justify-center gap-2">
            <Button type="button" variant="outline" onClick={() => { window.location.href = 'http://localhost:4200/'; }} className="h-9 text-xs font-semibold cursor-pointer">
              Kembali ke Portal Utama
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const responsesMatch = pathname.match(/^\/forms\/([^/]+)\/([^/]+)\/responses$/);
  const formsMatch = pathname.match(/^\/forms\/([^/]+)$/);
  const isFormsCatalogRoute = pathname === '/forms';
  const isDocumentsRoute = pathname === '/documents';
  const isDatasetRoute = pathname === '/dataset';
  const isFriendsRoute = pathname === '/friends';
  const isMetricsRoute = pathname === '/metrics';
  const isInfoRoute = pathname === '/info';
  const notedInitialTab: 'MY_NOTES' | 'SHARED_WITH_ME' | 'PUBLIC_CATALOG' =
    pathname === '/shared' ? 'SHARED_WITH_ME' : pathname === '/public' ? 'PUBLIC_CATALOG' : 'MY_NOTES';

  const header = (
    <div className="flex items-center justify-between gap-3 border-b border-border/80 bg-background/95 px-4 py-2.5 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground shadow-md">
          <FolderGit2 className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">MFC Noted</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">:4203</span>
          </div>
          <p className="text-[10px] text-muted-foreground hidden sm:block">Catatan Turunan &bull; Hierarchical Project Breakdown</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-2 text-[11px] bg-muted/40 border border-border/60 px-2.5 py-1 rounded-lg font-mono">
          <span className="text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3" /> Status:</span>
          <span className={`inline-flex items-center gap-1 font-semibold ${authApiStatus === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`} title="Auth API (Port 3001)">
            <span className={`h-1.5 w-1.5 rounded-full ${authApiStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} /> Auth:3001
          </span>
          <span className="text-muted-foreground/40">&bull;</span>
          <span className={`inline-flex items-center gap-1 font-semibold ${notesApiStatus === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`} title="Notes API (Port 3002)">
            <span className={`h-1.5 w-1.5 rounded-full ${notesApiStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} /> Notes:3002
          </span>
        </div>

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
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border/80 bg-card p-3 shadow-xl z-50" onClick={() => setIsAppMenuOpen(false)}>
              <p className="text-[11px] font-bold text-muted-foreground px-1 py-1 uppercase tracking-wider">Ekosistem Micro Frontend</p>
              <div className="grid grid-cols-1 gap-1.5 mt-2">
                <a href="http://localhost:4200/" className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:bg-muted/60 text-xs"><span className="font-semibold text-primary">Portal Jasa</span><span className="text-[10px] text-muted-foreground font-mono">:4200</span></a>
                <a href="http://localhost:4201/" className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:bg-muted/60 text-xs"><span className="font-semibold text-indigo-500">Component UI</span><span className="text-[10px] text-muted-foreground font-mono">:4201</span></a>
                <a href="http://localhost:4202/" className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:bg-muted/60 text-xs"><span className="font-semibold text-emerald-500">User Mgmt</span><span className="text-[10px] text-muted-foreground font-mono">:4202</span></a>
                <a href="http://localhost:4200/apps" className="flex items-center gap-1.5 p-2 rounded-lg border border-border/60 hover:bg-muted/60 text-xs text-muted-foreground"><ExternalLink className="h-3 w-3" /> Kembali ke Portal</a>
              </div>
            </div>
          )}
        </div>

        {session ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-foreground leading-tight">{session.name}</span>
              <span className="text-[10px] text-muted-foreground">{session.role}</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="h-8 text-xs gap-1 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 cursor-pointer" title="Keluar dari sesi">
              <LogOut className="h-3.5 w-3.5" /><span className="hidden md:inline">Keluar</span>
            </Button>
          </div>
        ) : (
          <span className="text-[11px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-1 rounded-md font-medium">Mode Bypass</span>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (isMetricsRoute) {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2"><BarChart3 className="h-6 w-6 text-indigo-500" /> Dashboard Metrik & Serapan Proyek</h2>
            <p className="text-xs text-muted-foreground mt-1">Ikhtisar capaian progres, total penganggaran kuantitatif, dan status tugas hierarki.</p>
          </div>
          {metrics ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total Seluruh Catatan</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-foreground">{metrics.totalNotes} item</div>
                  <p className="text-[11px] text-muted-foreground mt-1">{metrics.rootCount} Induk &bull; {metrics.subCount} Sub-Tingkat</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Rata-Rata Progres</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-primary">{metrics.averageProgress}%</div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden"><div className="bg-primary h-full rounded-full transition-all" style={{ width: `${metrics.averageProgress}%` }} /></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Pagu Anggaran Induk</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">Rp {Number(metrics.totalBudget).toLocaleString('id-ID')}</div>
                  <p className="text-[11px] text-muted-foreground mt-1">Realisasi: Rp {Number(metrics.totalRealized).toLocaleString('id-ID')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Status Pekerjaan</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600">{metrics.completedCount} Selesai</span>
                    <span className="text-muted-foreground/40">&bull;</span>
                    <span className="text-xs font-bold text-amber-500">{metrics.inProgressCount} Proses</span>
                  </div>
                  {metrics.overdueCount > 0 ? <p className="text-[11px] text-rose-500 font-semibold mt-1">{metrics.overdueCount} tugas melewati deadline!</p> : <p className="text-[11px] text-emerald-600 mt-1">Seluruh jadwal tepat waktu</p>}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">Memuat ringkasan data metrik...</div>
          )}
        </div>
      );
    }

    if (isInfoRoute) {
      return (
        <div className="space-y-8 max-w-4xl">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">M Software Center (MFC)</span>
            <h2 className="text-2xl font-black text-foreground tracking-tight mt-1 flex items-center gap-2"><BookOpen className="h-6 w-6 text-emerald-500" /> 4 Points For Building A Data Set &amp; 5 Stages Information</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Konsep dasar di balik sistem Catatan Turunan (Derivative Notes): menyusun dataset terstruktur untuk menghasilkan informasi akurat penentu keputusan.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
              <span className="text-xs font-bold text-primary font-mono">Pilar 01</span>
              <h4 className="font-bold text-base text-foreground">Catatan (Ide Pokok)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Mengidentifikasi judul, nama, atau ide dari sebuah kegiatan kerja. Data awal yang diperlukan adalah Judul kegiatan dan deskripsi ringkas.</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
              <span className="text-xs font-bold text-indigo-500 font-mono">Pilar 02</span>
              <h4 className="font-bold text-base text-foreground">File & Dokumentasi</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">File berupa dokumen PDF yang menampung panduan lengkap serta dokumentasi gambar sebagai bukti dukung pelaksanaan kegiatan nyata.</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
              <span className="text-xs font-bold text-emerald-500 font-mono">Pilar 03</span>
              <h4 className="font-bold text-base text-foreground">Values (Nilai Kuantitatif)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Nilai target dan realisasi anggaran yang dikelola untuk menghasilkan informasi akurat bagi pimpinan.</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
              <span className="text-xs font-bold text-amber-500 font-mono">Pilar 04</span>
              <h4 className="font-bold text-base text-foreground">Sub Judul (Dekomposisi)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Turunan dari induk judul yang menjelaskan tahapan atau rincian spesifik untuk meningkatkan akurasi data.</p>
            </div>
          </div>
        </div>
      );
    }

    if (isFormsCatalogRoute) return <RemoteNotedFormsCatalogPage apiBaseUrl={API_BASE} onNavigate={navigate} />;
    if (isDatasetRoute) return <RemoteNotedDatasetPage apiBaseUrl={API_BASE} onNavigate={navigate} />;
    if (isFriendsRoute) return <RemoteFriendsHubPage apiBaseUrl={API_BASE} onNavigate={navigate} />;
    if (isDocumentsRoute) {
      return <RemoteNotedDocumentsPage kdJudul={new URLSearchParams(location.search).get('kdJudul') || undefined} apiBaseUrl={API_BASE} onNavigate={navigate} />;
    }
    if (responsesMatch) {
      return <RemoteNotedFormResponsesPage kdJudul={safeDecode(responsesMatch[1])} formId={safeDecode(responsesMatch[2])} apiBaseUrl={API_BASE} onNavigate={navigate} />;
    }
    if (formsMatch) {
      return <RemoteNotedFormsPage kdJudul={safeDecode(formsMatch[1])} apiBaseUrl={API_BASE} onNavigate={navigate} />;
    }
    return (
      <RemoteNotedView
        apiBaseUrl={API_BASE}
        onNavigate={navigate}
        initialTab={notedInitialTab}
        activeTab={notedInitialTab}
        showInternalTabs={false}
      />
    );
  };

  return (
    <DashShell
      menu={notedMenu}
      header={header}
      footer={<DashFooter brand="MFC Noted (Standalone Host)" />}
      hoverOpen
    >
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6">
        <CompUIBoundary>{renderContent()}</CompUIBoundary>
      </div>
    </DashShell>
  );
}

export default App;
