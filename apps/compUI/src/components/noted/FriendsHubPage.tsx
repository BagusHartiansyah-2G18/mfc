import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Mail, RotateCcw, Trash2, UserCheck, UserPlus, Users } from 'lucide-react';
import { Button, Input } from '@org/ui';
import { authFetch } from '@org/auth';
import type { UserFriend } from './types';

interface FriendsHubPageProps {
  apiBaseUrl?: string;
  onNavigate?: (path: string) => void;
}

export function FriendsHubPage({ apiBaseUrl = 'http://localhost:3002/api' }: FriendsHubPageProps) {
  const [friends, setFriends] = useState<UserFriend[]>([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [friendName, setFriendName] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await authFetch(`${apiBaseUrl}/friends`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Gagal memuat daftar rekan.');
      setFriends(Array.isArray(json.data) ? json.data : []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar rekan.');
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendEmail.trim()) { setError('Alamat email rekan wajib diisi.'); return; }
    try {
      setIsSubmitting(true); setError(null); setSuccess(null);
      const res = await authFetch(`${apiBaseUrl}/friends/invite`, {
        method: 'POST',
        body: JSON.stringify({ friendEmail: friendEmail.trim(), friendName: friendName.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Gagal menambahkan rekan.');
      setSuccess('Rekan berhasil ditambahkan ke daftar pertemanan.');
      setFriendEmail(''); setFriendName('');
      fetchFriends();
    } catch (err: any) { setError(err.message || 'Terjadi kesalahan sistem.'); }
    finally { setIsSubmitting(false); }
  };

  const handleRemoveFriend = async (id: string) => {
    if (!window.confirm('Hapus rekan ini dari daftar pertemanan Anda?')) return;
    try {
      const res = await authFetch(`${apiBaseUrl}/friends/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.message || 'Gagal menghapus rekan.');
      fetchFriends();
    } catch (err: any) { setError(err.message || 'Gagal menghapus rekan.'); }
  };

  const filtered = friends.filter((f) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${f.friendName} ${f.friendEmail} ${f.friendRole || ''}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Kelola Rekan (Friends Hub)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola daftar rekan untuk publikasi <strong>Khusus</strong>, berbagi catatan, dan akses form pendukung.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFriends} className="h-8 text-xs gap-1.5"><RotateCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Segarkan</Button>
      </div>

      {error && <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20"><AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span></div>}
      {success && <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"><CheckCircle2 className="h-4 w-4 shrink-0" /><span>{success}</span></div>}

      <form onSubmit={handleInvite} className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
        <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5"><UserPlus className="h-4 w-4 text-primary" /><span>Tambah / Undang Rekan Baru</span></h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">Alamat Email Rekan <span className="text-rose-500">*</span></label>
            <div className="relative"><Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><Input type="email" value={friendEmail} onChange={(e) => setFriendEmail(e.target.value)} placeholder="nama@bgs-software.id" className="pl-8 h-8 text-xs bg-card" required /></div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">Nama Rekan (Opsional)</label>
            <Input value={friendName} onChange={(e) => setFriendName(e.target.value)} placeholder="Contoh: Budi Santoso" className="h-8 text-xs bg-card" />
          </div>
        </div>
        <div className="flex justify-end"><Button type="submit" size="sm" disabled={isSubmitting} className="h-8 text-xs font-semibold gap-1.5"><UserCheck className="h-3.5 w-3.5" /><span>{isSubmitting ? 'Menambahkan...' : 'Hubungkan Rekan'}</span></Button></div>
      </form>

      <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
        <div className="p-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <h4 className="font-bold text-xs text-foreground">Daftar Rekan Terhubung ({filtered.length})</h4>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama/email..." className="h-8 text-xs max-w-xs" />
        </div>
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-xs">Belum ada rekan yang cocok.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((f) => (
              <div key={f.id} className="p-3 flex items-center justify-between gap-3 hover:bg-muted/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">{(f.friendName || '?').charAt(0).toUpperCase()}</div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-foreground truncate">{f.friendName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{f.friendEmail}</p>
                    {f.friendRole && <p className="text-[10px] text-muted-foreground truncate">{f.friendRole}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">{f.status || 'ACCEPTED'}</span>
                  <button type="button" onClick={() => handleRemoveFriend(f.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer" title="Hapus Rekan"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
