import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, FileText, ArrowRight, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function ReturnsView({ theme }) {
  const isDark = theme === 'dark';
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [recentBills, setRecentBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [searchedBill, setSearchedBill] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [returnReason, setReturnReason] = useState('Wrong Size / Size Exchange');
  const [processedResult, setProcessedResult] = useState(null);

  const fetchRecentBills = async () => {
    setLoadingBills(true);
    try {
      const res = await fetch('/api/bills');
      if (res.ok) {
        const bills = await res.json();
        setRecentBills(bills.slice(0, 16));
      }
    } catch (e) {
      console.error("Error fetching recent bills", e);
    } finally {
      setLoadingBills(false);
    }
  };

  useEffect(() => {
    fetchRecentBills();
  }, []);

  const handleSearchBill = async (e) => {
    if (e) e.preventDefault();
    if (!invoiceSearch.trim()) return;
    try {
      const res = await fetch(`/api/bills?invoice_number=${encodeURIComponent(invoiceSearch.trim())}`);
      if (res.ok) {
        const bills = await res.json();
        const found = bills.find(b => b.invoice_number.toLowerCase() === invoiceSearch.trim().toLowerCase()) || bills[0];
        if (found) {
          selectBill(found);
        } else {
          alert("Invoice not found!");
        }
      }
    } catch (e) {
      alert("Error searching invoice");
    }
  };

  const selectBill = (bill) => {
    setSearchedBill(bill);
    setInvoiceSearch(bill.invoice_number);
    setSelectedItems({});
    setProcessedResult(null);
  };

  const toggleItemSelection = (item) => {
    setSelectedItems(prev => {
      const copy = { ...prev };
      if (copy[item.id]) delete copy[item.id];
      else copy[item.id] = item;
      return copy;
    });
  };

  const handleProcessReturn = async () => {
    const itemsList = Object.values(selectedItems).map(i => ({
      variant_id: i.variant_id,
      qty: i.qty,
      refund_amount: i.line_total
    }));

    if (itemsList.length === 0) return alert("Select at least one item to return");

    const payload = {
      original_bill_id: searchedBill.id,
      reason: returnReason,
      return_items: itemsList
    };

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setProcessedResult(data);
        fetchRecentBills();
      }
    } catch (e) {
      alert("Failed to process return");
    }
  };

  return (
    <div className="p-6 max-w-[1550px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'}`}>
        <h2 className={`font-heading text-2xl font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <RefreshCw className="w-6 h-6 text-[#C9A24B]" />
          <span>Receipts & Returns Desk</span>
        </h2>
        <p className="text-xs text-gray-400 font-mono mt-1">Browse past created customer receipts, lookup invoices, process garment returns, and restock inventory</p>
      </div>

      {/* Invoice Lookup Input */}
      <form onSubmit={handleSearchBill} className="flex space-x-3">
        <div className={`flex-1 border rounded-xl overflow-hidden flex items-center px-4 ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Enter Invoice Number (e.g. SWZ-2026-00001)..."
            value={invoiceSearch}
            onChange={e => setInvoiceSearch(e.target.value)}
            className={`w-full bg-transparent py-3 font-mono text-sm focus:outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
          />
        </div>
        <button type="submit" className="py-3 px-6 rounded-xl bg-[#C9A24B] text-black font-bold text-sm hover:bg-[#b89139] transition-all cursor-pointer">
          Lookup Bill
        </button>
      </form>

      {/* Selected Bill Details & Return Form */}
      {searchedBill && (
        <div className={`border rounded-2xl p-6 space-y-4 animate-fade-in-up ${isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-[#2A2E39]' : 'border-slate-200'}`}>
            <div>
              <span className="text-xs font-mono font-bold text-[#C9A24B]">INVOICE #{searchedBill.invoice_number}</span>
              <div className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Date: {new Date(searchedBill.created_at).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Total Bill Amount</span>
              <span className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ₹{searchedBill.total_amount.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Select Items to Return / Swap:
            </label>
            <div className="space-y-2">
              {searchedBill.items?.map(item => {
                const isSelected = !!selectedItems[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItemSelection(item)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#C9A24B]/15 border-[#C9A24B] ring-1 ring-[#C9A24B]'
                        : isDark ? 'bg-[#14161A] border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div>
                      <div className={`font-bold text-sm flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <span>Variant #{item.variant_id}</span>
                        {isSelected && <span className="text-xs text-[#C9A24B] font-extrabold">✓ Selected</span>}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">Qty: {item.qty} × ₹{item.unit_price}</div>
                    </div>
                    <span className="font-mono font-bold text-[#C9A24B]">₹{item.line_total.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`pt-4 border-t flex justify-end space-x-3 ${isDark ? 'border-[#2A2E39]' : 'border-slate-200'}`}>
            <button
              onClick={handleProcessReturn}
              className="py-3 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              Confirm Return & Restock Items
            </button>
          </div>
        </div>
      )}

      {processedResult && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 p-4 rounded-xl text-emerald-400 text-xs font-bold flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>Return #{processedResult.return_id} processed successfully! Refund: <strong className="font-mono text-white">₹{processedResult.total_refund?.toFixed(2)}</strong>. Items restocked.</span>
        </div>
      )}

      {/* Recent Created Invoices List */}
      <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'}`}>
        <div className="flex justify-between items-center">
          <h3 className={`font-heading text-base font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <FileText className="w-4 h-4 text-[#C9A24B]" />
            <span>Recent Created Invoices</span>
          </h3>
          <span className="text-xs font-mono text-gray-400">Click any invoice to select for return/exchange</span>
        </div>

        {loadingBills ? (
          <div className="text-center py-6 text-xs text-gray-400 font-mono">Loading recent invoices...</div>
        ) : recentBills.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400 font-mono">No invoices created yet. Create a bill from POS Billing to see it here.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentBills.map(bill => {
              const isSelected = searchedBill?.id === bill.id;
              return (
                <div
                  key={bill.id}
                  onClick={() => selectBill(bill)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                    isSelected
                      ? 'bg-[#C9A24B]/15 border-[#C9A24B] ring-1 ring-[#C9A24B]'
                      : isDark
                      ? 'bg-[#14161A] border-slate-800 hover:border-slate-700 hover:bg-[#181B20]'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-extrabold text-[#C9A24B]">{bill.invoice_number}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        bill.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {bill.status}
                      </span>
                    </div>
                    <div className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                      {bill.customer ? bill.customer.name : 'Walk-in Customer'} • {bill.items?.length || 0} items
                    </div>
                    <div className="text-[11px] font-mono text-gray-400">
                      {new Date(bill.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end space-y-1">
                    <span className={`text-base font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      ₹{bill.total_amount.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-bold text-[#C9A24B] flex items-center space-x-1 hover:underline">
                      <span>Select</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

