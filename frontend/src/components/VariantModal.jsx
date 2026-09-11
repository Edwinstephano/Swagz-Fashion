import React, { useState, useEffect } from 'react';
import { X, ShoppingCart } from 'lucide-react';

export default function VariantModal({ isOpen, onClose, product, onAddToCart, theme }) {
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const isDark = theme === 'dark';
  const price = selectedVariant?.price_override || product.base_price;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-all animate-fade-in ${
      isDark ? 'bg-black/75' : 'bg-slate-900/35'
    }`}>
      <div className={`border rounded-3xl w-full max-w-2xl p-6 shadow-2xl transition-all ${
        isDark
          ? 'bg-[#181B20] border-slate-800 text-white'
          : 'bg-white border-slate-200/80 text-slate-900'
      }`}>
        
        {/* Modal Header */}
        <div className={`flex items-center justify-between border-b pb-4 mb-4 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-md bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]">
                {product.brand}
              </span>
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                • {product.category}
              </span>
            </div>
            <h3 className={`font-heading text-2xl font-black tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {product.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Overview Box */}
        <div className={`flex space-x-4 mb-6 p-4 rounded-2xl border ${
          isDark ? 'bg-[#1F2229] border-slate-800' : 'bg-slate-50/90 border-slate-200/90'
        }`}>
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&q=80'}
            alt={product.name}
            className="w-20 h-20 object-cover rounded-xl border border-slate-300/80 shadow-xs shrink-0"
          />
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'} line-clamp-2`}>
              {product.description || 'Premium menswear item crafted with precision tailoring and high quality fabrics.'}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black font-mono text-[#D49018]">
                  ₹{price.toFixed(2)}
                </span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/80 text-slate-700'
                }`}>
                  +{product.tax_percent}% GST
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Variant Selection Grid */}
        <div className="mb-6">
          <label className={`block text-xs font-black uppercase tracking-wider mb-3 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Select Size & Color Variant:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
            {product.variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;

              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-[#D49018] shadow-md'
                      : isDark
                      ? 'bg-[#1F2229] border-slate-800 hover:border-slate-600 text-white hover:bg-slate-800/80'
                      : 'bg-white border-slate-200/90 hover:border-slate-400 text-slate-900 hover:bg-slate-50/90 shadow-2xs'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-extrabold text-sm flex items-center space-x-1.5">
                      <span>Size {v.size}</span>
                      <span className={isSelected ? 'text-amber-400 font-semibold' : isDark ? 'text-slate-400' : 'text-slate-500'}>
                        ({v.color})
                      </span>
                    </div>
                    <div className={`text-[11px] font-mono mt-0.5 ${
                      isSelected ? 'text-slate-300 font-semibold' : isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      SKU: {v.sku_barcode}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className={`flex items-center space-x-3 border-t pt-4 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <button
            onClick={onClose}
            className={`w-1/3 py-3 rounded-2xl border font-extrabold text-sm transition-all ${
              isDark
                ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Cancel
          </button>

          <button
            disabled={!selectedVariant}
            onClick={() => {
              onAddToCart(product, selectedVariant);
              onClose();
            }}
            className="flex-1 py-3 rounded-2xl bg-[#D49018] hover:bg-[#c28113] active:scale-[0.99] text-white font-black text-sm flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all disabled:opacity-40"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add Variant to Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
}
