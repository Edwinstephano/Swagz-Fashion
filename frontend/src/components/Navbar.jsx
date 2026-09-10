import React, { useState, useEffect } from 'react';
import { ShoppingBag, Package, RefreshCw, BarChart3, Printer, Sun, Moon, Scissors, Users } from 'lucide-react';
import swagLogo from '../assets/swag.png';
import swagzzLogo from '../assets/swagzz.png';
import swagzzWhiteLogo from '../assets/swagzz_white.png';

export default function Navbar({ activeTab, setActiveTab, currentUser, onOpenRoleModal, theme, toggleTheme }) {
  const [printAgentConnected, setPrintAgentConnected] = useState(false);

  useEffect(() => {
    const checkAgent = async () => {
      try {
        const res = await fetch('http://127.0.0.1:9100/latest-receipt');
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
    { id: 'alterations', label: 'Alterations', icon: Scissors, roles: ['admin', 'manager', 'cashier'] },
    { id: 'customers', label: 'VIP Clients', icon: Users, roles: ['admin', 'manager', 'cashier'] },
    { id: 'returns', label: 'Returns', icon: RefreshCw, roles: ['admin', 'manager', 'cashier'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { id: 'printers', label: 'Settings', icon: Printer, roles: ['admin'] },
  ];

  const isDark = theme === 'dark';

  return (
    <header className={`px-5 py-2 border-b shadow-2xs sticky top-0 z-40 transition-colors ${
      isDark ? 'bg-[#181B20] border-slate-800 text-slate-100' : 'bg-white border-slate-200/90 text-slate-800'
    }`}>
      <div className="flex items-center justify-between max-w-[1550px] mx-auto">
        
        {/* Brand Logo & Store Subtext */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('pos')}>
          <div className="h-9 transition-transform group-hover:scale-105 flex items-center">
            <img
              src={isDark ? swagzzWhiteLogo : swagzzLogo}
              alt="Swagz Fashion"
              className="h-8 object-contain"
            />
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]">
            POS
          </span>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAllowed = item.roles.includes(currentUser?.role || 'cashier');

            return (
              <button
                key={item.id}
                onClick={() => isAllowed && setActiveTab(item.id)}
                disabled={!isAllowed}
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
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
              isDark
                ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* 9100 READY Gold Status Pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>⚡ 9100 READY</span>
          </div>

          {/* Cashier Profile Badge */}
          <button
            onClick={onOpenRoleModal}
            className={`flex items-center space-x-2 pl-1 pr-3 py-1 rounded-full border text-xs transition-all ${
              isDark
                ? 'border-slate-700 bg-[#1F2229] hover:bg-slate-800 text-slate-200'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-[#FEF3C7] text-[#D97706] font-bold text-xs flex items-center justify-center uppercase">
              {currentUser?.name?.charAt(0) || 'A'}
            </div>
            <div className="text-left leading-none">
              <span className={`font-bold block text-[11px] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {currentUser?.name || 'Admin Director'}
              </span>
              <span className={`text-[9px] uppercase font-mono font-semibold block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                REGISTER #02
              </span>
            </div>
          </button>
        </div>

      </div>
    </header>
  );
}
