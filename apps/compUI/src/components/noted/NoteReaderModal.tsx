import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  X,
  BookOpen,
  Printer,
  Copy,
  Check,
  Edit3,
  Calendar,
  Clock,
  User,
  Wallet,
  CheckCircle2,
  Circle,
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Tag,
  GitFork,
  ArrowUpLeft,
  Plus,
  RefreshCw,
  FolderTree,
  Globe,
  Upload,
} from 'lucide-react';
import { Button } from '@org/ui';
import { authFetch } from '@org/auth';
import { type JudulNote, type JudulChecklist, type NoteBreadcrumb } from './types';
import { NoteStatusBadge, NoteStageBadge, NotePriorityBadge } from './NoteStatusBadge';

interface NoteReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: JudulNote | null;
  chapterList?: JudulNote[]; // Daftar sub-catatan dalam bab yang sama (siblings)
  onSelectChapter?: (note: JudulNote) => void;
  onSwitchToEdit?: (note: JudulNote) => void;
  onOpenSupportingDrawer?: (note: JudulNote) => void;
  onManageMedia?: (note: JudulNote) => void;
  onCreateSubNote?: (parentNote: JudulNote) => void;
  apiBaseUrl?: string;
  authToken?: string;
  onChecklistToggled?: (kdJudul: string, checklistId: string, newState: boolean) => void;
}

export function NoteReaderModal({
  isOpen,
  onClose,
  note,
  chapterList = [],
  onSelectChapter,
  onSwitchToEdit,
  onOpenSupportingDrawer,
  onManageMedia,
  onCreateSubNote,
  apiBaseUrl = 'http://localhost:3002/api',
  authToken,
  onChecklistToggled,
}: NoteReaderModalProps) {
  // 1. Core State
  const [activeNote, setActiveNote] = useState<JudulNote | null>(note);
  const [childNotes, setChildNotes] = useState<JudulNote[]>([]);
  const [ancestorChain, setAncestorChain] = useState<NoteBreadcrumb[]>([]);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'CHILDREN' | 'SIBLINGS'>('CHILDREN');

  const [copiedLink, setCopiedLink] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isTogglingSharing, setIsTogglingSharing] = useState(false);

  // Local checklist state for optimistic updates
  const [localChecklists, setLocalChecklists] = useState<JudulChecklist[]>([]);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  // 2. Fetch Hierarchy (Level N+1 direct children & ancestors chain)
  const fetchHierarchy = useCallback(
    async (target: JudulNote) => {
      try {
        setIsLoadingHierarchy(true);
        const isPublic = target.sharingMode === 'PUBLIC';
        const url = isPublic
          ? `${apiBaseUrl}/sharing/public-sub?kdJudul=${encodeURIComponent(target.kdJudul)}&tingkat=${target.tingkat}`
          : `${apiBaseUrl}/notes/sub?kdJudul=${encodeURIComponent(target.kdJudul)}&tingkat=${target.tingkat}&kdMember=${encodeURIComponent(target.kdMember || '')}`;

        const res = await authFetch(url, { skipAuth: isPublic });
        if (!res.ok) {
          setChildNotes([]);
          return;
        }

        const json = await res.json();
        const payload = json.data || json;
        const subList: JudulNote[] = Array.isArray(payload.sub) ? payload.sub : [];
        const indukList: NoteBreadcrumb[] = Array.isArray(payload.induk) ? payload.induk : [];

        setChildNotes(subList);
        setAncestorChain(indukList);

        if (payload.current) {
          setActiveNote((prev) => (prev ? { ...prev, ...payload.current } : payload.current));
        }

        // Tentukan tab default sidebar secara cerdas
        if (subList.length > 0) {
          setSidebarTab('CHILDREN');
        } else if (chapterList.length > 0) {
          setSidebarTab('SIBLINGS');
        }
      } catch (err) {
        console.warn('[NoteReaderModal] fetchHierarchy error:', err);
        setChildNotes([]);
      } finally {
        setIsLoadingHierarchy(false);
      }
    },
    [apiBaseUrl, chapterList.length]
  );

  // 3. Sinkronisasi activeNote saat prop `note` berubah atau modal pertama kali dibuka
  useEffect(() => {
    if (isOpen && note) {
      setActiveNote(note);
      fetchHierarchy(note);
    }
  }, [isOpen, note, fetchHierarchy]);

  // Sync local checklists whenever the active note changes
  useEffect(() => {
    if (activeNote?.checklists) {
      setLocalChecklists([...activeNote.checklists]);
    } else {
      setLocalChecklists([]);
    }
  }, [activeNote]);

  // 4. Drill-Down ke Anak Langsung (Level N+1)
  const handleDrillDown = (child: JudulNote) => {
    setActiveNote(child);
    fetchHierarchy(child);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('viewNote', child.kdJudul);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // safe fallback
    }
  };

  // 5. Navigasi Naik ke Tingkat Induk (Level Up)
  const handleNavigateUp = (breadcrumbItem: NoteBreadcrumb) => {
    if (!activeNote || breadcrumbItem.kdJudul === activeNote.kdJudul) return;

    const targetNote: JudulNote = {
      kdJudul: breadcrumbItem.kdJudul,
      judul: breadcrumbItem.judul,
      ringkasan: breadcrumbItem.ringkasan,
      tingkat: breadcrumbItem.tingkat,
      kdMember: breadcrumbItem.kdMember,
      status: 'IN_PROGRESS',
      progress: 0,
    };

    setActiveNote(targetNote);
    fetchHierarchy(targetNote);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('viewNote', targetNote.kdJudul);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // safe fallback
    }
  };

  // Sibling chapter calculations (Previous / Next)
  const { prevChapter, nextChapter, currentIndex } = useMemo(() => {
    if (!activeNote || chapterList.length === 0) {
      return { prevChapter: null, nextChapter: null, currentIndex: -1 };
    }
    const idx = chapterList.findIndex((item) => item.kdJudul === activeNote.kdJudul);
    return {
      prevChapter: idx > 0 ? chapterList[idx - 1] : null,
      nextChapter: idx >= 0 && idx < chapterList.length - 1 ? chapterList[idx + 1] : null,
      currentIndex: idx,
    };
  }, [activeNote, chapterList]);

  if (!isOpen || !activeNote) return null;

  // 6. Copy Direct Link Handler (URL mandiri publik /n/:kdJudul)
  const handleCopyLink = () => {
    const url = `${window.location.origin}/n/${encodeURIComponent(activeNote.kdJudul)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // 6b. Toggle Publikasi ke Katalog Publik
  const handleTogglePublicSharing = async () => {
    if (!activeNote) return;
    const isCurrentlyPublic = activeNote.sharingMode === 'PUBLIC';
    const nextMode = isCurrentlyPublic ? 'PRIVATE' : 'PUBLIC';
    try {
      setIsTogglingSharing(true);
      const res = await authFetch(`${apiBaseUrl}/sharing/notes/${encodeURIComponent(activeNote.kdJudul)}`, {
        method: 'PUT',
        body: JSON.stringify({
          sharingMode: nextMode,
        }),
      });
      if (res.ok) {
        setActiveNote((prev) => (prev ? { ...prev, sharingMode: nextMode, publikasi: nextMode === 'PUBLIC' } : prev));
        onChecklistToggled?.(activeNote.kdJudul, '', false);
      }
    } catch (err) {
      console.warn('Gagal mengubah mode publikasi catatan:', err);
    } finally {
      setIsTogglingSharing(false);
    }
  };

  // 7. Interactive Checklist Toggle
  const handleToggleChecklist = async (ch: JudulChecklist) => {
    const nextCompleted = !ch.isCompleted;
    setTogglingId(ch.id);

    // Optimistic UI update
    setLocalChecklists((prev) =>
      prev.map((c) => (c.id === ch.id ? { ...c, isCompleted: nextCompleted } : c))
    );

    try {
      const res = await authFetch(`${apiBaseUrl}/notes/${activeNote.kdJudul}/checklists/${ch.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isCompleted: nextCompleted,
          syncProgress: true,
        }),
      });

      if (res.ok) {
        onChecklistToggled?.(activeNote.kdJudul, ch.id, nextCompleted);
      }
    } catch (err) {
      console.warn('Gagal mengubah status checklist:', err);
      // Rollback
      setLocalChecklists((prev) =>
        prev.map((c) => (c.id === ch.id ? { ...c, isCompleted: ch.isCompleted } : c))
      );
    } finally {
      setTogglingId(null);
    }
  };

  // 8. Print Clean Document
  const handlePrint = () => {
    window.print();
  };

  const completedChecklistCount = localChecklists.filter((c) => c.isCompleted).length;
  const totalChecklistCount = localChecklists.length;
  const checklistPercent =
    totalChecklistCount > 0
      ? Math.round((completedChecklistCount / totalChecklistCount) * 100)
      : activeNote.progress;

  // Lightweight Parser untuk Render Catatan Detail yang kaya format
  const renderFormattedDetail = (content: string) => {
    if (!content || !content.trim()) return null;

    const renderInline = (text: string) => {
      if (!text) return null;
      // Link parser: [title](url)
      const linkRegex = /\[(.*?)\]\((.*?)\)/g;
      const parts = [];
      let lastIdx = 0;
      let match;

      while ((match = linkRegex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          parts.push(text.substring(lastIdx, match.index));
        }
        parts.push(
          <a
            key={`l-${match.index}`}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold"
          >
            {match[1]}
          </a>
        );
        lastIdx = linkRegex.lastIndex;
      }
      if (lastIdx < text.length) {
        parts.push(text.substring(lastIdx));
      }

      return parts.map((part, pIdx) => {
        if (typeof part !== 'string') return part;

        // Inline code
        const codeParts = part.split(/`([^`]+)`/g);
        return codeParts.map((cp, cpIdx) => {
          if (cpIdx % 2 === 1) {
            return (
              <code
                key={cpIdx}
                className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded text-primary font-bold border border-border/60"
              >
                {cp}
              </code>
            );
          }

          let inner: React.ReactNode = cp;
          // Bold
          if (typeof inner === 'string' && inner.includes('**')) {
            const boldParts = inner.split(/\*\*([^*]+)\*\*/g);
            inner = boldParts.map((bp, bpIdx) =>
              bpIdx % 2 === 1 ? <strong key={bpIdx} className="font-bold text-foreground">{bp}</strong> : bp
            );
          }
          return <span key={cpIdx}>{inner}</span>;
        });
      });
    };

    const lines = content.split('\n');
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];
    const elements: React.ReactNode[] = [];

    const flushTable = (k: string) => {
      if (inTable && tableHeaders.length > 0) {
        elements.push(
          <div key={k} className="my-3 overflow-x-auto rounded-xl border border-border/70 shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/70 text-[11px] font-bold text-foreground uppercase border-b border-border/70">
                <tr>
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="py-2.5 px-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-[11px]">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2.5 px-3 text-foreground/90">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableHeaders = [];
        tableRows = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Deteksi baris Tabel
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const parts = trimmed
          .split('|')
          .map((p) => p.trim())
          .filter((_, i, arr) => i > 0 && i < arr.length - 1);

        if (parts.every((p) => /^:?-+:?$/.test(p))) {
          return;
        }

        if (!inTable) {
          inTable = true;
          tableHeaders = parts;
        } else {
          tableRows.push(parts);
        }
        return;
      } else if (inTable) {
        flushTable(`tbl-${idx}`);
      }

      if (!trimmed) {
        elements.push(<div key={`b-${idx}`} className="h-3" />);
        return;
      }

      if (trimmed === '---' || trimmed === '***') {
        elements.push(<hr key={`hr-${idx}`} className="my-4 border-t border-border/80" />);
        return;
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={`h3-${idx}`} className="text-sm font-bold text-foreground mt-4 mb-1.5 flex items-center gap-1.5 text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {renderInline(trimmed.substring(4))}
          </h4>
        );
        return;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={`h2-${idx}`} className="text-base font-extrabold text-foreground mt-5 mb-2 pb-1 border-b border-border/60">
            {renderInline(trimmed.substring(3))}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h2 key={`h1-${idx}`} className="text-lg font-black text-foreground mt-6 mb-2 text-primary">
            {renderInline(trimmed.substring(2))}
          </h2>
        );
        return;
      }

      // Checklist: - [ ] atau - [x]
      if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('* [ ] ')) {
        elements.push(
          <div key={`chk-u-${idx}`} className="flex items-start gap-2 text-xs text-foreground/90 my-1 pl-1">
            <span className="mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded border border-border bg-card shrink-0" />
            <span className="leading-relaxed">{renderInline(trimmed.substring(6))}</span>
          </div>
        );
        return;
      }
      if (trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ') || trimmed.startsWith('* [x] ')) {
        elements.push(
          <div key={`chk-d-${idx}`} className="flex items-start gap-2 text-xs text-muted-foreground my-1 pl-1">
            <span className="mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded bg-emerald-600 text-white shrink-0 text-[10px] font-bold">
              ✓
            </span>
            <span className="leading-relaxed line-through">{renderInline(trimmed.substring(6))}</span>
          </div>
        );
        return;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <div key={`li-${idx}`} className="flex items-start gap-2 text-xs text-foreground/90 my-1 pl-2">
            <span className="text-primary mt-1 text-[10px] font-black">&bull;</span>
            <span className="leading-relaxed">{renderInline(trimmed.substring(2))}</span>
          </div>
        );
        return;
      }

      if (/^\d+\.\s/.test(trimmed)) {
        const numMatch = trimmed.match(/^(\d+)\.\s(.*)$/);
        elements.push(
          <div key={`num-${idx}`} className="flex items-start gap-2 text-xs text-foreground/90 my-1 pl-2">
            <span className="font-mono text-primary font-bold text-[11px] shrink-0">{numMatch?.[1]}.</span>
            <span className="leading-relaxed">{renderInline(numMatch?.[2] || '')}</span>
          </div>
        );
        return;
      }

      if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote
            key={`q-${idx}`}
            className="my-3 border-l-3 border-amber-500 bg-amber-500/10 dark:bg-amber-500/5 px-3 py-2 text-xs text-foreground/90 italic rounded-r-md"
          >
            {renderInline(trimmed.substring(2))}
          </blockquote>
        );
        return;
      }

      if (trimmed.startsWith('```')) {
        return;
      }

      elements.push(
        <p key={`p-${idx}`} className="text-xs leading-relaxed text-foreground/85 my-1.5">
          {renderInline(line)}
        </p>
      );
    });

    flushTable(`tbl-end`);
    return elements;
  };

  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
    `${window.location.origin}/notes/view/${activeNote.kdJudul}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[920px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden print:border-none print:shadow-none print:h-auto print:max-h-none print:overflow-visible">
        
        {/* ========================================================= */}
        {/* TOP BAR / READER HEADER                                   */}
        {/* ========================================================= */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/80 bg-card/95 backdrop-blur-md px-4 py-2.5 shrink-0 print:hidden gap-3 flex-wrap">
          {/* Left: Code, Stage, & Badges */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-4 w-4" />
              </span>
              <span className="font-mono text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                #{activeNote.kdJudul}
              </span>
              <span className="text-[11px] font-bold text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                Tingkat {activeNote.tingkat}
              </span>
            </div>

            <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />

            <div className="flex items-center gap-1.5 flex-wrap">
              <NoteStageBadge stage={activeNote.stage} />
              <NotePriorityBadge priority={activeNote.priority} />
              <NoteStatusBadge status={activeNote.status} />
              {activeNote.sharingMode === 'PUBLIC' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Publik
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            {/* Primary Task Tools */}
            {onOpenSupportingDrawer && activeNote && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenSupportingDrawer(activeNote)}
                className="h-8 text-xs gap-1.5 cursor-pointer text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/15"
                title="Buka Form Pendukung Dinamis"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Form Pendukung</span>
              </Button>
            )}

            {onManageMedia && activeNote && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onManageMedia(activeNote)}
                className="h-8 text-xs gap-1.5 cursor-pointer text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15"
                title="Buka Form Upload & Kelola Berkas"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Form Upload</span>
              </Button>
            )}

            {onSwitchToEdit && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onClose();
                  onSwitchToEdit(activeNote);
                }}
                className="h-8 text-xs gap-1 font-semibold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs"
                title="Beralih ke Formulir Pengeditan Data"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Mode Edit</span>
              </Button>
            )}

            <div className="h-4 w-[1px] bg-border mx-0.5 hidden sm:block" />

            {/* Secondary Utility Controls */}
            <Button
              variant="outline"
              size="sm"
              disabled={isTogglingSharing}
              onClick={handleTogglePublicSharing}
              className={`h-8 px-2.5 text-xs gap-1.5 cursor-pointer transition-all ${
                activeNote.sharingMode === 'PUBLIC'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'text-muted-foreground hover:text-emerald-600 hover:border-emerald-500/30'
              }`}
              title={
                activeNote.sharingMode === 'PUBLIC'
                  ? 'Catatan saat ini tampil di Katalog Publik. Klik untuk jadikan Privat kembali.'
                  : 'Jadikan catatan ini publik agar tampil di tab Katalog Publik dan bisa diakses siapapun.'
              }
            >
              <Globe className={`h-3.5 w-3.5 ${activeNote.sharingMode === 'PUBLIC' ? 'text-emerald-600' : ''}`} />
              <span className="hidden md:inline">
                {activeNote.sharingMode === 'PUBLIC' ? 'Publik' : 'Jadikan Publik'}
              </span>
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className="h-8 w-8 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
              title="Salin Tautan Langsung ke Catatan Ini"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handlePrint}
              className="h-8 w-8 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
              title="Cetak Lembar Dokumen Resmi"
            >
              <Printer className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="h-8 w-8 text-xs hidden md:flex cursor-pointer text-muted-foreground hover:text-foreground"
              title={isSidebarOpen ? 'Sembunyikan Panel Bab' : 'Buka Panel Bab'}
            >
              <Layers className="h-3.5 w-3.5" />
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Tutup (ESC)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* PRINT KOP SURAT FORMAL (ONLY VISIBLE ON PRINT)           */}
        {/* ========================================================= */}
        <div className="hidden print:block p-8 border-b-2 border-foreground mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-foreground text-background flex items-center justify-center font-black text-xl">
                MFC
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight uppercase">M Software Center (MFC)</h2>
                <p className="text-xs text-muted-foreground">Sistem Manajemen Catatan Turunan & Proyek Hierarki Enterprise</p>
                <p className="text-[10px] font-mono text-muted-foreground">Dokumen Resmi / Executive Briefing Sheet &bull; ISO-9001 Compliant</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-foreground block">
                REG: #DOC-{activeNote.kdJudul}-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                Dicetak: {new Date().toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN BODY: DUAL PANE (SIDEBAR DUAL-TAB + DOCUMENT READER)  */}
        {/* ========================================================= */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* 1. LEFT SIDEBAR: DUAL-TAB NAV (TURUNAN LEVEL N+1 & SIBLINGS) */}
          {isSidebarOpen && (
            <aside className="w-64 sm:w-72 border-r border-border bg-muted/30 flex flex-col shrink-0 overflow-hidden print:hidden">
              {/* Tab Selector Header */}
              <div className="p-2 border-b border-border/80 bg-card/60">
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setSidebarTab('CHILDREN')}
                    className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      sidebarTab === 'CHILDREN'
                        ? 'bg-card text-primary shadow-xs font-black'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <GitFork className="h-3 w-3" />
                    <span>Turunan ({childNotes.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSidebarTab('SIBLINGS')}
                    className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      sidebarTab === 'SIBLINGS'
                        ? 'bg-card text-primary shadow-xs font-black'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Layers className="h-3 w-3" />
                    <span>Sejajar ({chapterList.length})</span>
                  </button>
                </div>
              </div>

              {/* Sidebar Content Area */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {sidebarTab === 'CHILDREN' ? (
                  /* TAB 1: LIST TURUNAN LEVEL SELANJUTNYA */
                  <div className="space-y-1.5">
                    {/* Quick Button to Parent if not at Root */}
                    {ancestorChain.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const parentItem = ancestorChain[ancestorChain.length - 1];
                          handleNavigateUp(parentItem);
                        }}
                        className="w-full text-left p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer mb-2"
                        title="Kembali ke Catatan Induk"
                      >
                        <ArrowUpLeft className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          Naik: #{ancestorChain[ancestorChain.length - 1].kdJudul} {ancestorChain[ancestorChain.length - 1].judul}
                        </span>
                      </button>
                    )}

                    <div className="flex items-center justify-between px-1 pb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Anak Langsung (Tingkat {activeNote.tingkat + 1})
                      </span>
                      {isLoadingHierarchy && <RefreshCw className="h-3 w-3 animate-spin text-primary" />}
                    </div>

                    {childNotes.length > 0 ? (
                      childNotes.map((ch) => (
                        <button
                          key={ch.id || ch.kdJudul}
                          type="button"
                          onClick={() => handleDrillDown(ch)}
                          className="w-full text-left p-2.5 rounded-xl text-xs transition-all cursor-pointer flex flex-col gap-1 border bg-card/70 hover:bg-card hover:border-primary/50 border-border/60 text-foreground group shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded font-bold bg-primary/10 text-primary">
                              #{ch.kdJudul}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {ch.progress}%
                            </span>
                          </div>
                          <p className="line-clamp-2 leading-tight font-medium group-hover:text-primary transition-colors">
                            {ch.judul}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-border/70 text-center text-xs text-muted-foreground space-y-2">
                        <FolderTree className="h-6 w-6 text-muted-foreground/60 mx-auto" />
                        <p className="text-[11px]">Belum ada sub-catatan tingkat {activeNote.tingkat + 1}.</p>
                        {onCreateSubNote && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onClose();
                              onCreateSubNote(activeNote);
                            }}
                            className="h-7 text-[11px] gap-1 w-full cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            Tambah Sub
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* TAB 2: DAFTAR BAB SEJAJAR (SIBLINGS) */
                  <div className="space-y-1">
                    <div className="px-1 pb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Bab Tingkat {activeNote.tingkat} ({currentIndex + 1} / {chapterList.length || 1})
                      </span>
                    </div>

                    {chapterList.map((ch, i) => {
                      const isActive = ch.kdJudul === activeNote.kdJudul;
                      return (
                        <button
                          key={ch.id || ch.kdJudul || i}
                          type="button"
                          onClick={() => {
                            if (onSelectChapter) {
                              onSelectChapter(ch);
                            } else {
                              handleDrillDown(ch);
                            }
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition-all cursor-pointer flex flex-col gap-1 border ${
                            isActive
                              ? 'bg-primary text-primary-foreground font-semibold border-primary shadow-xs'
                              : 'bg-card/70 hover:bg-card border-border/60 text-foreground'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                isActive ? 'bg-primary-foreground/20 text-white' : 'bg-muted text-primary'
                              }`}
                            >
                              #{ch.kdJudul}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                isActive ? 'text-primary-foreground/90' : 'text-muted-foreground'
                              }`}
                            >
                              {ch.progress}%
                            </span>
                          </div>
                          <p className="line-clamp-2 leading-tight font-medium">{ch.judul}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* 2. RIGHT PANE: THE DOCUMENT READER */}
          <main ref={mainScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
            
            {/* Top Hierarchical Breadcrumb Navigation */}
            {ancestorChain.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap pb-2 border-b border-border/50">
                <span className="flex items-center gap-1 font-semibold text-primary">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Jalur Induk:</span>
                </span>
                
                {ancestorChain.map((anc) => (
                  <div key={anc.kdJudul} className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleNavigateUp(anc)}
                      className="hover:text-primary font-medium transition-colors cursor-pointer truncate max-w-[150px] bg-muted/60 px-2 py-0.5 rounded-md"
                      title={`Tingkat ${anc.tingkat}: ${anc.judul}`}
                    >
                      #{anc.kdJudul} {anc.judul}
                    </button>
                    <span className="text-muted-foreground/60">/</span>
                  </div>
                ))}

                <span className="font-bold text-foreground truncate max-w-[200px] bg-primary/10 px-2 py-0.5 rounded-md text-primary">
                  #{activeNote.kdJudul} {activeNote.judul}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const parentItem = ancestorChain[ancestorChain.length - 1];
                    handleNavigateUp(parentItem);
                  }}
                  className="h-6 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground cursor-pointer ml-auto"
                >
                  <ArrowUpLeft className="h-3 w-3" />
                  <span>Naik 1 Tingkat</span>
                </Button>
              </div>
            )}

            {/* Document Header & Title */}
            <div className="space-y-3 pb-4 border-b border-border/80">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono font-bold text-primary">
                  {ancestorChain.length > 0 ? `Sub-Tahap Tingkat ${activeNote.tingkat}` : `Catatan Induk Tingkat 0`}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Dibuat: {activeNote.createdAt ? new Date(activeNote.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </span>
                {activeNote.dueDate && (
                  <>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                      <Clock className="h-3 w-3" />
                      Tenggat: {new Date(activeNote.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
                {activeNote.judul}
              </h1>

              {/* PIC & Team Bar */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>Penanggung Jawab (PIC):</span>
                  <span className="font-bold text-foreground">{activeNote.picName || 'Principal Administrator'}</span>
                </div>

                {activeNote.tags && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono text-[11px] text-muted-foreground">{activeNote.tags}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ringkasan Eksekutif (hanya ditampilkan jika berbeda dengan catatan detail) */}
            {activeNote.ringkasan && activeNote.catatanDetail && activeNote.ringkasan !== activeNote.catatanDetail && (
              <div className="relative rounded-2xl border-l-4 border-primary bg-primary/5 dark:bg-primary/10 p-4 sm:p-5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Ringkasan Eksekutif</span>
                </div>
                <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed italic">
                  &ldquo;{activeNote.ringkasan}&rdquo;
                </p>
              </div>
            )}

            {/* Uraian Dokumen & Deskripsi Utama (WYSIWYG Body) */}
            {(activeNote.catatanDetail || activeNote.ringkasan) ? (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>Uraian Dokumen & Spesifikasi Kerja</span>
                </h3>
                <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs leading-relaxed">
                  {renderFormattedDetail(activeNote.catatanDetail || activeNote.ringkasan)}
                </div>
              </div>
            ) : null}

            {/* PILAR 3: FINANSIAL & PROGRESS SUMMARY CARD */}
            {(activeNote.targetBudget || activeNote.realizedBudget || activeNote.progress !== undefined) && (
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Pilar 3: Valuasi Anggaran & Capaian Progres</span>
                  </h4>
                  <span className="text-xs font-extrabold text-primary font-mono">{activeNote.progress}% Selesai</span>
                </div>

                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${activeNote.progress}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="rounded-xl border border-border/60 bg-card p-3">
                    <span className="text-[11px] text-muted-foreground block">Pagu Target</span>
                    <span className="text-sm font-black text-foreground">
                      Rp {Number(activeNote.targetBudget || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card p-3">
                    <span className="text-[11px] text-muted-foreground block">Realisasi Belanja</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      Rp {Number(activeNote.realizedBudget || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card p-3 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-muted-foreground block">Sisa Anggaran</span>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                      Rp {Number((activeNote.targetBudget || 0) - (activeNote.realizedBudget || 0)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* CHECKLIST TUGAS INTERAKTIF (ACTIONABLE READING) */}
            {localChecklists.length > 0 && (
              <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Checklist Tugas ({completedChecklistCount}/{totalChecklistCount})
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-muted-foreground">
                    {checklistPercent}% Tuntas
                  </span>
                </div>

                <div className="space-y-1.5">
                  {localChecklists.map((ch, idx) => {
                    const isToggling = togglingId === ch.id;
                    return (
                      <div
                        key={ch.id || idx}
                        onClick={() => !isToggling && handleToggleChecklist(ch)}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          ch.isCompleted
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-muted-foreground line-through'
                            : 'bg-muted/30 border-border/60 text-foreground hover:bg-muted/60'
                        }`}
                      >
                        <button
                          type="button"
                          disabled={isToggling}
                          className="mt-0.5 shrink-0 text-emerald-600 transition-transform active:scale-90"
                        >
                          {ch.isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <span className="flex-1 leading-relaxed font-medium">{ch.itemText}</span>
                        {ch.assignedTo && (
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {ch.assignedTo}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SEKSI UTAMA BARU: DAFTAR TURUNAN LEVEL SELANJUTNYA (N+1)  */}
            {/* ========================================================= */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <GitFork className="h-3.5 w-3.5" />
                    </span>
                    <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                      Sub-Catatan & Tahapan Turunan (Tingkat {activeNote.tingkat + 1})
                    </h3>
                    <span className="font-mono text-xs font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                      {childNotes.length} Tahap
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Pilih sub-catatan di bawah ini untuk menelusuri rincian spesifikasi teknis dan turunan selanjutnya.
                  </p>
                </div>

                {onCreateSubNote && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onCreateSubNote(activeNote);
                    }}
                    className="h-8 text-xs font-semibold gap-1.5 border-dashed cursor-pointer shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Sub-Catatan</span>
                  </Button>
                )}
              </div>

              {isLoadingHierarchy ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto text-primary" />
                  <p>Memuat daftar turunan tingkat {activeNote.tingkat + 1}...</p>
                </div>
              ) : childNotes.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {childNotes.map((child) => (
                    <div
                      key={child.id || child.kdJudul}
                      className="group relative rounded-xl border border-border/70 bg-muted/20 hover:bg-card hover:border-primary/50 transition-all p-4 space-y-3 flex flex-col justify-between shadow-xs"
                    >
                      <div className="space-y-2">
                        {/* Badges Bar */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              #{child.kdJudul}
                            </span>
                            <NoteStageBadge stage={child.stage} />
                          </div>
                          <div className="flex items-center gap-1">
                            <NotePriorityBadge priority={child.priority} />
                            <NoteStatusBadge status={child.status} />
                          </div>
                        </div>

                        {/* Title & Summary */}
                        <div>
                          <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {child.judul}
                          </h4>
                          {child.ringkasan && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                              {child.ringkasan}
                            </p>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground font-medium">Progres:</span>
                            <span className="font-mono font-bold text-primary">{child.progress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-300"
                              style={{ width: `${child.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Metadata row */}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 flex-wrap gap-2 border-t border-border/50">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-primary" />
                            <span className="truncate max-w-[120px]">{child.picName || 'PIC'}</span>
                          </div>

                          {child.checklists && child.checklists.length > 0 && (
                            <span className="flex items-center gap-1 font-mono text-[10px]">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              {child.checklists.filter((c) => c.isCompleted).length}/{child.checklists.length} Tugas
                            </span>
                          )}

                          {child.targetBudget && Number(child.targetBudget) > 0 && (
                            <span className="font-mono text-[10px] font-bold text-foreground">
                              Rp {Number(child.targetBudget).toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/40">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleDrillDown(child)}
                          className="h-8 text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer flex-1 shadow-xs"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Buka & Baca Tingkat Ini</span>
                          <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                        </Button>

                        {onSwitchToEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onClose();
                              onSwitchToEdit(child);
                            }}
                            className="h-8 text-xs px-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Edit Data Catatan Ini"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {onOpenSupportingDrawer && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenSupportingDrawer(child)}
                            className="h-8 text-xs px-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Buka Form Pendukung untuk Sub-Catatan Ini"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state for leaf node */
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 p-6 text-center space-y-3">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <GitFork className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-foreground">
                      Belum Ada Sub-Catatan atau Tahapan Turunan
                    </h4>
                    <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                      Catatan #{activeNote.kdJudul} ini saat ini berada pada tingkat pelaksanaan langsung (leaf node).
                    </p>
                  </div>

                  {onCreateSubNote && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onClose();
                        onCreateSubNote(activeNote);
                      }}
                      className="h-8 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Buat Sub-Catatan Tingkat {activeNote.tingkat + 1}</span>
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* PILAR 2: DOKUMEN & BUKTI TERLAMPIR */}
            {activeNote.files && activeNote.files.length > 0 && (
              <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>Pilar 2: Dokumen & SOP Terlampir ({activeNote.files.length} File)</span>
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {activeNote.files.map((file, i) => (
                    <a
                      key={file.id || i}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 transition-colors text-xs group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {file.fileName}
                          </p>
                          <span className="text-[10px] text-muted-foreground">{file.category || file.fileType}</span>
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* FORM FLEKSIBEL TRIGGER BUTTON */}
            {onOpenSupportingDrawer && (
              <div className="pt-2 flex items-center justify-between p-4 rounded-xl border border-dashed border-border bg-muted/10 print:hidden">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Membutuhkan form entri lanjutan atau rekap tabel transaksi?
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenSupportingDrawer(activeNote)}
                  className="h-8 text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Buka Form Pendukung
                </Button>
              </div>
            )}

            {/* PRINT SIGNATURE FOOTER */}
            <div className="hidden print:grid grid-cols-2 gap-8 pt-12 mt-12 border-t border-foreground text-xs">
              <div>
                <p className="font-bold">Diverifikasi & Disetujui Oleh:</p>
                <div className="h-20" />
                <p className="font-bold underline uppercase">{activeNote.picName || 'Principal Administrator'}</p>
                <p className="text-muted-foreground">Penanggung Jawab Proyek (PIC)</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="font-bold">Keaslian Dokumen Sistem:</p>
                <img src={qrDataUrl} alt="QR Verifikasi" className="h-20 w-20 my-2" />
                <p className="font-mono text-[9px] text-muted-foreground">SCAN UNTUK VERIFIKASI RESMI</p>
              </div>
            </div>

            {/* CHAPTER STEPPER NAVIGATION (FOOTER) */}
            <div className="pt-6 border-t border-border/80 flex items-center justify-between gap-3 flex-wrap print:hidden">
              {prevChapter ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onSelectChapter) {
                      onSelectChapter(prevChapter);
                    } else {
                      handleDrillDown(prevChapter);
                    }
                  }}
                  className="h-9 text-xs gap-1.5 font-semibold cursor-pointer max-w-[240px] truncate"
                  title={`Sebelumnya: ${prevChapter.judul}`}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <span className="truncate">Prev: {prevChapter.judul}</span>
                </Button>
              ) : (
                <div />
              )}

              {nextChapter ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    if (onSelectChapter) {
                      onSelectChapter(nextChapter);
                    } else {
                      handleDrillDown(nextChapter);
                    }
                  }}
                  className="h-9 text-xs gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer max-w-[240px] truncate shadow-xs ml-auto"
                  title={`Berikutnya: ${nextChapter.judul}`}
                >
                  <span className="truncate">Next: {nextChapter.judul}</span>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </Button>
              ) : (
                <div />
              )}
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}

export default NoteReaderModal;
