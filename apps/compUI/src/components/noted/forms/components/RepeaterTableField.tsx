import { Button, Input } from '@org/ui';
import { Plus, Trash2, ListPlus } from 'lucide-react';
import { type RepeaterColumnDef } from '../../types';
import { FormFileUploadField } from './FormFileUploadField';

interface RepeaterTableFieldProps {
  label: string;
  helperText?: string;
  required?: boolean;
  columns?: RepeaterColumnDef[];
  value?: Array<Record<string, any>>;
  onChange: (rows: Array<Record<string, any>>) => void;
  uploadEndpoint?: string;
  skipAuth?: boolean;
}

export function RepeaterTableField({
  label,
  helperText,
  required = false,
  columns = [
    { key: 'uraian', label: 'Uraian Item / Komponen', type: 'text', placeholder: 'Nama item' },
    { key: 'volume', label: 'Vol', type: 'number', placeholder: '1' },
    { key: 'satuan', label: 'Satuan', type: 'text', placeholder: 'Paket / Unit' },
    { key: 'harga', label: 'Harga Satuan (Rp)', type: 'currency', placeholder: '0' },
  ],
  value = [],
  onChange,
  uploadEndpoint,
  skipAuth = false,
}: RepeaterTableFieldProps) {
  const rows = Array.isArray(value) && value.length > 0 ? value : [{}];

  const handleAddRow = () => {
    onChange([...rows, {}]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) {
      onChange([{}]);
      return;
    }
    const copy = [...rows];
    copy.splice(index, 1);
    onChange(copy);
  };

  const handleCellChange = (rowIndex: number, colKey: string, cellVal: any) => {
    const copy = [...rows];
    copy[rowIndex] = {
      ...copy[rowIndex],
      [colKey]: cellVal,
    };
    onChange(copy);
  };

  // Hitung total akumulasi numerik jika ada kolom berbau harga/biaya
  const totalBiaya = rows.reduce((acc, row) => {
    const vol = Number(row['volume'] || row['qty'] || 1);
    const harga = Number(
      String(row['harga'] || row['biaya'] || row['nominal'] || 0).replace(/\D/g, '')
    );
    if (!isNaN(vol) && !isNaN(harga)) {
      return acc + vol * harga;
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <ListPlus className="h-3.5 w-3.5 text-primary" />
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        <span className="text-[10px] font-mono text-muted-foreground">
          {rows.length} Baris Data
        </span>
      </div>

      {helperText && <p className="text-[11px] text-muted-foreground">{helperText}</p>}

      {/* Table Container */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border/60 text-[11px] font-bold text-muted-foreground">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                {columns.map((col) => (
                  <th key={col.key} className="py-2.5 px-3">
                    {col.label}
                  </th>
                ))}
                <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2 px-3 text-center text-muted-foreground font-mono text-[11px]">
                    {rIdx + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="py-2 px-3">
                      {col.type === 'currency' ? (
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-semibold">
                            Rp
                          </span>
                          <input
                            type="text"
                            value={
                              row[col.key] !== undefined && row[col.key] !== null
                                ? Number(
                                    String(row[col.key]).replace(/\D/g, '')
                                  ).toLocaleString('id-ID')
                                : ''
                            }
                            onChange={(e) => {
                              const cleanNum = Number(e.target.value.replace(/\D/g, ''));
                              handleCellChange(rIdx, col.key, cleanNum || 0);
                            }}
                            placeholder={col.placeholder || '0'}
                            className="h-8 w-full pl-8 pr-2.5 text-xs rounded-md border border-border/70 bg-background font-mono text-foreground focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      ) : col.type === 'select' && col.options ? (
                        <select
                          value={row[col.key] || ''}
                          onChange={(e) => handleCellChange(rIdx, col.key, e.target.value)}
                          className="h-8 w-full px-2 text-xs rounded-md border border-border/70 bg-background text-foreground"
                        >
                          <option value="">-- Pilih --</option>
                          {col.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : col.type === 'file' ? (
                        uploadEndpoint ? (
                          <div className="min-w-[210px]">
                            <FormFileUploadField
                              label=""
                              value={row[col.key]}
                              onChange={(val) => handleCellChange(rIdx, col.key, val)}
                              uploadEndpoint={uploadEndpoint}
                              skipAuth={skipAuth}
                            />
                          </div>
                        ) : (
                          <Input
                            type="text"
                            value={typeof row[col.key] === 'string' ? row[col.key] : row[col.key]?.fileUrl || ''}
                            onChange={(e) => handleCellChange(rIdx, col.key, e.target.value)}
                            placeholder={col.placeholder || 'https://...'}
                            className="h-8 text-xs bg-background"
                          />
                        )
                      ) : (
                        <Input
                          type={col.type === 'number' ? 'number' : 'text'}
                          value={row[col.key] || ''}
                          onChange={(e) => handleCellChange(rIdx, col.key, e.target.value)}
                          placeholder={col.placeholder || ''}
                          className="h-8 text-xs bg-background"
                        />
                      )}
                    </td>
                  ))}
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(rIdx)}
                      className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Hapus baris ini"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Toolbar & Sum */}
        <div className="p-2.5 bg-muted/30 border-t border-border/60 flex items-center justify-between flex-wrap gap-2 text-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="h-7 text-[11px] gap-1 cursor-pointer shadow-2xs font-medium"
          >
            <Plus className="h-3 w-3" />
            <span>Tambah Baris</span>
          </Button>

          {totalBiaya > 0 && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-muted-foreground">Total Akumulasi:</span>
              <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                Rp {totalBiaya.toLocaleString('id-ID')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
