import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Printer, Banknote, QrCode, CreditCard, Wallet, RotateCcw } from 'lucide-react';
import swagLogo from '../assets/swag.png';
import swagzzLogo from '../assets/swagzz.png';
import swagzzWhiteLogo from '../assets/swagzz_white.png';

export default function PaymentModal({ isOpen, onClose, cartTotals, customer, onConfirmPayment }) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className={`bg-[#1F2229] border border-[#2A2E39] rounded-2xl w-full max-w-xl p-6 shadow-2xl transition-all ${isTearing ? 'animate-tear-off' : ''}`}>
        
        {!paymentCompleted ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2A2E39] pb-4 mb-5">
              <div className="flex items-center space-x-3">
                <img src={swagzzWhiteLogo} alt="Swagz Logo" className="h-9 w-auto object-contain" />
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]">
                  POS CHECKOUT
                </span>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#2A2E39]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Amount Banner */}
            <div className="bg-gradient-to-r from-[#14161A] via-[#1F2229] to-[#14161A] p-4 rounded-xl border border-[#C9A24B]/30 mb-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 font-medium">TOTAL PAYABLE AMOUNT</span>
                <div className="text-3xl font-bold text-[#C9A24B] font-mono">₹{totalAmount.toFixed(2)}</div>
              </div>
              {customer && (
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">Customer</span>
                  <span className="text-sm font-semibold text-white">{customer.name}</span>
                </div>
              )}
            </div>

            {/* Payment Mode Selector Tabs */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'upi', label: 'UPI / QR', icon: QrCode },
                { id: 'card', label: 'Card / POS', icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMode(m.id)}
                    className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                      active
                        ? 'bg-[#C9A24B] text-black font-bold border-[#C9A24B] shadow-md shadow-[#C9A24B]/20'
                        : 'bg-[#14161A] text-gray-300 border-[#2A2E39] hover:border-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Specific Payment Input Fields */}
            {paymentMode === 'cash' && (
              <div className="bg-[#14161A] p-4 rounded-xl border border-[#2A2E39] mb-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Cash Tendered by Customer (₹)</label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full bg-[#1F2229] border border-gray-700 rounded-lg px-4 py-2.5 text-white font-mono text-lg focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                  <span className="text-sm text-gray-300 font-medium">Change to Return:</span>
                  <span className="text-xl font-bold font-mono text-[#3BAA75]">₹{changeDue.toFixed(2)}</span>
                </div>
              </div>
            )}

            {paymentMode === 'upi' && (
              <div className="bg-[#14161A] p-4 rounded-xl border border-[#2A2E39] mb-6 text-center space-y-3">
                <div className="w-32 h-32 bg-white p-2 rounded-lg mx-auto flex items-center justify-center border border-gray-700">
                  {/* Simulated QR Code */}
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=swagzfashion@upi&pn=SwagzFashion" alt="UPI QR" className="w-full h-full object-contain" />
                </div>
                <span className="text-xs text-gray-400 block">Scan QR code using Google Pay / PhonePe / Paytm</span>
                <div>
                  <label className="block text-xs font-medium text-gray-400 text-left mb-1">UPI UTR / Reference No. (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 426189912044"
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    className="w-full bg-[#1F2229] border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>
            )}

            {paymentMode === 'card' && (
              <div className="bg-[#14161A] p-4 rounded-xl border border-[#2A2E39] mb-6 space-y-3">
                <p className="text-xs text-gray-400">Swipe or insert card on POS EDC machine.</p>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Approval / Authorization Code</label>
                  <input
                    type="text"
                    placeholder="e.g. AUTH-88219"
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                    className="w-full bg-[#1F2229] border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>
            )}

            {/* Confirm & Print Action */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="w-1/3 py-3 rounded-xl border border-gray-700 text-gray-300 font-medium hover:bg-[#2A2E39]"
              >
                Back
              </button>
              <button
                onClick={handlePay}
                disabled={isSubmitting || (paymentMode === 'cash' && parseFloat(cashTendered) < totalAmount)}
                className="flex-1 py-3 rounded-xl bg-[#3BAA75] hover:bg-[#329465] text-white font-bold flex items-center justify-center space-x-2 shadow-lg shadow-[#3BAA75]/20 disabled:opacity-40"
              >
                {isSubmitting ? (
                  <span>Processing & Auto-Printing...</span>
                ) : (
                  <>
                    <Printer className="w-5 h-5" />
                    <span>CONFIRM & AUTO-PRINT RECEIPT</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Payment Success & Auto-Print Status Screen */
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-[#3BAA75]/20 text-[#3BAA75] rounded-full flex items-center justify-center mx-auto border border-[#3BAA75]/40">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <span className="text-xs font-mono text-[#C9A24B] uppercase tracking-wider">PAYMENT CONFIRMED</span>
              <h3 className="font-heading text-2xl font-bold text-white">Bill #{confirmedBillData?.invoice_number}</h3>
              <p className="text-sm text-gray-400 mt-1">Total Paid: <span className="font-bold text-white font-mono">₹{confirmedBillData?.total_amount?.toFixed(2)}</span></p>
            </div>

            {/* Print Status Banner */}
            <div className={`p-3 rounded-xl text-left border flex items-start space-x-3 ${
              printStatus?.print_status === 'success'
                ? 'bg-[#3BAA75]/10 border-[#3BAA75]/30 text-[#3BAA75]'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <Printer className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs flex-1">
                <div className="font-bold uppercase tracking-wide">
                  {printStatus?.print_status === 'success' ? '✅ Thermal Receipt Auto-Printed' : '⚠️ Thermal Print Agent Alert'}
                </div>
                <div className="text-gray-300 mt-0.5">{printStatus?.detail || "Job sent to thermal printer"}</div>
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
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
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
              className="w-full py-3 rounded-xl bg-[#C9A24B] hover:bg-[#b89139] text-black font-bold shadow-lg cursor-pointer"
            >
              Start Next Sale
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
