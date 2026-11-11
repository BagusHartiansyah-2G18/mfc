import React from 'react';
import { Link } from 'react-router-dom';
import { UserX, ArrowLeft, Mail, AlertTriangle } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@org/ui';

export function AccountDisabledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-radial from-amber-600/20 via-transparent to-transparent -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Card className="border-slate-800 bg-slate-900/90 text-white shadow-2xl backdrop-blur-md text-center">
          <CardHeader className="space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center ring-2 ring-amber-500/30">
              <UserX className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">Akun Dinonaktifkan</CardTitle>
            <CardDescription className="text-slate-300 text-sm font-medium">
              Akun Anda telah dinonaktifkan. Silakan hubungi administrator.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Status akun Anda telah ditangguhkan oleh Administrator sistem karena alasan keamanan,
              kebijakan retensi, atau berakhirnya masa kontrak layanan.
            </p>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs text-slate-300 space-y-1 text-left">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                Bantuan & Pemulihan Akun:
              </div>
              <div className="text-[11px] text-slate-400">
                Email support resmi: <span className="text-sky-400 font-mono">support@mfc.id</span>
              </div>
            </div>

            <div className="pt-2">
              <Button asChild className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/login">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Kembali ke Halaman Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default AccountDisabledPage;
