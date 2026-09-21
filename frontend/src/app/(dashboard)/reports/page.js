'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Bar, Doughnut } from '@/lib/charts';
import { Loading } from '@/components/ui';

export default function ReportsPage() {
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [sales7, setSales7] = useState(null);
  const [cats, setCats] = useState(null);
  const [acct, setAcct] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/members'),
      api.get('/api/reports/sales-last-7-days'),
      api.get('/api/reports/products-by-category'),
      api.get('/api/accounting'),
    ])
      .then(([m, s, c, a]) => {
        setMembers(m);
        setSales7(s);
        setCats(c);
        setAcct(a);
        if (m.length) setMemberId(String(m[0].id));
      })
      .finally(() => setLoading(false));
  }, []);

  async function loadMemberReport() {
    if (!memberId) return alert('اختار عضو!');
    try {
      setReport(await api.get(`/api/reports/member/${memberId}`));
    } catch (e) {
      alert(`مشكل! ${e.message}`);
    }
  }

  if (loading) return <Loading />;

  const n2 = (v) => Number(v || 0).toFixed(2);

  const salesChart = sales7 && {
    labels: sales7.map((s) => s.day_name),
    datasets: [
      {
        label: 'المبيعات د.م',
        data: sales7.map((s) => s.total),
        backgroundColor: 'rgba(79,172,254,0.7)',
        borderColor: '#4facfe',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const catsChart = cats && {
    labels: cats.map((c) => c.category),
    datasets: [
      {
        data: cats.map((c) => c.count),
        backgroundColor: ['#4facfe', '#43e97b', '#f093fb', '#fa8231', '#667eea', '#f5576c', '#11998e'],
      },
    ],
  };

  const compareChart = acct && {
    labels: ['المبيعات', 'تكلفة البضاعة', 'المصاريف', 'الربح الإجمالي', 'الربح الصافي'],
    datasets: [
      {
        data: [acct.total_sales, acct.total_cogs, acct.total_expenses, acct.gross_profit, acct.net_profit],
        backgroundColor: ['#4facfe', '#fa8231', '#f5576c', '#43e97b', acct.net_profit >= 0 ? '#43e97b' : '#f5576c'],
        borderRadius: 8,
      },
    ],
  };

  return (
    <div>
      <h4 style={{ marginBottom: 18, fontWeight: 'bold' }}>📊 التقارير</h4>
      <div className="row g-4">
        <div className="col-md-6">
          <div className="wc">
            <div className="wc-head"><div className="wc-title">📈 مبيعات آخر 7 أيام</div></div>
            <Bar data={salesChart} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} height={200} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="wc">
            <div className="wc-head"><div className="wc-title">🥧 المنتجات حسب الفئة</div></div>
            <Doughnut data={catsChart} options={{ responsive: true }} height={200} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="wc">
            <div className="wc-head"><div className="wc-title">💰 مقارنة المبيعات والمصاريف</div></div>
            <Bar data={compareChart} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} height={200} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="wc">
            <div className="wc-head"><div className="wc-title">👤 تقرير عضو</div></div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <select className="select" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
              <button className="btn btn-p btn-sm" onClick={loadMemberReport} style={{ whiteSpace: 'nowrap' }}>🔍 عرض</button>
            </div>
            {report && (
              <div className="row g-3">
                <div className="col-md-3"><div className="sc c-blue" style={{ padding: 13 }}><div className="lbl" style={{ fontSize: '0.8em' }}>الاسم</div><strong>{report.member.full_name}</strong></div></div>
                <div className="col-md-3"><div className="sc c-green" style={{ padding: 13 }}><div className="lbl" style={{ fontSize: '0.8em' }}>مجموع الشراء</div><strong>{n2(report.total_purchases)} د.م</strong></div></div>
                <div className="col-md-3"><div className="sc c-purple" style={{ padding: 13 }}><div className="lbl" style={{ fontSize: '0.8em' }}>عدد المعاملات</div><strong>{report.total_transactions}</strong></div></div>
                <div className="col-md-3"><div className="sc c-pink" style={{ padding: 13 }}><div className="lbl" style={{ fontSize: '0.8em' }}>ديون معلقة</div><strong>{n2(report.outstanding_debts)} د.م</strong></div></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
