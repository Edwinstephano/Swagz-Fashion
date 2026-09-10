import React, { useState, useEffect } from 'react';
import { Plus, Upload, Tag, Search, Edit3, Trash2, Layers, Archive, RotateCcw, Eye } from 'lucide-react';

export default function ProductsView({ currentUser, theme }) {
  const isDark = theme === 'dark';
  const [products, setProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'archived', 'all'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  useEffect(() => {
    fetchProducts(statusFilter);
  }, [statusFilter]);

  const fetchProducts = async (status = statusFilter) => {
    try {
      const res = await fetch(`/api/products?status=${status}`);
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch products", e);
    }
  };

  const handleArchiveProduct = async (id, productName) => {
    if (!window.confirm(`Archive "${productName}"? It will be hidden from POS sales until reopened.`)) return;
    try {
      const res = await fetch(`/api/products/${id}/archive`, { method: 'PUT' });
      if (res.ok) {
        fetchProducts(statusFilter);
      }
    } catch (e) {
      alert("Failed to archive product");
    }
  };

  const handleReopenProduct = async (id, productName) => {
    try {
      const res = await fetch(`/api/products/${id}/reopen`, { method: 'PUT' });
      if (res.ok) {
        fetchProducts(statusFilter);
        alert(`"${productName}" has been reopened and restored to POS catalog!`);
      }
    } catch (e) {
      alert("Failed to reopen product");
    }
  };

  const handleDeleteProduct = async (id, productName) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE "${productName}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/products/${id}?permanent=true`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts(statusFilter);
      }
    } catch (e) {
      alert("Failed to delete product");
    }
  };

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
        setIsAddModalOpen(false);
        fetchProducts(statusFilter);
        alert("Product created successfully!");
      }
    } catch (e) {
      alert("Failed to create product");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className={`p-5 rounded-2xl border flex justify-between items-center card-interactive ${
        isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div>
          <h2 className={`font-heading text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Product Catalog & Variant Matrix
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-1">Manage menswear styles, footwear, barcodes, stock levels, archive, and upload images</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-[#C9A24B] hover:bg-[#b89139] text-black font-bold text-sm flex items-center space-x-2 shadow-xs btn-interactive cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Menswear / Footwear Style</span>
        </button>
      </div>

      {/* Filter Tabs (Active vs Archived vs All) */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            statusFilter === 'active'
              ? 'bg-[#C9A24B] text-black shadow-xs'
              : isDark ? 'bg-[#1F2229] text-slate-300 border border-[#2A2E39] hover:bg-[#2A2E39]' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Active Products
        </button>
        <button
          onClick={() => setStatusFilter('archived')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            statusFilter === 'archived'
              ? 'bg-amber-600 text-white shadow-xs'
              : isDark ? 'bg-[#1F2229] text-slate-300 border border-[#2A2E39] hover:bg-[#2A2E39]' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Archived Products
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            statusFilter === 'all'
              ? 'bg-slate-700 text-white shadow-xs'
              : isDark ? 'bg-[#1F2229] text-slate-300 border border-[#2A2E39] hover:bg-[#2A2E39]' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Products
        </button>
      </div>

      {/* Catalog Table */}
      <div className={`border rounded-2xl overflow-hidden shadow-xs ${
        isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`text-xs font-mono uppercase border-b ${
              isDark ? 'bg-[#14161A] text-gray-400 border-[#2A2E39]' : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              <tr>
                <th className="p-4">Product Details</th>
                <th className="p-4">Brand / Category</th>
                <th className="p-4">Base Price</th>
                <th className="p-4">Variants Matrix</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#2A2E39] text-gray-300' : 'divide-slate-200 text-slate-700'}`}>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 font-medium text-xs">
                    No products found in "{statusFilter}" list.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  return (
                    <tr key={p.id} className={isDark ? 'hover:bg-[#2A2E39]/40' : 'hover:bg-slate-50'}>
                      <td className="p-4 flex items-center space-x-3">
                        <img
                          src={p.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100&q=80'}
                          alt={p.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100&q=80';
                          }}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-300 shrink-0"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.name}</span>
                            {!p.is_active && (
                              <span className="px-2 py-0.5 text-[9px] font-extrabold bg-amber-500/20 text-amber-500 rounded border border-amber-500/30 uppercase">
                                ARCHIVED
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 line-clamp-1">{p.description}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.brand}</span>
                        <span className="text-xs text-[#C9A24B] block font-mono">{p.category} ({p.tax_percent}% GST)</span>
                      </td>
                      <td className={`p-4 font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        ₹{p.base_price.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.variants?.map(v => (
                            <span key={v.id} className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                              isDark ? 'bg-[#14161A] border-gray-700 text-gray-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                            }`}>
                              {v.size}/{v.color}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {p.is_active ? (
                            <button
                              onClick={() => handleArchiveProduct(p.id, p.name)}
                              title="Archive Product"
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-all"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReopenProduct(p.id, p.name)}
                              title="Reopen / Restore Product"
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-all flex items-center space-x-1 font-bold text-xs"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Reopen</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            title="Delete Permanently"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enlarged Create Product Modal Dialog (max-w-4xl = 896px wide) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 overflow-y-auto">
          <div className={`border rounded-3xl w-full max-w-4xl p-8 shadow-2xl transition-all ${
            isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center border-b pb-4 mb-6 border-slate-200">
              <div>
                <h3 className={`font-heading text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Add New Style & Generate Variant Matrix
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Specify garment details, pricing, tax rates, and generate size × color variant matrix</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-slate-900 font-bold p-2 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Linen Blend Casual Shirt"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-3 text-sm font-medium ${
                      isDark ? 'bg-[#14161A] border-gray-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-3 text-sm font-medium ${
                      isDark ? 'bg-[#14161A] border-gray-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-3 text-sm font-medium ${
                      isDark ? 'bg-[#14161A] border-gray-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option>Shirts</option>
                    <option>Jeans</option>
                    <option>Suits</option>
                    <option>Ethnic</option>
                    <option>T-Shirts</option>
                    <option>Accessories</option>
                    <option>Footwear</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={e => setBasePrice(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-3 font-mono text-sm font-bold ${
                      isDark ? 'bg-[#14161A] border-gray-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GST Tax %</label>
                  <input
                    type="number"
                    required
                    value={taxPercent}
                    onChange={e => setTaxPercent(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-3 font-mono text-sm font-bold ${
                      isDark ? 'bg-[#14161A] border-gray-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Product Image Upload Box */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#14161A] border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
                <label className="block text-xs font-bold text-slate-700 mb-2">Product Image Upload</label>
                <div className="flex space-x-4 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#C9A24B] file:text-black hover:file:bg-[#b89139]"
                  />
                  {uploadingImage && <span className="text-xs text-amber-600 font-mono font-bold">Uploading image...</span>}
                  {imageUrl && <span className="text-xs text-emerald-600 font-mono font-bold">✅ Image Uploaded Successfully</span>}
                </div>
              </div>

              {/* Variant Matrix Generator Box */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#14161A] border-gray-800' : 'bg-slate-50 border-slate-300'
              }`}>
                <h4 className="text-xs font-black text-[#C9A24B] uppercase tracking-wider">
                  Automated Size × Color Variant Matrix Builder
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Sizes (Comma separated):</label>
                    <input
                      type="text"
                      value={selectedSizes.join(', ')}
                      onChange={e => setSelectedSizes(e.target.value.split(',').map(s => s.trim()))}
                      className={`w-full border rounded-xl px-3 py-2 font-mono text-xs font-bold ${
                        isDark ? 'bg-[#1F2229] border-gray-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Colors (Comma separated):</label>
                    <input
                      type="text"
                      value={selectedColors.join(', ')}
                      onChange={e => setSelectedColors(e.target.value.split(',').map(c => c.trim()))}
                      className={`w-full border rounded-xl px-3 py-2 font-mono text-xs font-bold ${
                        isDark ? 'bg-[#1F2229] border-gray-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-3 px-6 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-3 px-8 rounded-xl bg-[#C9A24B] hover:bg-[#b89139] text-black font-extrabold text-sm shadow-md"
                >
                  Create Product & Variant Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
