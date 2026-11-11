import React, { useState, useMemo, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@org/ui';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validasi kekuatan kata sandi
  const strength = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const isPasswordValid = strength.minLength && strength.hasUpper && strength.hasNumber;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Cek Token Expiration (Jika token kosong atau berlabel expired)
    if (!token || token.includes('expired')) {
      setErrorMessage('Token pemulihan telah kedaluwarsa atau tidak valid. Silakan ajukan reset baru.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Kata sandi belum memenuhi kriteria keamanan minimum.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok.');
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-white relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute inset-0 bg-radial from-blue-600/20 via-transparent to-transparent -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Card className="border-slate-800 bg-slate-900/90 text-white shadow-2xl backdrop-blur-md">
          <CardHeader className="text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white mx-auto flex items-center justify-center font-bold text-xl shadow-lg ring-2 ring-blue-400/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Atur Ulang Kata Sandi</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Buat kata sandi baru yang aman untuk akun sistem MFC Anda.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isSuccess ? (
              <div className="py-6 text-center space-y-3 animate-in fade-in">
                <div className="h-12 w-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div className="text-base font-bold text-slate-100">
                  Kata Sandi Berhasil Diperbarui!
                </div>
                <p className="text-xs text-slate-400">
                  Mengarahkan Anda kembali ke halaman login dalam beberapa detik...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimal 8 karakter..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-10 h-10 text-xs bg-slate-800/80 border-slate-700 text-white rounded-xl font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Konfirmasi Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="password"
                      placeholder="Ketik ulang kata sandi..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 h-10 text-xs bg-slate-800/80 border-slate-700 text-white rounded-xl font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Password Strength Checklist */}
                <div className="space-y-1.5 p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-[11px]">
                  <div className="font-semibold text-slate-300">Kriteria Keamanan Kata Sandi:</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className={`flex items-center gap-1.5 ${strength.minLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {strength.minLength ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      <span>Min. 8 karakter</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${strength.hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {strength.hasUpper ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      <span>Huruf besar (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${strength.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {strength.hasNumber ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      <span>Kombinasi angka (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${strength.hasSymbol ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {strength.hasSymbol ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      <span>Karakter simbol (@#$%)</span>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!isPasswordValid || !confirmPassword}
                  className="w-full h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
                >
                  Simpan Kata Sandi Baru
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
export default ResetPasswordPage;
