'use client';

import { useEffect, useState } from 'react';
import { lsGet, lsAdd, lsRemove } from '@/lib/persist';
import { PageHeader, StatCard, Empty } from '@/components/ui';

const COL = 'treasury';

export default function TreasuryPage() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'in', amount: '', description: '', date: '' });

  useEffect(() => {
    setItems(lsGet(COL));
  }, []);

  function save() {
    if (!form.amount || parseFloat(form.amount) <= 0 || !form.description.trim()) return alert('⚠️ أدخل المبلغ والوصف!');
    lsAdd(COL, {
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description,
      date: form.date || new Date().toISOString().slice(0, 10),
    });
    setItems(lsGet(COL));
    setForm({ type: 'in', amount: '', description: '', date: '' });
    setShowForm(false);
  }

  function del(id) {
    if (!confirm('هل أنت متأكد؟')) return;
    lsRemove(COL, id);
    setItems(lsGet(COL));
  }

  const totalIn = items.filter((x) => x.type === 'in').reduce((s, x) => s + Number(x.amount || 0), 0);
  const totalOut = items.filter((x) => x.type === 'out').reduce((s, x) => s + Number(x.amount || 0), 0);
  const balance = totalIn - totalOut;

  return (
    <div>
      <PageHeader
        title="🏦 الصندوق والخزينة"
        count={items.length ? `${items.length} حركة` : ''}
        actions={<button className="btn btn-p" onClick={() => setShowForm(!showForm)}><i className="fas fa-plus" /> حركة جديدة</button>}
      />

      <div className="row g-3 mb-3">
        <div className="col-md-4"><StatCard color="c-green" icon="arrow-down" label="المدخول د.م" value={totalIn.toFixed(2)} /></div>
        <div className="col-md-4"><StatCard color="c-red" icon="arrow-up" label="المصروف د.م" value={totalOut.toFixed(2)} /></div>
        <div className="col-md-4"><StatCard color="c-blue" icon="wallet" label="الرصيد د.م" value={balance.toFixed(2)} /></div>
      </div>

      {showForm && (
        <div className="wc" style={{ borderTop: '4px solid #c9a227' }}>
          <h5 style={{ marginBottom: 16, color: '#c9a227' }}>➕ حركة صندوق</h5>
          <div className="row g-3">
            <div className="col-md-2"><div className="field"><label>النوع</label>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="in">مدخول</option>
                <option value="out">مصروف</option>
              </select>
            </div></div>
            <div className="col-md-2"><div className="field"><label>المبلغ *</label><input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div></div>
            <div className="col-md-4"><div className="field"><label>الوصف *</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div></div>
            <div className="col-md-2"><div className="field"><label>التاريخ</label><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div></div>
            <div className="col-md-2" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 12 }}>
              <button className="btn btn-s" onClick={save}>💾</button>
              <button className="btn btn-sec" onClick={() => setShowForm(false)}>✕</button>
            </div>
          </div>
        </div>
      )}

      <div className="wc table-wrap">
        <table className="ct">
          <thead><tr><th>#</th><th>النوع</th><th>المبلغ</th><th>الوصف</th><th>التاريخ</th><th>🗑️</th></tr></thead>
          <tbody>
            {items.length === 0 && <Empty colSpan={6} text="لا توجد حركات في الصندوق" />}
            {items.map((x, i) => (
              <tr key={x.id}>
                <td>{i + 1}</td>
                <td>{x.type === 'in' ? '⬇️ مدخول' : '⬆️ مصروف'}</td>
                <td style={{ color: x.type === 'in' ? '#43e97b' : '#f5576c', fontWeight: 'bold' }}>{Number(x.amount).toFixed(2)}</td>
                <td>{x.description}</td>
                <td>{x.date || '—'}</td>
                <td><button className="btn btn-sec btn-sm" onClick={() => del(x.id)}>🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
