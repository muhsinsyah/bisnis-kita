import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { User, UserRole } from '../../types/index.ts';
import { Users, UserPlus, KeyRound, Shield, Check, X, ShieldAlert } from 'lucide-react';

export const StaffModule: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add staff modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [temporaryPassword, setTemporaryPassword] = useState<string>('Kasir123!');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset password modal
  const [resetStaffTarget, setResetStaffTarget] = useState<User | null>(null);
  const [newTempPassword, setNewTempPassword] = useState<string>('Baru123!');

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<User[]>('/staff');
      setStaffList(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await api.post('/staff', {
        username,
        fullName,
        email,
        phone,
        role,
        temporaryPassword,
      });
      setIsAddModalOpen(false);
      setUsername('');
      setFullName('');
      setEmail('');
      setPhone('');
      await fetchStaff();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan staf');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (target: User) => {
    if (target.id === currentUser?.id) {
      alert('Pemilik usaha tidak dapat menonaktifkan akun sendiri.');
      return;
    }
    const nextState = !target.isActive;
    const confirmMsg = nextState
      ? `Aktifkan kembali akun ${target.fullName}?`
      : `Nonaktifkan akses akun ${target.fullName}? Pengguna tidak akan dapat login.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.put(`/staff/${target.id}`, { isActive: nextState });
      await fetchStaff();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetStaffTarget) return;

    try {
      await api.post(`/staff/${resetStaffTarget.id}/reset-password`, {
        newTemporaryPassword: newTempPassword,
      });
      alert(`Password sementara untuk ${resetStaffTarget.fullName} berhasil diubah.`);
      setResetStaffTarget(null);
      await fetchStaff();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Pemilik Usaha (Akses Penuh)';
      case 'supervisor':
        return 'Supervisor / Pengawas';
      case 'cashier':
        return 'Kasir (POS & Transaksi)';
      case 'inventory':
        return 'Staf Gudang (Persediaan)';
      default:
        return role;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Manajemen Karyawan &amp; Hak Akses (RBAC)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pendaftaran staf dilakukan oleh pemilik. Akses terisolasi pada ruang usaha Anda.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Karyawan</span>
        </button>
      </div>

      {/* RBAC Info Card */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-700" />
          <span>Aturan Hak Akses Pengguna</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] pt-1">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <strong className="text-slate-900 block mb-0.5">Kasir (Cashier)</strong>
            <span>Melayani POS kasir, cetak struk, dan pencatatan kas laci shift harian.</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <strong className="text-slate-900 block mb-0.5">Staf Gudang (Inventory)</strong>
            <span>Mengelola stok fisik, penerimaan faktur supplier, formula resep BOM, dan opname.</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <strong className="text-slate-900 block mb-0.5">Supervisor</strong>
            <span>Memantau penjualan kasir, approval refund, dan melihat laporan finansial.</span>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Nama Karyawan</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Peran / Role</th>
                <th className="px-4 py-3">Kontak</th>
                <th className="px-4 py-3 text-center">Status Akun</th>
                <th className="px-4 py-3 text-center">Password Sementara</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Memuat daftar karyawan...
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{staff.fullName}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">@{staff.username}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">{getRoleBadge(staff.role)}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <div>{staff.phone || '-'}</div>
                      <div className="text-[10px] text-slate-400">{staff.email}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(staff)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                          staff.isActive
                            ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                            : 'text-rose-800 bg-rose-50 hover:bg-rose-100'
                        }`}
                      >
                        {staff.isActive ? 'Aktif' : 'Non-aktif'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {staff.temporaryPasswordChanged ? (
                        <span className="text-[11px] text-emerald-700 font-medium">Sudah Diubah</span>
                      ) : (
                        <span className="text-[11px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                          Wajib Ganti Password
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {staff.role !== 'owner' && (
                        <button
                          onClick={() => setResetStaffTarget(staff)}
                          title="Reset Password Sementara"
                          className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Buat Akun Karyawan Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama Lengkap Karyawan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rina Wahyuni"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="kasir_rina"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Peran / Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="cashier">Kasir (POS)</option>
                    <option value="inventory">Staf Gudang (Stok &amp; BOM)</option>
                    <option value="supervisor">Supervisor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Password Sementara <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={temporaryPassword}
                  onChange={(e) => setTemporaryPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Karyawan wajib mengganti password ini saat login pertama.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">No. HP (Opsional)</label>
                  <input
                    type="tel"
                    placeholder="0812..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email (Opsional)</label>
                  <input
                    type="email"
                    placeholder="staff@internal.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Membuat...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetStaffTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Reset Password Karyawan</h3>
              <button onClick={() => setResetStaffTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Mengatur ulang password login untuk <strong>{resetStaffTarget.fullName}</strong> (@{resetStaffTarget.username}).
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Password Baru Sementara</label>
                <input
                  type="text"
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetStaffTarget(null)}
                  className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-sm"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
