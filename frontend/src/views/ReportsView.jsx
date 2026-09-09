import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Calendar, DollarSign, PieChart, Users, ShoppingBag } from 'lucide-react';

export default function ReportsView({ theme }) {
  const isDark = theme === 'dark';
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
  }, []);

  const fetchReportData = async () => {
    try {
      const [rKpis, rDaily, rMonthly, rCat, rBrand, rSize, rPay, rCashier, rLow] = await Promise.all([
        fetch('/api/reports/kpis').then(r => r.ok ? r.json() : null),
        fetch('/api/reports/daily-trend?days=14').then(r => r.ok ? r.json() : []),
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
    }
  };

  const safeDailyTrend = Array.isArray(dailyTrend) ? dailyTrend : [];
  const maxDailyRevenue = safeDailyTrend.length > 0 ? Math.max(...safeDailyTrend.map(d => d.revenue || 0), 1000) : 1000;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className={`p-5 rounded-2xl border flex justify-between items-center ${
        isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-300 shadow-xs'
      }`}>
        <div>
          <h2 className={`font-heading text-2xl font-bold flex items-center space-x-2 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            <BarChart3 className="w-6 h-6 text-[#C9A24B]" />
            <span>Sales & Revenue Analytics Center</span>
          </h2>
          <p className={`text-xs font-semibold mt-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Real-time daily revenue trends, monthly growth, product category performance, and stock ledger
          </p>
        </div>
      </div>

      {/* 4 Main KPI Cards: Daily, Weekly, Monthly & Total All-Time */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Today */}
        <div className={`p-5 rounded-2xl border space-y-2 ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-300 shadow-xs'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-bold uppercase text-amber-600">Today's Revenue</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-3xl font-black font-mono ${isDark ? 'text-[#C9A24B]' : 'text-slate-900'}`}>
            ₹{kpis?.today_sales?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{kpis?.today_count || 0} Invoices Today</span>
          </div>
        </div>

        {/* This Week */}
        <div className={`p-5 rounded-2xl border space-y-2 ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-300 shadow-xs'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-bold uppercase text-slate-500">This Week</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className={`text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            ₹{kpis?.week_sales?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-slate-500 font-semibold">Current Week Total</div>
        </div>

        {/* This Month */}
        <div className={`p-5 rounded-2xl border space-y-2 ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-300 shadow-xs'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-bold uppercase text-slate-500">This Month</span>
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
          <div className={`text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            ₹{kpis?.month_sales?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-slate-500 font-semibold">Current Month Sales</div>
        </div>

        {/* Total All-Time */}
        <div className={`p-5 rounded-2xl border space-y-2 ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-300 shadow-xs'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-bold uppercase text-slate-500">Total All-Time</span>
            <DollarSign className="w-4 h-4 text-purple-500" />
          </div>
          <div className={`text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            ₹{kpis?.total_sales?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-slate-500 font-semibold font-mono">
            {kpis?.total_count || 0} Bills • AOV ₹{kpis?.aov?.toFixed(0) || 0}
          </div>
        </div>
      </div>

      {/* Daily Revenue Trend Chart (Past 14 Days) */}
      <div className={`p-6 rounded-2xl border space-y-4 ${
        isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-300 shadow-xs'
      }`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <TrendingUp className="w-5 h-5 text-[#C9A24B]" />
              <span>Daily Revenue Trend Chart (Past 14 Days)</span>
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Track day-by-day sales fluctuations and order volumes</p>
          </div>
        </div>

        {/* Interactive Bar Chart Visualization */}
        <div className="pt-6 pb-2">
          <div className="h-48 flex items-end justify-between space-x-2 border-b pb-2 border-slate-200">
            {safeDailyTrend.map((d, i) => {
              const heightPercent = maxDailyRevenue > 0 ? (d.revenue / maxDailyRevenue) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip on Hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-900 text-white text-[10px] font-mono p-1.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-10">
                    <div>{d.date}: <strong>₹{d.revenue.toFixed(2)}</strong></div>
                    <div>{d.count} bills confirmed</div>
                  </div>

                  {/* Bar Visual */}
                  <div
                    className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                      d.revenue > 0
                        ? isDark ? 'bg-gradient-to-t from-[#B89139] to-[#C9A24B]' : 'bg-slate-900 hover:bg-[#B45309]'
                        : isDark ? 'bg-slate-800/40' : 'bg-slate-100'
                    }`}
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  ></div>

                  <span className={`text-[10px] font-mono mt-2 ${isDark ? 'text-gray-400' : 'text-slate-600 font-semibold'}`}>
                    {d.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly & Cashier Breakdown Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Trend List */}
        <div className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-300 shadow-xs'
        }`}>
          <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Calendar className="w-5 h-5 text-blue-500" />
            <span>Monthly Revenue Growth</span>
          </h3>
          <div className="space-y-3">
            {monthlyTrend.map((m, idx) => (
              <div key={idx} className={`p-3 rounded-xl border flex justify-between items-center ${
                isDark ? 'bg-[#14161A] border-[#2A2E39]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className={`font-bold text-sm block ${isDark ? 'text-white' : 'text-slate-900'}`}>{m.month}</span>
                  <span className="text-xs text-slate-500 font-semibold">{m.count} bills confirmed</span>
                </div>
                <span className={`font-mono font-black text-base ${isDark ? 'text-[#C9A24B]' : 'text-slate-900'}`}>
                  ₹{m.revenue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cashier Performance */}
        <div className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-300 shadow-xs'
        }`}>
          <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Users className="w-5 h-5 text-purple-500" />
            <span>Cashier Staff Sales Performance</span>
          </h3>
          <div className="space-y-3">
            {cashierPerformance.map((c, idx) => (
              <div key={idx} className={`p-3 rounded-xl border flex justify-between items-center ${
                isDark ? 'bg-[#14161A] border-[#2A2E39]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className={`font-bold text-sm block ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.cashier}</span>
                  <span className="text-xs text-slate-500 font-semibold">{c.bills} transactions</span>
                </div>
                <span className={`font-mono font-black text-base ${isDark ? 'text-[#C9A24B]' : 'text-slate-900'}`}>
                  ₹{c.revenue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category & Brand Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-300 shadow-xs'
        }`}>
          <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <PieChart className="w-5 h-5 text-[#C9A24B]" />
            <span>Sales by Category</span>
          </h3>
          <div className="space-y-3">
            {salesCategory.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className={isDark ? 'text-gray-300' : 'text-slate-800'}>{cat.category} ({cat.qty} pcs)</span>
                  <span className="font-mono text-[#C9A24B]">₹{cat.revenue.toFixed(2)}</span>
                </div>
                <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-[#14161A]' : 'bg-slate-100'}`}>
                  <div className="h-full bg-[#C9A24B] rounded-full" style={{ width: `${Math.min(100, (cat.revenue / 10000) * 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#1F2229] border-[#2A2E39]' : 'bg-white border-slate-300 shadow-xs'
        }`}>
          <h3 className={`font-heading text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            <span>Sales by Brand</span>
          </h3>
          <div className="space-y-3">
            {salesBrand.map((b, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className={isDark ? 'text-gray-300' : 'text-slate-800'}>{b.brand} ({b.qty} pcs)</span>
                  <span className="font-mono text-emerald-600">₹{b.revenue.toFixed(2)}</span>
                </div>
                <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-[#14161A]' : 'bg-slate-100'}`}>
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (b.revenue / 10000) * 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
