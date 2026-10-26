import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Eye,
  EyeOff,
  Store,
  UserCheck,
  Shield,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, registerOwner } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register states
  const [regFullName, setRegFullName] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) return;

    try {
      setIsLoading(true);
      setErrorMsg(null);
      await login(loginUsername, loginPassword);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal melakukan login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setErrorMsg('Harap setujui ketentuan penggunaan terlebih dahulu.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      await registerOwner({
        businessName: regBusinessName,
        fullName: regFullName,
        username: regUsername,
        email: regEmail,
        phone: regPhone || undefined,
        password: regPassword,
        confirmPassword: regConfirmPassword,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Pendaftaran gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickDemo = (role: 'owner' | 'cashier' | 'inventory') => {
    setErrorMsg(null);
    setForgotMsg(null);
    setTab('login');
    if (role === 'owner') {
      setLoginUsername('owner_demokuliner');
      setLoginPassword('BisnisKita2026!');
    } else if (role === 'cashier') {
      setLoginUsername('kasir_siti');
      setLoginPassword('Kasir123!');
    } else if (role === 'inventory') {
      setLoginUsername('gudang_agus');
      setLoginPassword('Gudang123!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Brand Banner */}
        <div className="bg-emerald-800 px-6 py-6 text-white text-center space-y-1.5 relative">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 mx-auto flex items-center justify-center font-bold text-xl text-white shadow-inner">
            BK
          </div>
          <h2 className="text-xl font-bold tracking-tight">Bisnis Kita</h2>
          <p className="text-xs text-emerald-100 font-medium">
            POS, Stok &amp; Keuangan UMKM Kuliner Terintegrasi Cloud
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-center transition-colors ${
              tab === 'login'
                ? 'bg-white text-slate-900 border-b-2 border-emerald-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Masuk Akun (Login)
          </button>
          <button
            onClick={() => {
              setTab('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-center transition-colors ${
              tab === 'register'
                ? 'bg-white text-slate-900 border-b-2 border-emerald-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Daftar Usaha Baru (Owner)
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {forgotMsg && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center gap-2">
              <HelpCircle className="w-4 h-4 shrink-0 text-blue-600" />
              <span>{forgotMsg}</span>
            </div>
          )}

          {/* Quick Demo Credentials Bar */}
          {tab === 'login' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Uji Coba Cepat (Akun Demo):
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => fillQuickDemo('owner')}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
                >
                  👔 Pemilik Usaha
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('cashier')}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
                >
                  💳 Kasir
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('inventory')}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
                >
                  📦 Gudang
                </button>
              </div>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Username Akun
                </label>
                <input
                  type="text"
                  placeholder="owner_demokuliner / kasir_siti"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="font-medium text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() =>
                      setForgotMsg(
                        'Untuk akun owner demo: password adalah BisnisKita2026!. Akun karyawan dapat di-reset oleh pemilik dari menu Kelola Staf.'
                      )
                    }
                    className="text-[11px] text-emerald-700 hover:underline"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
              >
                <span>{isLoading ? 'Memeriksa Kredensial...' : 'Masuk ke Aplikasi'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* REGISTER OWNER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-950">
                Setiap pendaftaran owner akan membuat ruang usaha (tenant) mandiri yang terisolasi aman.
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama Usaha Kuliner <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kedai Kopi Senja, Ayam Geprek Berkah"
                  value={regBusinessName}
                  onChange={(e) => setRegBusinessName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama Lengkap Pemilik <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Fauzan"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Username Unik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ahmad_fauzan"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="ahmad@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">No. WhatsApp / HP</label>
                <input
                  type="tel"
                  placeholder="081234567890"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Min. 6 karakter"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Konfirmasi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Ulangi password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 pt-1 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Saya menyetujui ketentuan penggunaan aplikasi POS Bisnis Kita.</span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
              >
                <span>{isLoading ? 'Mendaftarkan Usaha...' : 'Daftar &amp; Buat Ruang Usaha'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
