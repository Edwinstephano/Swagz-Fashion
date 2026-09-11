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
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeCartItem = (variantId) => {
    setCart(prev => prev.filter(item => item.variant.id !== variantId));
  };

  const updateItemDiscount = (variantId, discountVal) => {
    const val = Math.max(0, parseFloat(discountVal) || 0);
    setCart((prev) =>
      prev.map(item =>
        item.variant.id === variantId ? { ...item, discount: val } : item
      )
    );
  };

  const displayedProducts = products;

  // Calculations
  const totalItemCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const grossSubtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
  const itemDiscountTotal = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
  const totalDiscount = itemDiscountTotal + (discountAmount || 0);
  
  const tax = cart.reduce((sum, item) => {
    const lineSubtotal = item.unitPrice * item.qty;
    const lineDisc = item.discount || 0;
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
          <div className="relative flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center">
            <div className="pl-3.5 pr-2 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by title, style code, SKU, or scan barcode directly (F3)..."
              className="w-full py-2.5 pr-10 text-xs font-semibold text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 text-slate-400 hover:text-slate-600">
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
                className={`px-4 py-2 font-bold text-xs rounded-xl whitespace-nowrap shrink-0 transition-all shadow-2xs ${
                  isActive
                    ? 'bg-[#D49018] text-white shadow-xs'
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
            <div className="col-span-full py-16 text-center text-slate-400 font-medium">
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
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card flex flex-col justify-between cursor-pointer group hover:border-slate-800 transition-all duration-200 card-interactive animate-scale-in"
              >
                <div>
                  <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
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
                    <h2 className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug">
                      {p.name}
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      {p.category} • {p.variants?.length || 0} variants available
                    </p>
                  </div>
                </div>

                <div className="p-3.5 pt-2">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">MRP</span>
                      <span className="text-base font-extrabold text-slate-900 tracking-tight font-mono">
                        ₹{p.base_price.toFixed(2)}
                      </span>
                    </div>

                    {/* Cream / Light Orange Select Size Button matching reference screenshot */}
                    <button
                      type="button"
                      className="bg-[#FEF3C7] hover:bg-[#fde68a] border border-[#FCD34D] text-[#D97706] font-bold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-2xs transition-colors"
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
      <aside className="w-full lg:w-[540px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between shadow-xs pb-8">

        {/* Ticket Header & Customer Profile */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-[#D49018]" />
                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">Current Ticket</h3>
                <span className="bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D] text-xs font-black px-2.5 py-0.5 rounded-full">
                  {totalItemCount} items
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-400 block mt-0.5">
                Order #ORD-2024-8841
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button onClick={() => setCart([])} title="Clear Cart" className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100">
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
              <div key={item.variant.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-start space-x-3">
                  <img
                    src={item.product.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100&q=80'}
                    alt={item.product.name}
                    className="w-11 h-11 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h5 className="text-xs font-bold text-slate-900 truncate leading-snug pr-1">
                        {item.product.name}
                      </h5>
                      <span className="text-xs font-bold font-mono text-slate-900 shrink-0">
                        ₹{(item.unitPrice * item.qty).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      Size: <span className="font-bold text-slate-800">{item.variant.size}</span> | SKU: <span className="font-semibold">{item.variant.sku_barcode}</span>
                    </p>

                    {/* Quantity & Item Discount Row */}
                    <div className="flex items-center justify-between pt-1.5 gap-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-md px-1.5 py-0.5">
                          <button onClick={() => updateQty(item.variant.id, -1)} className="text-slate-500 hover:text-slate-900 font-bold">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-xs px-1">{item.qty}</span>
                          <button onClick={() => updateQty(item.variant.id, 1)} className="text-slate-500 hover:text-slate-900 font-bold">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Item Discount Column Input */}
                        <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded-md px-1.5 py-0.5">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Disc ₹</span>
                          <input
                            type="number"
                            min="0"
                            value={item.discount || ''}
                            onChange={(e) => updateItemDiscount(item.variant.id, e.target.value)}
                            placeholder="0"
                            className="w-10 text-xs font-mono font-bold text-slate-800 bg-transparent outline-none text-right"
                          />
                        </div>
                      </div>

                      <button onClick={() => removeCartItem(item.variant.id)} className="text-slate-400 hover:text-red-500 p-0.5">
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
        <div className="p-3 border-t border-slate-200 space-y-1.5 bg-white text-xs">
          <div className="flex justify-between items-center text-slate-600 font-semibold">
            <span>Subtotal ({totalItemCount} items)</span>
            <span className="font-mono font-bold text-slate-900">₹{grossSubtotal.toFixed(2)}</span>
          </div>

          {/* Bill Discount Column Row */}
          <div className="flex justify-between items-center text-slate-700 font-semibold pt-0.5">
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              Discount (₹)
            </span>
            <div className="flex items-center gap-1.5">
              {totalDiscount > 0 && (
                <span className="text-xs font-mono font-bold text-emerald-600">-₹{totalDiscount.toFixed(2)}</span>
              )}
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0.00"
                className="w-20 px-2 py-0.5 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Subtotal After Discount (Only shown when a discount is applied) */}
          {totalDiscount > 0 && (
            <div className="flex justify-between items-center text-slate-600 font-semibold">
              <span className="text-slate-700 font-medium">After Discount Subtotal</span>
              <span className="font-mono font-bold text-slate-900">₹{subtotalAfterDiscount.toFixed(2)}</span>
            </div>
          )}

          {/* GST Tax */}
          <div className="flex justify-between items-center text-slate-600 font-semibold">
            <span className="flex items-center gap-1">GST Tax <span className="text-[10px] text-slate-400">ℹ</span></span>
            <span className="font-mono font-bold text-slate-900">₹{tax.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <div>
              <span className="font-extrabold text-slate-900 text-sm block leading-none">NET TOTAL</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Inclusive of all local taxes</span>
            </div>
            <span className="text-xl font-black text-[#D49018] font-mono tracking-tight">
              ₹{total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Primary CHARGE ORDER Action Button */}
        <div className="p-3 bg-white border-t border-slate-200 space-y-2">
          <button
            type="button"
            onClick={() => cart.length > 0 && setIsPaymentModalOpen(true)}
            disabled={cart.length === 0}
            className="w-full bg-[#D49018] hover:bg-[#c28113] active:scale-[0.99] text-white font-extrabold shadow-sm rounded-xl p-2.5 flex items-center justify-between text-sm transition-all disabled:opacity-40"
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
        cartTotals={{ subtotal, tax, discountAmount, total }}
        customer={customer}
        onConfirmPayment={handleConfirmCheckout}
        theme={theme}
      />

    </div>
  );
}

