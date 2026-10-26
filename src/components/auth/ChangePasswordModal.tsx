import React, { useState } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export const ChangePasswordModal: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If user already changed their temporary password, do not show
  if (!user || user.temporaryPasswordChanged) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      alert('Password berhasil diperbarui! Selamat bertugas.');
      await refreshUserData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengubah password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
          <Lock className="w-5 h-5 text-amber-600" />
          <span>Ganti Password Sementara Anda</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Halo <strong>{user.fullName}</strong>. Demi keamanan akun Anda, pemilik usaha mewajibkan Anda untuk mengganti password sementara pada saat pertama kali login.
        </p>

        {errorMsg && (
          <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Password Baru <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Konfirmasi Password Baru <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              placeholder="Ulangi password baru"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-semibold rounded-lg shadow-sm transition-colors text-xs"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Password Baru & Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
};
