import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, Phone, Mail, MapPin, Award, ShoppingBag, Sparkles, Star, ChevronRight } from 'lucide-react';

export default function CustomersView({ theme }) {
  const isDark = theme === 'dark';
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (e) {
      console.error("Failed to load customers", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Name and Phone number are required.");
      return;
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: '', phone: '', email: '', address: '' });
        fetchCustomers();
      } else {
        alert("Failed to add customer");
      }
    } catch (e) {
      alert("Error submitting request");
    }
  };

  const filtered = customers.filter(c => {
    const query = searchQuery.toLowerCase();
    return !query ||
      c.name.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query) ||
      (c.email && c.email.toLowerCase().includes(query));
  });

  const getTierBadge = (id) => {
    // Generate tier based on id for demo
    if (id % 4 === 1) return { label: 'PLATINUM DIRECTOR', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', points: (id * 145) + 320 };
    if (id % 4 === 2) return { label: 'GOLD VIP', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', points: (id * 98) + 150 };
    if (id % 4 === 3) return { label: 'SILVER CLUB', color: 'bg-slate-400/15 text-slate-300 border-slate-400/30', points: (id * 45) + 80 };
    return { label: 'BRONZE MEMBER', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', points: 50 };
  };

  return (
    <div className="p-6 max-w-[1550px] mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`font-heading text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Menswear Loyalty & Customer Directory
              </h2>
              <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                VIP CLUB
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Manage client directory, purchase history, reward tier status & custom tailoring profiles
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm shadow-md hover:bg-amber-400 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex justify-between items-center gap-4">
        <div className={`flex items-center px-4 py-2.5 rounded-xl border w-full max-w-md ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-transparent text-xs focus:outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
          />
        </div>

        <div className="text-xs font-mono font-bold text-gray-400">
          Showing <span className="text-amber-500">{filtered.length}</span> registered clients
        </div>
      </div>

      {/* Grid of Customer Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 font-mono text-sm">
          ⏳ Loading client directory...
        </div>
      ) : filtered.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200'
        }`}>
          <Users className="w-12 h-12 mx-auto text-gray-500 opacity-50" />
          <p className={`font-bold text-base ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            No clients found matching search
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((customer) => {
            const tier = getTierBadge(customer.id);
            return (
              <div
                key={customer.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all hover:shadow-lg ${
                  isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-500 font-bold flex items-center justify-center text-sm uppercase">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {customer.name}
                      </h3>
                      <span className="font-mono text-xs text-gray-400 block">
                        ID: #{customer.id.toString().padStart(4, '0')}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${tier.color}`}>
                    {tier.label}
                  </span>
                </div>

                {/* Info List */}
                <div className={`p-3 rounded-xl space-y-2 text-xs border ${
                  isDark ? 'bg-[#14161A] border-[#2A2E39]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-gray-300">
                    <span className="flex items-center space-x-1.5 text-gray-400">
                      <Phone className="w-3.5 h-3.5 text-amber-500" />
                      <span>Phone:</span>
                    </span>
                    <span className="font-mono font-bold">{customer.phone}</span>
                  </div>

                  {customer.email && (
                    <div className="flex items-center justify-between text-gray-300">
                      <span className="flex items-center space-x-1.5 text-gray-400">
                        <Mail className="w-3.5 h-3.5 text-amber-500" />
                        <span>Email:</span>
                      </span>
                      <span className="font-mono text-[11px] truncate max-w-[180px]">{customer.email}</span>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-start justify-between text-gray-300 pt-1 border-t border-gray-800/50">
                      <span className="flex items-center space-x-1.5 text-gray-400">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        <span>Address:</span>
                      </span>
                      <span className="text-[11px] text-right truncate max-w-[180px]">{customer.address}</span>
                    </div>
                  )}
                </div>

                {/* Footer Stats */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
                  <div className="flex items-center space-x-1 text-xs">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-gray-400">Reward Points:</span>
                    <span className="font-mono font-bold text-amber-500 ml-1">{tier.points} pts</span>
                  </div>

                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    5% VIP Disc.
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Registering New Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-5 shadow-2xl transition-all ${
            isDark ? 'bg-[#1F2229] border-[#2A2E39] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center border-b pb-3 border-gray-800">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                <h3 className="font-heading text-lg font-bold">Add New VIP Client</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold cursor-pointer px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikramaditya Singh"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border text-xs ${
                    isDark ? 'bg-[#14161A] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Mobile Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98980 12345"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                    isDark ? 'bg-[#14161A] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. vikram@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border text-xs ${
                    isDark ? 'bg-[#14161A] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">City / Address</label>
                <input
                  type="text"
                  placeholder="e.g. Jubilee Hills, Hyderabad"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border text-xs ${
                    isDark ? 'bg-[#14161A] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
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
                  Register Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
