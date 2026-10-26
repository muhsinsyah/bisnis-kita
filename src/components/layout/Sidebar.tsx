import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Calculator,
  ReceiptText,
  UtensilsCrossed,
  Boxes,
  PieChart,
  Users,
  Settings,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'sales'
  | 'menu'
  | 'inventory'
  | 'finances'
  | 'staff'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();

  const isOwner = user?.role === 'owner';
  const isSupervisor = user?.role === 'supervisor';
  const isCashier = user?.role === 'cashier';
  const isInventory = user?.role === 'inventory';

  const menuItems = [
    {
      id: 'pos' as ActiveTab,
      label: 'Kasir (POS)',
      icon: Calculator,
      visible: isOwner || isSupervisor || isCashier,
    },
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: isOwner || isSupervisor,
    },
    {
      id: 'sales' as ActiveTab,
      label: 'Riwayat Transaksi',
      icon: ReceiptText,
      visible: isOwner || isSupervisor || isCashier,
    },
    {
      id: 'menu' as ActiveTab,
      label: 'Menu & Produk',
      icon: UtensilsCrossed,
      visible: isOwner || isSupervisor,
    },
    {
      id: 'inventory' as ActiveTab,
      label: 'Stok & Resep BOM',
      icon: Boxes,
      visible: isOwner || isSupervisor || isInventory,
    },
    {
      id: 'finances' as ActiveTab,
      label: 'Keuangan & Laba Rugi',
      icon: PieChart,
      visible: isOwner || isSupervisor,
    },
    {
      id: 'staff' as ActiveTab,
      label: 'Kelola Staf',
      icon: Users,
      visible: isOwner,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Pengaturan Usaha',
      icon: Settings,
      visible: isOwner,
    },
  ];

  const visibleItems = menuItems.filter((item) => item.visible);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between shrink-0 min-h-[calc(100vh-65px)]">
      <div className="p-3.5 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu Navigasi
        </div>

        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 text-left ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Role & Persistence notice */}
      <div className="p-4 m-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-500">
        <div className="font-medium text-slate-800 mb-0.5">Sinkronisasi Cloud Aktif</div>
        <div className="text-[11px] leading-relaxed text-slate-500">
          Data tersimpan di server. Akses via laptop atau HP tanpa kehilangan data.
        </div>
      </div>
    </aside>
  );
};
