/**
 * TopNav.jsx — Sticky top navigation bar
 * Shows current page title, model status badge, and hamburger menu (mobile).
 */

const PAGE_META = {
  overview:  { title: 'Overview',      icon: '📊', sub: 'System summary & statistics' },
  inspect:   { title: 'AI Inspection', icon: '🔬', sub: 'Upload and analyze fruit images' },
  history:   { title: 'History',       icon: '🗂️',  sub: 'Past inspection records' },
  analytics: { title: 'Analytics',     icon: '📈', sub: 'Quality trends & insights' },
  settings:  { title: 'Settings',      icon: '⚙️',  sub: 'Application preferences' },
};

export default function TopNav({ activePage, modelStatus, onMenuToggle }) {
  const meta = PAGE_META[activePage] || PAGE_META.overview;

  const badgeClass =
    modelStatus === 'ready'
      ? 'topnav-model-badge ready'
      : modelStatus === 'not-ready'
      ? 'topnav-model-badge not-ready'
      : 'topnav-model-badge checking';

  const badgeLabel =
    modelStatus === 'ready'
      ? '✓ Model Ready'
      : modelStatus === 'not-ready'
      ? '⚠ Model Not Loaded'
      : modelStatus === 'offline'
      ? '✕ Backend Offline'
      : '… Checking';

  return (
    <header className="topnav" role="banner">
      <div className="topnav-left">
        {/* Mobile hamburger */}
        <button
          className="topnav-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar navigation"
          aria-expanded="false"
          id="topnav-menu-btn"
        >
          ☰
        </button>

        {/* Breadcrumb / title */}
        <div className="topnav-breadcrumb">
          <div>
            <div className="topnav-page-title">
              <span aria-hidden="true" style={{ marginRight: '8px' }}>{meta.icon}</span>
              {meta.title}
            </div>
            <div className="topnav-page-sub">{meta.sub}</div>
          </div>
        </div>
      </div>

      <div className="topnav-right">
        {/* Model status badge */}
        <div
          className={badgeClass}
          role="status"
          aria-live="polite"
          aria-label={`AI model status: ${badgeLabel}`}
          title="AI model inference status"
        >
          {badgeLabel}
        </div>

        {/* Avatar */}
        <div
          className="topnav-avatar"
          role="img"
          aria-label="User profile"
          title="Admin"
        >
          A
        </div>
      </div>
    </header>
  );
}
