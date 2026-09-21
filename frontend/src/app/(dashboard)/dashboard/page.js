'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { StatCard, Loading } from '@/components/ui';

const EMPTY_DASH = {
  members_count: 0,
  products_count: 0,
  sales_today: 0,
  sales_month: 0,
  pending_orders: 0,
  total_debts: 0,
  low_stock_count: 0,
};

const EMPTY_ACCT = {
  total_sales: 0,
  total_cogs: 0,
  total_expenses: 0,
  gross_profit: 0,
  net_profit: 0,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [acct, setAcct] = useState(EMPTY_ACCT);
  const [sales, setSales] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [debts, setDebts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [dash, accounting, salesRes, low, deb] = await Promise.all([
          api.get('/api/dashboard').catch(() => null),
          api.get('/api/accounting').catch(() => null),
          api.get('/api/sales?limit=8').catch(() => []),
          api.get('/api/products/low-stock').catch(() => []),
          api.get('/api/debts').catch(() => []),
        ]);

        if (cancelled) return;

        setData(dash && typeof dash === 'object' ? { ...EMPTY_DASH, ...dash } : EMPTY_DASH);
        setAcct(accounting && typeof accounting === 'object' ? { ...EMPTY_ACCT, ...accounting } : EMPTY_ACCT);
        setSales(Array.isArray(salesRes) ? salesRes : salesRes?.items || []);
        setLowStock(Array.isArray(low) ? low : []);
        const debtList = Array.isArray(deb) ? deb : deb?.items || [];
        setDebts([...debtList].sort((a, b) => (b.remaining || 0) - (a.remaining || 0)));

        const list = [];
        (Array.isArray(low) ? low : []).forEach((p) =>
          list.push({
            cls: 'al-w',
            text: `📦 <strong>${p.name}</strong>: ${p.stock_quantity} ${p.unit || ''} باقي!`,
          })
        );
        debtList.forEach((d) =>
          list.push({
            cls: 'al-d',
            text: `💳 <strong>${d.member_name || '—'}</strong>: خاصو يخلص ${Number(d.remaining || 0).toFixed(2)} د.م`,
          })
        );
        setAlerts(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Loading />;

  const d = data || EMPTY_DASH;
  const n2 = (v) => Number(v || 0).toFixed(2);
  const low = (lowStock || []).slice(0, 6);
  const topDebts = (debts || []).slice(0, 5);
  const displayName = user?.full_name || user?.username || 'مستخدم';

  const isEmpty =
    !d.members_count &&
    !d.products_count &&
    !d.sales_today &&
    !d.sales_month &&
    !(sales || []).length;

  return (
    <div>
      <div
        style={{
          background: 'linear-gradient(135deg,#0d5c4d,#1a9b82)',
          color: 'white',
          borderRadius: 18,
          padding: '18px 24px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 12px 32px rgba(13,92,77,0.3)',
        }}
      >
        <div>
          <div style={{ fontSize: '1.2em', fontWeight: 800 }}>👋 مرحبا، {displayName}</div>
          <div style={{ opacity: 0.88, fontSize: '0.86em', marginTop: 4 }}>
            {isEmpty
              ? 'المشروع فاضي — ابدأ بإضافة الأعضاء والمنتجات من القائمة'
              : 'هذاي لوحة التحكم ديالك — نظام التعاونية'}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '7px 16px',
            borderRadius: 20,
            fontSize: '0.82em',
            fontWeight: 700,
          }}
        >
          {user?.role === 'admin' ? '👑 مدير' : '👤 مستخدم'}
        </div>
      </div>

      {isEmpty && (
        <div className="wc" style={{ borderTop: '4px solid #c9a227', marginBottom: 20 }}>
          <div style={{ textAlign: 'center', padding: '28px 16px' }}>
            <div style={{ fontSize: '2.8em', marginBottom: 10, opacity: 0.5 }}>🚀</div>
            <h4 style={{ margin: '0 0 8px', fontWeight: 800, color: '#1e293b' }}>ابدأ من الصفر</h4>
            <p style={{ color: '#64748b', margin: '0 0 20px', fontSize: '0.92em' }}>
              ما كاين حتى بيانات الآن. أضف البيانات من هذا الاختصارات:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              <Link href="/members" className="btn btn-p">
                <i className="fas fa-users" /> الأعضاء
              </Link>
              <Link href="/products" className="btn btn-p">
                <i className="fas fa-boxes-stacked" /> المنتجات
              </Link>
              <Link href="/clients" className="btn btn-sec">
                <i className="fas fa-handshake" /> الزبناء
              </Link>
              <Link href="/sales" className="btn btn-sec">
                <i className="fas fa-file-invoice" /> المبيعات
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <StatCard color="c-blue" icon="users" label="الأعضاء" value={d.members_count || 0} />
        </div>
        <div className="col-md-3">
          <StatCard color="c-purple" icon="boxes-stacked" label="المنتجات" value={d.products_count || 0} />
        </div>
        <div className="col-md-3">
          <StatCard color="c-green" icon="cart-shopping" label="مبيعات اليوم د.م" value={n2(d.sales_today)} />
        </div>
        <div className="col-md-3">
          <StatCard color="c-orange" icon="chart-line" label="مبيعات الشهر د.م" value={n2(d.sales_month)} />
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <StatCard color="c-pink" icon="file-invoice-dollar" label="الديون د.م" value={n2(d.total_debts)} />
        </div>
        <div className="col-md-3">
          <StatCard color="c-teal" icon="truck" label="أوامر معلّقة" value={d.pending_orders || 0} />
        </div>
        <div className="col-md-3">
          <StatCard color="c-red" icon="triangle-exclamation" label="مخزون منخفض" value={d.low_stock_count || low.length} />
        </div>
        <div className="col-md-3">
          <StatCard
            color="c-dark"
            icon="coins"
            label="الربح الصافي د.م"
            value={n2(acct?.net_profit)}
          />
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="wc" style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>⚠️ تنبيهات</div>
          {alerts.slice(0, 6).map((a, i) => (
            <div key={i} className={`al ${a.cls}`} style={{ marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: a.text }} />
          ))}
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-6">
          <div className="wc">
            <div className="wc-head">
              <div style={{ fontWeight: 800 }}>🛒 آخر المبيعات</div>
              <Link href="/sales" className="btn btn-p btn-sm">
                الكل
              </Link>
            </div>
            {(sales || []).length === 0 ? (
              <div className="al al-i" style={{ justifyContent: 'center' }}>
                📭 لا توجد مبيعات بعد — أضف أول عملية من نقطة البيع
              </div>
            ) : (
              <div className="table-wrap">
                <table className="ct">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>المبلغ</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sales || []).slice(0, 8).map((s, i) => (
                      <tr key={s.id || i}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 700 }}>{n2(s.total || s.total_amount)} د.م</td>
                        <td style={{ color: '#64748b', fontSize: '0.85em' }}>
                          {s.created_at ? new Date(s.created_at).toLocaleDateString('ar-MA') : s.date || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="wc">
            <div className="wc-head">
              <div style={{ fontWeight: 800 }}>📊 ملخص محاسبي</div>
              <Link href="/accounting" className="btn btn-p btn-sm">
                التفاصيل
              </Link>
            </div>
            <div className="acc-row">
              <span className="acc-label">المبيعات</span>
              <span className="acc-value acc-neutral">{n2(acct?.total_sales)} د.م</span>
            </div>
            <div className="acc-row">
              <span className="acc-label">تكلفة البضاعة</span>
              <span className="acc-value">{n2(acct?.total_cogs)} د.م</span>
            </div>
            <div className="acc-row">
              <span className="acc-label">المصاريف</span>
              <span className="acc-value acc-negative">{n2(acct?.total_expenses)} د.م</span>
            </div>
            <div className="acc-row">
              <span className="acc-label">الربح الإجمالي</span>
              <span className="acc-value acc-positive">{n2(acct?.gross_profit)} د.م</span>
            </div>
            <div className="acc-row">
              <span className="acc-label">الربح الصافي</span>
              <span
                className={`acc-value ${(acct?.net_profit || 0) >= 0 ? 'acc-positive' : 'acc-negative'}`}
              >
                {n2(acct?.net_profit)} د.م
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3" style={{ marginTop: 4 }}>
        <div className="col-md-6">
          <div className="wc">
            <div className="wc-head">
              <div style={{ fontWeight: 800 }}>📦 مخزون قرب يسالي</div>
              <Link href="/products" className="btn btn-sec btn-sm">
                الكل
              </Link>
            </div>
            {low.length === 0 ? (
              <div className="al al-s" style={{ justifyContent: 'center' }}>
                ✅ كولشي مزيان — ما كاين تحذير مخزون
              </div>
            ) : (
              low.map((p) => {
                const pct =
                  p.min_stock > 0 ? Math.min(100, (p.stock_quantity / p.min_stock) * 100) : 0;
                const col = pct < 30 ? '#f5576c' : pct < 70 ? '#ffc107' : '#43e97b';
                return (
                  <div style={{ marginBottom: 12 }} key={p.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88em' }}>{p.name}</span>
                      <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>
                        {p.stock_quantity}/{p.min_stock} {p.unit}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        background: '#f1f5f9',
                        borderRadius: 99,
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="wc">
            <div className="wc-head">
              <div style={{ fontWeight: 800 }}>💳 أكبر الديون</div>
              <Link href="/debts" className="btn btn-sec btn-sm">
                الكل
              </Link>
            </div>
            {topDebts.length === 0 ? (
              <div className="al al-s" style={{ justifyContent: 'center' }}>
                ✅ لا توجد ديون معلقة
              </div>
            ) : (
              topDebts.map((d) => {
                const pct =
                  d.total_debt > 0
                    ? Math.min(100, (d.paid_amount / d.total_debt) * 100).toFixed(0)
                    : 0;
                return (
                  <div style={{ marginBottom: 12 }} key={d.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88em' }}>{d.member_name}</span>
                      <span style={{ color: '#f5576c', fontWeight: 800, fontSize: '0.88em' }}>
                        {n2(d.remaining)} د.م
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 8,
                          background: '#f1f5f9',
                          borderRadius: 99,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: '#43e97b',
                            borderRadius: 99,
                          }}
                        />
                      </div>
                      <small style={{ color: '#94a3b8' }}>{pct}%</small>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
