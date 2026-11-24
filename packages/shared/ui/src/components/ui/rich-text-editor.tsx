import * as React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Table as TableIcon,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Eye,
  Edit3,
  Columns,
  Maximize2,
  Minimize2,
  FileText,
  Sparkles,
  ChevronDown,
  Check,
  HelpCircle,
} from "lucide-react";
import { cn } from "../../utils/cn";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
  label?: string;
  helperText?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis uraian, catatan teknis, atau spesifikasi kerja (mendukung Markdown)...",
  minHeight = "160px",
  maxHeight = "460px",
  className,
  label,
  helperText,
  readOnly = false,
  autoFocus = false,
}: RichTextEditorProps) {
  const [viewMode, setViewMode] = useState<"write" | "preview" | "split">("write");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTemplates(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut listener (Ctrl+B, Ctrl+I, Ctrl+K)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        insertWrap("**", "**", "teks tebal");
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        insertWrap("*", "*", "teks miring");
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        insertLink();
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      insertText("  ");
    }
  };

  // Helper untuk membungkus seleksi teks dengan tag markdown
  const insertWrap = (before: string, after: string, defaultText = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = value || "";
    const selectedText = currentVal.substring(start, end);

    const replacement = selectedText
      ? `${before}${selectedText}${after}`
      : `${before}${defaultText}${after}`;

    const nextValue =
      currentVal.substring(0, start) + replacement + currentVal.substring(end);

    onChange(nextValue);

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + before.length, end + before.length);
      } else {
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + defaultText.length
        );
      }
    }, 0);
  };

  // Helper untuk menyisipkan prefix di awal baris
  const insertPrefix = (prefix: string, defaultText = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentVal = value || "";

    // Cari posisi awal baris saat ini
    const lastNewline = currentVal.lastIndexOf("\n", start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    const nextValue =
      currentVal.substring(0, lineStart) +
      prefix +
      (defaultText && !currentVal.substring(start) ? defaultText + "\n" : "") +
      currentVal.substring(lineStart);

    onChange(nextValue);

    setTimeout(() => {
      textarea.focus();
      const newPos = lineStart + prefix.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = value || "";

    const nextValue = currentVal.substring(0, start) + text + currentVal.substring(end);
    onChange(nextValue);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + text.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    const currentVal = value || "";
    const start = textarea ? textarea.selectionStart : 0;
    const end = textarea ? textarea.selectionEnd : 0;
    const selectedText = currentVal.substring(start, end) || "Judul Tautan";

    insertWrap("[", "](https://example.com)", selectedText);
  };

  const insertImage = () => {
    const textarea = textareaRef.current;
    const currentVal = value || "";
    const start = textarea ? textarea.selectionStart : 0;
    const end = textarea ? textarea.selectionEnd : 0;
    const selectedText = currentVal.substring(start, end) || "Keterangan Gambar";

    insertWrap("![", "](https://via.placeholder.com/600x300)", selectedText);
  };

  const insertTable = () => {
    const tableTemplate = `\n| No | Komponen / Fitur | Spesifikasi Teknis | Status |\n| :--- | :--- | :--- | :---: |\n| 1 | Otentikasi & Guard | Implementasi JWT & Refresh Token | Selesai |\n| 2 | Endpoint REST API | CRUD dengan validasi payload | Proses |\n\n`;
    insertText(tableTemplate);
  };

  // Template Catatan Instan
  const applyTemplate = (type: "spec" | "minutes" | "bug" | "wbs") => {
    let tpl = "";
    if (type === "spec") {
      tpl = `### 1. Latar Belakang & Ringkasan Solusi
Jelaskan tujuan dan konteks bisnis dari fitur atau pekerjaan ini.

### 2. Kebutuhan & Spesifikasi Teknis
- **Endpoint Target:** \`POST /api/noted/...\`
- **Tipe Data & Model:** Relasi hierarki, audit log, dan pendukung dokumen.

\`\`\`ts
// Contoh Payload Kontrak API
interface PayloadDto {
  kdJudul: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
}
\`\`\`

### 3. Kriteria Serah Terima (Acceptance Criteria)
- [ ] Implementasi fungsi inti tanpa regresi
- [ ] Validasi error response dan HTTP status code
- [ ] Tinjauan arsitektur dan dokumentasi API
`;
    } else if (type === "minutes") {
      tpl = `### 📅 Informasi Notulen & Rapat
- **Agenda Rapat:** Evaluasi & Penyelarasan Tim
- **Tanggal & Waktu:** ${new Date().toLocaleDateString("id-ID")}
- **Pimpinan / Notulis:** 
- **Daftar Hadir:** 

### 📌 Poin-Poin Pembahasan
1. Pembahasan prioritas sprint minggu ini.
2. Penyelarasan skema data dan hak akses pengguna.

### 📝 Keputusan & Kesepakatan
- Keputusan 1: Disepakati struktur baru untuk hierarki turunan.
- Keputusan 2: Penjadwalan testing bersama pada hari Kamis.

### 🎯 Tindak Lanjut & Penugasan (Action Items)
- [ ] PIC 1: Selesaikan migrasi skema database
- [ ] PIC 2: Perbarui antarmuka formulir pengguna
`;
    } else if (type === "bug") {
      tpl = `### 🐛 Deskripsi Masalah & Gejala
Ringkasan singkat perilaku yang tidak semestinya terjadi pada sistem.

### 🔍 Langkah-Langkah Reproduksi Masalah
1. Buka modul catatan di \`/noted\`
2. Klik tombol tindakan ...
3. Sistem memunculkan galat ...

### ⚠️ Perilaku Sistem
- **Perilaku Diharapkan:** Transaksi tersimpan dan modal tertutup otomatis.
- **Perilaku Aktual:** Muncul pesan galat 500 dan data belum tersimpan.

### 🛠️ Rencana Investigasi & Perbaikan
- [ ] Analisis log exception pada backend
- [ ] Uji coba patch perbaikan secara lokal
- [ ] Verifikasi ulang alur end-to-end
`;
    } else if (type === "wbs") {
      tpl = `### 🏗️ Work Breakdown Structure (Rincian Paket Kerja)
| Kode | Tahapan Kerja | Ruang Lingkup & Deliverable | Bobot (%) | Penanggung Jawab |
| :---: | :--- | :--- | :---: | :--- |
| T01 | Analisis & Requirement | Pemetaan kebutuhan dan use case | 20% | Tim Analis |
| T02 | Desain Antarmuka (UI/UX) | Wireframe dan high-fidelity mockup | 25% | UI/UX Designer |
| T03 | Pengembangan Backend | REST API, skema DB, dan unit test | 30% | Backend Engineer |
| T04 | Integrasi Frontend | Komponen MFE, state, dan feedback | 25% | Frontend Engineer |
`;
    }

    if (value && value.trim()) {
      if (
        window.confirm(
          "Apakah Anda ingin menambahkan template ini ke catatan yang sudah ada? (Pilih OK untuk menambahkan di bawah teks saat ini, atau Batal untuk mengurungkan)"
        )
      ) {
        onChange(`${value.trim()}\n\n---\n\n${tpl}`);
      }
    } else {
      onChange(tpl);
    }
    setShowTemplates(false);
  };

  // Statistik Konten
  const content = value || "";
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 180));

  // Markdown Visual Renderer untuk Live Preview
  const renderMarkdownPreview = (text: string) => {
    if (!text || !text.trim()) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs text-center space-y-1">
          <FileText className="h-7 w-7 opacity-40 mb-1" />
          <p className="font-semibold">Belum Ada Konten untuk Ditampilkan</p>
          <p className="text-[11px] opacity-75">
            Mulai mengetik di tab Editor untuk melihat pratinjau langsung di sini.
          </p>
        </div>
      );
    }

    const lines = text.split("\n");
    let inTable = false;
    let tableRows: string[][] = [];
    let tableHeaders: string[] = [];

    const elements: React.ReactNode[] = [];

    const flushTable = (key: string) => {
      if (inTable && tableHeaders.length > 0) {
        elements.push(
          <div key={key} className="my-3 overflow-x-auto rounded-xl border border-border/70 shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/70 text-[11px] font-bold text-foreground uppercase border-b border-border/70">
                <tr>
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="py-2 px-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-[11px]">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2 px-3 text-foreground/90">
                        {renderInlineFormatting(cell)}
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
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const parts = trimmed
          .split("|")
          .map((p) => p.trim())
          .filter((_, i, arr) => i > 0 && i < arr.length - 1);

        // Abaikan separator baris tabel (|:---|:---:|)
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
        flushTable(`table-${idx}`);
      }

      if (!trimmed) {
        elements.push(<div key={`blank-${idx}`} className="h-2.5" />);
        return;
      }

      // Horizontal Rule
      if (trimmed === "---" || trimmed === "***") {
        elements.push(
          <hr key={`hr-${idx}`} className="my-3 border-t border-border/80" />
        );
        return;
      }

      // Headings
      if (trimmed.startsWith("### ")) {
        elements.push(
          <h4
            key={`h3-${idx}`}
            className="text-xs sm:text-sm font-bold text-foreground mt-3.5 mb-1.5 flex items-center gap-1.5 text-primary"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {renderInlineFormatting(trimmed.substring(4))}
          </h4>
        );
        return;
      }
      if (trimmed.startsWith("## ")) {
        elements.push(
          <h3
            key={`h2-${idx}`}
            className="text-sm sm:text-base font-extrabold text-foreground mt-4 mb-2 pb-1 border-b border-border/60"
          >
            {renderInlineFormatting(trimmed.substring(3))}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith("# ")) {
        elements.push(
          <h2
            key={`h1-${idx}`}
            className="text-base sm:text-lg font-black text-foreground mt-5 mb-2 text-primary"
          >
            {renderInlineFormatting(trimmed.substring(2))}
          </h2>
        );
        return;
      }

      // Checklists: - [ ] atau - [x]
      if (trimmed.startsWith("- [ ] ") || trimmed.startsWith("* [ ] ")) {
        elements.push(
          <div
            key={`chk-un-${idx}`}
            className="flex items-start gap-2 text-xs text-foreground/90 my-1 pl-1"
          >
            <span className="mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded border border-border bg-card shrink-0" />
            <span className="leading-relaxed">
              {renderInlineFormatting(trimmed.substring(6))}
            </span>
          </div>
        );
        return;
      }
      if (
        trimmed.startsWith("- [x] ") ||
        trimmed.startsWith("- [X] ") ||
        trimmed.startsWith("* [x] ")
      ) {
        elements.push(
          <div
            key={`chk-done-${idx}`}
            className="flex items-start gap-2 text-xs text-muted-foreground my-1 pl-1"
          >
            <span className="mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded bg-emerald-600 text-white shrink-0 text-[10px] font-bold">
              ✓
            </span>
            <span className="leading-relaxed line-through">
              {renderInlineFormatting(trimmed.substring(6))}
            </span>
          </div>
        );
        return;
      }

      // Bullet List
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        elements.push(
          <div
            key={`bullet-${idx}`}
            className="flex items-start gap-2 text-xs text-foreground/90 my-1 pl-2"
          >
            <span className="text-primary mt-1 text-[10px] font-black">&bull;</span>
            <span className="leading-relaxed">
              {renderInlineFormatting(trimmed.substring(2))}
            </span>
          </div>
        );
        return;
      }

      // Numbered List
      if (/^\d+\.\s/.test(trimmed)) {
        const numMatch = trimmed.match(/^(\d+)\.\s(.*)$/);
        elements.push(
          <div
            key={`num-${idx}`}
            className="flex items-start gap-2 text-xs text-foreground/90 my-1 pl-2"
          >
            <span className="font-mono text-primary font-bold text-[11px] shrink-0">
              {numMatch?.[1]}.
            </span>
            <span className="leading-relaxed">
              {renderInlineFormatting(numMatch?.[2] || "")}
            </span>
          </div>
        );
        return;
      }

      // Blockquote
      if (trimmed.startsWith("> ")) {
        elements.push(
          <blockquote
            key={`quote-${idx}`}
            className="my-2 border-l-3 border-amber-500 bg-amber-500/10 dark:bg-amber-500/5 px-3 py-1.5 text-xs text-foreground/90 italic rounded-r-md"
          >
            {renderInlineFormatting(trimmed.substring(2))}
          </blockquote>
        );
        return;
      }

      // Code Block Boundary
      if (trimmed.startsWith("```")) {
        return;
      }

      // Regular Paragraph
      elements.push(
        <p key={`p-${idx}`} className="text-xs leading-relaxed text-foreground/85 my-1">
          {renderInlineFormatting(line)}
        </p>
      );
    });

    flushTable(`table-end`);
    return elements;
  };

  // Inline formatting parser: **bold**, *italic*, `code`, ~~strike~~, [link](url)
  const renderInlineFormatting = (text: string) => {
    if (!text) return null;

    // Link parser
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
          key={`link-${match.index}`}
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
      if (typeof part !== "string") return part;

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

        // Bold & Italic
        let inner: React.ReactNode = cp;
        // Bold
        if (typeof inner === "string" && inner.includes("**")) {
          const boldParts = inner.split(/\*\*([^*]+)\*\*/g);
          inner = boldParts.map((bp, bpIdx) =>
            bpIdx % 2 === 1 ? <strong key={bpIdx} className="font-bold text-foreground">{bp}</strong> : bp
          );
        }

        return <span key={cpIdx}>{inner}</span>;
      });
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border/80 bg-card overflow-hidden transition-all shadow-xs",
        isFullscreen &&
          "fixed inset-4 sm:inset-8 z-[100] shadow-2xl border-primary/40 bg-card/95 backdrop-blur-md max-w-6xl mx-auto h-[90vh]",
        className
      )}
    >
      {/* Label and Helper Header jika ada */}
      {label && (
        <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-border/40 bg-muted/20">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Edit3 className="h-3.5 w-3.5 text-primary" />
            <span>{label}</span>
          </label>
          {helperText && (
            <span className="text-[10px] text-muted-foreground">{helperText}</span>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* BILAH ALAT / TOOLBAR RTE                                  */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-2 py-1.5 gap-1.5 flex-wrap shrink-0">
        {/* Grup 1: Pemformatan Teks */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => insertWrap("**", "**", "teks tebal")}
            disabled={readOnly}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer transition-colors"
            title="Tebal / Bold (Ctrl+B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertWrap("*", "*", "teks miring")}
            disabled={readOnly}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer transition-colors"
            title="Miring / Italic (Ctrl+I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertWrap("~~", "~~", "teks coret")}
            disabled={readOnly}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer transition-colors"
            title="Coret / Strikethrough"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertWrap("`", "`", "kode")}
            disabled={readOnly}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer transition-colors"
            title="Inline Code"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="h-3.5 w-[1px] bg-border/80 mx-0.5 hidden sm:block" />

        {/* Grup 2: Struktur Heading */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => insertPrefix("# ", "Judul Tingkat 1")}
            disabled={readOnly}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer transition-colors font-bold text-xs"
            title="Heading 1"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertPrefix("## ", "Sub Judul Tingkat 2")}
            disabled={readOnly}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer transition-colors font-bold text-xs"
            title="Heading 2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertPrefix("### ", "Topik Spesifikasi")}
            disabled={readOnly}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer transition-colors font-bold text-xs"
            title="Heading 3"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="h-3.5 w-[1px] bg-border/80 mx-0.5 hidden sm:block" />

        {/* Grup 3: Lists & Tasks */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => insertPrefix("- ", "Daftar poin")}
            disabled={readOnly}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer transition-colors"
            title="Daftar Poin (Bullet List)"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertPrefix("1. ", "Daftar bernomor")}
            disabled={readOnly}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer transition-colors"
            title="Daftar Bernomor (Numbered List)"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertPrefix("- [ ] ", "Tugas serah terima")}
            disabled={readOnly}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer transition-colors"
            title="Daftar Checklist Tugas (- [ ])"
          >
            <ListTodo className="h-3.5 w-3.5 text-emerald-600" />
          </button>
        </div>

        <div className="h-3.5 w-[1px] bg-border/80 mx-0.5 hidden sm:block" />

        {/* Grup 4: Inserts (Quote, Table, Divider, Link, Image) */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => insertPrefix("> ", "Kutipan atau catatan penting")}
            disabled={readOnly}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer transition-colors"
            title="Kutipan / Blockquote"
          >
            <Quote className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={insertTable}
            disabled={readOnly}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer transition-colors"
            title="Sisipkan Tabel Markdown"
          >
            <TableIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertText("\n---\n")}
            disabled={readOnly}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer transition-colors"
            title="Garis Pemisah (Divider)"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={insertLink}
            disabled={readOnly}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer transition-colors"
            title="Sisipkan Tautan (Ctrl+K)"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={insertImage}
            disabled={readOnly}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer transition-colors"
            title="Sisipkan Gambar"
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Grup 5: Menu Dropdown Template Instan */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            disabled={readOnly}
            className="h-7 px-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-primary/20"
            title="Pilih template dokumen standar"
          >
            <Sparkles className="h-3 w-3" />
            <span className="hidden sm:inline">Template</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>

          {showTemplates && (
            <div className="absolute right-0 mt-1 w-64 rounded-xl border border-border bg-popover p-1.5 shadow-xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-1">
                Pilih Template Catatan
              </div>
              <button
                type="button"
                onClick={() => applyTemplate("spec")}
                className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  ⚡ Spesifikasi Teknis & Solusi
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Latar belakang, spesifikasi API, dan acceptance criteria.
                </span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate("minutes")}
                className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  📋 Notulen Rapat & Tindak Lanjut
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Peserta, pembahasan, keputusan, dan penugasan PIC.
                </span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate("bug")}
                className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  🐛 Laporan Masalah & Bug
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Gejala, cara reproduksi, expected vs actual, aksi perbaikan.
                </span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate("wbs")}
                className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  🏗️ Tabel Rincian Kerja (WBS)
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Tabel paket kerja, lingkup deliverable, dan bobot persentase.
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Grup 6: Mode View Switcher & Maximize */}
        <div className="flex items-center gap-1 ml-auto">
          <div className="flex items-center bg-muted/80 rounded-lg p-0.5 border border-border/60 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("write")}
              className={cn(
                "px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1",
                viewMode === "write"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Mode Editor Teks"
            >
              <Edit3 className="h-3 w-3" />
              <span className="hidden md:inline">Tulis</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={cn(
                "px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1",
                viewMode === "preview"
                  ? "bg-card text-primary shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Mode Pratinjau (WYSIWYG)"
            >
              <Eye className="h-3 w-3" />
              <span className="hidden md:inline">Pratinjau</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={cn(
                "px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1",
                viewMode === "split"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Mode Berdampingan (Split Screen)"
            >
              <Columns className="h-3 w-3" />
              <span className="hidden md:inline">Split</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-md hover:bg-muted text-foreground/70 hover:text-foreground cursor-pointer transition-colors"
            title={isFullscreen ? "Kecilkan Layar Penuh" : "Perbesar ke Layar Penuh (Zen Mode)"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* AREA UTAMA (EDITOR / PREVIEW / SPLIT)                     */}
      {/* ========================================================= */}
      <div
        className={cn(
          "grid transition-all flex-1 min-h-0",
          viewMode === "split" ? "grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border" : "grid-cols-1"
        )}
      >
        {/* Editor Textarea */}
        {(viewMode === "write" || viewMode === "split") && (
          <div className="relative flex flex-col flex-1 h-full min-h-0 bg-background/50">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              readOnly={readOnly}
              autoFocus={autoFocus}
              style={{
                minHeight: isFullscreen ? "100%" : minHeight,
                maxHeight: isFullscreen ? "none" : maxHeight,
              }}
              className="w-full flex-1 p-3 text-xs sm:text-[13px] leading-relaxed font-sans bg-transparent text-foreground placeholder:text-muted-foreground/60 resize-y focus:outline-none focus:ring-0 border-0 overflow-y-auto"
            />
          </div>
        )}

        {/* Live WYSIWYG Preview */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div
            style={{
              minHeight: isFullscreen ? "100%" : minHeight,
              maxHeight: isFullscreen ? "none" : maxHeight,
            }}
            className="p-4 sm:p-5 overflow-y-auto bg-muted/15 flex-1 min-h-0 text-foreground"
          >
            <div className="max-w-prose space-y-1">
              {renderMarkdownPreview(value)}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* FOOTER INFORMASI STATUS & STATISTIK                       */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span>
            <strong>{wordCount}</strong> kata
          </span>
          <span>•</span>
          <span>
            <strong>{charCount}</strong> karakter
          </span>
          <span>•</span>
          <span>
            Estimasi baca: <strong>~{readTimeMin} mnt</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] bg-muted px-1.5 py-0.5 rounded text-foreground/70 border border-border/40">
            Markdown Aktif
          </span>
          {isFullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="text-primary font-bold hover:underline cursor-pointer"
            >
              Tutup Layar Penuh (ESC)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RichTextEditor;
