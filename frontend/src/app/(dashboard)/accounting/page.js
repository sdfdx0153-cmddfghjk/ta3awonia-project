'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatCard, Loading } from '@/components/ui';

function Row({ label, value, cls }) {
  return (
    <div className="acc-row">
      <span className="acc-label">{label}</span>
      <span className={`acc-value ${cls || ''}`}>{value}</span>
    </div>
  );
}

function Section({ title, color, children, gradient }) {
  return (
    <div style={{ background: gradient ? 'linear-gradient(135deg,#0f0c29,#302b63)' : '#f8f9ff', borderRadius: 12, padding: 14, marginBottom: 12, color: gradient ? 'white' : 'inherit' }}>
      <div style={{ fontWeight: 'bold', color, marginBottom: 8, fontSize: '0.88em' }}>{title}</div>
      {children}
    </div>
  );
}

export default function AccountingPage() {
  const [d, setD] = useState(null);

  useEffect(() => {
    api.get('/api/accounting').then(setD).catch((e) => alert(`مشكلة فيالحسابات! ${e.message}`));
  }, []);

  if (!d) return <Loading />;

  const n2 = (v) => Number(v || 0).toFixed(2);
  const dp = d.total_debts > 0 ? (d.total_contributions / (d.total_contributions + d.total_debts)) * 100 : 100;
  const ep = d.total_sales > 0 ? (d.total_expenses / d.total_sales) * 100 : 0;
  const sp = d.total_assets > 0 ? (d.stock_value / d.total_assets) * 100 : 0;

  return (
    <div>
      <h4 style={{ marginBottom: 18, fontWeight: 'bold' }}>📊 الحسابات والميزانية</h4>
      <div className="row g-3 mb-3">
        <div className="col-md-3 col-6"><StatCard color="c-green" icon="chart-line" label="إجمالي المبيعات د.م" value={n2(d.total_sales)} sub="💰 الكل" /></div>
        <div className="col-md-3 col-6"><StatCard color="c-orange" icon="box" label="تكلفة البضاعة د.م" value={n2(d.total_cogs)} sub="🏭 COGS" /></div>
        <div className="col-md-3 col-6"><StatCard color="c-blue" icon="chart-pie" label="الربح الإجمالي د.م" value={n2(d.gross_profit)} sub="🟢 قبل المصاريف" /></div>
        <div className="col-md-3 col-6"><StatCard color="c-teal" icon="coins" label="الربح الصافي د.م" value={n2(d.net_profit)} sub="✅ بعد كولشي" /></div>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="wc">
            <div className="wc-head"><div className="wc-title">📋 حساب الأرباح والخسائر</div></div>
            <Section title="💰 الإيرادات" color="#43e97b">
              <Row label="إجمالي المبيعات" value={`${n2(d.total_sales)} د.م`} cls="acc-positive" />
              <Row label="مساهمات الأعضاء" value={`${n2(d.total_contributions)} د.م`} cls="acc-positive" />
            </Section>
            <Section title="💸 التكاليف" color="#f5576c">
              <Row label="تكلفة البضاعة المباعة" value={`${n2(d.total_cogs)} د.م`} cls="acc-negative" />
              <Row label="المصاريف التشغيلية" value={`${n2(d.total_expenses)} د.م`} cls="acc-negative" />
            </Section>
            <Section title="📊 النتيجة" color="#43e97b" gradient>
              <div className="acc-row" style={{ borderBottomColor: '#ffffff22' }}>
                <span style={{ opacity: 0.8 }}>الربح الإجمالي</span>
                <span style={{ fontWeight: 'bold', color: '#43e97b' }}>{n2(d.gross_profit)} د.م</span>
              </div>
              <div className="acc-row" style={{ borderBottom: 'none' }}>
                <span style={{ opacity: 0.8, fontSize: '1.05em' }}>💰 الربح الصافي</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.25em', color: '#43e97b' }}>{n2(d.net_profit)} د.م</span>
              </div>
            </Section>
          </div>
        </div>

        <div className="col-md-6">
          <div className="wc">
            <div className="wc-head"><div className="wc-title">🏦 الميزانية العمومية</div></div>
            <Section title="📦 الأصول" color="#4facfe">
              <Row label="قيمة المخزون" value={`${n2(d.stock_value)} د.م`} cls="acc-neutral" />
              <Row label="ديون العملاء" value={`${n2(d.total_debts)} د.م`} cls="acc-neutral" />
              <Row label="مساهمات الأعضاء" value={`${n2(d.total_shares)} د.م`} cls="acc-neutral" />
            </Section>
            <Section title="💸 الخصوم" color="#f5576c">
              <Row label="المصاريف المتراكمة" value={`${n2(d.total_expenses)} د.م`} cls="acc-negative" />
            </Section>
            <div style={{ background: 'linear-gradient(135deg,#11998e,#38ef7d)', borderRadius: 12, padding: 14, color: '#1a1a1a' }}>
              <div className="acc-row" style={{ borderBottom: 'none' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.02em' }}>📊 صافي الأصول</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.35em' }}>{n2(d.net_assets)} د.م</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="wc">
            <div className="wc-head"><div className="wc-title">📈 مؤشرات الأداء</div></div>
            <Kpi label="هامش الربح الإجمالي" value={`${d.profit_margin.toFixed(1)}%`} pct={Math.min(100, d.profit_margin)} color="#4facfe" />
            <Kpi label="نسبة تحصيل الديون" value={`${dp.toFixed(1)}%`} pct={Math.min(100, dp)} color="#43e97b" />
            <Kpi label="نسبة المصاريف من المبيعات" value={`${ep.toFixed(1)}%`} pct={Math.min(100, ep)} color="#f5576c" />
            <Kpi label="مستوى المخزون من الأصول" value={`${sp.toFixed(1)}%`} pct={Math.min(100, sp)} color="#fa8231" />
          </div>
        </div>

        <div className="col-md-6">
          <div className="wc">
            <div className="wc-head"><div className="wc-title">📅 ملخص الشهر</div></div>
            <div className="row g-3">
              <div className="col-6"><Box value={n2(d.month.sales)} label="💰 مبيعات الشهر" color="#43e97b" /></div>
              <div className="col-6"><Box value={n2(d.month.expenses)} label="💸 مصاريف الشهر" color="#f5576c" /></div>
              <div className="col-6"><Box value={n2(d.month.inventory_value)} label="📦 قيمة المخزون" color="#4facfe" /></div>
              <div className="col-6"><Box value={n2(d.month.pending_debts)} label="📝 ديون معلقة" color="#667eea" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, pct, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: '0.86em', color: '#555' }}>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="prog"><div className="prog-bar" style={{ background: color, width: `${pct}%` }} /></div>
    </div>
  );
}

function Box({ value, label, color }) {
  return (
    <div style={{ background: '#f8f9ff', borderRadius: 12, padding: 14, textAlign: 'center' }}>
      <div style={{ fontSize: '1.7em', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ fontSize: '0.8em', color: '#666' }}>{label}</div>
    </div>
  );
}
