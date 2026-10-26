import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { AuditLog, Business } from '../../types/index.ts';
import {
  Settings,
  Store,
  Receipt,
  Download,
  Upload,
  Shield,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const { business, updateCurrentBusiness } = useAuth();

  // Settings form states
  const [name, setName] = useState(business?.name || '');
  const [tagline, setTagline] = useState(business?.tagline || '');
  const [logoUrl, setLogoUrl] = useState(business?.logoUrl || '');
  const [address, setAddress] = useState(business?.address || '');
  const [phone, setPhone] = useState(business?.phone || '');
  const [currency, setCurrency] = useState(business?.currency || 'IDR');
  const [timezone, setTimezone] = useState(business?.timezone || 'Asia/Jakarta');
  const [taxRate, setTaxRate] = useState<number>(business?.taxRate || 0);
  const [serviceFeeRate, setServiceFeeRate] = useState<number>(business?.serviceFeeRate || 0);
  const [receiptHeader, setReceiptHeader] = useState(business?.receiptHeader || '');
  const [receiptFooter, setReceiptFooter] = useState(business?.receiptFooter || '');
  const [minStockAlertDefault, setMinStockAlertDefault] = useState<number>(
    business?.minStockAlertDefault || 5
  );

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (business) {
      setName(business.name);
      setTagline(business.tagline || '');
      setLogoUrl(business.logoUrl || '');
      setAddress(business.address || '');
      setPhone(business.phone || '');
      setTaxRate(business.taxRate || 0);
      setServiceFeeRate(business.serviceFeeRate || 0);
      setReceiptHeader(business.receiptHeader || '');
      setReceiptFooter(business.receiptFooter || '');
      setMinStockAlertDefault(business.minStockAlertDefault || 5);
    }
  }, [business]);

  const fetchAuditLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const logs = await api.get<AuditLog[]>('/audit-logs');
      setAuditLogs(logs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSuccessMsg(null);
      setErrorMsg(null);

      const res = await api.put<{ message: string; business: Business }>('/business', {
        name,
        tagline,
        logoUrl,
        address,
        phone,
        currency,
        timezone,
        taxRate,
        serviceFeeRate,
        receiptHeader,
        receiptFooter,
        minStockAlertDefault,
      });

      updateCurrentBusiness(res.business);
      setSuccessMsg('Pengaturan usaha berhasil diperbarui dan disinkronkan ke semua perangkat.');
      fetchAuditLogs();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const data = await api.get<any>('/backup/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunduh backup');
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!window.confirm('Yakin ingin memulihkan data dari berkas ini?')) return;
        await api.post('/backup/restore', json);
        alert('Data berhasil dipulihkan. Halaman akan disegarkan.');
        window.location.reload();
      } catch (err: any) {
        alert('Format berkas tidak valid atau rusak: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Pengaturan Usaha &amp; Sistem</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Identitas bisnis, konfigurasi struk kasir, pajak restoran, pencadangan dan log aktivitas.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Business Identity */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
            <Store className="w-4 h-4 text-emerald-700" />
            <span>Identitas &amp; Informasi Usaha</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Nama Usaha / Resto</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Slogan / Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">URL Logo Usaha</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Alamat Lengkap</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Taxes and Thermal Receipt Format */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
            <Receipt className="w-4 h-4 text-emerald-700" />
            <span>Pajak Restoran &amp; Struk Kasir Thermal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Pajak Restoran (PB1 %)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Diisi 10 jika memungut PB1 10%. Isi 0 jika tanpa pajak.
              </span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Biaya Layanan (Service Charge %)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={serviceFeeRate}
                onChange={(e) => setServiceFeeRate(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                Pesan Penutup Struk (Footer)
              </label>
              <textarea
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="Terima kasih atas kunjungan Anda!"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>
      </form>

      {/* Backup and Restore Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
          <Download className="w-4 h-4 text-emerald-700" />
          <span>Cadangan (Backup) &amp; Pemulihan Data Cloud</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div>
              <strong className="text-slate-900 block font-semibold">Unduh Cadangan Lengkap</strong>
              <span className="text-[11px] text-slate-500">
                Ekspor semua menu, resep BOM, riwayat transaksi, dan mutasi persediaan ke berkas JSON terenkripsi.
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Berkas Backup (.json)</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div>
              <strong className="text-slate-900 block font-semibold">Pulihkan Data dari Berkas</strong>
              <span className="text-[11px] text-slate-500">
                Impor berkas cadangan JSON yang telah diunduh sebelumnya untuk mengembalikan data usaha.
              </span>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded-lg shadow-2xs cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Pilih Berkas Backup JSON</span>
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>Jejak Audit Aktivitas Pengguna (Audit Log)</span>
          </div>
          <span className="text-xs text-slate-400 font-mono tabular-nums">{auditLogs.length} Entri</span>
        </div>

        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-3 py-2">Waktu</th>
                <th className="px-3 py-2">Pengguna</th>
                <th className="px-3 py-2">Tindakan</th>
                <th className="px-3 py-2">Detail Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {isLoadingLogs ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-slate-400">
                    Memuat log audit...
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-slate-400">
                    Belum ada riwayat aktivitas.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2 font-mono text-slate-500 tabular-nums whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-900 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="px-3 py-2 font-mono text-emerald-800 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="px-3 py-2 text-slate-600 truncate max-w-md">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
