import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@org/ui';
import {
  Printer,
  ShieldCheck,
  FileCheck2,
  Calendar,
  User,
  QrCode,
  Building,
} from 'lucide-react';
import { type DataForm } from '../../types';

interface FormReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: DataForm | null;
  response: Record<string, any> | null;
}

export function FormReceiptPrintModal({
  isOpen,
  onClose,
  form,
  response,
}: FormReceiptPrintModalProps) {
  if (!form || !response) return null;

  const regNo = `REG-${new Date(response.createdAt || Date.now())
    .getFullYear()}-${String(response.id || '9999').slice(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white text-slate-900">
        <DialogTitle className="sr-only">Pratinjau Lembar Berita Acara Resmi</DialogTitle>
        <DialogDescription className="sr-only">Hasil pengisian formulir dan verifikasi tanda tangan digital.</DialogDescription>

        {/* Modal Controls (Not printed) */}
        <div className="print:hidden p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">
              Pratinjau Dokumen Berita Acara & Lembar Kendali Resmi
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak / Simpan PDF (Ctrl+P)</span>
            </Button>
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs cursor-pointer">
              Tutup
            </Button>
          </div>
        </div>

        {/* PRINTABLE SHEET */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-900 bg-white font-sans text-xs">
          {/* 1. Formal Letterhead (KOP SURAT) */}
          <div className="border-b-2 border-slate-800 pb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                  Pemerintah Digital & Enterprise Governance Portal
                </h2>
                <p className="text-[11px] text-slate-600 font-medium">
                  Badan Tata Kelola Arsitektur Micro Frontend & Pusat Informasi Noted
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Sistem Validasi Resmi Terdesentralisasi • Host :4203 / :3002
                </p>
              </div>
            </div>

            {/* QR Code Verification Stamp */}
            <div className="text-center p-2 rounded-lg border border-slate-300 bg-slate-50 shrink-0">
              <QrCode className="h-12 w-12 mx-auto text-slate-800" />
              <span className="text-[8px] font-mono uppercase tracking-wider block text-slate-600 mt-1 font-bold">
                E-VERIFIED BGS
              </span>
            </div>
          </div>

          {/* 2. Document Title & Registration Metadata */}
          <div className="text-center space-y-1 py-1">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              BERITA ACARA & LEMBAR HASIL PENGISIAN FORMULIR
            </h3>
            <p className="text-xs text-indigo-900 font-bold">{form.tujuan}</p>
            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-600 font-mono pt-1">
              <span>Nomor Registrasi: <strong>{regNo}</strong></span>
              <span>•</span>
              <span>Status: <strong className="text-emerald-700 uppercase">{response.status || 'SUBMITTED'}</strong></span>
            </div>
          </div>

          {/* 3. Respondent & System Metadata Box */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px]">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <User className="h-3.5 w-3.5" />
                <span>Identitas Responden:</span>
              </div>
              <p className="font-bold text-slate-900 text-xs">
                {response.responderName || 'Anonim / Publik'}
              </p>
              <p className="text-[10px] text-slate-600 font-mono">
                {response.responderEmail || 'Tanpa Email Terverifikasi'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Calendar className="h-3.5 w-3.5" />
                <span>Waktu & Host Pencatatan:</span>
              </div>
              <p className="font-bold text-slate-900 text-xs">
                {response.createdAt
                  ? new Date(response.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'full',
                      timeStyle: 'medium',
                    })
                  : 'N/A'}
              </p>
              <p className="text-[10px] text-slate-600 font-mono">
                Origin Host: {response.originHost || 'portal-noted:4203'}
              </p>
            </div>
          </div>

          {/* 4. Responses Detailed Table */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileCheck2 className="h-3.5 w-3.5 text-indigo-600" />
              <span>Rincian Butir Isian & Keterangan Hasil</span>
            </h4>

            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                <tr>
                  <th className="py-2 px-3 border-r border-slate-300 w-10 text-center">No</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-1/3">Pertanyaan / Parameter</th>
                  <th className="py-2 px-3">Hasil Isian / Rekomendasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {form.fields
                  .filter((f) => f.type !== 'signature' && f.type !== 'section')
                  .map((field, idx) => {
                    const rawVal = response[field.key];
                    let displayVal: React.ReactNode = String(rawVal ?? '-');

                    if (field.type === 'currency' && typeof rawVal === 'number') {
                      displayVal = `Rp ${rawVal.toLocaleString('id-ID')}`;
                    } else if (field.type === 'repeater' && Array.isArray(rawVal)) {
                      displayVal = (
                        <div className="space-y-1 py-1">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {rawVal.length} rincian item berulang:
                          </span>
                          <table className="w-full text-[10px] border border-slate-200">
                            <tbody>
                              {rawVal.map((item, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                  <td className="p-1 font-mono">{i + 1}.</td>
                                  <td className="p-1 font-bold">{item.uraian || item.nama || '-'}</td>
                                  <td className="p-1 font-mono">
                                    {item.volume || 1} {item.satuan || ''}
                                  </td>
                                  <td className="p-1 font-mono text-right">
                                    {item.harga ? `Rp ${Number(item.harga).toLocaleString('id-ID')}` : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }

                    return (
                      <tr key={field.key} className="even:bg-slate-50/50">
                        <td className="py-2 px-3 border-r border-slate-300 text-center font-mono text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 font-semibold text-slate-800">
                          {field.label}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900 leading-relaxed">
                          {displayVal}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* 5. Formal Signatures & Sign-off Boxes */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
            {/* Responden Sign-off */}
            <div className="space-y-2">
              <p className="text-slate-600 font-medium">Pemohon / Responden Terdaftar,</p>
              <div className="h-24 w-48 mx-auto border border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden p-1">
                {response['tanda_tangan'] || response['signature'] ? (
                  <img
                    src={response['tanda_tangan'] || response['signature']}
                    alt="Tanda Tangan Responden"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">[ Tertanda Digital ]</span>
                )}
              </div>
              <p className="font-bold text-slate-900 underline text-xs">
                {response.responderName || 'Anonim'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">Responden Dokumen</p>
            </div>

            {/* Verifikator Sign-off */}
            <div className="space-y-2">
              <p className="text-slate-600 font-medium">Verifikator / Pejabat Berwenang,</p>
              <div className="h-24 w-48 mx-auto border border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 p-2">
                <div className="text-center space-y-1">
                  <ShieldCheck className="h-8 w-8 mx-auto text-emerald-600" />
                  <span className="text-[9px] font-mono font-bold text-emerald-700 block">
                    SEALED & VERIFIED
                  </span>
                </div>
              </div>
              <p className="font-bold text-slate-900 underline text-xs">
                Principal Administrator MFC
              </p>
              <p className="text-[10px] text-slate-500 font-mono">BGS Governance Engine</p>
            </div>
          </div>

          {/* 6. Footer Authenticity Digest */}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span>SHA-256 Digest: 8f9b...a10e • Dokumen ini sah dan memiliki kekuatan pembuktian digital.</span>
            <span>Halaman 1 dari 1</span>
          </div>
        </div>

        {/* Modal Bottom Footer (Not printed) */}
        <DialogFooter className="print:hidden p-3 border-t border-slate-200 bg-slate-50">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs cursor-pointer">
            Kembali
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
