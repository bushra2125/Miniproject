/**
 * OverviewPage.jsx — Dashboard overview with summary statistics.
 * Fetches from /api/analytics/summary and /api/fruits/status.
 * Shows honest empty states when backend is unavailable.
 */
import { useEffect, useState, useCallback } from 'react';
import StatCard from '../components/StatCard';
import { getAnalyticsSummary, getModelStatus, checkHealth } from '../api';

function QualityBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-1)',
          fontSize: 'var(--text-sm)',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{label}</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {value} <span style={{ color: 'var(--color-text-muted)' }}>({pct}%)</span>
        </span>
      </div>
      <div
        style={{
          height: 10,
          background: 'var(--gray-200)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.7s ease',
          }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${pct}%`}
        />
      </div>
    </div>
  );
}

export default function OverviewPage({ onNavigate }) {
  const [summary, setSummary]         = useState(null);
  const [serverOk, setServerOk]       = useState(null); // null=checking, true, false
  const [modelReady, setModelReady]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [healthRes, modelRes, summaryRes] = await Promise.all([
      checkHealth(),
      getModelStatus(),
      getAnalyticsSummary(),
    ]);

    setServerOk(!healthRes.error);
    setModelReady(modelRes.data?.model_loaded ?? false);

    if (summaryRes.error) {
      // Backend or Firebase not configured — expected state
      setSummary(null);
      if (summaryRes.error.includes('Cannot reach')) {
        setError('backend_offline');
      } else {
        setError('firebase_not_configured');
      }
    } else {
      setSummary(summaryRes.data);
      setError(null);
    }

    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const s = summary;
  const totalInspections  = s?.total_inspections      ?? 0;
  const totalFruits       = s?.total_fruits_counted   ?? 0;
  const healthy           = s?.quality_summary?.healthy  ?? 0;
  const damaged           = s?.quality_summary?.damaged  ?? 0;
  const rotten            = s?.quality_summary?.rotten   ?? 0;
  const totalQuality      = healthy + damaged + rotten;
  const mostCommon        = s?.most_common_fruit ?? null;

  return (
    <div className="page-content animate-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">
            Real-time summary of your fruit inspection system.
            {lastRefresh && (
              <span style={{ marginLeft: 'var(--space-3)', color: 'var(--color-text-muted)' }}>
                Last refreshed {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={load}
          disabled={loading}
          id="overview-refresh-btn"
          aria-label="Refresh dashboard data"
        >
          {loading ? <span className="spinner spinner-dark" aria-hidden="true" /> : '↻'} Refresh
        </button>
      </div>

      {/* Server / Firebase status banners */}
      {error === 'backend_offline' && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--space-5)' }}>
          <span className="alert-icon">🔴</span>
          <div className="alert-content">
            <div className="alert-title">Backend Server Offline</div>
            <div className="alert-body">
              Cannot connect to <code>http://127.0.0.1:8000</code>. Make sure the FastAPI server
              is running: <code>uvicorn main:app --reload</code> (from the backend/ directory).
              Statistics will show zero until the server is available.
            </div>
          </div>
        </div>
      )}

      {error === 'firebase_not_configured' && serverOk && (
        <div className="alert alert-warning" role="alert" style={{ marginBottom: 'var(--space-5)' }}>
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <div className="alert-title">Firebase Not Configured</div>
            <div className="alert-body">
              The backend server is running but Firestore is not connected yet. Add your Firebase
              service account key and restart the server (see <code>README.md → Step 4</code>).
              Inspection history and analytics require Firebase.
            </div>
          </div>
        </div>
      )}

      {serverOk && !modelReady && error !== 'backend_offline' && (
        <div className="alert alert-warning" role="alert" style={{ marginBottom: 'var(--space-5)' }}>
          <span className="alert-icon">🤖</span>
          <div className="alert-content">
            <div className="alert-title">AI Model Not Loaded</div>
            <div className="alert-body">
              The backend is running but the trained model is not available. Add your model file
              to <code>backend/ml_models/</code> and set <code>MODEL_PATH</code> in <code>.env</code>.
              Image inspection will return an informational response until then.
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard
          label="Total Inspections"
          value={loading ? '…' : totalInspections.toLocaleString()}
          icon="🔬"
          iconBg="var(--green-50)"
          iconColor="var(--green-600)"
          accentColor="var(--green-500)"
          meta="All-time inspection sessions"
        />
        <StatCard
          label="Fruits Counted"
          value={loading ? '…' : totalFruits.toLocaleString()}
          icon="🍊"
          iconBg="var(--orange-50)"
          iconColor="var(--orange-600)"
          accentColor="var(--orange-500)"
          meta="Total individual fruits detected"
        />
        <StatCard
          label="Healthy"
          value={loading ? '…' : healthy.toLocaleString()}
          icon="✅"
          iconBg="var(--green-50)"
          iconColor="var(--green-600)"
          accentColor="var(--green-500)"
          meta="Good quality fruits"
        />
        <StatCard
          label="Damaged"
          value={loading ? '…' : damaged.toLocaleString()}
          icon="⚠️"
          iconBg="var(--orange-50)"
          iconColor="var(--orange-600)"
          accentColor="var(--orange-500)"
          meta="Physically damaged fruits"
        />
        <StatCard
          label="Rotten"
          value={loading ? '…' : rotten.toLocaleString()}
          icon="🚫"
          iconBg="var(--red-50)"
          iconColor="var(--red-600)"
          accentColor="var(--red-500)"
          meta="Spoiled or decayed fruits"
        />
        <StatCard
          label="Top Fruit"
          value={loading ? '…' : (mostCommon ?? '—')}
          icon="🏆"
          iconBg="var(--yellow-100)"
          iconColor="#a16207"
          accentColor="var(--yellow-500)"
          meta="Most inspected fruit type"
        />
      </div>

      {/* Quality breakdown card + Quick actions */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Quality breakdown */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Quality Distribution</div>
              <div className="card-subtitle">Breakdown of inspection outcomes</div>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
                <span className="spinner spinner-dark" aria-label="Loading quality data" />
              </div>
            ) : totalQuality === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-8) var(--space-4)' }}>
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-title">No Data Yet</div>
                <div className="empty-state-body">
                  Run your first inspection to see quality breakdown data here.
                </div>
              </div>
            ) : (
              <>
                <QualityBar label="Healthy"  value={healthy}  total={totalQuality} color="var(--green-500)"  />
                <QualityBar label="Damaged"  value={damaged}  total={totalQuality} color="var(--orange-500)" />
                <QualityBar label="Rotten"   value={rotten}   total={totalQuality} color="var(--red-500)"    />
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-4)' }}>
                  Based on {totalQuality.toLocaleString()} classified fruit results across {totalInspections} inspections.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Quick Actions</div>
              <div className="card-subtitle">Get started with common tasks</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[
              {
                icon: '🔬',
                title: 'Start New Inspection',
                desc: 'Upload a fruit image for AI quality assessment',
                page: 'inspect',
                color: 'var(--green-600)',
              },
              {
                icon: '🗂️',
                title: 'View Inspection History',
                desc: 'Browse all past inspection records',
                page: 'history',
                color: 'var(--blue-500)',
              },
              {
                icon: '📈',
                title: 'Explore Analytics',
                desc: 'Quality trends and statistical summaries',
                page: 'analytics',
                color: 'var(--orange-500)',
              },
            ].map((action) => (
              <button
                key={action.page}
                id={`quick-action-${action.page}`}
                className="btn btn-secondary"
                style={{
                  justifyContent: 'flex-start',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                }}
                onClick={() => onNavigate(action.page)}
              >
                <span
                  style={{
                    fontSize: '1.4rem',
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--gray-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  {action.icon}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                    {action.title}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                    {action.desc}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* System status card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">System Status</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            {[
              {
                label: 'Backend Server',
                status: serverOk === null ? 'checking' : serverOk ? 'online' : 'offline',
                dot: serverOk === null ? 'checking' : serverOk ? 'online' : 'offline',
                text: serverOk === null ? 'Checking…' : serverOk ? 'Online' : 'Offline',
              },
              {
                label: 'AI Model',
                status: modelReady === null ? 'checking' : modelReady ? 'online' : 'offline',
                dot: modelReady === null ? 'checking' : modelReady ? 'online' : 'offline',
                text: modelReady === null ? 'Checking…' : modelReady ? 'Loaded' : 'Not loaded',
              },
              {
                label: 'Firebase / Firestore',
                status: error === 'firebase_not_configured' || error === 'backend_offline' ? 'offline' : totalInspections > 0 ? 'online' : 'checking',
                dot: error === 'firebase_not_configured' || error === 'backend_offline' ? 'offline' : totalInspections > 0 ? 'online' : 'checking',
                text: error === 'firebase_not_configured' ? 'Not configured' : error === 'backend_offline' ? 'Offline' : totalInspections > 0 ? 'Connected' : 'Unknown',
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  flex: '1 1 180px',
                }}
              >
                <span className={`status-dot ${item.dot}`} aria-hidden="true" />
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {item.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
