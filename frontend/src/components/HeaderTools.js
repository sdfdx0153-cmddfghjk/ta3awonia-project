'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const SEARCH_PAGES = [
  { key: 'members', label: 'الأعضاء', labelFr: 'Membres', icon: 'fa-users' },
  { key: 'products', label: 'المنتجات', labelFr: 'Produits', icon: 'fa-boxes-stacked' },
  { key: 'sales', label: 'المبيعات', labelFr: 'Ventes', icon: 'fa-file-invoice' },
  { key: 'debts', label: 'الديون', labelFr: 'Dettes', icon: 'fa-file-invoice-dollar' },
  { key: 'contributions', label: 'الحصص', labelFr: 'Parts', icon: 'fa-hand-holding-usd' },
  { key: 'assemblies', label: 'الجموعات', labelFr: 'Assemblées', icon: 'fa-calendar-alt' },
  { key: 'minutes', label: 'المحاضر', labelFr: 'Procès-verbaux', icon: 'fa-file-alt' },
  { key: 'treasury', label: 'الخزينة', labelFr: 'Trésorerie', icon: 'fa-university' },
  { key: 'reports', label: 'التقارير', labelFr: 'Rapports', icon: 'fa-chart-line' },
  { key: 'settings', label: 'الإعدادات', labelFr: 'Paramètres', icon: 'fa-cog' },
  { key: 'profile', label: 'الملف الشخصي', labelFr: 'Profil', icon: 'fa-user' },
  { key: 'calendar', label: 'التقويم', labelFr: 'Calendrier', icon: 'fa-calendar' },
  { key: 'export', label: 'التصدير', labelFr: 'Export', icon: 'fa-file-export' },
  { key: 'market-search', label: 'بحث السوق', labelFr: 'Marché', icon: 'fa-globe' },
];

export default function HeaderTools() {
  const router = useRouter();
  const { user } = useAuth();
  const { dark, toggleDark, lang, toggleLang } = useTheme();
  const [q, setQ] = useState('');
  const [openSearch, setOpenSearch] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function loadAlerts() {
      try {
        const [low, deb, assemblies] = await Promise.all([
          api.get('/api/products/low-stock').catch(() => []),
          api.get('/api/debts').catch(() => []),
          api.get('/api/assemblies').catch(() => []),
        ]);
        if (cancelled) return;
        const list = [];
        (Array.isArray(low) ? low : []).forEach((p) =>
          list.push({
            type: 'warn',
            icon: 'fa-box',
            title: lang === 'fr' ? 'Stock bas' : 'مخزون قليل',
            text: `${p.name}: ${p.stock_quantity} ${p.unit || ''}`,
            href: '/products',
          })
        );
        const debtList = Array.isArray(deb) ? deb : deb?.items || [];
        debtList
          .filter((d) => Number(d.remaining || 0) > 0)
          .slice(0, 8)
          .forEach((d) =>
            list.push({
              type: 'danger',
              icon: 'fa-credit-card',
              title: lang === 'fr' ? 'Dette en retard' : 'دين متأخر',
              text: `${d.member_name || '—'} — ${Number(d.remaining || 0).toFixed(2)} د.م`,
              href: '/debts',
            })
          );
        const asap = (Array.isArray(assemblies) ? assemblies : assemblies?.items || [])
          .filter((a) => a.date || a.assembly_date)
          .slice(0, 5);
        asap.forEach((a) => {
          const dt = new Date(a.date || a.assembly_date);
          if (dt >= new Date(Date.now() - 86400000)) {
            list.push({
              type: 'info',
              icon: 'fa-calendar',
              title: lang === 'fr' ? 'Assemblée' : 'اجتماع قريب',
              text: a.title || a.name || 'جمعية عامة',
              href: '/assemblies',
            });
          }
        });
        setAlerts(list);
      } catch {
        /* ignore */
      }
    }
    loadAlerts();
    const t = setInterval(loadAlerts, 60000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [lang]);

  useEffect(() => {
    function onDoc(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setOpenSearch(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = q.trim()
    ? SEARCH_PAGES.filter((p) => {
        const s = q.trim().toLowerCase();
        return (
          p.label.includes(s) ||
          p.labelFr.toLowerCase().includes(s) ||
          p.key.includes(s)
        );
      })
    : SEARCH_PAGES.slice(0, 6);

  const unread = alerts.length;

  const iconBtn = {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #d8e5df',
    background: dark ? 'rgba(255,255,255,0.1)' : '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1.05em',
    lineHeight: 1,
    padding: 0,
    color: dark ? '#e8c547' : '#0d5c4d',
    boxShadow: dark ? 'none' : '0 1px 3px rgba(13,92,77,0.08)',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {/* لوغو صغير */}
      <img
        src="/smart-conseil-logo.jpg"
        alt="Smart Conseil"
        title="Smart Conseil"
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          objectFit: 'contain',
          background: '#fff',
          padding: 3,
          border: '1px solid rgba(201,162,39,0.35)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}
      />

      {/* بحث عام */}
      <div ref={searchRef} style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: dark ? 'rgba(255,255,255,0.08)' : '#f0f2f5',
            borderRadius: 20,
            padding: '6px 12px',
            border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
            minWidth: 160,
          }}
        >
          <span style={{ opacity: 0.55, fontSize: '0.9em' }}>🔍</span>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpenSearch(true);
            }}
            onFocus={() => setOpenSearch(true)}
            placeholder={lang === 'fr' ? 'Recherche…' : 'بحث سريع…'}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.82em',
              width: 120,
              color: 'inherit',
            }}
          />
        </div>
        {openSearch && (
          <div
            style={{
              position: 'absolute',
              top: '110%',
              left: 0,
              right: 0,
              minWidth: 220,
              background: dark ? '#1a2e28' : '#fff',
              borderRadius: 12,
              boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
              border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
              zIndex: 200,
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            {filtered.length === 0 && (
              <div style={{ padding: 12, fontSize: '0.85em', opacity: 0.6, textAlign: 'center' }}>
                {lang === 'fr' ? 'Aucun résultat' : 'ما كاين حتى نتيجة'}
              </div>
            )}
            {filtered.map((p) => (
              <div
                key={p.key}
                onClick={() => {
                  router.push(`/${p.key}`);
                  setOpenSearch(false);
                  setQ('');
                }}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.85em',
                  borderBottom: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : '#f0fdf4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <i className={`fas ${p.icon}`} style={{ color: '#c9a227', width: 18 }} />
                {lang === 'fr' ? p.labelFr : p.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* إشعارات */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpenNotif((v) => !v)}
          style={{ ...iconBtn, position: 'relative' }}
          title={lang === 'fr' ? 'Notifications' : 'الإشعارات'}
        >
          🔔
          {unread > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                left: -4,
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65em',
                fontWeight: 800,
                minWidth: 16,
                height: 16,
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        {openNotif && (
          <div
            style={{
              position: 'absolute',
              top: '110%',
              left: 0,
              width: 300,
              maxHeight: 360,
              overflowY: 'auto',
              background: dark ? '#1a2e28' : '#fff',
              borderRadius: 14,
              boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
              border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
              zIndex: 200,
            }}
          >
            <div
              style={{
                padding: '12px 14px',
                fontWeight: 800,
                fontSize: '0.88em',
                borderBottom: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eef5f2',
                color: dark ? '#e8c547' : '#0d5c4d',
              }}
            >
              {lang === 'fr' ? 'Notifications' : 'الإشعارات'} ({unread})
            </div>
            {alerts.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', opacity: 0.6, fontSize: '0.85em' }}>
                {lang === 'fr' ? 'Aucune alerte' : 'ما كاين حتى تنبيه 👍'}
              </div>
            )}
            {alerts.map((a, i) => (
              <div
                key={i}
                onClick={() => {
                  router.push(a.href);
                  setOpenNotif(false);
                }}
                style={{
                  padding: '11px 14px',
                  cursor: 'pointer',
                  borderBottom: dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f8fafc',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <i
                  className={`fas ${a.icon}`}
                  style={{
                    marginTop: 2,
                    color: a.type === 'danger' ? '#ef4444' : a.type === 'warn' ? '#f59e0b' : '#0d5c4d',
                  }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.8em' }}>{a.title}</div>
                  <div style={{ fontSize: '0.75em', opacity: 0.75, marginTop: 2 }}>{a.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* وضع ليلي */}
      <button
        type="button"
        onClick={toggleDark}
        style={iconBtn}
        title={dark ? (lang === 'fr' ? 'Mode clair' : 'وضع نهاري') : lang === 'fr' ? 'Mode sombre' : 'وضع ليلي'}
      >
        {dark ? '☀️' : '🌙'}
      </button>

      {/* لغة */}
      <button
        type="button"
        onClick={toggleLang}
        style={{
          ...iconBtn,
          width: 'auto',
          padding: '0 10px',
          fontWeight: 800,
          fontSize: '0.78em',
          letterSpacing: '0.02em',
        }}
        title={lang === 'ar' ? 'Français' : 'العربية'}
      >
        {lang === 'ar' ? 'FR' : 'ع'}
      </button>

      {/* ملف شخصي */}
      <button
        type="button"
        onClick={() => router.push('/profile')}
        style={{
          ...iconBtn,
          width: 'auto',
          padding: '0 10px 0 6px',
          gap: 6,
        }}
        title={lang === 'fr' ? 'Profil' : 'الملف الشخصي'}
      >
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            background: 'linear-gradient(135deg,#0d5c4d,#1a9b82)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.72em',
            fontWeight: 800,
          }}
        >
          {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
        </span>
        <span style={{ fontSize: '0.8em', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>
          {user?.full_name || user?.username || ''}
        </span>
      </button>

      {/* واتساب دعم */}
      <a
        href="https://wa.me/212600000000"
        target="_blank"
        rel="noreferrer"
        style={{
          ...iconBtn,
          background: '#25D366',
          border: 'none',
          color: '#fff',
          textDecoration: 'none',
          fontSize: '1.15em',
        }}
        title="WhatsApp"
      >
        💬
      </a>
    </div>
  );
}
