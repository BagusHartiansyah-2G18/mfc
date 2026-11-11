import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  Rocket,
  Smartphone,
  Layers,
  Cloud,
  Palette,
  Bot,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Flame,
  Star,
  Users,
  Clock,
  Sparkles,
  PhoneCall,
  MessageSquare,
  Building2,
  Send,
  Check,
  ExternalLink,
  Laptop,
  HelpCircle,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Input,
  Label,
  Textarea,
  Alert,
  AlertTitle,
  AlertDescription,
} from '@org/ui';

export function SoftwareHouseLanding() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [selectedService, setSelectedService] = useState('Web Application');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="space-y-20 py-4 md:py-8">
      {/* ========================================================================= */}
      {/* 1. TOP PROMOTIONAL AD BANNER (IKLAN PENAWARAN SPESIAL)                     */}
      {/* ========================================================================= */}
      <section id="promo" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-700 via-indigo-600 to-violet-700 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                <Flame className="h-4 w-4 text-amber-300 fill-amber-300" />
                <span>PENAWARAN TERBATAS BULAN INI</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Diskon 25% Jasa Pengembangan Software + Gratis Audit & Blueprint MVP
              </h2>
              <p className="text-sm text-blue-100 leading-relaxed">
                Ingin bangun aplikasi web, mobile, atau modernisasi sistem perusahaan? Konsultasikan ide Anda bersama Principal Software Architect kami. Gratis arsitektur blueprint senilai Rp 15.000.000 untuk 5 pendaftar pertama!
              </p>
            </div>
            <div className="flex shrink-0 flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto font-bold shadow-md">
                <a href="#contact" className="gap-2">
                  <span>Klaim Konsultasi Gratis</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
          {/* Decorative glow */}
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 text-center space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary shadow-xs">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Mitra Rekayasa Perangkat Lunak & Transformasi Digital Terpercaya</span>
        </div>

        <div className="mx-auto max-w-4xl space-y-5">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
            Bangun Software Kualitas Tinggi yang Mendorong Pertumbuhan Bisnis Anda
          </h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Kami adalah <strong>Software Development Agency & Tech Partner</strong> yang merancang dan membangun sistem digital siap skala: Aplikasi Web Modern, Mobile App iOS & Android, Arsitektur Micro Front End, dan Integrasi Cloud.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Button asChild size="lg" className="w-full sm:w-auto text-base gap-2 px-8 shadow-lg font-bold">
            <a href="#contact">
              <PhoneCall className="h-4 w-4" />
              <span>Mulai Konsultasi Proyek</span>
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base gap-2 px-6">
            <Link to="/compUI">
              <span>Buka Live Demo Platform</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Live Metrics Grid */}
        <div className="mx-auto max-w-5xl grid grid-cols-2 lg:grid-cols-4 gap-4 pt-8">
          <div className="rounded-2xl border bg-card/80 p-5 text-center shadow-xs">
            <div className="text-3xl sm:text-4xl font-extrabold text-primary">120+</div>
            <div className="text-xs font-medium text-muted-foreground mt-1.5">Proyek Software Sukses Rilis</div>
          </div>
          <div className="rounded-2xl border bg-card/80 p-5 text-center shadow-xs">
            <div className="text-3xl sm:text-4xl font-extrabold text-primary">99.8%</div>
            <div className="text-xs font-medium text-muted-foreground mt-1.5">Tingkat Kepuasan Klien</div>
          </div>
          <div className="rounded-2xl border bg-card/80 p-5 text-center shadow-xs">
            <div className="text-3xl sm:text-4xl font-extrabold text-primary">14 Hari</div>
            <div className="text-xs font-medium text-muted-foreground mt-1.5">Rata-rata Waktu Prototype MVP</div>
          </div>
          <div className="rounded-2xl border bg-card/80 p-5 text-center shadow-xs">
            <div className="text-3xl sm:text-4xl font-extrabold text-primary">24/7</div>
            <div className="text-xs font-medium text-muted-foreground mt-1.5">SLA Pemeliharaan & Support</div>
          </div>
        </div>

        {/* Client Logos / Tech Stack Strip */}
        <div className="pt-6">
          <p className="text-xs uppercase font-semibold tracking-widest text-muted-foreground mb-4">
            Teknologi Terdepan yang Kami Kuasai
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-muted-foreground font-semibold">
            <span className="rounded-lg border bg-muted/40 px-3 py-1.5">React 19 & Next.js</span>
            <span className="rounded-lg border bg-muted/40 px-3 py-1.5">Module Federation ESM</span>
            <span className="rounded-lg border bg-muted/40 px-3 py-1.5">TypeScript</span>
            <span className="rounded-lg border bg-muted/40 px-3 py-1.5">Node.js & Golang</span>
            <span className="rounded-lg border bg-muted/40 px-3 py-1.5">Flutter & React Native</span>
            <span className="rounded-lg border bg-muted/40 px-3 py-1.5">Tailwind CSS v4</span>
            <span className="rounded-lg border bg-muted/40 px-3 py-1.5">Docker & Kubernetes</span>
            <span className="rounded-lg border bg-muted/40 px-3 py-1.5">AWS & GCP Cloud</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. LAYANAN PENGEMBANGAN SOFTWARE (SERVICES)                               */}
      {/* ========================================================================= */}
      <section id="services" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
            Solusi Rekayasa Kami
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Layanan End-to-End untuk Segala Kebutuhan Digital
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Dari rancangan awal hingga deployment skala besar, kami mendampingi setiap tahapan pengembangan produk Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Service 1 */}
          <Card className="hover:border-primary/50 hover:shadow-lg transition-all duration-300">
            <CardHeader className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Laptop className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Custom Web Application</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Aplikasi web kustom berkecepatan tinggi, aman, dan responsif. Cocok untuk portal enterprise, SaaS B2B, dashboard analitik, dan sistem operasional internal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Single Page Application & SSR</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Role-Based Access Control (RBAC)</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Integrasi Payment Gateway & REST API</li>
              </ul>
            </CardContent>
          </Card>

          {/* Service 2 */}
          <Card className="hover:border-primary/50 hover:shadow-lg transition-all duration-300">
            <CardHeader className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Smartphone className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Mobile App (iOS & Android)</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Pengembangan aplikasi ponsel native maupun cross-platform dengan performa fluid 60fps, UX intuitif, dan integrasi push notification real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-500" /> Flutter & React Native Architecture</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-500" /> Offline Mode & SQLite Database</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-500" /> Penerbitan ke Google Play & App Store</li>
              </ul>
            </CardContent>
          </Card>

          {/* Service 3 */}
          <Card className="hover:border-primary/50 hover:shadow-lg transition-all duration-300">
            <CardHeader className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Layers className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Micro Front End Architecture</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Pecah aplikasi monolitik yang lambat dan sulit dirilis menjadi modul-modul independen dengan Vite Module Federation dan Nx Workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-purple-500" /> Zero Downtime Deployment Independen</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-purple-500" /> Desentralisasi Tim Engineering</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-purple-500" /> Resilient Error Boundaries & Fallback</li>
              </ul>
            </CardContent>
          </Card>

          {/* Service 4 */}
          <Card className="hover:border-primary/50 hover:shadow-lg transition-all duration-300">
            <CardHeader className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Cloud className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Cloud, DevOps & Backend</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Infrastruktur andal siap menghadapi lonjakan jutaan trafik. Kami mengonfigurasi arsitektur microservices, Docker container, dan automated CI/CD pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> AWS, GCP, Azure & Private Cloud</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Automated CI/CD Testing & Deploy</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Observability, APM & Error Tracking</li>
              </ul>
            </CardContent>
          </Card>

          {/* Service 5 */}
          <Card className="hover:border-primary/50 hover:shadow-lg transition-all duration-300">
            <CardHeader className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
                <Palette className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">UI/UX & Design System</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Desain visual modern berstandar internasional yang mengutamakan konversi, kegunaan (usability), dan konsistensi lintas perangkat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-pink-500" /> User Research & Interactive Prototype</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-pink-500" /> Design Tokens & Component Library</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-pink-500" /> Standar Aksesibilitas WCAG 2.1</li>
              </ul>
            </CardContent>
          </Card>

          {/* Service 6 */}
          <Card className="hover:border-primary/50 hover:shadow-lg transition-all duration-300">
            <CardHeader className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Bot className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">AI Integration & Automation</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Otomatisasi proses bisnis manual dengan teknologi kecerdasan buatan, pemrosesan dokumen otomatis, chat AI assistant, dan rekomendasi cerdas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-amber-500" /> Integrasi LLM (OpenAI, Gemini, Claude)</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-amber-500" /> OCR Dokumen & Text Extraction</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-amber-500" /> Workflow Automation & Chatbot</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BANNER IKLAN PROMO BERKEMBAR (DUAL PROMOTIONAL HIGHLIGHTS)              */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Iklan A: Paket MVP Fast-Track */}
          <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-card via-primary/5 to-muted p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <Badge className="bg-primary text-primary-foreground font-semibold">Program Akselerasi Startup</Badge>
              <span className="text-xs font-bold text-primary">Hemat hingga 30%</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">Paket Peluncuran MVP Cepat (4 Minggu)</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Punya ide produk baru dan butuh validasi pasar secepatnya? Kami membangun Minimum Viable Product (MVP) fungsional, siap pakai, dan siap dipresentasikan ke investor dalam waktu kurang dari satu bulan.
            </p>
            <div className="space-y-2 border-t pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Desain UI/UX Lengkap + Wireframe</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Frontend React / Flutter + Backend API siap rilis</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Cloud Setup & Domain SSL gratis 3 bulan</div>
            </div>
            <Button asChild className="w-full sm:w-auto font-semibold">
              <a href="#contact">Konsultasikan MVP Anda</a>
            </Button>
          </div>

          {/* Iklan B: Modernisasi Enterprise */}
          <div className="rounded-2xl border border-indigo-500/20 bg-linear-to-br from-card via-indigo-500/5 to-muted p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <Badge className="bg-indigo-600 text-white font-semibold">Solusi Korporat</Badge>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Zero-Downtime Guarantee</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">Modernisasi Monolitik ke Micro Front End</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sistem Anda lambat dan setiap update fitur berisiko merusak modul lain? Kami bantu refactor arsitektur frontend Anda menjadi Micro Front End modular secara bertahap tanpa mengganggu operasional harian.
            </p>
            <div className="space-y-2 border-t pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-500" /> Audit Arsitektur & Deteksi Bottleneck</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-500" /> Implementasi Vite & Module Federation ESM</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-500" /> Pelatihan & Transfer Knowledge untuk Tim Internal</div>
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto font-semibold border-indigo-500/30">
              <Link to="/compUI">Pelajari Arsitektur Kami</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PORTOFOLIO & STUDI KASUS (PORTFOLIO)                                   */}
      {/* ========================================================================= */}
      <section id="portfolio" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
            Studi Kasus Nyata
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Karya dan Solusi yang Telah Kami Bangun
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Lihat bagaimana kami membantu berbagai industri memecahkan tantangan teknologi mereka.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Portfolio 1 */}
          <div className="group rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="h-48 bg-linear-to-tr from-blue-600 to-indigo-800 p-6 flex flex-col justify-end text-white">
              <Badge className="w-fit mb-2 bg-white/20 text-white backdrop-blur-xs">Fintech Platform</Badge>
              <h4 className="text-xl font-bold">BGS FinPay Gateway</h4>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Platform transaksi multi-metode dengan kapasitas 100.000+ request per menit, enkripsi ISO-27001, dan integrasi QRIS & Virtual Account instan.
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5 text-[11px] font-mono text-muted-foreground">
                <span className="bg-muted px-2 py-0.5 rounded">React 19</span>
                <span className="bg-muted px-2 py-0.5 rounded">Golang</span>
                <span className="bg-muted px-2 py-0.5 rounded">PostgreSQL</span>
              </div>
            </div>
          </div>

          {/* Portfolio 2 */}
          <div className="group rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="h-48 bg-linear-to-tr from-purple-600 to-pink-700 p-6 flex flex-col justify-end text-white">
              <Badge className="w-fit mb-2 bg-white/20 text-white backdrop-blur-xs">Logistics & Supply Chain</Badge>
              <h4 className="text-xl font-bold">LogistiX Fleet Orchestrator</h4>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sistem pelacakan armada dan inventaris multi-gudang real-time berbasis Micro Front End, memungkinkan 4 tim divisi rilis fitur tanpa ketergantungan.
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5 text-[11px] font-mono text-muted-foreground">
                <span className="bg-muted px-2 py-0.5 rounded">Micro Front End</span>
                <span className="bg-muted px-2 py-0.5 rounded">Vite Module Fed</span>
                <span className="bg-muted px-2 py-0.5 rounded">Redis</span>
              </div>
            </div>
          </div>

          {/* Portfolio 3 */}
          <div className="group rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="h-48 bg-linear-to-tr from-emerald-600 to-teal-800 p-6 flex flex-col justify-end text-white">
              <Badge className="w-fit mb-2 bg-white/20 text-white backdrop-blur-xs">Healthcare SaaS</Badge>
              <h4 className="text-xl font-bold">MedikaCare Telemedicine</h4>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aplikasi konsultasi dokter video call terenkripsi, rekam medis elektronik, dan tebus obat kilat yang melayani 500.000+ pasien aktif.
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5 text-[11px] font-mono text-muted-foreground">
                <span className="bg-muted px-2 py-0.5 rounded">Flutter App</span>
                <span className="bg-muted px-2 py-0.5 rounded">WebRTC</span>
                <span className="bg-muted px-2 py-0.5 rounded">Node.js</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. ALUR KERJA AGILE (HOW WE WORK)                                         */}
      {/* ========================================================================= */}
      <section id="process" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
            Metodologi Kerja
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Alur Pengembangan yang Terstruktur, Transparan & Cepat
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Kami menerapkan metode Agile Scrum dengan pelaporan rutin, staging server yang dapat Anda uji kapan saja, dan komunikasi terbuka.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="rounded-xl border bg-card p-5 space-y-3 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
            <h4 className="font-bold text-sm">Discovery & Scope</h4>
            <p className="text-xs text-muted-foreground">Mendalami kebutuhan bisnis, riset pengguna, dan menentukan arsitektur teknis.</p>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-3 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
            <h4 className="font-bold text-sm">UI/UX Prototype</h4>
            <p className="text-xs text-muted-foreground">Merancang antarmuka Figma interaktif yang dapat dicoba sebelum masuk tahap coding.</p>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-3 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
            <h4 className="font-bold text-sm">Agile Sprint</h4>
            <p className="text-xs text-muted-foreground">Pengembangan fitur dalam siklus 2 minggu dengan demo berkala kepada Anda.</p>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-3 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">4</div>
            <h4 className="font-bold text-sm">QA & Security</h4>
            <p className="text-xs text-muted-foreground">Pengujian ketat: unit test, integration test, load test, hingga audit keamanan data.</p>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-3 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">5</div>
            <h4 className="font-bold text-sm">Deploy & Support</h4>
            <p className="text-xs text-muted-foreground">Peluncuran resmi ke server produksi, pendampingan peluncuran, dan garansi pasca rilis.</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. PAKET SOLUSI & ESTIMASI (PRICING TIERS)                                */}
      {/* ========================================================================= */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
            Pilihan Paket Fleksibel
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Investasi Transparan Sesuai Skala Bisnis Anda
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Pilih model kerja sama yang paling sesuai dengan kebutuhan dan target waktu peluncuran Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Tier 1 */}
          <Card className="flex flex-col justify-between border-muted hover:border-primary/40 transition-all">
            <CardHeader className="space-y-3">
              <Badge variant="outline" className="w-fit">Startup & MVP</Badge>
              <CardTitle className="text-2xl font-bold">Fast MVP</CardTitle>
              <CardDescription>Solusi ideal untuk memvalidasi ide bisnis baru dengan cepat ke pasar.</CardDescription>
              <div className="pt-2">
                <span className="text-3xl font-extrabold text-foreground">Mulai 25 Jt</span>
                <span className="text-xs text-muted-foreground"> / proyek</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Rilis dalam 3 - 4 Minggu</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Web App responsif (React / Next.js)</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Database & REST API terintegrasi</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Garansi bug-free 30 hari</li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <a href="#contact">Pilih Paket MVP</a>
              </Button>
            </CardContent>
          </Card>

          {/* Tier 2 - POPULAR */}
          <Card className="flex flex-col justify-between border-primary shadow-xl relative scale-105 z-10 bg-card">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground font-bold shadow-md">PALING POPULER</Badge>
            </div>
            <CardHeader className="space-y-3 pt-6">
              <Badge variant="outline" className="w-fit text-primary border-primary/20 bg-primary/5">Bisnis Bertumbuh</Badge>
              <CardTitle className="text-2xl font-bold">Growth Scale</CardTitle>
              <CardDescription>Untuk bisnis yang membutuhkan sistem tangguh dengan fitur lengkap.</CardDescription>
              <div className="pt-2">
                <span className="text-3xl font-extrabold text-foreground">Mulai 65 Jt</span>
                <span className="text-xs text-muted-foreground"> / proyek</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Web App + Mobile App (iOS / Android)</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Dashboard Admin & Role Management</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Payment Gateway & Notifikasi WA/Email</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Garansi & Pendampingan 90 hari</li>
              </ul>
              <Button asChild className="w-full font-bold shadow-md">
                <a href="#contact">Konsultasikan Paket Growth</a>
              </Button>
            </CardContent>
          </Card>

          {/* Tier 3 */}
          <Card className="flex flex-col justify-between border-muted hover:border-primary/40 transition-all">
            <CardHeader className="space-y-3">
              <Badge variant="outline" className="w-fit">Korporat</Badge>
              <CardTitle className="text-2xl font-bold">Enterprise Custom</CardTitle>
              <CardDescription>Sistem berskala besar dengan arsitektur Micro Front End dan regulasi ketat.</CardDescription>
              <div className="pt-2">
                <span className="text-3xl font-extrabold text-foreground">Custom Quote</span>
                <span className="text-xs text-muted-foreground"> / spesifikasi</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Arsitektur Micro Front End & Microservices</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Multi-Cloud Deployment & K8s</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Dedicated Engineer Team (Squad)</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> SLA 99.9% & 24/7 Priority Support</li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <a href="#contact">Diskusikan Proyek Enterprise</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FORMULIR KONSULTASI & ESTIMASI PROYEK (CONTACT SECTION)                */}
      {/* ========================================================================= */}
      <section id="contact" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border bg-card p-6 sm:p-10 lg:p-14 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Sisi Kiri: Informasi & Value Proposition */}
            <div className="space-y-6">
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                Mulai Kolaborasi
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Punya Ide atau Proyek Software? Mari Wujudkan Bersama.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ceritakan kebutuhan proyek Anda. Tim analis dan engineer kami akan mempelajari spesifikasi Anda dan memberikan rekomendasi teknis serta estimasi biaya dalam 1x24 jam kerja.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span>Konsultasi awal & estimasi biaya 100% Gratis</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span>Perjanjian Kerahasiaan (NDA) dijamin aman</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span>Respon cepat di hari kerja dalam hitungan jam</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hubungi Langsung via WhatsApp:</p>
                <Button asChild variant="outline" size="sm" className="gap-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
                  <a href="https://wa.me/6281234567890?text=Halo%20BGS%20Software,%20saya%20ingin%20konsultasi%20proyek" target="_blank" rel="noreferrer">
                    <MessageSquare className="h-4 w-4" />
                    <span>Chat WhatsApp Business (+62 812-3456-7890)</span>
                  </a>
                </Button>
              </div>
            </div>

            {/* Sisi Kanan: Formulir Estimasi */}
            <div className="rounded-2xl border bg-muted/30 p-6 sm:p-8 space-y-5">
              <h3 className="font-bold text-lg text-foreground">Formulir Estimasi Proyek</h3>

              {formSubmitted ? (
                <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <AlertTitle className="font-bold">Permintaan Terkirim!</AlertTitle>
                  <AlertDescription className="text-xs mt-1">
                    Terima kasih telah menghubungi kami. Tim engineer kami akan menghubungi Anda melalui email atau WhatsApp dalam 1x24 jam untuk mendiskusikan kebutuhan proyek Anda.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Pilihan Layanan */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Tipe Layanan yang Dibutuhkan</Label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {['Web Application', 'Mobile App', 'Micro Front End', 'Custom ERP/AI'].map((srv) => (
                        <button
                          key={srv}
                          type="button"
                          onClick={() => setSelectedService(srv)}
                          className={`rounded-lg border px-3 py-2 text-start font-medium transition-colors ${
                            selectedService === srv
                              ? 'border-primary bg-primary text-primary-foreground font-semibold'
                              : 'bg-card text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          {srv}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Nama & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="client-name" className="text-xs">Nama Lengkap</Label>
                      <Input id="client-name" required placeholder="Budi Pratama" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="client-phone" className="text-xs">Nomor WhatsApp</Label>
                      <Input id="client-phone" required placeholder="0812-xxxx-xxxx" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="client-email" className="text-xs">Email Bisnis</Label>
                    <Input id="client-email" type="email" required placeholder="budi@perusahaan.com" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="client-desc" className="text-xs">Deskripsi Singkat Kebutuhan Proyek</Label>
                    <Textarea
                      id="client-desc"
                      rows={3}
                      placeholder="Jelaskan gambaran aplikasi yang ingin Anda bangun, fitur utama, estimasi deadline, dll..."
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2 font-bold shadow-md">
                    <Send className="h-4 w-4" />
                    <span>Kirim & Dapatkan Estimasi Gratis</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SoftwareHouseLanding;
