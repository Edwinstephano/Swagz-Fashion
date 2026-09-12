import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RoleModal from './components/RoleModal';

import PosView from './views/PosView';
import ProductsView from './views/ProductsView';
import ReturnsView from './views/ReturnsView';
import ReportsView from './views/ReportsView';
import PrintersView from './views/PrintersView';

import LoginView from './views/LoginView';

const rolePermissions = {
  cashier: ['pos', 'returns'],
  manager: ['pos', 'products', 'returns', 'reports', 'printers'],
  admin: ['pos', 'products', 'returns', 'reports', 'printers']
};

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
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('swagz_pos_theme') || 'light';
  });
  
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('swagz_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  useEffect(() => {
    const hFont = localStorage.getItem('swagz_heading_font') || 'Plus Jakarta Sans';
    const bFont = localStorage.getItem('swagz_body_font') || 'Inter';
    const loadFont = (fName) => {
      if (!fName) return;
      const safeId = `google-font-${fName.replace(/\s+/g, '-').toLowerCase()}`;
      if (document.getElementById(safeId)) return;
      const link = document.createElement('link');
      link.id = safeId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fName.replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap`;
      document.head.appendChild(link);
    };
    loadFont(hFont);
    loadFont(bFont);
    document.documentElement.style.setProperty('--font-heading', `'${hFont}', sans-serif`);
    document.documentElement.style.setProperty('--font-body', `'${bFont}', sans-serif`);
  }, []);

  // Enforce role-based module protection & fallback to POS if unauthorized
  useEffect(() => {
    const userRole = (currentUser?.role || 'cashier').toLowerCase();
    const allowedTabs = rolePermissions[userRole] || rolePermissions.cashier;
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab('pos');
      if (window.location.pathname !== '/pos') {
        window.history.pushState({}, '', '/pos');
      }
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tabId) => {
    const userRole = (currentUser?.role || 'cashier').toLowerCase();
    const allowedTabs = rolePermissions[userRole] || rolePermissions.cashier;
    if (!allowedTabs.includes(tabId)) {
      return;
    }
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

  useEffect(() => {
    const applyFonts = (h, b) => {
      document.documentElement.style.setProperty('--font-heading', `'${h}', sans-serif`);
      document.documentElement.style.setProperty('--font-body', `'${b}', sans-serif`);
    };

    const savedHeading = localStorage.getItem('swagz_heading_font') || 'Plus Jakarta Sans';
    const savedBody = localStorage.getItem('swagz_body_font') || 'Inter';
    applyFonts(savedHeading, savedBody);

    fetch('/api/settings').then(r => r.ok ? r.json() : null).then(data => {
      if (data && (data.heading_font || data.body_font)) {
        const h = data.heading_font || savedHeading;
        const b = data.body_font || savedBody;
        applyFonts(h, b);
        localStorage.setItem('swagz_heading_font', h);
        localStorage.setItem('swagz_body_font', b);
      }
    }).catch(e => {});
  }, []);


  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLoginSuccess = (userObj) => {
    setCurrentUser(userObj);
    setIsAuthenticated(true);
    // On login, reset to allowed tab
    const userRole = (userObj?.role || 'cashier').toLowerCase();
    const allowedTabs = rolePermissions[userRole] || rolePermissions.cashier;
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab('pos');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('swagz_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsRoleModalOpen(false);
  };

  const isDark = theme === 'dark';

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} theme={theme} toggleTheme={toggleTheme} />;
  }

  const userRole = (currentUser?.role || 'cashier').toLowerCase();
  const isAllowed = (tab) => (rolePermissions[userRole] || rolePermissions.cashier).includes(tab);

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

      {/* Main View Router with Role Protection */}
      <main className="flex-1">
        {activeTab === 'pos' && isAllowed('pos') && <PosView currentUser={currentUser} theme={theme} />}
        {activeTab === 'products' && isAllowed('products') && <ProductsView currentUser={currentUser} theme={theme} />}
        {activeTab === 'returns' && isAllowed('returns') && <ReturnsView currentUser={currentUser} theme={theme} />}
        {activeTab === 'reports' && isAllowed('reports') && <ReportsView theme={theme} />}
        {activeTab === 'printers' && isAllowed('printers') && <PrintersView currentUser={currentUser} theme={theme} />}
      </main>

      {/* Staff Profile Modal */}
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        theme={theme}
      />
    </div>
  );
}
