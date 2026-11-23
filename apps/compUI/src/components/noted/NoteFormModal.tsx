import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Textarea,
} from '@org/ui';
import {
  PlusCircle,
  Edit3,
  Calendar,
  Wallet,
  User,
  Tag,
  Hash,
  Sparkles,
  Percent,
  Send,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth, authFetch } from '@org/auth';
import { type JudulNote, type NoteFormData } from './types';
import { NoteStatusBadge } from './NoteStatusBadge';

const PRESET_COLLABORATORS = [
  { id: 'usr-2', name: 'Sarah Jenkins', email: 'sarah.j@bgs-software.id', role: 'Project Manager / Approver' },
  { id: 'usr-3', name: 'Budi Pratama', email: 'budi.p@bgs-software.id', role: 'UI/UX Designer' },
  { id: 'usr-4', name: 'Alex Wong', email: 'alex.w@bgs-software.id', role: 'Lead Frontend Engineer' },
  { id: 'usr-5', name: 'Rina Melati', email: 'rina.m@bgs-software.id', role: 'QA & Security Engineer' },
];

interface NoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NoteFormData) => Promise<void>;
  editingNote?: JudulNote | null;
  parentNote?: JudulNote | null;
  currentTingkat: number;
  onScaffoldStages?: (parentKdJudul: string) => Promise<void>;
  apiBaseUrl?: string;
}

export function NoteFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingNote,
  parentNote,
  currentTingkat,
  onScaffoldStages,
  apiBaseUrl = 'http://localhost:3002/api',
}: NoteFormModalProps) {
  const { session } = useAuth();
  const defaultCreatorName = session?.name || session?.username || session?.email || 'Super Administrator';
  const defaultCreatorId = session?.id || 'usr-1';

  const [judul, setJudul] = useState('');
  const [ringkasan, setRingkasan] = useState('');
  const [catatanDetail, setCatatanDetail] = useState('');
  const [status, setStatus] = useState('IN_PROGRESS');
  const [priority, setPriority] = useState('MEDIUM');
  const [stage, setStage] = useState('DEVELOP');
  const [progress, setProgress] = useState(0);

  // Requirement 3: Bobot, Target, dan Batas Waktu default-nya null (kosong)
  const [weight, setWeight] = useState<number | string>('');
  const [targetBudget, setTargetBudget] = useState<number | string>('');
  const [dueDate, setDueDate] = useState('');

  // Requirement 2 & 3: Penanggung Jawab (PIC) default user pembuat, opsi delegasi ke rekan
  const [assignMode, setAssignMode] = useState<'SELF' | 'FRIEND'>('SELF');
  const [picName, setPicName] = useState(defaultCreatorName);
  const [picId, setPicId] = useState(defaultCreatorId);
  const [tags, setTags] = useState('');
  const [sharingMode, setSharingMode] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');

  const [friendsList, setFriendsList] = useState<Array<{ id: string; name: string; email: string; role?: string }>>(PRESET_COLLABORATORS);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(editingNote);

  // Muat daftar teman/anggota dari backend saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;
    const loadFriends = async () => {
      try {
        const res = await authFetch(`${apiBaseUrl}/friends`);
        if (res.ok) {
          const json = await res.json();
          const items = json.data || json;
          if (Array.isArray(items) && items.length > 0) {
            const mapped = items.map((f: any) => ({
              id: f.friendId || f.id,
              name: f.friendName || f.friendEmail || 'Rekan',
              email: f.friendEmail || '',
              role: 'Rekan Terhubung',
            }));
            const combined = [...mapped];
            PRESET_COLLABORATORS.forEach((p) => {
              if (!combined.some((c) => c.id === p.id)) {
                combined.push(p);
              }
            });
            setFriendsList(combined);
          }
        }
      } catch {
        // fallback tetap memakai PRESET_COLLABORATORS
      }
    };
    loadFriends();
  }, [isOpen, apiBaseUrl]);

  useEffect(() => {
    if (editingNote) {
      setJudul(editingNote.judul || '');
      setRingkasan(editingNote.ringkasan || '');
      setCatatanDetail(editingNote.catatanDetail || '');
      setStatus(editingNote.status || 'IN_PROGRESS');
      setPriority(editingNote.priority || 'MEDIUM');
      setStage(editingNote.stage || 'DEVELOP');
      setProgress(editingNote.progress || 0);
      setWeight(
        editingNote.weight !== undefined && editingNote.weight !== null ? editingNote.weight : ''
      );
      setTargetBudget(
        editingNote.targetBudget !== null && editingNote.targetBudget !== undefined
          ? editingNote.targetBudget
          : ''
      );
      setDueDate(editingNote.dueDate ? editingNote.dueDate.split('T')[0] : '');
      const existingPicName = editingNote.picName || defaultCreatorName;
      const existingPicId = editingNote.picId || defaultCreatorId;
      setPicName(existingPicName);
      setPicId(existingPicId);
      setAssignMode(existingPicId && existingPicId !== defaultCreatorId ? 'FRIEND' : 'SELF');
      setTags(editingNote.tags || '');
      setSharingMode(editingNote.sharingMode === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE');
    } else {
      setJudul('');
      setRingkasan('');
      setCatatanDetail('');
      setStatus('IN_PROGRESS');
      setPriority('MEDIUM');
      setStage(currentTingkat === 0 ? 'ANALISIS' : 'DEVELOP');
      setProgress(0);
      // Default: Null untuk Bobot, Target, dan Batas Waktu
      setWeight('');
      setTargetBudget('');
      setDueDate('');
      // Default: User pembuat sebagai Penanggung Jawab
      setPicName(defaultCreatorName);
      setPicId(defaultCreatorId);
      setAssignMode('SELF');
      setTags('');
      setSharingMode('PRIVATE');
    }
    setError(null);
  }, [editingNote, isOpen, currentTingkat, defaultCreatorName, defaultCreatorId]);

  // Kalkulasi Preview Kode Otomatis
  const childTingkat = isEditing ? editingNote!.tingkat : currentTingkat;
  const delimiter = childTingkat === 1 ? 'MFC' : '#';
  const autoCodePreview = parentNote ? `${parentNote.kdJudul}${delimiter}[N]` : '[N]';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      setError('Judul catatan wajib diisi.');
      return;
    }
    if (!ringkasan.trim()) {
      setError('Ringkasan catatan wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        judul: judul.trim(),
        ringkasan: ringkasan.trim(),
        catatanDetail: catatanDetail.trim() || undefined,
        tingkat: isEditing ? editingNote!.tingkat : currentTingkat,
        kdJudul: isEditing ? editingNote!.kdJudul : parentNote?.kdJudul,
        kdMember: isEditing ? editingNote!.kdMember : parentNote?.kdMember,
        status,
        priority,
        stage,
        progress: Number(progress),
        weight: weight !== '' && weight !== null ? Number(weight) : undefined,
        targetBudget: targetBudget !== '' && targetBudget !== null ? Number(targetBudget) : undefined,
        dueDate: dueDate || undefined,
        picName: picName.trim() || undefined,
        picId: picId || undefined,
        tags: tags.trim() || undefined,
        sharingMode,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Gagal menyimpan catatan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerScaffold = async () => {
    if (!parentNote?.kdJudul || !onScaffoldStages) return;
    try {
      setIsScaffolding(true);
      await onScaffoldStages(parentNote.kdJudul);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal membuat tahapan otomatis.');
    } finally {
      setIsScaffolding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-2xl border-border bg-card shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-border/80 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {isEditing ? <Edit3 className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {isEditing ? 'Ubah Rincian Catatan' : 'Tambah Catatan Baru'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {isEditing
                    ? `Perbarui data catatan #${editingNote?.kdJudul} (Tingkat ${editingNote?.tingkat})`
                    : parentNote
                    ? `Membuat sub-catatan tingkat ${currentTingkat} di bawah induk #${parentNote.kdJudul}`
                    : 'Membuat catatan proyek induk (Tingkat 0)'}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
                Tingkat {childTingkat}
              </span>
              <NoteStatusBadge status={status} />
            </div>
          </div>
        </DialogHeader>

        {/* Error Notification */}
        {error && (
          <div className="mx-4 mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 overflow-y-auto max-h-[75vh] space-y-4">
          <form id="note-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Auto-Code & Parent Inspector Block */}
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Preview Format Kode:</span>
                <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  #{autoCodePreview}
                </span>
                {parentNote && (
                  <span className="text-muted-foreground text-[11px]">
                    (Anak dari #{parentNote.kdJudul} - {parentNote.judul})
                  </span>
                )}
              </div>

              {!isEditing && parentNote && childTingkat === 1 && onScaffoldStages && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTriggerScaffold}
                  disabled={isScaffolding}
                  className="h-7 text-xs font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
                  title="Generate 5 tahapan standar MFC (Analisis, UI Design, Develop, Testing, Deploy)"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isScaffolding ? 'Menyusun 5 Tahap...' : '⚡ Auto 5 Tahapan MFC'}</span>
                </Button>
              )}
            </div>

            {/* Input Judul */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Judul Catatan / Proyek *</span>
                <span className="text-[10px] text-muted-foreground font-normal">Wajib diisi</span>
              </label>
              <Input
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Implementasi SSO & Refresh Token Guard"
                className="text-xs font-semibold"
                autoFocus
              />
            </div>

            {/* Input Ringkasan */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Ringkasan Eksekutif *</span>
                <span className="text-[10px] text-muted-foreground font-normal">Deskripsi singkat</span>
              </label>
              <Textarea
                value={ringkasan}
                onChange={(e) => setRingkasan(e.target.value)}
                placeholder="Deskripsi singkat tujuan, ruang lingkup pengerjaan, atau deliverable utama..."
                className="text-xs min-h-[50px] resize-none"
              />
            </div>

            {/* Grid Status, Prioritas, Stage */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Status Pengerjaan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-8 text-xs rounded-md border border-border bg-card px-2 text-foreground font-medium"
                >
                  <option value="DRAFT">DRAFT (Konsep)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Berjalan)</option>
                  <option value="REVIEW">REVIEW (Pemeriksaan)</option>
                  <option value="COMPLETED">COMPLETED (Selesai)</option>
                  <option value="BLOCKED">BLOCKED (Kendala)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Tingkat Prioritas</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-8 text-xs rounded-md border border-border bg-card px-2 text-foreground font-medium"
                >
                  <option value="LOW">LOW (Rendah)</option>
                  <option value="MEDIUM">MEDIUM (Normal)</option>
                  <option value="HIGH">HIGH (Tinggi)</option>
                  <option value="URGENT">URGENT (Mendesak)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Tahapan Kerja</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full h-8 text-xs rounded-md border border-border bg-card px-2 text-foreground font-medium"
                >
                  <option value="ANALISIS">1. Analisis Kebutuhan</option>
                  <option value="UI_DESIGN">2. Desain UI/UX</option>
                  <option value="DEVELOP">3. Pengembangan (Develop)</option>
                  <option value="TESTING">4. Pengujian (Testing/QA)</option>
                  <option value="DEPLOY">5. Rilis (Deployment)</option>
                </select>
              </div>
            </div>

            {/* ========================================================= */}
            {/* REQUIREMENT 2 & 3: PENANGGUNG JAWAB (PIC) & DELEGASI      */}
            {/* ========================================================= */}
            <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  Penanggung Jawab (PIC) & Delegasi Tugas
                </label>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {assignMode === 'SELF' ? 'Dikerjakan Pembuat' : 'Didelegasikan ke Rekan'}
                </span>
              </div>

              {/* Toggle Mode Penugasan */}
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-muted rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAssignMode('SELF');
                    setPicName(defaultCreatorName);
                    setPicId(defaultCreatorId);
                  }}
                  className={`py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    assignMode === 'SELF'
                      ? 'bg-card text-primary shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Saya Sendiri (Pembuat)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAssignMode('FRIEND');
                    if (friendsList.length > 0 && picId === defaultCreatorId) {
                      const firstFriend = friendsList[0];
                      setPicName(firstFriend.name);
                      setPicId(firstFriend.id);
                    }
                  }}
                  className={`py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    assignMode === 'FRIEND'
                      ? 'bg-card text-primary shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Tugaskan / Kirim ke Rekan</span>
                </button>
              </div>

              {/* Konten Pemilih Berdasarkan Mode */}
              {assignMode === 'SELF' ? (
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <Input
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    placeholder="Nama penanggung jawab"
                    className="h-8 text-xs flex-1 bg-card font-medium"
                  />
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    (Akun Aktif Anda)
                  </span>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3 text-primary" /> Pilih Rekan / Anggota Tim Terdaftar:
                    </label>
                    <select
                      value={picId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setPicId(selectedId);
                        const found = friendsList.find((f) => f.id === selectedId);
                        if (found) {
                          setPicName(found.name);
                        }
                      }}
                      className="w-full h-8 text-xs rounded-md border border-border bg-card px-2.5 text-foreground font-semibold"
                    >
                      {friendsList.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.role || f.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Banner Instruksi Delegasi Rekan */}
                  <div className="rounded-lg border border-primary/30 bg-primary/10 p-2.5 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-primary font-bold">
                      <Send className="h-3.5 w-3.5" />
                      <span>Catatan ini ditugaskan ke: {picName}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Lengkapi <strong>Bobot Progres (%)</strong>, <strong>Target Pagu (Rp)</strong>, dan <strong>Batas Waktu</strong> di bawah untuk penugasan anggota ini.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* REQUIREMENT 3: BOBOT, TARGET & BATAS WAKTU (DEFAULT NULL) */}
            {/* ========================================================= */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl border transition-colors ${
                assignMode === 'FRIEND'
                  ? 'border-primary/50 bg-primary/5 shadow-2xs'
                  : 'border-border/60 bg-muted/10'
              }`}
            >
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Percent className="h-3 w-3 text-primary" /> Bobot Progres (%)
                </label>
                <Input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Kosong (null)"
                  className="h-8 text-xs bg-card"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Wallet className="h-3 w-3 text-emerald-600" /> Target Pagu (Rp)
                </label>
                <Input
                  type="number"
                  value={targetBudget}
                  onChange={(e) => setTargetBudget(e.target.value)}
                  placeholder="Kosong (null)"
                  className="h-8 text-xs bg-card"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-amber-600" /> Batas Waktu
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-8 text-xs bg-card"
                />
              </div>
            </div>

            {/* Tags Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> Label Tags
              </label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="api,auth,docker,database (pisahkan dengan koma)"
                className="h-8 text-xs"
              />
            </div>

            {/* Catatan Teknis Detail (Opsional) */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Catatan Teknis Detail (Markdown)
              </label>
              <Textarea
                value={catatanDetail}
                onChange={(e) => setCatatanDetail(e.target.value)}
                placeholder="Rincian teknis, spesifikasi API endpoint, atau kriteria serah terima..."
                className="text-xs min-h-[60px] resize-none"
              />
            </div>

            {/* Visibilitas Publikasi Katalog */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Visibilitas & Publikasi Katalog</span>
                <span className="text-[10px] text-muted-foreground font-normal">Katalog Publik</span>
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSharingMode('PRIVATE')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    sharingMode === 'PRIVATE'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs'
                      : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <p className="font-semibold text-xs text-foreground">🔒 Privat / Khusus</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    Hanya dapat diakses oleh Anda dan anggota tim yang diizinkan.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSharingMode('PUBLIC')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    sharingMode === 'PUBLIC'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold shadow-2xs'
                      : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <p className="font-semibold text-xs text-emerald-700 dark:text-emerald-400">🌐 Katalog Publik</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    Tampil di tab Katalog Publik dan dapat dibaca oleh publik via tautan.
                  </p>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <DialogFooter className="p-3 border-t border-border/80 bg-muted/20 flex items-center justify-between sm:justify-between">
          <Button type="button" variant="ghost" onClick={onClose} className="h-8 text-xs cursor-pointer">
            Batal
          </Button>

          <Button
            type="submit"
            form="note-form"
            disabled={isSubmitting || !judul.trim() || !ringkasan.trim()}
            className="h-8 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
          >
            {isSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Catatan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NoteFormModal;
