import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Checkbox,
  Input,
  SelectField,
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
  CheckCircle2,
  Loader2,
  Search,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  type JudulNote,
  type NoteMember,
  type UserFriend,
} from './types';
import { authFetch } from '@org/auth';

interface ActiveSystemUser {
  id: string;
  username: string;
  name: string;
  email: string;
  status: string;
  role?: string;
}

interface NoteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: JudulNote | null;
  onMembersUpdated?: () => void;
  apiBaseUrl?: string;
  authToken?: string;
}

export function NoteMembersModal({
  isOpen,
  onClose,
  note,
  onMembersUpdated,
  apiBaseUrl = 'http://localhost:3002/api',
}: NoteMembersModalProps) {
  const [members, setMembers] = useState<NoteMember[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveSystemUser[]>([]);
  const [friends, setFriends] = useState<UserFriend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [userSearch, setUserSearch] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserSnapshot, setSelectedUserSnapshot] = useState<ActiveSystemUser | null>(null);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'OWNER' | 'APPROVER' | 'CONTRIBUTOR' | 'FOLLOWER'>('CONTRIBUTOR');
  const [canEdit, setCanEdit] = useState(true);
  const [canApprove, setCanApprove] = useState(false);
  const lookupAbortRef = useRef<AbortController | null>(null);
  const comboboxRef = useRef<HTMLDivElement | null>(null);

  const fetchMembers = useCallback(async () => {
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
  }, [apiBaseUrl, note?.kdJudul]);

  const fetchActiveUsers = useCallback(async (q = '') => {
    lookupAbortRef.current?.abort();
    const controller = new AbortController();
    lookupAbortRef.current = controller;

    try {
      setIsLoadingUsers(true);
      const url = q.trim()
        ? `${apiBaseUrl}/friends/lookup?q=${encodeURIComponent(q.trim())}`
        : `${apiBaseUrl}/friends/lookup`;
      const usersRes = await authFetch(url, { signal: controller.signal });
      const usersJson = await usersRes.json().catch(() => ({}));
      if (usersRes.ok && usersJson.success && Array.isArray(usersJson.data)) {
        setActiveUsers(usersJson.data);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Gagal mengambil daftar pengguna aktif:', err);
      }
    } finally {
      if (lookupAbortRef.current === controller) {
        setIsLoadingUsers(false);
      }
    }
  }, [apiBaseUrl]);

  const fetchFriends = useCallback(async () => {
    try {
      const friendsRes = await authFetch(`${apiBaseUrl}/friends`);
      const friendsJson = await friendsRes.json().catch(() => ({}));
      if (friendsRes.ok && friendsJson.success && Array.isArray(friendsJson.data)) {
        setFriends(friendsJson.data);
      }
    } catch (err) {
      console.warn('Gagal mengambil daftar rekan:', err);
    }
  }, [apiBaseUrl]);

  const fetchActiveUsersAndFriends = useCallback(async () => {
    await Promise.all([fetchActiveUsers(userSearch), fetchFriends()]);
  }, [fetchActiveUsers, fetchFriends, userSearch]);

  useEffect(() => {
    if (isOpen && note?.kdJudul) {
      setError(null);
      setSuccess(null);
      setUserSearch('');
      setIsUserDropdownOpen(false);
      setSelectedUserId('');
      setSelectedUserSnapshot(null);
      setCustomName('');
      setCustomEmail('');
      fetchMembers();
      fetchFriends();
      fetchActiveUsers('');
    }
    return () => lookupAbortRef.current?.abort();
  }, [isOpen, note?.kdJudul, fetchMembers, fetchFriends, fetchActiveUsers]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      fetchActiveUsers(userSearch);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [userSearch, isOpen, fetchActiveUsers]);

  const selectedSystemUser = useMemo(
    () => selectedUserSnapshot || activeUsers.find((u) => u.id === selectedUserId) || null,
    [selectedUserSnapshot, activeUsers, selectedUserId]
  );

  const isFriendUser = useCallback(
    (user: ActiveSystemUser | null) => {
      if (!user) return false;
      const emailLower = user.email.toLowerCase();
      return friends.some(
        (f) => f.friendUserId === user.id || f.friendEmail?.toLowerCase() === emailLower
      );
    },
    [friends]
  );

  const isSelectedUserFriend = useMemo(
    () => isFriendUser(selectedSystemUser),
    [isFriendUser, selectedSystemUser]
  );

  const selectableActiveUsers = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.userId));
    const memberEmails = new Set(
      members.map((m) => m.userEmail?.toLowerCase()).filter(Boolean)
    );
    return activeUsers.filter(
      (u) => !memberIds.has(u.id) && !memberEmails.has(u.email.toLowerCase())
    );
  }, [activeUsers, members]);

  const handlePickSystemUser = (user: ActiveSystemUser) => {
    setSelectedUserId(user.id);
    setSelectedUserSnapshot(user);
    setCustomName(user.name);
    setCustomEmail(user.email);
    setUserSearch(user.name);
    setIsUserDropdownOpen(false);
    setError(null);
    setSuccess(null);
  };

  const handleClearSystemUser = () => {
    setSelectedUserId('');
    setSelectedUserSnapshot(null);
    setCustomName('');
    setCustomEmail('');
    setUserSearch('');
    setIsUserDropdownOpen(true);
    setError(null);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note?.kdJudul) return;
    if (!customName.trim() || !customEmail.trim()) {
      setError('Pilih pengguna sistem yang aktif terlebih dahulu.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      let autoFriended = false;
      if (selectedSystemUser && !isSelectedUserFriend) {
        const friendRes = await authFetch(`${apiBaseUrl}/friends/invite`, {
          method: 'POST',
          body: JSON.stringify({
            friendEmail: selectedSystemUser.email,
            friendName: selectedSystemUser.name,
          }),
        });
        const friendJson = await friendRes.json().catch(() => ({}));
        if (!friendRes.ok || !friendJson.success) {
          throw new Error(friendJson.message || 'Gagal menghubungkan pengguna sebagai rekan.');
        }
        autoFriended = true;
      }

      const payload = {
        userId: selectedUserId || `usr-custom-${Date.now()}`,
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
      setSelectedUserId('');
      setSelectedUserSnapshot(null);
      setUserSearch('');
      setCustomName('');
      setCustomEmail('');
      setSelectedRole('CONTRIBUTOR');
      setSuccess(
        autoFriended
          ? 'Berhasil ditambahkan sebagai kolaborator dan otomatis terhubung ke daftar rekan (Friend).'
          : 'Anggota berhasil ditambahkan ke kolaborator catatan.'
      );
      await Promise.all([fetchMembers(), fetchActiveUsersAndFriends()]);
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

        {success && (
          <div className="mx-4 mt-3 flex items-center gap-2 p-2.5 text-xs rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
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
              <div className="space-y-1 relative" ref={comboboxRef}>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Pilih Cepat Pengguna Sistem (Active)
                </label>
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    value={userSearch}
                    onFocus={() => setIsUserDropdownOpen(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUserSearch(val);
                      if (selectedUserId) {
                        setSelectedUserId('');
                        setSelectedUserSnapshot(null);
                      }
                      setIsUserDropdownOpen(true);
                    }}
                    placeholder="Cari & pilih pengguna aktif..."
                    className="pl-8 pr-14 h-8 text-xs bg-card"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    {isLoadingUsers && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    {(userSearch || selectedUserId) && (
                      <button
                        type="button"
                        onClick={handleClearSystemUser}
                        className="p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Bersihkan pilihan"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsUserDropdownOpen((o) => !o)}
                      className="p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Tampilkan daftar pengguna"
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {isUserDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg max-h-56 overflow-y-auto divide-y divide-border/50">
                    {isLoadingUsers && selectableActiveUsers.length === 0 ? (
                      <div className="p-3 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Memuat pengguna aktif...
                      </div>
                    ) : selectableActiveUsers.length === 0 ? (
                      <div className="p-3 text-center text-[11px] text-muted-foreground">
                        Tidak ada pengguna aktif lain yang tersedia.
                      </div>
                    ) : (
                      selectableActiveUsers.map((u) => {
                        const friend = isFriendUser(u);
                        const isSelected = u.id === selectedUserId;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handlePickSystemUser(u)}
                            className={`w-full text-left px-2.5 py-2 hover:bg-muted/60 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                              isSelected ? 'bg-primary/5' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                                {(u.name || u.username || '?').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{u.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                              </div>
                            </div>
                            <span
                              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 border ${
                                friend
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              }`}
                            >
                              {friend ? 'Friend' : 'Belum Berteman'}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Peran / Hak Akses (RACI)</label>
                <SelectField
                  size="sm"
                  value={selectedRole}
                  onChange={(val) => setSelectedRole(val as any)}
                  options={[
                    { value: 'CONTRIBUTOR', label: 'Kontributor (Dapat Edit & Selesaikan Tugas)' },
                    { value: 'APPROVER', label: 'Approver / Manager (Persetujuan BAST & Anggaran)' },
                    { value: 'FOLLOWER', label: 'Follower / Pengamat (Hanya Melihat Progres)' },
                    { value: 'OWNER', label: 'Pemilik Utama (Hak Penuh)' },
                  ]}
                  className="rounded-md bg-card"
                />
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

            {selectedSystemUser && !isSelectedUserFriend && (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[11px]">
                <span>
                  <strong>{selectedSystemUser.name}</strong> belum ada di daftar rekan Anda. Saat disubmit, pengguna akan otomatis dihubungkan sebagai <strong>Friend</strong> sekaligus menjadi kolaborator.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={canEdit}
                    onCheckedChange={(checked) => setCanEdit(Boolean(checked))}
                    disabled={selectedRole === 'FOLLOWER'}
                  />
                  <span>Boleh Mengedit</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={canApprove}
                    onCheckedChange={(checked) => setCanApprove(Boolean(checked))}
                    disabled={selectedRole === 'FOLLOWER'}
                  />
                  <span>Hak Approver</span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !customName.trim() || !customEmail.trim()}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {isSubmitting
                  ? 'Menyimpan...'
                  : selectedSystemUser && !isSelectedUserFriend
                    ? 'Add Friend & Tambahkan'
                    : 'Tambahkan'}
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
