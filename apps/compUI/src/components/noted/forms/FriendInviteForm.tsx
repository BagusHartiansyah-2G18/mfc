import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { Button, Input } from '@org/ui';
import { authFetch } from '@org/auth';

export interface VerifiedUserCandidate {
  id: string;
  username: string;
  name: string;
  email: string;
  status: string;
  role?: string;
  department?: string | null;
  jobTitle?: string | null;
}

interface FriendInviteFormProps {
  apiBaseUrl: string;
  onSuccess: (message: string) => void;
  onError: (message: string | null) => void;
  existingFriendEmails?: string[];
}

export function FriendInviteForm({
  apiBaseUrl,
  onSuccess,
  onError,
  existingFriendEmails = [],
}: FriendInviteFormProps) {
  const [query, setQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [candidates, setCandidates] = useState<VerifiedUserCandidate[]>([]);
  const [verifiedUser, setVerifiedUser] = useState<VerifiedUserCandidate | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runLookup = async (searchText: string, autoSelectExact = false) => {
    const trimmed = searchText.trim();
    if (trimmed.length < 2) {
      setCandidates([]);
      setHasSearched(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setIsSearching(true);
      onError(null);
      const res = await authFetch(
        `${apiBaseUrl}/friends/lookup?q=${encodeURIComponent(trimmed)}`,
        { signal: controller.signal }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memverifikasi data pengguna.');
      }

      const list: VerifiedUserCandidate[] = Array.isArray(json.data) ? json.data : [];
      setCandidates(list);
      setHasSearched(true);

      if (autoSelectExact) {
        const lower = trimmed.toLowerCase();
        const exact = list.find(
          (u) => u.email.toLowerCase() === lower || u.username.toLowerCase() === lower
        );
        if (exact) {
          setVerifiedUser(exact);
          setCandidates([]);
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setCandidates([]);
      setHasSearched(true);
      onError(err.message || 'Gagal memverifikasi pengguna di server.');
    } finally {
      if (abortRef.current === controller) {
        setIsSearching(false);
      }
    }
  };

  useEffect(() => {
    if (verifiedUser) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      abortRef.current?.abort();
      setCandidates([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    // Jeda 800ms setelah user berhenti mengetik agar tidak mengirim request saat sedang mengetik
    setHasSearched(false);
    const timer = window.setTimeout(() => {
      runLookup(trimmed, false);
    }, 800);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, verifiedUser, apiBaseUrl]);

  const handleSelectCandidate = (candidate: VerifiedUserCandidate) => {
    setVerifiedUser(candidate);
    setQuery(candidate.email);
    setCandidates([]);
    setHasSearched(false);
    onError(null);
  };

  const handleClearVerified = () => {
    setVerifiedUser(null);
    setQuery('');
    setCustomName('');
    setCandidates([]);
    setHasSearched(false);
    onError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedUser) {
      onError('Verifikasi dan pilih akun pengguna terdaftar terlebih dahulu sebelum menghubungkan.');
      return;
    }

    try {
      setIsSubmitting(true);
      onError(null);
      const res = await authFetch(`${apiBaseUrl}/friends/invite`, {
        method: 'POST',
        body: JSON.stringify({
          friendEmail: verifiedUser.email,
          friendName: customName.trim() || verifiedUser.name,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menambahkan rekan.');
      }

      handleClearVerified();
      onSuccess(json.message || `Rekan terverifikasi (${verifiedUser.name}) berhasil ditambahkan.`);
    } catch (err: any) {
      onError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingSet = new Set(existingFriendEmails.map((e) => e.toLowerCase()));
  const isAlreadyConnected = verifiedUser
    ? existingSet.has(verifiedUser.email.toLowerCase())
    : false;

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
          <UserPlus className="h-4 w-4 text-primary" />
          <span>Tambah / Undang Rekan Terverifikasi</span>
        </h4>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Wajib akun aktif terdaftar
        </span>
      </div>

      {!verifiedUser ? (
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-foreground">
            Cari Email atau Username Rekan <span className="text-rose-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik email, username, atau nama pengguna terdaftar..."
                className="pl-8 h-8 text-xs bg-card"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSearching || query.trim().length < 2}
              onClick={() => runLookup(query, true)}
              className="h-8 text-xs gap-1.5 shrink-0 cursor-pointer"
            >
              {isSearching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}
              <span>Verifikasi</span>
            </Button>
          </div>

          {isSearching && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Memeriksa data pengguna terdaftar di sistem...</span>
            </p>
          )}

          {!isSearching && candidates.length > 0 && (
            <div className="rounded-lg border border-border/80 bg-background divide-y divide-border/50 max-h-48 overflow-y-auto shadow-sm">
              {candidates.map((c) => {
                const connected = existingSet.has(c.email.toLowerCase());
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCandidate(c)}
                    className="w-full text-left p-2.5 hover:bg-muted/40 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                        {(c.name || c.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-foreground truncate">
                          {c.name}{' '}
                          <span className="font-normal text-muted-foreground">(@{c.username})</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {c.email}
                          {c.role ? ` • ${c.role}` : ''}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${
                        connected
                          ? 'bg-muted text-muted-foreground border-border'
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      }`}
                    >
                      {connected ? 'Sudah Terhubung' : 'Pilih'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!isSearching && hasSearched && candidates.length === 0 && query.trim().length >= 2 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[11px]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>
                Email atau pengguna <strong>&quot;{query.trim()}&quot;</strong> tidak ditemukan sebagai akun aktif terdaftar.
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-emerald-500/15 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                {(verifiedUser.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-xs text-foreground truncate">{verifiedUser.name}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-700 font-semibold px-1.5 py-0.5 rounded-full">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Terverifikasi
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {verifiedUser.email} • @{verifiedUser.username}
                  {verifiedUser.role ? ` • ${verifiedUser.role}` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearVerified}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              title="Pilih pengguna lain"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {isAlreadyConnected && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/20 text-[11px]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Pengguna ini sudah terdaftar di daftar rekan Anda.</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">
              Alias / Nama Tampilan Rekan (Opsional)
            </label>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={`Default: ${verifiedUser.name}`}
              className="h-8 text-xs bg-card"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          size="sm"
          disabled={!verifiedUser || isSubmitting || isAlreadyConnected}
          className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
        >
          <UserCheck className="h-3.5 w-3.5" />
          <span>{isSubmitting ? 'Menghubungkan...' : 'Hubungkan Rekan'}</span>
        </Button>
      </div>
    </form>
  );
}
