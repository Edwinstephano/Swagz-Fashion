import React, { useState, useEffect } from 'react';
import { Scissors, Search, Plus, Calendar, Clock, CheckCircle2, User, Phone, Tag, Printer, Sparkles, Filter, ChevronRight } from 'lucide-react';

export default function AlterationsView({ theme }) {
  const isDark = theme === 'dark';
  const [alterations, setAlterations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New alteration form state
  const [formData, setFormData] = useState({
    bill_id: '',
    customer_name: '',
    customer_phone: '',
    garment_details: '',
    alteration_notes: '',
    pickup_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    express: false,
    selectedPresets: []
  });

  const presetNotes = [
    'Trouser Length Shorten (-2")',
    'Waist Adjustment (-1")',
    'Sleeve Alteration',
    'Taper Legs',
    'Blazer Shoulder Fitting',
    'Shirt Cuff Shorten'
  ];

  const fetchAlterations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alterations');
      if (res.ok) {
        const data = await res.json();
        setAlterations(data);
      }
    } catch (e) {
      console.error("Failed to load alterations", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlterations();
  }, []);

  const handleTogglePreset = (preset) => {
    setFormData(prev => {
      const exists = prev.selectedPresets.includes(preset);
      const updatedPresets = exists
        ? prev.selectedPresets.filter(p => p !== preset)
        : [...prev.selectedPresets, preset];
      
      return {
        ...prev,
        selectedPresets: updatedPresets,
        alteration_notes: updatedPresets.join('; ')
      };
    });
  };

  const handleCreateAlteration = async (e) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.customer_phone || !formData.garment_details) {
      alert("Please fill in Customer Name, Phone, and Garment details.");
      return;
    }

    try {
      // Find a default bill_id if none entered
      let billIdToUse = parseInt(formData.bill_id, 10);
      if (!billIdToUse || isNaN(billIdToUse)) {
        // fetch latest bill
        const billsRes = await fetch('/api/bills');
        if (billsRes.ok) {
          const bills = await billsRes.json();
          if (bills.length > 0) billIdToUse = bills[0].id;
          else billIdToUse = 1;
        } else {
          billIdToUse = 1;
        }
      }

      const payload = {
        bill_id: billIdToUse,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        garment_details: formData.garment_details,
        alteration_notes: formData.express ? `⚡ [EXPRESS 2-HOUR] ${formData.alteration_notes}` : formData.alteration_notes,
        pickup_date: formData.pickup_date
      };

      const res = await fetch('/api/alterations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          bill_id: '',
          customer_name: '',
          customer_phone: '',
          garment_details: '',
          alteration_notes: '',
          pickup_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
          express: false,
          selectedPresets: []
        });
        fetchAlterations();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create alteration request");
      }
    } catch (e) {
      console.error(e);
      alert("Error submitting request");
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/alterations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchAlterations();
      }
    } catch (e) {
      console.error("Error updating status", e);
    }
  };

  const handlePrintTag = async (alt) => {
    try {
      const printPayload = {
        invoice_number: `ALT-${alt.id.toString().padStart(4, '0')}`,
        customer_name: alt.customer_name,
        customer_phone: alt.customer_phone,
        total_amount: 0,
        items: [{
          product_name: `[TAILORING TAG] ${alt.garment_details}`,
          variant_info: alt.alteration_notes || 'Standard Tailoring',
          qty: 1,
          unit_price: 0,
          line_total: 0
        }],
        payment_method: "TAILORING SLIP",
        cashier_name: "Master Tailor"
      };

      const res = await fetch('http://127.0.0.1:9100/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printPayload)
      });

      if (res.ok) {
        alert(`✂️ Tailoring Tag #ALT-${alt.id} sent to Thermal Printer!`);
      } else {
        alert("Print agent offline. Ensure Print Agent on port 9100 is active.");
      }
    } catch (e) {
      alert("Error triggering thermal tag print.");
    }
  };

  const filtered = alterations.filter(item => {
    const matchesFilter = activeFilter === 'All' || item.status.toLowerCase() === activeFilter.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query ||
      item.customer_name.toLowerCase().includes(query) ||
      item.customer_phone.toLowerCase().includes(query) ||
      item.garment_details.toLowerCase().includes(query) ||
      (item.alteration_notes && item.alteration_notes.toLowerCase().includes(query));
    return matchesFilter && matchesQuery;
  });

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center space-x-1"><span>⏳</span><span>Pending</span></span>;
      case 'in tailoring':
      case 'in_progress':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center space-x-1"><span>✂️</span><span>In Tailoring</span></span>;
      case 'ready':
      case 'ready for pickup':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1"><span>✅</span><span>Ready for Pickup</span></span>;
      case 'delivered':
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30 flex items-center space-x-1"><span>📦</span><span>Delivered</span></span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-[1550px] mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`font-heading text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Alteration & Master Tailor Desk
              </h2>
              <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                POS ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Track trouser shortenings, jacket fittings, waist adjustments & thermal garment tagging
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm shadow-md hover:bg-amber-400 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Alteration Ticket</span>
        </button>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Status Tabs */}
        <div className={`flex items-center p-1.5 rounded-xl border space-x-1 ${
          isDark ? 'bg-[#181B20] border-[#2A2E39]' : 'bg-slate-100 border-slate-200'
        }`}>
          {['All', 'Pending', 'In Tailoring', 'Ready for Pickup', 'Delivered'].map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className={`flex items-center px-3 py-2 rounded-xl border w-full md:w-80 ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by customer, phone, garment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-transparent text-xs focus:outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
          />
        </div>
      </div>

      {/* Alteration Tickets Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 font-mono text-sm">
          ⏳ Loading alteration tickets from database...
        </div>
      ) : filtered.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200'
        }`}>
          <Scissors className="w-12 h-12 mx-auto text-gray-500 opacity-50" />
          <p className={`font-bold text-base ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            No alteration tickets found
          </p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Click <strong className="text-amber-500">"New Alteration Ticket"</strong> to record a garment fitting request for a customer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((alt) => (
            <div
              key={alt.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all hover:shadow-lg ${
                isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      #ALT-{alt.id.toString().padStart(4, '0')}
                    </span>
                    {alt.alteration_notes?.includes('EXPRESS') && (
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse">
                        ⚡ EXPRESS
                      </span>
                    )}
                  </div>
                  {getStatusBadge(alt.status)}
                </div>

                {/* Garment Details */}
                <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {alt.garment_details}
                </h3>
              </div>

              {/* Customer & Notes Info */}
              <div className={`p-3 rounded-xl space-y-2 text-xs border ${
                isDark ? 'bg-[#14161A] border-[#2A2E39]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 font-bold text-slate-300">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span>{alt.customer_name}</span>
                  </span>
                  <span className="font-mono text-gray-400 flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{alt.customer_phone}</span>
                  </span>
                </div>

                {alt.alteration_notes && (
                  <div className="text-gray-400 pt-1 border-t border-gray-800/50">
                    <strong className="text-amber-500/90 block text-[10px] uppercase font-mono tracking-wider">Tailoring Specs:</strong>
                    <p className="mt-0.5 leading-relaxed text-[11px]">{alt.alteration_notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-gray-800/50 text-[11px]">
                  <span className="text-gray-400 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-amber-500" />
                    <span>Target Pickup:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-500">
                    {alt.pickup_date}
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handlePrintTag(alt)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Print Thermal Tag for Garment Bag"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-500" />
                  <span>Print Tag</span>
                </button>

                {/* Quick Status Dropdown */}
                <select
                  value={alt.status}
                  onChange={(e) => handleUpdateStatus(alt.id, e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer focus:outline-none ${
                    isDark ? 'bg-[#14161A] border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="Pending">⏳ Pending</option>
                  <option value="In Tailoring">✂️ In Tailoring</option>
                  <option value="Ready for Pickup">✅ Ready for Pickup</option>
                  <option value="Delivered">📦 Delivered</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating New Alteration Ticket */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border p-6 space-y-5 shadow-2xl transition-all ${
            isDark ? 'bg-[#1F2229] border-[#2A2E39] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center border-b pb-3 border-gray-800">
              <div className="flex items-center space-x-2">
                <Scissors className="w-5 h-5 text-amber-500" />
                <h3 className="font-heading text-lg font-bold">New Alteration Ticket</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold cursor-pointer px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAlteration} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs ${
                      isDark ? 'bg-[#14161A] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                      isDark ? 'bg-[#14161A] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Garment Details *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Italian Wool Suit Trouser - Charcoal (Size 34)"
                  value={formData.garment_details}
                  onChange={(e) => setFormData({ ...formData, garment_details: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border text-xs ${
                    isDark ? 'bg-[#14161A] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              {/* Preset Quick Chips */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">Quick Tailoring Presets:</label>
                <div className="flex flex-wrap gap-1.5">
                  {presetNotes.map((preset) => {
                    const selected = formData.selectedPresets.includes(preset);
                    return (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => handleTogglePreset(preset)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          selected
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : isDark
                            ? 'bg-[#14161A] border-slate-700 text-slate-400 hover:border-slate-500'
                            : 'bg-slate-100 border-slate-300 text-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}{preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Detailed Tailoring Notes / Measurements</label>
                <textarea
                  rows={2}
                  placeholder="Custom notes (e.g. Shorten trouser hem by 1.5 inches, taper cuff to 7 inches)"
                  value={formData.alteration_notes}
                  onChange={(e) => setFormData({ ...formData, alteration_notes: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border text-xs ${
                    isDark ? 'bg-[#14161A] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Target Pickup Date</label>
                  <input
                    type="date"
                    value={formData.pickup_date}
                    onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                      isDark ? 'bg-[#14161A] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.express}
                      onChange={(e) => setFormData({ ...formData, express: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-amber-500 flex items-center space-x-1">
                      <span>⚡</span><span>Express Priority (2-Hour)</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl border font-bold text-xs ${
                    isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md hover:bg-amber-400 cursor-pointer"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
