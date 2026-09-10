import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, Sparkles, ShieldCheck, KeyRound, ArrowRight, Printer, Scissors, Users, BarChart3, CheckCircle2 } from 'lucide-react';
import swagLogo from '../assets/swag.png';
import swagzzLogo from '../assets/swagzz.png';
import swagzzWhiteLogo from '../assets/swagzz_white.png';
import loginBg from '../assets/menswear_login_bg.png';

export default function LoginView({ onLoginSuccess, theme }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const demoCredentials = [
    { label: 'Admin Director', role: 'ADMIN', user: 'admin', pass: 'admin123', icon: '👑', color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
    { label: 'Store Manager', role: 'MANAGER', user: 'manager', pass: 'manager123', icon: '🏬', color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
    { label: 'Cashier Staff', role: 'CASHIER', user: 'cashier', pass: 'cashier123', icon: '💳', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('swagz_user', JSON.stringify({
          name: data.name,
          username: data.username,
          role: data.role
        }));
        onLoginSuccess({
          name: data.name,
          username: data.username,
          role: data.role
        });
      } else {
        const err = await res.json();
        setErrorMessage(err.detail || 'Invalid username or password.');
      }
    } catch (e) {
      setErrorMessage('Unable to connect to server. Ensure FastAPI backend on port 8005 is active.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full bg-[#0C0E12] text-slate-100 flex flex-col justify-center items-center font-sans relative overflow-hidden select-none">
      
      {/* Ambient Radial Lighting Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#D49018]/15 via-amber-600/5 to-transparent blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-amber-500/10 via-yellow-600/5 to-transparent blur-[120px]"></div>
      </div>

      {/* Main Split-Screen Container */}
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* LEFT COLUMN: Luxury Showroom Hero Branding (7 Cols on Desktop) */}
        <div className="lg:col-span-7 relative flex flex-col justify-between p-8 lg:p-14 overflow-hidden border-r border-white/5">
          
          {/* Background Image with Dark Vignette Gradient */}
          <div className="absolute inset-0 z-0">
            <img
              src={loginBg}
              alt="Swagz Luxury Showroom"
              className="w-full h-full object-cover object-center scale-105 filter brightness-75 contrast-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0C0E12]/95 via-[#0C0E12]/75 to-[#0C0E12]/95"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0C0E12] via-transparent to-[#0C0E12]/80"></div>
          </div>

          {/* Top Bar: Store Status Pill */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md p-1 border border-amber-500/40 shadow-xl">
                <img src={swagLogo} alt="Swagz Emblem" className="w-full h-full object-contain rounded-full" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold tracking-widest text-[#D49018] uppercase block">
                  SWAGZ FASHION
                </span>
                <span className="text-xs text-gray-300 font-semibold block">
                  Haute Couture & Menswear POS
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold shadow-lg backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>FLAGSHIP STORE #04</span>
            </div>
          </div>

          {/* Center Showcase Headline & Feature Highlights */}
          <div className="relative z-10 my-auto py-12 space-y-8 max-w-xl">
            <div className="space-y-4">
              <img src={swagzzWhiteLogo} alt="Swagz Fashion Logo" className="h-14 object-contain animate-float" />
              <h1 className="text-3xl lg:text-4xl font-extrabold font-heading tracking-tight leading-tight text-white">
                Next-Gen Retail POS & Thermal Auto-Print Engine
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                Streamlined point-of-sale counter operations, barcode SKU matrix, master tailoring alterations tracking, and automated thermal receipt dispatch.
              </p>
            </div>

            {/* 4 Feature Badges Grid */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md space-y-1 hover:border-[#D49018]/40 transition-all">
                <div className="flex items-center space-x-2 text-[#D49018] font-bold text-xs">
                  <Printer className="w-4 h-4" />
                  <span>Port 9100 Auto-Print</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-tight">58mm & 80mm thermal receipt dispatch</p>
              </div>

              <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md space-y-1 hover:border-[#D49018]/40 transition-all">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                  <Scissors className="w-4 h-4" />
                  <span>Master Tailor Desk</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-tight">Trouser hem & fitting request tracking</p>
              </div>

              <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md space-y-1 hover:border-[#D49018]/40 transition-all">
                <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
                  <Users className="w-4 h-4" />
                  <span>VIP Loyalty Club</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-tight">Client points matrix & tier rewards</p>
              </div>

              <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md space-y-1 hover:border-[#D49018]/40 transition-all">
                <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
                  <BarChart3 className="w-4 h-4" />
                  <span>Executive Analytics</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-tight">Real-time revenue command & CSV reports</p>
              </div>
            </div>
          </div>

          {/* Left Footer */}
          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-white/10 pt-4">
            <span>© 2026 Swagz Fashion Retail Systems</span>
            <span className="text-[#D49018]">v2.8.4 Core Engine</span>
          </div>

        </div>

        {/* RIGHT COLUMN: Modern Glassmorphism Authentication Form (5 Cols on Desktop) */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center p-6 lg:p-12 bg-[#0C0E12] relative">
          
          <div className="w-full max-w-md space-y-8 animate-scale-in">
            
            {/* Card Header */}
            <div className="space-y-2 text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#D49018]/15 border border-[#D49018]/30 text-[#D49018] text-xs font-mono font-bold">
                <KeyRound className="w-3.5 h-3.5" />
                <span>STAFF AUTHENTICATION</span>
              </div>
              <h2 className="text-3xl font-extrabold font-heading text-white tracking-tight">
                Sign In to POS Counter
              </h2>
              <p className="text-xs text-gray-400 font-medium">
                Enter your cashier or manager credentials to open register
              </p>
            </div>

            {/* Error Notification Banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium font-mono animate-fade-in-up flex items-center space-x-2">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Input Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Username Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Username
                </label>
                <div className="relative flex items-center bg-[#16181E] border border-white/10 rounded-2xl px-4 py-3.5 focus-within:border-[#D49018] focus-within:ring-2 focus-within:ring-[#D49018]/20 transition-all shadow-inner">
                  <User className="w-4 h-4 text-[#D49018] mr-3 shrink-0" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter staff username (e.g. admin)"
                    className="w-full bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Password
                </label>
                <div className="relative flex items-center bg-[#16181E] border border-white/10 rounded-2xl px-4 py-3.5 focus-within:border-[#D49018] focus-within:ring-2 focus-within:ring-[#D49018]/20 transition-all shadow-inner">
                  <Lock className="w-4 h-4 text-[#D49018] mr-3 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D49018] via-[#FCD34D] to-[#B89139] hover:brightness-110 active:scale-[0.99] text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-[#D49018]/20 transition-all btn-interactive cursor-pointer flex items-center justify-between disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span className="font-extrabold mx-auto">Authenticating Staff Credentials...</span>
                ) : (
                  <>
                    <span className="font-black uppercase tracking-wider">Sign In to POS Counter</span>
                    <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                  </>
                )}
              </button>

            </form>

            {/* Quick Demo Credentials Cards (1-Click Auto Fill) */}
            <div className="pt-6 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-gray-400">
                <span>⚡ DEMO ROLE PRESETS</span>
                <span className="text-[10px] text-[#D49018]">1-CLICK AUTO FILL</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {demoCredentials.map((c) => {
                  const isSelected = username === c.user;
                  return (
                    <button
                      type="button"
                      key={c.user}
                      onClick={() => handleQuickLogin(c.user, c.pass)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between space-y-1 transition-all btn-interactive cursor-pointer ${
                        isSelected
                          ? 'bg-[#D49018]/20 border-[#D49018] shadow-lg shadow-[#D49018]/10'
                          : 'bg-[#16181E] border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{c.icon}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#D49018]" />}
                      </div>
                      <div>
                        <span className={`text-[11px] font-bold block leading-snug ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {c.label}
                        </span>
                        <span className="text-[9px] font-mono text-gray-400 block mt-0.5 uppercase">
                          {c.user}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Restricted Access Note */}
            <p className="text-[11px] text-center text-gray-500 font-mono">
              🔒 Strictly restricted to authorized store staff and managers.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}
