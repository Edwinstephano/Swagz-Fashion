import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, Sparkles, ShieldCheck, KeyRound, ArrowRight, Printer, ShoppingBag, Package, RefreshCw, BarChart3, CheckCircle2, Sun, Moon } from 'lucide-react';
import swagLogo from '../assets/swag.png';
import swagzzLogo from '../assets/swagzz.png';
import swagzzWhiteLogo from '../assets/swagzz_white.png';
import loginBg from '../assets/menswear_login_bg.png';

export default function LoginView({ onLoginSuccess, theme, toggleTheme }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Login Centered Breathing Logo Splash Animation State
  const [isSuccessSplash, setIsSuccessSplash] = useState(false);

  const isDark = theme === 'dark';

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
        const userObj = {
          name: data.name,
          username: data.username,
          role: data.role
        };
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('swagz_user', JSON.stringify(userObj));
        
        setIsSuccessSplash(true);

        setTimeout(() => {
          onLoginSuccess(userObj);
        }, 1000);
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

  return (
    <div className={`min-h-screen w-full flex flex-col justify-center items-center font-sans relative overflow-hidden select-none transition-colors duration-300 ${
      isDark ? 'bg-[#0C0E12] text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      
      {/* Minimalist Centered Breathing Logo Animation Overlay */}
      {isSuccessSplash && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md select-none transition-all duration-300 animate-fade-in-up">
          
          {/* Centered Radial Gold Lighting Effect */}
          <div className="absolute w-72 h-72 rounded-full bg-[#D49018]/25 blur-3xl animate-pulse pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center space-y-4">
            
            {/* Swagz Emblem with Centered Breathing Scale Pulse Animation (Big -> Small -> Big) */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#D49018]/40 animate-ping duration-1000"></div>
              <div className="w-28 h-28 rounded-full bg-[#0C0E12]/90 p-3 border-2 border-[#D49018] shadow-2xl shadow-[#D49018]/40 animate-pulse flex items-center justify-center">
                <img
                  src={swagLogo}
                  alt="Swagz Emblem"
                  className="w-full h-full object-contain rounded-full animate-bounce"
                />
              </div>
            </div>

            {/* Swagz Brand Logo Text */}
            <img src={swagzzWhiteLogo} alt="Swagz Fashion" className="h-9 object-contain animate-pulse" />

          </div>
        </div>
      )}

      {/* Ambient Radial Lighting Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] ${
          isDark
            ? 'bg-gradient-to-br from-[#D49018]/15 via-amber-600/5 to-transparent'
            : 'bg-gradient-to-br from-[#D49018]/20 via-amber-400/10 to-transparent'
        }`}></div>
        <div className={`absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[120px] ${
          isDark
            ? 'bg-gradient-to-tl from-amber-500/10 via-yellow-600/5 to-transparent'
            : 'bg-gradient-to-tl from-amber-400/15 via-yellow-500/10 to-transparent'
        }`}></div>
      </div>

      {/* Main Split-Screen Container */}
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* LEFT COLUMN: Luxury Showroom Hero Branding (7 Cols on Desktop) */}
        <div className={`lg:col-span-7 relative flex flex-col justify-between p-8 lg:p-14 overflow-hidden border-r transition-colors duration-300 ${
          isDark ? 'border-white/10' : 'border-slate-300'
        }`}>
          
          {/* Background Image with Dark Vignette Gradient */}
          <div className="absolute inset-0 z-0">
            <img
              src={loginBg}
              alt="Swagz Luxury Showroom"
              className="w-full h-full object-cover object-center scale-105 filter brightness-75 contrast-110"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${
              isDark
                ? 'from-[#0C0E12]/95 via-[#0C0E12]/75 to-[#0C0E12]/95'
                : 'from-slate-950/90 via-slate-900/75 to-slate-950/90'
            }`}></div>
            <div className={`absolute inset-0 bg-gradient-to-t ${
              isDark
                ? 'from-[#0C0E12] via-transparent to-[#0C0E12]/80'
                : 'from-slate-950 via-transparent to-slate-950/80'
            }`}></div>
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
                Streamlined point-of-sale counter operations, barcode SKU matrix, garment returns processing, and automated thermal receipt dispatch.
              </p>
            </div>

            {/* 4 Feature Badges Grid - Actual Available System Features */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md space-y-1 hover:border-[#D49018]/40 transition-all">
                <div className="flex items-center space-x-2 text-[#D49018] font-bold text-xs">
                  <ShoppingBag className="w-4 h-4" />
                  <span>POS Counter & Billing</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-tight">Barcode search, cart parking & split payments</p>
              </div>

              <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md space-y-1 hover:border-[#D49018]/40 transition-all">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                  <Package className="w-4 h-4" />
                  <span>Product SKU Matrix</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-tight">Garment sizes, color variants & stock matrix</p>
              </div>

              <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md space-y-1 hover:border-[#D49018]/40 transition-all">
                <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
                  <RefreshCw className="w-4 h-4" />
                  <span>Returns & Exchanges</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-tight">Invoice garment returns & auto restock</p>
              </div>

              <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md space-y-1 hover:border-[#D49018]/40 transition-all">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                  <Printer className="w-4 h-4" />
                  <span>Port 9101 Auto-Print</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-tight">58mm & 80mm ESC/POS thermal dispatch</p>
              </div>
            </div>
          </div>

          {/* Left Footer */}
          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-white/10 pt-4">
            <span>© 2026 Swagz Fashion Retail Systems</span>
            <span className="text-[#D49018]">v2.8.4 Core Engine</span>
          </div>

        </div>

        {/* RIGHT COLUMN: Modern Authentication Form (5 Cols on Desktop) */}
        <div className={`lg:col-span-5 flex flex-col justify-center items-center p-6 lg:p-12 relative transition-colors duration-300 ${
          isDark ? 'bg-[#0C0E12]' : 'bg-white shadow-2xl'
        }`}>
          
          {/* Top Right Theme Toggle Control */}
          {toggleTheme && (
            <div className="absolute top-6 right-6 z-20">
              <button
                type="button"
                onClick={toggleTheme}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-bold font-mono transition-all btn-interactive cursor-pointer shadow-xs ${
                  isDark
                    ? 'border-white/15 bg-[#16181E] text-amber-400 hover:border-amber-500/50 hover:bg-[#1A1D24]'
                    : 'border-slate-300 bg-slate-100 text-slate-700 hover:border-amber-500/50 hover:bg-slate-200'
                }`}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px] uppercase tracking-wider">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-700" />
                    <span className="text-[11px] uppercase tracking-wider">Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="w-full max-w-md space-y-8 animate-scale-in">
            
            {/* Card Header */}
            <div className="space-y-2 text-left">
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                isDark
                  ? 'bg-[#D49018]/15 border-[#D49018]/30 text-[#D49018]'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}>
                <KeyRound className="w-3.5 h-3.5" />
                <span>STAFF AUTHENTICATION</span>
              </div>
              <h2 className={`text-3xl font-extrabold font-heading tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Sign In to POS Counter
              </h2>
              <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
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
                <label className={`block text-xs font-bold uppercase tracking-wider font-mono ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Username
                </label>
                <div className={`relative flex items-center border rounded-2xl px-4 py-3.5 focus-within:border-[#D49018] focus-within:ring-2 focus-within:ring-[#D49018]/20 transition-all shadow-inner ${
                  isDark ? 'bg-[#16181E] border-white/10' : 'bg-slate-50 border-slate-300 focus-within:bg-white'
                }`}>
                  <User className="w-4 h-4 text-[#D49018] mr-3 shrink-0" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter staff username (e.g. admin)"
                    className={`w-full bg-transparent text-sm font-semibold focus:outline-none ${
                      isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold uppercase tracking-wider font-mono ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Password
                </label>
                <div className={`relative flex items-center border rounded-2xl px-4 py-3.5 focus-within:border-[#D49018] focus-within:ring-2 focus-within:ring-[#D49018]/20 transition-all shadow-inner ${
                  isDark ? 'bg-[#16181E] border-white/10' : 'bg-slate-50 border-slate-300 focus-within:bg-white'
                }`}>
                  <Lock className="w-4 h-4 text-[#D49018] mr-3 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className={`w-full bg-transparent text-sm font-semibold focus:outline-none font-mono ${
                      isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`p-1 transition-colors cursor-pointer ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide shadow-xl transition-all btn-interactive cursor-pointer flex items-center justify-between disabled:opacity-50 mt-2 ${
                  isDark
                    ? 'bg-gradient-to-r from-[#D49018] via-[#FCD34D] to-[#B89139] hover:brightness-110 text-slate-950 shadow-[#D49018]/20'
                    : 'bg-gradient-to-r from-[#D49018] via-[#F59E0B] to-[#B89139] hover:brightness-105 text-white shadow-amber-500/25'
                }`}
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

            {/* Restricted Access Note */}
            <p className={`text-[11px] text-center font-mono ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
              🔒 Strictly restricted to authorized store staff and managers.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}
