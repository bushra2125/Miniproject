/**
 * AnalyticsPage.jsx — Quality analytics with charts
 * Fetches GET /api/analytics/summary and renders:
 *   - Quality distribution donut chart (CSS conic-gradient)
 *   - Summary stat cards
 *   - CSS bar chart (illustrative, based on real data)
 *
 * Shows honest empty states when no data is available.
 */
import { useEffect, useState, useCallback } from 'react';
import { getAnalyticsSummary } from '../api';

/** Builds a conic-gradient from quality values */
function buildConicGradient(healthy, damaged, rotten) {
  const total = healthy + damaged + rotten;
  if (total === 0) return 'conic-gradient(var(--gray-200) 0deg 360deg)';

  const hPct = (healthy / total) * 360;
  const dPct = (damaged / total) * 360;
  const rPct = (rotten  / total) * 360;

  const h = hPct;
  const d = h + dPct;
  // rest is rotten
  return `conic-gradient(
    var(--green-500)  0deg    ${h}deg,
    var(--orange-500) ${h}deg ${d}deg,
    var(--red-500)    ${d}deg 360deg
  )`;
}

function DonutChart({ healthy, damaged, rotten }) {
  const total   = healthy + damaged + rotten;
  const gradient = buildConicGradient(healthy, damaged, rotten);

  const items = [
    { label: 'Healthy', count: healthy, color: 'var(--green-500)',  pct: total ? Math.round(healthy / total * 100) : 0 },
    { label: 'Damaged', count: damaged, color: 'var(--orange-500)', pct: total ? Math.round(damaged / total * 100) : 0 },
    { label: 'Rotten',  count: rotten,  color: 'var(--red-500)',    pct: total ? Math.round(rotten  / total * 100) : 0 },
  ];

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', flexWrap: 'wrap' }}
      role="img"
      aria-label={`Quality distribution: ${healthy} healthy, ${damaged} damaged, ${rotten} rotten out of ${total} total`}
    >
      {/* Donut */}
      <div className="donut-chart" style={{ background: gradient }}>
        <div className="donut-hole">
          <div className="donut-hole-value">{total}</div>
          <div className="donut-hole-label">Total</div>
        </div>
      </div>

      {/* Legend */}
      <div className="legend-list">
        {items.map((item) => (
          <div className="legend-item" key={item.label}>
            <div className="legend-dot" style={{ background: item.color }} aria-hidden="true" />
            <span className="legend-name">{item.label}</span>
            <span className="legend-count">{item.count.toLocaleString()}</span>
            <span className="legend-pct">({item.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ healthy, damaged, rotten, total }) {
  const bars = [
    { label: 'Healthy', value: healthy, color: 'var(--green-500)',  max: total || 1 },
    { label: 'Damaged', value: damaged, color: 'var(--orange-400)', max: total || 1 },
    { label: 'Rotten',  value: rotten,  color: 'var(--red-500)',    max: total || 1 },
  ];

  const maxVal = Math.max(healthy, damaged, rotten, 1);

  return (
    <div
      role="img"
      aria-label={`Bar chart — Healthy: ${healthy}, Damaged: ${damaged}, Rotten: ${rotten}`}
    >
      <div className="chart-bars">
        {bars.map((bar) => {
          const heightPct = Math.round((bar.value / maxVal) * 100);
          return (
            <div className="chart-bar-wrap" key={bar.label}>
              <div className="chart-bar-track">
                <div
                  className="chart-bar-fill"
                  style={{
                    height: `${Math.max(heightPct, 2)}%`,
                    background: bar.color,
                    opacity: 0.85,
                  }}
                  data-value={bar.value}
                  title={`${bar.label}: ${bar.value}`}
                />
              </div>
              <div className="chart-bar-label">{bar.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: res, error: apiError } = await getAnalyticsSummary();
    setLoading(false);
    if (apiError) {
      setError(apiError);
      setData(null);
    } else {
      setData(res);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const isBackendOffline  = error && error.includes('Cannot reach');
  const isFirebaseError   = error && !error.includes('Cannot reach');

  const totalInspections  = data?.total_inspections     ?? 0;
  const totalFruits       = data?.total_fruits_counted  ?? 0;
  const healthy           = data?.quality_summary?.healthy ?? 0;
  const damaged           = data?.quality_summary?.damaged ?? 0;
  const rotten            = data?.quality_summary?.rotten  ?? 0;
  const mostCommon        = data?.most_common_fruit ?? null;
  const totalQuality      = healthy + damaged + rotten;
  const hasData           = totalInspections > 0;

  return (
    <div className="page-content animate-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Quality trends and inspection statistics from your Firestore database.</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={load}
          disabled={loading}
          id="analytics-refresh-btn"
          aria-label="Refresh analytics data"
        >
          {loading ? <span className="spinner spinner-dark" aria-hidden="true" /> : '↻'} Refresh
        </button>
      </div>

      {/* Error banners */}
      {isBackendOffline && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--space-5)' }}>
          <span className="alert-icon">🔴</span>
          <div className="alert-content">
            <div className="alert-title">Backend Server Offline</div>
            <div className="alert-body">{error}</div>
          </div>
        </div>
      )}

      {isFirebaseError && (
        <div className="alert alert-warning" role="alert" style={{ marginBottom: 'var(--space-5)' }}>
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <div className="alert-title">Firebase / Firestore Not Configured</div>
            <div className="alert-body">
              {error} — Analytics require Firestore. Add your service account key and restart the server (see <code>README.md → Step 4</code>).
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <span className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} aria-label="Loading analytics" />
        </div>
      )}

      {/* No data yet */}
      {!loading && !error && !hasData && (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">No Analytics Data Yet</div>
              <div className="empty-state-body">
                {data?.message || 'Analytics will populate once inspections have been recorded to Firestore. Run your first inspection to get started.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data available */}
      {!loading && !error && hasData && (
        <>
          {/* Top stats */}
          <div className="stats-grid" style={{ marginBottom: 'var(--space-5)' }}>
            {[
              { label: 'Total Inspections', value: totalInspections, icon: '🔬', color: 'var(--green-500)' },
              { label: 'Total Fruits',       value: totalFruits,       icon: '🍊', color: 'var(--orange-500)' },
              { label: 'Healthy Fruits',     value: healthy,           icon: '✅', color: 'var(--green-500)' },
              { label: 'Damaged Fruits',     value: damaged,           icon: '⚠️', color: 'var(--orange-500)' },
              { label: 'Rotten Fruits',      value: rotten,            icon: '🚫', color: 'var(--red-500)' },
              { label: 'Top Fruit Type',     value: mostCommon ?? '—', icon: '🏆', color: 'var(--yellow-500)' },
            ].map((s) => (
              <article
                key={s.label}
                className="stat-card"
                style={{ '--stat-color': s.color }}
                aria-label={`${s.label}: ${s.value}`}
              >
                <div className="stat-card-header">
                  <span className="stat-card-label">{s.label}</span>
                  <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>{s.icon}</span>
                </div>
                <div className="stat-card-value">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
              </article>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid-2" style={{ marginBottom: 'var(--space-5)' }}>
            {/* Donut */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Quality Distribution</div>
                  <div className="card-subtitle">Proportional breakdown of fruit quality</div>
                </div>
              </div>
              <div className="card-body">
                {totalQuality === 0 ? (
                  <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>
                    <div className="empty-state-icon" style={{ fontSize: '2rem' }}>📊</div>
                    <div className="empty-state-body">No quality data recorded yet.</div>
                  </div>
                ) : (
                  <DonutChart healthy={healthy} damaged={damaged} rotten={rotten} />
                )}
              </div>
            </div>

            {/* Bar chart */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Quality Comparison</div>
                  <div className="card-subtitle">Relative counts by classification category</div>
                </div>
              </div>
              <div className="card-body">
                {totalQuality === 0 ? (
                  <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>
                    <div className="empty-state-body">No data to chart yet.</div>
                  </div>
                ) : (
                  <BarChart
                    healthy={healthy}
                    damaged={damaged}
                    rotten={rotten}
                    total={totalQuality}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Summary table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Summary Table</div>
              <div className="card-subtitle">All-time aggregated statistics</div>
            </div>
            <div className="table-wrap">
              <table aria-label="Analytics summary table">
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col">Count</th>
                    <th scope="col">Percentage</th>
                    <th scope="col">Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { cat: 'Healthy', count: healthy,  pct: totalQuality ? Math.round(healthy / totalQuality * 100) : 0, badge: 'badge-healthy' },
                    { cat: 'Damaged', count: damaged, pct: totalQuality ? Math.round(damaged / totalQuality * 100) : 0, badge: 'badge-damaged' },
                    { cat: 'Rotten',  count: rotten,  pct: totalQuality ? Math.round(rotten  / totalQuality * 100) : 0, badge: 'badge-rotten'  },
                  ].map((row) => (
                    <tr key={row.cat}>
                      <td style={{ fontWeight: 600 }}>{row.cat}</td>
                      <td style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>
                        {row.count.toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ flex: 1, height: 8, background: 'var(--gray-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden', minWidth: 80 }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${row.pct}%`,
                                background: row.cat === 'Healthy' ? 'var(--green-500)' : row.cat === 'Damaged' ? 'var(--orange-500)' : 'var(--red-500)',
                                borderRadius: 'var(--radius-full)',
                                transition: 'width 0.7s ease',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, minWidth: 36, textAlign: 'right' }}>
                            {row.pct}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${row.badge}`}>{row.cat}</span>
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr style={{ background: 'var(--gray-50)', fontWeight: 700 }}>
                    <td>Total</td>
                    <td style={{ fontSize: 'var(--text-lg)' }}>{totalQuality.toLocaleString()}</td>
                    <td>100%</td>
                    <td><span className="badge badge-info">All</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
