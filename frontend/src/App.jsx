/**
 * App.jsx — Root component for FruitQualityAI Dashboard
 * Manages global layout, sidebar state, top navigation,
 * and renders the active page based on navigation state.
 */
import { useState, useCallback, useEffect } from 'react';
import Sidebar      from './components/Sidebar';
import TopNav       from './components/TopNav';
import OverviewPage   from './pages/OverviewPage';
import InspectPage    from './pages/InspectPage';
import HistoryPage    from './pages/HistoryPage';
import AnalyticsPage  from './pages/AnalyticsPage';
import SettingsPage   from './pages/SettingsPage';
import { getModelStatus } from './api';

const PAGES = {
  overview:  OverviewPage,
  inspect:   InspectPage,
  history:   HistoryPage,
  analytics: AnalyticsPage,
  settings:  SettingsPage,
};

export default function App() {
  const [activePage,   setActivePage]   = useState('overview');
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [modelStatus,  setModelStatus]  = useState('checking');

  // Fetch model status for the top nav badge
  useEffect(() => {
    let cancelled = false;
    async function fetchStatus() {
      const { data, error } = await getModelStatus();
      if (cancelled) return;
      if (error) {
        setModelStatus(error.includes('Cannot reach') ? 'offline' : 'not-ready');
      } else {
        setModelStatus(data?.model_loaded ? 'ready' : 'not-ready');
      }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const navigate = useCallback((page) => {
    setActivePage(page);
    setMobileOpen(false);
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleMobile = useCallback(() => setMobileOpen(prev => !prev), []);
  const closeMobile  = useCallback(() => setMobileOpen(false), []);

  // Close sidebar on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && mobileOpen) closeMobile();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileOpen, closeMobile]);

  const ActivePage = PAGES[activePage] || OverviewPage;

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        mobileOpen={mobileOpen}
        onClose={closeMobile}
      />

      {/* Main content */}
      <main className="main-content" id="main-content" role="main">
        <TopNav
          activePage={activePage}
          modelStatus={modelStatus}
          onMenuToggle={toggleMobile}
        />

        {/* Render current page — pass navigate for cross-page links */}
        <ActivePage onNavigate={navigate} />
      </main>
    </div>
  );
}
