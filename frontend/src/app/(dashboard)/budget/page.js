'use client';

import { useEffect, useState } from 'react';
import { lsGet, lsSet, lsAdd, lsRemove } from '@/lib/persist';
import { PageHeader, StatCard, Empty } from '@/components/ui';

const COL = 'budget';

export default function BudgetPage() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', planned: '', actual: '', year: new Date().getFullYear().toString() });

  useEffect(() => {
    setItems(lsGet(COL));
  }, []);

  function save() {
    if (!form.category.trim() || !form.planned) return alert('⚠️ أأدخل الفئة والمبلغ المخطط!');
    const item = lsAdd(COL, {
      category: form.category,
      planned: parseFloat(form.planned),
      actual: parseFloat(form.actual || 0),
      year: form.year,
    });
    setItems(lsGet(COL));
    setForm({ category: '', planned: '', actual: '', year: new Date().getFullYear().toString() });
    setShowForm(false);
  }

  function del(id) {
    if (!confirm('هل أنت متأكد؟')) return;
    lsRemove(COL, id);
    setItems(lsGet(COL));
  }

  const totalPlanned = items.reduce((s, x) => s + Number(x.planned || 0), 0);
  const totalActual = items.reduce((s, x) => s + Number(x.actual || 0), 0);

  return (
    <div>
      <PageHeader
        title="📊 الميزانية"
        count={items.length ? `${items.length} بند` : ''}
        actions={<button className="btn btn-p" onClick={() => setShowForm(!showForm)}><i className="fas fa-plus" /> بند جديد</button>}
      />

      <div className="row g-3 mb-3">
        <div className="col-md-4"><StatCard color="c-blue" icon="chart-pie" label="المخطط د.م" value={totalPlanned.toFixed(2)} /></div>
        <div className="col-md-4"><StatCard color="c-orange" icon="coins" label="الفعلي د.م" value={totalActual.toFixed(2)} /></div>
        <div className="col-md-4"><StatCard color="c-green" icon="balance-scale" label="الفرق د.م" value={(totalPlanned - totalActual).toFixed(2)} /></div>
      </div>

      {showForm && (
        <div className="wc" style={{ borderTop: '4px solid #c9a227' }}>
          <h5 style={{ marginBottom: 16, color: '#c9a227' }}>➕ بند ميزانية</h5>
          <div className="row g-3">
            <div className="col-md-3"><div className="field"><label>الفئة *</label><input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="التشغيل / الاستثمار..." /></div></div>
            <div className="col-md-2"><div className="field"><label>المخطط *</label><input className="input" type="number" value={form.planned} onChange={(e) => setForm({ ...form, planned: e.target.value })} /></div></div>
            <div className="col-md-2"><div className="field"><label>الفعلي</label><input className="input" type="number" value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} /></div></div>
            <div className="col-md-2"><div className="field"><label>السنة</label><input className="input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div></div>
            <div className="col-md-3" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 12 }}>
              <button className="btn btn-s" onClick={save}>💾 حفظ</button>
              <button className="btn btn-sec" onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div className="wc table-wrap">
        <table className="ct">
          <thead><tr><th>#</th><th>الفئة</th><th>المخطط</th><th>الفعلي</th><th>الفرق</th><th>السنة</th><th>🗑️</th></tr></thead>
          <tbody>
            {items.length === 0 && <Empty colSpan={7} text="لا توجد بنود ميزانية" />}
            {items.map((x, i) => (
              <tr key={x.id}>
                <td>{i + 1}</td>
                <td>{x.category}</td>
                <td>{Number(x.planned).toFixed(2)}</td>
                <td>{Number(x.actual).toFixed(2)}</td>
                <td style={{ color: Number(x.planned) - Number(x.actual) >= 0 ? '#43e97b' : '#f5576c' }}>{(Number(x.planned) - Number(x.actual)).toFixed(2)}</td>
                <td>{x.year}</td>
                <td><button className="btn btn-sec btn-sm" onClick={() => del(x.id)}>🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
