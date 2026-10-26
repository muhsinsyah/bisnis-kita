import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ActiveTab } from './Sidebar.tsx';
import {
  Calculator,
  LayoutDashboard,
  UtensilsCrossed,
  Boxes,
  PieChart,
  ReceiptText,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const isSupervisor = user?.role === 'supervisor';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-2 py-1 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onTabChange('pos')}
        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
          activeTab === 'pos' ? 'text-emerald-700 font-semibold' : 'text-slate-500'
        }`}
      >
        <Calculator className="w-5 h-5 mb-0.5" />
        <span>Kasir</span>
      </button>

      <button
        onClick={() => onTabChange('sales')}
        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
          activeTab === 'sales' ? 'text-emerald-700 font-semibold' : 'text-slate-500'
        }`}
      >
        <ReceiptText className="w-5 h-5 mb-0.5" />
        <span>Transaksi</span>
      </button>

      {(isOwner || isSupervisor) && (
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'dashboard' ? 'text-emerald-700 font-semibold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>
      )}

      <button
        onClick={() => onTabChange(isOwner || isSupervisor ? 'menu' : 'inventory')}
        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
          activeTab === 'menu' || activeTab === 'inventory' ? 'text-emerald-700 font-semibold' : 'text-slate-500'
        }`}
      >
        {isOwner || isSupervisor ? <UtensilsCrossed className="w-5 h-5 mb-0.5" /> : <Boxes className="w-5 h-5 mb-0.5" />}
        <span>{isOwner || isSupervisor ? 'Menu' : 'Stok'}</span>
      </button>

      {(isOwner || isSupervisor) && (
        <button
          onClick={() => onTabChange('finances')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'finances' ? 'text-emerald-700 font-semibold' : 'text-slate-500'
          }`}
        >
          <PieChart className="w-5 h-5 mb-0.5" />
          <span>Keuangan</span>
        </button>
      )}
    </nav>
  );
};
