import React, { useState } from 'react';
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

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in-up ${
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
          <div className="space-y-5 animate-fade-in-up py-2">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/10">
                <AlertTriangle className="w-7 h-7 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Sign Out & Lock Register?
                </h3>
                <p className={`text-xs leading-relaxed max-w-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                  Are you sure you want to end active counter session for <strong className="text-[#D49018]">@{currentUser?.username || 'user'}</strong>?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-medium leading-normal flex items-start space-x-2">
              <span className="shrink-0">⚠️</span>
              <span>You will need to re-enter your username and password to log back into the POS counter.</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmLogout(false)}
                className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#2A2E39] border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowConfirmLogout(false);
                  onLogout();
                }}
                className="py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Confirm Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* REGULAR PROFILE STEP */
          <div className="space-y-4">
            {/* Current Active Account Card */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#14161A] border-[#2A2E39]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#D49018]/20 border border-[#D49018]/40 text-[#D49018] font-bold text-sm flex items-center justify-center uppercase shrink-0">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {currentUser?.name || 'Store Staff'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#C9A24B]/20 text-[#C9A24B] font-mono uppercase font-bold">
                      {currentUser?.role || 'CASHIER'}
                    </span>
                  </div>
                  <span className={`text-xs font-mono block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    @{currentUser?.username || 'user'}
                  </span>
                </div>
              </div>

              <div className={`pt-3 border-t text-xs ${isDark ? 'border-[#2A2E39] text-gray-400' : 'border-slate-200 text-slate-600'}`}>
                <div className="flex items-center space-x-1.5 font-semibold text-[#D49018] mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Assigned Permissions</span>
                </div>
                <p className="leading-relaxed">{roleDesc}</p>
              </div>
            </div>

            {/* Log Out Action Button */}
            {onLogout && (
              <div className={`pt-4 border-t ${isDark ? 'border-[#2A2E39]' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowConfirmLogout(true)}
                  className="w-full py-3 px-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 font-bold text-xs hover:bg-red-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out & Lock Register</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
