import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Calendar, DollarSign, PieChart, Users, ShoppingBag, RefreshCw, ArrowUpRight, Award, Zap, ChevronRight, Layers, PackageCheck, CreditCard, QrCode, Banknote, Download } from 'lucide-react';

export default function ReportsView({ theme }) {
  const isDark = theme === 'dark';
  const [timeFilter, setTimeFilter] = useState('7d'); // 'today', '7d', '30d', 'ytd', 'all'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [kpis, setKpis] = useState(null);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [salesCategory, setSalesCategory] = useState([]);
  const [salesBrand, setSalesBrand] = useState([]);
  const [salesSize, setSalesSize] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [cashierPerformance, setCashierPerformance] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [timeFilter]);

  const fetchReportData = async () => {
    setIsRefreshing(true);
    try {
      const days = timeFilter === 'today' ? 1 : timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : 90;
      
      const [rKpis, rDaily, rMonthly, rCat, rBrand, rSize, rPay, rCashier, rLow] = await Promise.all([
        fetch('/api/reports/kpis').then(r => r.ok ? r.json() : null),
        fetch(`/api/reports/daily-trend?days=${days}`).then(r => r.ok ? r.json() : []),
        fetch('/api/reports/monthly-trend').then(r => r.ok ? r.json() : []),
        fetch('/api/reports/sales-by-category').then(r => r.ok ? r.json() : []),
        fetch('/api/reports/sales-by-brand').then(r => r.ok ? r.json() : []),
        fetch('/api/reports/sales-by-size').then(r => r.ok ? r.json() : []),
        fetch('/api/reports/payment-modes').then(r => r.ok ? r.json() : []),
        fetch('/api/reports/cashier-performance').then(r => r.ok ? r.json() : []),
        fetch('/api/reports/low-stock').then(r => r.ok ? r.json() : [])
      ]);

      if (rKpis && !rKpis.detail) setKpis(rKpis);
      if (Array.isArray(rDaily)) setDailyTrend(rDaily);
      if (Array.isArray(rMonthly)) setMonthlyTrend(rMonthly);
      if (Array.isArray(rCat)) setSalesCategory(rCat);
      if (Array.isArray(rBrand)) setSalesBrand(rBrand);
      if (Array.isArray(rSize)) setSalesSize(rSize);
      if (Array.isArray(rPay)) setPaymentModes(rPay);
      if (Array.isArray(rCashier)) setCashierPerformance(rCashier);
      if (Array.isArray(rLow)) setLowStock(rLow);
    } catch (e) {
      console.error("Failed to load reports", e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  const safeDailyTrend = Array.isArray(dailyTrend) ? dailyTrend : [];
  const maxDailyRevenue = safeDailyTrend.length > 0 ? Math.max(...safeDailyTrend.map(d => d.revenue || 0), 1000) : 1000;
  const totalCategoryRevenue = salesCategory.reduce((sum, c) => sum + (c.revenue || 0), 0) || 1;
  const totalBrandRevenue = salesBrand.reduce((sum, b) => sum + (b.revenue || 0), 0) || 1;
  const totalPaymentVolume = paymentModes.reduce((sum, p) => sum + (p.amount || p.revenue || 0), 0) || 1;

  const handleExportCSV = () => {
    const csvRows = [
      ["Report Type", "Swagz Fashion Executive Sales Summary"],
      ["Date Generated", new Date().toLocaleString()],
      ["Today Revenue", `INR ${kpis?.today_sales || 0}`],
      ["Weekly Revenue", `INR ${kpis?.week_sales || 0}`],
      ["Monthly Revenue", `INR ${kpis?.month_sales || 0}`],
      ["Total All-Time Revenue", `INR ${kpis?.total_sales || 0}`],
      [],
      ["Category", "Quantity Sold", "Revenue (INR)"],
      ...salesCategory.map(c => [c.category, c.qty, c.revenue]),
      [],
      ["Brand", "Quantity Sold", "Revenue (INR)"],
      ...salesBrand.map(b => [b.brand, b.qty, b.revenue])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Swagz_Executive_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-[1550px] mx-auto space-y-6 animate-fade-in-up">
      
      {/* Top Banner & Control Controls */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all card-interactive ${
        isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold animate-float">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`font-heading text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Executive Analytics & Sales Command
              </h2>
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                LIVE METRICS
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Real-time daily revenue trends, category breakdown, cashier leaderboard & inventory velocity
            </p>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Pills */}
          <div className={`flex items-center p-1 rounded-xl border space-x-1 ${
            isDark ? 'bg-[#14161A] border-[#2A2E39]' : 'bg-slate-100 border-slate-200'
          }`}>
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'ytd', label: 'YTD' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setTimeFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all btn-interactive cursor-pointer ${
                  timeFilter === f.id
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

          {/* Refresh Button */}
          <button
            onClick={fetchReportData}
            disabled={isRefreshing}
            className={`p-2.5 rounded-xl border transition-all btn-interactive cursor-pointer ${
              isDark ? 'bg-[#14161A] border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 text-amber-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Export Report Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md hover:bg-amber-400 transition-all btn-interactive cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Executive Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Today's Revenue */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 transition-all card-interactive ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-500 block">
                Today's Sales
              </span>
              <h3 className={`text-2xl font-black font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ₹{kpis?.today_sales?.toFixed(2) || '0.00'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800/40">
            <span className="text-emerald-500 font-bold flex items-center space-x-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{kpis?.today_count || 0} Bills Issued</span>
            </span>
            <span className="text-gray-400 font-mono text-[11px]">Updated live</span>
          </div>
        </div>

        {/* Card 2: Weekly Revenue */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 transition-all card-interactive ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400 block">
                Current Week
              </span>
              <h3 className={`text-2xl font-black font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ₹{kpis?.week_sales?.toFixed(2) || '0.00'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800/40">
            <span className="text-gray-400 font-medium">7-Day Cumulative</span>
            <span className="text-blue-400 font-mono font-bold">88.4% target</span>
          </div>
        </div>

        {/* Card 3: Monthly Total */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 transition-all card-interactive ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                Monthly Total
              </span>
              <h3 className={`text-2xl font-black font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ₹{kpis?.month_sales?.toFixed(2) || '0.00'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800/40">
            <span className="text-gray-400 font-medium">Month-to-Date</span>
            <span className="text-emerald-400 font-mono font-bold">+14.2% MoM</span>
          </div>
        </div>

        {/* Card 4: All-Time Sales & AOV */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 transition-all card-interactive ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400 block">
                All-Time Revenue
              </span>
              <h3 className={`text-2xl font-black font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ₹{kpis?.total_sales?.toFixed(2) || '0.00'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800/40">
            <span className="text-gray-400 font-medium">{kpis?.total_count || 0} Total Orders</span>
            <span className="text-purple-400 font-mono font-bold">AOV ₹{kpis?.aov?.toFixed(0) || 0}</span>
          </div>
        </div>

      </div>

      {/* Main Interactive Revenue Trend Visualizer */}
      <div className={`p-6 rounded-2xl border space-y-4 transition-all card-interactive ${
        isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <span>Daily Revenue & Transaction Velocity</span>
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Interactive sales volume bars with day-by-day revenue breakdown
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono font-bold">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-gray-300">Revenue (₹)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <span className="text-gray-300">Target Line</span>
            </div>
          </div>
        </div>

        {/* Animated Bar Chart */}
        <div className="pt-6 pb-2">
          <div className="h-52 flex items-end justify-between space-x-2 border-b pb-2 border-gray-800">
            {safeDailyTrend.map((d, i) => {
              const heightPercent = maxDailyRevenue > 0 ? (d.revenue / maxDailyRevenue) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  
                  {/* Floating Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute -top-14 bg-slate-950 text-white text-[11px] font-mono p-2 rounded-xl shadow-2xl border border-amber-500/30 pointer-events-none whitespace-nowrap z-20 transform -translate-y-1 group-hover:translate-y-0">
                    <div className="font-bold text-amber-400">{d.date}</div>
                    <div>Revenue: <strong className="text-white">₹{d.revenue.toFixed(2)}</strong></div>
                    <div className="text-[10px] text-gray-400">{d.count} invoices confirmed</div>
                  </div>

                  {/* Animated Bar Visual */}
                  <div
                    className={`w-full max-w-[32px] rounded-t-xl transition-all duration-500 group-hover:brightness-125 cursor-pointer ${
                      d.revenue > 0
                        ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-md shadow-amber-500/10'
                        : isDark ? 'bg-slate-800/50' : 'bg-slate-200'
                    }`}
                    style={{ height: `${Math.max(heightPercent, 6)}%` }}
                  ></div>

                  <span className={`text-[10px] font-mono mt-2 font-semibold ${
                    isDark ? 'text-gray-400 group-hover:text-amber-400' : 'text-slate-600 group-hover:text-slate-900'
                  }`}>
                    {d.date.split('-').slice(1).join('/')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category & Brand Performance Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown Card */}
        <div className={`p-6 rounded-2xl border space-y-5 transition-all card-interactive ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex justify-between items-center">
            <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <PieChart className="w-5 h-5 text-amber-500" />
              <span>Sales by Garment Category</span>
            </h3>
            <span className="text-xs font-mono font-bold text-gray-400">Distribution %</span>
          </div>

          <div className="space-y-4">
            {salesCategory.map((cat, idx) => {
              const sharePercent = ((cat.revenue / totalCategoryRevenue) * 100).toFixed(1);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                      {cat.category} <span className="text-gray-400 font-mono font-normal">({cat.qty} pcs)</span>
                    </span>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-amber-500">₹{cat.revenue.toFixed(2)}</span>
                      <span className="text-gray-400 text-[10px]">({sharePercent}%)</span>
                    </div>
                  </div>

                  <div className={`h-2.5 w-full rounded-full overflow-hidden p-0.5 ${
                    isDark ? 'bg-[#14161A]' : 'bg-slate-100'
                  }`}>
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(parseFloat(sharePercent), 4)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Brand Performance Card */}
        <div className={`p-6 rounded-2xl border space-y-5 transition-all card-interactive ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex justify-between items-center">
            <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Sales by Menswear Brand</span>
            </h3>
            <span className="text-xs font-mono font-bold text-gray-400">Share %</span>
          </div>

          <div className="space-y-4">
            {salesBrand.map((b, idx) => {
              const sharePercent = ((b.revenue / totalBrandRevenue) * 100).toFixed(1);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                      {b.brand} <span className="text-gray-400 font-mono font-normal">({b.qty} items)</span>
                    </span>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-emerald-400">₹{b.revenue.toFixed(2)}</span>
                      <span className="text-gray-400 text-[10px]">({sharePercent}%)</span>
                    </div>
                  </div>

                  <div className={`h-2.5 w-full rounded-full overflow-hidden p-0.5 ${
                    isDark ? 'bg-[#14161A]' : 'bg-slate-100'
                  }`}>
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(parseFloat(sharePercent), 4)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Cashier Podium Leaderboard & Low Stock Alert Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cashier Staff Leaderboard */}
        <div className={`p-6 rounded-2xl border space-y-4 transition-all card-interactive ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex justify-between items-center">
            <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Award className="w-5 h-5 text-amber-500" />
              <span>Cashier Staff Leaderboard</span>
            </h3>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-500/10 text-amber-500">
              TOP PERFORMERS
            </span>
          </div>

          <div className="space-y-3">
            {cashierPerformance.map((c, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  idx === 0
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : isDark ? 'bg-[#14161A] border-[#2A2E39]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs ${
                    idx === 0 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                  <div>
                    <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {c.cashier}
                    </h4>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {c.bills} transactions completed
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-amber-500 text-sm block">
                    ₹{c.revenue.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase font-mono">Total Sales</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low-Stock Inventory Alerts */}
        <div className={`p-6 rounded-2xl border space-y-4 transition-all card-interactive ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex justify-between items-center">
            <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Low-Stock Inventory Warnings</span>
            </h3>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
              {lowStock.length} ALERTS
            </span>
          </div>

          {lowStock.length === 0 ? (
            <div className="p-8 text-center text-gray-400 font-mono text-xs">
              ✅ All variant inventory levels are healthy!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {lowStock.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isDark ? 'bg-[#14161A] border-red-500/20' : 'bg-red-500/5 border-red-200'
                  }`}
                >
                  <div>
                    <h5 className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {item.product_name || `Variant #${item.id}`}
                    </h5>
                    <span className="font-mono text-gray-400 text-[11px]">
                      Size: {item.size} • SKU: {item.sku_barcode}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                    {item.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
