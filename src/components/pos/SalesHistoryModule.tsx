import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Sale } from '../../types/index.ts';
import { ReceiptModal } from './ReceiptModal.tsx';
import { Search, Printer, RotateCcw, AlertTriangle, Eye, CheckCircle2, X } from 'lucide-react';

export const SalesHistoryModule: React.FC = () => {
  const { business, user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  // Refund modal state
  const [saleToRefund, setSaleToRefund] = useState<Sale | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');
  const [restoreStock, setRestoreStock] = useState<boolean>(true);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSales = async () => {
    try {
      setIsLoading(true);
      let endpoint = '/pos/sales?';
      if (search) endpoint += `search=${encodeURIComponent(search)}&`;
      if (statusFilter !== 'all') endpoint += `status=${statusFilter}&`;
      const data = await api.get<Sale[]>(endpoint);
      setSales(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSales();
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleToRefund || !refundReason) return;

    try {
      setIsSubmittingRefund(true);
      setErrorMsg(null);
      await api.post(`/pos/sales/${saleToRefund.id}/refund`, {
        reason: refundReason,
        restoreStock,
      });
      setSaleToRefund(null);
      setRefundReason('');
      await fetchSales();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses refund');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const canRefund = user?.role === 'owner' || user?.role === 'supervisor';

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Riwayat Transaksi Penjualan</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Semua transaksi kasir tersimpan permanen dengan snapshot data historis.
          </p>
        </div>

        {/* Status segmented buttons */}
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'completed' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Selesai
          </button>
          <button
            onClick={() => setStatusFilter('refunded')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'refunded' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Refund
          </button>
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nomor invoice, nama pelanggan, atau nomor meja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
        >
          Cari
        </button>
      </form>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">No. Invoice</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Pelanggan / Meja</th>
                <th className="px-4 py-3">Item Pesanan</th>
                <th className="px-4 py-3">Metode</th>
                <th className="px-4 py-3 text-right">Total Akhir</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Memuat data transaksi...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 space-y-1">
                    <div className="font-medium text-slate-600">Tidak ada riwayat transaksi</div>
                    <div className="text-[11px] text-slate-400">Belum ada transaksi pada filter yang dipilih</div>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono tabular-nums">
                      {new Date(sale.createdAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="font-medium">{sale.customerName || 'Pelanggan'}</div>
                      <div className="text-[11px] text-slate-400">
                        {sale.tableNumber || (sale.orderType === 'takeaway' ? 'Bungkus' : 'Delivery')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="font-medium">{sale.items.length} Menu</span>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {sale.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="uppercase text-[10px] font-semibold tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono tabular-nums">
                      Rp {sale.finalAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[11px] font-medium ${
                          sale.status === 'completed'
                            ? 'text-emerald-700'
                            : 'text-rose-700 line-through'
                        }`}
                      >
                        {sale.status === 'completed' ? 'Selesai' : 'Direfund'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => setSelectedSaleForReceipt(sale)}
                        title="Lihat / Cetak Ulang Struk"
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {sale.status === 'completed' && canRefund && (
                        <button
                          onClick={() => setSaleToRefund(sale)}
                          title="Batalkan / Refund Transaksi"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
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

      {/* Refund Modal */}
      {saleToRefund && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Batalkan / Refund Transaksi</span>
              </div>
              <button onClick={() => setSaleToRefund(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg">
              <div>
                Invoice: <strong className="font-mono text-slate-900">{saleToRefund.invoiceNumber}</strong>
              </div>
              <div>
                Total Pengembalian:{' '}
                <strong className="font-mono text-slate-900">
                  Rp {saleToRefund.finalAmount.toLocaleString('id-ID')}
                </strong>
              </div>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Alasan Pembatalan / Refund <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pelanggan salah pesan / pesanan dibatalkan"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restoreStock}
                  onChange={(e) => setRestoreStock(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Kembalikan stok produk yang dibatalkan ke persediaan</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSaleToRefund(null)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm"
                >
                  {isSubmittingRefund ? 'Memproses...' : 'Konfirmasi Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Printable Receipt Modal */}
      {selectedSaleForReceipt && business && (
        <ReceiptModal
          sale={selectedSaleForReceipt}
          business={business}
          onClose={() => setSelectedSaleForReceipt(null)}
        />
      )}
    </div>
  );
};
