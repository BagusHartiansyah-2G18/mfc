import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent } from '@org/ui';
import { authStore } from '@org/auth';
import {
  ArrowLeft,
  Cake,
  Check,
  Clock,
  Copy,
  MapPin,
  MessageCircle,
  Share2,
  Star,
} from 'lucide-react';
import type {
  CakeDeliveryArea,
  CakeGalleryItem,
  CakeProduct,
  CakeReview,
  CakeStoreSettings,
} from '../types/cake';
import { API_NOTED_BASE, submitAuthenticatedCakeForm } from '../config/cake-api';

interface ProductDetailPageProps {
  product: CakeProduct;
  onBack: () => void;
  areas: CakeDeliveryArea[];
  gallery: CakeGalleryItem[];
  reviews: CakeReview[];
  store: CakeStoreSettings | null;
  onLeadLogged?: () => void;
}

export function ProductDetailPage({
  product,
  onBack,
  areas,
  gallery,
  reviews,
  store,
  onLeadLogged,
}: ProductDetailPageProps) {
  const variants = Array.isArray(product.varian) ? product.varian : [];
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedAreaCode, setSelectedAreaCode] = useState('PICKUP');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    setSelectedVariantIdx(0);
    setSelectedAreaCode('PICKUP');
    setActivePhotoIdx(0);
    setImgFailed(false);
  }, [product.id]);

  const resolvePhotoUrl = (item?: { image_file?: any; image_url?: string } | null) => {
    if (!item) return '';
    const fileUrl =
      typeof item.image_file === 'string'
        ? item.image_file
        : item.image_file?.fileUrl || item.image_file?.url || '';
    const raw = (fileUrl || item.image_url || '').trim();
    if (!raw) return '';
    return raw.startsWith('/api/') || raw.startsWith('/uploads/')
      ? `http://localhost:3002${raw}`
      : raw;
  };

  const inlinePhotos = (Array.isArray(product.galeri_foto) ? product.galeri_foto : [])
    .map((g) => ({
      jenis_foto: g.jenis_foto || 'Full Product',
      image_url: resolvePhotoUrl(g),
    }))
    .filter((g) => Boolean(g.image_url));

  const legacyPhotos = gallery
    .filter((g) => {
      const code = typeof g.produk === 'object' ? g.produk?.kode_produk : g.produk;
      return code === product.kode_produk;
    })
    .map((g) => ({
      jenis_foto: g.jenis_foto || 'Full Product',
      image_url: resolvePhotoUrl(g),
    }))
    .filter((g) => Boolean(g.image_url));

  const productGallery = [...inlinePhotos, ...legacyPhotos].filter(
    (item, idx, arr) => arr.findIndex((x) => x.image_url === item.image_url) === idx
  );
  const activePhoto = productGallery[activePhotoIdx] || null;

  const activeVariant = variants[selectedVariantIdx] || { nama_varian: 'Standard', harga: 0 };
  const activeArea = areas.find((a) => a.kode_area === selectedAreaCode) || null;
  const ongkir = selectedAreaCode === 'PICKUP' ? 0 : Number(activeArea?.ongkir || 0);
  const totalEstimasi = Number(activeVariant.harga || 0) + ongkir;

  const categoryName =
    typeof product.kategori === 'object'
      ? product.kategori?.nama_kategori
      : String(product.kategori || 'Kue');

  const productReviews = reviews.filter((r) => {
    const code = typeof r.produk === 'object' ? r.produk?.kode_produk : r.produk;
    return code === product.kode_produk && r.status_moderasi === 'APPROVED';
  });

  const slug = encodeURIComponent(product.slug || product.kode_produk);
  const portalOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200';
  const fbShareUrl = `${API_NOTED_BASE}/public/cake/share/${slug}?redirect=${encodeURIComponent(
    portalOrigin
  )}`;

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fbShareUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(fbShareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleOrderWhatsApp = async () => {
    const waNumber = (store?.whatsapp || '6281234567890').replace(/[^0-9]/g, '');
    const areaText =
      selectedAreaCode === 'PICKUP'
        ? 'Ambil di Toko (Pickup)'
        : `${activeArea?.nama_area || ''} (Ongkir Rp ${ongkir.toLocaleString('id-ID')})`;
    const text = `Halo ${store?.store_name || 'Admin'}, saya tertarik memesan:\n*Produk*: ${product.nama_produk}\n*Varian*: ${activeVariant.nama_varian} (Rp ${Number(activeVariant.harga).toLocaleString('id-ID')})\n*Pengiriman*: ${areaText}\n*Estimasi Total*: Rp ${totalEstimasi.toLocaleString('id-ID')}\n\nMohon info ketersediaan jadwal PO/Ready-nya ya.`;

    window.open(
      `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );

    try {
      if (authStore.getToken()) {
        await submitAuthenticatedCakeForm('leads', {
          lead_id: `LD-${Date.now().toString().slice(-6)}`,
          produk: { kode_produk: product.kode_produk, nama_produk: product.nama_produk },
          area_kirim: activeArea
            ? { kode_area: activeArea.kode_area, nama_area: activeArea.nama_area, ongkir }
            : { kode_area: 'PICKUP', nama_area: 'Pickup Toko', ongkir: 0 },
          varian_dipilih: activeVariant.nama_varian,
          estimasi_total: totalEstimasi,
          utm_source: 'detail_page',
          status_lead: 'NEW_CLICK',
        });
        onLeadLogged?.();
      }
    } catch {
      // non-blocking
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Back & Share Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onBack}
          className="h-8 text-xs gap-1.5 w-fit cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Katalog
        </Button>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyShareLink}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            {copiedShare ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedShare ? 'Link Share Tersalin!' : 'Salin Link Preview FB'}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleShareFacebook}
            className="h-8 text-xs gap-1.5 bg-[#1877F2] hover:bg-[#166FE5] text-white cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" /> Bagikan ke Facebook
          </Button>
        </div>
      </div>

      {/* Main Product Detail Card */}
      <Card className="overflow-hidden border-border/80">
        <CardContent className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Gallery */}
          <div className="space-y-3">
            <div className="relative h-72 sm:h-80 rounded-xl overflow-hidden border border-border/70 bg-gradient-to-br from-amber-500/15 via-primary/10 to-rose-500/15 flex items-center justify-center">
              {activePhoto?.image_url && !imgFailed ? (
                <img
                  src={activePhoto.image_url}
                  alt={product.nama_produk}
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center space-y-2 px-4">
                  <Cake className="h-12 w-12 text-primary/70 mx-auto" />
                  <p className="font-semibold text-sm text-foreground">{product.nama_produk}</p>
                  <p className="text-xs text-muted-foreground">
                    {activePhoto?.jenis_foto || 'Full Product'} • {categoryName}
                  </p>
                </div>
              )}
              {activePhoto && (
                <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-background/90 text-[11px] font-semibold border border-border">
                  {activePhoto.jenis_foto}
                </span>
              )}
            </div>

            {productGallery.length > 1 && (
              <div className="flex gap-1.5 flex-wrap">
                {productGallery.map((g, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setActivePhotoIdx(i);
                      setImgFailed(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer ${
                      i === activePhotoIdx
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {g.jenis_foto}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info, Variants, Estimator, CTA */}
          <div className="space-y-4 text-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{categoryName}</Badge>
                  <Badge
                    className={
                      product.availability === 'READY'
                        ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                    }
                  >
                    {product.availability === 'READY' ? 'Ready Stock' : 'Pre-Order'}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {product.preparation_time}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    #{product.kode_produk}
                  </span>
                </div>
                <h1 className="text-xl font-extrabold text-foreground">{product.nama_produk}</h1>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.deskripsi}
                </p>
              </div>

              {variants.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">Pilih Varian / Ukuran</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {variants.map((v, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedVariantIdx(idx)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedVariantIdx === idx
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border bg-card hover:border-primary/40'
                        }`}
                      >
                        <div className="font-semibold text-foreground">{v.nama_varian}</div>
                        <div className="text-primary font-mono font-bold mt-0.5">
                          Rp {Number(v.harga || 0).toLocaleString('id-ID')}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Estimasi Area Pengiriman
                </label>
                <select
                  value={selectedAreaCode}
                  onChange={(e) => setSelectedAreaCode(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs"
                >
                  <option value="PICKUP">Ambil di Toko / Pickup (Rp 0)</option>
                  {areas.map((a) => (
                    <option key={a.kode_area} value={a.kode_area}>
                      {a.nama_area} — Ongkir Rp {Number(a.ongkir || 0).toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground block">Total Estimasi</span>
                  <span className="text-[11px] text-muted-foreground">
                    Harga kue + ongkos kirim
                  </span>
                </div>
                <span className="text-lg font-extrabold text-primary font-mono">
                  Rp {totalEstimasi.toLocaleString('id-ID')}
                </span>
              </div>

              <Button
                type="button"
                onClick={handleOrderWhatsApp}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                Pesan Produk Ini via WhatsApp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      {productReviews.length > 0 && (
        <Card className="border-border/80">
          <CardContent className="p-4 sm:p-5 space-y-2.5 text-xs">
            <h3 className="font-bold text-foreground">
              Ulasan Pelanggan ({productReviews.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {productReviews.map((rev, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{rev.customer_name}</span>
                    <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-500" /> {rev.rating}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{rev.komentar}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
