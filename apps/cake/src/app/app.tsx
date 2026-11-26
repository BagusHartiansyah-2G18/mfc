import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  SelectField,
} from '@org/ui';
import { authStore } from '@org/auth';
import {
  AlertCircle,
  BarChart3,
  Cake,
  ChevronDown,
  Clock,
  ExternalLink,
  Globe,
  HelpCircle,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Percent,
  Phone,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Sun,
  TrendingUp,
  Truck,
} from 'lucide-react';
import {
  fetchAuthenticatedFormRows,
  fetchCakeFormRows,
  fetchPublicFormPage,
} from '../config/cake-api';
import type {
  CakeCategory,
  CakeDeliveryArea,
  CakeFaq,
  CakeGalleryItem,
  CakeLead,
  CakePoRule,
  CakeProduct,
  CakePromo,
  CakeReview,
  CakeStoreSettings,
} from '../types/cake';
import { ProductDetailDialog } from '../components/ProductDetailDialog';
import { CustomCakeSection } from '../components/CustomCakeSection';
import { ReviewModal } from '../components/ReviewModal';
import { AdminCakeHub } from '../components/AdminCakeHub';

export type ActivePage = 'catalog' | 'custom' | 'about' | 'analytics' | 'admin';

export interface CakeAppProps {
  initialPage?: ActivePage;
  onNavigate?: (path: string) => void;
}

function isStoreCurrentlyOpen(openTime = '08:00', closeTime = '21:00'): boolean {
  try {
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = openTime.split(':').map(Number);
    const [ch, cm] = closeTime.split(':').map(Number);
    const start = (oh || 8) * 60 + (om || 0);
    const end = (ch || 21) * 60 + (cm || 0);
    return cur >= start && cur <= end;
  } catch {
    return true;
  }
}

function ProductCardMedia({
  product,
  categoryName,
  imageUrl,
}: {
  product: CakeProduct;
  categoryName: string;
  imageUrl?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative h-40 w-full overflow-hidden rounded-t-xl border-b border-border/60 bg-gradient-to-br from-amber-500/15 via-primary/10 to-rose-500/15 flex items-center justify-center">
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt={product.nama_produk}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="text-center px-3 space-y-1">
          <Cake className="h-9 w-9 text-primary/70 mx-auto" />
          <p className="text-[11px] font-semibold text-foreground/80 line-clamp-1">
            {categoryName}
          </p>
        </div>
      )}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
        <Badge variant="secondary" className="text-[10px] bg-background/90 backdrop-blur">
          {categoryName}
        </Badge>
      </div>
      <div className="absolute top-2.5 right-2.5">
        <Badge
          variant={product.availability === 'READY' ? 'default' : 'outline'}
          className="text-[10px] bg-background/90 text-foreground backdrop-blur"
        >
          {product.availability === 'READY' ? 'Ready Stock' : 'Pre-Order'}
        </Badge>
      </div>
    </div>
  );
}

function resolveGoogleMapsUrls(rawUrl?: string, fallbackQuery?: string) {
  const query = encodeURIComponent(fallbackQuery || 'Jakarta');
  const fallbackEmbed = `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const fallbackOpen = `https://maps.google.com/?q=${query}`;

  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return { embedUrl: fallbackEmbed, openUrl: fallbackOpen };
  }

  // Support jika user menempelkan tag <iframe src="..."></iframe> langsung dari Google Maps
  const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  const cleanUrl = iframeSrcMatch ? iframeSrcMatch[1] : trimmed;

  if (cleanUrl.includes('/maps/embed') || cleanUrl.includes('output=embed')) {
    return { embedUrl: cleanUrl, openUrl: cleanUrl };
  }

  const coordMatch = cleanUrl.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (coordMatch) {
    const coords = `${coordMatch[1]},${coordMatch[2]}`;
    return {
      embedUrl: `https://maps.google.com/maps?q=${coords}&t=&z=15&ie=UTF8&iwloc=&output=embed`,
      openUrl: cleanUrl,
    };
  }

  if (/^https?:\/\//i.test(cleanUrl) && /[?&]q=/.test(cleanUrl)) {
    return {
      embedUrl: `${cleanUrl}&output=embed`,
      openUrl: cleanUrl,
    };
  }

  return {
    embedUrl: fallbackEmbed,
    openUrl: /^https?:\/\//i.test(cleanUrl) ? cleanUrl : fallbackOpen,
  };
}

export function App({ initialPage, onNavigate }: CakeAppProps = {}) {
  const resolveInitialPage = (): ActivePage => {
    if (initialPage) return initialPage;
    if (typeof window !== 'undefined' && window.location.pathname.endsWith('/admin')) {
      return 'admin';
    }
    return 'catalog';
  };

  const [page, setPage] = useState<ActivePage>(resolveInitialPage);
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [store, setStore] = useState<CakeStoreSettings | null>(null);
  const [rules, setRules] = useState<CakePoRule | null>(null);
  const [categories, setCategories] = useState<CakeCategory[]>([]);
  const [areas, setAreas] = useState<CakeDeliveryArea[]>([]);
  const [allProducts, setAllProducts] = useState<CakeProduct[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CakeProduct[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotalPages, setCatalogTotalPages] = useState(1);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  const [gallery, setGallery] = useState<CakeGalleryItem[]>([]);
  const [promos, setPromos] = useState<CakePromo[]>([]);
  const [reviews, setReviews] = useState<CakeReview[]>([]);
  const [faqs, setFaqs] = useState<CakeFaq[]>([]);
  const [leads, setLeads] = useState<CakeLead[]>([]);

  // Server-side catalog filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');
  const [activeProduct, setActiveProduct] = useState<CakeProduct | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // FAQ & Lead filters
  const [faqCategory, setFaqCategory] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('');

  const hasSession = Boolean(authStore.getToken() && authStore.getUser());

  useEffect(() => {
    if (initialPage) {
      setPage(initialPage === 'admin' && !hasSession ? 'catalog' : initialPage);
    }
  }, [initialPage, hasSession]);

  useEffect(() => {
    if (store?.store_name) {
      document.title = store.motto
        ? `${store.store_name} — ${store.motto}`
        : `${store.store_name} — Katalog Kue`;
    }
  }, [store]);

  useEffect(() => {
    if (!onNavigate) {
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, [isDark, onNavigate]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setCatalogPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const hasSession = Boolean(authStore.getToken());

      const results = await Promise.allSettled([
        fetchCakeFormRows<CakeStoreSettings>('store'),
        fetchCakeFormRows<CakePoRule>('rules'),
        fetchCakeFormRows<CakeCategory>('categories'),
        fetchCakeFormRows<CakeDeliveryArea>('areas'),
        fetchCakeFormRows<CakeProduct>('products'),
        fetchCakeFormRows<CakeGalleryItem>('gallery'),
        fetchCakeFormRows<CakePromo>('promos'),
        fetchCakeFormRows<CakeReview>('reviews'),
        fetchCakeFormRows<CakeFaq>('faqs'),
        hasSession ? fetchAuthenticatedFormRows<CakeLead>('leads') : Promise.resolve([]),
      ]);

      const val = <T,>(idx: number): T[] =>
        results[idx]?.status === 'fulfilled' ? (results[idx] as PromiseFulfilledResult<T[]>).value : [];

      setStore(val<CakeStoreSettings>(0)[0] || null);
      setRules(val<CakePoRule>(1)[0] || null);
      setCategories(val<CakeCategory>(2).filter((c) => c.status === 'ACTIVE'));
      setAreas(val<CakeDeliveryArea>(3));
      setAllProducts(val<CakeProduct>(4));
      setGallery(val<CakeGalleryItem>(5));
      setPromos(val<CakePromo>(6));
      setReviews(val<CakeReview>(7));
      setFaqs(val<CakeFaq>(8));
      setLeads(val<CakeLead>(9));

      const failedCount = results.filter((r) => r.status === 'rejected').length;
      if (failedCount === results.length) {
        setError('Tidak dapat terhubung ke layanan data Cake Platform.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data Cake Marketing Platform.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Server-side catalog filtering & pagination
  const loadCatalogPage = useCallback(async () => {
    try {
      setIsCatalogLoading(true);
      const filters: Record<string, string> = {};
      if (selectedCategory) filters.kategori = selectedCategory;
      if (availabilityFilter) filters.availability = availabilityFilter;

      const res = await fetchPublicFormPage<CakeProduct>('products', {
        page: catalogPage,
        limit: 9,
        search: debouncedSearch,
        filters,
      });

      let rows = res.rows;
      if (sortBy === 'price_asc' || sortBy === 'price_desc') {
        rows = [...rows].sort((a, b) => {
          const pa = Number(a.varian?.[0]?.harga || 0);
          const pb = Number(b.varian?.[0]?.harga || 0);
          return sortBy === 'price_asc' ? pa - pb : pb - pa;
        });
      }
      setCatalogProducts(rows);
      setCatalogTotal(res.total);
      setCatalogTotalPages(res.totalPages);
    } catch {
      setCatalogProducts(allProducts);
    } finally {
      setIsCatalogLoading(false);
    }
  }, [catalogPage, debouncedSearch, selectedCategory, availabilityFilter, sortBy, allProducts]);

  useEffect(() => {
    loadCatalogPage();
  }, [loadCatalogPage]);

  const approvedReviews = useMemo(
    () => reviews.filter((r) => r.status_moderasi === 'APPROVED'),
    [reviews]
  );

  const faqCategories = useMemo(
    () => Array.from(new Set(faqs.map((f) => f.kategori_faq).filter(Boolean))),
    [faqs]
  );

  const filteredFaqs = useMemo(
    () => (faqCategory ? faqs.filter((f) => f.kategori_faq === faqCategory) : faqs),
    [faqs, faqCategory]
  );

  const filteredLeads = useMemo(
    () => (leadStatusFilter ? leads.filter((l) => l.status_lead === leadStatusFilter) : leads),
    [leads, leadStatusFilter]
  );

  const dealCount = leads.filter((l) => l.status_lead === 'DEAL').length;
  const conversionRate = leads.length > 0 ? ((dealCount / leads.length) * 100).toFixed(1) : '0.0';

  const isOpenNow = isStoreCurrentlyOpen(store?.open_time, store?.close_time);
  const waNumber = (store?.whatsapp || '6281234567890').replace(/[^0-9]/g, '');

  const getPrimaryImageUrl = (kodeProduk: string) => {
    const items = gallery.filter((g) => {
      const code = typeof g.produk === 'object' ? g.produk?.kode_produk : g.produk;
      return code === kodeProduk;
    });
    const full = items.find((i) => i.jenis_foto === 'Full Product') || items[0];
    return full?.image_file?.fileUrl || full?.image_file?.url || full?.image_url;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-200 border-b border-border/80 bg-card/95 backdrop-blur" style={{ zIndex: 200 }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Cake className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base tracking-tight">
                  {store?.store_name || 'Sweet Bliss Bakery'}
                </span>
                <Badge
                  className={`text-[10px] ${
                    isOpenNow
                      ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-700 border-rose-500/30'
                  }`}
                >
                  {isOpenNow ? 'Sedang Buka' : 'Sedang Tutup'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                {store?.motto && <span className="italic text-foreground/80">{store.motto}</span>}
                {store?.motto && <span>•</span>}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {store?.open_time || '08:00'} – {store?.close_time || '21:00'}
                </span>
                <span>•</span>
                <span>Kuota PO: {rules?.daily_po_quota ?? 15} kue/hari</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'catalog', label: 'Katalog Kue', Icon: Store },
              { id: 'custom', label: 'Custom Cake', Icon: Sparkles },
              { id: 'about', label: 'Tentang & FAQ', Icon: HelpCircle },
              { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
              ...(hasSession ? [{ id: 'admin', label: 'Admin Cake', Icon: Settings }] : []),
            ].map(({ id, label, Icon }) => (
              <Button
                key={id}
                type="button"
                variant={page === id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPage(id as ActivePage)}
                className="h-8 text-xs gap-1.5"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Button>
            ))}
            {!onNavigate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDark((d) => !d)}
                className="h-8 w-8 p-0"
                title={isDark ? 'Mode Terang' : 'Mode Gelap'}
              >
                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                loadAllData();
                loadCatalogPage();
              }}
              className="h-8 w-8 p-0"
              title="Muat ulang data live dari api-noted"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isCatalogLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading && allProducts.length === 0 ? (
          <div className="py-20 text-center text-xs text-muted-foreground space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p>Memuat katalog kue &amp; data live dari server...</p>
          </div>
        ) : page === 'catalog' ? (
          <>
            {/* Hero Banner */}
            <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-amber-500/5 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px]">
                  Katalog Digital Resmi • {store?.halal_cert_no ? `Halal ${store.halal_cert_no}` : 'Freshly Baked'}
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {store?.tagline || 'Kue Premium Freshly Baked untuk Setiap Momen Spesial'}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Pilih varian ukuran favorit Anda atau rancang custom cake sesuai tema acara. Konsultasi dan pemesanan langsung terhubung ke WhatsApp admin.
                </p>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <Button
                    type="button"
                    onClick={() => setPage('custom')}
                    className="gap-1.5 text-xs"
                  >
                    <Sparkles className="h-4 w-4" /> Pesan Custom Cake
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `https://wa.me/${waNumber}?text=${encodeURIComponent('Halo Admin, saya ingin bertanya tentang katalog kue.')}`,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                    className="gap-1.5 text-xs"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-600" /> Chat WhatsApp
                  </Button>
                </div>
              </div>

              {/* Promo Berjalan */}
              {promos.length > 0 && (
                <div className="w-full md:w-80 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-primary" /> Promo Berjalan
                  </span>
                  {promos.map((pr) => (
                    <div
                      key={pr.kode_promo}
                      className="p-3 rounded-xl border border-amber-500/30 bg-card shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-foreground">{pr.judul_promo}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {pr.kode_promo}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {pr.promo_type === 'FREE_SHIPPING'
                          ? 'Gratis Ongkir Wilayah Tertentu'
                          : `Potongan ${pr.nilai_diskon || 0}%`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Server-Side Filter & Search Bar */}
            <section className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari brownies, birthday cake, wedding..."
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <SelectField
                  value={selectedCategory}
                  onChange={(v) => { setSelectedCategory(v); setCatalogPage(1); }}
                  options={[
                    { value: '', label: 'Semua Kategori' },
                    ...categories.map((c) => ({
                      value: c.kode_kategori,
                      label: c.nama_kategori,
                    })),
                  ]}
                />
                <SelectField
                  value={availabilityFilter}
                  onChange={(v) => { setAvailabilityFilter(v); setCatalogPage(1); }}
                  options={[
                    { value: '', label: 'Semua Ketersediaan' },
                    { value: 'READY', label: 'Ready Stock' },
                    { value: 'PRE_ORDER', label: 'Pre-Order' },
                  ]}
                />
                <SelectField
                  value={sortBy}
                  onChange={(v) => setSortBy(v as any)}
                  options={[
                    { value: 'default', label: 'Urutan Default' },
                    { value: 'price_asc', label: 'Harga Terendah' },
                    { value: 'price_desc', label: 'Harga Tertinggi' },
                  ]}
                />
              </div>

              {/* Product Grid */}
              {catalogProducts.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
                  Tidak ada produk yang cocok dengan filter pencarian.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catalogProducts.map((p) => {
                      const catName =
                        typeof p.kategori === 'object'
                          ? p.kategori?.nama_kategori
                          : String(p.kategori || 'Kue');
                      const minPrice = Math.min(
                        ...(p.varian || []).map((v) => Number(v.harga || 0)),
                        0
                      );
                      const startPrice = Number(p.varian?.[0]?.harga || minPrice || 0);

                      return (
                        <Card
                          key={p.kode_produk}
                          className="group overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-all"
                        >
                          <ProductCardMedia
                            product={p}
                            categoryName={catName}
                            imageUrl={getPrimaryImageUrl(p.kode_produk)}
                          />
                          <CardHeader className="pb-2 pt-3">
                            <CardTitle className="text-base flex items-center justify-between gap-2">
                              <span>{p.nama_produk}</span>
                              {p.featured === 'Ya' && (
                                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 text-xs flex-1 flex flex-col justify-between">
                            <p className="text-muted-foreground line-clamp-2">{p.deskripsi}</p>

                            <div className="space-y-2 pt-2 border-t border-border/50">
                              <div className="flex items-baseline justify-between">
                                <span className="text-[11px] text-muted-foreground">
                                  Mulai dari ({p.varian?.[0]?.nama_varian || 'Standard'})
                                </span>
                                <span className="text-sm font-extrabold text-primary font-mono">
                                  Rp {startPrice.toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>Estimasi: {p.preparation_time}</span>
                                <span>{p.varian?.length || 0} varian</span>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => setActiveProduct(p)}
                                className="w-full h-8 text-xs gap-1.5 mt-1"
                              >
                                <MessageCircle className="h-3.5 w-3.5" /> Lihat Detail &amp; Pesan
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {catalogTotalPages > 1 && (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2">
                      <span>Menampilkan {catalogProducts.length} dari {catalogTotal} produk</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={catalogPage <= 1}
                          onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                          className="h-7 px-2 text-xs"
                        >
                          Sebelumnya
                        </Button>
                        <span className="font-semibold text-foreground">{catalogPage} / {catalogTotalPages}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={catalogPage >= catalogTotalPages}
                          onClick={() => setCatalogPage((p) => Math.min(catalogTotalPages, p + 1))}
                          className="h-7 px-2 text-xs"
                        >
                          Berikutnya
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Delivery Areas & Reviews */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" /> Area Pengiriman &amp; Pickup
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {areas.map((a) => (
                    <div
                      key={a.kode_area}
                      className="p-2.5 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" /> {a.nama_area}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Delivery: {a.delivery_available} • Pickup: {a.pickup_available}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-primary">
                        Rp {Number(a.ongkir).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Ulasan Pelanggan ({approvedReviews.length})
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReviewModalOpen(true)}
                    className="h-7 text-[11px] gap-1"
                  >
                    <Star className="h-3 w-3" /> Tulis Ulasan
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {approvedReviews.length === 0 ? (
                    <p className="text-muted-foreground">Belum ada ulasan disetujui.</p>
                  ) : (
                    approvedReviews.map((r, i) => {
                      const prodName =
                        typeof r.produk === 'object' ? r.produk?.nama_produk : r.produk;
                      return (
                        <div key={i} className="p-2.5 rounded-xl border border-border/70 bg-muted/10 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">
                              {r.customer_name}{' '}
                              <span className="font-normal text-muted-foreground">• {prodName}</span>
                            </span>
                            <span className="text-amber-500 font-bold">
                              {'★'.repeat(Number(r.rating || 5))}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{r.komentar}</p>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        ) : page === 'custom' ? (
          <CustomCakeSection
            products={allProducts}
            areas={areas}
            store={store}
            rules={rules}
            onSubmitted={loadAllData}
          />
        ) : page === 'about' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" /> Identitas &amp; Tentang {store?.store_name || 'Kami'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs leading-relaxed">
                {store?.motto && (
                  <p className="font-semibold text-primary italic">&ldquo;{store.motto}&rdquo;</p>
                )}
                <p>{store?.about_story || 'Kami menghadirkan kue berkualitas premium dengan bahan pilihan bersertifikasi halal.'}</p>

                {(store?.vision || store?.mission) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {store?.vision && (
                      <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                        <strong className="block text-foreground mb-0.5">Visi</strong>
                        <span className="text-muted-foreground">{store.vision}</span>
                      </div>
                    )}
                    {store?.mission && (
                      <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                        <strong className="block text-foreground mb-0.5">Misi</strong>
                        <span className="text-muted-foreground">{store.mission}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                  <div><strong>Alamat Workshop:</strong> {store?.address || '-'}</div>
                  <div><strong>Jam Operasional:</strong> {store?.open_time || '08:00'} – {store?.close_time || '21:00'}</div>
                  {store?.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {store.phone}</div>}
                  {store?.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {store.email}</div>}
                  {store?.halal_cert_no && <div><strong>Sertifikat Halal:</strong> {store.halal_cert_no}</div>}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1"
                    onClick={() => window.open(`https://wa.me/${waNumber}`, '_blank', 'noopener,noreferrer')}
                  >
                    <MessageCircle className="h-3 w-3 text-emerald-600" /> WhatsApp
                  </Button>
                  {store?.instagram && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1"
                      onClick={() => window.open(store.instagram, '_blank', 'noopener,noreferrer')}
                    >
                      <Globe className="h-3 w-3 text-pink-600" /> Instagram
                    </Button>
                  )}
                  {store?.tiktok && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1"
                      onClick={() => window.open(store.tiktok, '_blank', 'noopener,noreferrer')}
                    >
                      <Globe className="h-3 w-3" /> TikTok
                    </Button>
                  )}
                  {(() => {
                    const maps = resolveGoogleMapsUrls(
                      store?.google_maps_url,
                      store?.address || store?.store_name || 'Bekasi'
                    );
                    return (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] gap-1"
                        onClick={() => window.open(maps.openUrl, '_blank', 'noopener,noreferrer')}
                      >
                        <MapPin className="h-3 w-3 text-primary" /> Google Maps <ExternalLink className="h-2.5 w-2.5" />
                      </Button>
                    );
                  })()}
                </div>

                {(store?.google_maps_url || store?.address) && (() => {
                  const maps = resolveGoogleMapsUrls(
                    store?.google_maps_url,
                    store?.address || store?.store_name || 'Bekasi'
                  );
                  return (
                    <div className="rounded-xl overflow-hidden border border-border/70 bg-muted/20">
                      <iframe
                        title={`Lokasi ${store?.store_name || 'Toko'}`}
                        src={maps.embedUrl}
                        className="w-full h-56 border-0"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  );
                })()}

                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-primary">
                    <ShieldCheck className="h-4 w-4" /> Syarat Order &amp; Kepatuhan UU PDP
                  </div>
                  <p className="text-muted-foreground">
                    Pesanan custom cake minimal H-{rules?.min_po_days ?? 2} dengan DP {rules?.dp_percent ?? 50}%. Data nomor WhatsApp dan alamat pengiriman hanya digunakan untuk keperluan konfirmasi serta pengantaran pesanan.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" /> Pertanyaan Umum (FAQ)
                </CardTitle>
                {faqCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFaqCategory('')}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer ${
                        !faqCategory ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      Semua
                    </button>
                    {faqCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFaqCategory(cat)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer ${
                          faqCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-muted-foreground'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {filteredFaqs.map((faq, idx) => (
                  <Collapsible key={idx} defaultOpen={idx === 0} className="rounded-xl border border-border/70 bg-muted/10">
                    <CollapsibleTrigger className="w-full p-3 flex items-center justify-between gap-2 text-left font-bold text-foreground cursor-pointer hover:bg-muted/20 rounded-xl">
                      <span>{faq.pertanyaan}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {faq.kategori_faq}
                        </Badge>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-3 pb-3 text-muted-foreground">
                      {faq.jawaban}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : page === 'admin' && hasSession ? (
          <AdminCakeHub
            productsCount={allProducts.length}
            categoriesCount={categories.length}
            promosCount={promos.length}
            reviews={reviews}
            leads={leads}
            onNavigate={onNavigate}
          />
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Total Produk', value: allProducts.length },
                { label: 'Kategori Aktif', value: categories.length },
                { label: 'Promo Berjalan', value: promos.length },
                { label: 'Total Lead WA', value: leads.length },
                { label: 'Conversion Rate', value: `${conversionRate}%` },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <span className="text-[11px] text-muted-foreground block">{stat.label}</span>
                    <span className="text-2xl font-extrabold text-primary font-mono">{stat.value}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Pipeline Lead &amp; Konversi WhatsApp
                </CardTitle>
                <div className="w-full sm:w-48">
                  <SelectField
                    size="sm"
                    value={leadStatusFilter}
                    onChange={setLeadStatusFilter}
                    options={[
                      { value: '', label: 'Semua Status Lead' },
                      { value: 'NEW_CLICK', label: 'NEW_CLICK' },
                      { value: 'FOLLOW_UP', label: 'FOLLOW_UP' },
                      { value: 'DEAL', label: 'DEAL' },
                      { value: 'CANCELLED', label: 'CANCELLED' },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {!authStore.getToken() ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    Data pipeline lead hanya dapat dilihat oleh pengguna yang sudah login di Portal (`localhost:4200`).
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border/80">
                          <th className="py-2 px-3">Kode Lead</th>
                          <th className="py-2 px-3">Produk</th>
                          <th className="py-2 px-3">Varian</th>
                          <th className="py-2 px-3">Area</th>
                          <th className="py-2 px-3">Estimasi</th>
                          <th className="py-2 px-3">Source</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {filteredLeads.map((ld, i) => {
                          const prodName =
                            typeof ld.produk === 'object' ? ld.produk?.nama_produk : ld.produk;
                          const areaName =
                            typeof ld.area_kirim === 'object' ? ld.area_kirim?.nama_area : ld.area_kirim;
                          return (
                            <tr key={ld.lead_id || i} className="hover:bg-muted/20">
                              <td className="py-2.5 px-3 font-mono font-semibold">{ld.lead_id}</td>
                              <td className="py-2.5 px-3">{prodName}</td>
                              <td className="py-2.5 px-3">{ld.varian_dipilih}</td>
                              <td className="py-2.5 px-3">{areaName}</td>
                              <td className="py-2.5 px-3 font-mono">
                                Rp {Number(ld.estimasi_total || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="py-2.5 px-3">{ld.utm_source}</td>
                              <td className="py-2.5 px-3">
                                <Badge
                                  variant={ld.status_lead === 'DEAL' ? 'default' : 'outline'}
                                  className="text-[10px]"
                                >
                                  {ld.status_lead}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <footer className="border-t border-border/60 bg-card/50 py-4 px-4 text-center text-[11px] text-muted-foreground">
        {store?.store_name || 'Sweet Bliss Bakery'} • Cake Marketing Platform v1.1 • Terhubung Live ke MFC Noted API
      </footer>

      {/* Floating WhatsApp CTA (tampil di halaman pelanggan) */}
      {page !== 'admin' && page !== 'analytics' && (
        <button
          type="button"
          onClick={() =>
            window.open(
              `https://wa.me/${waNumber}?text=${encodeURIComponent('Halo Admin, saya ingin konsultasi pemesanan kue.')}`,
              '_blank',
              'noopener,noreferrer'
            )
          }
          className="fixed z-40 h-12 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center gap-2 text-xs font-bold cursor-pointer transition-transform hover:scale-105"
          style={{ bottom: '5px', right: '5px' }}
          title="Chat Admin via WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Chat WhatsApp</span>
        </button>
      )}

      <ProductDetailDialog
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        areas={areas}
        gallery={gallery}
        reviews={reviews}
        store={store}
        onLeadLogged={loadAllData}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        products={allProducts}
        onSubmitted={loadAllData}
      />
    </div>
  );
}

export default App;
