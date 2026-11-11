import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Zap,
  Layers,
  ShieldCheck,
  Sparkles,
  Palette,
  Server,
  CheckCircle2,
  ExternalLink,
  Laptop,
  Flame,
  Award,
  ChevronRight,
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@org/ui';

export function LandingPage() {
  const brandName = import.meta.env.VITE_BRAND_NAME || 'BGS Platform';

  return (
    <div className="space-y-16 py-6 md:py-12">
      {/* 1. TOP PROMO BANNER (IKLAN UTAMA) */}
      <section id="promo" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary via-indigo-600 to-purple-600 p-6 md:p-8 text-white shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
                <Flame className="h-4 w-4 text-amber-300" />
                <span>PROMO EKSKLUSIF PELUNCURAN</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                Diskon 30% Akselerasi Migrasi Micro Front End Enterprise
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Migrasikan aplikasi monolitik Anda ke arsitektur Micro Front End berbasis Vite & Module Federation. Konsultasi dan audit performa gratis untuk 10 pendaftar pertama!
              </p>
            </div>
            <div className="flex shrink-0 flex-col sm:flex-row items-center gap-3">
              <Button asChild variant="secondary" className="font-semibold shadow-md">
                <Link to="/compUI" className="gap-2">
                  <span>Klaim Promo Sekarang</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          {/* Subtle Decorative Background Glow */}
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* 2. HERO SECTION */}
      <section id="hero" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary shadow-xs">
          <Sparkles className="h-4 w-4" />
          <span>Next-Generation Micro Front End Platform</span>
        </div>

        <div className="mx-auto max-w-4xl space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Bangun Ekosistem Web Enterprise Tanpa Hambatan Monolitik
          </h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Pondasi Micro Front End modern dengan <strong>Module Federation ESM</strong>, <strong>Nx Workspace</strong>, dan <strong>Vite 8</strong>. Berdayakan tim independen merilis fitur lebih cepat, terisolasi, dan tanpa downtime.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Button asChild size="lg" className="w-full sm:w-auto text-base gap-2 px-8 shadow-lg">
            <Link to="/compUI">
              <span>Buka Dashboard Demo</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base gap-2 px-6">
            <Link to="/compUI/widgets">
              <span>Jelajahi Showcase Komponen</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Live Metrics Grid */}
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
          <div className="rounded-xl border bg-card p-4 text-center shadow-xs">
            <div className="text-3xl font-extrabold text-primary">10x</div>
            <div className="text-xs text-muted-foreground mt-1">Siklus Rilis Lebih Cepat</div>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center shadow-xs">
            <div className="text-3xl font-extrabold text-primary">&lt;50ms</div>
            <div className="text-xs text-muted-foreground mt-1">Runtime Chunk Load</div>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center shadow-xs">
            <div className="text-3xl font-extrabold text-primary">100%</div>
            <div className="text-xs text-muted-foreground mt-1">Isolasi Dependensi</div>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center shadow-xs">
            <div className="text-3xl font-extrabold text-primary">99.99%</div>
            <div className="text-xs text-muted-foreground mt-1">Uptime Shell Resilien</div>
          </div>
        </div>

        {/* Interactive Architecture Mockup */}
        <div className="mx-auto max-w-5xl rounded-2xl border bg-card/60 p-4 md:p-6 shadow-2xl backdrop-blur-xs text-left">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-muted-foreground">bgs-mfe-orchestrator.status</span>
            </div>
            <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs">
              All Systems Operational
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Portal Host (Shell)</span>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground font-mono">Port 4200 • @org/portal</p>
              <div className="text-[11px] text-muted-foreground">Dynamic Feature Menu & Auth Boundary</div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Remote Component UI</span>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground font-mono">Port 4201 • comp_ui</p>
              <div className="text-[11px] text-muted-foreground">Autonomous widgets, forms & data views</div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Shared UI Library</span>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground font-mono">@org/ui • Tailwind v4</p>
              <div className="text-[11px] text-muted-foreground">Tokens, Radix Primitives & Event Bus</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FITUR UNGGULAN & IKLAN PRODUK (CORE FEATURES) */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Fitur Utama Pondasi Micro Front End
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Dirancang dari awal untuk skalabilitas tim engineering besar tanpa mengorbankan performa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Vite 8 & ESM Native</CardTitle>
              <CardDescription>
                Hot Module Replacement instan dan performa build kilat dengan standar browser ESM terkini.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Layers className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Module Federation</CardTitle>
              <CardDescription>
                Deploy modul remote secara independen tanpa perlu me-rebuild atau me-restart host shell utama.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Resilient Fallback</CardTitle>
              <CardDescription>
                Error Boundary terisolasi dengan tombol retry otomatis jika remote server sedang offline.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Palette className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Tailwind v4 System</CardTitle>
              <CardDescription>
                Design system terstandarisasi dengan 30+ komponen accesible, tokens, dan dark-mode native.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* 4. DUAL BANNER IKLAN PROMOSI (PROMOTIONAL AD CARDS) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Iklan 1: Solusi Cloud */}
          <div className="rounded-2xl border bg-linear-to-br from-card to-muted p-6 md:p-8 space-y-4 shadow-sm">
            <Badge className="bg-primary/10 text-primary border-primary/20">Layanan Khusus</Badge>
            <h3 className="text-xl font-bold text-foreground">Paket Deployment & Hosting Multi-Cloud</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Dapatkan konfigurasi Docker, Kubernetes, dan CI/CD pipeline otomatis untuk mendistribusikan remote Micro Front End Anda ke AWS, GCP, atau Server Lokal dengan zero downtime.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground pt-1">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Caching global via CDN untuk remoteEntry.js</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Automated Canary Deployments</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Health Check & Observability Monitoring</li>
            </ul>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/compUI/data" className="gap-2">
                  <span>Lihat Spesifikasi Teknis</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Iklan 2: Design System Kit */}
          <div className="rounded-2xl border bg-linear-to-br from-card to-muted p-6 md:p-8 space-y-4 shadow-sm">
            <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">Resource Developer</Badge>
            <h3 className="text-xl font-bold text-foreground">BGS UI Kit v2: Komponen Siap Pakai</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tingkatkan produktivitas tim Anda dengan koleksi komponen UI enterprise: tabel data dengan paginasi, modal, formulir Zod, sheet drawer, hingga popover.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground pt-1">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 100% Type-Safe dengan TypeScript</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Standar Aksesibilitas WCAG WAI-ARIA</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Cross-MFE Event Bus Terintegrasi</li>
            </ul>
            <div className="pt-2">
              <Button asChild size="sm">
                <Link to="/compUI/forms" className="gap-2">
                  <span>Coba Playground Form & UI</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION BOTTOM (PENUTUP) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-card p-8 md:p-12 text-center space-y-6 shadow-md">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Siap Menjelajahi Platform Kami?
          </h2>
          <p className="mx-auto max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Akses dashboard live sekarang juga untuk melihat bagaimana modul host dan remote berinteraksi secara real-time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button asChild size="lg" className="w-full sm:w-auto text-base gap-2 px-8">
              <Link to="/compUI">
                <span>Masuk ke Dashboard Sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base">
              <Link to="/compUI/data">
                <span>Lihat Data & Metrik</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
