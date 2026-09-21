'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, lsGet, lsSet } from '@/lib/persist';
import { StatCard, Loading, Empty } from '@/components/ui';
import { printTablePdf } from '@/lib/printPdf';

const COL = 'debts';

export default function DebtsPage() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payAmounts, setPayAmounts] = useState({});
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    const { items, source, error } = await loadCollection(api, '/api/debts', COL);
    setDebts(items);
    setLoading(false);
    if (source === 'local' && error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
  }

  useEffect(() => { load(); }, []);

  const totalRemaining = debts.reduce((s, d) => s + Number(d.remaining), 0);
  const totalPaid = debts.reduce((s, d) => s + Number(d.paid_amount), 0);

  async function pay(id) {
    const amount = parseFloat(payAmounts[id]);
    if (!amount || amount <= 0) return alert('⚠️ أأدخل المبلغ!');
    try {
      const r = await api.post(`/api/debts/${id}/pay`, { amount });
      if (Number(r.remaining) <= 0) alert('🎉 تم تسديد الدين بالكامل!');
      else alert(`✅ ${r.message}\n💳 المتبقي: ${r.remaining} د.م`);
      load();
    } catch (e) {
      // fallback محلي
      const list = lsGet(COL);
      const idx = list.findIndex((x) => String(x.id) === String(id));
      if (idx >= 0) {
        const d = list[idx];
        const paid = Number(d.paid_amount || 0) + amount;
        const remaining = Math.max(0, Number(d.total_debt || 0) - paid);
        list[idx] = { ...d, paid_amount: paid, remaining };
        lsSet(COL, list);
        setDebts(list);
        alert(remaining <= 0 ? '🎉 تم تسديد الدين بالكامل (محلياً)!' : `✅ تم التسديد ${amount} د.م — المتبقي: ${remaining} د.م (محلياً)`);
      } else {
        alert(`❌ ${e.message}`);
      }
    }
  }

  function printPdf() {
    printTablePdf({
      title: 'قائمة الديون',
      headers: ['#', 'العضو', 'الدين الكلي', 'المدفوع', 'المتبقي'],
      rows: debts.map((d, i) => [
        String(i + 1), d.member_name || '', String(d.total_debt ?? ''), String(d.paid_amount ?? ''), String(d.remaining ?? ''),
      ]),
    });
  }

  if (loading) return <Loading />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="btn btn-sec" onClick={printPdf}><i className="fas fa-file-pdf" /> طباعة PDF</button>
      </div>
      <div className="row g-3 mb-3">
        <div className="col-md-4"><StatCard color="c-pink" icon="credit-card" label="مجموع الديون د.م" value={totalRemaining.toFixed(2)} /></div>
        <div className="col-md-4"><StatCard color="c-orange" icon="list" label="عدد الديون" value={debts.length} /></div>
        <div className="col-md-4"><StatCard color="c-green" icon="check" label="ما تخلص د.م" value={totalPaid.toFixed(2)} /></div>
      </div>

      <div className="wc table-wrap">
        <table className="ct">
          <thead><tr><th>#</th><th>العضو</th><th>الدين الكلي</th><th>تم التسديد</th><th>الباقي</th><th>نسبة الأداء</th><th>خلّص</th></tr></thead>
          <tbody>
            {debts.length === 0 && <Empty colSpan={7} text="🎉 لا توجد ديون!" />}
            {debts.map((d) => {
              const pct = d.total_debt > 0 ? Math.min(100, (d.paid_amount / d.total_debt) * 100).toFixed(0) : 0;
              const col = pct < 30 ? '#f5576c' : pct < 70 ? '#ffc107' : '#43e97b';
              return (
                <tr key={d.id}>
                  <td><span className="bi">{d.id}</span></td>
                  <td><strong>{d.member_name}</strong></td>
                  <td>{d.total_debt} د.م</td>
                  <td style={{ color: '#43e97b' }}>{d.paid_amount} د.م</td>
                  <td><strong style={{ color: '#f5576c' }}>{d.remaining} د.م</strong></td>
                  <td style={{ minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="prog"><div className="prog-bar" style={{ width: `${pct}%`, background: col }} /></div>
                      <small>{pct}%</small>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input
                        className="input"
                        type="number"
                        style={{ width: 90 }}
                        placeholder="د.م"
                        value={payAmounts[d.id] || ''}
                        onChange={(e) => setPayAmounts({ ...payAmounts, [d.id]: e.target.value })}
                      />
                      <button className="btn btn-s btn-sm" onClick={() => pay(d.id)}>💰</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
