/**
 * HistoryPage.jsx — Inspection History
 * Fetches GET /api/history/ and renders a searchable, sortable table.
 * Shows honest empty states for both unconfigured Firebase and zero records.
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { getHistory } from '../api';

const QUALITY_BADGE = {
  Healthy: 'badge-healthy',
  Damaged: 'badge-damaged',
  Rotten:  'badge-rotten',
};

function formatDate(ts) {
  if (!ts) return '—';
  // Firestore timestamps can be { _seconds, _nanoseconds } or an ISO string
  let d;
  if (typeof ts === 'string') {
    d = new Date(ts);
  } else if (ts._seconds != null) {
    d = new Date(ts._seconds * 1000);
  } else {
    d = new Date(ts);
  }
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function qualitySummary(results = []) {
  if (!results.length) return '—';
  const counts = results.reduce((acc, r) => {
    acc[r.quality] = (acc[r.quality] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([q, n]) => `${n} ${q}`)
    .join(', ');
}

export default function HistoryPage() {
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [limit,    setLimit]    = useState(50);
  const [expanded, setExpanded] = useState(null); // inspection_id of expanded row

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: apiError } = await getHistory(limit);
    setLoading(false);
    if (apiError) {
      setError(apiError);
      setRecords([]);
    } else {
      setRecords(data?.inspections || []);
    }
  }, [limit]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter((r) => {
      const id       = (r.inspection_id || '').toLowerCase();
      const types    = (r.results || []).map(x => (x.fruit_type || '').toLowerCase()).join(' ');
      const quality  = (r.results || []).map(x => (x.quality || '').toLowerCase()).join(' ');
      return id.includes(q) || types.includes(q) || quality.includes(q);
    });
  }, [records, search]);

  const isFirebaseError  = error && !error.includes('Cannot reach');
  const isBackendOffline = error && error.includes('Cannot reach');

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <h1 className="page-title">Inspection History</h1>
        <p className="page-subtitle">Browsable log of all past fruit inspection sessions.</p>
      </div>

      {/* Errors */}
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
            <div className="alert-title">Firebase Not Configured</div>
            <div className="alert-body">
              {error} — Inspection history is stored in Firestore. Configure your Firebase service
              account key (see <code>README.md → Step 4</code>) to enable history.
            </div>
          </div>
        </div>
      )}

      {/* Table card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Inspection Records</div>
            <div className="card-subtitle">
              {loading ? 'Loading…' : `${filtered.length} of ${records.length} records`}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div className="search-wrap" style={{ minWidth: 220 }}>
              <span className="search-icon" aria-hidden="true">🔍</span>
              <input
                id="history-search-input"
                className="search-input"
                type="search"
                placeholder="Search by ID, fruit type, quality…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search inspection records"
              />
            </div>

            {/* Limit selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <label htmlFor="history-limit-select" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Show
              </label>
              <select
                id="history-limit-select"
                className="form-select"
                style={{ width: 'auto', paddingRight: 'var(--space-5)' }}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                aria-label="Number of records to show"
              >
                {[20, 50, 100, 200].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Refresh */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={load}
              disabled={loading}
              id="history-refresh-btn"
              aria-label="Refresh history"
            >
              {loading ? <span className="spinner spinner-dark" aria-hidden="true" /> : '↻'} Refresh
            </button>
          </div>
        </div>

        {/* Table body */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
            <span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} aria-label="Loading history" />
          </div>
        ) : filtered.length === 0 && !error ? (
          <div className="empty-state">
            {search ? (
              <>
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">No Matching Records</div>
                <div className="empty-state-body">
                  No inspections match your search for &ldquo;{search}&rdquo;. Try a different search term.
                </div>
              </>
            ) : (
              <>
                <div className="empty-state-icon">🗂️</div>
                <div className="empty-state-title">No Inspections Yet</div>
                <div className="empty-state-body">
                  Your inspection history is empty. Run your first AI inspection and the results
                  will appear here once Firebase is configured and connected.
                </div>
              </>
            )}
          </div>
        ) : !error ? (
          <div className="table-wrap">
            <table aria-label="Inspection history table">
              <thead>
                <tr>
                  <th scope="col">Inspection ID</th>
                  <th scope="col">Timestamp</th>
                  <th scope="col">Fruit Count</th>
                  <th scope="col">Quality Summary</th>
                  <th scope="col">Model</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec) => {
                  const isExpanded = expanded === rec.inspection_id;
                  return (
                    <>
                      <tr key={rec.inspection_id || Math.random()}>
                        <td>
                          <code
                            style={{
                              fontSize: 'var(--text-xs)',
                              background: 'var(--gray-100)',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--color-text)',
                              fontFamily: 'monospace',
                            }}
                            title={rec.inspection_id}
                          >
                            {rec.inspection_id
                              ? rec.inspection_id.slice(0, 12) + '…'
                              : '—'}
                          </code>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                          {formatDate(rec.timestamp)}
                        </td>
                        <td style={{ fontWeight: 700, textAlign: 'center' }}>
                          {rec.fruit_count ?? '—'}
                        </td>
                        <td style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                          {qualitySummary(rec.results)}
                        </td>
                        <td>
                          <span
                            className={`badge ${rec.model_loaded ? 'badge-healthy' : 'badge-unknown'}`}
                            aria-label={`Model was ${rec.model_loaded ? 'loaded' : 'not loaded'}`}
                          >
                            {rec.model_loaded ? 'Loaded' : 'Not loaded'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setExpanded(isExpanded ? null : rec.inspection_id)}
                            aria-expanded={isExpanded}
                            aria-controls={`detail-row-${rec.inspection_id}`}
                            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                          >
                            {isExpanded ? '▲ Hide' : '▼ Show'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr
                          id={`detail-row-${rec.inspection_id}`}
                          key={`detail-${rec.inspection_id}`}
                          aria-label={`Detail for inspection ${rec.inspection_id}`}
                        >
                          <td colSpan={6} style={{ padding: 0, background: 'var(--green-50)' }}>
                            <div style={{ padding: 'var(--space-4) var(--space-6)' }}>
                              <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)', color: 'var(--color-primary)' }}>
                                Per-Fruit Results
                              </p>
                              {rec.results && rec.results.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                                  {rec.results.map((r, i) => (
                                    <div
                                      key={i}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-2)',
                                        padding: '6px var(--space-3)',
                                        background: 'var(--white)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--text-xs)',
                                      }}
                                    >
                                      <span style={{ fontWeight: 700 }}>{r.fruit_type || 'Unknown'}</span>
                                      <span className={`badge ${QUALITY_BADGE[r.quality] || 'badge-unknown'}`} style={{ padding: '1px 6px' }}>
                                        {r.quality}
                                      </span>
                                      {r.confidence != null && (
                                        <span style={{ color: 'var(--color-text-muted)' }}>
                                          {Math.round(r.confidence * 100)}%
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                                  No per-fruit detail available for this record.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
