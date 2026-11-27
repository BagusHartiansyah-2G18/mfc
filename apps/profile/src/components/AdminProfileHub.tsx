import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@org/ui';
import { authStore } from '@org/auth';
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  ExternalLink,
  Flame,
  GraduationCap,
  KeyRound,
  Lock,
  UserCheck,
} from 'lucide-react';
import { CV_FORMS, type CvFormKey } from '../config/profile-api';

interface AdminProfileHubProps {
  hasProfile: boolean;
  experiencesCount: number;
  projectsCount: number;
  educationsCount: number;
  certificationsCount: number;
  onNavigate?: (path: string) => void;
  onViewProfile?: () => void;
}

const ADMIN_CV_MODULES: Array<{
  key: CvFormKey;
  step: number;
  desc: string;
  icon: React.ElementType;
}> = [
  {
    key: 'profile',
    step: 1,
    desc: 'Kelola nama, headline, lokasi, email, telepon, ringkasan profesional, core skills, dan keunggulan.',
    icon: UserCheck,
  },
  {
    key: 'experience',
    step: 2,
    desc: 'Kelola daftar pengalaman kerja, perusahaan/instansi, periode, urutan tampil, dan pencapaian.',
    icon: Briefcase,
  },
  {
    key: 'projects',
    step: 3,
    desc: 'Kelola sorotan proyek unggulan, kategori teknologi, dan poin dampak implementasi.',
    icon: Flame,
  },
  {
    key: 'education',
    step: 4,
    desc: 'Kelola riwayat pendidikan formal (GPA/tahun) serta sertifikasi profesional (BNSP, Dicoding, dll).',
    icon: GraduationCap,
  },
];

export function AdminProfileHub({
  hasProfile,
  experiencesCount,
  projectsCount,
  educationsCount,
  certificationsCount,
  onNavigate,
  onViewProfile,
}: AdminProfileHubProps) {
  const user = authStore.getUser();
  const hasSession = Boolean(authStore.getToken() && user);

  const openPortalPath = (path: string, newTab = false) => {
    if (!newTab && onNavigate) {
      onNavigate(path);
      return;
    }
    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200';
    if (newTab) {
      window.open(`${baseUrl}${path}`, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = `${baseUrl}${path}`;
    }
  };

  if (!hasSession) {
    return (
      <Card className="max-w-lg mx-auto my-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600" />
            Admin Profile Memerlukan Sesi Login Portal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-muted-foreground">
          <p>
            Halaman pengelolaan CV (#1MFC1) hanya dapat diakses oleh pengguna yang sudah login di Portal.
          </p>
          <Button
            type="button"
            onClick={() => openPortalPath('/login', true)}
            className="gap-1.5"
          >
            <ExternalLink className="h-4 w-4" /> Login melalui Portal (4200)
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-foreground">
                Admin Hub — Profile &amp; CV Website (#1MFC1)
              </h2>
              <Badge variant="outline" className="text-[10px] font-mono">
                {user?.email || user?.name}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Seluruh data website profil tersinkron langsung ke catatan <strong>Noted #1MFC1 (Curriculum Vitae)</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => (onViewProfile ? onViewProfile() : openPortalPath('/profile'))}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Lihat Website Profile
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => openPortalPath('/noted/forms/1MFC1', true)}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5" /> Buka Form #1MFC1
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Profil Utama', value: hasProfile ? 'Aktif' : 'Kosong' },
          { label: 'Pengalaman Kerja', value: experiencesCount },
          { label: 'Sorotan Proyek', value: projectsCount },
          { label: 'Pendidikan', value: educationsCount },
          { label: 'Sertifikasi', value: certificationsCount },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-3.5">
              <span className="text-[11px] text-muted-foreground block">{item.label}</span>
              <span className="text-xl font-extrabold text-primary font-mono">{item.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CV Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {ADMIN_CV_MODULES.map(({ key, step, desc, icon: Icon }) => {
          const cfg = CV_FORMS[key];
          const formBase = `/noted/forms/${encodeURIComponent(cfg.kdNote)}/${encodeURIComponent(cfg.formId)}/responses`;
          return (
            <Card key={key} className="flex flex-col justify-between hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                    {step}
                  </span>
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span>{cfg.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs flex-1 flex flex-col justify-between">
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openPortalPath(`${formBase}?tab=rekap`, true)}
                    className="flex-1 h-7 text-[11px] gap-1 cursor-pointer"
                  >
                    Kelola di Noted <ArrowUpRight className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openPortalPath(`${formBase}?tab=isi`, true)}
                    className="h-7 text-[11px] cursor-pointer"
                  >
                    + Entri
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openPortalPath(`${formBase}?tab=api`, true)}
                    className="h-7 px-2 text-[11px] cursor-pointer"
                    title="Pengaturan API Key & Integrasi"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
