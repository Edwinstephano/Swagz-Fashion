import React, { useState, useEffect } from 'react';
import { ShoppingBag, Package, RefreshCw, BarChart3, Printer, Sun, Moon, Scissors, Users, ShieldAlert } from 'lucide-react';
import swagLogo from '../assets/swag.png';
import swagzzLogo from '../assets/swagzz.png';
import swagzzWhiteLogo from '../assets/swagzz_white.png';

export default function Navbar({ activeTab, setActiveTab, currentUser, onOpenRoleModal, theme, toggleTheme }) {
  const [printAgentConnected, setPrintAgentConnected] = useState(false);

  useEffect(() => {
    const checkAgent = async () => {
      try {
        const res = await fetch('http://127.0.0.1:9101/latest-receipt');
        setPrintAgentConnected(res.ok);
      } catch (e) {
        setPrintAgentConnected(false);
      }
    };
    checkAgent();
    const interval = setInterval(checkAgent, 5000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'pos', label: 'POS Billing', icon: ShoppingBag, roles: ['admin', 'manager', 'cashier'] },
    { id: 'products', label: 'Products', icon: Package, roles: ['admin', 'manager'] },
    { id: 'returns', label: 'Returns', icon: RefreshCw, roles: ['admin', 'manager', 'cashier'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { id: 'printers', label: 'Settings', icon: Printer, roles: ['admin'] },
  ];

  const userRole = (currentUser?.role || 'cashier').toLowerCase();
  const visibleNavItems = navItems.filter(item => item.roles.includes(userRole));

  const isDark = theme === 'dark';

  const getRoleBadgeStyle = () => {
    if (userRole === 'admin') return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    if (userRole === 'manager') return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  };

  return (
    <header className={`px-5 py-2 border-b shadow-2xs sticky top-0 z-40 transition-colors ${
      isDark ? 'bg-[#181B20] border-slate-800 text-slate-100' : 'bg-white border-slate-200/90 text-slate-800'
    }`}>
      <div className="flex items-center justify-between max-w-[1550px] mx-auto">
        
        {/* Brand Logo */}
        <div className="flex items-center cursor-pointer group shrink-0 py-0.5" onClick={() => setActiveTab('pos')}>
          <img
            src={isDark ? swagzzWhiteLogo : swagzzLogo}
            alt="Swagz Fashion"
            className="h-14 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </div>

        {/* Center Navigation Tabs (Filtered by Role Permissions) */}
        <nav className="flex items-center space-x-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border btn-interactive cursor-pointer ${
                  isActive
                    ? 'bg-[#D49018] text-white border-[#D49018] shadow-xs'
                    : isDark
                    ? 'bg-[#1F2229] border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
              isDark
                ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* 9101 READY Gold Status Pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]">
            <span className={`w-2 h-2 rounded-full ${printAgentConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span>⚡ 9101 READY</span>
          </div>

          {/* Cashier / Staff Profile Badge */}
          <button
            onClick={onOpenRoleModal}
            className={`flex items-center space-x-2 pl-1 pr-3 py-1 rounded-full border text-xs transition-all cursor-pointer ${
              isDark
                ? 'border-slate-700 bg-[#1F2229] hover:bg-slate-800 text-slate-200'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Click to View Staff Profile or Logout"
          >
            <div className="w-6 h-6 rounded-full bg-[#FEF3C7] text-[#D97706] font-bold text-xs flex items-center justify-center uppercase">
              {currentUser?.name?.charAt(0) || 'S'}
            </div>
            <div className="text-left leading-none">
              <span className={`font-bold block text-[11px] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {currentUser?.name || 'Staff User'}
              </span>
              <span className="text-[9px] uppercase font-mono font-bold block mt-0.5 text-[#D49018]">
                {currentUser?.role || 'cashier'}
              </span>
            </div>
          </button>
        </div>

      </div>
    </header>
  );
}
