import React, { useState, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Building2,
  FileText,
  Headphones,
  Globe2,
  Sparkles,
  KeyRound,
  AlertTriangle,
  Loader2,
  Check,
  Info,
  Wifi,
  WifiOff,
  LogOut,
} from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@org/ui';
import {
  authStore,
  useAuth,
  isCustomerRole,
  generateRequestId,
} from '../auth/auth-store';

export function getApiBaseUrl(): string {
  const raw = (
    ((import.meta.env as any)?.VITE_API_URL as string | undefined) ||
    'http://localhost:3001/api'
  )
    .trim()
    .replace(/\/+$/, '');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

// Kredensial nyata yang ter-seed di database MySQL (apps/api/prisma/seed.ts) untuk mempercepat QA form
const SEED_TEST_ACCOUNTS = [
  {
    role: 'Super Admin',
    email: 'admin@bgs-software.id',
    password: 'Password123!',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800',
  },
  {
    role: 'Technical PM',
    email: 'sarah.j@bgs-software.id',
    password: 'Password123!',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:text-indigo-400 dark:border-indigo-800',
  },
  {
    role: 'Customer',
    email: 'it-lead@acme-corp.com',
    password: 'Password123!',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800',
  },
  {
    role: 'Akun Nonaktif',
    email: 'inactive@bgs-software.id',
    password: 'Password123!',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800',
  },
  {
    role: 'Akun Terkunci',
    email: 'locked@bgs-software.id',
    password: 'Password123!',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-200 dark:text-rose-400 dark:border-rose-800',
  },
];

type NotificationType = 'error' | 'warning' | 'info' | 'success';

interface NotificationState {
  type: NotificationType;
  title: string;
  message: string;
  actionLabel?: string;
  actionTo?: string;
}

function sanitizeRedirectTarget(rawTarget: string | null): string | null {
  if (!rawTarget) return null;
  try {
    const decoded = decodeURIComponent(rawTarget).trim();
    // Hanya izinkan internal relative path untuk mencegah Open Redirect
    if (decoded.startsWith('/') && !decoded.startsWith('//')) {
      return decoded;
    }
  } catch {
    // Abaikan jika gagal decode URI
  }
  return null;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isAuthenticated, isDevBypass, logout, setDevBypass } = useAuth();

  // Multi-Language State (ID | EN)
  const [lang, setLang] = useState<'ID' | 'EN'>('ID');

  // Form State
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Live Backend API Connectivity Status
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Request Access Modal State
  const [isRequestAccessOpen, setIsRequestAccessOpen] = useState(false);
  const [requestFullName, setRequestFullName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestOrg, setRequestOrg] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  // SSO & MFA Info Modal State
  const [ssoInfoProvider, setSsoInfoProvider] = useState<string | null>(null);

  // Cek kesehatan koneksi API Backend saat halaman dimuat
  const checkApiHealth = async () => {
    setApiStatus('checking');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      setApiStatus(res.ok ? 'online' : 'offline');
    } catch {
      setApiStatus('offline');
    } finally {
      clearTimeout(timer);
    }
  };

  useEffect(() => {
    checkApiHealth();

    if (typeof window === 'undefined' || import.meta.env?.MODE === 'test') {
      return;
    }

    const handleFocus = () => {
      checkApiHealth();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Auto-recheck ringan jika API masih booting (misal saat menjalankan npm run dev:all)
  useEffect(() => {
    if (apiStatus !== 'offline' || import.meta.env?.MODE === 'test') return;
    const retryTimer = setTimeout(() => {
      checkApiHealth();
    }, 4000);
    return () => clearTimeout(retryTimer);
  }, [apiStatus]);

  // Baca query parameter untuk pesan konteks autentikasi
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reason = params.get('reason');

    if (reason === 'session_expired') {
      setNotification({
        type: 'warning',
        title: lang === 'ID' ? 'Sesi Berakhir' : 'Session Expired',
        message:
          lang === 'ID'
            ? 'Sesi Anda telah berakhir. Silakan login kembali.'
            : 'Your session has expired. Please log in again.',
      });
    } else if (reason === 'auth_required') {
      setNotification({
        type: 'info',
        title: lang === 'ID' ? 'Autentikasi Diperlukan' : 'Authentication Required',
        message:
          lang === 'ID'
            ? 'Silakan masuk terlebih dahulu untuk mengakses halaman tersebut.'
            : 'Please sign in first to access the requested page.',
      });
    } else if (reason === 'access_denied') {
      setNotification({
        type: 'error',
        title: lang === 'ID' ? 'Akses Ditolak' : 'Access Denied',
        message:
          lang === 'ID'
            ? 'Anda tidak memiliki hak akses ke halaman ini.'
            : 'You do not have access rights to this page.',
      });
    } else if (reason === 'logged_out') {
      setNotification({
        type: 'info',
        title: lang === 'ID' ? 'Berhasil Keluar' : 'Signed Out',
        message:
          lang === 'ID'
            ? 'Anda telah keluar dari sistem. Terima kasih telah menggunakan layanan MFC.'
            : 'You have been signed out safely.',
      });
    }
  }, [location.search, lang]);

  // Deteksi Caps Lock secara real-time
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  // Submit Handler Login (Strict Backend Authentication)
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setNotification(null);
    const nextFieldErrors: { email?: string; password?: string } = {};
    const trimmedIdentifier = emailOrUsername.trim();

    if (!trimmedIdentifier) {
      nextFieldErrors.email =
        lang === 'ID' ? 'Email atau username wajib diisi.' : 'Email or username is required.';
    }
    if (!password) {
      nextFieldErrors.password =
        lang === 'ID' ? 'Password wajib diisi.' : 'Password is required.';
    }

    if (nextFieldErrors.email || nextFieldErrors.password) {
      setFieldErrors(nextFieldErrors);
      setNotification({
        type: 'error',
        title: lang === 'ID' ? 'Data Login Belum Lengkap' : 'Incomplete Credentials',
        message:
          nextFieldErrors.email ||
          nextFieldErrors.password ||
          (lang === 'ID' ? 'Mohon lengkapi email dan password.' : 'Please enter your credentials.'),
      });
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const loginUrl = `${getApiBaseUrl()}/auth/login`;

    try {
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Request-ID': generateRequestId(),
        },
        body: JSON.stringify({
          emailOrUsername: trimmedIdentifier,
          password,
          rememberMe,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Server berhasil merespons (API Online)
      setApiStatus('online');
      const payload = await res.json().catch(() => null);

      if (res.ok && payload?.user && payload?.accessToken) {
        if (payload.refreshToken && typeof window !== 'undefined') {
          window.localStorage.setItem('mfc_auth_refresh_token', payload.refreshToken);
        }

        authStore.setSession(
          {
            id: payload.user.id,
            username: payload.user.username,
            name: payload.user.name,
            email: payload.user.email,
            role: payload.user.role,
            permissions: payload.user.permissions,
            token: payload.accessToken,
            refreshToken: payload.refreshToken,
            avatarUrl: payload.user.avatarUrl,
          },
          rememberMe
        );

        setNotification({
          type: 'success',
          title: lang === 'ID' ? 'Autentikasi Berhasil' : 'Authentication Successful',
          message:
            lang === 'ID'
              ? `Selamat datang kembali, ${payload.user.name}. Mengalihkan ke workspace...`
              : `Welcome back, ${payload.user.name}. Redirecting to workspace...`,
        });

        setIsLoading(false);

        const params = new URLSearchParams(location.search);
        const redirectTarget = sanitizeRedirectTarget(params.get('redirect'));
        if (redirectTarget) {
          navigate(redirectTarget, { replace: true });
        } else if (isCustomerRole(payload.user.role)) {
          navigate('/customer-portal', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
        return;
      }

      // Penanganan respons error HTTP spesifik dari Backend API
      setIsLoading(false);
      const rawServerMsg = Array.isArray(payload?.message)
        ? payload.message.join(', ')
        : payload?.message;

      if (res.status === 401) {
        setNotification({
          type: 'error',
          title: lang === 'ID' ? 'Kredensial Tidak Valid' : 'Invalid Credentials',
          message:
            rawServerMsg ||
            (lang === 'ID' ? 'Email atau password tidak valid.' : 'Invalid email or password.'),
        });
      } else if (res.status === 403) {
        const isDisabled =
          typeof rawServerMsg === 'string' &&
          (rawServerMsg.toLowerCase().includes('nonaktif') ||
            rawServerMsg.toLowerCase().includes('disabled'));

        setNotification({
          type: 'error',
          title: isDisabled
            ? lang === 'ID'
              ? 'Akun Dinonaktifkan'
              : 'Account Disabled'
            : lang === 'ID'
              ? 'Akses Akun Dibatasi'
              : 'Account Restricted',
          message:
            rawServerMsg ||
            (lang === 'ID'
              ? 'Akun Anda tidak diizinkan mengakses sistem saat ini.'
              : 'Your account is currently restricted.'),
          actionLabel: isDisabled
            ? lang === 'ID'
              ? 'Lihat Info Pemulihan Akun'
              : 'View Account Recovery Info'
            : undefined,
          actionTo: isDisabled ? '/account-disabled' : undefined,
        });
      } else if (res.status === 404) {
        setNotification({
          type: 'error',
          title: lang === 'ID' ? 'Endpoint Autentikasi Tidak Ditemukan' : 'Auth Endpoint Not Found',
          message:
            lang === 'ID'
              ? `Layanan login tidak ditemukan di server (${loginUrl}). Pastikan service Backend API versi terbaru sedang berjalan.`
              : `Login endpoint not found (${loginUrl}). Ensure the latest Backend API service is running.`,
        });
      } else if (res.status === 503) {
        setNotification({
          type: 'error',
          title: lang === 'ID' ? 'Database Tidak Terhubung' : 'Database Unavailable',
          message:
            rawServerMsg ||
            (lang === 'ID'
              ? 'Server database sedang tidak tersedia. Pastikan layanan MySQL berjalan.'
              : 'Authentication database is currently unavailable.'),
        });
      } else {
        setNotification({
          type: 'error',
          title: lang === 'ID' ? `Gangguan Server (${res.status})` : `Server Error (${res.status})`,
          message:
            rawServerMsg ||
            (lang === 'ID'
              ? 'Terjadi gangguan sistem. Silakan coba beberapa saat lagi.'
              : 'System error occurred. Please try again shortly.'),
        });
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setApiStatus('offline');

      const isTimeout = err instanceof DOMException && err.name === 'AbortError';
      setNotification({
        type: 'error',
        title: isTimeout
          ? lang === 'ID'
            ? 'Timeout Koneksi Server'
            : 'Server Connection Timeout'
          : lang === 'ID'
            ? 'Koneksi ke Server Gagal'
            : 'Server Connection Failed',
        message: isTimeout
          ? lang === 'ID'
            ? 'Server autentikasi membutuhkan waktu terlalu lama untuk merespons. Periksa layanan Backend API dan coba lagi.'
            : 'Authentication server timed out. Please check the Backend API service and retry.'
          : lang === 'ID'
            ? 'Tidak dapat terhubung ke server autentikasi. Pastikan Backend API sedang berjalan sebelum login.'
            : 'Cannot connect to authentication server. Ensure Backend API is running before signing in.',
      });
    }
  };

  // Handler Request Access Submit
  const handleRequestAccessSubmit = (e: FormEvent) => {
    e.preventDefault();
    setRequestSuccess(true);
    setTimeout(() => {
      setRequestSuccess(false);
      setIsRequestAccessOpen(false);
      setRequestFullName('');
      setRequestEmail('');
      setRequestOrg('');
    }, 2000);
  };

  // Quick Account Autofill Helper
  const handleQuickFill = (acc: (typeof SEED_TEST_ACCOUNTS)[0]) => {
    setEmailOrUsername(acc.email);
    setPassword(acc.password);
    setFieldErrors({});
    setNotification({
      type: 'info',
      title: lang === 'ID' ? `Formulir Diisi (${acc.role})` : `Form Pre-filled (${acc.role})`,
      message:
        lang === 'ID'
          ? `Kredensial ${acc.email} siap diuji. Tekan tombol "Masuk" untuk memverifikasi via Backend API.`
          : `Credentials for ${acc.email} loaded. Click "Sign In" to verify against Backend API.`,
    });
  };

  const handleContinueDashboard = () => {
    const params = new URLSearchParams(location.search);
    const redirectTarget = sanitizeRedirectTarget(params.get('redirect'));
    if (redirectTarget) {
      navigate(redirectTarget, { replace: true });
    } else if (isCustomerRole(session?.role)) {
      navigate('/customer-portal', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const notificationStyles: Record<NotificationType, string> = {
    error:
      'border-rose-200 bg-rose-50/90 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900/70 dark:text-rose-200',
    warning:
      'border-amber-200 bg-amber-50/90 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/70 dark:text-amber-200',
    info:
      'border-blue-200 bg-blue-50/90 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900/70 dark:text-blue-200',
    success:
      'border-emerald-200 bg-emerald-50/90 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900/70 dark:text-emerald-200',
  };

  const notificationIcon: Record<NotificationType, React.ReactNode> = {
    error: <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
    info: <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground antialiased selection:bg-blue-600 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. LEFT SECTION (BRANDING, VALUE PROPOSITION, & TRUST INDICATORS)         */}
      {/* ========================================================================= */}
      <div className="relative w-full lg:w-[48%] xl:w-[50%] bg-slate-950 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden">
        {/* Decorative Modern Background Gradient & Tech Grid */}
        <div className="absolute inset-0 bg-radial from-blue-600/20 via-transparent to-transparent -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-radial from-sky-400/10 via-transparent to-transparent -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        {/* Top Header / MFC Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white font-black text-xl shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30 transition-transform group-hover:scale-105">
              <img src="mfc/android-chrome-192x192.png" alt="MFC Logo" className="h-10 w-10 rounded-full object-cover" />
            </div>
            <div className="pr-4">
              <div className="flex justify-between font-bold text-lg text-light leading-none ">
                {"MFC".split("").map((char, index) => (
                  <span key={index}>{char}</span>
                ))}
            </div>
              <div className="text-[10px] text-justify text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
                M Software Center
              </div>
            </div>
          </Link>
        </div>

        {/* Center Content: Headline, Description & Trust Indicators */}
        <div className="relative z-10 my-4 lg:my-auto space-y-8 max-w-xl">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-sky-400 border-blue-400/30 text-xs py-1 px-3 rounded-full font-medium inline-flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              Trusted Partner for Digital Transformation
            </Badge>

            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-white leading-tight">
              Build Better Software.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                Accelerate Your Business.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              MFC membantu perusahaan, organisasi, UMKM, institusi pendidikan, dan sektor industri
              dalam membangun solusi digital melalui pengembangan aplikasi web, aplikasi mobile,
              pelatihan teknologi, serta konsultasi IT.
            </p>
          </div>

          {/* 5 Keunggulan & Trust Indicators */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Standar Keamanan & Keunggulan Enterprise:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 backdrop-blur-xs">
                <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" />
                <span className="font-semibold text-slate-200">Secure Authentication</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 backdrop-blur-xs">
                <KeyRound className="h-4 w-4 text-blue-400 shrink-0" />
                <span className="font-semibold text-slate-200">Role Based Access (RBAC)</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 backdrop-blur-xs">
                <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">Activity Audit Logging</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 backdrop-blur-xs">
                <Building2 className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="font-semibold text-slate-200">Enterprise Ready Solutions</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 backdrop-blur-xs sm:col-span-2">
                <Headphones className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-slate-200">
                  Technology Consulting & 24/7 Dedicated Support
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Left / Tagline Footer */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            <span className="font-semibold text-slate-300">MFC Cloud Auth</span> &bull; Multi-Tenant Architecture
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <span
              className={`h-2 w-2 rounded-full inline-block ${
                apiStatus === 'online'
                  ? 'bg-emerald-400 animate-pulse'
                  : apiStatus === 'offline'
                    ? 'bg-rose-400'
                    : 'bg-amber-400 animate-pulse'
              }`}
            />
            {apiStatus === 'online'
              ? 'Auth API Online'
              : apiStatus === 'offline'
                ? 'Auth API Offline'
                : 'Checking API...'}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RIGHT SECTION (AUTHENTICATION FORM & ACCESS CONTROL)                   */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[52%] xl:w-[50%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-background">
        {/* Top Bar: Language Switcher & Back to Website */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            &larr; {lang === 'ID' ? 'Kembali ke Halaman Publik' : 'Back to Public Site'}
          </Link>

          {/* Language Switcher (ID | EN) */}
          <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setLang('ID')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                lang === 'ID'
                  ? 'bg-background text-foreground shadow-2xs font-extrabold text-blue-600 dark:text-blue-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ID
            </button>
            <span className="text-muted-foreground/40 px-0.5">|</span>
            <button
              type="button"
              onClick={() => setLang('EN')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                lang === 'EN'
                  ? 'bg-background text-foreground shadow-2xs font-extrabold text-blue-600 dark:text-blue-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Center: Login Form Card */}
        <div className="mx-auto w-full max-w-md py-8 space-y-5">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {lang === 'ID' ? 'Masuk ke Sistem' : 'Sign in to your account'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {lang === 'ID'
                ? 'Pintu masuk ke aplikasi dan dashboard internal MFC.'
                : 'Authentication gateway to MFC internal apps and digital services.'}
            </p>
          </div>

          {/* Banner Dev Bypass Mode Aktif */}
          {isDevBypass && (
            <div
              data-testid="login-bypass-banner"
              className="rounded-xl border border-amber-300/70 bg-amber-50/90 dark:bg-amber-950/30 dark:border-amber-800 p-3.5 text-xs space-y-2"
            >
              <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Mode Dev Bypass Aktif (userbypass=true)
                </span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Anda dapat langsung mengakses seluruh rute dashboard tanpa login, atau tetap menguji login Backend API melalui formulir di bawah.
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleContinueDashboard}
                  className="h-7 text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg gap-1"
                >
                  Masuk Langsung ke Dashboard <ArrowRight className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDevBypass(false)}
                  className="h-7 text-[11px] font-semibold border-amber-300 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg"
                >
                  Matikan Bypass
                </Button>
              </div>
            </div>
          )}

          {/* Banner Sudah Login (Real Session) */}
          {!isDevBypass && isAuthenticated && session && (
            <div
              data-testid="login-active-session-banner"
              className="rounded-xl border border-emerald-200 bg-emerald-50/90 dark:bg-emerald-950/30 dark:border-emerald-900/70 p-3.5 text-xs space-y-2"
            >
              <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {lang === 'ID' ? 'Sesi Aktif Ditemukan' : 'Active Session Detected'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                {lang === 'ID' ? 'Anda sudah masuk sebagai' : 'Currently signed in as'}{' '}
                <strong>{session.name}</strong> ({session.role}).
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleContinueDashboard}
                  className="h-7 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1"
                >
                  Lanjut ke Dashboard <ArrowRight className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => logout()}
                  className="h-7 text-[11px] font-semibold border-emerald-300 text-emerald-900 dark:text-emerald-200 rounded-lg gap-1"
                >
                  <LogOut className="h-3 w-3" /> Keluar
                </Button>
              </div>
            </div>
          )}

          {/* Unified Notification Alert Display (Error / Warning / Info / Success) */}
          {notification && (
            <div
              role="alert"
              aria-live="polite"
              data-testid={
                notification.type === 'error' || notification.type === 'warning'
                  ? 'login-error-alert'
                  : 'login-notification'
              }
              className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs animate-in fade-in ${
                notificationStyles[notification.type]
              }`}
            >
              {notificationIcon[notification.type]}
              <div className="flex-1 space-y-1">
                <div className="font-bold leading-none">{notification.title}</div>
                <div className="font-medium leading-relaxed opacity-90">{notification.message}</div>
                {notification.actionLabel && notification.actionTo && (
                  <div className="pt-1">
                    <Link
                      to={notification.actionTo}
                      className="inline-flex items-center gap-1 font-bold underline hover:opacity-80"
                    >
                      {notification.actionLabel} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Login (noValidate agar error validation selalu muncul melalui Alert UI React) */}
          <form noValidate onSubmit={handleLogin} className="space-y-4">
            {/* Field 1: Email / Username */}
            <div className="space-y-1.5">
              <label
                htmlFor="emailOrUsername"
                className="text-xs font-semibold text-foreground flex items-center justify-between"
              >
                <span>{lang === 'ID' ? 'Email / Username' : 'Email or Username'}</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="emailOrUsername"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="admin@bgs-software.id atau username"
                  value={emailOrUsername}
                  onChange={(e) => {
                    setEmailOrUsername(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  aria-invalid={!!fieldErrors.email}
                  className={`pl-9 h-10 text-xs rounded-xl ${
                    fieldErrors.email ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Field 2: Password with CapsLock Indicator & Show/Hide */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-500 hover:underline transition-colors"
                >
                  {lang === 'ID' ? 'Lupa Password?' : 'Forgot Password?'}
                </Link>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  aria-invalid={!!fieldErrors.password}
                  className={`pl-9 pr-10 h-10 text-xs rounded-xl font-mono ${
                    fieldErrors.password ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                  {fieldErrors.password}
                </p>
              )}

              {/* Caps Lock Indicator Alert */}
              {isCapsLockOn && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 animate-in fade-in pt-0.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Caps Lock Aktif</span>
                </div>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 rounded-sm"
                />
                <span className="text-xs text-muted-foreground">
                  {lang === 'ID' ? 'Ingat Saya (Remember Me)' : 'Remember Me (7 days)'}
                </span>
              </label>
            </div>

            {/* Login Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 rounded-xl transition-all gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{lang === 'ID' ? '[ Memproses... ]' : '[ Loading... ]'}</span>
                </>
              ) : (
                <>
                  <span>{lang === 'ID' ? 'Masuk' : 'Sign In'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* ===================================================================== */}
          {/* SSO & SOCIAL LOGIN SECTION (DEVELOPER PREVIEW ONLY)                   */}
          {/* ===================================================================== */}
          {isDevBypass && (
            <div className="space-y-3 pt-1">
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-border/80" />
                <span className="bg-background px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground relative">
                  {lang === 'ID' ? 'atau masuk melalui SSO (Dev Preview)' : 'or enterprise SSO (Dev Preview)'}
                </span>
              </div>

              {/* Provider Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSsoInfoProvider('Microsoft Entra ID')}
                  className="h-9 text-xs rounded-xl gap-1.5 font-medium border-border/70"
                  title="Single Sign-On dengan Microsoft Entra ID"
                >
                  <span className="h-3.5 w-3.5 rounded-xs bg-[#00A4EF] flex items-center justify-center text-[9px] text-white font-bold">
                    M
                  </span>
                  <span className="truncate">Microsoft</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSsoInfoProvider('Google Workspace')}
                  className="h-9 text-xs rounded-xl gap-1.5 font-medium border-border/70"
                  title="Single Sign-On dengan Google Workspace"
                >
                  <span className="h-3.5 w-3.5 rounded-full bg-rose-500 flex items-center justify-center text-[9px] text-white font-bold">
                    G
                  </span>
                  <span className="truncate">Google</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSsoInfoProvider('GitHub Enterprise')}
                  className="h-9 text-xs rounded-xl gap-1.5 font-medium border-border/70"
                  title="Single Sign-On dengan GitHub Enterprise"
                >
                  <span className="h-3.5 w-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold">
                    🐙
                  </span>
                  <span className="truncate">GitHub</span>
                </Button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setSsoInfoProvider('SAML 2.0 / OIDC')}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline transition-colors inline-flex items-center gap-1"
                >
                  <Globe2 className="h-3 w-3" />
                  Mendukung SAML 2.0 & OpenID Connect (OIDC)
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* QUICK FILL SEED ACCOUNTS (DEVELOPMENT TESTING TOOL - HANYA DI DEV)    */}
          {/* ===================================================================== */}
          {isDevBypass && (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                <span className="uppercase tracking-wider">Uji Akun Database (Quick Fill):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SEED_TEST_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickFill(acc)}
                    className={`text-[10px] font-medium px-2 py-1 rounded-lg border transition-all hover:opacity-80 cursor-pointer ${acc.badgeColor}`}
                  >
                    {acc.role}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* ACCESS REQUEST SECTION                                                */}
          {/* ===================================================================== */}
          <div className="rounded-xl border border-border/70 bg-gradient-to-r from-card to-muted/30 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground">
                {lang === 'ID' ? 'Belum memiliki akun?' : 'Need system access?'}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {lang === 'ID'
                  ? 'Hubungi Administrator atau Tim MFC untuk memperoleh akses sistem.'
                  : 'Contact administrator to request an internal account.'}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRequestAccessOpen(true)}
              className="text-xs font-semibold rounded-lg shrink-0 border-blue-500/30 text-blue-600 hover:bg-blue-50"
            >
              Request Access
            </Button>
          </div>
        </div>

        {/* Bottom Area: Environment Badge, Legal, & Footer */}
        <div className="space-y-4 pt-6 border-t border-border/60 text-center">
          {/* Environment & Runtime Status Information Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {isDevBypass && (
              <>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold py-0.5 px-2.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  [ DEVELOPMENT ENVIRONMENT ]
                </span>

                <span
                  data-testid="status-bypass-pill"
                  className="inline-flex items-center gap-1 font-mono text-[10px] font-bold py-0.5 px-2.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800"
                >
                  [ DEV BYPASS: ON ]
                </span>
              </>
            )}

            <button
              type="button"
              onClick={checkApiHealth}
              title="Klik untuk memeriksa status Backend API"
              data-testid="status-api-pill"
              className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold py-0.5 px-2.5 rounded-full border cursor-pointer transition-opacity hover:opacity-80 ${
                apiStatus === 'online'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                  : apiStatus === 'offline'
                    ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              {apiStatus === 'online' ? (
                <Wifi className="h-3 w-3" />
              ) : apiStatus === 'offline' ? (
                <WifiOff className="h-3 w-3" />
              ) : (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              [ API: {apiStatus.toUpperCase()} ]
            </button>
          </div>

          {/* Legal & Compliance Notice */}
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-md mx-auto">
            {lang === 'ID'
              ? 'Dengan masuk ke sistem, pengguna dianggap menyetujui:'
              : 'By signing in, you agree to our:'}{' '}
            <Link to="/privacy-policy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            ,{' '}
            <Link to="/terms-of-service" className="underline hover:text-foreground">
              Terms of Service
            </Link>
            , dan{' '}
            <Link to="/security-policy" className="underline hover:text-foreground">
              Security Policy
            </Link>
            .
          </p>

          {/* Footer Copyright */}
          <div className="text-xs text-muted-foreground font-medium">
            &copy; 2026 MFC Solutions. All Rights Reserved.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL REQUEST ACCESS                                                   */}
      {/* ========================================================================= */}
      <Dialog open={isRequestAccessOpen} onOpenChange={setIsRequestAccessOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-foreground">
              <Building2 className="h-5 w-5 text-blue-600" />
              Permohonan Akses Sistem (Request Access)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Kirimkan formulir permohonan akun ke Administrator MFC untuk verifikasi wewenang.
            </DialogDescription>
          </DialogHeader>

          {requestSuccess ? (
            <div className="py-6 text-center space-y-2">
              <div className="h-10 w-10 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Check className="h-5 w-5" />
              </div>
              <div className="text-sm font-bold text-foreground">Permohonan Terkirim!</div>
              <p className="text-xs text-muted-foreground">
                Administrator akan meninjau dan mengirimkan kredensial ke email Anda dalam 1x24 jam.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRequestAccessSubmit} className="space-y-3 py-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Nama Lengkap</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={requestFullName}
                  onChange={(e) => setRequestFullName(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Email Perusahaan / Institusi</label>
                <Input
                  type="email"
                  placeholder="john.doe@company.com"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Nama Instansi / Perusahaan</label>
                <Input
                  type="text"
                  placeholder="PT Solusi Digital Terpadu"
                  value={requestOrg}
                  onChange={(e) => setRequestOrg(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRequestAccessOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Kirim Permohonan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 4. MODAL SSO & MFA ARCHITECTURE PREVIEW                                   */}
      {/* ========================================================================= */}
      {ssoInfoProvider && (
        <Dialog open={!!ssoInfoProvider} onOpenChange={() => setSsoInfoProvider(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base text-foreground">
                <Globe2 className="h-5 w-5 text-blue-600" />
                Single Sign-On (SSO): {ssoInfoProvider}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Integrasi Autentikasi Terpusat Enterprise Ready.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 text-foreground space-y-1.5">
                <div className="font-semibold text-blue-700 dark:text-blue-300">
                  Status: Siap Diaktifkan (Future Ready)
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Arsitektur MFC mendukung federasi identitas menggunakan protokol standar industri:
                  OAuth 2.0, OpenID Connect (OIDC), dan SAML 2.0.
                </p>
              </div>

              <div className="space-y-1.5 text-muted-foreground">
                <div className="font-semibold text-foreground">Dukungan Multi-Factor Authentication (MFA):</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-2 rounded border bg-muted/20">&bull; Microsoft Authenticator</div>
                  <div className="p-2 rounded border bg-muted/20">&bull; Google Authenticator</div>
                  <div className="p-2 rounded border bg-muted/20">&bull; Email OTP Verification</div>
                  <div className="p-2 rounded border bg-muted/20">&bull; Hardware Security Key</div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSsoInfoProvider(null)}
                className="text-xs"
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default LoginPage;
