import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Tag, Layers, X, Check, Image as ImageIcon } from 'lucide-react';

export default function AddProductModal({ isOpen, onClose, onProductCreated, theme }) {
  const isDark = theme === 'dark';

  // Form State
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Swagz Signature');
  const [category, setCategory] = useState('Shirts');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(1499);
  const [costPrice, setCostPrice] = useState(700);
  const [taxPercent, setTaxPercent] = useState(5);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [selectedSizes, setSelectedSizes] = useState(['S', 'M', 'L', 'XL']);
  const [selectedColors, setSelectedColors] = useState(['White', 'Navy Blue']);
  const [stockPerVariant, setStockPerVariant] = useState(15);

  // Dynamic Master Lists loaded from Settings
  const [categoriesList, setCategoriesList] = useState(['Shirts', 'Jeans', 'Suits', 'Ethnic', 'T-Shirts', 'Accessories', 'Footwear']);
  const [masterSizes, setMasterSizes] = useState(['S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44']);
  const [masterColors, setMasterColors] = useState(['White', 'Navy Blue', 'Black', 'Olive', 'Maroon', 'Beige']);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchMasterSettings();
      // Reset defaults when opening
      setName('');
      setBrand('Swagz Signature');
      setDescription('');
      setBasePrice(1499);
      setCostPrice(700);
      setTaxPercent(5);
      setImageUrl('');
      setSelectedSizes(['S', 'M', 'L', 'XL']);
      setSelectedColors(['White', 'Navy Blue']);
      setStockPerVariant(15);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const fetchMasterSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.categories) {
          const cats = data.categories.split(',').map(c => c.trim()).filter(Boolean);
          if (cats.length > 0) {
            setCategoriesList(cats);
            setCategory(cats[0]);
          }
        }
        if (data.available_sizes) {
          const sizes = data.available_sizes.split(',').map(s => s.trim()).filter(Boolean);
          if (sizes.length > 0) {
            setMasterSizes(sizes);
          }
        }
        if (data.available_colors) {
          const colors = data.available_colors.split(',').map(c => c.trim()).filter(Boolean);
          if (colors.length > 0) {
            setMasterColors(colors);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load master settings", e);
    }
  };

  if (!isOpen) return null;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/products/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.image_url);
      }
    } catch (e) {
      alert("Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();

    const generatedVariants = [];
    const skuPrefix = `SWZ-${brand.substring(0, 2).toUpperCase()}-${category.substring(0, 2).toUpperCase()}`;

    selectedSizes.forEach(size => {
      selectedColors.forEach(color => {
        const colorCode = color.substring(0, 3).toUpperCase();
        generatedVariants.push({
          size,
          color,
          sku_barcode: `${skuPrefix}-${colorCode}-${size}`,
          stock_qty: stockPerVariant
        });
      });
    });

    const payload = {
      name,
      brand,
      category,
      description,
      base_price: parseFloat(basePrice),
      cost_price: parseFloat(costPrice),
      tax_percent: parseFloat(taxPercent),
      image_url: imageUrl || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80',
      variants: generatedVariants
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onClose();
        if (onProductCreated) onProductCreated();
        alert("Product created successfully!");
      }
    } catch (e) {
      alert("Failed to create product");
    }
  };

  return createPortal(
    <div className={`fixed inset-0 z-50 overflow-hidden backdrop-blur-sm p-3 sm:p-4 md:p-6 flex justify-center items-center animate-fade-in ${
      isDark ? 'bg-black/75' : 'bg-slate-900/35'
    }`}>
      <div className={`w-full max-w-6xl lg:max-w-5xl max-h-[88vh] flex flex-col border rounded-2xl shadow-2xl overflow-hidden transition-all my-0 ${
        isDark ? 'bg-[#181B20] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className={`p-4 px-5 border-b flex justify-between items-center shrink-0 ${
          isDark ? 'border-slate-800/80 bg-[#1F2229]' : 'border-slate-200/80 bg-slate-50/80'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C9A24B] via-[#d4af37] to-[#99752b] shadow-md shadow-[#C9A24B]/30 flex items-center justify-center shrink-0 ring-2 ring-[#C9A24B]/40">
              <Sparkles className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div>
              <h3 className={`font-heading text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Add New Style & Generate Variant Matrix
              </h3>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Specify garment details, pricing, tax rates, and size × color variant matrix
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isDark 
                ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200/70'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Form Body */}
        <form onSubmit={handleCreateProduct} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
            
            {/* Basic Details Section */}
            <div>
              <h4 className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-[#C9A24B] mb-2 flex items-center space-x-2">
                <Tag className="w-3.5 h-3.5" />
                <span>Garment Info & Brand</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Linen Blend Casual Shirt"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/50 transition-all ${
                      isDark ? 'bg-[#14161A] border-slate-700/80 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/50 transition-all ${
                      isDark ? 'bg-[#14161A] border-slate-700/80 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Category & Pricing Section */}
            <div>
              <h4 className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-[#C9A24B] mb-2 flex items-center space-x-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Category & Pricing Specification</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/50 transition-all ${
                      isDark ? 'bg-[#14161A] border-slate-700/80 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Cost Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/50 transition-all ${
                      isDark ? 'bg-[#14161A] border-slate-700/80 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Retail Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={basePrice}
                    onChange={e => setBasePrice(e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/50 transition-all ${
                      isDark ? 'bg-[#14161A] border-slate-700/80 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>GST Tax Rate (%) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={taxPercent}
                    onChange={e => setTaxPercent(e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/50 transition-all ${
                      isDark ? 'bg-[#14161A] border-slate-700/80 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Product Image Upload Box */}
            <div className={`p-3.5 rounded-xl border transition-all ${isDark ? 'bg-[#14161A] border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
              <label className={`block text-xs font-bold mb-1.5 flex items-center space-x-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <ImageIcon className="w-3.5 h-3.5 text-[#C9A24B]" />
                <span>Product Image Media</span>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#C9A24B] file:text-black hover:file:bg-[#b89139] cursor-pointer"
                />
                {uploadingImage && (
                  <span className="text-xs text-amber-500 font-mono font-bold animate-pulse flex items-center space-x-1">
                    <span>Uploading image...</span>
                  </span>
                )}
                {imageUrl && (
                  <div className="flex items-center space-x-2">
                    <img src={imageUrl} alt="Uploaded preview" className="w-8 h-8 object-cover rounded-lg border border-emerald-500" />
                    <span className="text-xs text-emerald-500 font-mono font-bold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Uploaded</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Variant Matrix Generator Box */}
            <div className={`p-4 rounded-xl border space-y-3 transition-all ${
              isDark ? 'bg-[#14161A] border-slate-800' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-mono font-black text-[#C9A24B] uppercase tracking-wider flex items-center space-x-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Automated Size × Color Variant Matrix Generator</span>
                </h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#C9A24B]/15 text-[#C9A24B] border border-[#C9A24B]/30">
                  {selectedSizes.filter(Boolean).length * selectedColors.filter(Boolean).length} Variants Will Be Generated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                <div className="flex flex-col justify-between p-3.5 rounded-xl border bg-slate-50/50 dark:bg-[#15181E] border-slate-200 dark:border-slate-800">
                  <div>
                    <label className={`text-xs font-bold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Sizes (Comma separated):
                    </label>
                    <input
                      type="text"
                      value={selectedSizes.join(', ')}
                      onChange={e => setSelectedSizes(e.target.value.split(',').map(s => s.trim()))}
                      className={`w-full border rounded-xl px-3 py-2 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/50 transition-all ${
                        isDark ? 'bg-[#1F2229] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                    {masterSizes.map(sz => {
                      const active = selectedSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            if (active) {
                              setSelectedSizes(selectedSizes.filter(s => s !== sz));
                            } else {
                              setSelectedSizes([...selectedSizes, sz]);
                            }
                          }}
                          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center space-x-1 ${
                            active
                              ? 'bg-[#C9A24B] text-slate-950 border-[#C9A24B] shadow-xs'
                              : isDark ? 'bg-[#1F2229] text-slate-400 border-slate-700 hover:text-white hover:border-slate-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span>{active ? `✓ ${sz}` : `+ ${sz}`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col justify-between p-3.5 rounded-xl border bg-slate-50/50 dark:bg-[#15181E] border-slate-200 dark:border-slate-800">
                  <div>
                    <label className={`text-xs font-bold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Colors (Comma separated):
                    </label>
                    <input
                      type="text"
                      value={selectedColors.join(', ')}
                      onChange={e => setSelectedColors(e.target.value.split(',').map(c => c.trim()))}
                      className={`w-full border rounded-xl px-3 py-2 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/50 transition-all ${
                        isDark ? 'bg-[#1F2229] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                    {masterColors.map(cl => {
                      const active = selectedColors.includes(cl);
                      return (
                        <button
                          key={cl}
                          type="button"
                          onClick={() => {
                            if (active) {
                              setSelectedColors(selectedColors.filter(c => c !== cl));
                            } else {
                              setSelectedColors([...selectedColors, cl]);
                            }
                          }}
                          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center space-x-1 ${
                            active
                              ? 'bg-[#C9A24B] text-slate-950 border-[#C9A24B] shadow-xs'
                              : isDark ? 'bg-[#1F2229] text-slate-400 border-slate-700 hover:text-white hover:border-slate-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span>{active ? `✓ ${cl}` : `+ ${cl}`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className={`p-3.5 px-5 border-t flex justify-end items-center space-x-3 shrink-0 ${
            isDark ? 'border-slate-800 bg-[#1F2229]' : 'border-slate-200/80 bg-slate-50/80'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`py-2 px-4 rounded-xl border text-xs font-bold transition-all ${
                isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-5 rounded-xl bg-[#C9A24B] hover:bg-[#b89139] text-black font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-2"
            >
              <span>Create Product & Variant Matrix</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
