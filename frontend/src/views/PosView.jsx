import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, ArrowRight, Sparkles, X, Barcode, Tag, User, CheckCircle2, CreditCard, QrCode, Banknote } from 'lucide-react';
import VariantModal from '../components/VariantModal';
import PaymentModal from '../components/PaymentModal';

export default function PosView({ currentUser, theme }) {
  const isDark = theme === 'dark';
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('CASH');

  // Cart State (Pre-populated to mirror the exact reference screenshot)
  const [cart, setCart] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [customer, setCustomer] = useState({ name: 'Walk-in Customer', phone: '+91 98765-43210' });
  const [parkedBills, setParkedBills] = useState([]);

  // Modals
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchParkedBills();
  }, [selectedCategory, searchQuery]);

  const fetchProducts = async () => {
    try {
      let catQuery = selectedCategory;
      if (selectedCategory === 'All Items') catQuery = 'All';
      if (selectedCategory === 'Suits & Blazers') catQuery = 'Suits';
      if (selectedCategory === 'Ethnic Wear') catQuery = 'Ethnic';
      if (selectedCategory === 'Accessories & Belts') catQuery = 'Accessories';
      if (selectedCategory === 'Chappals & Shoes') catQuery = 'Footwear';

      let url = '/api/products?';
      if (catQuery !== 'All') url += `category=${encodeURIComponent(catQuery)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error("Failed to fetch products", e);
    }
  };

  const fetchParkedBills = async () => {
    try {
      const res = await fetch('/api/bills/parked');
      if (res.ok) {
        setParkedBills(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch parked bills", e);
    }
  };

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const res = await fetch(`/api/products/variant-by-barcode/${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        addToCart(data.product, data.variant);
        setSearchQuery('');
      }
    } catch (e) { }
  };

  const addToCart = (product, variant) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(item => item.variant.id === variant.id);
      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].qty += 1;
        return newCart;
      } else {
        const unitPrice = variant.price_override || product.base_price;
        return [...prevCart, {
          product,
          variant,
          unitPrice,
          qty: 1,
          discount: 0
        }];
      }
    });
  };

  const updateQty = (variantId, delta) => {
    setCart((prev) =>
      prev.map(item => {
        if (item.variant.id === variantId) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          const maxAllowedDisc = item.unitPrice * newQty;
          const clampedDisc = Math.min(item.discount || 0, maxAllowedDisc);
          return { ...item, qty: newQty, discount: clampedDisc };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeCartItem = (variantId) => {
    setCart(prev => prev.filter(item => item.variant.id !== variantId));
  };

  const updateItemDiscount = (variantId, discountVal) => {
    const rawVal = Math.max(0, parseFloat(discountVal) || 0);
    setCart((prev) =>
      prev.map(item => {
        if (item.variant.id === variantId) {
          const lineSubtotal = item.unitPrice * item.qty;
          const safeVal = Math.min(rawVal, lineSubtotal);
          return { ...item, discount: safeVal };
        }
        return item;
      })
    );
  };

  const displayedProducts = products;

  // Calculations
  const totalItemCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const grossSubtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
  
  // Safe item discounts capped at each line's subtotal
  const itemDiscountTotal = cart.reduce((sum, item) => {
    const lineSubtotal = item.unitPrice * item.qty;
    return sum + Math.min(item.discount || 0, lineSubtotal);
  }, 0);

  const remainingSubtotalForCartDiscount = Math.max(0, grossSubtotal - itemDiscountTotal);
  const isDiscountExceeded = (discountAmount || 0) > remainingSubtotalForCartDiscount;
  const effectiveCartDiscount = Math.min(Math.max(0, discountAmount || 0), remainingSubtotalForCartDiscount);
  const totalDiscount = itemDiscountTotal + effectiveCartDiscount;
  
  const tax = cart.reduce((sum, item) => {
    const lineSubtotal = item.unitPrice * item.qty;
    const lineDisc = Math.min(item.discount || 0, lineSubtotal);
    const afterDisc = Math.max(0, lineSubtotal - lineDisc);
    const taxPct = item.product?.tax_percent ?? 5.0;
    return sum + (afterDisc * (taxPct / 100));
  }, 0);

  const subtotalAfterDiscount = Math.max(0, grossSubtotal - totalDiscount);
  const total = Math.max(0, grossSubtotal - totalDiscount + tax);
  const subtotal = grossSubtotal;

  const handleParkCart = async () => {
    if (cart.length === 0) return;
    try {
      const payload = {
        customer_id: customer?.id || null,
        items: cart.map(i => ({ variant_id: i.variant.id, qty: i.qty, unit_price: i.unitPrice, discount: i.discount })),
        payments: [],
        discount_amount: discountAmount,
        notes: "Parked for Trial Room / Hold",
        status: "parked"
      };

      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setCart([]);
        setDiscountAmount(0);
        fetchParkedBills();
        alert("Cart parked for Trial Room!");
      }
    } catch (e) {
      alert("Failed to park cart");
    }
  };

  const handleConfirmCheckout = async (paymentsPayload) => {
    const payload = {
      customer_id: customer?.id || null,
      items: cart.map(i => ({ variant_id: i.variant.id, qty: i.qty, unit_price: i.unitPrice, discount: i.discount })),
      payments: paymentsPayload,
      discount_amount: discountAmount,
      status: "confirmed"
    };

    const res = await fetch('/api/bills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Billing failed");
    }

    const data = await res.json();
    setCart([]);
    setDiscountAmount(0);
    return data;
  };

  const categories = ['All Items', 'Shirts', 'Jeans', 'Suits & Blazers', 'Ethnic Wear', 'T-Shirts', 'Accessories & Belts', 'Chappals & Shoes'];

  return (
    <div className={`flex flex-col lg:flex-row h-[calc(100vh-57px)] overflow-hidden transition-colors ${
      isDark ? 'bg-[#121418] text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>

      {/* Main Catalog Column (Left) */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-3.5 pb-12">

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center">
          <div className={`relative flex-1 rounded-2xl border shadow-xs flex items-center transition-colors ${
            isDark ? 'bg-[#181B20] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`pl-3.5 pr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by title, style code, SKU, or scan barcode directly (F3)..."
              className={`w-full py-2.5 pr-10 text-xs font-semibold bg-transparent focus:outline-none ${
                isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
              }`}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className={`absolute right-3 ${
                isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
              }`}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Category Pill Sliders */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 font-bold text-xs rounded-xl whitespace-nowrap shrink-0 transition-all shadow-2xs cursor-pointer ${
                  isActive
                    ? 'bg-[#D49018] text-white shadow-xs'
                    : isDark
                    ? 'bg-[#181B20] border border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>


        {/* Product Inventory Grid (3 Columns) */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {products.length === 0 ? (
            <div className={`col-span-full py-16 text-center font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              No products found matching "{searchQuery || selectedCategory}".
            </div>
          ) : (
            products.map((p) => (
              <article
                key={p.id}
                onClick={() => {
                  setSelectedProductForVariant(p);
                  setIsVariantModalOpen(true);
                }}
                className={`rounded-2xl border overflow-hidden shadow-card flex flex-col justify-between cursor-pointer group transition-all duration-200 card-interactive animate-scale-in ${
                  isDark ? 'bg-[#181B20] border-slate-800 hover:border-[#D49018]' : 'bg-white border-slate-200 hover:border-slate-800'
                }`}
              >
                <div>
                  <div className={`relative w-full aspect-[4/3] overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
                    <img
                      src={p.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&q=80'}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&q=80';
                      }}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Brand Badge Overlay */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/85 backdrop-blur-xs text-[9px] font-extrabold tracking-wider text-[#EEA735] uppercase rounded">
                      {p.brand}
                    </span>
                  </div>

                  <div className="p-3.5 pb-1">
                    <h2 className={`text-xs font-bold line-clamp-1 leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {p.name}
                    </h2>
                    <p className={`text-[11px] mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {p.category} • {p.variants?.length || 0} variants available
                    </p>
                  </div>
                </div>

                <div className="p-3.5 pt-2">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">MRP</span>
                      <span className={`text-base font-extrabold tracking-tight font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        ₹{p.base_price.toFixed(2)}
                      </span>
                    </div>

                    {/* Cream / Light Orange Select Size Button matching reference screenshot */}
                    <button
                      type="button"
                      className={`font-bold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-[#FEF3C7]/20 border border-[#FCD34D]/40 text-[#FCD34D] hover:bg-[#FEF3C7]/30'
                          : 'bg-[#FEF3C7] border border-[#FCD34D] text-[#D97706] hover:bg-[#fde68a]'
                      }`}
                    >
                      <span>Select Size</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

      </div>

      {/* Right Column: Current Ticket Panel */}
      <aside className={`w-full lg:w-[540px] border-t lg:border-t-0 lg:border-l flex flex-col justify-between shadow-xs pb-8 transition-colors ${
        isDark ? 'bg-[#181B20] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>

        {/* Ticket Header & Customer Profile */}
        <div className={`p-4 border-b space-y-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-[#D49018]" />
                <h3 className={`font-extrabold text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Current Ticket</h3>
                <span className="bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D] text-xs font-black px-2.5 py-0.5 rounded-full">
                  {totalItemCount} items
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-400 block mt-0.5">
                Order #ORD-2024-8841
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button onClick={() => setCart([])} title="Clear Cart" className={`p-1.5 text-slate-400 hover:text-red-500 rounded-lg ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Cart Itemized List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className={`p-5 rounded-2xl ${isDark ? 'bg-slate-800/70 text-slate-400' : 'bg-slate-100 text-slate-400'}`}>
                <ShoppingCart className="w-14 h-14 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <p className={`text-base font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Ticket is empty
                </p>
                <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Select a product card or scan barcode
                </p>
              </div>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.variant.id} className={`p-3 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#14161A] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <img
                    src={item.product.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100&q=80'}
                    alt={item.product.name}
                    className={`w-11 h-11 object-cover rounded-lg border shrink-0 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h5 className={`text-xs font-bold truncate leading-snug pr-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.product.name}
                      </h5>
                      <span className={`text-xs font-bold font-mono shrink-0 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        ₹{(item.unitPrice * item.qty).toFixed(2)}
                      </span>
                    </div>
                    <p className={`text-[11px] font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Size: <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.variant.size}</span> | SKU: <span className="font-semibold">{item.variant.sku_barcode}</span>
                    </p>

                    {/* Quantity & Item Discount Row */}
                    <div className="flex items-center justify-between pt-1.5 gap-2">
                      <div className="flex items-center space-x-2">
                        <div className={`flex items-center space-x-1.5 border rounded-md px-1.5 py-0.5 ${
                          isDark ? 'bg-[#1F2229] border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                        }`}>
                          <button onClick={() => updateQty(item.variant.id, -1)} className="text-slate-400 hover:text-white font-bold cursor-pointer">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-xs px-1">{item.qty}</span>
                          <button onClick={() => updateQty(item.variant.id, 1)} className="text-slate-400 hover:text-white font-bold cursor-pointer">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Item Discount Column Input */}
                        <div className={`flex items-center space-x-1 border rounded-md px-1.5 py-0.5 ${
                          isDark ? 'bg-[#1F2229] border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                        }`}>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Disc ₹</span>
                          <input
                            type="number"
                            min="0"
                            value={item.discount || ''}
                            onChange={(e) => updateItemDiscount(item.variant.id, e.target.value)}
                            placeholder="0"
                            className={`w-10 text-xs font-mono font-bold bg-transparent outline-none text-right ${
                              isDark ? 'text-white' : 'text-slate-800'
                            }`}
                          />
                        </div>
                      </div>

                      <button onClick={() => removeCartItem(item.variant.id)} className="text-slate-400 hover:text-red-500 p-0.5 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Summary & NET TOTAL */}
        <div className={`p-3 border-t space-y-1.5 text-xs ${
          isDark ? 'bg-[#181B20] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
        }`}>
          <div className="flex justify-between items-center font-semibold">
            <span>Subtotal ({totalItemCount} items)</span>
            <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>₹{grossSubtotal.toFixed(2)}</span>
          </div>

          {/* Bill Discount Column Row */}
          <div className="flex flex-col pt-0.5 space-y-1">
            <div className="flex justify-between items-center font-semibold">
              <span className={`font-bold flex items-center gap-1 ${isDiscountExceeded ? 'text-rose-500' : 'text-emerald-500'}`}>
                Discount (₹)
              </span>
              <div className="flex items-center gap-1.5">
                {totalDiscount > 0 && (
                  <span className={`text-xs font-mono font-bold ${isDiscountExceeded ? 'text-rose-400 line-through' : 'text-emerald-400'}`}>
                    -₹{totalDiscount.toFixed(2)}
                  </span>
                )}
                <input
                  type="number"
                  min="0"
                  max={remainingSubtotalForCartDiscount}
                  value={discountAmount || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setDiscountAmount(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  onBlur={() => {
                    if (isDiscountExceeded) {
                      setDiscountAmount(remainingSubtotalForCartDiscount);
                    }
                  }}
                  placeholder="0.00"
                  className={`w-24 px-2 py-0.5 text-xs font-mono font-bold rounded-md text-right focus:outline-none transition-all ${
                    isDiscountExceeded
                      ? 'bg-rose-950/80 border-2 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                      : isDark
                        ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 focus:ring-1 focus:ring-emerald-400'
                        : 'bg-emerald-50 border border-emerald-300 text-emerald-700 focus:ring-1 focus:ring-emerald-500'
                  }`}
                />
              </div>
            </div>

            {isDiscountExceeded && (
              <div className="text-[10px] font-bold text-rose-500 text-right flex items-center justify-end gap-1 animate-pulse">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>Discount cannot exceed Subtotal (Max: ₹{remainingSubtotalForCartDiscount.toFixed(2)})</span>
              </div>
            )}
          </div>

          {/* Subtotal After Discount */}
          {totalDiscount > 0 && (
            <div className="flex justify-between items-center font-semibold">
              <span className="font-medium">After Discount Subtotal</span>
              <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>₹{subtotalAfterDiscount.toFixed(2)}</span>
            </div>
          )}

          {/* GST Tax */}
          <div className="flex justify-between items-center font-semibold">
            <span className="flex items-center gap-1">GST Tax <span className="text-[10px] text-slate-400">ℹ</span></span>
            <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>₹{tax.toFixed(2)}</span>
          </div>

          <div className={`flex justify-between items-center pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div>
              <span className={`font-extrabold text-sm block leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>NET TOTAL</span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Inclusive of all local taxes</span>
            </div>
            <span className="text-xl font-black text-[#D49018] font-mono tracking-tight">
              ₹{total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Primary CHARGE ORDER Action Button */}
        <div className={`p-3 border-t space-y-2 ${isDark ? 'bg-[#181B20] border-slate-800' : 'bg-white border-slate-200'}`}>
          <button
            type="button"
            onClick={() => {
              if (cart.length === 0) return;
              if (isDiscountExceeded) {
                alert(`Discount of ₹${discountAmount} exceeds subtotal. Discount has been auto-adjusted to maximum allowed: ₹${remainingSubtotalForCartDiscount.toFixed(2)}`);
                setDiscountAmount(remainingSubtotalForCartDiscount);
              }
              setIsPaymentModalOpen(true);
            }}
            disabled={cart.length === 0}
            className="w-full bg-[#D49018] hover:bg-[#c28113] active:scale-[0.99] text-white font-extrabold shadow-sm rounded-xl p-2.5 flex items-center justify-between text-sm transition-all disabled:opacity-40 cursor-pointer"
          >
            <span className="font-extrabold uppercase tracking-wide">CHARGE ORDER</span>
            <span className="font-black font-mono text-base">₹{total.toFixed(2)}</span>
          </button>
        </div>

      </aside>

      {/* Bottom Black Keyboard Shortcuts Bar */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-[#0F172A] text-slate-300 h-8 px-4 flex items-center justify-between text-[11px] font-mono border-t border-slate-800">
        <div className="flex items-center space-x-4">
          <span><strong className="text-white">F1:</strong> Cash</span>
          <span className="text-slate-600">|</span>
          <span><strong className="text-white">F2:</strong> Card</span>
          <span className="text-slate-600">|</span>
          <span><strong className="text-white">F3:</strong> Search SKU</span>
          <span className="text-slate-600">|</span>
          <span><strong className="text-white">F4:</strong> UPI Scan</span>
          <span className="text-slate-600">|</span>
          <span><strong className="text-white">SPACE:</strong> Charge</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-400">Sync: Cloud Online <strong className="text-white">v2.8.4</strong></span>
        </div>
      </footer>

      {/* Modals */}
      <VariantModal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        product={selectedProductForVariant}
        onAddToCart={addToCart}
        theme={theme}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cartTotals={{ subtotal, tax, discountAmount: effectiveCartDiscount, total }}
        customer={customer}
        onConfirmPayment={handleConfirmCheckout}
        theme={theme}
      />

    </div>
  );
}

