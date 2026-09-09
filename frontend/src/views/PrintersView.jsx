import React, { useState, useEffect } from 'react';
import { Printer, RefreshCw, Send, CheckCircle2, AlertCircle, Settings, Store, Plus, Save, Check, X, Shield, FileText } from 'lucide-react';

export default function PrintersView({ theme }) {
  const isDark = theme === 'dark';
  const [printers, setPrinters] = useState([]);
  const [printJobs, setPrintJobs] = useState([]);
  const [settings, setSettings] = useState({
    shop_name: 'SWAGZ FASHION — MENSWEAR',
    address: '74 Luxury Boulevard, Tailor District, New Delhi - 110001',
    phone: '+91 98765 43210',
    gstin: '07SWAGZ9999F1Z9',
    receipt_footer: 'Thank you for shopping at Swagz! Menswear items once sold can be exchanged within 7 days with original tag & invoice.'
  });
  const [virtualReceiptHtml, setVirtualReceiptHtml] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showAddPrinterModal, setShowAddPrinterModal] = useState(false);
  const [newPrinter, setNewPrinter] = useState({
    name: 'Counter Printer #2',
    connection_type: 'usb',
    ip_address: '',
    port: 9100,
    device_path: '/dev/usb/lp1',
    paper_width_mm: 80,
    is_default: false
  });

  useEffect(() => {
    fetchPrinters();
    fetchPrintJobs();
    fetchSettings();
    fetchLatestVirtualReceipt();
  }, []);

  const fetchPrinters = async () => {
    try {
      const res = await fetch('/api/printers');
      if (res.ok) setPrinters(await res.json());
    } catch (e) {}
  };

  const fetchPrintJobs = async () => {
    try {
      const res = await fetch('/api/printers/jobs');
      if (res.ok) setPrintJobs(await res.json());
    } catch (e) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) setSettings(await res.json());
    } catch (e) {}
  };

  const fetchLatestVirtualReceipt = async () => {
    try {
      const res = await fetch('http://127.0.0.1:9100/latest-receipt');
      if (res.ok) {
        const data = await res.json();
        if (data.html) setVirtualReceiptHtml(data.html);
      }
    } catch (e) {}
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
        setStatusMessage({ type: 'success', text: 'Shop branding & invoice settings saved successfully!' });
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
    setStatusMessage({ type: 'info', text: 'Sending test print payload to Print Agent (port 9100)...' });
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${
        isDark ? 'bg-[#1E222A] border-[#2E3440] shadow-lg' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <h2 className={`font-heading text-2xl font-bold flex items-center space-x-2.5 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            <Printer className="w-7 h-7 text-[#C9A24B]" />
            <span>Thermal Printers & Shop Settings</span>
          </h2>
          <p className={`text-xs font-medium mt-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Configure USB/LAN receipt printers, manage invoice branding & headers, and preview live print output.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddPrinterModal(true)}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-sm ${
              isDark 
                ? 'bg-[#C9A24B] text-slate-950 hover:bg-[#b89139]' 
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
        <div className={`p-4 rounded-xl text-xs font-mono font-bold border flex items-center space-x-2 transition-all ${
          statusMessage.type === 'success' 
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
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#1E222A] border-[#2E3440] shadow-lg' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex justify-between items-center">
              <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Printer className="w-5 h-5 text-[#C9A24B]" />
                <span>Configured Thermal Printers</span>
              </h3>
              <span className={`text-xs font-mono px-2.5 py-1 rounded-full font-semibold ${
                isDark ? 'bg-slate-800 text-gray-300' : 'bg-slate-100 text-slate-700'
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
                  <div key={p.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all ${
                    isDark ? 'bg-[#15181E] border-[#2E3440]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.name}</span>
                        {p.is_default && (
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                            isDark ? 'bg-[#C9A24B]/20 text-[#C9A24B] border border-[#C9A24B]/30' : 'bg-slate-900 text-white'
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
                      className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-all ${
                        isDark 
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
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#1E222A] border-[#2E3440] shadow-lg' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-700/60">
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
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                      isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
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
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                      isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
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
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                      isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
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
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                      isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
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
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                    isDark ? 'bg-[#15181E] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className={`py-2.5 px-5 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-sm transition-all ${
                    isDark 
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
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#1E222A] border-[#2E3440] shadow-lg' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex justify-between items-center">
              <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <FileText className="w-5 h-5 text-[#C9A24B]" />
                <span>Print Jobs Audit Trail</span>
              </h3>
              <button onClick={fetchPrintJobs} className={`text-xs font-semibold flex items-center space-x-1 ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Log</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className={`font-mono border-b ${
                  isDark ? 'bg-[#15181E] text-gray-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200 font-bold'
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
                    printJobs.map(job => (
                      <tr key={job.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                        <td className="p-3 font-mono font-semibold">#JOB-{job.id}</td>
                        <td className="p-3 font-mono font-bold">Bill #{job.bill_id}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            job.status === 'success' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700' 
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-500 dark:text-gray-400">{new Date(job.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Realistic Live Thermal Receipt Preview */}
        <div className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#1E222A] border-[#2E3440] shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-700/60">
            <h3 className={`font-heading text-base font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Printer className="w-4 h-4 text-[#C9A24B]" />
              <span>Live Thermal Receipt Preview</span>
            </h3>
            <button onClick={fetchLatestVirtualReceipt} className={`text-xs font-semibold flex items-center space-x-1 ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>
          </div>

          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Live ESC/POS 80mm thermal receipt buffer output rendered in real-time.
          </p>

          {/* Physical Thermal Paper Styled Container */}
          <div className="p-3 bg-slate-200 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 flex justify-center">
            <div className="w-full max-w-[320px] bg-[#FFFDF7] text-slate-950 font-mono text-[11px] leading-snug p-4 rounded-xs shadow-md border border-slate-300 space-y-3 relative">
              
              {/* Receipt Header Paper Edge Notch styling */}
              <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3">
                <div className="font-extrabold text-sm uppercase tracking-wide">{settings.shop_name}</div>
                <div className="text-[10px] text-slate-700">{settings.address}</div>
                <div className="text-[10px] text-slate-700 font-bold">Ph: {settings.phone}</div>
                <div className="text-[10px] font-bold text-slate-800">GSTIN: {settings.gstin}</div>
              </div>

              {/* Sample / Live Receipt Content */}
              {virtualReceiptHtml ? (
                <div 
                  className="py-1 receipt-html-container overflow-x-auto text-slate-950 font-mono text-[11px]"
                  dangerouslySetInnerHTML={{ __html: virtualReceiptHtml }} 
                />
              ) : (
                <div className="space-y-3 py-1">
                  <div className="flex justify-between text-[10px] font-bold border-b border-dashed border-slate-300 pb-1">
                    <span>INVOICE: #SAMPLE-101</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>1x Signature Linen Shirt (L)</span>
                      <span>₹2,499.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>1x Slim Chino Trousers (32)</span>
                      <span>₹1,899.00</span>
                    </div>
                  </div>

                  <div className="border-t border-b border-dashed border-slate-400 py-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹4,398.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (12%):</span>
                      <span>₹527.76</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-xs text-slate-950 pt-1 border-t border-slate-400">
                      <span>TOTAL:</span>
                      <span>₹4,925.76</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-700">
                      <span>Paid via UPI / Cash:</span>
                      <span>₹4,925.76</span>
                    </div>
                  </div>

                  <div className="text-center text-[9px] text-slate-600 pt-1 leading-tight italic">
                    {settings.receipt_footer}
                  </div>

                  <div className="pt-2 text-center">
                    <div className="inline-block px-3 py-1 bg-slate-900 text-white text-[9px] font-mono font-bold rounded">
                      ||| |||| || ||||| ||| ||||
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">SAMPLE PREVIEW</div>
                  </div>
                </div>
              )}

              <div className="text-center text-[10px] text-slate-400 border-t border-dashed border-slate-300 pt-2">
                ⚡ Auto-prints via Print Agent (Port 9100)
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Add Thermal Printer Modal */}
      {showAddPrinterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isDark ? 'bg-[#1E222A] border-[#2E3440] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-700">
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

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddPrinterModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl font-bold ${
                    isDark ? 'bg-[#C9A24B] text-slate-950 hover:bg-[#b89139]' : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Save Printer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

