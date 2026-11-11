import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  FolderKanban,
  FileText,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  LogOut,
  User,
  ArrowRight,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@org/ui';
import { authStore } from '../auth/auth-store';

export function CustomerPortalPage() {
  const session = authStore.getSession();

  const handleLogout = () => {
    authStore.clearSession();
  };
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10 space-y-8">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center font-bold text-lg shadow-lg">
            MFC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">MFC Customer Portal</h1>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                Customer Client
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Selamat datang{session?.name ? `, ${session.name}` : ''}! Kelola delivery proyek, kontrak, dan billing digital Anda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-xs border-slate-800 text-slate-300 hover:bg-slate-900 cursor-pointer"
          >
            <Link to="/login">
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Keluar (Logout)
            </Link>
          </Button>
        </div>
      </div>

      {/* Customer Services Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-slate-800 bg-slate-900/60 text-white">
          <CardHeader>
            <div className="h-9 w-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-1">
              <FolderKanban className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-bold">Proyek & Sprint Delivery</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Pantau progres pengembangan aplikasi web & mobile tim MFC.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span>Enterprise Portal v2</span>
                <span className="text-emerald-400 font-semibold">Sprint 4/6 (85%)</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-[85%]" />
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full text-xs border-slate-700 text-slate-200">
              <Link to="/compUI">Lihat Workspace</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 text-white">
          <CardHeader>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
              <CreditCard className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-bold">Invoicing & Kontrak</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Riwayat tagihan software house dan status pembayaran.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs flex justify-between items-center">
              <div>
                <div className="font-semibold text-slate-200">INV-2026-0042</div>
                <div className="text-[10px] text-slate-400">Milestone 2 Delivery</div>
              </div>
              <Badge className="bg-emerald-600/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                Paid Lunas
              </Badge>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full text-xs border-slate-700 text-slate-200">
              <a href="#invoices">Unduh Faktur</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 text-white">
          <CardHeader>
            <div className="h-9 w-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mb-1">
              <MessageSquare className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-bold">Konsultasi & Support</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Hubungi tim technical lead atau project manager MFC secara langsung.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Tim support kami siap membantu kebutuhan eskalasi infrastruktur dan penambahan fitur baru.
            </p>
            <Button asChild size="sm" className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white">
              <a href="mailto:support@mfc.id">Hubungi Tim MFC</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default CustomerPortalPage;
