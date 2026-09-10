import React from 'react';
import { X, ShieldCheck, UserCheck, KeyRound, LogOut } from 'lucide-react';
import swagLogo from '../assets/swag.png';
import swagzzLogo from '../assets/swagzz.png';
import swagzzWhiteLogo from '../assets/swagzz_white.png';

export default function RoleModal({ isOpen, onClose, currentUser, onSelectUser, onLogout }) {
  if (!isOpen) return null;

  const demoUsers = [
    { name: 'Admin Director', username: 'admin', role: 'admin', desc: 'Full access to Products, Uploads, Reports, Printer Setup & System Settings' },
    { name: 'Store Manager', username: 'manager', role: 'manager', desc: 'Access to Products, Stock Ledger, Reports & Billing' },
    { name: 'Cashier Staff', username: 'cashier', role: 'cashier', desc: 'Access to POS Billing, Parked Carts, Alterations & Returns' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1F2229] border border-[#2A2E39] rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2A2E39] pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <img src={swagzzWhiteLogo} alt="Swagz Logo" className="h-7 object-contain" />
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]">
              ROLES
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#2A2E39]">
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
                    ? 'bg-[#C9A24B]/10 border-[#C9A24B] shadow-md shadow-[#C9A24B]/10'
                    : 'bg-[#14161A] border-[#2A2E39] hover:border-gray-600 hover:bg-[#2A2E39]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{u.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#C9A24B]/20 text-[#C9A24B] font-mono uppercase">
                      {u.role}
                    </span>
                  </div>
                  {isCurrent && <ShieldCheck className="w-5 h-5 text-[#C9A24B]" />}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{u.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Log Out Action Button */}
        {onLogout && (
          <div className="pt-4 mt-4 border-t border-[#2A2E39]">
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-xs hover:bg-red-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
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
