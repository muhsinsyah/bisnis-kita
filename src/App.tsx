import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Sidebar, ActiveTab } from './components/layout/Sidebar.tsx';
import { BottomNav } from './components/layout/BottomNav.tsx';
import { AuthScreen } from './components/auth/AuthScreen.tsx';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal.tsx';
import { DashboardModule } from './components/dashboard/DashboardModule.tsx';
import { PosModule } from './components/pos/PosModule.tsx';
import { SalesHistoryModule } from './components/pos/SalesHistoryModule.tsx';
import { MenuModule } from './components/menu/MenuModule.tsx';
import { InventoryModule } from './components/inventory/InventoryModule.tsx';
import { FinancesModule } from './components/finances/FinancesModule.tsx';
import { StaffModule } from './components/staff/StaffModule.tsx';
import { SettingsModule } from './components/settings/SettingsModule.tsx';
import { CashSessionModal } from './components/pos/CashSessionModal.tsx';
import { api } from './services/api.ts';
import { CashSession } from './types/index.ts';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isCashSessionModalOpen, setIsCashSessionModalOpen] = useState(false);
  const [openSessionExists, setOpenSessionExists] = useState(false);

  // Check current open session status for Navbar badge
  const checkCashSession = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get<CashSession | null>('/cash-sessions/current');
      setOpenSessionExists(!!res);
    } catch {
      setOpenSessionExists(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkCashSession();
      // Set initial tab based on role
      if (user?.role === 'cashier') {
        setActiveTab('pos');
      } else if (user?.role === 'inventory') {
        setActiveTab('inventory');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [isAuthenticated, user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-lg animate-pulse">
            BK
          </div>
          <span className="text-sm font-medium text-slate-300">Memuat Bisnis Kita...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16 md:pb-0">
      {/* Top Bar adhering to Top Bar Contract */}
      <Navbar
        onOpenCashSession={() => setIsCashSessionModalOpen(true)}
        openSessionExists={openSessionExists}
      />

      {/* Main Layout: Sidebar + Viewport */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardModule />}
          {activeTab === 'pos' && <PosModule />}
          {activeTab === 'sales' && <SalesHistoryModule />}
          {activeTab === 'menu' && <MenuModule />}
          {activeTab === 'inventory' && <InventoryModule />}
          {activeTab === 'finances' && <FinancesModule />}
          {activeTab === 'staff' && <StaffModule />}
          {activeTab === 'settings' && <SettingsModule />}
        </main>
      </div>

      {/* Mobile Touch Bottom Nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Cash Drawer Shift Modal */}
      {isCashSessionModalOpen && (
        <CashSessionModal
          onClose={() => setIsCashSessionModalOpen(false)}
          onSessionUpdated={checkCashSession}
        />
      )}

      {/* Mandatory Change Password for First Login Staff */}
      <ChangePasswordModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
