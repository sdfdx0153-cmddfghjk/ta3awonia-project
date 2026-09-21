'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const NAV = [
  {
    section: null,
    items: [
      { key: 'dashboard', icon: 'fa-chart-pie', label: 'لوحة التحكم' },
      { key: 'board', icon: 'fa-landmark', label: 'مجلس الإدارة' },
      { key: 'users', icon: 'fa-users-cog', label: 'إدارة المستخدمين' },
      { key: 'assemblies', icon: 'fa-calendar-alt', label: 'الجمعيات العامة' },
      { key: 'minutes', icon: 'fa-file-alt', label: 'محاضر الاجتماعات' },
      { key: 'decisions', icon: 'fa-key', label: 'سجل القرارات' },
      { key: 'committees', icon: 'fa-sitemap', label: 'اللجان' },
      { key: 'attendance', icon: 'fa-user-check', label: 'سجل الحضور' },
      { key: 'members', icon: 'fa-users', label: 'الأعضاء' },
    ],
  },
  {
    section: 'المالية',
    items: [
      { key: 'accounting', icon: 'fa-calculator', label: 'المحاسبة العامة' },
      { key: 'contributions', icon: 'fa-hand-holding-usd', label: 'الحصص والاشتراكات' },
      { key: 'share-certificates', icon: 'fa-certificate', label: 'شهذاات الحصص' },
      { key: 'treasury', icon: 'fa-university', label: 'الصندوق والخزينة' },
      { key: 'budget', icon: 'fa-chart-pie', label: 'الميزانية' },
      { key: 'debts', icon: 'fa-file-invoice-dollar', label: 'الديون' },
      { key: 'expenses', icon: 'fa-wallet', label: 'المصاريف' },
      { key: 'profits', icon: 'fa-coins', label: 'توزيع الأرباح' },
      { key: 'fiscal-year', icon: 'fa-calendar', label: 'السنة المالية' },
    ],
  },
  {
    section: 'التجارة',
    items: [
      { key: 'products', icon: 'fa-boxes-stacked', label: 'المنتجات والمخزون' },
      { key: 'stock-moves', icon: 'fa-exchange-alt', label: 'حركات المخزون' },
      { key: 'inventory', icon: 'fa-clipboard-check', label: 'الجرد' },
      { key: 'sales', icon: 'fa-file-invoice', label: 'المبيعات والفواتير' },
      { key: 'purchases', icon: 'fa-truck', label: 'المشتريات والموردون' },
      { key: 'suppliers', icon: 'fa-industry', label: 'الموردون' },
    ],
  },
  {
    section: null,
    items: [
      { key: 'clients', icon: 'fa-handshake', label: 'الزبائن' },
    ],
  },
  {
    section: 'القانون والتنظيم',
    items: [
      { key: 'legal-docs', icon: 'fa-balance-scale', label: 'الوثائق القانونية' },
      { key: 'mandatory-records', icon: 'fa-book', label: 'السجلات الإلزامية' },
    ],
  },
  {
    section: 'التقارير',
    items: [
      { key: 'reports', icon: 'fa-chart-line', label: 'التقارير والإحصائيات' },
      { key: 'market-search', icon: 'fa-globe', label: 'بحث السوق والتعاونيات' },
      { key: 'export', icon: 'fa-file-export', label: 'تصدير ونسخ احتياطي' },
      { key: 'calendar', icon: 'fa-calendar', label: 'تقويم الاجتماعات' },
      { key: 'activity-log', icon: 'fa-history', label: 'سجل النشاط' },
    ],
  },
  {
    section: null,
    items: [
      { key: 'profile', icon: 'fa-user-circle', label: 'الملف الشخصي' },
      { key: 'settings', icon: 'fa-cog', label: 'الإعدادات' },
    ],
  },
];

const ICONS = {
  dashboard: 'fa-chart-pie',
  board: 'fa-landmark',
  users: 'fa-users-cog',
  assemblies: 'fa-calendar-alt',
  minutes: 'fa-file-alt',
  decisions: 'fa-key',
  committees: 'fa-sitemap',
  attendance: 'fa-user-check',
  members: 'fa-users',
  accounting: 'fa-calculator',
  contributions: 'fa-hand-holding-usd',
  'share-certificates': 'fa-certificate',
  treasury: 'fa-university',
  budget: 'fa-chart-pie',
  debts: 'fa-file-invoice-dollar',
  expenses: 'fa-wallet',
  profits: 'fa-coins',
  'fiscal-year': 'fa-calendar',
  products: 'fa-boxes-stacked',
  'stock-moves': 'fa-exchange-alt',
  inventory: 'fa-clipboard-check',
  sales: 'fa-file-invoice',
  purchases: 'fa-truck',
  suppliers: 'fa-industry',
  clients: 'fa-handshake',
  'legal-docs': 'fa-balance-scale',
  'mandatory-records': 'fa-book',
  reports: 'fa-chart-line',
  export: 'fa-file-export',
  'activity-log': 'fa-history',
  settings: 'fa-cog',
  profile: 'fa-user-circle',
  calendar: 'fa-calendar',
  'market-search': 'fa-globe',
};

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [time, setTime] = useState('');
  const [search, setSearch] = useState('');

  const active = pathname.split('/')[1] || 'dashboard';

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString('ar-MA'));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (active === 'purchases') return;
    let cancelled = false;
    api
      .get('/api/purchase-orders')
      .then((orders) => {
        if (cancelled) return;
        const pending = (orders || []).filter((o) => o.status === 'pending').length;
        const badge = document.getElementById('badge-orders');
        if (badge) {
          badge.style.display = pending > 0 ? 'inline' : 'none';
          badge.textContent = pending;
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function go(key) {
    router.push(`/${key}`);
    onClose?.();
  }

  const q = search.trim().toLowerCase();

  return (
    <aside
      className={`sidebar-scroll app-sidebar ${open ? 'is-open' : ''}`}
      style={{
        background: 'linear-gradient(175deg, #0a3d34 0%, #0d5c4d 40%, #147a66 100%)',
        minHeight: '100vh',
        height: '100vh',
        color: 'white',
        position: 'fixed',
        width: 260,
        right: 0,
        top: 0,
        zIndex: 200,
        boxShadow: '-8px 0 32px rgba(13,92,77,0.35)',
        overflowY: 'auto',
        overflowX: 'hidden',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          padding: '20px 16px 16px',
          textAlign: 'center',
          borderBottom: '1px solid #ffffff12',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent)',
          position: 'relative',
        }}
      >
        {/* زر إغلاق على الموبايل */}
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={() => onClose?.()}
          aria-label="إغلاق"
        >
          <i className="fas fa-times" />
        </button>
        <div
          style={{
            width: 72,
            height: 72,
            margin: '0 auto 12px',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            padding: 6,
          }}
        >
          <img
            src="/smart-conseil-logo.jpg"
            alt="Smart Conseil"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
        <h4 style={{ margin: 0, fontSize: '1.05em', fontWeight: 800, letterSpacing: '0.02em' }}>نظام التعاونية</h4>
        <small style={{ opacity: 0.55, fontSize: '0.72em', display: 'block', marginTop: 4 }}>Smart Conseil · Coopérative Manager</small>
      </div>

      <div style={{ padding: '12px 14px 8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '8px 12px',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <i className="fas fa-search" style={{ opacity: 0.6, fontSize: '0.85em' }} />
          <input
            type="search"
            placeholder="بحث في القائمة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontSize: '0.85em',
              width: '100%',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0 }}
              aria-label="مسح"
            >
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      </div>

      {NAV.map((sec, idx) => {
        const visibleItems = sec.items
          .filter((item) => item.key !== 'users' || user?.role === 'admin')
          .filter((item) => {
            if (!q) return true;
            return (
              item.label.toLowerCase().includes(q) ||
              item.key.toLowerCase().includes(q) ||
              (sec.section && sec.section.toLowerCase().includes(q))
            );
          });
        if (visibleItems.length === 0) return null;
        return (
        <div key={sec.section || `sec-${idx}`}>
          {sec.section && (
            <div
              style={{
                padding: '16px 22px 6px',
                fontSize: '0.65em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.32)',
                letterSpacing: '0.12em',
                fontWeight: 700,
              }}
            >
              {sec.section}
            </div>
          )}
          {visibleItems.map((item) => {
              const isActive = active === item.key;
              return (
                <div
                  key={item.key}
                  onClick={() => go(item.key)}
                  style={{
                    color: isActive ? 'white' : 'rgba(255,255,255,0.72)',
                    padding: '12px 20px',
                    margin: '2px 10px',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    transition: 'all 0.22s cubic-bezier(0.22,1,0.36,1)',
                    fontSize: '0.88em',
                    fontWeight: isActive ? 700 : 500,
                    borderRight: 'none',
                    background: isActive
                      ? 'linear-gradient(90deg, rgba(201,162,39,0.35), rgba(26,155,130,0.2))'
                      : 'transparent',
                    boxShadow: isActive ? '0 4px 16px rgba(201,162,39,0.2)' : 'none',
                    minHeight: 44,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isActive
                      ? 'linear-gradient(90deg, rgba(201,162,39,0.35), rgba(26,155,130,0.2))'
                      : 'transparent';
                  }}
                >
                  <i className={`fas ${ICONS[item.key] || item.icon}`} style={{ width: 18, textAlign: 'center' }} />
                  <span>{item.label}</span>
                  {item.key === 'purchases' && (
                    <span
                      id="badge-orders"
                      style={{
                        marginRight: 'auto',
                        background: '#f5576c',
                        color: 'white',
                        padding: '2px 7px',
                        borderRadius: 20,
                        fontSize: '0.72em',
                        display: 'none',
                      }}
                    >
                      0
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      );
      })}

      {user && (
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #ffffff11',
            fontSize: '0.8em',
            color: '#ffffffcc',
            marginTop: 8,
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>👤 {user.full_name || user.username}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ opacity: 0.6 }}>{time}</span>
            <button
              onClick={logout}
              style={{
                background: 'rgba(245,87,108,0.2)',
                color: '#ff8a8a',
                border: '1px solid #f5576c55',
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '0.78em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                minHeight: 40,
              }}
            >
              <i className="fas fa-sign-out-alt" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '12px 20px', fontSize: '0.72em', color: '#ffffff33', textAlign: 'center' }}>
        نظام التعاونية v2.1
      </div>
    </aside>
  );
}
