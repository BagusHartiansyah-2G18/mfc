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
  RichTextEditor,
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
  FileText,
  SlidersHorizontal,
  Globe,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useAuth, authFetch } from '@org/auth';
import { type JudulNote, type NoteFormData } from './types';
import { NoteStatusBadge } from './NoteStatusBadge';

const PRESET_COLLABORATORS = [
  { id: 'usr-2', name: 'Sarah Jenkins', email: 'sarah.j@bgs-software.id', role: 'Project Manager / Approver' },
  { id: 'usr-3', name: 'Budi Pratama', email: 'budi.p@bgs-software.id', role: 'UI/UX Designer' },
  { id: 'usr-4', name: 'Alex Wong', email: 'alex.w@bgs-software.id', role: 'Lead Frontend Engineer' },
  { id: 'usr-5', name: 'Dewi Lestari', email: 'dewi.l@bgs-software.id', role: 'QA & Compliance Specialist' },
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

  // State Tab Navigasi Form yang Nyaman & Terstruktur
  const [formTab, setFormTab] = useState<'info' | 'execution' | 'settings'>('info');

  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [status, setStatus] = useState('IN_PROGRESS');
  const [priority, setPriority] = useState('MEDIUM');
  const [stage, setStage] = useState('DEVELOP');
  const [progress, setProgress] = useState(0);

  // Bobot, Target, dan Batas Waktu default-nya null (kosong)
  const [weight, setWeight] = useState<number | string>('');
  const [targetBudget, setTargetBudget] = useState<number | string>('');
  const [dueDate, setDueDate] = useState('');

  // Penanggung Jawab (PIC) & Delegasi
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
      setDeskripsi(editingNote.catatanDetail || editingNote.ringkasan || '');
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
      setDeskripsi('');
      setStatus('IN_PROGRESS');
      setPriority('MEDIUM');
      setStage(currentTingkat === 0 ? 'ANALISIS' : 'DEVELOP');
      setProgress(0);
      setWeight('');
      setTargetBudget('');
      setDueDate('');
      setPicName(defaultCreatorName);
      setPicId(defaultCreatorId);
      setAssignMode('SELF');
      setTags('');
      setSharingMode('PRIVATE');
    }
    setFormTab('info');
    setError(null);
  }, [editingNote, isOpen, currentTingkat, defaultCreatorName, defaultCreatorId]);

  // Kalkulasi Preview Kode Otomatis
  const childTingkat = isEditing ? editingNote!.tingkat : currentTingkat;
  const delimiter = childTingkat === 1 ? 'MFC' : '#';
  const autoCodePreview = parentNote ? `${parentNote.kdJudul}${delimiter}[N]` : '[N]';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      setFormTab('info');
      setError('Judul catatan wajib diisi.');
      return;
    }
    if (!deskripsi.trim()) {
      setFormTab('info');
      setError('Deskripsi catatan wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        judul: judul.trim(),
        ringkasan: deskripsi.trim(),
        catatanDetail: deskripsi.trim(),
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
      <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-2xl border-border bg-card shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* ========================================================= */}
        {/* MODAL HEADER                                              */}
        {/* ========================================================= */}
        <DialogHeader className="p-4 border-b border-border/80 bg-muted/30 shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs">
                {isEditing ? <Edit3 className="h-4.5 w-4.5" /> : <PlusCircle className="h-4.5 w-4.5" />}
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>{isEditing ? 'Ubah Rincian Catatan' : 'Tambah Catatan Baru'}</span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
                    Tingkat {childTingkat}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {isEditing
                    ? `Perbarui data catatan #${editingNote?.kdJudul} (Tingkat ${editingNote?.tingkat})`
                    : parentNote
                    ? `Membuat sub-catatan tingkat ${currentTingkat} di bawah induk #${parentNote.kdJudul}`
                    : 'Membuat inisiatif / catatan proyek induk (Tingkat 0)'}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NoteStatusBadge status={status} />
              {!isEditing && parentNote && childTingkat === 1 && onScaffoldStages && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTriggerScaffold}
                  disabled={isScaffolding}
                  className="h-8 text-xs font-semibold gap-1.5 text-primary border-primary/30 hover:bg-primary/10 cursor-pointer shadow-2xs"
                  title="Generate 5 tahapan standar MFC (Analisis, UI Design, Develop, Testing, Deploy)"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isScaffolding ? 'Menyusun 5 Tahap...' : '⚡ Auto 5 Tahap'}</span>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* ========================================================= */}
        {/* SEGMENTED TAB SELECTOR (3 TAHAP TERSTRUKTUR & NYAMAN)     */}
        {/* ========================================================= */}
        <div className="px-4 py-2 border-b border-border/70 bg-muted/25 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFormTab('info')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                formTab === 'info'
                  ? 'bg-card text-primary shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>1. Informasi & Dokumen</span>
              {(!judul.trim() || !deskripsi.trim()) && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Judul dan Deskripsi wajib diisi" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setFormTab('execution')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                formTab === 'execution'
                  ? 'bg-card text-primary shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>2. Pelaksanaan & Tim</span>
            </button>

            <button
              type="button"
              onClick={() => setFormTab('settings')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                formTab === 'settings'
                  ? 'bg-card text-primary shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>3. Finansial & Pengaturan</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>Kode: <strong className="text-primary font-bold">#{autoCodePreview}</strong></span>
          </div>
        </div>

        {/* Notifikasi Kesalahan Validasi */}
        {error && (
          <div className="mx-4 mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive shrink-0">
            {error}
          </div>
        )}

        {/* ========================================================= */}
        {/* ISI FORMULIR SESUAI TAB (LEGA, RAPI & TIDAK BERDESAKAN)   */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <form id="note-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* ------------------------------------------------------- */}
            {/* TAB 1: INFORMASI INTI & DOKUMEN (FULL WIDTH RTE)        */}
            {/* ------------------------------------------------------- */}
            {formTab === 'info' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Induk Catatan Info jika Sub-Catatan */}
                {parentNote && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">Catatan Induk:</span>
                      <strong className="text-foreground">#{parentNote.kdJudul} - {parentNote.judul}</strong>
                    </div>
                    <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded text-[11px] font-bold">
                      Sub-Tahap Tingkat {childTingkat}
                    </span>
                  </div>
                )}

                {/* Judul Catatan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Judul Catatan / Inisiatif Proyek *</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Wajib diisi</span>
                  </label>
                  <Input
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Contoh: Implementasi SSO Guard & Refresh Token Architecture"
                    className="text-sm font-semibold h-10 bg-card"
                    autoFocus
                  />
                </div>

                {/* Deskripsi & Uraian Catatan (Rich Text Editor / WYSIWYG Menggantikan Ringkasan) */}
                <div className="space-y-1.5 pt-1">
                  <RichTextEditor
                    label="Deskripsi & Uraian Catatan (WYSIWYG) *"
                    helperText="Toolbar lengkap: Heading, List, Checklist, Tabel, Tautan, & Template Instan"
                    value={deskripsi}
                    onChange={setDeskripsi}
                    placeholder="Tulis deskripsi, uraian pengerjaan, atau pilih salah satu 'Template' di toolbar..."
                    minHeight="260px"
                    maxHeight="420px"
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* TAB 2: PELAKSANAAN & TIM (PIC, STATUS, PROGRES)         */}
            {/* ------------------------------------------------------- */}
            {formTab === 'execution' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Penanggung Jawab (PIC) & Delegasi */}
                <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <User className="h-4 w-4 text-primary" />
                      <span>Penanggung Jawab Tugas (PIC)</span>
                    </label>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Mode: {assignMode === 'SELF' ? 'Akun Pembuat' : 'Delegasi Rekan'}
                    </span>
                  </div>

                  {/* Toggle Pilihan PIC */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setAssignMode('SELF');
                        setPicName(defaultCreatorName);
                        setPicId(defaultCreatorId);
                      }}
                      className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs ${
                        assignMode === 'SELF'
                          ? 'bg-card text-primary shadow-xs font-bold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Saya Sendiri ({defaultCreatorName})</span>
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
                      className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs ${
                        assignMode === 'FRIEND'
                          ? 'bg-card text-primary shadow-xs font-bold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Send className="h-4 w-4" />
                      <span>Tugaskan ke Rekan Tim</span>
                    </button>
                  </div>

                  {assignMode === 'SELF' ? (
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Label Nama Penanggung Jawab</label>
                      <Input
                        value={picName}
                        onChange={(e) => setPicName(e.target.value)}
                        placeholder="Nama penanggung jawab"
                        className="h-9 text-xs bg-card font-semibold"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground">Pilih Rekan dari Daftar Kolaborator</label>
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
                        className="w-full h-9 text-xs rounded-lg border border-border bg-card px-3 text-foreground font-semibold"
                      >
                        {friendsList.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.role || f.email})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-primary flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Catatan akan ditugaskan secara resmi kepada: <strong>{picName}</strong>
                      </p>
                    </div>
                  )}
                </div>

                {/* Parameter Siklus Kerja: Status, Prioritas, Tahapan */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl border border-border/80 bg-muted/15">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Status Pengerjaan</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-border bg-card px-2.5 text-foreground font-semibold"
                    >
                      <option value="DRAFT">DRAFT (Konsep)</option>
                      <option value="IN_PROGRESS">IN_PROGRESS (Sedang Pengerjaan)</option>
                      <option value="REVIEW">REVIEW (Tinjauan Tim)</option>
                      <option value="COMPLETED">COMPLETED (Selesai)</option>
                      <option value="BLOCKED">BLOCKED (Terkendala)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Tingkat Prioritas</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-border bg-card px-2.5 text-foreground font-semibold"
                    >
                      <option value="LOW">LOW (Rendah)</option>
                      <option value="MEDIUM">MEDIUM (Sedang)</option>
                      <option value="HIGH">HIGH (Tinggi)</option>
                      <option value="URGENT">URGENT (Kritis / Segera)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Tahapan Kerja (Stage)</label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-border bg-card px-2.5 text-foreground font-semibold"
                    >
                      <option value="ANALISIS">1. Analisis Kebutuhan</option>
                      <option value="UI_DESIGN">2. Desain Antarmuka (UI/UX)</option>
                      <option value="DEVELOP">3. Pengembangan & Kode</option>
                      <option value="TESTING">4. Pengujian & QA</option>
                      <option value="DEPLOY">5. Rilis & Deployment</option>
                    </select>
                  </div>
                </div>

                {/* Capaian Progres & Bobot Kerja */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-border/80 bg-muted/20">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-foreground flex items-center gap-1.5">
                        <Percent className="h-3.5 w-3.5 text-primary" />
                        <span>Capaian Progres Saat Ini</span>
                      </label>
                      <span className="font-mono font-bold text-primary">{progress}%</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={progress}
                        onChange={(e) => setProgress(Number(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgress(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-16 h-8 text-xs font-mono font-bold text-center bg-card"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>Bobot Relatif Pekerjaan (%)</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground font-normal">Opsional</span>
                    </label>
                    <Input
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Contoh: 20 (Persentase terhadap total proyek)"
                      className="h-9 text-xs bg-card"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* TAB 3: FINANSIAL, VISIBILITAS, & PENGATURAN             */}
            {/* ------------------------------------------------------- */}
            {formTab === 'settings' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Pagu Target Anggaran & Batas Waktu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-border/80 bg-muted/20">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Wallet className="h-4 w-4 text-emerald-600" />
                        <span>Pagu Target Anggaran (Rp)</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground font-normal">Opsional</span>
                    </label>
                    <Input
                      type="number"
                      value={targetBudget}
                      onChange={(e) => setTargetBudget(e.target.value)}
                      placeholder="Contoh: 15000000"
                      className="h-9 text-xs bg-card font-mono"
                    />
                    {targetBudget && Number(targetBudget) > 0 && (
                      <p className="text-[11px] text-emerald-600 font-bold">
                        Terformat: Rp {Number(targetBudget).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-amber-600" />
                        <span>Batas Waktu Pengerjaan (Deadline)</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground font-normal">Opsional</span>
                    </label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-9 text-xs bg-card"
                    />
                  </div>
                </div>

                {/* Visibilitas Publikasi Katalog */}
                <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-primary" />
                      <span>Visibilitas & Akses Katalog</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">Katalog Eksternal</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setSharingMode('PRIVATE')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        sharingMode === 'PRIVATE'
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                          : 'border-border/70 bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-primary" />
                        <span className="font-bold text-xs text-foreground">🔒 Akses Privat (Internal Tim)</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed pl-6">
                        Hanya dapat diakses oleh Anda, rekan tim tertugaskan, dan PIC diizinkan.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSharingMode('PUBLIC')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        sharingMode === 'PUBLIC'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                          : 'border-border/70 bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400">🌐 Akses Publik (Katalog Terbuka)</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed pl-6">
                        Tampil di tab Publik & dapat dibaca siapa saja melalui tautan resmi tanpa login.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Label Tags */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    <span>Label Tags Pencarian</span>
                  </label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Contoh: api, auth, docker, database (pisahkan dengan koma)"
                    className="h-9 text-xs bg-card"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Memudahkan pencarian dan pengelompokan catatan pada dashboard.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* ========================================================= */}
        {/* MODAL FOOTER (STICKY DENGAN TOMBOL NAVIGASI & SIMPAN)      */}
        {/* ========================================================= */}
        <DialogFooter className="p-3.5 border-t border-border/80 bg-muted/30 flex items-center justify-between sm:justify-between shrink-0">
          {/* Sisi Kiri: Navigasi Antar Tab */}
          <div className="flex items-center gap-1.5">
            {formTab === 'info' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormTab('execution')}
                className="h-8 text-xs gap-1.5 cursor-pointer font-medium"
              >
                <span>Pelaksanaan & Tim</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {formTab === 'execution' && (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormTab('info')}
                  className="h-8 text-xs gap-1.5 cursor-pointer font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Informasi</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormTab('settings')}
                  className="h-8 text-xs gap-1.5 cursor-pointer font-medium"
                >
                  <span>Finansial & Akses</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {formTab === 'settings' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormTab('execution')}
                className="h-8 text-xs gap-1.5 cursor-pointer font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Pelaksanaan & Tim</span>
              </Button>
            )}
          </div>

          {/* Sisi Kanan: Batal & Simpan */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-8 text-xs cursor-pointer"
            >
              Batal
            </Button>

            <Button
              type="submit"
              form="note-form"
              disabled={isSubmitting || !judul.trim() || !deskripsi.trim()}
              className="h-8 text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Catatan'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NoteFormModal;
