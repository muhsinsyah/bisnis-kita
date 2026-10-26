import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { CashSession } from '../../types/index.ts';
import { X, ArrowDownRight, ArrowUpRight, Lock, Unlock, DollarSign } from 'lucide-react';

interface CashSessionModalProps {
  onClose: () => void;
  onSessionUpdated: () => void;
}

export const CashSessionModal: React.FC<CashSessionModalProps> = ({ onClose, onSessionUpdated }) => {
  const [session, setSession] = useState<CashSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Forms
  const [initialCashInput, setInitialCashInput] = useState<string>('200000');
  const [openNotes, setOpenNotes] = useState<string>('Shift Kasir');

  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');

  // Cash movement form
  const [movementType, setMovementType] = useState<'cash_in' | 'cash_out'>('cash_in');
  const [movementAmount, setMovementAmount] = useState<string>('');
  const [movementReason, setMovementReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSession = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<CashSession | null>('/cash-sessions/current');
      setSession(res);
      if (res) {
        setActualCashInput(res.expectedCash.toString());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await api.post('/cash-sessions/open', {
        initialCash: Number(initialCashInput) || 0,
        notes: openNotes,
      });
      await fetchSession();
      onSessionUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await api.post('/cash-sessions/close', {
        actualCash: Number(actualCashInput) || 0,
        notes: closeNotes,
      });
      await fetchSession();
      onSessionUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementAmount || !movementReason) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await api.post('/cash-sessions/movement', {
        type: movementType,
        amount: Number(movementAmount),
        reason: movementReason,
      });
      setMovementAmount('');
      setMovementReason('');
      await fetchSession();
      onSessionUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm">Manajemen Kas Laci &amp; Shift Kasir</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-sm text-slate-500">Memuat status kasir...</div>
          ) : session ? (
            /* Open Session Details & Actions */
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <Unlock className="w-4 h-4 text-emerald-600" />
                    <span>Sesi Kasir Sedang Aktif</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Dibuka: {new Date(session.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <div className="text-[11px] text-slate-500">Kasir Bertugas</div>
                    <div className="font-semibold text-xs text-slate-900">{session.cashierName}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Modal Awal Laci</div>
                    <div className="font-semibold text-xs text-slate-900 tabular-nums">
                      Rp {session.initialCash.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Perkiraan Uang Kas Saat Ini:</span>
                  <span className="text-base font-bold text-emerald-800 tabular-nums">
                    Rp {session.expectedCash.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Cash In / Out Movement */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="text-xs font-semibold text-slate-900">Mutasi Uang Tunai Laci (Kas Masuk / Keluar)</div>
                <form onSubmit={handleAddMovement} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMovementType('cash_in')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        movementType === 'cash_in'
                          ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>Kas Masuk</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementType('cash_out')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        movementType === 'cash_out'
                          ? 'bg-rose-600 text-white border-rose-600 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Kas Keluar</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Nominal (Rp)"
                      value={movementAmount}
                      onChange={(e) => setMovementAmount(e.target.value)}
                      className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Alasan (contoh: beli es batu)"
                      value={movementReason}
                      onChange={(e) => setMovementReason(e.target.value)}
                      className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Simpan Mutasi Kas
                  </button>
                </form>
              </div>

              {/* Close Shift Form */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Tutup Shift &amp; Rekonsiliasi Kas Laci</span>
                </div>
                <form onSubmit={handleCloseSession} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Hitungan Uang Fisik di Laci (Rp)
                    </label>
                    <input
                      type="number"
                      value={actualCashInput}
                      onChange={(e) => setActualCashInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                      required
                    />
                  </div>

                  {actualCashInput && (
                    <div className="text-[11px] flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500">Selisih Kas:</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          Number(actualCashInput) - session.expectedCash === 0
                            ? 'text-emerald-700'
                            : Number(actualCashInput) - session.expectedCash > 0
                            ? 'text-blue-700'
                            : 'text-rose-700'
                        }`}
                      >
                        Rp {(Number(actualCashInput) - session.expectedCash).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Catatan penutupan shift (opsional)"
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    Tutup Shift Sekarang
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Open New Session Form */
            <form onSubmit={handleOpenSession} className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-xs font-semibold text-slate-800">Membuka Sesi Kasir Baru</div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Masukkan jumlah modal kembalian awal yang ditaruh di laci sebelum memulai melayani transaksi.
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Modal Awal Kembalian (Rp)
                </label>
                <input
                  type="number"
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Catatan Shift
                </label>
                <input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                Buka Sesi Shift Kasir
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
