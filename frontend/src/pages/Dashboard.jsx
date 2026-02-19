import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/FormComponents';

/**
 * Dashboard page - The main application interface with sidebar navigation
 */
export function Dashboard() {
  const navigate = useNavigate();
  const { state, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="hidden md:block">
              <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <div className="hidden md:flex items-center gap-4 border-r border-slate-200 pr-6">
                <span className="text-sm text-slate-600">
                  Welcome, <strong>{state.user?.full_name || state.user?.fullName || 'User'}</strong>
                </span>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  {state.user?.subscription_tier || state.user?.subscriptionTier || 'free_trial'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <Settings className="w-5 h-5 text-slate-600" />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <User className="w-5 h-5 text-slate-600" />
                </button>
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
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">
                Welcome back!
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl">
                Find underserved businesses in your area. We scan every business listing and intelligently
                filter to show you only those without dedicated websites.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                {
                  label: 'Total Leads',
                  value: '0',
                  change: '+0% this month',
                  icon: '📊',
                  color: 'bg-blue-50 border-blue-200',
                },
                {
                  label: 'Searches',
                  value: '0',
                  change: 'Available',
                  icon: '🔍',
                  color: 'bg-green-50 border-green-200',
                },
                {
                  label: 'Exports',
                  value: '0',
                  change: 'Using 0% quota',
                  icon: '📁',
                  color: 'bg-purple-50 border-purple-200',
                },
                {
                  label: 'Account Status',
                  value: 'Active',
                  change: 'No issues',
                  icon: '✅',
                  color: 'bg-emerald-50 border-emerald-200',
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className={`${stat.color} rounded-xl border p-6 shadow-sm hover:shadow-md transition-all duration-200`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-600 font-medium mb-2">{stat.label}</p>
                      <p className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        {stat.change}
                        <ArrowUpRight className="w-3 h-3" />
                      </p>
                    </div>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Action Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Get Started</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Search for Businesses',
                    description:
                      'Find underserved businesses with no website. Scans thousands of local business listings.',
                    action: 'Start Searching',
                    icon: '🔍',
                  },
                  {
                    title: 'View Your Leads',
                    description:
                      "Access and manage all the qualified leads you've found. Export to Excel or CSV.",
                    action: 'View Leads',
                    icon: '📋',
                  },
                  {
                    title: 'Explore Analytics',
                    description:
                      'Get insights into your search history and lead generation performance.',
                    action: 'View Reports',
                    icon: '📈',
                  },
                  {
                    title: 'Account Settings',
                    description:
                      'Manage your profile, subscription, and preferences.',
                    action: 'Go to Settings',
                    icon: '⚙️',
                  },
                ].map((card, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-lg p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <span className="text-3xl">{card.icon}</span>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">{card.title}</h4>
                        <p className="text-sm text-slate-600">{card.description}</p>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors">
                      {card.action} →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Info */}
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl border border-blue-200 p-8">
              <div className="max-w-2xl">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Pro Tip</h3>
                <p className="text-slate-700 mb-4">
                  Use specific business categories and locations to find highly targeted leads. The AI-powered
                  filter ensures you only get businesses that truly lack an online presence.
                </p>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
