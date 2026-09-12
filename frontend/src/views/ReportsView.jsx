import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, TrendingUp, AlertTriangle, DollarSign, PieChart,
  ShoppingBag, RefreshCw, ArrowUpRight, ArrowDownRight, Award, Zap, Layers,
  CreditCard, Download, CheckCircle2, Search, Calendar, Users, Filter,
  FileSpreadsheet, Printer, FileText, ChevronRight, X, Clock, HelpCircle, Package, Sliders
} from 'lucide-react';

export default function ReportsView({ theme }) {
  const isDark = theme === 'dark';

  // State Management
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'sales', 'products', 'inventory', 'customers', 'staff', 'profitability'
  const [dateRange, setDateRange] = useState('7d'); // 'today', 'yesterday', '7d', 'last_week', 'this_month', 'last_month', 'this_quarter', 'this_year', 'custom'
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  
  // Global Filters
  const [filterCashier, setFilterCashier] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMode, setFilterPaymentMode] = useState('all');
  const [filterSalesType, setFilterSalesType] = useState('all');
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  // Data States
  const [kpis, setKpis] = useState(null);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [salesCategory, setSalesCategory] = useState([]);
  const [salesBrand, setSalesBrand] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [cashierPerformance, setCashierPerformance] = useState([]);
  const [hourlyTrend, setHourlyTrend] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [customerAnalytics, setCustomerAnalytics] = useState([]);
  const [tillReconciliation, setTillReconciliation] = useState([]);

  // Product Table Filters & Pagination
  const [prodSearch, setProdSearch] = useState('');
  const [prodTopLimit, setProdTopLimit] = useState(10);
  const [prodSortBy, setProdSortBy] = useState('revenue');
  const [slowDaysFilter, setSlowDaysFilter] = useState('30');

  // Drill-Down Modal State
  const [activeModal, setActiveModal] = useState(null); // { type: 'category' | 'product' | 'day' | 'cashier', data: any }
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, [dateRange, filterCashier, filterCategory, filterPaymentMode, filterSalesType]);

  const fetchReportData = async () => {
    setIsRefreshing(true);
    try {
      const days = dateRange === 'today' ? 1 : dateRange === 'yesterday' ? 2 : dateRange === '7d' ? 7 : dateRange === 'this_month' ? 30 : 90;

      const [rKpis, rDaily, rCat, rBrand, rProd, rPay, rCashier, rHourly, rLow, rCust, rTill] = await Promise.all([
        fetch(`/api/reports/kpis?start_date=${customFrom}&end_date=${customTo}`).then(r => r.ok ? r.json() : null),
        fetch(`/api/reports/daily-trend?days=${days}`).then(r => r.ok ? r.json() : []),
        fetch('/api/reports/sales-by-category').then(r => r.ok ? r.json() : []),
        fetch('/api/reports/sales-by-brand').then(r => r.ok ? r.json() : []),
        fetch('/api/reports/product-performance?limit=50').then(r => r.ok ? r.json() : []),
        fetch('/api/reports/payment-modes').then(r => r.ok ? r.json() : []),
        fetch('/api/reports/cashier-performance').then(r => r.ok ? r.json() : []),
        fetch('/api/reports/hourly-trend').then(r => r.ok ? r.json() : []),
        fetch('/api/reports/low-stock').then(r => r.ok ? r.json() : []),
        fetch('/api/reports/customer-analytics').then(r => r.ok ? r.json() : []),
        fetch('/api/reports/till-reconciliation').then(r => r.ok ? r.json() : [])
      ]);

      if (rKpis && !rKpis.detail) setKpis(rKpis);
      if (Array.isArray(rDaily)) setDailyTrend(rDaily);
      if (Array.isArray(rCat)) setSalesCategory(rCat);
      if (Array.isArray(rBrand)) setSalesBrand(rBrand);
      if (Array.isArray(rProd)) setProductPerformance(rProd);
      if (Array.isArray(rPay)) setPaymentModes(rPay);
      if (Array.isArray(rCashier)) setCashierPerformance(rCashier);
      if (Array.isArray(rHourly)) setHourlyTrend(rHourly);
      if (Array.isArray(rLow)) setLowStock(rLow);
      if (Array.isArray(rCust)) setCustomerAnalytics(rCust);
      if (Array.isArray(rTill)) setTillReconciliation(rTill);

      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error("Failed to load report analytics", e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  // Indian Currency Formatter
  const formatINR = (amount) => {
    const val = Number(amount) || 0;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
  };

  // Safe Computations
  const safeDailyTrend = useMemo(() => Array.isArray(dailyTrend) ? dailyTrend : [], [dailyTrend]);
  const maxDailyRev = useMemo(() => Math.max(...safeDailyTrend.map(d => d.revenue || 0), 1000), [safeDailyTrend]);
  
  const totalCatRev = useMemo(() => salesCategory.reduce((sum, c) => sum + (c.revenue || 0), 0) || 1, [salesCategory]);
  const totalBrandRev = useMemo(() => salesBrand.reduce((sum, b) => sum + (b.revenue || 0), 0) || 1, [salesBrand]);
  const totalPayVol = useMemo(() => paymentModes.reduce((sum, p) => sum + (p.amount || 0), 0) || 1, [paymentModes]);

  // Product Performance Filtered
  const filteredProducts = useMemo(() => {
    let list = [...productPerformance];
    if (prodSearch.trim()) {
      const q = prodSearch.toLowerCase();
      list = list.filter(p =>
        p.product_name.toLowerCase().includes(q) ||
        p.sku_barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (b[prodSortBy] || 0) - (a[prodSortBy] || 0));
    return list;
  }, [productPerformance, prodSearch, prodSortBy]);

  const topProducts = useMemo(() => filteredProducts.slice(0, prodTopLimit), [filteredProducts, prodTopLimit]);

  // Export handlers
  const handleExportCSV = () => {
    const csvRows = [
      ["SWAGZ FASHION RETAIL POS - EXECUTIVE BI REPORT"],
      ["Date Generated", new Date().toLocaleString()],
      ["Date Range Filter", dateRange.toUpperCase()],
      [],
      ["1. FINANCIAL KPIS"],
      ["Gross Sales", formatINR(kpis?.gross_sales)],
      ["Discounts Amount", formatINR(kpis?.total_discounts)],
      ["Returns Amount", formatINR(kpis?.total_returns)],
      ["Net Sales", formatINR(kpis?.net_sales)],
      ["COGS (Cost of Goods Sold)", formatINR(kpis?.cogs)],
      ["Gross Profit", formatINR(kpis?.gross_profit)],
      ["Gross Margin %", `${kpis?.gross_margin_pct}%`],
      ["Total Completed Orders", kpis?.total_count || 0],
      ["Total Items Sold", kpis?.items_sold || 0],
      ["Average Order Value (AOV)", formatINR(kpis?.aov)],
      [],
      ["2. PRODUCT PERFORMANCE"],
      ["Product Name", "SKU", "Category", "Qty Sold", "Revenue", "Cost", "Gross Profit", "Margin %"],
      ...filteredProducts.map(p => [p.product_name, p.sku_barcode, p.category, p.qty_sold, p.revenue, p.cost, p.profit, `${p.margin_pct}%`]),
      [],
      ["3. CASHIER PERFORMANCE"],
      ["Cashier Name", "Total Bills", "Sales Revenue", "Discounts Given", "Gross Profit"],
      ...cashierPerformance.map(c => [c.cashier, c.bills, c.revenue, c.discounts, c.profit]),
      [],
      ["4. PAYMENT METHODS RECONCILIATION"],
      ["Payment Mode", "Volume Amount", "Transaction Count", "Percentage Share"],
      ...paymentModes.map(p => [p.mode, p.amount, p.count, `${((p.amount / totalPayVol) * 100).toFixed(1)}%`])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Swagz_Executive_Report_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage("📊 Full Executive Report exported to CSV / Excel spreadsheet successfully!");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-[1650px] mx-auto space-y-6 animate-fade-in print:p-0">
      
      {/* 1. REPORT PAGE HEADER */}
      <div className={`p-6 rounded-2xl border flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 transition-all shadow-sm ${
        isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`font-heading text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Reports & Analytics
              </h1>
              <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Monitor sales, revenue, profit, products, inventory, customers, and store performance.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Date Preset Filter */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
          
          {/* Date Presets */}
          <div className={`flex flex-wrap items-center p-1 rounded-xl border space-x-1 ${
            isDark ? 'bg-[#101217] border-[#222631]' : 'bg-slate-100 border-slate-200'
          }`}>
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'custom', label: 'Custom' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setDateRange(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dateRange === f.id
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          {dateRange === 'custom' && (
            <div className="flex items-center space-x-2 animate-fade-in">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none font-mono ${
                  isDark ? 'bg-[#101217] border-[#222631] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none font-mono ${
                  isDark ? 'bg-[#101217] border-[#222631] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
              <button
                onClick={fetchReportData}
                className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-xs hover:bg-amber-400"
              >
                Apply
              </button>
            </div>
          )}

          {/* Refresh Data */}
          <button
            onClick={fetchReportData}
            disabled={isRefreshing}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
              isDark ? 'bg-[#101217] border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline font-mono text-[11px]">Updated {lastUpdated}</span>
          </button>

          {/* Export Report Options */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer ${
                isDark 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-950/40' 
                  : 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-emerald-200'
              }`}
              title="Export Report Data to CSV / Excel Spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export to Excel / CSV</span>
            </button>
            
            <button
              onClick={handlePrintReport}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark ? 'bg-[#101217] border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Print Executive Report"
            >
              <Printer className="w-4 h-4 text-amber-500" />
            </button>
          </div>

        </div>
      </div>

      {/* Toast Notification for Export */}
      {toastMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-mono font-bold border flex items-center space-x-2 transition-all animate-fade-in ${
          isDark ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Filter Toolbar */}
      <div className={`p-4 rounded-xl border flex flex-wrap items-center gap-4 text-xs ${
        isDark ? 'bg-[#14161C] border-[#262A36]' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center space-x-2 font-bold text-gray-400">
          <Filter className="w-3.5 h-3.5 text-amber-500" />
          <span>Global Filters:</span>
        </div>

        {/* Cashier Filter */}
        <select
          value={filterCashier}
          onChange={e => setFilterCashier(e.target.value)}
          className={`px-3 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
            isDark ? 'bg-[#101217] border-[#222631] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <option value="all">All Cashiers / Tills</option>
          {cashierPerformance.map((c, i) => (
            <option key={i} value={c.cashier}>{c.cashier}</option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className={`px-3 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
            isDark ? 'bg-[#101217] border-[#222631] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <option value="all">All Categories</option>
          {salesCategory.map((cat, i) => (
            <option key={i} value={cat.category}>{cat.category}</option>
          ))}
        </select>

        {/* Payment Mode Filter */}
        <select
          value={filterPaymentMode}
          onChange={e => setFilterPaymentMode(e.target.value)}
          className={`px-3 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
            isDark ? 'bg-[#101217] border-[#222631] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <option value="all">All Payment Methods</option>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="CARD">Card</option>
        </select>

        {/* Sales Type Filter */}
        <select
          value={filterSalesType}
          onChange={e => setFilterSalesType(e.target.value)}
          className={`px-3 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
            isDark ? 'bg-[#101217] border-[#222631] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <option value="all">All Transactions</option>
          <option value="confirmed">Confirmed Sales</option>
          <option value="returns">Returns & Refunds</option>
        </select>

        {(filterCashier !== 'all' || filterCategory !== 'all' || filterPaymentMode !== 'all' || filterSalesType !== 'all') && (
          <button
            onClick={() => { setFilterCashier('all'); setFilterCategory('all'); setFilterPaymentMode('all'); setFilterSalesType('all'); }}
            className="text-amber-500 font-bold hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Analytics Main Tab Navigation Bar */}
      <div className={`flex items-center space-x-1 border-b pb-1 overflow-x-auto ${
        isDark ? 'border-gray-800' : 'border-slate-200'
      }`}>
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'sales', label: '📈 Sales & Trends' },
          { id: 'products', label: '👕 Product Analytics' },
          { id: 'inventory', label: '📦 Inventory Overview' },
          { id: 'customers', label: '👥 Customer Insights' },
          { id: 'staff', label: '💼 Staff & Till Performance' },
          { id: 'profitability', label: '💰 Profitability Matrix' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-heading text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: 📊 OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* SECTION 2: TOP 8 KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Total Sales */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className={`text-xs font-sans font-bold uppercase tracking-wider block ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>1. Total Sales</span>
              <div className="flex justify-between items-baseline">
                <h3 className={`text-2xl font-black font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatINR(kpis?.gross_sales || kpis?.today_sales)}
                </h3>
                <span className={`text-xs font-bold flex items-center ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  <ArrowUpRight className="w-3.5 h-3.5" /> 12.4%
                </span>
              </div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{kpis?.today_count || kpis?.total_count || 0} completed invoices</p>
            </div>

            {/* KPI 2: Net Revenue */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className={`text-xs font-sans font-bold uppercase tracking-wider block ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>2. Net Revenue</span>
              <div className="flex justify-between items-baseline">
                <h3 className={`text-2xl font-black font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatINR(kpis?.net_sales)}
                </h3>
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Post Discounts & Returns</span>
              </div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Discounts deducted: <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{formatINR(kpis?.total_discounts)}</strong></p>
            </div>

            {/* KPI 3: Gross Profit & Margin % */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className={`text-xs font-sans font-bold uppercase tracking-wider block ${isDark ? 'text-sky-400' : 'text-sky-800'}`}>3. Gross Profit</span>
              <div className="flex justify-between items-baseline">
                <h3 className={`text-2xl font-black font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatINR(kpis?.gross_profit)}
                </h3>
                <span className={`px-2.5 py-0.5 rounded font-sans text-xs font-bold border ${
                  isDark ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'bg-sky-50 text-sky-800 border-sky-200'
                }`}>
                  {kpis?.gross_margin_pct}% Margin
                </span>
              </div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>COGS Cost: <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{formatINR(kpis?.cogs)}</strong></p>
            </div>

            {/* KPI 4: Total Items Sold */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className={`text-xs font-sans font-bold uppercase tracking-wider block ${isDark ? 'text-purple-400' : 'text-purple-800'}`}>4. Total Items Sold</span>
              <div className="flex justify-between items-baseline">
                <h3 className={`text-2xl font-black font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {kpis?.items_sold || 0} pcs
                </h3>
                <span className={`text-xs font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{kpis?.avg_items_per_invoice} pcs/bill</span>
              </div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Garments & footwear units</p>
            </div>

            {/* KPI 5: Total Discounts */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className={`text-xs font-sans font-bold uppercase tracking-wider block ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>5. Total Discounts</span>
              <div className="flex justify-between items-baseline">
                <h3 className={`text-2xl font-black font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatINR(kpis?.total_discounts)}
                </h3>
                <span className={`text-xs font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{kpis?.discount_pct}% of sales</span>
              </div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Promo & cashier override</p>
            </div>

            {/* KPI 6: Total Returns */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className={`text-xs font-sans font-bold uppercase tracking-wider block ${isDark ? 'text-red-400' : 'text-red-800'}`}>6. Total Returns</span>
              <div className="flex justify-between items-baseline">
                <h3 className={`text-2xl font-black font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatINR(kpis?.total_returns)}
                </h3>
                <span className={`text-xs font-bold ${isDark ? 'text-red-300' : 'text-red-700'}`}>{kpis?.return_rate_pct}% return rate</span>
              </div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{kpis?.returned_items} items returned</p>
            </div>

            {/* KPI 7: Average Order Value (AOV) */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className={`text-xs font-sans font-bold uppercase tracking-wider block ${isDark ? 'text-teal-400' : 'text-teal-800'}`}>7. Average Order Value</span>
              <div className="flex justify-between items-baseline">
                <h3 className={`text-2xl font-black font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatINR(kpis?.aov)}
                </h3>
                <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Per Invoice</span>
              </div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Basket size optimizer</p>
            </div>

            {/* KPI 8: Customers */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className={`text-xs font-sans font-bold uppercase tracking-wider block ${isDark ? 'text-indigo-400' : 'text-indigo-800'}`}>8. Customers</span>
              <div className="flex justify-between items-baseline">
                <h3 className={`text-2xl font-black font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {kpis?.total_customers || 0}
                </h3>
                <span className={`text-xs font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>{kpis?.new_customers} New</span>
              </div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{kpis?.returning_customers} returning buyers</p>
            </div>

          </div>

          {/* SECTION 3: SALES OVERVIEW CHART */}
          <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  <span>Sales Trend (Gross Sales vs Net Sales)</span>
                </h3>
                <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Daily transaction volume and revenue generation</p>
              </div>

              <div className="flex items-center space-x-4 text-xs font-mono font-bold">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500"></span>
                  <span className={isDark ? 'text-[#E2E8F0]' : 'text-slate-800'}>Gross Sales</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-400"></span>
                  <span className={isDark ? 'text-[#E2E8F0]' : 'text-slate-800'}>Net Profit</span>
                </div>
              </div>
            </div>

            {/* Simple Clean Column Chart */}
            <div className="pt-4 pb-2">
              <div className="h-56 flex items-end justify-between space-x-2 border-b pb-3 border-slate-200 dark:border-gray-800">
                {safeDailyTrend.map((d, i) => {
                  const heightPct = maxDailyRev > 0 ? (d.revenue / maxDailyRev) * 100 : 0;
                  return (
                    <div
                      key={i}
                      onClick={() => setActiveModal({ type: 'day', data: d })}
                      className="flex-1 flex flex-col items-center group relative cursor-pointer"
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-all absolute -top-12 bg-slate-950 text-white text-xs font-mono p-2 rounded-xl border border-amber-500/40 pointer-events-none whitespace-nowrap z-20">
                        <div className="font-bold text-amber-400">{d.date}</div>
                        <div>Revenue: {formatINR(d.revenue)}</div>
                        <div className="text-gray-400">{d.count} invoices</div>
                      </div>

                      <div
                        className="w-full max-w-[36px] bg-amber-500 hover:bg-amber-400 rounded-t-xl transition-all"
                        style={{ height: `${Math.max(heightPct, 6)}%` }}
                      ></div>

                      <span className={`text-[10px] font-mono mt-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                        {d.date.split('-').slice(1).join('/')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 4 & 9: PAYMENT SUMMARY & PAYMENT METHOD ANALYSIS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Payment Method Distribution */}
            <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
              <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <CreditCard className="w-5 h-5 text-sky-400" />
                <span>Payment Method Distribution</span>
              </h3>

              <div className="grid grid-cols-3 gap-3">
                {paymentModes.map((p, idx) => {
                  const percent = ((p.amount / totalPayVol) * 100).toFixed(1);
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveModal({ type: 'payment', data: p })}
                      className={`p-4 rounded-xl border space-y-1 text-center cursor-pointer transition-all hover:border-amber-500 ${
                        isDark ? 'bg-[#101217] border-[#222631]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className={`text-xs font-bold block ${isDark ? 'text-gray-400' : 'text-slate-700'}`}>{p.mode}</span>
                      <span className={`text-lg font-black font-mono block ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{formatINR(p.amount)}</span>
                      <span className={`text-[11px] font-mono block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{percent}% volume</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 10: PAYMENT SUMMARY RECONCILIATION */}
            <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
              <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>Payment Reconciliation Summary</span>
              </h3>

              <div className="space-y-2.5 text-xs font-mono">
                <div className={`flex justify-between p-3 rounded-xl border ${
                  isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50/90 border-emerald-200'
                }`}>
                  <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-emerald-950'}`}>Cash Collected:</span>
                  <span className={`font-extrabold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{formatINR(paymentModes.find(p=>p.mode==='CASH')?.amount || 0)}</span>
                </div>

                <div className={`flex justify-between p-3 rounded-xl border ${
                  isDark ? 'bg-sky-500/10 border-sky-500/20' : 'bg-sky-50/90 border-sky-200'
                }`}>
                  <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-sky-950'}`}>UPI / QR Collected:</span>
                  <span className={`font-extrabold ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>{formatINR(paymentModes.find(p=>p.mode==='UPI')?.amount || 0)}</span>
                </div>

                <div className={`flex justify-between p-3 rounded-xl border ${
                  isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50/90 border-amber-200'
                }`}>
                  <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-amber-950'}`}>Card Collected:</span>
                  <span className={`font-extrabold ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>{formatINR(paymentModes.find(p=>p.mode==='CARD')?.amount || 0)}</span>
                </div>

                <div className={`flex justify-between p-3 rounded-xl border ${
                  isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50/90 border-purple-200'
                }`}>
                  <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-purple-950'}`}>Total Collected Volume:</span>
                  <span className={`font-extrabold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{formatINR(totalPayVol)}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: 📈 SALES & TRENDS TAB */}
      {activeTab === 'sales' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* SECTION 11 & 12: HOURLY SALES & DAY OF WEEK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Hourly Sales (Busiest Hours) */}
            <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
              <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Clock className="w-5 h-5 text-amber-500" />
                <span>Sales by Hour (Staff Shift Planning)</span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Peak customer checkout rush times</p>

              <div className="h-44 flex items-end justify-between space-x-1 border-b pb-2 border-slate-200 dark:border-gray-800 pt-2">
                {hourlyTrend.map((h) => (
                  <div key={h.hour_num} className="flex-1 flex flex-col items-center group relative">
                    <div className="w-full bg-amber-500 hover:bg-amber-400 rounded-t transition-all" style={{ height: `${Math.max((h.revenue / 1000) * 10, 4)}%` }}></div>
                    {h.hour_num % 3 === 0 && <span className={`text-[9px] font-mono mt-1 ${isDark ? 'text-gray-500' : 'text-slate-600'}`}>{h.hour_num}h</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Discount & Return Analytics (Section 13 & 14) */}
            <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
              <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>Discounts & Returns Analysis</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3.5 rounded-xl border text-center space-y-1 ${
                  isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
                }`}>
                  <span className={`text-xs font-bold block ${isDark ? 'text-amber-400' : 'text-amber-950'}`}>Total Discounts</span>
                  <span className={`text-lg font-black font-mono block ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{formatINR(kpis?.total_discounts)}</span>
                  <span className={`text-[10px] font-mono block ${isDark ? 'text-gray-400' : 'text-amber-900/80'}`}>{kpis?.discount_pct}% rate</span>
                </div>

                <div className={`p-3.5 rounded-xl border text-center space-y-1 ${
                  isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
                }`}>
                  <span className={`text-xs font-bold block ${isDark ? 'text-red-400' : 'text-red-950'}`}>Total Returns</span>
                  <span className={`text-lg font-black font-mono block ${isDark ? 'text-red-400' : 'text-red-700'}`}>{formatINR(kpis?.total_returns)}</span>
                  <span className={`text-[10px] font-mono block ${isDark ? 'text-gray-400' : 'text-red-900/80'}`}>{kpis?.return_rate_pct}% return rate</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: 👕 PRODUCT ANALYTICS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* SECTION 7 & 8: TOP SELLING PRODUCTS & DETAILED PRODUCT TABLE */}
          <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Package className="w-5 h-5 text-amber-500" />
                  <span>Product Performance & Profitability Table</span>
                </h3>
                <p className="text-xs text-gray-400">Detailed garment sales, SKU costs, and gross margins</p>
              </div>

              {/* Search & Top Limit */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search product or SKU..."
                    value={prodSearch}
                    onChange={e => setProdSearch(e.target.value)}
                    className={`pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none font-mono ${
                      isDark ? 'bg-[#101217] border-[#222631] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <select
                  value={prodTopLimit}
                  onChange={e => setProdTopLimit(Number(e.target.value))}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono outline-none ${
                    isDark ? 'bg-[#101217] border-[#222631] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                  <option value={50}>All Products</option>
                </select>
              </div>
            </div>

            {/* Product Performance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className={`border-b ${isDark ? 'bg-[#101217] border-gray-800 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Qty Sold</th>
                    <th className="p-3 text-right">Revenue</th>
                    <th className="p-3 text-right">Cost</th>
                    <th className="p-3 text-right">Gross Profit</th>
                    <th className="p-3 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {topProducts.map((p, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setActiveModal({ type: 'product', data: p })}
                      className={`hover:bg-amber-500/10 cursor-pointer transition-all ${isDark ? 'text-slate-200' : 'text-slate-900'}`}
                    >
                      <td className="p-3 font-bold">{p.product_name}</td>
                      <td className={`p-3 ${isDark ? 'text-gray-400' : 'text-slate-600 font-semibold'}`}>{p.sku_barcode}</td>
                      <td className="p-3">{p.category}</td>
                      <td className="p-3 text-right font-bold">{p.qty_sold}</td>
                      <td className={`p-3 text-right font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{formatINR(p.revenue)}</td>
                      <td className={`p-3 text-right ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{formatINR(p.cost)}</td>
                      <td className={`p-3 text-right font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{formatINR(p.profit)}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.margin_pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: 📦 INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* SECTION 15: INVENTORY KPI OVERVIEW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className={`p-4 rounded-xl border space-y-1 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
              <span className={`text-[10px] font-mono font-bold uppercase ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Total Products</span>
              <h4 className={`text-xl font-black font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{kpis?.active_products || 0}</h4>
            </div>

            <div className={`p-4 rounded-xl border space-y-1 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
              <span className={`text-[10px] font-mono font-bold uppercase ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Total Stock Units</span>
              <h4 className={`text-xl font-black font-mono ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>{kpis?.total_stock_units || 0} pcs</h4>
            </div>

            <div className={`p-4 rounded-xl border space-y-1 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
              <span className={`text-[10px] font-mono font-bold uppercase ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Low Stock Items</span>
              <h4 className={`text-xl font-black font-mono ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{kpis?.low_stock_count || 0}</h4>
            </div>

            <div className={`p-4 rounded-xl border space-y-1 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
              <span className={`text-[10px] font-mono font-bold uppercase ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Out of Stock</span>
              <h4 className={`text-xl font-black font-mono ${isDark ? 'text-red-400' : 'text-red-600'}`}>{kpis?.out_of_stock_count || 0}</h4>
            </div>

            <div className={`p-4 rounded-xl border space-y-1 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
              <span className={`text-[10px] font-mono font-bold uppercase ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Inventory Value</span>
              <h4 className={`text-xl font-black font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{formatINR((kpis?.total_stock_units || 0) * 800)}</h4>
            </div>
          </div>

          {/* Low Stock Table (Section 17) */}
          <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Low-Stock Inventory Report</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className={`border-b ${isDark ? 'bg-[#101217] border-gray-800 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Brand</th>
                    <th className="p-3">Size</th>
                    <th className="p-3 text-right">Current Stock</th>
                    <th className="p-3 text-right">Reorder Level</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-800/40' : 'divide-slate-200'}`}>
                  {lowStock.map((item, idx) => (
                    <tr key={idx} className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                      <td className="p-3 font-bold">{item.product_name}</td>
                      <td className={`p-3 ${isDark ? 'text-gray-400' : 'text-slate-600 font-semibold'}`}>{item.sku_barcode}</td>
                      <td className="p-3">{item.brand}</td>
                      <td className="p-3">{item.size}</td>
                      <td className={`p-3 text-right font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{item.stock_qty}</td>
                      <td className="p-3 text-right">{item.reorder_level}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isDark ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: 👥 CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div className="space-y-6 animate-fade-in">
          <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Top Customer Spend Rankings</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className={`border-b ${isDark ? 'bg-[#101217] border-gray-800 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  <tr>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3 text-right">Orders</th>
                    <th className="p-3 text-right">Items Purchased</th>
                    <th className="p-3 text-right">Total Net Spend</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-800/40' : 'divide-slate-200'}`}>
                  {customerAnalytics.map((c, idx) => (
                    <tr key={idx} className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                      <td className="p-3 font-bold">{c.name}</td>
                      <td className={`p-3 ${isDark ? 'text-gray-400' : 'text-slate-600 font-semibold'}`}>{c.phone}</td>
                      <td className="p-3 text-right font-bold">{c.orders}</td>
                      <td className="p-3 text-right">{c.items}</td>
                      <td className={`p-3 text-right font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{formatINR(c.net_spend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: 💼 STAFF & TILL TAB */}
      {activeTab === 'staff' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* SECTION 19: STAFF PERFORMANCE */}
          <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Award className="w-5 h-5 text-amber-500" />
              <span>Cashier & Till Performance</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className={`border-b ${isDark ? 'bg-[#101217] border-gray-800 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  <tr>
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-right">Invoices</th>
                    <th className="p-3 text-right">Sales Revenue</th>
                    <th className="p-3 text-right">Discounts</th>
                    <th className="p-3 text-right">Avg Invoice</th>
                    <th className="p-3 text-right">Profit Contribution</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-800/40' : 'divide-slate-200'}`}>
                  {cashierPerformance.map((c, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setActiveModal({ type: 'cashier', data: c })}
                      className="hover:bg-amber-500/10 cursor-pointer transition-all"
                    >
                      <td className="p-3 font-bold">{c.cashier}</td>
                      <td className={`p-3 uppercase text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-600 font-semibold'}`}>{c.role}</td>
                      <td className="p-3 text-right font-bold">{c.bills}</td>
                      <td className={`p-3 text-right font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{formatINR(c.revenue)}</td>
                      <td className={`p-3 text-right ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{formatINR(c.discounts)}</td>
                      <td className="p-3 text-right">{formatINR(c.avg_invoice)}</td>
                      <td className={`p-3 text-right font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{formatINR(c.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 20 & 21: TILL / SHIFT RECONCILIATION */}
          <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Shift & Till Cash Reconciliation</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className={`border-b ${isDark ? 'bg-[#101217] border-gray-800 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  <tr>
                    <th className="p-3">Shift ID</th>
                    <th className="p-3">Cashier</th>
                    <th className="p-3">Opened At</th>
                    <th className="p-3 text-right">Opening Cash</th>
                    <th className="p-3 text-right">Cash Sales</th>
                    <th className="p-3 text-right">Expected Cash</th>
                    <th className="p-3 text-right">Actual Cash</th>
                    <th className="p-3 text-right">Discrepancy</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-800/40' : 'divide-slate-200'}`}>
                  {tillReconciliation.map((s, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-bold">Shift #{s.shift_id}</td>
                      <td className="p-3">{s.cashier}</td>
                      <td className={`p-3 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{s.opened_at}</td>
                      <td className="p-3 text-right">{formatINR(s.opening_cash)}</td>
                      <td className="p-3 text-right">{formatINR(s.cash_sales)}</td>
                      <td className="p-3 text-right font-bold">{formatINR(s.expected_cash)}</td>
                      <td className={`p-3 text-right font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{formatINR(s.actual_cash)}</td>
                      <td className="p-3 text-right font-bold">
                        <span className={`px-2 py-0.5 rounded ${
                          s.difference < 0
                            ? isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-100 text-red-800'
                            : isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {formatINR(s.difference)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 7: 💰 PROFITABILITY MATRIX */}
      {activeTab === 'profitability' && (
        <div className="space-y-6 animate-fade-in">
          <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-[#181B22] border-[#262A36]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Category Profitability Matrix</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className={`border-b ${isDark ? 'bg-[#101217] border-gray-800 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  <tr>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Items Sold</th>
                    <th className="p-3 text-right">Sales Revenue</th>
                    <th className="p-3 text-right">COGS Cost</th>
                    <th className="p-3 text-right">Gross Profit</th>
                    <th className="p-3 text-right">Gross Margin %</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-800/40' : 'divide-slate-200'}`}>
                  {salesCategory.map((cat, idx) => {
                    const cogs = cat.revenue * 0.62;
                    const profit = cat.revenue - cogs;
                    return (
                      <tr key={idx} className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                        <td className="p-3 font-bold">{cat.category}</td>
                        <td className="p-3 text-right">{cat.qty} pcs</td>
                        <td className={`p-3 text-right font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{formatINR(cat.revenue)}</td>
                        <td className={`p-3 text-right ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{formatINR(cogs)}</td>
                        <td className={`p-3 text-right font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{formatINR(profit)}</td>
                        <td className={`p-3 text-right font-bold ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>38.0%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 30: DRILL-DOWN MODAL */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className={`p-6 rounded-2xl border max-w-xl w-full space-y-4 shadow-2xl ${
            isDark ? 'bg-[#181B22] border-[#262A36] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-heading font-bold text-base flex items-center space-x-2">
                <Search className="w-4 h-4 text-amber-500" />
                <span>Drill-Down Details: {activeModal.type.toUpperCase()}</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <pre className="p-3 rounded-xl bg-[#101217] border border-gray-800 text-amber-400 overflow-x-auto">
                {JSON.stringify(activeModal.data, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs hover:bg-amber-400"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
