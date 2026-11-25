import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@org/ui';
import {
  Users,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { type UserFriend } from '../types';
import { authFetch } from '@org/auth';
import { FriendInviteForm } from './FriendInviteForm';

interface FriendsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl?: string;
  authToken?: string;
}

export function FriendsManagerModal({
  isOpen,
  onClose,
  apiBaseUrl = 'http://localhost:3002/api',
}: FriendsManagerModalProps) {
  const [friends, setFriends] = useState<UserFriend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await authFetch(`${apiBaseUrl}/friends`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setFriends(json.data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar rekan.');
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, fetchFriends]);

  const handleRemoveFriend = async (id: string) => {
    if (!window.confirm('Hapus rekan ini dari daftar pertemanan Anda?')) return;
    try {
      await authFetch(`${apiBaseUrl}/friends/${id}`, {
        method: 'DELETE',
      });
      fetchFriends();
    } catch (err) {
      console.warn('Gagal menghapus rekan:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/80 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span>Kelola Rekan & Friends List</span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">
                  {friends.length} Rekan
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Rekan terhubung dapat dipilih untuk menerima hak akses pada mode publikasi <strong>Khusus</strong>.
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

        {success && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-3 text-xs rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Add Friend Form */}
          <FriendInviteForm
            apiBaseUrl={apiBaseUrl}
            existingFriendEmails={friends.map((f) => f.friendEmail)}
            onSuccess={(msg) => {
              setSuccess(msg);
              setError(null);
              fetchFriends();
            }}
            onError={(msg) => {
              setError(msg);
              if (msg) setSuccess(null);
            }}
          />

          {/* Connected Friends List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-foreground">Daftar Rekan Terhubung ({friends.length})</h4>
              <button
                type="button"
                onClick={fetchFriends}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            {friends.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-border/80 text-muted-foreground space-y-1">
                <p>Belum ada rekan di daftar pertemanan.</p>
                <p className="text-[11px]">Gunakan formulir di atas untuk mengundang rekan kerja Anda.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {friends.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-xl border border-border/80 bg-card hover:border-primary/30 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {f.friendName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-foreground truncate">{f.friendName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{f.friendEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Terhubung
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFriend(f.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                        title="Hapus Rekan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border/80 bg-muted/10">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onClose}
            className="text-xs cursor-pointer"
          >
            Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
