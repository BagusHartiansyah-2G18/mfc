import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
} from '@org/ui';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  UserCheck,
  Mail,
  Crown,
  Eye,
  AlertCircle,
} from 'lucide-react';
import {
  type JudulNote,
  type NoteMember,
} from './types';
import { authFetch } from '@org/auth';

interface NoteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: JudulNote | null;
  onMembersUpdated?: () => void;
  apiBaseUrl?: string;
  authToken?: string;
}

// Preset pengguna sistem untuk kemudahan simulasi kolaborasi nyata
const PRESET_USERS = [
  { id: 'usr-1', name: 'Super Administrator', email: 'admin@bgs-software.id', role: 'OWNER' },
  { id: 'usr-2', name: 'Sarah Jenkins', email: 'sarah.j@bgs-software.id', role: 'APPROVER' },
  { id: 'usr-3', name: 'Budi Pratama', email: 'budi.p@bgs-software.id', role: 'CONTRIBUTOR' },
  { id: 'usr-4', name: 'Alex Wong', email: 'alex.w@bgs-software.id', role: 'CONTRIBUTOR' },
  { id: 'usr-5', name: 'Rina Melati', email: 'rina.m@bgs-software.id', role: 'FOLLOWER' },
];

export function NoteMembersModal({
  isOpen,
  onClose,
  note,
  onMembersUpdated,
  apiBaseUrl = 'http://localhost:3002/api',
  authToken = 'dev-bypass-token-2026',
}: NoteMembersModalProps) {
  const [members, setMembers] = useState<NoteMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'OWNER' | 'APPROVER' | 'CONTRIBUTOR' | 'FOLLOWER'>('CONTRIBUTOR');
  const [canEdit, setCanEdit] = useState(true);
  const [canApprove, setCanApprove] = useState(false);

  const fetchMembers = async () => {
    if (!note?.kdJudul) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/members`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMembers(json.data);
      }
    } catch (err) {
      console.warn('Gagal mengambil daftar anggota:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && note?.kdJudul) {
      fetchMembers();
    }
  }, [isOpen, note?.kdJudul]);

  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    setSelectedPreset(userId);
    const found = PRESET_USERS.find((u) => u.id === userId);
    if (found) {
      setCustomName(found.name);
      setCustomEmail(found.email);
      setSelectedRole(found.role as any);
      setCanEdit(found.role !== 'FOLLOWER');
      setCanApprove(found.role === 'OWNER' || found.role === 'APPROVER');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note?.kdJudul) return;
    if (!customName.trim() || !customEmail.trim()) {
      setError('Nama dan Email anggota wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const payload = {
        userId: selectedPreset || `usr-custom-${Date.now()}`,
        userName: customName.trim(),
        userEmail: customEmail.trim(),
        role: selectedRole,
        canEdit: selectedRole === 'FOLLOWER' ? false : canEdit,
        canApprove: selectedRole === 'OWNER' || selectedRole === 'APPROVER' ? true : canApprove,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customName)}`,
      };

      const res = await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/members`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menambahkan anggota.');
      }

      // Reset form
      setSelectedPreset('');
      setCustomName('');
      setCustomEmail('');
      setSelectedRole('CONTRIBUTOR');
      await fetchMembers();
      onMembersUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menambahkan anggota.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (accessId: string) => {
    if (!note?.kdJudul) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus hak akses anggota ini?')) return;

    try {
      const res = await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/members/${accessId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setMembers((prev) => prev.filter((m) => m.id !== accessId));
        onMembersUpdated?.();
      }
    } catch (err) {
      console.warn('Gagal menghapus anggota:', err);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-500/20">
            <Crown className="h-3 w-3" /> Pemilik (Owner)
          </span>
        );
      case 'APPROVER':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-600 border border-purple-500/20">
            <Shield className="h-3 w-3" /> Approver (Manager)
          </span>
        );
      case 'CONTRIBUTOR':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-500/20">
            <UserCheck className="h-3 w-3" /> Kontributor
          </span>
        );
      case 'FOLLOWER':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border">
            <Eye className="h-3 w-3" /> Pengamat (Follower)
          </span>
        );
    }
  };

  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold truncate">
                Kolaborator & Tim Catatan #{note.kdJudul}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                {note.judul}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="mx-4 mt-3 flex items-center gap-2 p-2.5 text-xs rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Form Undangan Anggota Baru */}
          <form onSubmit={handleAddMember} className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-3">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 text-primary" />
              Undang Anggota / Follower Baru
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Pilih Cepat Pengguna Sistem</label>
                <select
                  value={selectedPreset}
                  onChange={handleSelectPreset}
                  className="w-full h-8 text-xs rounded-md border border-border bg-card px-2.5 text-foreground"
                >
                  <option value="">-- Pilih Akun Terdaftar --</option>
                  {PRESET_USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Peran / Hak Akses (RACI)</label>
                <select
                  value={selectedRole}
                  onChange={(e: any) => setSelectedRole(e.target.value)}
                  className="w-full h-8 text-xs rounded-md border border-border bg-card px-2.5 text-foreground"
                >
                  <option value="CONTRIBUTOR">Kontributor (Dapat Edit & Selesaikan Tugas)</option>
                  <option value="APPROVER">Approver / Manager (Persetujuan BAST & Anggaran)</option>
                  <option value="FOLLOWER">Follower / Pengamat (Hanya Melihat Progres)</option>
                  <option value="OWNER">Pemilik Utama (Hak Penuh)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Nama Lengkap</label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Misal: Budi Santoso"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Alamat Email</label>
                <Input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="budi@bgs-software.id"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canEdit}
                    onChange={(e) => setCanEdit(e.target.checked)}
                    disabled={selectedRole === 'FOLLOWER'}
                    className="rounded border-border"
                  />
                  <span>Boleh Mengedit</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canApprove}
                    onChange={(e) => setCanApprove(e.target.checked)}
                    disabled={selectedRole === 'FOLLOWER'}
                    className="rounded border-border"
                  />
                  <span>Hak Approver</span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !customName.trim()}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {isSubmitting ? 'Menyimpan...' : 'Tambahkan'}
              </Button>
            </div>
          </form>

          {/* Daftar Anggota Terdaftar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground">
                Anggota & Pengamat Terdaftar ({members.length})
              </h4>
              <span className="text-[11px] text-muted-foreground">
                Total {members.filter((m) => m.role !== 'FOLLOWER').length} Pelaksana, {members.filter((m) => m.role === 'FOLLOWER').length} Follower
              </span>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Memuat daftar anggota...</div>
            ) : members.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-border bg-card text-muted-foreground space-y-1">
                <Users className="h-8 w-8 mx-auto opacity-40" />
                <p className="text-xs font-medium">Belum ada anggota tim tambahan.</p>
                <p className="text-[11px] text-muted-foreground">Gunakan formulir di atas untuk mengundang anggota atau pengamat baru.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card overflow-hidden">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 gap-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                        {m.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground truncate">{m.userName}</span>
                          {getRoleBadge(m.role)}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{m.userEmail}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(m.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                        title="Hapus Anggota"
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

        <DialogFooter className="p-3 border-t border-border/80 bg-muted/20 flex justify-end">
          <Button variant="outline" onClick={onClose} className="h-8 text-xs cursor-pointer">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
