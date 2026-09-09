import React, { useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';

export default function ReturnsView({ theme }) {
  const isDark = theme === 'dark';
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [searchedBill, setSearchedBill] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [returnReason, setReturnReason] = useState('Wrong Size / Size Exchange');
  const [processedResult, setProcessedResult] = useState(null);

  const handleSearchBill = async (e) => {
    e.preventDefault();
    if (!invoiceSearch.trim()) return;
    try {
      const res = await fetch(`/api/bills?invoice_number=${encodeURIComponent(invoiceSearch.trim())}`);
      if (res.ok) {
        const bills = await res.json();
        const found = bills.find(b => b.invoice_number === invoiceSearch.trim()) || bills[0];
        if (found) setSearchedBill(found);
        else alert("Invoice not found!");
      }
    } catch (e) {
      alert("Error searching invoice");
    }
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
      }
    } catch (e) {
      alert("Failed to process return");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'}`}>
        <h2 className={`font-heading text-2xl font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <RefreshCw className="w-6 h-6 text-[#C9A24B]" />
          <span>Returns & Size Exchange Desk</span>
        </h2>
        <p className="text-xs text-gray-400 font-mono mt-1">Process customer garment returns, restock inventory automatically, or perform size swaps</p>
      </div>

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
        <button type="submit" className="py-3 px-6 rounded-xl bg-[#C9A24B] text-black font-bold text-sm">
          Lookup Bill
        </button>
      </form>

      {searchedBill && (
        <div className={`border rounded-2xl p-6 space-y-4 ${isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-[#2A2E39]' : 'border-slate-200'}`}>
            <div>
              <span className="text-xs font-mono text-[#C9A24B]">INVOICE #{searchedBill.invoice_number}</span>
              <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
              {searchedBill.items.map(item => {
                const isSelected = !!selectedItems[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItemSelection(item)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#C9A24B]/15 border-[#C9A24B]'
                        : isDark ? 'bg-[#14161A] border-gray-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Variant #{item.variant_id}</div>
                      <div className="text-xs text-gray-400 font-mono">Qty: {item.qty} x ₹{item.unit_price}</div>
                    </div>
                    <span className="font-mono font-bold text-[#C9A24B]">₹{item.line_total.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`pt-4 border-t flex justify-end ${isDark ? 'border-[#2A2E39]' : 'border-slate-200'}`}>
            <button
              onClick={handleProcessReturn}
              className="py-3 px-6 rounded-xl bg-red-500 text-white font-bold text-sm shadow-md"
            >
              Confirm Return & Restock Items
            </button>
          </div>
        </div>
      )}

      {processedResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-emerald-500 text-sm font-medium">
          ✅ Return #{processedResult.return_id} processed! Refund: <strong className="font-mono">₹{processedResult.total_refund.toFixed(2)}</strong>. Items restocked.
        </div>
      )}
    </div>
  );
}
