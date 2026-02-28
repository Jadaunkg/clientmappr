import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Button } from './FormComponents';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/search': 'Search Businesses',
  '/leads': 'My Leads',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userName = state.user?.full_name || state.user?.fullName || 'User';
  const userTier = state.user?.subscription_tier || state.user?.subscriptionTier || 'free_trial';
  const pageTitle = PAGE_TITLES[location.pathname] || 'ClientMapr';

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col md:ml-0">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-slate-900 ml-12 md:ml-0">{pageTitle}</h1>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-sm text-slate-600">
                  {userName}
                </span>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  {userTier}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;