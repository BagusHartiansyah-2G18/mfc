import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  BookOpen,
  FileDown,
  AlertCircle,
  TrendingUp,
  Users,
  Upload,
  SlidersHorizontal,
  Globe,
  UserPlus,
  Eye,
  Copy,
  Link as LinkIcon,
  Trash2,
  ArchiveX,
  CheckCircle2,
  Search,
  SearchX,
  Info,
  ArrowUpDown,
} from 'lucide-react';
import { Button, Input, Pagination } from '@org/ui';
import { useAuth, setSession, authFetch } from '@org/auth';
import {
  type JudulNote,
  type NoteBreadcrumb,
  type NoteFormData,
  type NoteSubResponse,
} from './types';
import { NoteCard } from './NoteCard';
import { NoteHierarchyBreadcrumb } from './NoteHierarchyBreadcrumb';
import { NoteTreeTable } from './NoteTreeTable';
import { NoteFormModal } from './NoteFormModal';
import { NoteExportModal } from './NoteExportModal';
import { NoteMembersModal } from './NoteMembersModal';
import { NoteMediaModal } from './NoteMediaModal';

import { FriendsManagerModal } from './forms/FriendsManagerModal';
import { NoteReaderModal } from './NoteReaderModal';

export interface NotedViewProps {
  apiBaseUrl?: string;
  onNavigate?: (path: string) => void;
  initialTab?: 'MY_NOTES' | 'SHARED_WITH_ME' | 'PUBLIC_CATALOG';
  activeTab?: 'MY_NOTES' | 'SHARED_WITH_ME' | 'PUBLIC_CATALOG';
  showInternalTabs?: boolean;
}

const PAGE_SIZE = 10;

export function NotedView({ apiBaseUrl, onNavigate, initialTab, activeTab, showInternalTabs = true }: NotedViewProps) {
  const { session, isDevBypass } = useAuth();

  const baseUrl = (
    apiBaseUrl ||
    ((import.meta.env as any)?.VITE_API_NOTED_URL as string | undefined) ||
    'http://localhost:3002/api'
  )
    .trim()
    .replace(/\/+$/, '');

  const [rootNotes, setRootNotes] = useState<JudulNote[]>([]);
  const [subChain, setSubChain] = useState<NoteBreadcrumb[]>([]);
  const [subNotes, setSubNotes] = useState<JudulNote[]>([]);
  const [selectedParent, setSelectedParent] = useState<JudulNote | null>(null);

  // 3-Tier Multi-Tab Hub (Catatan Saya, Dibagikan ke Saya, Katalog Publik)
  const getInitialTab = (): 'MY_NOTES' | 'SHARED_WITH_ME' | 'PUBLIC_CATALOG' => {
    if (activeTab) return activeTab;
    if (initialTab) return initialTab;
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.endsWith('/shared')) return 'SHARED_WITH_ME';
      if (pathname.endsWith('/public') || pathname.endsWith('/katalog-publik')) return 'PUBLIC_CATALOG';
    }
    return 'MY_NOTES';
  };

  const [mainTab, setMainTab] = useState<'MY_NOTES' | 'SHARED_WITH_ME' | 'PUBLIC_CATALOG'>(getInitialTab);

  useEffect(() => {
    if (activeTab && activeTab !== mainTab) {
      setMainTab(activeTab);
    }
  }, [activeTab]);
  const [sharedNotes, setSharedNotes] = useState<JudulNote[]>([]);
  const [publicNotes, setPublicNotes] = useState<JudulNote[]>([]);

  // List toolbar: search + pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [mainTab, searchQuery]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<JudulNote | null>(null);

  // New Enterprise Document Reader Mode
  const [readerNote, setReaderNote] = useState<JudulNote | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  // New Modals: Members & Media/PDF
  const [memberModalNote, setMemberModalNote] = useState<JudulNote | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [mediaModalNote, setMediaModalNote] = useState<JudulNote | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Friends Hub Modal
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);

  // New Slide-Over Supporting Forms Drawer (Enterprise Flexible Forms Hub)


  // Soft-Delete Confirm Dialog State
  const [deleteConfirmNote, setDeleteConfirmNote] = useState<JudulNote | null>(null);
  const [deletePreview, setDeletePreview] = useState<{
    totalCount: number;
    childrenCount: number;
    hasChildren: boolean;
    judul: string;
  } | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [, setIsLoadingPreview] = useState(false);

  // Copy Link Feedback State
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  const isAuthError = Boolean(
    error && (
      error.toLowerCase().includes('sesi autentikasi') ||
      error.toLowerCase().includes('unauthorized') ||
      error.toLowerCase().includes('token tidak valid') ||
      error.toLowerCase().includes('401')
    )
  );

  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false);

  const handleQuickLogin = async () => {
    try {
      setIsQuickLoggingIn(true);
      setError(null);
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: 'admin@bgs-software.id',
          password: 'Password123!',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Login cepat gagal.');
      }
      setSession({
        id: data.user.id,
        username: data.user.username,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        permissions: data.user.permissions,
        token: data.accessToken,
        refreshToken: data.refreshToken,
      }, true);
      if (typeof window !== 'undefined' && data.refreshToken) {
        window.localStorage.setItem('mfc_auth_refresh_token', data.refreshToken);
      }
      // Re-trigger fetch
      await Promise.allSettled([fetchRootNotes(), fetchSharedNotes(), fetchPublicNotes()]);
    } catch (e) {
      setError((e as Error).message || 'Gagal login cepat ke Auth Service.');
    } finally {
      setIsQuickLoggingIn(false);
    }
  };

  // 1. Load Root Notes (Tingkat 0) dengan Auto-Refresh & Retry Transparan
  const fetchRootNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await authFetch(`${baseUrl}/notes?tingkat=0`);
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || `Gagal memuat catatan (HTTP ${res.status})`);
      }
      const data = await res.json();
      setRootNotes(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[NotedView] fetchRootNotes error:', err);
      setError((err as Error).message || 'Gagal memuat daftar catatan induk.');
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  // 2. Load Sub-Notes given parent
  const fetchSubNotes = useCallback(
    async (parent: JudulNote) => {
      try {
        setIsLoading(true);
        setError(null);
        const queryParams = new URLSearchParams({
          tingkat: String(parent.tingkat),
          kdJudul: parent.kdJudul,
          kdMember: parent.kdMember,
        });
        const res = await authFetch(`${baseUrl}/notes/sub?${queryParams.toString()}`);
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.message || `Gagal memuat sub-catatan (HTTP ${res.status})`);
        }
        const data: { data?: NoteSubResponse } & NoteSubResponse = await res.json();
        const payload = data.data || data;

        setSubChain(payload.induk || []);
        setSubNotes(payload.sub || []);
        setSelectedParent(payload.current || parent);
      } catch (err) {
        console.error('[NotedView] fetchSubNotes error:', err);
        setError((err as Error).message || 'Gagal memuat hirarki sub-catatan.');
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // 3. Load Shared With Me Notes (Mode Khusus / Anggota Rekan)
  const fetchSharedNotes = useCallback(async () => {
    try {
      const res = await authFetch(`${baseUrl}/sharing/shared-with-me`);
      if (res.ok) {
        const data = await res.json();
        setSharedNotes(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('[NotedView] fetchSharedNotes notice:', err);
    }
  }, [baseUrl]);

  // 4. Load Public Catalog (Mode Terbuka / Tanpa Login)
  const fetchPublicNotes = useCallback(async () => {
    try {
      const res = await authFetch(`${baseUrl}/sharing/public-catalog`, { skipAuth: true });
      if (res.ok) {
        const data = await res.json();
        setPublicNotes(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('[NotedView] fetchPublicNotes notice:', err);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchRootNotes();
    fetchSharedNotes();
    fetchPublicNotes();
  }, [fetchRootNotes, fetchSharedNotes, fetchPublicNotes]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('panel') === 'friend') setIsFriendsModalOpen(true);
      if (params.get('tab') === 'publikasi') setMainTab('PUBLIC_CATALOG');
      const kd = params.get('kdJudul') || params.get('note');
      if (kd) {
        localStorage.setItem('noted_active_kdJudul', kd);
        (async () => {
          try {
            setIsLoading(true);
            setError(null);
            const res = await authFetch(
              `${baseUrl}/notes/sub?kdJudul=${encodeURIComponent(kd)}`
            );
            if (!res.ok) {
              const payload = await res.json().catch(() => null);
              throw new Error(payload?.message || `Catatan #${kd} tidak ditemukan.`);
            }
            const data: { data?: NoteSubResponse } & NoteSubResponse = await res.json();
            const payload = data.data || data;
            if (payload.current) {
              setSubChain(payload.induk || []);
              setSubNotes(payload.sub || []);
              setSelectedParent(payload.current);
            }
          } catch (err) {
            setError((err as Error).message || `Gagal memuat catatan #${kd}.`);
          } finally {
            setIsLoading(false);
          }
        })();
      }
    } catch { /* ignore */ }
  }, [baseUrl]);

  // Navigation: Go back to Root
  const handleGoRoot = () => {
    setSelectedParent(null);
    setSubChain([]);
    setSubNotes([]);
    fetchRootNotes();
  };

  // Navigation: Jump to breadcrumb level
  const handleSelectLevel = (breadcrumbItem: NoteBreadcrumb, _index: number) => {
    try { localStorage.setItem('noted_active_kdJudul', breadcrumbItem.kdJudul); } catch {}
    fetchSubNotes({
      kdJudul: breadcrumbItem.kdJudul,
      judul: breadcrumbItem.judul,
      ringkasan: breadcrumbItem.ringkasan,
      tingkat: breadcrumbItem.tingkat,
      kdMember: breadcrumbItem.kdMember,
      status: (breadcrumbItem.status as any) || 'IN_PROGRESS',
      progress: breadcrumbItem.progress || 0,
    });
  };

  // CRUD: Add or Update Note
  const handleSaveNote = async (data: NoteFormData) => {
    const isEdit = Boolean(editingNote);
    const endpoint = isEdit ? `${baseUrl}/notes/upd` : `${baseUrl}/notes/add`;
    const method = isEdit ? 'PUT' : 'POST';

    const bodyPayload = isEdit
      ? {
          kdJudul: editingNote!.kdJudul,
          kdMember: editingNote!.kdMember,
          tingkat: editingNote!.tingkat,
          judul: data.judul,
          ringkasan: data.ringkasan,
          catatanDetail: data.catatanDetail,
          status: data.status,
          priority: data.priority,
          stage: data.stage,
          progress: data.progress,
          weight: data.weight,
          targetBudget: data.targetBudget,
          dueDate: data.dueDate,
          picName: data.picName,
          picId: data.picId,
          tags: data.tags,
          sharingMode: data.sharingMode,
        }
      : {
          judul: data.judul,
          ringkasan: data.ringkasan,
          catatanDetail: data.catatanDetail,
          tingkat: data.tingkat,
          kdJudul: data.kdJudul,
          kdMember: data.kdMember,
          status: data.status,
          priority: data.priority,
          stage: data.stage,
          weight: data.weight,
          targetBudget: data.targetBudget,
          dueDate: data.dueDate,
          picName: data.picName,
          picId: data.picId,
          tags: data.tags,
          sharingMode: data.sharingMode,
        };

    const res = await authFetch(endpoint, {
      method,
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || 'Gagal menyimpan catatan.');
    }

    if (selectedParent) {
      await fetchSubNotes(selectedParent);
    } else {
      await fetchRootNotes();
    }
  };

  // CRUD: Delete Note â€” Step 1: Fetch preview info dan tampilkan dialog konfirmasi
  const handleDeleteNote = async (note: JudulNote) => {
    try {
      setIsLoadingPreview(true);
      const res = await authFetch(`${baseUrl}/notes/${encodeURIComponent(note.kdJudul)}/delete-preview`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Gagal mengambil informasi catatan.');
      }
      const json = await res.json();
      setDeletePreview(json.data);
      setDeleteConfirmNote(note);
      setIsDeleteConfirmOpen(true);
    } catch (err) {
      console.error('[NotedView] handleDeleteNote preview error:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // CRUD: Delete Note â€” Step 2: Konfirmasi â†’ Arsipkan (soft delete)
  const handleConfirmArchive = async () => {
    if (!deleteConfirmNote) return;
    try {
      setIsLoading(true);
      setIsDeleteConfirmOpen(false);
      const res = await authFetch(`${baseUrl}/notes/${encodeURIComponent(deleteConfirmNote.kdJudul)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Gagal mengarsipkan catatan.');
      }

      if (selectedParent) {
        await fetchSubNotes(selectedParent);
      } else {
        await fetchRootNotes();
      }
    } catch (err) {
      console.error('[NotedView] handleConfirmArchive error:', err);
      setError((err as Error).message || 'Gagal mengarsipkan catatan.');
    } finally {
      setIsLoading(false);
      setDeleteConfirmNote(null);
      setDeletePreview(null);
    }
  };

  // Public Catalog: Salin link catatan ke clipboard (menghasilkan URL mandiri /n/:kdJudul yang bebas dibuka publik)
  const handleCopyPublicLink = (note: JudulNote) => {
    try {
      const link = `${window.location.origin}/n/${encodeURIComponent(note.kdJudul)}`;
      navigator.clipboard.writeText(link).then(() => {
        setCopiedNoteId(note.kdJudul);
        setTimeout(() => setCopiedNoteId(null), 2000);
      });
    } catch {
      // fallback jika clipboard API tidak tersedia
    }
  };

  // Quick Status Change on Sub-table
  const handleQuickStatusChange = async (note: JudulNote, nextStatus: string) => {
    try {
      const res = await authFetch(`${baseUrl}/notes/upd`, {
        method: 'PUT',
        body: JSON.stringify({
          kdJudul: note.kdJudul,
          kdMember: note.kdMember,
          status: nextStatus,
          progress: nextStatus === 'COMPLETED' ? 100 : note.progress,
        }),
      });
      if (res.ok && selectedParent) {
        fetchSubNotes(selectedParent);
      }
    } catch (err) {
      console.warn('Quick status update failed:', err);
    }
  };

  // 1-Click Auto-Scaffold 5 Tahapan MFC Standard
  const handleScaffoldStages = async (parentKdJudul: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await authFetch(`${baseUrl}/notes/${encodeURIComponent(parentKdJudul)}/scaffold-stages`, {
        method: 'POST',
        body: JSON.stringify({ preset: 'MFC_STANDARD' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal men-generate 5 tahapan MFC.');
      }

      if (selectedParent && selectedParent.kdJudul === parentKdJudul) {
        await fetchSubNotes(selectedParent);
      } else {
        await fetchRootNotes();
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat melakukan auto-scaffolding.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenMembersModal = (note: JudulNote) => {
    setMemberModalNote(note);
    setIsMemberModalOpen(true);
  };

  const handleOpenMediaModal = (note: JudulNote) => {
    setMediaModalNote(note);
    setIsMediaModalOpen(true);
  };

  const handleOpenSupportingDrawer = (note: JudulNote) => {
    // Selalu buka Form Pendukung di tab baru agar posisi halaman/sub-catatan pengguna tidak hilang
    const isPortal = window.location.pathname.startsWith('/noted');
    const basePath = isPortal ? '/noted/forms' : '/forms';
    const targetUrl = `${basePath}/${encodeURIComponent(note.kdJudul)}`;
    window.open(targetUrl, '_blank');
  };

  const handleRefreshCurrentView = () => {
    fetchPublicNotes(); // Selalu refresh katalog publik juga
    if (selectedParent) {
      fetchSubNotes(selectedParent);
    } else if (mainTab === 'SHARED_WITH_ME') {
      fetchSharedNotes();
    } else if (mainTab === 'PUBLIC_CATALOG') {
      fetchPublicNotes();
    } else {
      fetchRootNotes();
    }
  };

  // Open / Close Reader Mode Handlers
  const handleOpenReader = (note: JudulNote) => {
    setReaderNote(note);
    setIsReaderOpen(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('viewNote', note.kdJudul);
      window.history.replaceState({}, '', url.toString());
    } catch {}
  };

  const handleCloseReader = () => {
    setIsReaderOpen(false);
    setReaderNote(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('viewNote');
      window.history.replaceState({}, '', url.toString());
    } catch {}
  };

  const handleSwitchFromReaderToEdit = (note: JudulNote) => {
    setIsReaderOpen(false);
    setReaderNote(null);
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleCreateSubNoteFromReader = (parentNote: JudulNote) => {
    setIsReaderOpen(false);
    setReaderNote(null);
    setSelectedParent(parentNote);
    setEditingNote(null);
    setIsModalOpen(true);
  };

  // URL Deep-Linking Effect: Restore Reader when ?viewNote=... is present
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('viewNote') || params.get('note');
      if (viewParam) {
        const foundInSub = subNotes.find((n) => n.kdJudul === viewParam);
        const foundInRoot = rootNotes.find((n) => n.kdJudul === viewParam);
        const foundInPublic = publicNotes.find((n) => n.kdJudul === viewParam);
        const found = foundInSub || foundInRoot || foundInPublic;
        if (found) {
          if (foundInPublic && !foundInSub && !foundInRoot) {
            setMainTab('PUBLIC_CATALOG');
          }
          setReaderNote(found);
          setIsReaderOpen(true);
        }
      }
    } catch {}
  }, [rootNotes, subNotes, publicNotes]);

  // Derive the active list: default sort by createdAt desc, then search + paginate (max 10/page)
  const tabBaseList =
    mainTab === 'MY_NOTES' ? rootNotes : mainTab === 'SHARED_WITH_ME' ? sharedNotes : publicNotes;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;
  const sortedNotes = [...tabBaseList].sort((a, b) => {
    const aTime = new Date(a.createdAt ?? a.updatedAt ?? 0).getTime();
    const bTime = new Date(b.createdAt ?? b.updatedAt ?? 0).getTime();
    return bTime - aTime;
  });
  const filteredNotes = isSearching
    ? sortedNotes.filter((n) =>
        [n.judul, n.ringkasan, n.kdJudul, n.picName, n.tags]
          .filter((v): v is string => Boolean(v))
          .some((v) => v.toLowerCase().includes(normalizedQuery))
      )
    : sortedNotes;
  const totalItems = filteredNotes.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedNotes = filteredNotes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalItems);
  const tabTitle =
    mainTab === 'MY_NOTES'
      ? 'Daftar Seluruh Catatan Induk'
      : mainTab === 'SHARED_WITH_ME'
      ? 'Catatan yang Dibagikan oleh Rekan'
      : 'Katalog Terbuka Publik';

  return (
    <div className="w-full space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Catatan Hierarki</span> 
              </h2> 
            </div>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsExportOpen(true)}
            className="h-8 w-8 cursor-pointer shadow-2xs"
            title="Ekspor WBS / LPJ"
            aria-label="Ekspor WBS / LPJ"
          >
            <FileDown className="h-3.5 w-3.5" />
          </Button>

          {selectedParent ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoRoot}
              className="text-xs gap-1.5 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Beranda</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefreshCurrentView}
              disabled={isLoading}
              className="h-8 w-8 cursor-pointer shadow-2xs"
              title="Segarkan Data"
              aria-label="Segarkan Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setEditingNote(null);
              setIsModalOpen(true);
            }}
            className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{selectedParent ? 'Tambah Sub-Catatan' : 'Tambah Catatan Induk'}</span>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className={`rounded-xl border p-4 text-xs flex items-start gap-3 ${
            isAuthError
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <p className="font-semibold text-sm">
              {isAuthError ? 'Sesi Autentikasi Diperlukan' : 'Gagal Mengakses Layanan Catatan (api-noted)'}
            </p>
            <p className="text-muted-foreground">{error}</p>
            <div className="pt-2 flex items-center gap-2 flex-wrap">
              {isAuthError && isDevBypass && (
                <Button
                  variant="default"
                  size="sm"
                  disabled={isQuickLoggingIn}
                  onClick={handleQuickLogin}
                  className="h-8 text-xs gap-1.5 cursor-pointer shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isQuickLoggingIn ? 'Sedang Masuk...' : 'Masuk Cepat sebagai Super Administrator (Port 3001)'}
                </Button>
              )}
              {isAuthError && !isDevBypass && (
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="h-8 text-xs gap-1.5 cursor-pointer shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <a href="/login?redirect=/noted">
                    Ke Halaman Login
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={selectedParent ? () => fetchSubNotes(selectedParent) : fetchRootNotes}
                className="h-8 text-xs gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Coba Sambungkan Lagi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE: Sub-Notes Hierarchy View */}
      {selectedParent ? (
        <div className="space-y-4">
          <NoteHierarchyBreadcrumb
            chain={subChain}
            onSelectLevel={handleSelectLevel}
            onGoRoot={handleGoRoot}
          />

          {/* Induk Card Banner with Rich Progress & Actions */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-md shadow-2xs">
                  Induk: #{selectedParent.kdJudul}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Tingkat {selectedParent.tingkat}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-muted text-foreground">
                  Status: {selectedParent.status}
                </span>
              </div>

              {/* Action Buttons for Parent Note */}
              <div className="flex items-center gap-2">
                {selectedParent.tingkat === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleScaffoldStages(selectedParent.kdJudul)}
                    className="h-7 text-xs font-bold text-amber-700 dark:text-amber-400 border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 gap-1.5 cursor-pointer"
                    title="Buat Otomatis 5 Tahapan MFC (Analisis, UI, Dev, Test, Deploy)"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>âš¡ Auto-Generate 5 Tahapan</span>
                  </Button>
                )}

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleOpenReader(selectedParent)}
                  className="h-7 text-xs gap-1 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 cursor-pointer shadow-xs"
                  title="Buka Lembar Dokumen & Mode Baca Bersih"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Baca Dokumen</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenMembersModal(selectedParent)}
                  className="h-7 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
                  title="Kelola Tim & Follower Induk"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Tim</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenMediaModal(selectedParent)}
                  className="h-7 text-xs gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                  title="Form Upload & Berkas Media"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Form Upload</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenSupportingDrawer(selectedParent)}
                  className="h-7 text-xs gap-1 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 cursor-pointer"
                  title="Buka Panel Seluruh Form Pendukung (Buku Kas, Ceklist, Berkas, Tim, Approval)"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Form Pendukung</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingNote(selectedParent);
                    setIsModalOpen(true);
                  }}
                  className="h-7 text-xs text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
                >
                  Edit Induk
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground">{selectedParent.judul}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">{selectedParent.ringkasan}</p>
            </div>

            {/* Rollup Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span>Akumulasi Capaian Progres Induk (Weighted Rollup)</span>
                </span>
                <span className="font-mono text-primary font-bold">{selectedParent.progress || 0}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${selectedParent.progress || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sub-Notes Table */}
          <NoteTreeTable
            subNotes={subNotes}
            onEdit={(note) => {
              setEditingNote(note);
              setIsModalOpen(true);
            }}
            onDelete={handleDeleteNote}
            onEnterSub={fetchSubNotes}
            onView={handleOpenReader}
            onQuickStatusChange={handleQuickStatusChange}
            onManageMembers={handleOpenMembersModal}
            onManageMedia={handleOpenMediaModal}
            onOpenSupportingDrawer={handleOpenSupportingDrawer}
          />
        </div>
      ) : (
        /* VIEW MODE: Multi-Tab Central Data Hub */
        <div className="space-y-5">
          {showInternalTabs && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/50 text-xs flex-wrap">
              <button type="button" onClick={() => { setMainTab('MY_NOTES'); onNavigate ? onNavigate('/') : window.history.pushState({}, '', '/noted'); fetchRootNotes(); }} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${mainTab === 'MY_NOTES' ? 'bg-card text-foreground shadow-xs border border-border/40' : 'text-muted-foreground hover:text-foreground'}`}>
                <BookOpen className="h-3.5 w-3.5 text-primary" /><span>Catatan Saya</span><span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">{rootNotes.length}</span>
              </button>
              <button type="button" onClick={() => { setMainTab('SHARED_WITH_ME'); onNavigate ? onNavigate('/shared') : window.history.pushState({}, '', '/noted/shared'); fetchSharedNotes(); }} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${mainTab === 'SHARED_WITH_ME' ? 'bg-card text-foreground shadow-xs border border-border/40' : 'text-muted-foreground hover:text-foreground'}`}>
                <Users className="h-3.5 w-3.5 text-indigo-500" /><span>Dibagikan ke Saya</span><span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-600">{sharedNotes.length}</span>
              </button>
              <button type="button" onClick={() => { setMainTab('PUBLIC_CATALOG'); onNavigate ? onNavigate('/public') : window.history.pushState({}, '', '/noted/public'); fetchPublicNotes(); }} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${mainTab === 'PUBLIC_CATALOG' ? 'bg-card text-foreground shadow-xs border border-border/40' : 'text-muted-foreground hover:text-foreground'}`}>
                <Globe className="h-3.5 w-3.5 text-emerald-500" /><span>Katalog Publik</span><span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600">{publicNotes.length}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsFriendsModalOpen(true)} className="text-xs gap-1.5 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 cursor-pointer shadow-2xs" title="Kelola Daftar Rekan / Anggota untuk Distribusi Form & Catatan">
                <UserPlus className="h-3.5 w-3.5" /><span>Kelola Rekan (Friends Hub)</span>
              </Button>
            </div>
          </div>
          )}

          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">
                {tabTitle} ·{' '}
                <strong className="text-foreground">
                  {isSearching ? `${totalItems} hasil` : `${tabBaseList.length} catatan`}
                </strong>
              </span>
              <span className="hidden md:inline-flex items-center gap-1 rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground" title="Diurutkan berdasarkan tanggal dibuat terbaru">
                <ArrowUpDown className="h-3 w-3" /> Terbaru
              </span>
              {isDevBypass && (
                <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-md">Bypass</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari judul, ringkasan, kode..."
                  className="h-8 bg-background pl-8 text-xs"
                />
              </div>
              {!showInternalTabs && (
                <Button variant="outline" size="sm" onClick={() => setIsFriendsModalOpen(true)} className="h-8 shrink-0 text-[11px] gap-1.5 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 cursor-pointer">
                  <UserPlus className="h-3.5 w-3.5" /><span>Kelola Rekan</span>
                </Button>
              )}
            </div>
          </div>

          {/* Grid Content or Empty State */}
          {(() => {
            if (tabBaseList.length === 0 && !isLoading) {
              return (
                <div className="rounded-2xl border-2 border-dashed border-border/80 p-12 text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-muted/80 flex items-center justify-center text-muted-foreground mx-auto">
                    {mainTab === 'MY_NOTES' && <BookOpen className="h-6 w-6" />}
                    {mainTab === 'SHARED_WITH_ME' && <Users className="h-6 w-6 text-indigo-500" />}
                    {mainTab === 'PUBLIC_CATALOG' && <Globe className="h-6 w-6 text-emerald-500" />}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-base text-foreground">
                      {mainTab === 'MY_NOTES' && 'Belum Ada Catatan Induk'}
                      {mainTab === 'SHARED_WITH_ME' && 'Belum Ada Catatan yang Dibagikan'}
                      {mainTab === 'PUBLIC_CATALOG' && 'Katalog Publik Masih Kosong'}
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      {mainTab === 'MY_NOTES' &&
                        'Mulai bangun dekomposisi hierarki kegiatan Anda dengan menambahkan catatan induk pertama.'}
                      {mainTab === 'SHARED_WITH_ME' &&
                        'Catatan atau form pendukung yang dibagikan secara khusus oleh rekan Anda (Mode Khusus) akan muncul di sini.'}
                      {mainTab === 'PUBLIC_CATALOG' &&
                        'Belum ada catatan yang dipublikasikan secara terbuka untuk umum. Publikasikan catatan dengan mode Publik untuk menampilkannya di sini.'}
                    </p>
                  </div>
                  {mainTab === 'MY_NOTES' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setEditingNote(null);
                        setIsModalOpen(true);
                      }}
                      className="text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="h-4 w-4" /> Tambah Catatan Sekarang
                    </Button>
                  )}
                  {mainTab === 'SHARED_WITH_ME' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsFriendsModalOpen(true)}
                      className="text-xs font-semibold gap-1.5 cursor-pointer shadow-xs text-indigo-600 border-indigo-400"
                    >
                      <UserPlus className="h-4 w-4" /> Tambah Rekan Baru
                    </Button>
                  )}
                </div>
              );
            }

            if (totalItems === 0) {
              return (
                <div className="rounded-2xl border-2 border-dashed border-border/80 p-12 text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-muted/80 flex items-center justify-center text-muted-foreground mx-auto">
                    <SearchX className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-base text-foreground">Tidak Ada Hasil</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Tidak ada catatan yang cocok dengan kata kunci &ldquo;{searchQuery.trim()}&rdquo;.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <Search className="h-3.5 w-3.5" /> Hapus Pencarian
                  </Button>
                </div>
              );
            }

            return (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
                {pagedNotes.map((note) => {
                  // Kartu khusus untuk Katalog Publik â€” tampilkan 2 aksi: Salin + Akses
                  if (mainTab === 'PUBLIC_CATALOG') {
                    const isCopied = copiedNoteId === note.kdJudul;
                    return (
                      <div
                        key={`${note.kdJudul}-pub`}
                        className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-card p-4 space-y-3 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors shadow-xs"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              #{note.kdJudul}
                            </span>
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                              Tk.{note.tingkat}
                            </span>
                          </div>
                          <Globe className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        </div>

                        {/* Judul & Ringkasan */}
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-foreground leading-tight line-clamp-2">
                            {note.judul}
                          </h4>
                          {note.ringkasan && (
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                              {note.ringkasan}
                            </p>
                          )}
                        </div>

                        {/* 2 Action Buttons: Salin Link + Akses */}
                        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                          <button
                            type="button"
                            onClick={() => handleCopyPublicLink(note)}
                            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60'
                            }`}
                            title="Salin tautan catatan ini ke clipboard"
                          >
                            {isCopied ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Salin Link</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReader(note)}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 transition-all cursor-pointer"
                            title="Buka catatan ini dalam mode baca"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Akses</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Kartu default untuk MY_NOTES dan SHARED_WITH_ME
                  return (
                    <NoteCard
                      key={`${note.kdJudul}-${note.tingkat}`}
                      note={note}
                      currentUserId={session?.id}
                      onView={handleOpenReader}
                      onEdit={(n) => {
                        setEditingNote(n);
                        setIsModalOpen(true);
                      }}
                      onDelete={handleDeleteNote}
                      onEnterSub={fetchSubNotes}
                      onManageMembers={handleOpenMembersModal}
                      onManageMedia={handleOpenMediaModal}
                      onOpenSupportingDrawer={handleOpenSupportingDrawer}
                    />
                  );
                })}
              </div>
            );
          })()}

          {totalItems > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-4 sm:flex-row">
              <span className="text-[11px] text-muted-foreground">
                Menampilkan{' '}
                <strong className="text-foreground">
                  {rangeStart}–{rangeEnd}
                </strong>{' '}
                dari <strong className="text-foreground">{totalItems}</strong> catatan
              </span>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog for Add / Edit (Dual-Pane Auto-Form) */}
      <NoteFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        onSubmit={handleSaveNote}
        editingNote={editingNote}
        parentNote={selectedParent}
        currentTingkat={selectedParent ? selectedParent.tingkat + 1 : 0}
        onScaffoldStages={handleScaffoldStages}
        apiBaseUrl={baseUrl}
      />

      {/* Modal Dialog for Export LPJ / WBS */}
      <NoteExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        rootNote={selectedParent}
        allSubNotes={subNotes}
        breadcrumbChain={subChain}
      />

      {/* Modal Dialog for Team Members & Followers (RACI Matrix) */}
      <NoteMembersModal
        isOpen={isMemberModalOpen}
        onClose={() => {
          setIsMemberModalOpen(false);
          setMemberModalNote(null);
        }}
        note={memberModalNote}
        onMembersUpdated={handleRefreshCurrentView}
        apiBaseUrl={baseUrl}
        authToken={session?.token || 'dev-bypass-token-2026'}
      />

      {/* Modal Dialog for Media Bukti Dukung (Mode PDF & Image Slider) */}
      <NoteMediaModal
        isOpen={isMediaModalOpen}
        onClose={() => {
          setIsMediaModalOpen(false);
          setMediaModalNote(null);
        }}
        note={mediaModalNote}
        onFilesUpdated={handleRefreshCurrentView}
        apiBaseUrl={baseUrl}
        authToken={session?.token || 'dev-bypass-token-2026'}
      />

      {/* Friends Hub Modal */}
      <FriendsManagerModal
        isOpen={isFriendsModalOpen}
        onClose={() => {
          setIsFriendsModalOpen(false);
          fetchSharedNotes();
        }}
        apiBaseUrl={baseUrl}
        authToken={session?.token || 'dev-bypass-token-2026'}
      />

      {/* Enterprise Document Reader Modal (Mode Baca Bersih & Elegan) */}
      <NoteReaderModal
        isOpen={isReaderOpen}
        onClose={handleCloseReader}
        note={readerNote}
        isPublicContext={mainTab === 'PUBLIC_CATALOG'}
        chapterList={
          selectedParent
            ? subNotes
            : mainTab === 'MY_NOTES'
            ? rootNotes
            : mainTab === 'SHARED_WITH_ME'
            ? sharedNotes
            : publicNotes
        }
        onSelectChapter={(target) => handleOpenReader(target)}
        onSwitchToEdit={handleSwitchFromReaderToEdit}
        onOpenSupportingDrawer={handleOpenSupportingDrawer}
        onManageMedia={handleOpenMediaModal}
        onCreateSubNote={handleCreateSubNoteFromReader}
        apiBaseUrl={baseUrl}
        authToken={session?.token || 'dev-bypass-token-2026'}
        onChecklistToggled={() => handleRefreshCurrentView()}
      />

      {/* Soft-Delete Confirm Dialog â€” Konfirmasi Arsip dengan Info Turunan */}
      {isDeleteConfirmOpen && deleteConfirmNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDeleteConfirmOpen(false)}
          />
          {/* Dialog */}
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                <ArchiveX className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Pindahkan ke Arsip?</h3>
                <p className="text-xs text-muted-foreground">Catatan tidak dihapus permanen â€” dapat dipulihkan</p>
              </div>
            </div>

            {/* Detail Catatan */}
            <div className="rounded-xl bg-muted/60 border border-border/60 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                  #{deleteConfirmNote.kdJudul}
                </span>
                <span className="text-xs text-muted-foreground">Tingkat {deleteConfirmNote.tingkat}</span>
              </div>
              <p className="font-semibold text-sm text-foreground">{deletePreview?.judul || deleteConfirmNote.judul}</p>
            </div>

            {/* Info Turunan */}
            {deletePreview && (
              <div className={`rounded-xl border p-3.5 text-sm space-y-1.5 ${
                deletePreview.hasChildren
                  ? 'border-amber-400/40 bg-amber-500/8 text-amber-900 dark:text-amber-200'
                  : 'border-border/60 bg-muted/40 text-muted-foreground'
              }`}>
                {deletePreview.hasChildren ? (
                  <>
                    <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Trash2 className="h-4 w-4" />
                      Perhatian: Memiliki {deletePreview.childrenCount} sub-catatan turunan
                    </p>
                    <p className="text-xs leading-relaxed">
                      Total <strong>{deletePreview.totalCount} catatan</strong> (termasuk catatan ini dan seluruh turunannya) akan dipindahkan ke Arsip sekaligus.
                    </p>
                  </>
                ) : (
                  <p className="text-xs flex items-center gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5" />
                    Catatan ini tidak memiliki sub-catatan turunan.
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setDeleteConfirmNote(null);
                  setDeletePreview(null);
                }}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-border bg-muted/60 hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <ArchiveX className="h-4 w-4" />
                {isLoading ? 'Memproses...' : 'Pindahkan ke Arsip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotedView;

