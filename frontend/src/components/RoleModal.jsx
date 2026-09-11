import React from 'react';
import { X, ShieldCheck, UserCheck, KeyRound, LogOut } from 'lucide-react';
import swagLogo from '../assets/swag.png';
import swagzzLogo from '../assets/swagzz.png';
import swagzzWhiteLogo from '../assets/swagzz_white.png';

export default function RoleModal({ isOpen, onClose, currentUser, onSelectUser, onLogout, theme }) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const demoUsers = [
    { name: 'Admin Director', username: 'admin', role: 'admin', desc: 'Full access to POS Billing, Products, Returns, Reports & Thermal Printer Settings' },
    { name: 'Store Manager', username: 'manager', role: 'manager', desc: 'Access to POS Billing, Products, Returns & Executive Reports' },
    { name: 'Cashier Staff', username: 'cashier', role: 'cashier', desc: 'Access to POS Billing & Product Returns' }
  ];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in-up ${
      isDark ? 'bg-black/75' : 'bg-slate-900/35'
    }`}>
      <div className={`rounded-2xl w-full max-w-md p-6 shadow-2xl border transition-colors ${
        isDark ? 'bg-[#1F2229] border-[#2A2E39] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className={`flex items-center justify-between pb-4 mb-4 border-b ${
          isDark ? 'border-[#2A2E39]' : 'border-slate-200'
        }`}>
          <div className="flex items-center space-x-2">
            <img src={isDark ? swagzzWhiteLogo : swagzzLogo} alt="Swagz Logo" className="h-9 w-auto object-contain" />
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]">
              STAFF ROLES
            </span>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDark ? 'text-gray-400 hover:text-white hover:bg-[#2A2E39]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {demoUsers.map((u) => {
            const isCurrent = currentUser?.role === u.role;
            return (
              <div
                key={u.username}
                onClick={() => {
                  onSelectUser(u);
                  onClose();
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-[#C9A24B]/15 border-[#C9A24B] shadow-md shadow-[#C9A24B]/10'
                    : isDark
                    ? 'bg-[#14161A] border-[#2A2E39] hover:border-gray-600 hover:bg-[#2A2E39]/40'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{u.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#C9A24B]/20 text-[#C9A24B] font-mono uppercase font-bold">
                      {u.role}
                    </span>
                  </div>
                  {isCurrent && <ShieldCheck className="w-5 h-5 text-[#C9A24B]" />}
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{u.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Log Out Action Button */}
        {onLogout && (
          <div className={`pt-4 mt-4 border-t ${isDark ? 'border-[#2A2E39]' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 font-bold text-xs hover:bg-red-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out & Lock Register</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
