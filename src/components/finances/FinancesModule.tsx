import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Expense, ExpenseCategory } from '../../types/index.ts';
import {
  PieChart,
  Plus,
  Trash2,
  DollarSign,
  Download,
  Calendar,
  FileSpreadsheet,
  X,
  CreditCard,
  Building,
  Zap,
} from 'lucide-react';

export const FinancesModule: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [financialData, setFinancialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Expense modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [category, setCategory] = useState<ExpenseCategory>('operational');
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [expRes, finRes] = await Promise.all([
        api.get<Expense[]>('/finances/expenses'),
        api.get<any>('/finances/overview'),
      ]);
      setExpenses(expRes);
      setFinancialData(finRes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    try {
      setIsSubmitting(true);
      await api.post('/finances/expenses', {
        category,
        title,
        amount: Number(amount) || 0,
        expenseDate,
        notes,
      });
      setIsExpenseModalOpen(false);
      setTitle('');
      setAmount(0);
      setNotes('');
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Hapus catatan pengeluaran ini?')) return;
    try {
      await api.delete(`/finances/expenses/${id}`);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const exportFinancialCSV = () => {
    if (!financialData) return;
    const { ringkasan } = financialData;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Indikator Keuangan,Nominal (IDR)\n' +
      `Omzet Bulan Ini,${ringkasan.omzetBulanIni}\n` +
      `Total HPP (Modal Barang Terjual),${ringkasan.hppBulanIni}\n` +
      `Laba Kotor,${ringkasan.labaKotorBulanIni}\n` +
      `Biaya Operasional,${ringkasan.totalBiayaOperasionalBulanIni}\n` +
      `Laba Bersih,${ringkasan.labaBersihBulanIni}\n` +
      `Margin Laba Bersih,${ringkasan.marginLabaBersihBulanIni}%\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_BisnisKita_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'operational':
        return 'Operasional Resto';
      case 'salary':
        return 'Gaji & Upah Karyawan';
      case 'rent':
        return 'Sewa Tempat / Kios';
      case 'utilities':
        return 'Listrik, Air & Gas';
      case 'delivery':
        return 'Ongkir / Logistik';
      case 'maintenance':
        return 'Perawatan Peralatan';
      default:
        return 'Lain-lain';
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Laporan Keuangan &amp; Laba Rugi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemisahan akurat antara HPP barang terjual, pembelian stok, dan beban biaya operasional.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportFinancialCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran Baru</span>
          </button>
        </div>
      </div>

      {/* P&L Breakdown Summary Card */}
      {financialData && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Ikhtisar Laba Rugi Periode Berjalan (Bulan Ini)
          </h3>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-sans font-semibold text-slate-800">1. Omzet Penjualan Bersih</span>
              <span className="font-bold text-slate-900 tabular-nums">
                Rp {financialData.ringkasan.omzetBulanIni.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600 pl-4">
              <span className="font-sans">Dikurangi: Harga Pokok Penjualan (HPP Bahan/Barang)</span>
              <span className="text-rose-700 tabular-nums">
                - Rp {financialData.ringkasan.hppBulanIni.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between py-2.5 bg-slate-50 px-3 rounded-lg font-bold text-slate-900">
              <span className="font-sans">= LABA KOTOR (Gross Profit)</span>
              <span className="text-emerald-800 tabular-nums">
                Rp {financialData.ringkasan.labaKotorBulanIni.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600 pl-4">
              <span className="font-sans">Dikurangi: Total Biaya Operasional (Listrik, Gaji, Sewa)</span>
              <span className="text-rose-700 tabular-nums">
                - Rp {financialData.ringkasan.totalBiayaOperasionalBulanIni.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between py-3 bg-emerald-50 px-4 rounded-xl font-bold text-sm text-emerald-950 border border-emerald-200">
              <div className="flex flex-col font-sans">
                <span>= ESTIMASI LABA BERSIH (Net Profit)</span>
                <span className="text-[11px] font-normal text-emerald-800">
                  Margin Bersih: {financialData.ringkasan.marginLabaBersihBulanIni}%
                </span>
              </div>
              <span className="font-mono tabular-nums text-base">
                Rp {financialData.ringkasan.labaBersihBulanIni.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Ledger Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Buku Pencatatan Biaya &amp; Pengeluaran</h3>
          <span className="text-xs text-slate-500 font-mono tabular-nums">{expenses.length} Catatan</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Nama / Keterangan Biaya</th>
                  <th className="px-4 py-3 text-right">Nominal Pengeluaran</th>
                  <th className="px-4 py-3">Dicatat Oleh</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Memuat daftar pengeluaran...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      Belum ada catatan biaya operasional.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono tabular-nums">
                        {new Date(exp.expenseDate).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-700">
                          {getCategoryLabel(exp.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{exp.title}</div>
                        {exp.notes && <div className="text-[11px] text-slate-400">{exp.notes}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-700 tabular-nums">
                        Rp {exp.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{exp.createdBy}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Catat Pengeluaran Operasional</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Kategori Beban Biaya</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="operational">Operasional Dapur / Warung</option>
                  <option value="salary">Gaji &amp; Uang Makan Karyawan</option>
                  <option value="rent">Sewa Tempat / Ruko / Kios</option>
                  <option value="utilities">Listrik PLN, Air PDAM &amp; Gas LPG</option>
                  <option value="delivery">Ongkos Kirim &amp; Ekspedisi</option>
                  <option value="maintenance">Perbaikan Alat &amp; Kebersihan</option>
                  <option value="other">Pengeluaran Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama / Keperluan Biaya <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Beli Tabung Gas 3kg x 2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Jumlah Nominal (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Keterangan Tambahan</label>
                <input
                  type="text"
                  placeholder="Catatan kwitansi atau bukti nota..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  Simpan Biaya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
