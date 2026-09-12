import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, Printer, Banknote, QrCode, CreditCard, Wallet, RotateCcw } from 'lucide-react';
import swagLogo from '../assets/swag.png';
import swagzzLogo from '../assets/swagzz.png';
import swagzzWhiteLogo from '../assets/swagzz_white.png';

export default function PaymentModal({ isOpen, onClose, cartTotals, customer, onConfirmPayment, theme }) {
  const isDark = theme === 'dark';
  const [paymentMode, setPaymentMode] = useState('cash'); // cash, upi, card, split
  const [cashTendered, setCashTendered] = useState(cartTotals.total || 0);
  const [upiRef, setUpiRef] = useState('');
  const [cardRef, setCardRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [confirmedBillData, setConfirmedBillData] = useState(null);
  const [printStatus, setPrintStatus] = useState(null);
  const [isTearing, setIsTearing] = useState(false);

  if (!isOpen) return null;

  const totalAmount = cartTotals.total || 0;
  const changeDue = Math.max(0, (parseFloat(cashTendered) || 0) - totalAmount);

  const handlePay = async () => {
    setIsSubmitting(true);
    let paymentsPayload = [];

    if (paymentMode === 'cash') {
      paymentsPayload.push({ mode: 'cash', amount: totalAmount });
    } else if (paymentMode === 'upi') {
      paymentsPayload.push({ mode: 'upi', amount: totalAmount, reference_no: upiRef || 'UPI-' + Date.now().toString().slice(-6) });
    } else if (paymentMode === 'card') {
      paymentsPayload.push({ mode: 'card', amount: totalAmount, reference_no: cardRef || 'CARD-' + Date.now().toString().slice(-4) });
    }

    // Trigger Tear-Off Animation Signature Moment!
    setIsTearing(true);

    try {
      const result = await onConfirmPayment(paymentsPayload);
      setConfirmedBillData(result.bill);
      setPrintStatus(result.print_info);
      setPaymentCompleted(true);
    } catch (e) {
      alert("Payment confirmation failed: " + e.message);
    } finally {
      setIsSubmitting(false);
      setIsTearing(false);
    }
  };

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all animate-fade-in backdrop-blur-sm ${
      isDark ? 'bg-black/75' : 'bg-slate-900/35'
    }`}>
      <div className={`rounded-2xl w-full max-w-xl p-6 shadow-2xl transition-all border ${
        isDark ? 'bg-[#1F2229] border-[#2A2E39] text-white' : 'bg-white border-slate-200 text-slate-900'
      } ${isTearing ? 'animate-tear-off' : ''}`}>
        
        {!paymentCompleted ? (
          <>
            {/* Header */}
            <div className={`flex items-center justify-between border-b pb-4 mb-5 ${
              isDark ? 'border-[#2A2E39]' : 'border-slate-200'
            }`}>
              <div className="flex items-center space-x-3">
                <img src={isDark ? swagzzWhiteLogo : swagzzLogo} alt="Swagz Logo" className="h-9 w-auto object-contain" />
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]">
                  POS CHECKOUT
                </span>
              </div>
              <button onClick={onClose} className={`p-1 rounded-lg transition-colors ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-[#2A2E39]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              }`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Amount Banner */}
            <div className={`p-4 rounded-xl border mb-5 flex items-center justify-between ${
              isDark
                ? 'bg-gradient-to-r from-[#14161A] via-[#1F2229] to-[#14161A] border-[#C9A24B]/30'
                : 'bg-amber-50/80 border-amber-200/80 shadow-xs'
            }`}>
              <div>
                <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-amber-800/80'}`}>TOTAL PAYABLE AMOUNT</span>
                <div className={`text-3xl font-bold font-mono ${isDark ? 'text-[#C9A24B]' : 'text-amber-900'}`}>₹{totalAmount.toFixed(2)}</div>
              </div>
              {customer && (
                <div className="text-right">
                  <span className={`text-xs block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Customer</span>
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{customer.name}</span>
                </div>
              )}
            </div>

            {/* Payment Mode Selector Tabs */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'upi', label: 'UPI / QR', icon: QrCode },
                { id: 'card', label: 'Card', icon: CreditCard }
              ].map((mode) => {
                const Icon = mode.icon;
                const active = paymentMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setPaymentMode(mode.id)}
                    className={`py-3 px-4 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all border ${
                      active
                        ? isDark
                          ? 'bg-[#C9A24B] text-black border-[#C9A24B] shadow-lg shadow-[#C9A24B]/20'
                          : 'bg-amber-600 text-white border-amber-600 shadow-md'
                        : isDark
                        ? 'bg-[#14161A] border-[#2A2E39] text-gray-400 hover:text-white hover:border-gray-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cash Input */}
            {paymentMode === 'cash' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    Cash Received (₹)
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className={`w-full p-3 rounded-xl border font-mono text-lg font-bold transition-all ${
                      isDark
                        ? 'bg-[#14161A] border-[#2A2E39] text-white focus:border-[#C9A24B]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                    }`}
                  />
                </div>
                <div className={`p-3 rounded-xl border flex justify-between items-center ${
                  isDark ? 'bg-[#14161A] border-[#2A2E39]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Change to Return</span>
                  <span className={`text-xl font-bold font-mono ${changeDue > 0 ? 'text-emerald-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
                    ₹{changeDue.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* UPI Input */}
            {paymentMode === 'upi' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    UPI Transaction / UTR Reference (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 329182049102"
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-sm transition-all ${
                      isDark
                        ? 'bg-[#14161A] border-[#2A2E39] text-white focus:border-[#C9A24B]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Card Input */}
            {paymentMode === 'card' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    Card Approval Code / Last 4 Digits (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4819"
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-sm transition-all ${
                      isDark
                        ? 'bg-[#14161A] border-[#2A2E39] text-white focus:border-[#C9A24B]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className={`py-3 px-5 rounded-xl border font-bold text-xs transition-all ${
                  isDark
                    ? 'border-gray-700 text-gray-300 hover:bg-[#2A2E39]'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={isSubmitting || (paymentMode === 'cash' && parseFloat(cashTendered) < totalAmount)}
                className={`flex-1 py-3 px-5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 ${
                  isDark
                    ? 'bg-[#C9A24B] hover:bg-[#b89139] text-black font-extrabold shadow-[#C9A24B]/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <span>Processing Payment...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Sale & Print Receipt</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Payment Success & Receipt View */
          <div className="text-center py-4 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className={`text-2xl font-bold font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Payment Successful!
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                Bill #{confirmedBillData?.bill_number} • Total ₹{confirmedBillData?.grand_total?.toFixed(2)}
              </p>
            </div>

            {/* Print Status Banner */}
            <div className={`p-3 rounded-xl text-left border flex items-start space-x-3 ${
              printStatus?.print_status === 'success'
                ? isDark
                  ? 'bg-[#3BAA75]/10 border-[#3BAA75]/30 text-[#3BAA75]'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : isDark
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <Printer className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs flex-1">
                <div className="font-bold uppercase tracking-wide">
                  {printStatus?.print_status === 'success' ? '✅ Thermal Receipt Auto-Printed' : '⚠️ Thermal Print Agent Alert'}
                </div>
                <div className={`mt-0.5 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{printStatus?.detail || "Job sent to thermal printer"}</div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2">
              <button
                type="button"
                onClick={async () => {
                  if (!confirmedBillData) return;
                  try {
                    await fetch('http://127.0.0.1:9101/print', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        invoice_number: confirmedBillData.invoice_number,
                        total_amount: confirmedBillData.total_amount,
                        items: confirmedBillData.items || [],
                        cashier_name: "Cashier Counter"
                      })
                    });
                    alert("Re-print command sent to thermal printer!");
                  } catch (e) {
                    alert("Failed to send reprint command");
                  }
                }}
                className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                }`}
              >
                <Printer className="w-3.5 h-3.5 text-amber-500" />
                <span>Re-Print Receipt</span>
              </button>
            </div>

            <button
              onClick={() => {
                setPaymentCompleted(false);
                onClose();
              }}
              className={`w-full py-3 rounded-xl font-bold shadow-lg cursor-pointer transition-all ${
                isDark
                  ? 'bg-[#C9A24B] hover:bg-[#b89139] text-black'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              Start Next Sale
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

