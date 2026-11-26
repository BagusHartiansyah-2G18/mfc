import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Switch,
} from '@org/ui';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Settings2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Hash,
  Calendar,
  List,
  CheckSquare,
  CircleDot,
  Paperclip,
  Palette,
  Sliders,
  PenTool,
  Star,
  Coins,
  ListPlus,
  Heading,
  Layers,
  Clock,
  GitBranch,
} from 'lucide-react';
import {
  type DataForm,
  type FormFieldDefinition,
  type FormFieldType,
  type FormWizardStep,
} from '../types';
import { authFetch } from '@org/auth';
import { FieldOptionSourceEditor } from './FieldOptionSourceEditor';

interface NoteDynamicFormBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  kdJudul: string;
  editingForm?: DataForm | null;
  onSaved: () => void;
  apiBaseUrl?: string;
  authToken?: string;
}

const FIELD_TYPE_OPTIONS: Array<{
  type: FormFieldType;
  label: string;
  icon: React.ElementType;
  desc: string;
}> = [
  { type: 'text', label: 'Teks Singkat', icon: FileText, desc: 'Input teks satu baris' },
  { type: 'textarea', label: 'Paragraf / Catatan', icon: FileText, desc: 'Input teks panjang multi-baris' },
  { type: 'number', label: 'Angka / Nilai', icon: Hash, desc: 'Input numerik (skor, biaya, jumlah)' },
  { type: 'currency', label: 'Uang / Rupiah', icon: Coins, desc: 'Masking otomatis Rp 15.000.000' },
  { type: 'date', label: 'Tanggal', icon: Calendar, desc: 'Pemilih tanggal' },
  { type: 'select', label: 'Dropdown', icon: List, desc: 'Pilih satu opsi dari menu dropdown' },
  { type: 'checkbox', label: 'Centang (Multi)', icon: CheckSquare, desc: 'Pilih satu atau banyak opsi' },
  { type: 'radio', label: 'Pilihan Tunggal', icon: CircleDot, desc: 'Pilih tepat satu opsi' },
  { type: 'rating', label: 'Rating (1-5 Bintang)', icon: Star, desc: 'Penilaian skala bintang visual' },
  { type: 'signature', label: 'Tanda Tangan Digital', icon: PenTool, desc: 'Bubuhkan tanda tangan layar sentuh/mouse' },
  { type: 'repeater', label: 'Sub-Tabel Berulang', icon: ListPlus, desc: 'Daftar dinamis (+ Tambah Baris)' },
  { type: 'section', label: 'Pemisah Seksi', icon: Heading, desc: 'Pembatas judul seksi visual' },
  { type: 'file', label: 'Lampiran Berkas', icon: Paperclip, desc: 'Unggah file PDF atau foto' },
  { type: 'range', label: 'Slider Rentang', icon: Sliders, desc: 'Slider rentang angka 1-100' },
  { type: 'color', label: 'Pemilih Warna', icon: Palette, desc: 'Pilih kode warna visual' },
];

export function NoteDynamicFormBuilder({
  isOpen,
  onClose,
  kdJudul,
  editingForm,
  onSaved,
  apiBaseUrl = 'http://localhost:3002/api',
  authToken = 'dev-bypass-token-2026',
}: NoteDynamicFormBuilderProps) {
  const [tujuan, setTujuan] = useState(editingForm?.tujuan || '');
  const [keterangan, setKeterangan] = useState(editingForm?.keterangan || '');
  const [formLayoutMode, setFormLayoutMode] = useState<'STANDARD' | 'WIZARD' | 'CARDS'>(
    editingForm?.formLayoutMode || 'STANDARD'
  );

  // Multi-Step Wizard Configuration
  const [steps, setSteps] = useState<FormWizardStep[]>(
    editingForm?.steps && editingForm.steps.length > 0
      ? editingForm.steps
      : [
          { id: 1, title: 'Tahap 1: Data Pemohon / Identitas' },
          { id: 2, title: 'Tahap 2: Rincian Kegiatan & Bukti' },
          { id: 3, title: 'Tahap 3: Konfirmasi & Tanda Tangan' },
        ]
  );

  // Quota & Schedule
  const [maxResponses, setMaxResponses] = useState<number | ''>(
    editingForm?.maxResponses || ''
  );
  const [closeAt, setCloseAt] = useState<string>(editingForm?.closeAt || '');

  const [fields, setFields] = useState<FormFieldDefinition[]>(
    editingForm?.fields && editingForm.fields.length > 0
      ? editingForm.fields
      : [
          {
            key: 'nama_pelaksana',
            label: 'Nama Pelaksana / Responden',
            type: 'text',
            placeholder: 'Masukkan nama lengkap',
            required: true,
            layoutWidth: 'full',
            wizardStep: 1,
          },
        ]
  );

  const [activeTab, setActiveTab] = useState<'FIELDS' | 'WIZARD' | 'SETTINGS'>('FIELDS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tujuanInputRef = React.useRef<HTMLInputElement | null>(null);

  // Re-sync saat editingForm berubah
  React.useEffect(() => {
    if (editingForm) {
      setTujuan(editingForm.tujuan);
      setKeterangan(editingForm.keterangan || '');
      setFormLayoutMode(editingForm.formLayoutMode || 'STANDARD');
      setSteps(
        editingForm.steps && editingForm.steps.length > 0
          ? editingForm.steps
          : [
              { id: 1, title: 'Tahap 1: Data Pemohon / Identitas' },
              { id: 2, title: 'Tahap 2: Rincian Kegiatan & Bukti' },
            ]
      );
      setMaxResponses(editingForm.maxResponses || '');
      setCloseAt(editingForm.closeAt || '');
      setFields(editingForm.fields || []);
    } else {
      setTujuan('');
      setKeterangan('');
      setFormLayoutMode('STANDARD');
      setSteps([
        { id: 1, title: 'Tahap 1: Data Pemohon / Identitas' },
        { id: 2, title: 'Tahap 2: Rincian & Konfirmasi' },
      ]);
      setMaxResponses('');
      setCloseAt('');
      setFields([
        {
          key: 'nama_pelaksana',
          label: 'Nama Pelaksana / Responden',
          type: 'text',
          placeholder: 'Masukkan nama lengkap',
          required: true,
          layoutWidth: 'full',
          wizardStep: 1,
        },
      ]);
    }
    setError(null);
  }, [editingForm, isOpen]);

  // AI Smart Scaffold & Presets Loader
  const handleApplyPreset = (presetType: 'UAT' | 'RAB' | 'K3') => {
    if (presetType === 'UAT') {
      setTujuan('UAT & Validasi Kelaikan Rilis MicroFE');
      setKeterangan('Formulir inspeksi uji fungsi, skoring performa, dan otorisasi go-live sistem.');
      setFormLayoutMode('WIZARD');
      setSteps([
        { id: 1, title: 'Tahap 1: Identitas Auditor' },
        { id: 2, title: 'Tahap 2: Penilaian & Uji Fungsi' },
        { id: 3, title: 'Tahap 3: Tanda Tangan & Otorisasi' },
      ]);
      setFields([
        {
          key: 'nama_auditor',
          label: 'Nama Auditor / Penguji',
          type: 'text',
          required: true,
          layoutWidth: 'half',
          wizardStep: 1,
        },
        {
          key: 'divisi_penguji',
          label: 'Divisi / Unit Kerja',
          type: 'text',
          required: true,
          layoutWidth: 'half',
          wizardStep: 1,
        },
        {
          key: 'rating_kelaikan',
          label: 'Rating Kesiapan Sistem',
          type: 'rating',
          required: true,
          layoutWidth: 'full',
          wizardStep: 2,
        },
        {
          key: 'skor_performa',
          label: 'Skor Kelaikan Operasional (1-100)',
          type: 'number',
          min: 1,
          max: 100,
          required: true,
          layoutWidth: 'half',
          wizardStep: 2,
        },
        {
          key: 'status_rekomendasi',
          label: 'Status Rekomendasi Rilis',
          type: 'select',
          options: ['LAYAK_GO_LIVE', 'PERBAIKAN_MINOR', 'DITOLAK'],
          required: true,
          layoutWidth: 'half',
          wizardStep: 2,
        },
        {
          key: 'catatan_perbaikan',
          label: 'Catatan Perbaikan Khusus',
          type: 'textarea',
          required: false,
          layoutWidth: 'full',
          wizardStep: 2,
          conditional: {
            dependOnKey: 'status_rekomendasi',
            operator: 'equals',
            value: 'PERBAIKAN_MINOR',
            action: 'show',
          },
        },
        {
          key: 'tanda_tangan',
          label: 'Tanda Tangan Elektronik Penguji',
          type: 'signature',
          required: true,
          layoutWidth: 'full',
          wizardStep: 3,
        },
      ]);
    } else if (presetType === 'RAB') {
      setTujuan('Pengajuan Rencana Anggaran Biaya (RAB) & Belanja');
      setKeterangan('Formulir pengajuan belanja barang dan jasa dengan rincian sub-tabel dinamis.');
      setFormLayoutMode('WIZARD');
      setSteps([
        { id: 1, title: 'Tahap 1: Informasi Proyek' },
        { id: 2, title: 'Tahap 2: Rincian Sub-Tabel Belanja' },
        { id: 3, title: 'Tahap 3: Lembar Pengesahan' },
      ]);
      setFields([
        {
          key: 'nama_pengaju',
          label: 'Nama Pejabat Pengaju',
          type: 'text',
          required: true,
          layoutWidth: 'half',
          wizardStep: 1,
        },
        {
          key: 'pagu_anggaran_induk',
          label: 'Pagu Anggaran Disetujui',
          type: 'currency',
          required: true,
          layoutWidth: 'half',
          wizardStep: 1,
        },
        {
          key: 'tabel_rincian_belanja',
          label: 'Rincian Komponen Belanja & Volume',
          type: 'repeater',
          required: true,
          layoutWidth: 'full',
          wizardStep: 2,
          repeaterColumns: [
            { key: 'uraian', label: 'Uraian Barang / Jasa', type: 'text' },
            { key: 'volume', label: 'Vol', type: 'number' },
            { key: 'satuan', label: 'Satuan', type: 'text' },
            { key: 'harga', label: 'Harga Satuan (Rp)', type: 'currency' },
          ],
        },
        {
          key: 'tanda_tangan',
          label: 'Tanda Tangan Pemohon',
          type: 'signature',
          required: true,
          layoutWidth: 'full',
          wizardStep: 3,
        },
      ]);
    } else if (presetType === 'K3') {
      setTujuan('Checklist Inspeksi K3 & Berita Acara Lapangan');
      setKeterangan('Inspeksi keselamatan kerja lapangan dengan upload foto temuan dan tanda tangan.');
      setFormLayoutMode('STANDARD');
      setFields([
        {
          key: 'lokasi_proyek',
          label: 'Lokasi Proyek / Stasiun Kerja',
          type: 'text',
          required: true,
          layoutWidth: 'half',
        },
        {
          key: 'tanggal_inspeksi',
          label: 'Tanggal & Waktu Inspeksi',
          type: 'date',
          required: true,
          layoutWidth: 'half',
        },
        {
          key: 'temuan_bahaya',
          label: 'Apakah Ditemukan Potensi Bahaya K3?',
          type: 'radio',
          options: ['TIDAK_ADA', 'ADA_BAHAYA'],
          required: true,
          layoutWidth: 'full',
        },
        {
          key: 'foto_bukti_bahaya',
          label: 'Upload Foto Bukti Temuan Bahaya',
          type: 'file',
          required: true,
          layoutWidth: 'full',
          conditional: {
            dependOnKey: 'temuan_bahaya',
            operator: 'equals',
            value: 'ADA_BAHAYA',
            action: 'show',
          },
        },
        {
          key: 'skor_kepatuhan_k3',
          label: 'Skor Kepatuhan APD Pekerja (1-100)',
          type: 'number',
          min: 0,
          max: 100,
          required: true,
          layoutWidth: 'half',
        },
        {
          key: 'rating_kebersihan',
          label: 'Rating Housekeeping Area Kerja',
          type: 'rating',
          required: true,
          layoutWidth: 'half',
        },
        {
          key: 'tanda_tangan',
          label: 'Tanda Tangan Pengawas Lapangan',
          type: 'signature',
          required: true,
          layoutWidth: 'full',
        },
      ]);
    }
  };

  const handleAddField = (type: FormFieldType = 'text') => {
    const fieldIndex = fields.length + 1;
    const defaultLabel = `Pertanyaan ${fieldIndex}`;
    const cleanKey = `field_${fieldIndex}_${Date.now().toString(36).slice(-4)}`;

    const newField: FormFieldDefinition = {
      key: cleanKey,
      label: defaultLabel,
      type,
      required: type !== 'section',
      placeholder: '',
      layoutWidth: 'full',
      wizardStep: 1,
      options: ['select', 'radio', 'checkbox'].includes(type)
        ? ['Opsi 1', 'Opsi 2', 'Opsi 3']
        : undefined,
      repeaterColumns:
        type === 'repeater'
          ? [
              { key: 'uraian', label: 'Uraian Item', type: 'text' },
              { key: 'volume', label: 'Vol', type: 'number' },
              { key: 'satuan', label: 'Satuan', type: 'text' },
              { key: 'harga', label: 'Harga Satuan (Rp)', type: 'currency' },
            ]
          : undefined,
    };
    setFields([...fields, newField]);
  };

  const handleUpdateField = (index: number, updates: Partial<FormFieldDefinition>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };

    if (updates.label && !updated[index].key.startsWith('custom_')) {
      const generatedKey = updates.label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 30);
      if (generatedKey) {
        updated[index].key = generatedKey;
      }
    }

    setFields(updated);
  };

  const handleRemoveField = (index: number) => {
    if (fields.length <= 1) {
      setError('Formulir minimal harus memiliki 1 pertanyaan.');
      return;
    }
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFields(updated);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tujuan.trim()) {
      setActiveTab('FIELDS');
      setError('Judul / Keperluan Formulir wajib diisi.');
      window.setTimeout(() => {
        tujuanInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        tujuanInputRef.current?.focus();
      }, 50);
      return;
    }
    if (fields.length === 0) {
      setError('Minimal harus menambahkan satu pertanyaan ke formulir.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const url = editingForm
        ? `${apiBaseUrl}/notes/${encodeURIComponent(kdJudul)}/forms/${encodeURIComponent(editingForm.id)}`
        : `${apiBaseUrl}/notes/${encodeURIComponent(kdJudul)}/forms`;
      const method = editingForm ? 'PUT' : 'POST';

      const payload = {
        tujuan: tujuan.trim(),
        keterangan: keterangan.trim(),
        formLayoutMode,
        steps: formLayoutMode === 'WIZARD' ? steps : undefined,
        maxResponses: maxResponses !== '' ? Number(maxResponses) : null,
        closeAt: closeAt.trim() || null,
        fields,
      };

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyimpan rancangan formulir.');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/80 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span>{editingForm ? 'Edit Desain Formulir' : 'Generator Formulir Fleksibel Power-Engine'}</span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">
                  #{kdJudul}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Rancang alur formulir bertahap (*Multi-Step Wizard*), logika percabangan, tanda tangan elektronik, dan sub-tabel dinamis.
              </DialogDescription>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleApplyPreset('UAT')}
              className="h-7 text-[10px] gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              <span>⚡ UAT & Kelaikan</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleApplyPreset('RAB')}
              className="h-7 text-[10px] gap-1 text-indigo-600 border-indigo-500/30 hover:bg-indigo-500/10 cursor-pointer"
            >
              <Coins className="h-3 w-3" />
              <span>⚡ RAB Belanja</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleApplyPreset('K3')}
              className="h-7 text-[10px] gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
            >
              <Heading className="h-3 w-3" />
              <span>⚡ Berita Acara K3</span>
            </Button>
          </div>
        </div>

        {/* Builder Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-border/80 px-6 pt-2 bg-muted/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('FIELDS')}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'FIELDS'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Desain Bidang ({fields.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('WIZARD')}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'WIZARD'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Mode Tampilan & Wizard ({steps.length} Tahap)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SETTINGS')}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SETTINGS'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Batas Kuota & Jadwal</span>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 p-2.5 text-xs rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* TAB 1: FIELDS DESIGNER */}
          {activeTab === 'FIELDS' && (
            <div className="space-y-5">
              {/* Form Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl border border-border/70 bg-card shadow-2xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Judul / Keperluan Formulir <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    ref={tujuanInputRef}
                    value={tujuan}
                    onChange={(e) => {
                      setTujuan(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Contoh: Checklist UAT Kelaikan Sistem"
                    className={`h-8 text-xs bg-background ${
                      error && !tujuan.trim() ? 'border-rose-500 ring-1 ring-rose-500' : ''
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Keterangan / Panduan</label>
                  <Input
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Petunjuk singkat bagi responden yang mengisi"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              {/* Add Field Palette (15 Types) */}
              <div className="space-y-2">
                <label className="font-bold text-foreground flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  <span>Tambahkan Bidang Pertanyaan Baru</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {FIELD_TYPE_OPTIONS.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleAddField(item.type)}
                        className="flex flex-col items-start p-2.5 rounded-xl border border-border/70 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group shadow-2xs cursor-pointer"
                        title={item.desc}
                      >
                        <div className="flex items-center gap-1.5 text-primary mb-1">
                          <IconComp className="h-3.5 w-3.5" />
                          <span className="font-bold text-[11px] group-hover:text-primary text-foreground">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[9px] text-muted-foreground line-clamp-1">
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field Items List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-semibold">Daftar Pertanyaan ({fields.length} Bidang)</span>
                  <span className="text-[10px]">Atur urutan, validasi, layout kolom, & percabangan</span>
                </div>

                {fields.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs space-y-3 relative group"
                  >
                    {/* Top Row: Re-order, Type Badge, Key, Actions */}
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {f.type}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Key: <code className="text-foreground">{f.key}</code>
                        </span>
                        {f.wizardStep && formLayoutMode === 'WIZARD' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-600">
                            Tahap {f.wizardStep}
                          </span>
                        )}
                        {f.layoutWidth && f.layoutWidth !== 'full' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600">
                            {f.layoutWidth === 'half' ? '50% (2-Kolom)' : '33% (3-Kolom)'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={idx === 0}
                          onClick={() => handleMoveField(idx, 'up')}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={idx === fields.length - 1}
                          onClick={() => handleMoveField(idx, 'down')}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveField(idx)}
                          className="h-6 w-6 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Middle Row: Label, Placeholder, Layout Settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-6 space-y-1">
                        <label className="text-[11px] font-semibold text-foreground">
                          Label Pertanyaan <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          value={f.label}
                          onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                          placeholder="Pertanyaan untuk responden"
                          className="h-8 text-xs bg-background"
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Lebar Grid Kolom
                        </label>
                        <select
                          value={f.layoutWidth || 'full'}
                          onChange={(e) =>
                            handleUpdateField(idx, { layoutWidth: e.target.value as any })
                          }
                          className="h-8 w-full px-2 text-xs rounded-md border border-border bg-background text-foreground"
                        >
                          <option value="full">100% (Penuh)</option>
                          <option value="half">50% (2 Kolom)</option>
                          <option value="third">33% (3 Kolom)</option>
                        </select>
                      </div>

                      {formLayoutMode === 'WIZARD' && (
                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">
                            Posisikan di Tahap
                          </label>
                          <select
                            value={f.wizardStep || 1}
                            onChange={(e) =>
                              handleUpdateField(idx, { wizardStep: Number(e.target.value) })
                            }
                            className="h-8 w-full px-2 text-xs rounded-md border border-border bg-background text-foreground"
                          >
                            {steps.map((st) => (
                              <option key={st.id} value={st.id}>
                                Tahap {st.id} ({st.title.slice(0, 15)}...)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Mode Editor Paragraf (Normal vs WYSIWYG) */}
                    {f.type === 'textarea' && (
                      <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-semibold text-foreground block">
                            Mode Input Paragraf
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {f.editorMode === 'WYSIWYG'
                              ? 'Aktif: Text Editor WYSIWYG (Rich Text / Markdown)'
                              : 'Aktif: Normal (Textarea polos)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={f.editorMode !== 'WYSIWYG' ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                            Normal
                          </span>
                          <Switch
                            checked={f.editorMode === 'WYSIWYG'}
                            onCheckedChange={(checked) =>
                              handleUpdateField(idx, {
                                editorMode: checked ? 'WYSIWYG' : 'NORMAL',
                              })
                            }
                          />
                          <span className={f.editorMode === 'WYSIWYG' ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                            WYSIWYG
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Options list / API / JSON Array for Select, Radio, Checkbox */}
                    {['select', 'radio', 'checkbox'].includes(f.type) && (
                      <FieldOptionSourceEditor
                        field={f}
                        onUpdate={(patch) => handleUpdateField(idx, patch)}
                      />
                    )}

                    {/* Smart Logic & Conditional Branching Drawer */}
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={f.required}
                          onChange={(e) => handleUpdateField(idx, { required: e.target.checked })}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span>Wajib Diisi (Required)</span>
                      </label>

                      {/* Conditional logic toggle */}
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-3 w-3 text-indigo-500" />
                        <span className="text-muted-foreground">Percabangan:</span>
                        {f.conditional ? (
                          <div className="flex items-center gap-1 bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded text-[10px]">
                            <span>
                              Tampil jika <code>{f.conditional.dependOnKey}</code> == &quot;
                              {String(f.conditional.value)}&quot;
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateField(idx, { conditional: undefined })}
                              className="ml-1 text-rose-500 hover:text-rose-700 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <select
                            onChange={(e) => {
                              const targetKey = e.target.value;
                              if (!targetKey) return;
                              handleUpdateField(idx, {
                                conditional: {
                                  dependOnKey: targetKey,
                                  operator: 'equals',
                                  value: 'ADA_BAHAYA',
                                  action: 'show',
                                },
                              });
                            }}
                            className="h-6 text-[10px] px-1.5 rounded border border-border bg-background text-muted-foreground"
                          >
                            <option value="">+ Tambah Logika Tampil</option>
                            {fields
                              .filter((other, oIdx) => oIdx !== idx)
                              .map((other) => (
                                <option key={other.key} value={other.key}>
                                  Tergantung: {other.label} ({other.key})
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: WIZARD & DISPLAY MODE */}
          {activeTab === 'WIZARD' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                <h4 className="font-bold text-xs text-foreground">
                  Pilih Format Presentasi Formulir
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormLayoutMode('STANDARD')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all space-y-1 ${
                      formLayoutMode === 'STANDARD'
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border/80 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground">
                        Standar (Satu Halaman Penuh)
                      </span>
                      <input
                        type="radio"
                        name="layout"
                        checked={formLayoutMode === 'STANDARD'}
                        onChange={() => setFormLayoutMode('STANDARD')}
                        className="accent-primary"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Seluruh pertanyaan ditampilkan dalam satu scroll vertikal. Cocok untuk survei singkat 1-7 pertanyaan.
                    </p>
                  </div>

                  <div
                    onClick={() => setFormLayoutMode('WIZARD')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all space-y-1 ${
                      formLayoutMode === 'WIZARD'
                        ? 'border-indigo-600 bg-indigo-500/5 shadow-xs'
                        : 'border-border/80 hover:border-indigo-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                        Multi-Step Wizard (Tahap 1, 2, 3...)
                      </span>
                      <input
                        type="radio"
                        name="layout"
                        checked={formLayoutMode === 'WIZARD'}
                        onChange={() => setFormLayoutMode('WIZARD')}
                        className="accent-indigo-600"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Formulir dipecah menjadi tahapan bertingkat dengan navigasi Next/Back. Sangat dianjurkan untuk formulir kompleks / formal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Wizard Steps Editor */}
              {formLayoutMode === 'WIZARD' && (
                <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-indigo-600" />
                        <span>Kelola Tahapan Stepper Wizard</span>
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Beri nama setiap tahap agar responden memahami progres pengisian form.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextId = steps.length + 1;
                        setSteps([
                          ...steps,
                          { id: nextId, title: `Tahap ${nextId}: Rincian Lanjutan` },
                        ]);
                      }}
                      className="h-7 text-xs gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah Tahap</span>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {steps.map((st, sIdx) => (
                      <div
                        key={st.id}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card shadow-2xs"
                      >
                        <span className="h-6 w-6 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {st.id}
                        </span>
                        <Input
                          value={st.title}
                          onChange={(e) => {
                            const copy = [...steps];
                            copy[sIdx] = { ...copy[sIdx], title: e.target.value };
                            setSteps(copy);
                          }}
                          className="h-8 text-xs bg-background flex-1"
                          placeholder="Judul Tahapan..."
                        />
                        {steps.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const copy = steps.filter((_, i) => i !== sIdx);
                              setSteps(copy);
                            }}
                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SETTINGS & SCHEDULE */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-4 p-4 rounded-xl border border-border/80 bg-card">
              <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Pengaturan Kuota Respon & Jadwal Form</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Batas Maksimal Respon (Quota)
                  </label>
                  <Input
                    type="number"
                    value={maxResponses}
                    onChange={(e) =>
                      setMaxResponses(e.target.value ? Number(e.target.value) : '')
                    }
                    placeholder="Contoh: 100 (Kosongkan jika tidak dibatasi)"
                    className="h-8 text-xs bg-background"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Formulir akan otomatis terkunci ketika kuota tercapai.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Batas Waktu Pengisian (Auto-Close Schedule)
                  </label>
                  <Input
                    type="datetime-local"
                    value={closeAt}
                    onChange={(e) => setCloseAt(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Formulir otomatis ditutup jika melewati tanggal dan jam ini.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
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
            disabled={isSubmitting}
            onClick={handleSaveForm}
            className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Rancangan Formulir'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
