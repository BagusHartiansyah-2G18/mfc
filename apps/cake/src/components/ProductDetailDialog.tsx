import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  SelectField,
} from '@org/ui';
import { Cake, CheckCircle2, Clock, MessageCircle, Sparkles, Star, Truck } from 'lucide-react';
import { authStore } from '@org/auth';
import type { CakeDeliveryArea, CakeGalleryItem, CakeProduct, CakeReview, CakeStoreSettings } from '../types/cake';
import { submitAuthenticatedCakeForm } from '../config/cake-api';

interface ProductDetailDialogProps {
  product: CakeProduct | null;
  onClose: () => void;
  areas: CakeDeliveryArea[];
  gallery: CakeGalleryItem[];
  reviews: CakeReview[];
  store: CakeStoreSettings | null;
  onLeadLogged?: () => void;
}

export function ProductDetailDialog({
  product,
  onClose,
  areas,
  gallery,
  reviews,
  store,
  onLeadLogged,
}: ProductDetailDialogProps) {
  const variants = useMemo(() => (Array.isArray(product?.varian) ? product.varian : []), [product]);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedAreaCode, setSelectedAreaCode] = useState<string>('PICKUP');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [waSent, setWaSent] = useState(false);

  useEffect(() => {
    setSelectedVariantIdx(0);
    setSelectedAreaCode(areas[0]?.kode_area || 'PICKUP');
    setActivePhotoIdx(0);
    setImgFailed(false);
    setWaSent(false);
  }, [product, areas]);

  if (!product) return null;

  const productGallery = gallery.filter((g) => {
    const code = typeof g.produk === 'object' ? g.produk?.kode_produk : g.produk;
    return code === product.kode_produk;
  });
  const activePhoto = productGallery[activePhotoIdx] || null;

  const activeVariant = variants[selectedVariantIdx] || { nama_varian: 'Standard', harga: 0 };
  const activeArea = areas.find((a) => a.kode_area === selectedAreaCode) || null;
  const ongkir = selectedAreaCode === 'PICKUP' ? 0 : Number(activeArea?.ongkir || 0);
  const totalEstimasi = Number(activeVariant.harga || 0) + ongkir;

  const categoryName =
    typeof product.kategori === 'object' ? product.kategori?.nama_kategori : String(product.kategori || 'Kue');

  const productReviews = reviews.filter((r) => {
    const code = typeof r.produk === 'object' ? r.produk?.kode_produk : r.produk;
    return code === product.kode_produk && r.status_moderasi === 'APPROVED';
  });

  const handleOrderWhatsApp = async () => {
    const waNumber = (store?.whatsapp || '6281234567890').replace(/[^0-9]/g, '');
    const areaLabel = selectedAreaCode === 'PICKUP' ? 'Pickup Toko' : activeArea?.nama_area || '-';

    const message = [
      'Halo Admin,',
      '',
      'Saya tertarik dengan produk:',
      `Nama Produk: ${product.nama_produk}`,
      `Variant: ${activeVariant.nama_varian} (Rp ${Number(activeVariant.harga).toLocaleString('id-ID')})`,
      `Pengiriman: ${areaLabel} (Ongkir: Rp ${ongkir.toLocaleString('id-ID')})`,
      `Estimasi Total: Rp ${totalEstimasi.toLocaleString('id-ID')}`,
      '',
      `Tracking: source=website&product=${product.slug}`,
      'Mohon informasi ketersediaannya. Terima kasih.',
    ].join('\n');

    try {
      setIsSending(true);
      if (authStore.getToken()) {
        await submitAuthenticatedCakeForm(
          'leads',
          {
            lead_id: `LD-${Date.now().toString().slice(-6)}`,
            produk: { kode_produk: product.kode_produk, nama_produk: product.nama_produk },
            area_kirim: activeArea
              ? { kode_area: activeArea.kode_area, nama_area: activeArea.nama_area, ongkir }
              : { kode_area: 'PICKUP', nama_area: 'Pickup Toko', ongkir: 0 },
            varian_dipilih: activeVariant.nama_varian,
            estimasi_total: totalEstimasi,
            utm_source: 'website',
            status_lead: 'NEW_CLICK',
          },
          'Pengunjung Portal'
        );
        onLeadLogged?.();
      }
    } catch {
      // Non-blocking lead log so customer can still open WhatsApp
    } finally {
      setIsSending(false);
      setWaSent(true);
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">
              {categoryName}
            </Badge>
            <Badge
              variant={product.availability === 'READY' ? 'default' : 'outline'}
              className="text-[10px]"
            >
              {product.availability === 'READY' ? 'Ready Stock' : 'Pre-Order'}
            </Badge>
            {product.featured === 'Ya' && (
              <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px] gap-1">
                <Sparkles className="h-3 w-3" /> Unggulan
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl font-bold pt-1">{product.nama_produk}</DialogTitle>
          <DialogDescription className="text-xs flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Estimasi: {product.preparation_time}
            </span>
            <span className="font-mono text-[11px]">#{product.kode_produk}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          {/* Galeri Foto Produk */}
          <div className="space-y-2">
            <div className="relative h-48 rounded-xl overflow-hidden border border-border/70 bg-gradient-to-br from-amber-500/15 via-primary/10 to-rose-500/15 flex items-center justify-center">
              {activePhoto?.image_url && !imgFailed ? (
                <img
                  src={activePhoto.image_url}
                  alt={product.nama_produk}
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center space-y-1.5 px-4">
                  <Cake className="h-10 w-10 text-primary/70 mx-auto" />
                  <p className="font-semibold text-foreground">{product.nama_produk}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {activePhoto?.jenis_foto || 'Full Product'} • {categoryName}
                  </p>
                </div>
              )}
              {activePhoto && (
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-background/90 text-[10px] font-semibold border border-border">
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
                    onClick={() => { setActivePhotoIdx(i); setImgFailed(false); }}
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

          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 leading-relaxed text-foreground">
            {product.deskripsi}
          </div>

          {/* Varian */}
          <div className="space-y-2">
            <label className="font-semibold text-foreground block">Pilih Varian / Ukuran</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {variants.map((v, idx) => {
                const active = idx === selectedVariantIdx;
                return (
                  <button
                    key={v.nama_varian}
                    type="button"
                    onClick={() => setSelectedVariantIdx(idx)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <span className="font-semibold text-foreground">{v.nama_varian}</span>
                    <span className="font-mono font-bold text-primary">
                      Rp {Number(v.harga).toLocaleString('id-ID')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Area Pengiriman */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-primary" /> Area Pengiriman / Pickup
            </label>
            <SelectField
              value={selectedAreaCode}
              onChange={setSelectedAreaCode}
              options={[
                { value: 'PICKUP', label: 'Pickup Langsung di Toko (Gratis Ongkir)' },
                ...areas.map((a) => ({
                  value: a.kode_area,
                  label: `${a.nama_area} — Ongkir Rp ${Number(a.ongkir).toLocaleString('id-ID')}`,
                })),
              ]}
            />
          </div>

          {/* Estimasi Total */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-muted-foreground block">Estimasi Total Harga</span>
              <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                Rp {totalEstimasi.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="text-right text-[11px] text-muted-foreground">
              <div>Produk: Rp {Number(activeVariant.harga).toLocaleString('id-ID')}</div>
              <div>Ongkir: Rp {ongkir.toLocaleString('id-ID')}</div>
            </div>
          </div>

          {waSent && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 text-emerald-700 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Lead tercatat! Silakan lanjutkan konfirmasi di WhatsApp.</span>
            </div>
          )}

          {/* Review Produk */}
          {productReviews.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/60">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                Ulasan Pelanggan ({productReviews.length})
              </h4>
              <div className="space-y-2">
                {productReviews.map((rev, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-border/60 bg-card space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{rev.customer_name}</span>
                      <span className="text-amber-500 font-bold">{'★'.repeat(Number(rev.rating || 5))}</span>
                    </div>
                    <p className="text-muted-foreground">{rev.komentar}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button
            type="button"
            disabled={isSending}
            onClick={handleOrderWhatsApp}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <MessageCircle className="h-4 w-4" />
            {isSending ? 'Menghubungkan...' : 'Pesan Sekarang via WhatsApp'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
