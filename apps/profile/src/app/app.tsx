import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@org/ui';
import { authStore } from '@org/auth';
import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Database,
  ExternalLink,
  Flame,
  GraduationCap,
  Layers,
  Lightbulb,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  RefreshCw,
  Server,
  Settings,
  Smartphone,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react';
import {
  CV_FORMS,
  fetchCvFormRows,
  type CvEducationCertItem,
  type CvExperienceItem,
  type CvProfileData,
  type CvProjectItem,
} from '../config/profile-api';
import { AdminProfileHub } from '../components/AdminProfileHub';

export interface ProfileAppProps {
  initialPage?: 'profile' | 'admin';
  onNavigate?: (path: string) => void;
}

function splitLines(text?: string): string[] {
  if (!text) return [];
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitTags(text?: string): string[] {
  if (!text) return [];
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function App({ initialPage, onNavigate }: ProfileAppProps = {}) {
  const resolveInitialPage = (): 'profile' | 'admin' => {
    if (initialPage) return initialPage;
    if (typeof window !== 'undefined' && window.location.pathname.endsWith('/admin')) {
      return 'admin';
    }
    return 'profile';
  };

  const [page, setPage] = useState<'profile' | 'admin'>(resolveInitialPage);
  const [profile, setProfile] = useState<CvProfileData | null>(null);
  const [experiences, setExperiences] = useState<CvExperienceItem[]>([]);
  const [projects, setProjects] = useState<CvProjectItem[]>([]);
  const [eduCerts, setEduCerts] = useState<CvEducationCertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const hasSession = Boolean(authStore.getToken()) && authStore.can('view', 'profile');

  const loadAll = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [profRows, expRows, projRows, eduRows] = await Promise.all([
        fetchCvFormRows<CvProfileData>('profile'),
        fetchCvFormRows<CvExperienceItem>('experience'),
        fetchCvFormRows<CvProjectItem>('projects'),
        fetchCvFormRows<CvEducationCertItem>('education'),
      ]);
      setProfile(profRows[0] || null);
      setExperiences([...expRows].sort((a, b) => Number(a.urutan || 0) - Number(b.urutan || 0)));
      setProjects([...projRows].sort((a, b) => Number(a.urutan || 0) - Number(b.urutan || 0)));
      setEduCerts(eduRows);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data CV dari Noted.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (page === 'admin') {
      document.title = 'Admin Profile & CV — #1MFC1';
    } else if (profile?.nama_lengkap) {
      document.title = `${profile.nama_lengkap} — ${profile.headline || 'Professional Profile'}`;
    }
  }, [profile, page]);

  const educations = useMemo(
    () => eduCerts.filter((item) => item.tipe === 'EDUCATION'),
    [eduCerts]
  );
  const certifications = useMemo(
    () => eduCerts.filter((item) => item.tipe === 'CERTIFICATION'),
    [eduCerts]
  );

  const waDigits = (profile?.telepon || '+62 821-4495-2937').replace(/[^0-9]/g, '');

  const handleCopyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1800);
    } catch {
      // ignore
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDownloadPdf = () => {
    const prevTitle = document.title;
    const safeName = (profile?.nama_lengkap || 'Bagus Hartiansyah').trim();
    document.title = `CV - ${safeName}`;
    window.print();
    window.setTimeout(() => {
      document.title = prevTitle;
    }, 500);
  };

  const go = (path: string) => {
    if (onNavigate) onNavigate(path);
    else window.location.href = path;
  };

  const switchPage = (nextPage: 'profile' | 'admin') => {
    setPage(nextPage);
    try {
      const inPortal = window.location.pathname.startsWith('/profile');
      const targetPath =
        nextPage === 'admin'
          ? inPortal
            ? '/profile/admin'
            : '/admin'
          : inPortal
            ? '/profile'
            : '/';
      window.history.pushState(null, '', targetPath);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const onPopState = () => {
      setPage(window.location.pathname.endsWith('/admin') ? 'admin' : 'profile');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (isLoading && !profile && page === 'profile') {
    return (
      <div className="py-24 text-center text-xs text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
        <p className="font-medium">Memuat profil profesional dari Noted #1MFC1...</p>
      </div>
    );
  }

  const skillGroups = [
    { label: 'Frontend', raw: profile?.keahlian_frontend, Icon: Layers, tone: 'text-sky-600 bg-sky-500/10' },
    { label: 'Backend', raw: profile?.keahlian_backend, Icon: Server, tone: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'Mobile', raw: profile?.keahlian_mobile, Icon: Smartphone, tone: 'text-violet-600 bg-violet-500/10' },
    { label: 'Database', raw: profile?.keahlian_database, Icon: Database, tone: 'text-amber-600 bg-amber-500/10' },
    { label: 'Architecture & Other', raw: profile?.keahlian_lainnya, Icon: Code2, tone: 'text-primary bg-primary/10' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 print:max-w-none print:space-y-3 print:pb-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 9mm 11mm; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body, #root, #root > div, .h-screen, .overflow-hidden, .overflow-y-auto, main {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          aside, nav, header:not(.cv-print-header) { display: none !important; }
          .cv-print-grid-4 { display: grid !important; grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
          .cv-print-grid-3 { display: grid !important; grid-template-columns: repeat(3, minmax(0, 1fr)) !important; align-items: stretch !important; }
          .cv-print-col-span-2 { grid-column: span 2 / span 2 !important; }
          .cv-print-grid-2 { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .cv-print-page-break { break-before: page !important; page-break-before: always !important; }
          .cv-print-heading { break-after: avoid !important; page-break-after: avoid !important; }
          .cv-print-avoid-break { break-inside: avoid !important; page-break-inside: avoid !important; }
          .cv-print-hero {
            border: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
            border-radius: 0 !important;
            padding: 0 0 6px 0 !important;
          }
        }
      `}</style>
      {/* Unified Navigation & Actions (sama seperti Cake: Profile Publik + Admin Terbatas Login) */}
        <div className="sticky top-2 z-30 flex items-center justify-between gap-3 flex-wrap rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md px-3.5 py-2.5 shadow-xs print:hidden">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              type="button"
              variant={page === 'profile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => switchPage('profile')}
              className="h-7 px-2.5 text-[11px] gap-1.5 cursor-pointer"
            >
              <User className="h-3.5 w-3.5" /> Profile CV
            </Button>
            {hasSession && (
              <Button
                type="button"
                variant={page === 'admin' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => switchPage('admin')}
                className="h-7 px-2.5 text-[11px] gap-1.5 cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" /> Admin CV
              </Button>
            )}

            {page === 'profile' && (
              <div className="hidden sm:flex items-center gap-0.5 pl-2 ml-1 border-l border-border/60">
                {[
                  { id: 'cv-summary', label: 'Ringkasan' },
                  { id: 'cv-skills', label: 'Keahlian' },
                  { id: 'cv-experience', label: 'Pengalaman' },
                  { id: 'cv-projects', label: 'Proyek' },
                  { id: 'cv-education', label: 'Pendidikan' },
                ].map((nav) => (
                  <button
                    key={nav.id}
                    type="button"
                    onClick={() => scrollToSection(nav.id)}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
                  >
                    {nav.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {page === 'profile' && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyProfileLink}
                  className="h-7 px-2.5 text-[11px] gap-1.5 cursor-pointer"
                >
                  {copiedUrl ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copiedUrl ? 'Tersalin' : 'Salin Link'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPdf}
                  className="h-7 px-2.5 text-[11px] gap-1.5 cursor-pointer"
                >
                  <Printer className="h-3 w-3" /> Download PDF
                </Button>
              </>
            )}
            {hasSession && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => go(`/noted/forms/${CV_FORMS.profile.kdNote}`)}
                className="h-7 px-2.5 text-[11px] gap-1.5 cursor-pointer border-primary/30 text-primary hover:bg-primary/5"
              >
                <BookOpen className="h-3 w-3" /> #1MFC1
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={loadAll}
              className="h-7 w-7 p-0 cursor-pointer"
              title="Segarkan data CV"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {page === 'admin' ? (
          <div className="print:hidden">
            <AdminProfileHub
              hasProfile={Boolean(profile)}
              experiencesCount={experiences.length}
              projectsCount={projects.length}
              educationsCount={educations.length}
              certificationsCount={certifications.length}
              onNavigate={onNavigate}
              onViewProfile={() => switchPage('profile')}
            />
          </div>
        ) : (
        <>

      {error && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 text-xs">
          {error}
        </div>
      )}

      {/* Executive Hero Banner */}
      <section className="cv-print-avoid-break cv-print-hero relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-indigo-500/10 p-6 sm:p-8 shadow-sm">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 print:gap-4">
          <div className="space-y-4 print:space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse print:animate-none" />
              Available for Senior Engineering &amp; Architecture Roles
            </div>

            <div className="flex items-start sm:items-center gap-4">
              <div className="h-16 w-16 print:h-14 print:w-14 rounded-2xl bg-indigo-600 bg-gradient-to-br from-primary to-indigo-600 text-white font-extrabold text-2xl print:text-xl flex items-center justify-center shadow-md ring-4 ring-primary/15 shrink-0">
                {(profile?.nama_lengkap || 'BH')
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {profile?.nama_lengkap || 'Bagus Hartiansyah'}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-primary leading-snug">
                  {profile?.headline}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
              {profile?.lokasi && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-background/80 border border-border/70 px-2.5 py-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {profile.lokasi}
                </span>
              )}
              {profile?.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-background/80 border border-border/70 px-2.5 py-1 hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 text-primary" /> {profile.email}
                </a>
              )}
              {profile?.telepon && (
                <a
                  href={`tel:${profile.telepon}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-background/80 border border-border/70 px-2.5 py-1 hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-primary" /> {profile.telepon}
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 print:hidden">
            <Button
              type="button"
              onClick={() =>
                window.open(
                  `https://wa.me/${waDigits}?text=${encodeURIComponent(
                    `Halo ${profile?.nama_lengkap || 'Bagus'}, saya melihat profil CV Anda dan ingin berdiskusi.`
                  )}`,
                  '_blank',
                  'noopener,noreferrer'
                )
              }
              className="h-10 px-4 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" /> Hubungi via WhatsApp
            </Button>
            {profile?.email && (
              <Button
                type="button"
                variant="outline"
                onClick={() => (window.location.href = `mailto:${profile.email}`)}
                className="h-10 px-4 text-xs font-semibold gap-2 bg-background/80 cursor-pointer"
              >
                <Mail className="h-4 w-4" /> Kirim Email
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="cv-print-avoid-break cv-print-grid-4 grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2.5">
        {[
          { label: 'Pengalaman', value: '6+ Tahun', sub: 'Fullstack & Architect', Icon: Briefcase, tone: 'text-primary bg-primary/10' },
          { label: 'Instansi Terlayani', value: '54+', sub: 'Government & Enterprise', Icon: Building2, tone: 'text-indigo-600 bg-indigo-500/10' },
          { label: 'Efisiensi Sistem', value: 'Up to 80%', sub: 'Digital Transformation', Icon: TrendingUp, tone: 'text-emerald-600 bg-emerald-500/10' },
          { label: 'Skala Data', value: '75,000+', sub: 'High-Volume Processing', Icon: Database, tone: 'text-amber-600 bg-amber-500/10' },
        ].map(({ label, value, sub, Icon, tone }) => (
          <Card key={label} className="border-border/80 hover:border-primary/30 transition-colors">
            <CardContent className="p-4 print:p-3 flex items-start justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[11px] font-medium text-muted-foreground block">{label}</span>
                <span className="text-xl print:text-lg font-extrabold text-foreground font-mono tracking-tight whitespace-nowrap block">
                  {value}
                </span>
                <span className="text-[10px] text-muted-foreground block">{sub}</span>
              </div>
              <div className={`p-2 print:p-1.5 rounded-xl shrink-0 ${tone}`}>
                <Icon className="h-4 w-4 print:h-3.5 print:w-3.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Summary + Core Skills */}
      <div className="cv-print-grid-3 cv-print-avoid-break grid grid-cols-1 lg:grid-cols-3 print:grid-cols-3 gap-4 print:gap-3">
        <Card id="cv-summary" className="cv-print-col-span-2 lg:col-span-2 print:col-span-2 border-border/80 scroll-mt-16 cv-print-avoid-break">
          <CardHeader className="pb-2 print:pb-1.5">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              Professional Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 print:space-y-2 text-xs print:text-[11px] text-muted-foreground leading-relaxed">
            <div className="space-y-2.5 print:space-y-1.5 border-l-2 border-primary/30 pl-3.5">
              {splitLines(profile?.ringkasan_profesional).map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {profile?.keunggulan_tambahan && (
              <div className="pt-3 print:pt-2 border-t border-border/60 space-y-2.5 print:space-y-1.5">
                <h4 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                  <Lightbulb className="h-4 w-4 text-amber-500" /> Additional Strengths
                </h4>
                <div className="cv-print-grid-2 grid grid-cols-1 sm:grid-cols-2 gap-2 print:gap-1.5">
                  {splitLines(profile.keunggulan_tambahan).map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/20 p-2.5 print:p-2 text-[11px] print:text-[10px] text-foreground"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="cv-skills" className="border-border/80 scroll-mt-16 cv-print-avoid-break">
          <CardHeader className="pb-2 print:pb-1.5">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Code2 className="h-4 w-4" />
              </span>
              Core Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 print:space-y-2.5 text-xs">
            {skillGroups.map(
              ({ label, raw, Icon, tone }) =>
                raw && (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`p-1 rounded-md ${tone}`}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <span className="text-[11px] font-bold text-foreground">{label}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {splitTags(raw).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] font-medium px-2 py-0.5"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
            )}
          </CardContent>
        </Card>
      </div>

      {/* Professional Experience */}
      <Card id="cv-experience" className="cv-print-page-break border-border/80 scroll-mt-16">
        <CardHeader className="cv-print-heading pb-3 print:pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Briefcase className="h-4 w-4" />
            </span>
            Professional Experience ({experiences.length})
          </CardTitle>
          {hasSession && (
            <button
              type="button"
              onClick={() => go(`/noted/forms/${CV_FORMS.experience.kdNote}/${CV_FORMS.experience.formId}/responses`)}
              className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 cursor-pointer print:hidden"
            >
              Edit di Noted <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </CardHeader>
        <CardContent className="space-y-4 print:space-y-2.5">
          {experiences.map((exp, idx) => (
            <div
              key={exp.id || idx}
              className={`cv-print-avoid-break relative pl-5 border-l-2 pb-1 print:pb-0 space-y-2 print:space-y-1 ${
                idx === 0 ? 'border-primary' : 'border-border'
              }`}
            >
              <span
                className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ring-4 ring-background ${
                  idx === 0 ? 'bg-primary' : 'bg-muted-foreground/50'
                }`}
              />
              <div className="rounded-xl border border-border/70 bg-muted/15 p-3.5 print:p-2.5 space-y-2 print:space-y-1 hover:border-primary/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm print:text-[13px] font-bold text-foreground">{exp.posisi}</h4>
                      {idx === 0 && (
                        <Badge className="text-[9px] bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
                          Current / Latest
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-primary mt-0.5">{exp.perusahaan}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono w-fit bg-background">
                    {exp.periode}
                  </Badge>
                </div>
                {exp.pencapaian && (
                  <ul className="space-y-1 print:space-y-0.5 text-xs print:text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                    {splitLines(exp.pencapaian).map((line, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary/70 shrink-0 mt-0.5" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Project Highlights */}
      <section id="cv-projects" className="cv-print-page-break space-y-3 print:space-y-2.5 scroll-mt-16">
        <div className="cv-print-heading flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600">
              <Flame className="h-4 w-4" />
            </span>
            Project Highlights ({projects.length})
          </h2>
          {hasSession && (
            <button
              type="button"
              onClick={() => go(`/noted/forms/${CV_FORMS.projects.kdNote}/${CV_FORMS.projects.formId}/responses`)}
              className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 cursor-pointer print:hidden"
            >
              Edit Proyek <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="cv-print-grid-2 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-3.5 print:gap-3">
          {projects.map((proj, idx) => (
            <Card
              key={proj.id || idx}
              className="cv-print-avoid-break border-border/80 hover:border-primary/40 hover:shadow-sm transition-all overflow-hidden"
            >
              <div className="h-1 w-full bg-gradient-to-r from-primary via-indigo-500 to-amber-500/70" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  {proj.kategori ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {proj.kategori}
                    </Badge>
                  ) : (
                    <span />
                  )}
                  <span className="font-mono text-[10px] font-bold text-muted-foreground">
                    #{String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <CardTitle className="text-sm pt-1">{proj.nama_proyek}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <ul className="space-y-1.5">
                  {splitLines(proj.ringkasan).map((line, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Education & Certifications */}
      <div id="cv-education" className="cv-print-avoid-break cv-print-grid-2 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-3 scroll-mt-16">
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="h-4 w-4" />
              </span>
              Education
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {educations.map((ed, idx) => (
              <div
                key={ed.id || idx}
                className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-foreground text-sm">{ed.judul}</p>
                  {ed.tahun && (
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                      {ed.tahun}
                    </Badge>
                  )}
                </div>
                <p className="text-primary font-semibold">{ed.institusi}</p>
                {ed.keterangan && (
                  <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]">
                    {ed.keterangan}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Award className="h-4 w-4" />
              </span>
              Certifications ({certifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {certifications.map((cert, idx) => (
              <div
                key={cert.id || idx}
                className="p-3 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between gap-2 hover:border-primary/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{cert.judul}</p>
                  <p className="text-[11px] text-muted-foreground">{cert.institusi}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {cert.tahun || 'Certified'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Collaboration CTA */}
      <section className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-emerald-500/10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">
            Tertarik Berkolaborasi atau Konsultasi Arsitektur Sistem?
          </h3>
          <p className="text-xs text-muted-foreground">
            Tersedia untuk pengembangan aplikasi Enterprise, GovTech, Fullstack System, dan Microservices.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={() =>
              window.open(
                `https://wa.me/${waDigits}?text=${encodeURIComponent(
                  `Halo ${profile?.nama_lengkap || 'Bagus'}, saya ingin mendiskusikan kolaborasi proyek.`
                )}`,
                '_blank',
                'noopener,noreferrer'
              )
            }
            className="h-9 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </Button>
          {profile?.email && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = `mailto:${profile.email}`)}
              className="h-9 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </Button>
          )}
        </div>
      </section>
        </>
        )}
    </div>
  );
}

export default App;
