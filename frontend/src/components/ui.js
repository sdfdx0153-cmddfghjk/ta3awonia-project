'use client';

export function StatCard({ color, icon, label, value, sub }) {
  return (
    <div className={`sc ${color}`}>
      <i className={`fas fa-${icon} bg-ic`} />
      <div style={{ fontSize: '1.9em', fontWeight: 'bold', margin: '4px 0' }}>{value}</div>
      <div className="lbl">{label}</div>
      {sub && (
        <div
          className="sub"
          style={{
            fontSize: '0.73em',
            marginTop: 5,
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 8px',
            borderRadius: 20,
            display: 'inline-block',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export function Loading({ text = '⏳ جاري التحميل...' }) {
  return (
    <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
      <div style={{ fontSize: '1.6em', marginBottom: 8, opacity: 0.6 }}>⏳</div>
      <div style={{ fontWeight: 600 }}>{text}</div>
    </div>
  );
}

export function Empty({ text, colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan || 1} style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
        <div style={{ fontSize: '2em', opacity: 0.35, marginBottom: 8 }}>📭</div>
        <div style={{ fontWeight: 600, fontSize: '0.95em' }}>{text || 'ما كاين والو'}</div>
        <div style={{ fontSize: '0.8em', marginTop: 4, opacity: 0.7 }}>أضف بيانات جديدة من الزر فوق</div>
      </td>
    </tr>
  );
}

export function PageHeader({ title, count, actions }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
        flexWrap: 'wrap',
        gap: 10,
      }}
    >
      <div>
        <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.25em', color: '#1e293b', letterSpacing: '-0.02em' }}>{title}</h4>
        {count && <small style={{ color: '#94a3b8', fontWeight: 600 }}>{count}</small>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>{actions}</div>
    </div>
  );
}

export function Badge({ variant, children }) {
  const map = {
    success: 'bs',
    danger: 'bd',
    warning: 'bw',
    info: 'bi',
    purple: 'bp',
  };
  return <span className={map[variant] || 'bi'}>{children}</span>;
}
