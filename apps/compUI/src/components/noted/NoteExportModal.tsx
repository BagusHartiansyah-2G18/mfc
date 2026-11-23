import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@org/ui';
import { Printer, Copy, Check, FileDown } from 'lucide-react';
import { type JudulNote, type NoteBreadcrumb } from './types';

interface NoteExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rootNote: JudulNote | null;
  allSubNotes: JudulNote[];
  breadcrumbChain: NoteBreadcrumb[];
}

export function NoteExportModal({
  isOpen,
  onClose,
  rootNote,
  allSubNotes,
  breadcrumbChain,
}: NoteExportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!rootNote) return null;

  const generateMarkdown = () => {
    let md = `# LAPORAN STRUKTUR KERJA (WORK BREAKDOWN STRUCTURE)\n`;
    md += `**Inisiatif / Catatan Induk:** ${rootNote.judul} (#${rootNote.kdJudul})\n`;
    md += `**Status:** ${rootNote.status} | **Capaian Progres:** ${rootNote.progress}%\n`;
    if (rootNote.targetBudget) {
      md += `**Pagu Anggaran:** Rp ${Number(rootNote.targetBudget).toLocaleString('id-ID')}\n`;
    }
    if (rootNote.dueDate) {
      md += `**Tenggat Waktu:** ${new Date(rootNote.dueDate).toLocaleDateString('id-ID')}\n`;
    }
    md += `**Ringkasan:** ${rootNote.ringkasan}\n\n`;
    md += `## Rincian Hierarki Sub-Catatan & Aktivitas\n\n`;
    md += `| Kode | Tingkat | Judul & Rincian | Tahapan | Status | Progres | PIC |\n`;
    md += `| :--- | :---: | :--- | :--- | :--- | :---: | :--- |\n`;

    allSubNotes.forEach((sub) => {
      md += `| \`${sub.kdJudul}\` | L${sub.tingkat} | **${sub.judul}**<br/>${sub.ringkasan} | ${sub.stage || '-'} | ${sub.status} | ${sub.progress}% | ${sub.picName || '-'} |\n`;
    });

    md += `\n---\n*Digenerate secara otomatis oleh MFC Noted Enterprise pada ${new Date().toLocaleString('id-ID')}*`;
    return md;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileDown className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Ekspor Laporan Pertanggungjawaban (LPJ / WBS)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Ringkasan hierarki resmi siap cetak ke PDF atau salin dalam format Markdown terstruktur.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Printable Paper Preview */}
        <div className="p-6 rounded-xl border border-border/80 bg-card space-y-5 my-2 shadow-inner print:p-0 print:border-none print:shadow-none">
          {/* Header Formal */}
          <div className="border-b-2 border-primary/30 pb-4 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary font-mono">
              M Software Center &bull; Hierarchical Project Report
            </span>
            <h3 className="text-lg font-black text-foreground">{rootNote.judul}</h3>
            <p className="text-xs text-muted-foreground font-mono">
              Kode Induk: #{rootNote.kdJudul} &bull; Dicetak: {new Date().toLocaleDateString('id-ID')}
            </p>
          </div>

          {/* Ringkasan Eksekutif Metrik */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/40 p-3 rounded-xl border border-border/60">
            <div>
              <span className="text-muted-foreground block text-[10px]">Status Keseluruhan</span>
              <strong className="text-foreground text-xs">{rootNote.status}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Capaian Progres</span>
              <strong className="text-primary text-xs">{rootNote.progress}% Selesai</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Pagu Anggaran</span>
              <strong className="text-emerald-600 text-xs">
                Rp {Number(rootNote.targetBudget || 0).toLocaleString('id-ID')}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Batas Waktu</span>
              <strong className="text-foreground text-xs">
                {rootNote.dueDate ? new Date(rootNote.dueDate).toLocaleDateString('id-ID') : '-'}
              </strong>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="text-xs text-foreground/90 leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/40">
            <p className="font-semibold text-muted-foreground text-[10px] uppercase">Ringkasan Ruang Lingkup:</p>
            <p className="mt-1">{rootNote.ringkasan}</p>
          </div>

          {/* Tabel Rincian Hierarki */}
          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Daftar Rincian Hierarki Sub-Catatan ({allSubNotes.length} item)
            </h5>
            <div className="rounded-lg border border-border/60 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/60 text-[10px] text-muted-foreground uppercase border-b border-border/60">
                  <tr>
                    <th className="py-2 px-2.5 w-24">Kode</th>
                    <th className="py-2 px-2.5">Judul & Ringkasan</th>
                    <th className="py-2 px-2.5 w-20">Tahap</th>
                    <th className="py-2 px-2.5 w-24">Status</th>
                    <th className="py-2 px-2.5 w-16 text-right">Progres</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-[11px]">
                  {allSubNotes.map((sub) => (
                    <tr key={sub.kdJudul}>
                      <td className="py-2 px-2.5 font-mono font-bold text-primary">#{sub.kdJudul}</td>
                      <td className="py-2 px-2.5">
                        <span className="font-semibold text-foreground">{sub.judul}</span>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{sub.ringkasan}</p>
                      </td>
                      <td className="py-2 px-2.5">{sub.stage || '-'}</td>
                      <td className="py-2 px-2.5 font-semibold">{sub.status}</td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold">{sub.progress}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyMarkdown}
            className="text-xs gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Format Markdown'}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak / Simpan PDF</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
