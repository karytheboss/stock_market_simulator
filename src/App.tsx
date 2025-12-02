import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardPage } from './components/DashboardPage';
import { TradePage } from './components/TradePage';
import { PortfolioPage } from './components/PortfolioPage';
import { HistoryPage } from './components/HistoryPage';
import { WeeklyReportPage } from './components/WeeklyReportPage';
import { AdminDashboard } from './components/AdminDashboard';
import { Toaster } from './components/ui/sonner';

type AppView = 'landing' | 'login' | 'admin-login' | 'dashboard';
type DashboardPage = 'dashboard' | 'trade' | 'portfolio' | 'history' | 'report' | 'admin';

function AppContent() {
  const { user, isAdmin } = useAuth();
  const [view, setView] = useState<AppView>('landing');
  const [currentPage, setCurrentPage] = useState<DashboardPage>('dashboard');

  if (user && (view === 'landing' || view === 'login' || view === 'admin-login')) {
    setView('dashboard');
  }

  if (!user && view === 'dashboard') {
    setView('landing');
  }

  if (view === 'landing') {
    return (
      <LandingPage
        onEnterSimulation={() => setView('login')}
        onAdminLogin={() => setView('admin-login')}
      />
    );
  }

  if (view === 'login') {
    return (
      <LoginPage
        onBack={() => setView('landing')}
        isAdminMode={false}
      />
    );
  }

  if (view === 'admin-login') {
    return (
      <LoginPage
        onBack={() => setView('landing')}
        isAdminMode={true}
      />
    );
  }

  if (view === 'dashboard' && user) {
    return (
      <DashboardLayout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      >
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'trade' && <TradePage />}
        {currentPage === 'portfolio' && <PortfolioPage />}
        {currentPage === 'history' && <HistoryPage />}
        {currentPage === 'report' && <WeeklyReportPage />}
        {currentPage === 'admin' && isAdmin && <AdminDashboard />}
      </DashboardLayout>
    );
  }

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}
