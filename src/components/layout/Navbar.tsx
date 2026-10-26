import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { LogOut, UserCircle, Store, Shield } from 'lucide-react';

interface NavbarProps {
  onOpenCashSession: () => void;
  openSessionExists: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCashSession, openSessionExists }) => {
  const { user, business, logout } = useAuth();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Pemilik Usaha';
      case 'supervisor':
        return 'Supervisor';
      case 'cashier':
        return 'Kasir';
      case 'inventory':
        return 'Staf Gudang';
      default:
        return role;
    }
  };

  return (
    <header className="flex items-center justify-between gap-8 px-4 md:px-6 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-30">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          BK
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
            Bisnis Kita
          </span>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            POS &amp; Manajemen Kuliner
          </span>
        </div>
      </div>

      {/* Zone 2: Business & Tenant Context */}
      <div className="hidden md:flex items-center gap-2 text-sm text-slate-600 truncate">
        <Store className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="font-semibold text-slate-900 truncate">
          {business?.name || 'Ruang Usaha'}
        </span>
        <span className="text-slate-300">·</span>
        <span className="text-xs text-slate-500 truncate">
          {business?.address || 'Kasir Cloud Aktif'}
        </span>
      </div>

      {/* Zone 3: Cash Drawer Action & Profile Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Cash Register Drawer Indicator & Trigger */}
        <button
          onClick={onOpenCashSession}
          title="Buka / Tutup Sesi Kasir & Mutasi Kas Laci"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
            openSessionExists
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <span>Shift:</span>
          <span className="font-semibold">{openSessionExists ? 'Terbuka' : 'Tutup'}</span>
        </button>

        {/* User Role Tag & Logout */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-900 leading-tight">
              {user?.fullName}
            </span>
            <span className="text-[11px] text-slate-500">
              {user ? getRoleLabel(user.role) : ''}
            </span>
          </div>

          <button
            onClick={logout}
            title="Keluar dari akun"
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
