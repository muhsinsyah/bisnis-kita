import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Percent,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  Receipt,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const DashboardModule: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get<any>('/finances/overview');
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const formatIDR = (val: number) => {
    return `Rp ${(val || 0).toLocaleString('id-ID')}`;
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-slate-200 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-72 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center py-16 space-y-3">
        <div className="text-rose-600 font-semibold text-sm">Gagal memuat data dashboard</div>
        <div className="text-xs text-slate-500">{error || 'Data tidak tersedia'}</div>
        <button
          onClick={fetchOverview}
          className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { ringkasan, produkTerlaris, stokMenipis, trendHarian, metodePembayaran } = data;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header and Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Dashboard Bisnis</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis omzet, biaya, laba bersih, dan arus operasional secara real-time.
          </p>
        </div>
        <button
          onClick={fetchOverview}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* KPI Cards Strip - Single level elevation, crisp typography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omzet Hari Ini */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Omzet Hari Ini</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {formatIDR(ringkasan.omzetHariIni)}
          </div>
          <div className="text-[11px] text-slate-500">
            <span>{ringkasan.totalTransaksiHariIni} transaksi</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span>Laba kotor: {formatIDR(ringkasan.labaKotorHariIni)}</span>
          </div>
        </div>

        {/* Omzet Bulan Ini */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Omzet Bulan Ini</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {formatIDR(ringkasan.omzetBulanIni)}
          </div>
          <div className="text-[11px] text-slate-500">
            <span>Total {ringkasan.totalTransaksiBulanIni} transaksi</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span>Rata-rata: {formatIDR(ringkasan.rataRataNilaiTransaksi)}</span>
          </div>
        </div>

        {/* Estimasi Laba Bersih Bulan Ini */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Laba Bersih Bulan Ini</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-800 font-mono tabular-nums">
            {formatIDR(ringkasan.labaBersihBulanIni)}
          </div>
          <div className="text-[11px] text-slate-500">
            <span>Biaya Ops: {formatIDR(ringkasan.totalBiayaOperasionalBulanIni)}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span>HPP: {formatIDR(ringkasan.hppBulanIni)}</span>
          </div>
        </div>

        {/* Margin Laba Bersih */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Margin Laba Bersih</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {ringkasan.marginLabaBersihBulanIni}%
          </div>
          <div className="text-[11px] text-slate-500">
            <span>Dihitung dari (Laba Bersih ÷ Omzet)</span>
          </div>
        </div>
      </div>

      {/* Main Trend Chart: 7-Day Revenue & Net Profit */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tren Penjualan &amp; Laba Bersih (7 Hari Terakhir)</h3>
            <p className="text-[11px] text-slate-500">
              Perbandingan omzet kotor harian terhadap laba bersih setelah HPP dan biaya operasional.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span className="text-slate-600 font-medium">Omzet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
              <span className="text-slate-600 font-medium">Laba Bersih</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendHarian} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLaba" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `Rp ${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, '']}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
              />
              <Area type="monotone" dataKey="omzet" name="Omzet" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorOmzet)" />
              <Area type="monotone" dataKey="labaBersih" name="Laba Bersih" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorLaba)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Best Sellers & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top 5 Best Selling Products */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">5 Menu Terlaris</h3>
            </div>
            <span className="text-xs text-slate-400">Berdasarkan Volume Penjualan</span>
          </div>

          <div className="divide-y divide-slate-100">
            {produkTerlaris && produkTerlaris.length > 0 ? (
              produkTerlaris.map((item: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                      {item.quantity} Terjual
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {formatIDR(item.revenue)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">Belum ada data penjualan tercatat</div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">Peringatan Stok Menipis</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {stokMenipis?.length || 0} Item
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {stokMenipis && stokMenipis.length > 0 ? (
              stokMenipis.map((item: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{item.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Tipe: {item.type === 'ingredient' ? 'Bahan Mentah' : 'Produk Jadi'} · Batas Min: {item.minStock} {item.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-700 font-mono tabular-nums bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      Sisa: {item.currentStock} {item.unit}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-emerald-700 font-medium">
                Semua persediaan produk dan bahan baku dalam batas aman.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Channel Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Proporsi Metode Pembayaran (Bulan Ini)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="text-slate-500">Tunai (Cash)</div>
            <div className="font-bold text-slate-900 font-mono tabular-nums">
              {formatIDR(metodePembayaran?.cash || 0)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="text-slate-500">QRIS Dinamis</div>
            <div className="font-bold text-slate-900 font-mono tabular-nums">
              {formatIDR(metodePembayaran?.qris || 0)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="text-slate-500">Transfer Bank</div>
            <div className="font-bold text-slate-900 font-mono tabular-nums">
              {formatIDR(metodePembayaran?.transfer || 0)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="text-slate-500">Metode Lainnya</div>
            <div className="font-bold text-slate-900 font-mono tabular-nums">
              {formatIDR(metodePembayaran?.other || 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
