/**
 * StatCard.jsx — Individual statistic card for the overview grid
 */
export default function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  accentColor,
  meta,
}) {
  return (
    <article
      className="stat-card"
      style={{
        '--stat-color': accentColor || 'var(--green-500)',
        '--stat-icon-bg': iconBg || 'var(--green-50)',
        '--stat-icon-color': iconColor || 'var(--green-600)',
      }}
      aria-label={`${label}: ${value}`}
    >
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-icon" aria-hidden="true">{icon}</div>
      </div>
      <div className="stat-card-value">{value ?? '—'}</div>
      {meta && <div className="stat-card-meta">{meta}</div>}
    </article>
  );
}
