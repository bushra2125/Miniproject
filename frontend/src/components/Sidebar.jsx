/**
 * Sidebar.jsx — Collapsible navigation sidebar
 * Contains all page navigation links and model status indicator.
 */
import { useEffect, useState } from 'react';
import { getModelStatus } from '../api';

const NAV_ITEMS = [
  { id: 'overview',  label: 'Overview',     icon: '📊', section: 'MAIN' },
  { id: 'inspect',   label: 'AI Inspection', icon: '🔬', section: 'MAIN' },
  { id: 'history',   label: 'History',       icon: '🗂️', section: 'MAIN' },
  { id: 'analytics', label: 'Analytics',     icon: '📈', section: 'MAIN' },
  { id: 'settings',  label: 'Settings',      icon: '⚙️',  section: 'SYSTEM' },
];

export default function Sidebar({ activePage, onNavigate, mobileOpen, onClose }) {
  const [modelStatus, setModelStatus] = useState('checking'); // 'ready' | 'not-ready' | 'checking' | 'offline'

  useEffect(() => {
    let cancelled = false;
    async function fetchStatus() {
      const { data, error } = await getModelStatus();
      if (cancelled) return;
      if (error) {
        setModelStatus('offline');
      } else {
        setModelStatus(data?.model_loaded ? 'ready' : 'not-ready');
      }
    }
    fetchStatus();
    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const statusLabel = {
    ready:     'Model Ready',
    'not-ready': 'Model Not Loaded',
    offline:   'Backend Offline',
    checking:  'Checking…',
  }[modelStatus];

  // Group nav items by section
  const sections = NAV_ITEMS.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const handleNav = (id) => {
    onNavigate(id);
    if (mobileOpen) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          role="presentation"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="sidebar-logo" role="banner">
          <div className="sidebar-logo-icon" aria-hidden="true">🍎</div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">FruitQualityAI</span>
            <span className="sidebar-logo-subtitle">Inspection System</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Page navigation">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              <div className="sidebar-section-label" aria-hidden="true">{section}</div>
              {items.map((item) => (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  className={`sidebar-nav-item${activePage === item.id ? ' active' : ''}`}
                  onClick={() => handleNav(item.id)}
                  aria-current={activePage === item.id ? 'page' : undefined}
                  aria-label={item.label}
                >
                  <span className="sidebar-nav-icon" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer — model / server status */}
        <div className="sidebar-footer">
          <div className="sidebar-status-dot">
            <span
              className={`status-dot ${modelStatus === 'ready' ? 'online' : modelStatus === 'checking' ? 'checking' : 'offline'}`}
              aria-hidden="true"
            />
            <span>{statusLabel}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
