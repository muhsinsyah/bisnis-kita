import React from 'react';
import { Sale, Business } from '../../types/index.ts';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale;
  business: Business;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, business, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'dine_in':
        return 'Dine-In (Makan di Tempat)';
      case 'takeaway':
        return 'Bungkus (Takeaway)';
      case 'delivery':
        return 'Pesan Antar (Delivery)';
      default:
        return type;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Tunai (Cash)';
      case 'transfer':
        return 'Transfer Bank';
      case 'qris':
        return 'QRIS Dinamis';
      default:
        return method;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Transaksi Berhasil</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content Printable Area */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div
            id="printable-receipt"
            className="border border-dashed border-slate-300 rounded-xl p-5 bg-white font-mono text-xs text-slate-800 space-y-3"
          >
            {/* Business Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-200">
              <div className="font-bold text-sm tracking-wide text-slate-900 uppercase">
                {business.name}
              </div>
              {business.tagline && (
                <div className="text-[11px] text-slate-500 font-sans mt-0.5">{business.tagline}</div>
              )}
              {business.address && (
                <div className="text-[10px] text-slate-500 mt-1 whitespace-pre-line">{business.address}</div>
              )}
              {business.phone && (
                <div className="text-[10px] text-slate-500">Telp: {business.phone}</div>
              )}
            </div>

            {/* Transaction Info */}
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Invoice:</span>
                <span className="font-semibold text-slate-900">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu:</span>
                <span className="tabular-nums">
                  {new Date(sale.createdAt).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir:</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tipe Pesanan:</span>
                <span className="font-medium text-slate-900">
                  {getOrderTypeLabel(sale.orderType)}
                  {sale.tableNumber ? ` (${sale.tableNumber})` : ''}
                </span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Pelanggan:</span>
                  <span>{sale.customerName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="pt-2 border-t border-dashed border-slate-200 space-y-2">
              {sale.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-medium text-slate-900">
                    <span>
                      {item.productName}
                      {item.variantName ? ` - ${item.variantName}` : ''}
                    </span>
                    <span className="tabular-nums">{formatCurrency(item.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pl-2">
                    <span className="tabular-nums">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </span>
                    {item.notes && <span className="italic text-[10px] text-slate-400">({item.notes})</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations & Totals */}
            <div className="pt-2 border-t border-dashed border-slate-200 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="tabular-nums">{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon</span>
                  <span className="tabular-nums">- {formatCurrency(sale.discountAmount)}</span>
                </div>
              )}
              {sale.taxAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Pajak (PB1 {business.taxRate}%)</span>
                  <span className="tabular-nums">{formatCurrency(sale.taxAmount)}</span>
                </div>
              )}
              {sale.serviceFeeAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Biaya Layanan ({business.serviceFeeRate}%)</span>
                  <span className="tabular-nums">{formatCurrency(sale.serviceFeeAmount)}</span>
                </div>
              )}

              <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-sm text-slate-900">
                <span>TOTAL AKHIR</span>
                <span className="tabular-nums text-emerald-800">{formatCurrency(sale.finalAmount)}</span>
              </div>

              <div className="flex justify-between pt-1 text-[11px] text-slate-600">
                <span>Metode Bayar:</span>
                <span className="font-medium text-slate-900">{getPaymentLabel(sale.paymentMethod)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Uang Diterima:</span>
                <span className="tabular-nums">{formatCurrency(sale.amountPaid)}</span>
              </div>
              {sale.changeAmount > 0 && (
                <div className="flex justify-between text-[11px] font-semibold text-emerald-700">
                  <span>Kembalian:</span>
                  <span className="tabular-nums">{formatCurrency(sale.changeAmount)}</span>
                </div>
              )}
            </div>

            {/* Receipt Footer Message */}
            <div className="pt-3 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-500 font-sans whitespace-pre-line leading-relaxed">
              {business.receiptFooter || 'Terima kasih atas kunjungan Anda!\nSelamat Menikmati Hidangan Kami.'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk Kasir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
