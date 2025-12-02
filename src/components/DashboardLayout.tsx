import React from 'react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, TrendingUp, Briefcase, History, FileText, Shield } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: 'dashboard' | 'trade' | 'portfolio' | 'history' | 'report' | 'admin';
  onNavigate: (page: 'dashboard' | 'trade' | 'portfolio' | 'history' | 'report' | 'admin') => void;
}

export function DashboardLayout({ children, currentPage, onNavigate }: DashboardLayoutProps) {
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
    { id: 'trade' as const, label: 'Trade', icon: TrendingUp },
    { id: 'portfolio' as const, label: 'Portfolio', icon: Briefcase },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'report' as const, label: 'Weekly Report', icon: FileText },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin' as const, label: 'Admin', icon: Shield });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl text-gray-900">Market Simulator</h1>
            <p className="text-sm text-gray-500">Welcome, {user?.username}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Balance</p>
              <p className="text-gray-900">₹{user?.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Risk Index</p>
              <p className="text-gray-900">{user?.riskIndex.toFixed(3)}</p>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="size-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4 space-y-2">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => onNavigate(item.id)}
                  >
                    <Icon className="size-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
