import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@org/ui';
import {
  ShieldCheck,
  Globe,
  Users,
  Lock,
  Copy,
  Check,
  Code2,
  AlertCircle,
  CheckCircle2,
  QrCode,
  ExternalLink,
  MessageCircle,
  Mail,
  Download,
} from 'lucide-react';
import {
  type DataForm,
  type UserFriend,
  type FormAccessRuleDto,
} from '../types';
import { authFetch } from '@org/auth';

interface NoteFormAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: DataForm | null;
  kdJudul: string;
  onSaved: () => void;
  apiBaseUrl?: string;
  authToken?: string;
}

export function NoteFormAccessModal({
  isOpen,
  onClose,
  form,
  kdJudul,
  onSaved,
  apiBaseUrl = 'http://localhost:3002/api',
  authToken = 'dev-bypass-token-2026',
}: NoteFormAccessModalProps) {
  const [sharingMode, setSharingMode] = useState<'PUBLIC' | 'KHUSUS' | 'PRIVATE'>(
    form?.sharingMode || 'PRIVATE'
  );
  const [isLocked, setIsLocked] = useState(form?.isLocked || false);
  const [allowSelfEdit, setAllowSelfEdit] = useState(form?.allowSelfEdit ?? true);

  // Friends List
  const [friends, setFriends] = useState<UserFriend[]>([]);
  const [selectedRules, setSelectedRules] = useState<Record<string, FormAccessRuleDto>>({});
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (form) {
      setSharingMode(form.sharingMode);
      setIsLocked(form.isLocked);
      setAllowSelfEdit(form.allowSelfEdit);

      // Inisialisasi existing access rules
      const rulesMap: Record<string, FormAccessRuleDto> = {};
      if (form.accessRules && form.accessRules.length > 0) {
        form.accessRules.forEach((r) => {
          rulesMap[r.friendUserId] = {
            friendUserId: r.friendUserId,
            friendName: r.friendName,
            friendEmail: r.friendEmail || undefined,
            canSubmit: r.canSubmit,
            canViewAllResponses: r.canViewAllResponses,
            canEditSchema: r.canEditSchema,
          };
        });
      }
      setSelectedRules(rulesMap);
    }
  }, [form, isOpen]);

  // Ambil Friends List dari /api/friends
  useEffect(() => {
    if (isOpen) {
      authFetch(`${apiBaseUrl}/friends`)
        .then((res: Response) => res.json())
        .then((json: any) => {
          if (json.success && Array.isArray(json.data)) {
            setFriends(json.data);
          }
        })
        .catch((err: unknown) => console.warn('Gagal memuat daftar rekan:', err));
    }
  }, [isOpen, apiBaseUrl]);

  if (!form) return null;

  const publicUrl = form.shareSlug
    ? `${window.location.origin}/p/${form.shareSlug}`
    : '';
  const iframeSnippet = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0"></iframe>`;
  const reactSnippet = `// Mount di Host MicroFE Baru:\nimport { FlexibleFormRenderer } from 'compUI/FlexibleFormRenderer';\n\n<FlexibleFormRenderer formId="${form.id}" originHost="nama-host:port" />`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleToggleFriend = (friend: UserFriend) => {
    setSelectedRules((prev) => {
      const copy = { ...prev };
      if (copy[friend.friendUserId]) {
        delete copy[friend.friendUserId];
      } else {
        copy[friend.friendUserId] = {
          friendUserId: friend.friendUserId,
          friendName: friend.friendName,
          friendEmail: friend.friendEmail,
          canSubmit: true,
          canViewAllResponses: false,
          canEditSchema: false,
        };
      }
      return copy;
    });
  };

  const handleUpdateRule = (userId: string, updates: Partial<FormAccessRuleDto>) => {
    setSelectedRules((prev) => {
      if (!prev[userId]) return prev;
      return {
        ...prev,
        [userId]: {
          ...prev[userId],
          ...updates,
        },
      };
    });
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // 1. Simpan access rules & mode
      const payload = {
        sharingMode,
        rules: Object.values(selectedRules),
      };

      const res = await authFetch(`${apiBaseUrl}/notes/${kdJudul}/forms/${form.id}/access`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyimpan hak akses.');
      }

      // 2. Simpan isLocked & allowSelfEdit
      if (form.isLocked !== isLocked || form.allowSelfEdit !== allowSelfEdit) {
        await authFetch(`${apiBaseUrl}/notes/${kdJudul}/forms/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({ isLocked, allowSelfEdit }),
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui pengaturan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/80 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span>Hak Akses & Publikasi Form</span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">
                  #{form.kd}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                {form.tujuan}
              </DialogDescription>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section 1: 3-Tier Mode Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-foreground">
              Pilih Lingkup Publikasi (*Sharing Mode*)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option: PUBLIC */}
              <div
                onClick={() => setSharingMode('PUBLIC')}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
                  sharingMode === 'PUBLIC'
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-border/80 hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Globe className={`h-5 w-5 ${sharingMode === 'PUBLIC' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                  <input
                    type="radio"
                    name="mode"
                    checked={sharingMode === 'PUBLIC'}
                    onChange={() => setSharingMode('PUBLIC')}
                    className="accent-emerald-500"
                  />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-foreground">Public (Bebas Login)</h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    Terbuka umum. Siapapun & host luar bisa mengisi (nama & email tamu).
                  </p>
                </div>
              </div>

              {/* Option: KHUSUS */}
              <div
                onClick={() => setSharingMode('KHUSUS')}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
                  sharingMode === 'KHUSUS'
                    ? 'border-indigo-500 bg-indigo-500/5'
                    : 'border-border/80 hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Users className={`h-5 w-5 ${sharingMode === 'KHUSUS' ? 'text-indigo-500' : 'text-muted-foreground'}`} />
                  <input
                    type="radio"
                    name="mode"
                    checked={sharingMode === 'KHUSUS'}
                    onChange={() => setSharingMode('KHUSUS')}
                    className="accent-indigo-500"
                  />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-foreground">Khusus (Friends List)</h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    Dibatasi hanya untuk rekan terpilih dari daftar pertemanan Anda.
                  </p>
                </div>
              </div>

              {/* Option: PRIVATE */}
              <div
                onClick={() => setSharingMode('PRIVATE')}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
                  sharingMode === 'PRIVATE'
                    ? 'border-amber-500 bg-amber-500/5'
                    : 'border-border/80 hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Lock className={`h-5 w-5 ${sharingMode === 'PRIVATE' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  <input
                    type="radio"
                    name="mode"
                    checked={sharingMode === 'PRIVATE'}
                    onChange={() => setSharingMode('PRIVATE')}
                    className="accent-amber-500"
                  />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-foreground">Private (Pribadi)</h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    Hanya Anda (pemilik form) dan Super Admin yang dapat mengakses.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Mode KHUSUS (Friends List Picker) */}
          {sharingMode === 'KHUSUS' && (
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-indigo-500" />
                    <span>Pilih Rekan dari Friends List ({Object.keys(selectedRules).length} Dipilih)</span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Centang rekan dan tentukan hak akses masing-masing secara granular.
                  </p>
                </div>
              </div>

              {friends.length === 0 ? (
                <div className="p-4 text-center rounded-lg bg-card border border-border/80 text-[11px] text-muted-foreground space-y-1">
                  <p>Anda belum memiliki rekan di Friends List.</p>
                  <p>Buka menu <strong>"Kelola Rekan"</strong> di header untuk mengundang rekan kerja.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {friends.map((f) => {
                    const isSelected = Boolean(selectedRules[f.friendUserId]);
                    const rule = selectedRules[f.friendUserId];

                    return (
                      <div
                        key={f.id}
                        className={`p-3 rounded-lg border transition-all space-y-2 ${
                          isSelected ? 'bg-card border-indigo-500/40 shadow-xs' : 'bg-card/50 border-border/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleFriend(f)}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{f.friendName}</span>
                            <span className="text-muted-foreground text-[10px]">({f.friendEmail})</span>
                          </label>
                        </div>

                        {isSelected && rule && (
                          <div className="flex items-center gap-4 pl-6 text-[11px] text-muted-foreground border-t border-border/40 pt-2 flex-wrap">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rule.canSubmit}
                                onChange={(e) =>
                                  handleUpdateRule(f.friendUserId, { canSubmit: e.target.checked })
                                }
                                className="rounded text-indigo-600"
                              />
                              <span>Boleh Isi Form</span>
                            </label>

                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rule.canViewAllResponses}
                                onChange={(e) =>
                                  handleUpdateRule(f.friendUserId, { canViewAllResponses: e.target.checked })
                                }
                                className="rounded text-indigo-600"
                              />
                              <span>Lihat Semua Respon</span>
                            </label>

                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rule.canEditSchema}
                                onChange={(e) =>
                                  handleUpdateRule(f.friendUserId, { canEditSchema: e.target.checked })
                                }
                                className="rounded text-indigo-600"
                              />
                              <span>Desain Form</span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Section 3: Mode PUBLIC (Multi-Host, Direct Links, WhatsApp & QR Code) */}
          {sharingMode === 'PUBLIC' && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-emerald-500" />
                    <span>Saluran Distribusi & Tautan Formulir Publik</span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Formulir ini terbuka untuk publik tanpa login. Gunakan saluran berikut untuk menyebarkannya.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(publicUrl, '_blank')}
                  className="h-7 text-[11px] gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer shadow-2xs"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Buka Form (Tab Baru)</span>
                </Button>
              </div>

              {/* Direct Link */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground">Tautan Publik Langsung</label>
                <div className="flex items-center gap-1.5">
                  <input
                    readOnly
                    value={publicUrl}
                    className="w-full h-8 px-2.5 text-xs rounded-md border border-border bg-card font-mono text-foreground"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(publicUrl, 'link')}
                    className="h-8 text-xs gap-1 cursor-pointer shrink-0"
                  >
                    {copiedType === 'link' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedType === 'link' ? 'Tersalin' : 'Salin'}</span>
                  </Button>
                </div>
              </div>

              {/* 1-Click Social Sharing Buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Halo, mohon kesediaan Anda mengisi formulir resmi: "${form.tujuan}" melalui tautan berikut:\n${publicUrl}\n\nTerima kasih.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Kirim ke WhatsApp</span>
                </a>

                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    `Undangan Pengisian Formulir: ${form.tujuan}`
                  )}&body=${encodeURIComponent(
                    `Halo,\n\nMohon kesediaan Anda mengisi formulir resmi "${form.tujuan}" melalui tautan berikut:\n${publicUrl}\n\nTerima kasih.`
                  )}`}
                  className="h-8 px-3 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Kirim via Email</span>
                </a>
              </div>

              {/* Dynamic QR Code Box */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-card flex flex-col sm:flex-row items-center gap-4">
                <div className="p-2 rounded-lg bg-white border border-border shrink-0 shadow-2xs">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      publicUrl
                    )}`}
                    alt="QR Code Formulir Publik"
                    className="h-24 w-24 object-contain"
                  />
                </div>
                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <h5 className="font-bold text-xs text-foreground flex items-center justify-center sm:justify-start gap-1">
                    <QrCode className="h-3.5 w-3.5 text-primary" />
                    <span>QR Code Cepat untuk Flyer / Loket / Banner</span>
                  </h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Responden cukup mengarahkan kamera HP ke QR Code ini untuk langsung membuka formulir tanpa repot mengetik alamat URL.
                  </p>
                  <div className="pt-1">
                    <a
                      href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                        publicUrl
                      )}`}
                      download={`QR-${form.shareSlug}.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      <span>Unduh Gambar QR Code Resolusi Tinggi (PNG)</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* React MicroFE Snippet */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                  <Code2 className="h-3.5 w-3.5 text-primary" />
                  <span>React Remote Component (Module Federation)</span>
                </label>
                <div className="relative">
                  <pre className="p-2.5 rounded-lg bg-card border border-border font-mono text-[10px] text-foreground overflow-x-auto">
                    {reactSnippet}
                  </pre>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(reactSnippet, 'react')}
                    className="absolute right-1.5 top-1.5 h-6 px-2 text-[10px] cursor-pointer"
                  >
                    {copiedType === 'react' ? 'Tersalin' : 'Salin Kode'}
                  </Button>
                </div>
              </div>

              {/* Iframe Embed Snippet */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                  <Code2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Iframe Web Embed</span>
                </label>
                <div className="relative">
                  <pre className="p-2.5 rounded-lg bg-card border border-border font-mono text-[10px] text-foreground overflow-x-auto">
                    {iframeSnippet}
                  </pre>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(iframeSnippet, 'iframe')}
                    className="absolute right-1.5 top-1.5 h-6 px-2 text-[10px] cursor-pointer"
                  >
                    {copiedType === 'iframe' ? 'Tersalin' : 'Salin Kode'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Form Status Switches */}
          <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-foreground">Kunci Penerimaan Respon (*Lock Form*)</span>
                <p className="text-[11px] text-muted-foreground">
                  Jika aktif, form ditutup dan tidak dapat menerima respon baru lagi.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <div>
                <span className="font-bold text-xs text-foreground">Izinkan Responden Mengedit Jawaban Sendiri</span>
                <p className="text-[11px] text-muted-foreground">
                  Responden dapat merevisi respon yang telah dikirim.
                </p>
              </div>
              <input
                type="checkbox"
                checked={allowSelfEdit}
                onChange={(e) => setAllowSelfEdit(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border/80 bg-muted/10 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs cursor-pointer"
          >
            Batal
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isSubmitting}
            className="text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan Akses'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
