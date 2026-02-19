import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Search,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';

/**
 * Sidebar Navigation Component
 * Provides left-side navigation menu for the dashboard
 */
export function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutGrid,
      href: '/dashboard',
      badge: null,
    },
    {
      label: 'Search Businesses',
      icon: Search,
      href: '/dashboard/search',
      badge: null,
    },
    {
      label: 'My Leads',
      icon: FileText,
      href: '/dashboard/leads',
      badge: '0',
    },
    {
      label: 'Reports',
      icon: BarChart3,
      href: '/dashboard/reports',
      badge: null,
    },
    {
      label: 'Settings',
      icon: Settings,
      href: '/dashboard/settings',
      badge: null,
    },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white transform transition-transform duration-300 z-40 md:relative md:translate-x-0 md:z-20 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="h-16 border-b border-slate-800 flex items-center px-6 gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white">ClientMapr</h1>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-8 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-400 text-center">
            © 2026 ClientMapr. All rights reserved.
          </p>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default Sidebar;
