import React, { useMemo, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Input, SelectField, Textarea } from '@org/ui';
import { authStore } from '@org/auth';
import { AlertCircle, Cake, CheckCircle2, MessageCircle, Sparkles } from 'lucide-react';
import type { CakeDeliveryArea, CakePoRule, CakeProduct, CakeStoreSettings } from '../types/cake';
import { submitAuthenticatedCakeForm, submitPublicCakeForm } from '../config/cake-api';

interface CustomCakeSectionProps {
  products: CakeProduct[];
  areas: CakeDeliveryArea[];
  store: CakeStoreSettings | null;
  rules: CakePoRule | null;
  onSubmitted?: () => void;
}

const DEFAULT_ADDONS = [
  { addon_name: 'Topper Fondant', addon_price: 35000 },
  { addon_name: 'Lilin Angka', addon_price: 10000 },
  { addon_name: 'Kartu Ucapan', addon_price: 5000 },
];

export function CustomCakeSection({ products, areas, store, rules, onSubmitted }: CustomCakeSectionProps) {
  const [namaPemesan, setNamaPemesan] = useState('');
  const [noWhatsapp, setNoWhatsapp] = useState('');
  const [produkKode, setProdukKode] = useState(products[0]?.kode_produk || '');
  const [areaKode, setAreaKode] = useState(areas[0]?.kode_area || '');
  const [tanggalAcara, setTanggalAcara] = useState('');
  const [ucapan, setUcapan] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [catatanDesain, setCatatanDesain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const minPoDays = Number(rules?.min_po_days ?? 2);
  const dailyPoQuota = Number(rules?.daily_po_quota ?? 15);
  const cutoffTime = rules?.cutoff_time || '15:00';
  const dpPercent = Number(rules?.dp_percent ?? 50);
  const addonList = useMemo(
    () => (Array.isArray(rules?.addons) && rules.addons.length > 0 ? rules.addons : DEFAULT_ADDONS),
    [rules]
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.kode_produk === produkKode) || products[0] || null,
    [products, produkKode]
  );
  const selectedArea = useMemo(
    () => areas.find((a) => a.kode_area === areaKode) || areas[0] || null,
    [areas, areaKode]
  );

  const basePrice = Number(selectedProduct?.varian?.[0]?.harga || 0);
  const addonsPrice = selectedAddons.reduce((acc, label) => {
    const found = addonList.find((a) => a.addon_name === label);
    return acc + Number(found?.addon_price || 0);
  }, 0);
  const ongkir = Number(selectedArea?.ongkir || 0);
  const totalEstimasi = basePrice + addonsPrice + ongkir;

  const minDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + minPoDays);
    return d.toISOString().split('T')[0];
  }, [minPoDays]);

  const toggleAddon = (name: string) => {
    setSelectedAddons((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPemesan.trim() || !noWhatsapp.trim() || !tanggalAcara || !ucapan.trim()) {
      setError('Nama pemesan, nomor WhatsApp, tanggal acara, dan ucapan wajib diisi.');
      return;
    }
    if (tanggalAcara < minDateStr) {
      setError(`Pesanan custom cake minimal H-${minPoDays} dari tanggal hari ini.`);
      return;
    }

    const payload = {
      nama_pemesan: namaPemesan.trim(),
      no_whatsapp: noWhatsapp.trim(),
      produk_dasar: selectedProduct
        ? { kode_produk: selectedProduct.kode_produk, nama_produk: selectedProduct.nama_produk }
        : { kode_produk: '-', nama_produk: 'Custom Cake' },
      area_kirim: selectedArea
        ? { kode_area: selectedArea.kode_area, nama_area: selectedArea.nama_area, ongkir }
        : { kode_area: 'PICKUP', nama_area: 'Pickup Toko', ongkir: 0 },
      tanggal_acara: tanggalAcara,
      ucapan: ucapan.trim(),
      add_ons: selectedAddons,
      catatan_desain: catatanDesain.trim(),
    };

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMsg(null);
      if (authStore.getToken()) {
        await submitAuthenticatedCakeForm('customCake', payload, namaPemesan.trim());
      } else {
        await submitPublicCakeForm('customCake', payload, namaPemesan.trim());
      }
      setSuccessMsg(
        `Permintaan custom cake berhasil dikirim! Estimasi total: Rp ${totalEstimasi.toLocaleString('id-ID')}.`
      );
      onSubmitted?.();
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim permintaan custom cake.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmWa = () => {
    const waNumber = (store?.whatsapp || '6281234567890').replace(/[^0-9]/g, '');
    const msg = [
      'Halo Admin, saya baru mengajukan Custom Cake via Website:',
      `Nama: ${namaPemesan || '-'}`,
      `Produk Dasar: ${selectedProduct?.nama_produk || '-'}`,
      `Tanggal Acara: ${tanggalAcara || '-'}`,
      `Ucapan: ${ucapan || '-'}`,
      `Add-on: ${selectedAddons.join(', ') || 'Tidak ada'}`,
      `Area Kirim: ${selectedArea?.nama_area || '-'}`,
      `Estimasi Total: Rp ${totalEstimasi.toLocaleString('id-ID')}`,
    ].join('\n');
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cake className="h-5 w-5 text-primary" />
            Formulir Permintaan Custom Cake (Min. H-{minPoDays})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmWa}
                  className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Lanjut ke WhatsApp
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold">Nama Pemesan *</label>
                <Input
                  value={namaPemesan}
                  onChange={(e) => setNamaPemesan(e.target.value)}
                  placeholder="Contoh: Siti Rahma"
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Nomor WhatsApp *</label>
                <Input
                  value={noWhatsapp}
                  onChange={(e) => setNoWhatsapp(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="h-8 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold">Produk Dasar</label>
                <SelectField
                  size="sm"
                  value={selectedProduct?.kode_produk || ''}
                  onChange={setProdukKode}
                  options={products.map((p) => ({
                    value: p.kode_produk,
                    label: `${p.nama_produk} (mulai Rp ${Number(p.varian?.[0]?.harga || 0).toLocaleString('id-ID')})`,
                  }))}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Area Pengiriman</label>
                <SelectField
                  size="sm"
                  value={selectedArea?.kode_area || ''}
                  onChange={setAreaKode}
                  options={areas.map((a) => ({
                    value: a.kode_area,
                    label: `${a.nama_area} (+Rp ${Number(a.ongkir).toLocaleString('id-ID')})`,
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold">Tanggal Acara / Kirim (Min H-{minPoDays}) *</label>
                <Input
                  type="date"
                  min={minDateStr}
                  value={tanggalAcara}
                  onChange={(e) => setTanggalAcara(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Teks Ucapan di Kue *</label>
                <Input
                  value={ucapan}
                  onChange={(e) => setUcapan(e.target.value)}
                  placeholder="Happy Birthday..."
                  className="h-8 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold block">Tambahan Add-On (Sesuai Aturan Toko)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {addonList.map((opt) => (
                  <label
                    key={opt.addon_name}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border bg-muted/20 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedAddons.includes(opt.addon_name)}
                        onCheckedChange={() => toggleAddon(opt.addon_name)}
                      />
                      <span>{opt.addon_name}</span>
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-primary">
                      +Rp {Number(opt.addon_price || 0).toLocaleString('id-ID')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Catatan Warna &amp; Tema</label>
              <Textarea
                value={catatanDesain}
                onChange={(e) => setCatatanDesain(e.target.value)}
                placeholder="Misal: Tema pastel pink & unicorn, cream tidak terlalu manis..."
                className="text-xs"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan Custom Cake'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Kalkulator Ringkasan */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-sm">Kalkulator Estimasi Biaya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Produk Dasar ({selectedProduct?.nama_produk || '-'})</span>
            <span className="font-mono font-semibold">Rp {basePrice.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Add-On ({selectedAddons.length} item)</span>
            <span className="font-mono font-semibold">Rp {addonsPrice.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ongkir ({selectedArea?.nama_area || '-'})</span>
            <span className="font-mono font-semibold">Rp {ongkir.toLocaleString('id-ID')}</span>
          </div>
          <div className="pt-3 border-t border-border flex justify-between items-center">
            <span className="font-bold text-foreground">Estimasi Total</span>
            <span className="text-lg font-extrabold text-primary font-mono">
              Rp {totalEstimasi.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 text-[11px] text-muted-foreground space-y-1">
            <div>Kuota produksi harian: <strong>{dailyPoQuota} slot/hari</strong></div>
            <div>Cut-off order harian: <strong>{cutoffTime}</strong></div>
            <div>Minimal DP order: <strong>{dpPercent}%</strong></div>
            {rules?.notes && <p className="pt-1 italic">{rules.notes}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
