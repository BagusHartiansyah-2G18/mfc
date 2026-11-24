import { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  CheckSquare,
  Paperclip,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Upload,
  UserPlus,
  Stamp,
} from 'lucide-react';
import { Button, Input, Textarea } from '@org/ui';
import {
  type JudulNote,
  type JudulTransaction,
  type JudulChecklist,
  type JudulFile,
  type NoteMember,
  type NoteApproval,
} from './types';
import { authFetch } from '@org/auth';
import { NoteStatusBadge, NoteStageBadge } from './NoteStatusBadge';

interface NoteSupportingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  note: JudulNote | null;
  onUpdated?: () => void;
  apiBaseUrl?: string;
  authToken?: string;
}

export function NoteSupportingDrawer({
  isOpen,
  onClose,
  note,
  onUpdated,
  apiBaseUrl = 'http://localhost:3002/api',
  authToken = 'dev-bypass-token-2026',
}: NoteSupportingDrawerProps) {
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'CHECKLIST' | 'FILES' | 'TEAM' | 'APPROVAL'>('TRANSACTIONS');

  // Supporting Data States
  const [transactions, setTransactions] = useState<JudulTransaction[]>([]);
  const [checklists, setChecklists] = useState<JudulChecklist[]>([]);
  const [files, setFiles] = useState<JudulFile[]>([]);
  const [members, setMembers] = useState<NoteMember[]>([]);
  const [approvals, setApprovals] = useState<NoteApproval[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State: Transaksi
  const [trxDate, setTrxDate] = useState(new Date().toISOString().split('T')[0]);
  const [nomorKuitansi, setNomorKuitansi] = useState('');
  const [trxUraian, setTrxUraian] = useState('');
  const [trxNominal, setTrxNominal] = useState<number | string>('');
  const [trxCategory, setTrxCategory] = useState('OPERASIONAL');
  const [isSubmittingTrx, setIsSubmittingTrx] = useState(false);

  // Form State: Checklist
  const [newItemText, setNewItemText] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Form State: File
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'image'>('pdf');
  const [fileCategory, setFileCategory] = useState<'SOP' | 'FOTO' | 'BAST' | 'INVOICE'>('SOP');
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Form State: Member
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'OWNER' | 'APPROVER' | 'CONTRIBUTOR' | 'FOLLOWER'>('CONTRIBUTOR');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Form State: Approval
  const [approvalComments, setApprovalComments] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Load all supporting data
  const loadAllSupportingData = async () => {
    if (!note?.kdJudul) return;
    try {
      setIsLoading(true);
      setError(null);
      const [resTrx, resChk, resFil, resMem, resApp] = await Promise.all([
        authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/transactions`),
        authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/checklists`),
        authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/files`),
        authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/members`),
        authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/approvals`),
      ]);

      const [jTrx, jChk, jFil, jMem, jApp] = await Promise.all([
        resTrx.json().catch(() => ({ data: [] })),
        resChk.json().catch(() => ({ data: [] })),
        resFil.json().catch(() => ({ data: [] })),
        resMem.json().catch(() => ({ data: [] })),
        resApp.json().catch(() => ({ data: [] })),
      ]);

      if (jTrx.success && Array.isArray(jTrx.data)) setTransactions(jTrx.data);
      if (jChk.success && Array.isArray(jChk.data)) setChecklists(jChk.data);
      if (jFil.success && Array.isArray(jFil.data)) setFiles(jFil.data);
      if (jMem.success && Array.isArray(jMem.data)) setMembers(jMem.data);
      if (jApp.success && Array.isArray(jApp.data)) setApprovals(jApp.data);
    } catch (err: any) {
      console.warn('Gagal memuat data pendukung:', err);
      setError(err.message || 'Gagal memuat data pendukung.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && note?.kdJudul) {
      loadAllSupportingData();
    }
  }, [isOpen, note?.kdJudul]);

  // Handlers for Transactions
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note?.kdJudul || !trxUraian.trim() || !trxNominal) return;

    try {
      setIsSubmittingTrx(true);
      setError(null);
      const res = await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/transactions`, {
        method: 'POST',
        body: JSON.stringify({
          trxDate,
          nomorKuitansi: nomorKuitansi.trim() || undefined,
          uraian: trxUraian.trim(),
          nominal: Number(trxNominal),
          category: trxCategory,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Gagal menyimpan transaksi.');

      setNomorKuitansi('');
      setTrxUraian('');
      setTrxNominal('');
      await loadAllSupportingData();
      onUpdated?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingTrx(false);
    }
  };

  const handleRemoveTransaction = async (trxId: string) => {
    if (!note?.kdJudul || !window.confirm('Hapus transaksi pengeluaran ini?')) return;
    try {
      await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/transactions/${trxId}`, {
        method: 'DELETE',
      });
      await loadAllSupportingData();
      onUpdated?.();
    } catch (err) {
      console.warn(err);
    }
  };

  // Handlers for Checklists (Lbesic)
  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note?.kdJudul || !newItemText.trim()) return;

    try {
      setIsAddingItem(true);
      setError(null);
      const res = await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/checklists`, {
        method: 'POST',
        body: JSON.stringify({
          itemText: newItemText.trim(),
          assignedTo: newAssignee.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      setNewItemText('');
      setNewAssignee('');
      await loadAllSupportingData();
      onUpdated?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleToggleChecklist = async (item: JudulChecklist, syncProgress = true) => {
    if (!note?.kdJudul) return;
    try {
      await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/checklists/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isCompleted: !item.isCompleted,
          syncProgress,
        }),
      });
      await loadAllSupportingData();
      onUpdated?.();
    } catch (err) {
      console.warn(err);
    }
  };

  const handleRemoveChecklist = async (itemId: string) => {
    if (!note?.kdJudul) return;
    try {
      await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/checklists/${itemId}`, {
        method: 'DELETE',
      });
      await loadAllSupportingData();
      onUpdated?.();
    } catch (err) {
      console.warn(err);
    }
  };

  // Handlers for Files
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note?.kdJudul || !fileName.trim()) return;

    try {
      setIsUploadingFile(true);
      setError(null);
      const fallbackUrl =
        fileType === 'pdf'
          ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
          : `https://picsum.photos/seed/${encodeURIComponent(fileName)}/800/600`;

      await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/files`, {
        method: 'POST',
        body: JSON.stringify({
          fileName: fileName.trim(),
          fileUrl: fileUrl.trim() || fallbackUrl,
          fileType,
          category: fileCategory,
          fileSizeBytes: 350000,
        }),
      });

      setFileName('');
      setFileUrl('');
      await loadAllSupportingData();
      onUpdated?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    if (!note?.kdJudul || !window.confirm('Hapus berkas ini?')) return;
    try {
      await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/files/${fileId}`, {
        method: 'DELETE',
      });
      await loadAllSupportingData();
      onUpdated?.();
    } catch (err) {
      console.warn(err);
    }
  };

  // Handlers for Members
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note?.kdJudul || !newMemberName.trim() || !newMemberEmail.trim()) return;

    try {
      setIsAddingMember(true);
      setError(null);
      await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/members`, {
        method: 'POST',
        body: JSON.stringify({
          userId: `usr-custom-${Date.now()}`,
          userName: newMemberName.trim(),
          userEmail: newMemberEmail.trim(),
          role: newMemberRole,
          canEdit: newMemberRole !== 'FOLLOWER',
          canApprove: newMemberRole === 'OWNER' || newMemberRole === 'APPROVER',
        }),
      });

      setNewMemberName('');
      setNewMemberEmail('');
      await loadAllSupportingData();
      onUpdated?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (accessId: string) => {
    if (!note?.kdJudul || !window.confirm('Hapus hak akses anggota?')) return;
    try {
      await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/members/${accessId}`, {
        method: 'DELETE',
      });
      await loadAllSupportingData();
      onUpdated?.();
    } catch (err) {
      console.warn(err);
    }
  };

  // Handlers for Approval
  const handleRequestApproval = async () => {
    if (!note?.kdJudul) return;
    try {
      setIsSubmittingApproval(true);
      setError(null);
      await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/approvals`, {
        method: 'POST',
        body: JSON.stringify({
          stageName: note.stage || 'TAHAPAN_KERJA',
          comments: approvalComments.trim() || 'Pengajuan persetujuan capaian tahapan.',
          digitalSignature: `SHA256:SIGN-${note.kdJudul}-${Date.now().toString(36)}`,
        }),
      });
      setApprovalComments('');
      await loadAllSupportingData();
      onUpdated?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleDecideApproval = async (approvalId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!note?.kdJudul) return;
    try {
      await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/approvals/${approvalId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          comments: `Persetujuan ${status === 'APPROVED' ? 'disetujui' : 'ditolak'} oleh Manager.`,
          digitalSignature: `SHA256:VERIFIED-MGR-${Date.now().toString(36)}`,
        }),
      });
      await loadAllSupportingData();
      onUpdated?.();
    } catch (err) {
      console.warn(err);
    }
  };

  if (!isOpen || !note) return null;

  // Financial calculations
  const targetBudget = note.targetBudget ? Number(note.targetBudget) : 0;
  const totalExpense = transactions.reduce((acc, t) => acc + Number(t.nominal), 0);
  const remainingBudget = targetBudget - totalExpense;
  const isOverbudget = remainingBudget < 0;

  // Checklist calculations
  const totalItems = checklists.length;
  const completedItems = checklists.filter((i) => i.isCompleted).length;
  const checklistPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        {/* Slide-over Panel */}
        <div className="w-screen max-w-2xl bg-card border-l border-border/80 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 border-b border-border/80 bg-muted/20 flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                  #{note.kdJudul}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Tingkat {note.tingkat}
                </span>
                <NoteStageBadge stage={note.stage} />
                {isLoading && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 animate-pulse">
                    Memuat...
                  </span>
                )}
                <NoteStatusBadge status={note.status} />
              </div>
              <h3 className="text-base font-bold text-foreground truncate">{note.judul}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{note.ringkasan}</p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tab Selector Toolbar */}
          <div className="px-4 py-2 border-b border-border/80 bg-muted/10 flex items-center gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('TRANSACTIONS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'TRANSACTIONS'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Buku Kas ({transactions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CHECKLIST')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'CHECKLIST'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Ceklist Capaian ({completedItems}/{totalItems})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('FILES')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'FILES'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span>Berkas ({files.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TEAM')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'TEAM'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Tim ({members.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('APPROVAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'APPROVAL'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Approval ({approvals.length})</span>
            </button>
          </div>

          {error && (
            <div className="mx-4 mt-3 flex items-center gap-2 p-2.5 text-xs rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drawer Body Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB 1: BUKU KAS & TRANSAKSI */}
            {activeTab === 'TRANSACTIONS' && (
              <div className="space-y-4">
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl border border-border/80 bg-card space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <Wallet className="h-3 w-3 text-primary" /> Target Pagu
                    </span>
                    <div className="text-sm font-bold text-foreground">
                      Rp {targetBudget.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-border/80 bg-card space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-blue-600" /> Realisasi Kas
                    </span>
                    <div className="text-sm font-bold text-blue-600">
                      Rp {totalExpense.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border space-y-1 ${
                    isOverbudget
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-600'
                      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
                  }`}>
                    <span className="text-[10px] uppercase font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Sisa Pagu
                    </span>
                    <div className="text-sm font-bold">
                      Rp {remainingBudget.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* Form Input Transaksi Baru */}
                <form onSubmit={handleAddTransaction} className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-primary" />
                    Catat Realisasi Pengeluaran Kas
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Uraian Keperluan <span className="text-rose-500">*</span></label>
                      <Input
                        value={trxUraian}
                        onChange={(e) => setTrxUraian(e.target.value)}
                        placeholder="Misal: Pembayaran Termin 1 Vendor..."
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Nominal Pengeluaran (Rp) <span className="text-rose-500">*</span></label>
                      <Input
                        type="number"
                        value={trxNominal}
                        onChange={(e) => setTrxNominal(e.target.value)}
                        placeholder="Contoh: 12500000"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Tanggal Kuitansi</label>
                      <Input
                        type="date"
                        value={trxDate}
                        onChange={(e) => setTrxDate(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Nomor Kuitansi / Bukti</label>
                      <Input
                        value={nomorKuitansi}
                        onChange={(e) => setNomorKuitansi(e.target.value)}
                        placeholder="BGS-INV-001/2026"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Kategori Biaya</label>
                      <select
                        value={trxCategory}
                        onChange={(e) => setTrxCategory(e.target.value)}
                        className="w-full h-8 text-xs rounded-md border border-border bg-card px-2 text-foreground"
                      >
                        <option value="OPERASIONAL">Operasional</option>
                        <option value="HONORARIUM">Honorarium / Tim</option>
                        <option value="PENGADAAN">Pengadaan Barang/Jasa</option>
                        <option value="LISENSI">Lisensi & Cloud</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      disabled={isSubmittingTrx || !trxUraian.trim() || !trxNominal}
                      className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {isSubmittingTrx ? 'Menyimpan...' : 'Catat Transaksi'}
                    </Button>
                  </div>
                </form>

                {/* Daftar Histori Transaksi */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground">
                    Daftar Transaksi Tercatat ({transactions.length})
                  </h4>
                  {transactions.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic p-4 text-center border border-dashed rounded-xl">
                      Belum ada transaksi biaya yang dicatat pada catatan ini.
                    </p>
                  ) : (
                    <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card overflow-hidden">
                      {transactions.map((trx) => (
                        <div key={trx.id} className="flex items-center justify-between p-3 gap-3 hover:bg-muted/30">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground truncate">{trx.uraian}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                {trx.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                              <span>📅 {new Date(trx.trxDate).toLocaleDateString('id-ID')}</span>
                              {trx.nomorKuitansi && <span>• No: {trx.nomorKuitansi}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-mono font-bold text-foreground">
                              Rp {Number(trx.nominal).toLocaleString('id-ID')}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveTransaction(trx.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-rose-600 cursor-pointer"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: CEKLIST CAPAIAN (LBESIC MODERNIZATION) */}
            {activeTab === 'CHECKLIST' && (
              <div className="space-y-4">
                {/* Checklist Progress Bar */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Capaian Kriteria Penerimaan (Acceptance Criteria)</span>
                    <span className="font-mono text-primary font-bold">
                      {completedItems} dari {totalItems} ({checklistPercent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${checklistPercent}%` }}
                    />
                  </div>
                </div>

                {/* Form Input Item Ceklist Baru */}
                <form onSubmit={handleAddChecklist} className="flex gap-2">
                  <Input
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="Tambah butir kriteria pekerjaan baru (misal: UAT Modul Auth Lulus)..."
                    className="h-8 text-xs flex-1"
                  />
                  <Input
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    placeholder="PIC (Opsional)"
                    className="h-8 text-xs w-32 hidden sm:block"
                  />
                  <Button
                    type="submit"
                    disabled={isAddingItem || !newItemText.trim()}
                    className="h-8 text-xs font-semibold gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah
                  </Button>
                </form>

                {/* Interactive Checklist List */}
                <div className="space-y-2">
                  {checklists.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic p-4 text-center border border-dashed rounded-xl">
                      Belum ada butir kriteria pekerjaan. Tambahkan kriteria capaian agar pelaksana kegiatan dapat menandai progres secara transparan.
                    </p>
                  ) : (
                    <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card overflow-hidden">
                      {checklists.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 gap-3 hover:bg-muted/30 transition-colors"
                        >
                          <label className="flex items-center gap-3 min-w-0 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={item.isCompleted}
                              onChange={() => handleToggleChecklist(item, true)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                            />
                            <div className="min-w-0">
                              <span className={`text-xs block ${
                                item.isCompleted
                                  ? 'line-through text-muted-foreground font-normal'
                                  : 'text-foreground font-medium'
                              }`}>
                                {item.itemText}
                              </span>
                              {item.isCompleted && item.completedBy && (
                                <span className="text-[10px] text-emerald-600 block mt-0.5">
                                  ✓ Selesai oleh {item.completedBy}
                                </span>
                              )}
                            </div>
                          </label>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveChecklist(item.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-rose-600 cursor-pointer shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: BERKAS & MEDIA */}
            {activeTab === 'FILES' && (
              <div className="space-y-4">
                <form onSubmit={handleUploadFile} className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Upload className="h-4 w-4 text-primary" />
                    Lampirkan Dokumen PDF / Foto Bukti
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Jenis</label>
                      <select
                        value={fileType}
                        onChange={(e: any) => setFileType(e.target.value)}
                        className="w-full h-8 text-xs rounded-md border border-border bg-card px-2 text-foreground"
                      >
                        <option value="pdf">Dokumen PDF (KAK/SOP)</option>
                        <option value="image">Foto Dokumentasi (JPG/PNG)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Kategori</label>
                      <select
                        value={fileCategory}
                        onChange={(e: any) => setFileCategory(e.target.value)}
                        className="w-full h-8 text-xs rounded-md border border-border bg-card px-2 text-foreground"
                      >
                        <option value="SOP">SOP / KAK</option>
                        <option value="FOTO">Foto Kegiatan</option>
                        <option value="BAST">Berita Acara (BAST)</option>
                        <option value="INVOICE">Faktur / Invoice</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Nama Berkas</label>
                      <Input
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="Contoh: KAK-Kegiatan.pdf"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">URL Berkas Eksternal / Cloud (Opsional)</label>
                    <Input
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://... (Kosongkan jika menggunakan URL simulasi)"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      disabled={isUploadingFile || !fileName.trim()}
                      className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {isUploadingFile ? 'Menyimpan...' : 'Lampirkan Berkas'}
                    </Button>
                  </div>
                </form>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground">Berkas Terlampir ({files.length})</h4>
                  {files.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic p-4 text-center border border-dashed rounded-xl">
                      Belum ada berkas lampiran.
                    </p>
                  ) : (
                    <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card overflow-hidden">
                      {files.map((f) => (
                        <div key={f.id} className="flex items-center justify-between p-3 gap-3 hover:bg-muted/30">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-foreground truncate block">{f.fileName}</span>
                            <span className="text-[10px] text-muted-foreground">{f.category || 'BERKAS'} • {f.fileType.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {f.fileUrl && (
                              <a
                                href={f.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="h-7 px-2 text-xs font-medium rounded-md bg-primary/10 text-primary flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" /> Buka
                              </a>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFile(f.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: TIM & RACI */}
            {activeTab === 'TEAM' && (
              <div className="space-y-4">
                <form onSubmit={handleAddMember} className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4 text-primary" />
                    Undang Anggota / Follower Tim
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Nama Lengkap</label>
                      <Input
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Misal: Sarah Jenkins"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Alamat Email</label>
                      <Input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="sarah@bgs-software.id"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Peran RACI</label>
                      <select
                        value={newMemberRole}
                        onChange={(e: any) => setNewMemberRole(e.target.value)}
                        className="w-full h-8 text-xs rounded-md border border-border bg-card px-2 text-foreground"
                      >
                        <option value="CONTRIBUTOR">Kontributor</option>
                        <option value="APPROVER">Approver / Manager</option>
                        <option value="FOLLOWER">Follower / Pengamat</option>
                        <option value="OWNER">Pemilik Utama</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      disabled={isAddingMember || !newMemberName.trim()}
                      className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {isAddingMember ? 'Menyimpan...' : 'Tambahkan Anggota'}
                    </Button>
                  </div>
                </form>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground">Kolaborator Terdaftar ({members.length})</h4>
                  {members.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic p-4 text-center border border-dashed rounded-xl">
                      Belum ada anggota tim terdaftar.
                    </p>
                  ) : (
                    <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card overflow-hidden">
                      {members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-3 gap-3 hover:bg-muted/30">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-foreground truncate block">{m.userName}</span>
                            <span className="text-[10px] text-muted-foreground">{m.userEmail} • {m.role}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMember(m.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: APPROVAL & SIGN-OFF */}
            {activeTab === 'APPROVAL' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Stamp className="h-4 w-4 text-primary" />
                    Ajukan Permohonan Sign-Off BAST
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Pengajuan persetujuan akan mengubah status catatan menjadi <strong>REVIEW</strong> dan menunggu validasi manajer.
                  </p>
                  <Textarea
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    placeholder="Catatan pengantar pengajuan (misal: Tahap pengembangan selesai, seluruh pengujian unit lulus)..."
                    className="text-xs min-h-[50px] resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      disabled={isSubmittingApproval}
                      onClick={handleRequestApproval}
                      className="h-8 text-xs font-semibold gap-1.5 cursor-pointer bg-primary"
                    >
                      <Stamp className="h-3.5 w-3.5" />
                      {isSubmittingApproval ? 'Mengajukan...' : 'Ajukan Review Sekarang'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground">Histori Persetujuan ({approvals.length})</h4>
                  {approvals.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic p-4 text-center border border-dashed rounded-xl">
                      Belum ada permohonan persetujuan sign-off.
                    </p>
                  ) : (
                    <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card overflow-hidden">
                      {approvals.map((app) => (
                        <div key={app.id} className="p-3 space-y-2 hover:bg-muted/30">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">Tahap: {app.stageName}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              app.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : app.status === 'REJECTED'
                                ? 'bg-rose-500/10 text-rose-600'
                                : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {app.status}
                            </span>
                          </div>
                          {app.comments && <p className="text-xs text-muted-foreground">{app.comments}</p>}
                          {app.digitalSignature && (
                            <div className="text-[10px] font-mono text-muted-foreground truncate">
                              Signature: {app.digitalSignature}
                            </div>
                          )}

                          {app.status === 'PENDING' && (
                            <div className="flex items-center gap-2 pt-1">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleDecideApproval(app.id, 'APPROVED')}
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Setujui (Approve)
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDecideApproval(app.id, 'REJECTED')}
                                className="h-7 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                              >
                                Tolak (Reject)
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
