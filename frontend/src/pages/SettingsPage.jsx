/**
 * SettingsPage.jsx — Application preferences
 * Pure client-side settings stored in localStorage.
 * No Firebase credentials are handled here.
 */
import { useState, useEffect } from 'react';

const DEFAULT_SETTINGS = {
  backendUrl:       'http://127.0.0.1:8000',
  historyLimit:     50,
  autoRefresh:      false,
  showConfidence:   true,
  compactTable:     false,
  theme:            'light',
};

function loadSettings() {
  try {
    const saved = localStorage.getItem('fruitqualityai_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s) {
  try {
    localStorage.setItem('fruitqualityai_settings', JSON.stringify(s));
  } catch {
    // localStorage not available
  }
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
      <div className="card-header">
        <div className="card-title">{title}</div>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ id, label, description, checked, onChange }) {
  return (
    <div className="toggle-wrap">
      <div className="toggle-label-group">
        <label className="toggle-label" htmlFor={id}>{label}</label>
        {description && <span className="toggle-desc">{description}</span>}
      </div>
      <label className="toggle-switch">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-slider" />
      </label>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(loadSettings);
  const [saved,    setSaved]    = useState(false);

  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    setSaved(false);
  };

  return (
    <div className="page-content animate-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure application behaviour and preferences.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleReset}
            id="settings-reset-btn"
            aria-label="Reset all settings to defaults"
          >
            Reset to Defaults
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            id="settings-save-btn"
            aria-label="Save settings"
          >
            {saved ? '✓ Saved!' : '💾 Save Settings'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="alert alert-success" role="status" aria-live="polite" style={{ marginBottom: 'var(--space-5)' }}>
          <span className="alert-icon">✅</span>
          <div className="alert-content">
            <div className="alert-title">Settings Saved</div>
            <div className="alert-body">Your preferences have been saved to local storage.</div>
          </div>
        </div>
      )}

      {/* API Connection */}
      <Section title="🔗 API Connection">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="settings-backend-url">
            Backend URL
          </label>
          <input
            id="settings-backend-url"
            className="form-input"
            type="url"
            value={settings.backendUrl}
            onChange={(e) => update('backendUrl', e.target.value)}
            placeholder="http://127.0.0.1:8000"
            aria-describedby="backend-url-hint"
          />
          <p id="backend-url-hint" className="form-hint">
            Base URL of the FastAPI backend server. Default: <code>http://127.0.0.1:8000</code>.
            Changing this here is informational only — the API client always uses the default URL
            unless the code is updated.
          </p>
        </div>

        <div className="alert alert-info" role="note">
          <span className="alert-icon">ℹ️</span>
          <div className="alert-content">
            <div className="alert-title">Firebase Configuration</div>
            <div className="alert-body">
              Firebase credentials are handled securely through the backend. Do not add any Firebase
              API keys or service account information to this frontend application.
              Configure Firebase by adding <code>backend/.env</code> and a service account key file
              on the server side only.
            </div>
          </div>
        </div>
      </Section>

      {/* Inspection */}
      <Section title="🔬 Inspection Preferences">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="settings-history-limit">
            Default History Limit
          </label>
          <select
            id="settings-history-limit"
            className="form-select"
            value={settings.historyLimit}
            onChange={(e) => update('historyLimit', Number(e.target.value))}
          >
            {[20, 50, 100, 200].map(n => (
              <option key={n} value={n}>{n} records</option>
            ))}
          </select>
          <p className="form-hint">Number of inspection records fetched by default on the History page.</p>
        </div>

        <Toggle
          id="settings-show-confidence"
          label="Show Confidence Scores"
          description="Display model confidence percentages alongside each fruit classification result."
          checked={settings.showConfidence}
          onChange={(v) => update('showConfidence', v)}
        />

        <Toggle
          id="settings-compact-table"
          label="Compact Table View"
          description="Use a denser row layout in the Inspection History table."
          checked={settings.compactTable}
          onChange={(v) => update('compactTable', v)}
        />

        <Toggle
          id="settings-auto-refresh"
          label="Auto-Refresh Dashboard"
          description="Automatically refresh the Overview dashboard every 60 seconds."
          checked={settings.autoRefresh}
          onChange={(v) => update('autoRefresh', v)}
        />
      </Section>

      {/* About */}
      <Section title="ℹ️ About">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 'var(--space-2) var(--space-6)',
            fontSize: 'var(--text-sm)',
          }}
        >
          {[
            ['Application',   'FruitQualityAI Dashboard'],
            ['Version',       '1.0.0'],
            ['Frontend',      'React 19 + Vite 8'],
            ['Backend',       'FastAPI 0.1.0'],
            ['AI Model',      'Awaiting trained model in backend/ml_models/'],
            ['Database',      'Cloud Firestore (via backend)'],
            ['Author',        'FruitQualityAI Team'],
          ].map(([key, val]) => (
            <>
              <dt key={`k-${key}`} style={{ fontWeight: 700, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{key}</dt>
              <dd key={`v-${key}`} style={{ color: 'var(--color-text)' }}>{val}</dd>
            </>
          ))}
        </div>
      </Section>
    </div>
  );
}
