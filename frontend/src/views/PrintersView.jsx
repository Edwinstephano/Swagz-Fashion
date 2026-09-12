import React, { useState, useEffect } from 'react';
import { Printer, RefreshCw, Send, CheckCircle2, AlertCircle, Settings, Store, Plus, Save, Check, X, Shield, FileText, Type, Users, UserPlus, Trash2, KeyRound } from 'lucide-react';
import swagLogo from '../assets/swag.png';
import swagzzLogo from '../assets/swagzz.png';
import swagzzWhiteLogo from '../assets/swagzz_white.png';
import ConfirmModal from '../components/ConfirmModal';

export const AVAILABLE_FONTS = [
  { name: 'Merriweather', category: 'Serif / Editorial (Requested)' },
  { name: 'Plus Jakarta Sans', category: 'Sans-Serif (Recommended)' },
  { name: 'Inter', category: 'Sans-Serif (Recommended)' },
  { name: 'Outfit', category: 'Sans-Serif' },
  { name: 'Poppins', category: 'Sans-Serif' },
  { name: 'Roboto', category: 'Sans-Serif' },
  { name: 'Open Sans', category: 'Sans-Serif' },
  { name: 'Montserrat', category: 'Sans-Serif' },
  { name: 'Lato', category: 'Sans-Serif' },
  { name: 'Oswald', category: 'Display' },
  { name: 'Raleway', category: 'Sans-Serif' },
  { name: 'Nunito', category: 'Sans-Serif' },
  { name: 'Ubuntu', category: 'Sans-Serif' },
  { name: 'Rubik', category: 'Sans-Serif' },
  { name: 'Work Sans', category: 'Sans-Serif' },
  { name: 'Quicksand', category: 'Sans-Serif' },
  { name: 'DM Sans', category: 'Sans-Serif' },
  { name: 'Fira Sans', category: 'Sans-Serif' },
  { name: 'Cabin', category: 'Sans-Serif' },
  { name: 'Josefin Sans', category: 'Display' },
  { name: 'Syne', category: 'Display' },
  { name: 'Space Grotesk', category: 'Display' },
  { name: 'Urbanist', category: 'Sans-Serif' },
  { name: 'Manrope', category: 'Sans-Serif' },
  { name: 'Lexend', category: 'Sans-Serif' },
  { name: 'Barlow', category: 'Sans-Serif' },
  { name: 'Sora', category: 'Sans-Serif' },
  { name: 'Red Hat Display', category: 'Display' },
  { name: 'Figtree', category: 'Sans-Serif' },
  { name: 'Playfair Display', category: 'Serif / Luxury' },
  { name: 'Lora', category: 'Serif / Luxury' },
  { name: 'Cinzel', category: 'Serif / Luxury' },
  { name: 'Cormorant Garamond', category: 'Serif / Luxury' },
  { name: 'Bodoni Moda', category: 'Serif / Luxury' },
  { name: 'EB Garamond', category: 'Serif / Luxury' },
  { name: 'Prata', category: 'Serif / Luxury' },
  { name: 'Fraunces', category: 'Serif / Luxury' },
  { name: 'Bitter', category: 'Serif / Slab' },
  { name: 'DM Serif Display', category: 'Serif / Luxury' },
  { name: 'Spectral', category: 'Serif / Luxury' },
  { name: 'Arvo', category: 'Serif / Slab' },
  { name: 'Zilla Slab', category: 'Serif / Slab' },
  { name: 'Abril Fatface', category: 'Serif / Display' },
  { name: 'Baskervville', category: 'Serif / Luxury' },
  { name: 'JetBrains Mono', category: 'Monospace' },
  { name: 'Fira Code', category: 'Monospace' },
  { name: 'Roboto Mono', category: 'Monospace' },
  { name: 'Space Mono', category: 'Monospace' },
  { name: 'Inconsolata', category: 'Monospace' },
  { name: 'Source Code Pro', category: 'Monospace' },
  { name: 'IBM Plex Mono', category: 'Monospace' },
  { name: 'Courier Prime', category: 'Monospace' },
  { name: 'Ubuntu Mono', category: 'Monospace' },
  { name: 'Share Tech Mono', category: 'Monospace' },
  { name: 'PT Sans', category: 'Sans-Serif' },
  { name: 'PT Serif', category: 'Serif' }
];

export const loadGoogleFont = (fontName) => {
  if (!fontName) return;
  const safeId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(safeId)) return;
  const link = document.createElement('link');
  link.id = safeId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap`;
  document.head.appendChild(link);
};

export default function PrintersView({ currentUser, theme }) {
  const isDark = theme === 'dark';
  const userRole = (currentUser?.role || localStorage.getItem('role') || 'cashier').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const canCreateUsers = isAdmin || isManager;

  const [printers, setPrinters] = useState([]);
  const [printJobs, setPrintJobs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'cashier' });
  
  const [settings, setSettings] = useState({
    shop_name: 'SWAGZ FASHION — MENSWEAR',
    address: '74 Luxury Boulevard, Tailor District, New Delhi - 110001',
    phone: '+91 98765 43210',
    gstin: '07SWAGZ9999F1Z9',
    receipt_footer: 'Thank you for shopping at Swagz! Menswear items once sold can be exchanged within 7 days with original tag & invoice.',
    categories: 'Shirts, Jeans, Suits, Ethnic, T-Shirts, Accessories, Footwear',
    available_sizes: 'S, M, L, XL, XXL, 38, 40, 42, 44',
    heading_font: 'Plus Jakarta Sans',
    body_font: 'Inter'
  });

  const [virtualReceiptHtml, setVirtualReceiptHtml] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showAddPrinterModal, setShowAddPrinterModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const [newPrinter, setNewPrinter] = useState({
    name: 'Counter Printer #2',
    connection_type: 'usb',
    ip_address: '',
    port: 9100,
    device_path: '/dev/usb/lp1',
    paper_width_mm: 80,
    is_default: false
  });

  const applyFontConfig = (h, b) => {
    const headingFont = h || 'Plus Jakarta Sans';
    const bodyFont = b || 'Inter';
    loadGoogleFont(headingFont);
    loadGoogleFont(bodyFont);
    document.documentElement.style.setProperty('--font-heading', `'${headingFont}', sans-serif`);
    document.documentElement.style.setProperty('--font-body', `'${bodyFont}', sans-serif`);
    localStorage.setItem('swagz_heading_font', headingFont);
    localStorage.setItem('swagz_body_font', bodyFont);
  };

  useEffect(() => {
    fetchPrinters();
    fetchPrintJobs();
    fetchSettings();
    fetchUsers();
    fetchLatestVirtualReceipt();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsersList(await res.json());
      }
    } catch (e) {}
  };

  const fetchPrinters = async () => {
    try {
      const res = await fetch('/api/printers');
      if (res.ok) setPrinters(await res.json());
    } catch (e) { }
  };

  const fetchPrintJobs = async () => {
    try {
      const res = await fetch('/api/printers/jobs');
      if (res.ok) {
        const jobs = await res.json();
        setPrintJobs(jobs.slice(0, 3));
      }
    } catch (e) { }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        applyFontConfig(data.heading_font, data.body_font);
      }
    } catch (e) { }
  };



  const fetchLatestVirtualReceipt = async () => {
    try {
      const res = await fetch('http://127.0.0.1:9101/latest-receipt');
      if (res.ok) {
        const data = await res.json();
        if (data.html) setVirtualReceiptHtml(data.html);
      }
    } catch (e) { }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        applyFontConfig(updated.heading_font, updated.body_font);
        setStatusMessage({ type: 'success', text: 'Shop typography, branding & catalog settings saved successfully!' });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to update shop settings.' });
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Error connecting to server.' });
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleTestPrint = async (printerId) => {
    setStatusMessage({ type: 'info', text: 'Sending test print payload to Print Agent (port 9101)...' });
    try {
      const res = await fetch(`/api/printers/${printerId}/test-print`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setStatusMessage({ type: 'success', text: `⚡ Test Print Sent Successfully! ${data.message}` });
          fetchLatestVirtualReceipt();
          fetchPrintJobs();
        } else {
          setStatusMessage({ type: 'error', text: `⚠️ Print Agent: ${data.error || 'Test print failed'}` });
        }
      } else {
        setStatusMessage({ type: 'error', text: '⚠️ Test print request failed.' });
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: '❌ Could not connect to local Print Agent. Make sure print_agent service is running.' });
    }
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleAddPrinter = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/printers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPrinter)
      });
      if (res.ok) {
        setShowAddPrinterModal(false);
        fetchPrinters();
        setStatusMessage({ type: 'success', text: `Printer '${newPrinter.name}' added successfully!` });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to add printer.' });
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Error adding printer.' });
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setShowAddUserModal(false);
        setNewUser({ name: '', username: '', password: '', role: 'cashier' });
        fetchUsers();
        setStatusMessage({ type: 'success', text: `User account '${newUser.username}' created successfully!` });
      } else {
        const err = await res.json();
        setStatusMessage({ type: 'error', text: err.detail || 'Failed to create user account.' });
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Error connecting to server.' });
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleDeleteUser = (userId, username) => {
    setConfirmModalConfig({
      title: 'Delete Staff User Account',
      message: `Are you sure you want to delete user account '@${username}'? They will no longer be able to log in to the POS system.`,
      confirmText: 'Delete User Account',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModalConfig(null);
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/auth/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            fetchUsers();
            setStatusMessage({ type: 'success', text: `User account '${username}' deleted successfully.` });
          } else {
            const err = await res.json();
            setStatusMessage({ type: 'error', text: err.detail || 'Failed to delete user.' });
          }
        } catch (e) {
          setStatusMessage({ type: 'error', text: 'Error deleting user.' });
        }
        setTimeout(() => setStatusMessage(null), 4000);
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${isDark ? 'bg-[#1E222A] border-[#2E3440] shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
        <div className="flex items-center space-x-3.5">
          <img src={swagLogo} alt="Swagz Logo" className="w-12 h-12 rounded-full bg-white p-0.5 border-2 border-[#C9A24B] shrink-0" />
          <div>
            <h2 className={`font-heading text-2xl font-bold flex items-center space-x-2.5 ${isDark ? 'text-white' : 'text-slate-900'
              }`}>
              <span>System Settings & Staff Administration</span>
            </h2>
            <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Manage staff user accounts, configure USB/LAN receipt printers, update shop branding & global typography.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddPrinterModal(true)}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-sm cursor-pointer ${isDark
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Thermal Printer</span>
          </button>
        </div>
      </div>

      {/* Notification / Toast alert */}
      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs font-mono font-bold border flex items-center space-x-2 transition-all ${statusMessage.type === 'success'
            ? (isDark ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-900')
            : statusMessage.type === 'error'
              ? (isDark ? 'bg-rose-950/40 border-rose-500/50 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-900')
              : (isDark ? 'bg-amber-950/40 border-amber-500/50 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-900')
          }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Grid: 2 Columns on Left, 1 Column on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Printers & Settings Form */}
        <div className="lg:col-span-2 space-y-6">

          {/* Configured Printers Card */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#1E222A] border-[#2E3440] shadow-lg' : 'bg-white border-slate-200 shadow-sm'
            }`}>
            <div className="flex justify-between items-center">
              <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Printer className="w-5 h-5 text-[#C9A24B]" />
                <span>Configured Thermal Printers</span>
              </h3>
              <span className={`text-xs font-mono px-2.5 py-1 rounded-full font-semibold ${isDark ? 'bg-slate-800 text-gray-300' : 'bg-slate-100 text-slate-700'
                }`}>
                {printers.length} Installed
              </span>
            </div>

            <div className="space-y-3">
              {printers.length === 0 ? (
                <div className={`p-6 text-center text-xs rounded-xl border border-dashed ${isDark ? 'border-gray-700 text-gray-400' : 'border-slate-300 text-slate-500'}`}>
                  No thermal printers configured yet. Click "Add Thermal Printer" above to configure one.
                </div>
              ) : (
                printers.map(p => (
                  <div key={p.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all ${isDark ? 'bg-[#15181E] border-[#2E3440]' : 'bg-slate-50 border-slate-200'
                    }`}>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.name}</span>
                        {p.is_default && (
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${isDark ? 'bg-[#C9A24B]/20 text-[#C9A24B] border border-[#C9A24B]/30' : 'bg-slate-900 text-white'
                            }`}>
                            Default
                          </span>
                        )}
                      </div>
                      <div className={`text-xs font-mono mt-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                        Type: <span className="font-semibold uppercase">{p.connection_type}</span> | Device: <span className="font-semibold">{p.device_path || p.ip_address || 'USB Auto'}</span> | Width: <span className="font-bold text-[#C9A24B]">{p.paper_width_mm}mm</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTestPrint(p.id)}
                      className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-all ${isDark
                          ? 'bg-[#C9A24B] text-slate-950 hover:bg-[#b89139]'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>⚡ Test Thermal Print</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Shop & Invoice Branding Settings Form */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#1E222A] border-[#2E3440] shadow-lg' : 'bg-white border-slate-200 shadow-sm'
            }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-slate-700/60' : 'border-slate-200'}`}>
              <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Store className="w-5 h-5 text-[#C9A24B]" />
                <span>Shop & Invoice Header Branding</span>
              </h3>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    Shop Title / Brand Name
                  </label>
                  <input
                    type="text"
                    value={settings.shop_name}
                    onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    GSTIN Tax ID Number
                  </label>
                  <input
                    type="text"
                    value={settings.gstin}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    Store Address Line
                  </label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    Store Support Contact Phone
                  </label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                  Receipt Thermal Footer Message & Policy
                </label>
                <textarea
                  rows={2}
                  value={settings.receipt_footer}
                  onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  required
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className={`py-2.5 px-5 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-sm transition-all ${isDark
                      ? 'bg-[#C9A24B] text-slate-950 hover:bg-[#b89139]'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingSettings ? 'Saving Settings...' : 'Save Branding Settings'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Recent Print Jobs Audit Table */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#1E222A] border-[#2E3440] shadow-lg' : 'bg-white border-slate-200 shadow-sm'
            }`}>
            <div className="flex justify-between items-center">
              <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <FileText className="w-5 h-5 text-[#C9A24B]" />
                <span>Print Jobs Audit Trail</span>
              </h3>
              <button onClick={fetchPrintJobs} className={`text-xs font-semibold flex items-center space-x-1 ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Log</span>
              </button>
            </div>

            <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <table className="w-full text-left text-xs">
                <thead className={`font-mono border-b ${isDark ? 'bg-[#15181E] text-gray-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200 font-bold'
                  }`}>
                  <tr>
                    <th className="p-3">Job ID</th>
                    <th className="p-3">Bill ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-gray-200' : 'divide-slate-200 text-slate-800'}`}>
                  {printJobs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-xs text-slate-500">No thermal print logs recorded yet.</td>
                    </tr>
                  ) : (
                    printJobs.slice(0, 3).map(job => (
                      <tr key={job.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                        <td className="p-3 font-mono font-semibold">#JOB-{job.id}</td>
                        <td className="p-3 font-mono font-bold">Bill #{job.bill_id}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${job.status === 'success'
                              ? isDark ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isDark ? 'bg-amber-950/60 text-amber-300 border border-amber-700' : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className={`p-3 font-mono ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{new Date(job.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Realistic Live Thermal Receipt Preview */}
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#1E222A] border-[#2E3440] shadow-lg' : 'bg-white border-slate-200 shadow-sm'
          }`}>
          <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-slate-700/60' : 'border-slate-200'}`}>
            <h3 className={`font-heading text-base font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Printer className="w-4 h-4 text-[#C9A24B]" />
              <span>Live Thermal Receipt Preview</span>
            </h3>
            <button onClick={fetchLatestVirtualReceipt} className={`text-xs font-semibold flex items-center space-x-1 ${isDark ? 'text-[#C9A24B] hover:text-amber-400' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>
          </div>

          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Live ESC/POS 80mm thermal receipt buffer output rendered in real-time.
          </p>

          {/* Physical Thermal Paper Styled Container */}
          <div className={`p-4 rounded-xl border flex justify-center overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'}`}>
            <div className="w-full max-w-[340px] bg-[#FFFDF7] text-slate-950 font-mono text-[11px] leading-relaxed p-4 rounded-xs shadow-md border border-slate-300 space-y-4 relative overflow-hidden">

              {/* Receipt Header Paper Edge Notch styling */}
              <div className="text-center space-y-1.5 border-b border-dashed border-slate-400 pb-3.5">
                <img
                  src={swagzzWhiteLogo}
                  alt="Swagz Logo"
                  className="h-14 w-auto max-w-[180px] mx-auto object-contain brightness-0 my-1.5"
                />
                <div className="font-extrabold text-sm uppercase tracking-wide">{settings.shop_name}</div>
                <div className="text-[10px] text-slate-700">{settings.address}</div>
                <div className="text-[10px] text-slate-700 font-bold">Ph: {settings.phone}</div>
              </div>

              {/* Sample / Live Receipt Content */}
              {virtualReceiptHtml ? (
                <div
                  className="py-1 receipt-html-container text-slate-950 font-mono text-[11px] w-full overflow-hidden [&>div]:max-w-full [&>div]:w-full [&>div]:box-border [&>div]:p-1 [&>div]:shadow-none [&>div]:border-none"
                  dangerouslySetInnerHTML={{ __html: virtualReceiptHtml }}
                />
              ) : (
                <div className="space-y-4 py-1">
                  <div className="flex justify-between text-[10px] font-bold border-b border-dashed border-slate-300 pb-2">
                    <span>INVOICE: #SWZ-2026-101</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>

                  <div className="space-y-2 py-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>1x Signature Linen Shirt (L)</span>
                      <span>₹2,499.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>1x Slim Chino Trousers (32)</span>
                      <span>₹1,899.00</span>
                    </div>
                  </div>

                  <div className="border-t border-b border-dashed border-slate-400 py-3 space-y-1.5 my-2">
                    <div className="flex justify-between text-slate-700">
                      <span>Subtotal:</span>
                      <span className="font-bold text-slate-900">₹4,398.00</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Discount:</span>
                      <span>-₹200.00</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>GST (5%):</span>
                      <span className="font-bold text-slate-900">₹209.90</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-xs text-slate-950 pt-2 border-t border-slate-400">
                      <span>NET TOTAL:</span>
                      <span>₹4,407.90</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-700 pt-1">
                      <span>Paid via UPI / Cash:</span>
                      <span>₹4,407.90</span>
                    </div>
                  </div>

                  <div className="text-center text-[9px] text-slate-600 pt-2 leading-relaxed italic">
                    {settings.receipt_footer}
                  </div>
                </div>
              )}

              <div className="text-center text-[10px] text-slate-400 border-t border-dashed border-slate-300 pt-3">
                ⚡ Auto-prints via Print Agent (Port 9101)
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Dynamic Product Catalog & Variant Options Card (Full Width at Bottom) */}
      <div className={`p-5 rounded-2xl border space-y-4 ${
        isDark ? 'bg-[#1E222A] border-[#2E3440] shadow-lg' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3 ${isDark ? 'border-slate-700/60' : 'border-slate-200'}`}>
          <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Settings className="w-5 h-5 text-[#C9A24B]" />
            <span>Dynamic Product Catalog & Variant Options</span>
          </h3>
          <span className="text-xs font-mono font-semibold text-slate-400">
            Configures Add Product Modal & POS Options
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
              Product Categories (Comma separated):
            </label>
            <input
              type="text"
              value={settings.categories || ''}
              onChange={(e) => setSettings({ ...settings, categories: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
              placeholder="Shirts, Jeans, Suits, Ethnic, T-Shirts, Accessories, Footwear"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                Garment Sizes Master List (Comma separated):
              </label>
              <input
                type="text"
                value={settings.available_sizes || ''}
                onChange={(e) => setSettings({ ...settings, available_sizes: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                  isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                placeholder="S, M, L, XL, XXL, 38, 40, 42, 44"
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                Color Variants Master List (Comma separated):
              </label>
              <input
                type="text"
                value={settings.available_colors || ''}
                onChange={(e) => setSettings({ ...settings, available_colors: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                  isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                placeholder="White, Navy Blue, Black, Olive, Maroon, Beige"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className={`py-2.5 px-6 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-sm transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#C9A24B] text-slate-950 hover:bg-[#b89139]' 
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Saving Master Options...' : 'Save Product Master Options'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* System Typography & Global Font Configuration (Full Width Card at Bottom) */}
      <div className={`p-5 rounded-2xl border space-y-4 ${
        isDark ? 'bg-[#1E222A] border-[#2E3440] shadow-lg' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3 ${
          isDark ? 'border-slate-700/60' : 'border-slate-200'
        }`}>
          <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Type className="w-5 h-5 text-[#C9A24B]" />
            <span>System Typography & Global Font Configuration</span>
          </h3>
          <span className="text-xs font-mono font-semibold text-slate-400">
            Applies default heading and body fonts across all POS views & reports
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Heading Font Picker */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              isDark ? 'bg-[#15181E] border-slate-800' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <label className={`block text-xs font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                Heading Font Family (Applies to Titles & Headers):
              </label>
              <select
                value={settings.heading_font || 'Plus Jakarta Sans'}
                onChange={(e) => {
                  const newH = e.target.value;
                  setSettings({ ...settings, heading_font: newH });
                  applyFontConfig(newH, settings.body_font);
                }}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C9A24B] cursor-pointer ${
                  isDark ? 'bg-[#1E222A] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {AVAILABLE_FONTS.map(f => (
                  <option key={f.name} value={f.name}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 font-medium">Used for top headers, scorecard titles, and card headers.</p>
            </div>

            {/* Body Font Picker */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              isDark ? 'bg-[#15181E] border-slate-800' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <label className={`block text-xs font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                Body & Text Font Family (Applies to Tables & Normal Text):
              </label>
              <select
                value={settings.body_font || 'Inter'}
                onChange={(e) => {
                  const newB = e.target.value;
                  setSettings({ ...settings, body_font: newB });
                  applyFontConfig(settings.heading_font, newB);
                }}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C9A24B] cursor-pointer ${
                  isDark ? 'bg-[#1E222A] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {AVAILABLE_FONTS.map(f => (
                  <option key={f.name} value={f.name}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 font-medium">Used for numbers, tables, invoice item lines, and body text.</p>
            </div>

          </div>

          {/* Live Typography Preview Box */}
          <div className={`p-4 rounded-xl border space-y-1.5 ${
            isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50/70 border-amber-200'
          }`}>
            <div className={`text-[11px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Live Font Preview</div>
            <div className={`font-heading text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              SWAGZ FASHION — Executive Sales & Business Intelligence
            </div>
            <div className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Total Net Revenue: ₹4,82,500.00 • Completed Invoices: 326 orders • Gross Margin: 51.3%
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSavingSettings}
              className={`py-2.5 px-6 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-sm transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#C9A24B] text-slate-950 hover:bg-[#b89139]' 
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Saving Typography...' : 'Save Typography & Font Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Staff Accounts & User Registry Card (Full Width at Bottom of Page) */}
      <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#1E222A] border-[#2E3440] shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
        <div className="flex justify-between items-center">
          <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Users className="w-5 h-5 text-[#D49018]" />
            <span>Staff Accounts & User Registry</span>
          </h3>
          {canCreateUsers && (
            <button
              onClick={() => {
                setNewUser({ name: '', username: '', password: '', role: 'cashier' });
                setShowAddUserModal(true);
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#D49018]/15 border border-[#D49018]/40 text-[#D49018] hover:bg-[#D49018]/25 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New User</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {usersList.length === 0 ? (
            <div className={`p-6 text-center text-xs rounded-xl border border-dashed ${isDark ? 'border-gray-700 text-gray-400' : 'border-slate-300 text-slate-500'}`}>
              No staff users found. Click "New User" to create staff accounts.
            </div>
          ) : (
            usersList.map(u => {
              const isSelf = currentUser?.username === u.username;
              const roleBadgeColor =
                u.role === 'admin'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : u.role === 'manager'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
              return (
                <div key={u.id} className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${isDark ? 'bg-[#15181E] border-[#2E3440]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-[#D49018]/20 text-[#D49018] font-bold text-xs flex items-center justify-center uppercase border border-[#D49018]/40 shrink-0">
                      {u.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{u.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold border ${roleBadgeColor}`}>
                          {u.role}
                        </span>
                        {isSelf && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-slate-700 text-slate-300">YOU</span>
                        )}
                      </div>
                      <span className={`text-xs font-mono block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                        @{u.username}
                      </span>
                    </div>
                  </div>

                  {!isSelf && (isAdmin || (isManager && u.role === 'cashier')) && (
                    <button
                      onClick={() => handleDeleteUser(u.id, u.username)}
                      className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Delete User Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>


      {/* Add Thermal Printer Modal */}
      {showAddPrinterModal && (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50 ${
          isDark ? 'bg-black/75' : 'bg-slate-900/35'
        }`}>
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${isDark ? 'bg-[#1E222A] border-[#2E3440] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <h3 className="font-heading font-bold text-lg flex items-center space-x-2">
                <Printer className="w-5 h-5 text-[#C9A24B]" />
                <span>Add Thermal Printer</span>
              </h3>
              <button onClick={() => setShowAddPrinterModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPrinter} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block mb-1">Printer Display Name</label>
                <input
                  type="text"
                  value={newPrinter.name}
                  onChange={(e) => setNewPrinter({ ...newPrinter, name: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-[#15181E] border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Connection Type</label>
                  <select
                    value={newPrinter.connection_type}
                    onChange={(e) => setNewPrinter({ ...newPrinter, connection_type: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-[#15181E] border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  >
                    <option value="usb">USB Thermal</option>
                    <option value="network">Network IP / Ethernet</option>
                    <option value="serial">Serial / COM</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Paper Roll Width</label>
                  <select
                    value={newPrinter.paper_width_mm}
                    onChange={(e) => setNewPrinter({ ...newPrinter, paper_width_mm: parseInt(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-[#15181E] border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  >
                    <option value={80}>80mm (Standard POS)</option>
                    <option value={58}>58mm (Mini Thermal)</option>
                  </select>
                </div>
              </div>

              {newPrinter.connection_type === 'usb' ? (
                <div>
                  <label className="block mb-1">Linux Device Path</label>
                  <input
                    type="text"
                    value={newPrinter.device_path}
                    onChange={(e) => setNewPrinter({ ...newPrinter, device_path: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border font-mono ${isDark ? 'bg-[#15181E] border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                    placeholder="/dev/usb/lp0"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block mb-1">Printer IP Address</label>
                    <input
                      type="text"
                      value={newPrinter.ip_address}
                      onChange={(e) => setNewPrinter({ ...newPrinter, ip_address: e.target.value })}
                      className={`w-full p-2.5 rounded-xl border font-mono ${isDark ? 'bg-[#15181E] border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Port</label>
                    <input
                      type="number"
                      value={newPrinter.port}
                      onChange={(e) => setNewPrinter({ ...newPrinter, port: parseInt(e.target.value) })}
                      className={`w-full p-2.5 rounded-xl border font-mono ${isDark ? 'bg-[#15181E] border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={newPrinter.is_default}
                  onChange={(e) => setNewPrinter({ ...newPrinter, is_default: e.target.checked })}
                  className="rounded text-[#C9A24B] focus:ring-[#C9A24B]"
                />
                <label htmlFor="is_default" className="text-xs">Set as default thermal printer</label>
              </div>

              <div className={`flex justify-end space-x-2 pt-3 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowAddPrinterModal(false)}
                  className={`px-4 py-2 rounded-xl ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl font-bold ${isDark ? 'bg-[#C9A24B] text-slate-950 hover:bg-[#b89139]' : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                >
                  Save Printer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Account Modal */}
      {showAddUserModal && (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in-up ${
          isDark ? 'bg-black/75' : 'bg-slate-900/35'
        }`}>
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${isDark ? 'bg-[#1E222A] border-[#2E3440] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <h3 className="font-heading font-bold text-lg flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-[#D49018]" />
                <span>Create Staff User Account</span>
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block mb-1 font-mono uppercase text-[11px]">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full p-3 rounded-xl border ${isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div>
                <label className="block mb-1 font-mono uppercase text-[11px]">Username</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="e.g. rahul"
                  className={`w-full p-3 rounded-xl border font-mono ${isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div>
                <label className="block mb-1 font-mono uppercase text-[11px]">Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Set account password"
                  className={`w-full p-3 rounded-xl border font-mono ${isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div>
                <label className="block mb-1 font-mono uppercase text-[11px]">Assigned Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className={`w-full p-3 rounded-xl border cursor-pointer font-mono ${isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                >
                  <option value="cashier">💳 Cashier Staff (POS Billing & Returns)</option>
                  {isAdmin && <option value="manager">🏬 Store Manager (Billing, Products & Reports)</option>}
                  {isAdmin && <option value="admin">👑 Admin Director (Full Access & Settings)</option>}
                </select>
                {isManager && !isAdmin && (
                  <p className="text-[10px] text-[#D49018] font-mono mt-1 flex items-center space-x-1">
                    <span>ℹ Store Managers are authorized to create Cashier staff accounts.</span>
                  </p>
                )}
              </div>

              <div className={`flex justify-end space-x-2 pt-3 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className={`px-4 py-2 rounded-xl cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-[#D49018] text-white hover:brightness-110 shadow-sm cursor-pointer"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModalConfig && (
        <ConfirmModal
          isOpen={true}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmText={confirmModalConfig.confirmText}
          variant={confirmModalConfig.variant}
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={() => setConfirmModalConfig(null)}
          theme={theme}
        />
      )}

    </div>
  );
}
