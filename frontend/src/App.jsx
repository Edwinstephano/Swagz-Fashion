import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RoleModal from './components/RoleModal';

import PosView from './views/PosView';
import ProductsView from './views/ProductsView';
import ReturnsView from './views/ReturnsView';
import ReportsView from './views/ReportsView';
import PrintersView from './views/PrintersView';

const getTabFromPath = (pathname) => {
  const path = (pathname || '').toLowerCase().replace(/\/$/, '');
  if (path.includes('/product')) return 'products';
  if (path.includes('/return')) return 'returns';
  if (path.includes('/report')) return 'reports';
  if (path.includes('/setting') || path.includes('/printer')) return 'printers';
  return 'pos';
};

const pathMap = {
  pos: '/pos',
  products: '/products',
  returns: '/returns',
  reports: '/reports',
  printers: '/settings'
};

export default function App() {
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(window.location.pathname));
  // Default to 'light' mode as requested, and remember user selection in localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('swagz_pos_theme') || 'light';
  });
  
  const [currentUser, setCurrentUser] = useState({
    name: 'Admin Director',
    username: 'admin',
    role: 'admin'
  });
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const newPath = pathMap[tabId] || '/pos';
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('swagz_pos_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    loginAsUser(currentUser.username);
  }, []);

  const loginAsUser = async (username) => {
    try {
      const password = username === 'admin' ? 'admin123' : username === 'manager' ? 'manager123' : 'cashier123';
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        setCurrentUser({
          name: data.name,
          username: data.username,
          role: data.role
        });
      }
    } catch (e) {
      console.error("Auto login error", e);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#121418] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Streamlined Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'pos' && <PosView currentUser={currentUser} theme={theme} />}
        {activeTab === 'products' && <ProductsView currentUser={currentUser} theme={theme} />}
        {activeTab === 'returns' && <ReturnsView currentUser={currentUser} theme={theme} />}
        {activeTab === 'reports' && <ReportsView theme={theme} />}
        {activeTab === 'printers' && <PrintersView theme={theme} />}
      </main>

      {/* Role Switcher Modal */}
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={(u) => loginAsUser(u.username)}
        theme={theme}
      />
    </div>
  );
}
