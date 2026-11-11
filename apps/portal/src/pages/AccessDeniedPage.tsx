import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, HelpCircle } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@org/ui';

export function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-radial from-rose-600/20 via-transparent to-transparent -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Card className="border-slate-800 bg-slate-900/90 text-white shadow-2xl backdrop-blur-md text-center">
          <CardHeader className="space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center ring-2 ring-rose-500/30">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">403 - Akses Ditolak</CardTitle>
            <CardDescription className="text-slate-300 text-sm font-medium">
              Anda tidak memiliki hak akses ke halaman ini.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Peran (role) akun Anda saat ini tidak memiliki izin yang memadai untuk melihat atau
              mengelola modul ini. Jika Anda merasa ini adalah kesalahan, silakan hubungi
              Administrator sistem MFC.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button asChild variant="outline" className="flex-1 text-xs border-slate-700 text-slate-200 hover:bg-slate-800">
                <Link to="/login">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Ganti Akun
                </Link>
              </Button>
              <Button asChild className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/">
                  <Home className="h-3.5 w-3.5 mr-1.5" />
                  Beranda Publik
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default AccessDeniedPage;
