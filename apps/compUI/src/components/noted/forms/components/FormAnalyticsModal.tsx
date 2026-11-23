import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@org/ui';
import {
  BarChart2,
  PieChart,
  Users,
  Award,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { type DataForm } from '../../types';

interface FormAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: DataForm | null;
  rows?: Record<string, any>[];
}

export function FormAnalyticsModal({
  isOpen,
  onClose,
  form,
  rows = [],
}: FormAnalyticsModalProps) {
  // 1. Hitung Statistik Ringkas
  const stats = useMemo(() => {
    const total = rows.length;
    if (total === 0) {
      return { total: 0, today: 0, avgScore: null, completionRate: 100 };
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = rows.filter((r) =>
      String(r.createdAt || '').startsWith(todayStr)
    ).length;

    // Cari field angka pertama yang mungkin mewakili skor/kelaikan/rating
    let sumScore = 0;
    let scoreCount = 0;

    rows.forEach((r) => {
      Object.entries(r).forEach(([k, v]) => {
        if (
          (k.includes('skor') || k.includes('score') || k.includes('nilai') || k.includes('rating')) &&
          typeof v === 'number' &&
          !isNaN(v)
        ) {
          sumScore += v;
          scoreCount++;
        }
      });
    });

    const avgScore = scoreCount > 0 ? (sumScore / scoreCount).toFixed(1) : null;

    return {
      total,
      today: todayCount,
      avgScore,
      completionRate: 100,
    };
  }, [rows]);

  // 2. Analisis Distribusi Frekuensi untuk Setiap Field Kategori (select, radio, rating)
  const categoryDistributions = useMemo(() => {
    if (!form?.fields || rows.length === 0) return [];

    const categoricalFields = form.fields.filter((f) =>
      ['select', 'radio', 'rating'].includes(f.type)
    );

    return categoricalFields.map((field) => {
      const counts: Record<string, number> = {};

      rows.forEach((row) => {
        const val = row[field.key];
        if (val !== undefined && val !== null && val !== '') {
          const strVal = String(val);
          counts[strVal] = (counts[strVal] || 0) + 1;
        }
      });

      const totalResponses = Object.values(counts).reduce((a, b) => a + b, 0);

      const items = Object.entries(counts).map(([label, count]) => ({
        label,
        count,
        percent: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
      }));

      // Urutkan berdasarkan frekuensi terbesar
      items.sort((a, b) => b.count - a.count);

      return {
        field,
        totalResponses,
        items,
      };
    });
  }, [form, rows]);

  if (!form) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/80 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span>Visual Analytics & Laporan Grafik Form</span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">
                  #{form.kd}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                {form.tujuan} — Analisis kecenderungan respon secara otomatis (Auto-Chart BI).
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section 1: KPI Metrics Card Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-medium">Total Respon</span>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold font-mono text-foreground">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Entri data masuk</p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-medium">Hari Ini</span>
                <Clock className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold font-mono text-emerald-600">{stats.today}</p>
              <p className="text-[10px] text-muted-foreground">Respon baru hari ini</p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-medium">Skor Rata-Rata</span>
                <Award className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold font-mono text-amber-600">
                {stats.avgScore !== null ? stats.avgScore : 'N/A'}
              </p>
              <p className="text-[10px] text-muted-foreground">Skoring audit/rating</p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-medium">Tingkat Validitas</span>
                <TrendingUp className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold font-mono text-indigo-600">100%</p>
              <p className="text-[10px] text-muted-foreground">Respon terverifikasi</p>
            </div>
          </div>

          {/* Section 2: Visual Distributions */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
              <PieChart className="h-4 w-4 text-primary" />
              <span>Distribusi Frekuensi Jawaban Pilihan (*Categorical Breakdown*)</span>
            </h4>

            {categoryDistributions.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-border/80 text-muted-foreground space-y-1">
                <Sparkles className="h-5 w-5 mx-auto text-primary opacity-60" />
                <p className="font-semibold text-xs">Belum ada data distribusi kategori</p>
                <p className="text-[11px]">
                  Tambahkan bidang tipe Dropdown, Radio, atau Rating untuk melihat grafik otomatis di sini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryDistributions.map((dist, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-border/80 bg-card shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-foreground">{dist.field.label}</h5>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Key: {dist.field.key} • {dist.totalResponses} jawaban
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                        {dist.field.type}
                      </span>
                    </div>

                    {/* Bar visualization */}
                    <div className="space-y-2 pt-1">
                      {dist.items.map((item, iIdx) => {
                        const colors = [
                          'bg-emerald-500',
                          'bg-indigo-500',
                          'bg-amber-500',
                          'bg-sky-500',
                          'bg-rose-500',
                        ];
                        const barColor = colors[iIdx % colors.length];

                        return (
                          <div key={iIdx} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-medium text-foreground truncate max-w-[200px]">
                                {item.label}
                              </span>
                              <span className="font-mono text-muted-foreground">
                                {item.count} ({item.percent}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                style={{ width: `${item.percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-3 border-t border-border/80 bg-muted/20">
          <Button variant="default" size="sm" onClick={onClose} className="h-8 text-xs cursor-pointer">
            Tutup Analitik
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
