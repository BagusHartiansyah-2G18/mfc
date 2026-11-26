import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  SelectField,
  Textarea,
} from '@org/ui';
import { AlertCircle, CheckCircle2, Star } from 'lucide-react';
import type { CakeProduct } from '../types/cake';
import { submitPublicCakeForm } from '../config/cake-api';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: CakeProduct[];
  onSubmitted?: () => void;
}

export function ReviewModal({ isOpen, onClose, products, onSubmitted }: ReviewModalProps) {
  const [productCode, setProductCode] = useState(products[0]?.kode_produk || '');
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [komentar, setKomentar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedProduct = products.find((p) => p.kode_produk === productCode) || products[0] || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !komentar.trim() || !selectedProduct) {
      setError('Produk, nama, dan komentar ulasan wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await submitPublicCakeForm(
        'reviews',
        {
          produk: {
            kode_produk: selectedProduct.kode_produk,
            nama_produk: selectedProduct.nama_produk,
          },
          customer_name: customerName.trim(),
          rating,
          status_moderasi: 'PENDING',
          komentar: komentar.trim(),
        },
        customerName.trim()
      );
      setSuccess(true);
      setCustomerName('');
      setKomentar('');
      setRating(5);
      onSubmitted?.();
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim ulasan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setSuccess(false); setError(null); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            Tulis Ulasan Pelanggan
          </DialogTitle>
          <DialogDescription className="text-xs">
            Bagikan pengalaman Anda menikmati kue kami. Ulasan akan ditayangkan setelah moderasi admin.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-2.5 text-xs rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-6 text-center space-y-3 text-xs">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <p className="font-bold text-foreground">Terima kasih atas ulasan Anda!</p>
            <p className="text-muted-foreground">Ulasan Anda sedang menunggu moderasi admin.</p>
            <Button type="button" size="sm" onClick={() => { setSuccess(false); onClose(); }}>
              Tutup
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold">Produk yang Diulas</label>
              <SelectField
                size="sm"
                value={selectedProduct?.kode_produk || ''}
                onChange={setProductCode}
                options={products.map((p) => ({
                  value: p.kode_produk,
                  label: p.nama_produk,
                }))}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Nama Anda *</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Siti Rahma"
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold block">Rating Bintang</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 rounded hover:bg-muted cursor-pointer"
                    title={`${star} Bintang`}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/40'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-1 text-[11px] font-semibold text-muted-foreground">
                  {rating} / 5
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Komentar *</label>
              <Textarea
                value={komentar}
                onChange={(e) => setKomentar(e.target.value)}
                placeholder="Ceritakan rasa, tekstur, dan pengalaman pemesanan..."
                className="text-xs min-h-[80px]"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
