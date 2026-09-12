import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, Archive, CheckCircle2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  onConfirm,
  onCancel,
  theme = 'light'
}) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const variantStyles = {
    danger: {
      icon: Trash2,
      badgeBg: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
      btnBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
    },
    warning: {
      icon: AlertTriangle,
      badgeBg: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      btnBg: 'bg-[#C9A24B] hover:bg-[#b89139] text-black font-extrabold shadow-[#C9A24B]/20'
    },
    info: {
      icon: Archive,
      badgeBg: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
      btnBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
    },
    success: {
      icon: CheckCircle2,
      badgeBg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
    }
  };

  const style = variantStyles[variant] || variantStyles.danger;
  const IconComponent = style.icon;

  return createPortal(
    <div className={`fixed inset-0 z-[100] overflow-hidden backdrop-blur-sm p-3 sm:p-4 flex justify-center items-center animate-fade-in ${
      isDark ? 'bg-black/75' : 'bg-slate-900/35'
    }`}>
      <div className={`w-full max-w-md border rounded-2xl shadow-2xl overflow-hidden transition-all animate-fade-in-up my-auto ${
        isDark ? 'bg-[#181B20] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className={`p-4 px-5 border-b flex justify-between items-center shrink-0 ${
          isDark ? 'border-slate-800/80 bg-[#1F2229]' : 'border-slate-200/80 bg-slate-50/80'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${style.badgeBg}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-heading text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {title}
              </h3>
              <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Please confirm to proceed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200/70'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5">
          <p className={`text-xs sm:text-sm font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {message}
          </p>
        </div>

        {/* Fixed Footer */}
        <div className={`p-3.5 px-5 border-t flex justify-end items-center space-x-3 shrink-0 ${
          isDark ? 'border-slate-800 bg-[#1F2229]' : 'border-slate-200/80 bg-slate-50/80'
        }`}>
          <button
            type="button"
            onClick={onCancel}
            className={`py-2 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-200/60'
            }`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`py-2 px-5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer ${style.btnBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

