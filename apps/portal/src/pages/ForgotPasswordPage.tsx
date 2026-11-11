import React, { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, KeyRound, Sparkles } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@org/ui';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 700);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-white relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute inset-0 bg-radial from-blue-600/20 via-transparent to-transparent -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Card className="border-slate-800 bg-slate-900/90 text-white shadow-2xl backdrop-blur-md">
          <CardHeader className="text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white mx-auto flex items-center justify-center font-bold text-xl shadow-lg ring-2 ring-blue-400/20">
              <KeyRound className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Lupa Password?</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Masukkan alamat email terdaftar Anda untuk menerima tautan pemulihan kata sandi.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isSubmitted ? (
              <div className="py-4 text-center space-y-3 animate-in fade-in">
                <div className="h-10 w-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold text-slate-100">
                  Tautan Pemulihan Telah Dikirim!
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Kami telah mengirimkan instruksi reset password ke{' '}
                  <span className="font-semibold text-sky-400">{email}</span>. Silakan periksa kotak
                  masuk atau folder spam Anda.
                </p>

                <div className="pt-4">
                  <Button asChild className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-700">
                    <Link to="/reset-password?token=demo-valid-token-2026">
                      Buka Halaman Reset Password (Simulasi)
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-slate-300">
                    Email Terdaftar
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@perusahaan.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10 text-xs bg-slate-800/80 border-slate-700 text-white rounded-xl"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
                >
                  {isLoading ? 'Mengirim Instruksi...' : 'Kirim Link Reset Password'}
                </Button>
              </form>
            )}

            <div className="pt-2 text-center border-t border-slate-800">
              <Link
                to="/login"
                className="text-xs font-medium text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke Halaman Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default ForgotPasswordPage;
