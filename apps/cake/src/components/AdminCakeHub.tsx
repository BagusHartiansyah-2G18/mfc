import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@org/ui';
import { authStore } from '@org/auth';
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Cake,
  ExternalLink,
  FolderKanban,
  HelpCircle,
  Layers,
  Lock,
  Percent,
  Settings,
  Sliders,
  Star,
  Truck,
} from 'lucide-react';
import { CAKE_FORMS, getNotedFormUrl, PORTAL_BASE_URL, type CakeFormKey } from '../config/cake-api';
import type { CakeLead, CakeReview } from '../types/cake';

interface AdminCakeHubProps {
  productsCount: number;
  categoriesCount: number;
  promosCount: number;
  reviews: CakeReview[];
  leads: CakeLead[];
  onNavigate?: (path: string) => void;
}

interface AdminModuleItem {
  key: CakeFormKey;
  step: number;
  desc: string;
  icon: React.ElementType;
}

interface AdminModuleGroup {
  id: string;
  title: string;
  subtitle: string;
  items: AdminModuleItem[];
}

const ADMIN_MODULE_GROUPS: AdminModuleGroup[] = [
  {
    id: 'setup',
    title: '1. Pengaturan Toko & Aturan Operasional',
    subtitle: 'Siapkan identitas toko, aturan Pre-Order/kuota, dan zona pengantaran.',
    items: [
      { key: 'store', step: 1, desc: 'Identitas usaha, motto, jam buka, WhatsApp, sosmed, dan visi/misi.', icon: Settings },
      { key: 'rules', step: 2, desc: 'Atur batas H-N PO, kuota harian, cut-off, DP%, dan harga add-on.', icon: Sliders },
      { key: 'areas', step: 3, desc: 'Atur zona pengantaran, tarif ongkir, dan opsi pickup toko.', icon: Truck },
    ],
  },
  {
    id: 'catalog',
    title: '2. Master Katalog Produk',
    subtitle: 'Kelola kategori kue terlebih dahulu, lalu lengkapi daftar produk, varian, dan foto.',
    items: [
      { key: 'categories', step: 4, desc: 'Kelola kategori kue (Brownies, Birthday Cake, Wedding, dll).', icon: Layers },
      { key: 'products', step: 5, desc: 'Kelola daftar kue, harga varian ukuran, galeri foto produk, dan status Ready/Pre-Order.', icon: Cake },
    ],
  },
  {
    id: 'engagement',
    title: '3. Promosi & Edukasi Pelanggan',
    subtitle: 'Atur promo aktif, FAQ kebijakan order, dan moderasi ulasan pelanggan.',
    items: [
      { key: 'promos', step: 6, desc: 'Atur banner promo diskon persentase atau gratis ongkir.', icon: Percent },
      { key: 'faqs', step: 7, desc: 'Kelola pertanyaan umum (FAQ) dan informasi kebijakan toko.', icon: HelpCircle },
      { key: 'reviews', step: 8, desc: 'Moderasi ulasan pelanggan (Approve / Reject) sebelum tampil.', icon: Star },
    ],
  },
  {
    id: 'transactions',
    title: '4. Pesanan Masuk & Konversi Penjualan',
    subtitle: 'Pantau pesanan custom cake yang masuk dan tindak lanjuti lead WhatsApp hingga deal.',
    items: [
      { key: 'customCake', step: 9, desc: 'Lihat & proses permintaan pesanan kue custom dari pelanggan.', icon: FolderKanban },
      { key: 'leads', step: 10, desc: 'Pantau seluruh klik CTA WhatsApp dan konversi order nyata.', icon: BarChart3 },
    ],
  },
];

export function AdminCakeHub({
  productsCount,
  categoriesCount,
  promosCount,
  reviews,
  leads,
  onNavigate,
}: AdminCakeHubProps) {
  const user = authStore.getUser();
  const hasSession = Boolean(authStore.getToken() && user);
  const pendingReviewsCount = reviews.filter((r) => r.status_moderasi === 'PENDING').length;
  const dealCount = leads.filter((l) => l.status_lead === 'DEAL').length;

  const openPortalPath = (path: string) => {
    const baseUrl =
      typeof window !== 'undefined' && onNavigate ? window.location.origin : PORTAL_BASE_URL;
    window.open(`${baseUrl}${path}`, '_blank', 'noopener,noreferrer');
  };

  if (!hasSession) {
    return (
      <Card className="max-w-lg mx-auto my-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600" />
            Admin Cake Memerlukan Sesi Login Portal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-muted-foreground">
          <p>
            Untuk keamanan data pelanggan (Lead WhatsApp, Order Custom Cake, dan Moderasi Ulasan), halaman Admin hanya dapat diakses oleh pengguna yang sudah login di Portal.
          </p>
          <Button
            type="button"
            onClick={() => openPortalPath('/login')}
            className="gap-1.5"
          >
            <ExternalLink className="h-4 w-4" /> Login melalui Portal (4200)
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Admin Hub — Cake Marketing Platform</h2>
              <Badge variant="outline" className="text-[10px] font-mono">
                {user?.email || user?.name}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Semua pengelolaan data terhubung ke <strong>Noted Portal</strong>. Klik modul di bawah untuk langsung membuka daftar rekap atau entri data di Noted.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openPortalPath('/noted?kdJudul=3MFC8%232')}
            className="h-8 text-xs gap-1.5 shrink-0"
          >
            <BookOpen className="h-3.5 w-3.5" /> Buka Catatan #3MFC8#2
          </Button>
        </CardContent>
      </Card>

      {/* Admin KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Produk', value: productsCount },
          { label: 'Kategori Aktif', value: categoriesCount },
          { label: 'Promo Aktif', value: promosCount },
          { label: 'Review Pending', value: pendingReviewsCount },
          { label: 'Lead Deal / Total', value: `${dealCount} / ${leads.length}` },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-3.5">
              <span className="text-[11px] text-muted-foreground block">{item.label}</span>
              <span className="text-xl font-extrabold text-primary font-mono">{item.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grouped Modules by Main Workflow */}
      <div className="space-y-6">
        {ADMIN_MODULE_GROUPS.map((group) => (
          <section key={group.id} className="space-y-3">
            <div className="border-b border-border/60 pb-1.5">
              <h3 className="text-sm font-bold text-foreground">{group.title}</h3>
              <p className="text-[11px] text-muted-foreground">{group.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.items.map(({ key, step, desc, icon: Icon }) => {
                const cfg = CAKE_FORMS[key];
                return (
                  <Card key={key} className="flex flex-col justify-between hover:border-primary/40 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                            {step}
                          </span>
                          <Icon className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate">{cfg.title}</span>
                        </span>
                        {key === 'reviews' && pendingReviewsCount > 0 && (
                          <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px] shrink-0">
                            {pendingReviewsCount} pending
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs flex-1 flex flex-col justify-between">
                      <p className="text-muted-foreground leading-relaxed">{desc}</p>
                      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => openPortalPath(getNotedFormUrl(key, 'rekap'))}
                          className="flex-1 h-7 text-[11px] gap-1"
                        >
                          Kelola di Noted <ArrowUpRight className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openPortalPath(getNotedFormUrl(key, 'isi'))}
                          className="h-7 text-[11px]"
                        >
                          + Entri
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
