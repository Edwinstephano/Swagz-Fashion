import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, LogOut, AlertTriangle, ArrowLeft } from 'lucide-react';
import swagzzLogo from '../assets/swagzz.png';
import swagzzWhiteLogo from '../assets/swagzz_white.png';

export default function RoleModal({ isOpen, onClose, currentUser, onLogout, theme }) {
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const roleDescriptions = {
    admin: 'Full access to POS Billing, Products, Returns, Reports & Thermal Printer Settings',
    manager: 'Access to POS Billing, Products, Returns & Executive Reports',
    cashier: 'Access to POS Billing & Product Returns'
  };

  const userRole = (currentUser?.role || 'cashier').toLowerCase();
  const roleDesc = roleDescriptions[userRole] || roleDescriptions.cashier;

  const handleClose = () => {
    setShowConfirmLogout(false);
    onClose();
  };

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all animate-fade-in backdrop-blur-sm ${
      isDark ? 'bg-black/75' : 'bg-slate-900/35'
    }`}>
      <div className={`rounded-2xl w-full max-w-md p-6 shadow-2xl border transition-colors ${
        isDark ? 'bg-[#1F2229] border-[#2A2E39] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 mb-4 border-b ${
          isDark ? 'border-[#2A2E39]' : 'border-slate-200'
        }`}>
          <div className="flex items-center space-x-2">
            <img src={isDark ? swagzzWhiteLogo : swagzzLogo} alt="Swagz Logo" className="h-9 w-auto object-contain" />
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
              showConfirmLogout
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]'
            }`}>
              {showConfirmLogout ? 'CONFIRM SIGN OUT' : 'STAFF PROFILE'}
            </span>
          </div>
          <button onClick={handleClose} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDark ? 'text-gray-400 hover:text-white hover:bg-[#2A2E39]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOGOUT CONFIRMATION STEP */}
        {showConfirmLogout ? (
          <div className="py-2 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 mx-auto text-rose-500">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className={`font-heading text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Sign Out of Swagz POS?
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                You will be redirected to the lock screen. Any active unsaved cart will remain intact.
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setShowConfirmLogout(false)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                  isDark
                    ? 'border-gray-700 text-gray-300 hover:bg-[#2A2E39]'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                onClick={() => {
                  handleClose();
                  onLogout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* REGULAR PROFILE STEP */
          <div className="space-y-4">
            {/* User Info Card */}
            <div className={`p-4 rounded-xl border flex items-center space-x-3 ${
              isDark ? 'bg-[#14161A] border-[#2A2E39]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#C9A24B] to-[#E6CA65] flex items-center justify-center text-slate-950 font-bold text-lg font-heading shadow-md shrink-0">
                {(currentUser?.name || currentUser?.full_name || 'U').charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {currentUser?.name || currentUser?.full_name || 'Staff User'}
                </h4>
                <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  @{currentUser?.username || 'user'}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-md font-mono font-bold uppercase tracking-wider ${
                userRole === 'admin'
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : userRole === 'manager'
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}>
                {userRole}
              </span>
            </div>

            {/* Permissions Overview */}
            <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              isDark ? 'bg-[#14161A]/60 border-[#2A2E39]' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-center space-x-1.5 font-bold text-[#C9A24B]">
                <ShieldCheck className="w-4 h-4" />
                <span>Role Permissions</span>
              </div>
              <p className={`leading-relaxed text-[11px] ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                {roleDesc}
              </p>
            </div>

            {/* Logout Action Trigger */}
            <div className="pt-2">
              <button
                onClick={() => setShowConfirmLogout(true)}
                className="w-full py-3 px-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 font-bold text-xs hover:bg-red-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out & Lock Register</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
