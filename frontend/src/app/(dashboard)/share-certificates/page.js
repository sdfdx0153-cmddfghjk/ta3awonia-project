'use client';

import { useEffect, useState } from 'react';
import { lsGet, lsAdd, lsRemove } from '@/lib/persist';
import { PageHeader, Empty, StatCard } from '@/components/ui';

const COL = 'share_certificates';

export default function ShareCertificatesPage() {
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ number: '', member: '', shares: '', amount: '', date: '' });

  useEffect(() => {
    setItems(lsGet(COL));
  }, []);

  function save() {
    if (!form.member.trim() || !form.shares) return alert('⚠️ العضو وعدد الحصص مطلوبين');
    lsAdd(COL, {
      number: form.number,
      member: form.member,
      shares: Number(form.shares),
      amount: Number(form.amount || 0),
      date: form.date || new Date().toISOString().slice(0, 10),
    });
    setItems(lsGet(COL));
    setForm({ number: '', member: '', shares: '', amount: '', date: '' });
    setShow(false);
  }

  function del(id) {
    if (confirm('حذف الشهذاة؟')) {
      lsRemove(COL, id);
      setItems(lsGet(COL));
    }
  }

  const totalShares = items.reduce((s, x) => s + (x.shares || 0), 0);
  const totalAmount = items.reduce((s, x) => s + (x.amount || 0), 0);

  return (
    <div>
      <PageHeader title="📜 شهذاات الحصص" count={items.length ? `${items.length} شهذاة` : ''} actions={<button className="btn btn-p" onClick={() => setShow(!show)}><i className="fas fa-plus" /> شهذاة جديدة</button>} />
      <div className="row g-3 mb-3">
        <div className="col-md-4"><StatCard color="c-blue" icon="certificate" label="الشهذاات" value={items.length} /></div>
        <div className="col-md-4"><StatCard color="c-purple" icon="layer-group" label="مجموع الحصص" value={totalShares} /></div>
        <div className="col-md-4"><StatCard color="c-green" icon="coins" label="القيمة د.م" value={totalAmount.toFixed(2)} /></div>
      </div>
      {show && (
        <div className="wc" style={{ borderTop: '4px solid #4facfe' }}>
          <div className="row g-3">
            <div className="col-md-2"><div className="field"><label>رقم الشهذاة</label><input className="input" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="SH-001" /></div></div>
            <div className="col-md-3"><div className="field"><label>العضو *</label><input className="input" value={form.member} onChange={(e) => setForm({ ...form, member: e.target.value })} /></div></div>
            <div className="col-md-2"><div className="field"><label>عدد الحصص *</label><input className="input" type="number" value={form.shares} onChange={(e) => setForm({ ...form, shares: e.target.value })} /></div></div>
            <div className="col-md-2"><div className="field"><label>المبلغ</label><input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div></div>
            <div className="col-md-2"><div className="field"><label>التاريخ</label><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div></div>
            <div className="col-md-12" style={{ display: 'flex', gap: 8 }}><button className="btn btn-s" onClick={save}>💾 حفظ</button><button className="btn btn-sec" onClick={() => setShow(false)}>إلغاء</button></div>
          </div>
        </div>
      )}
      <div className="wc table-wrap"><table className="ct"><thead><tr><th>#</th><th>الرقم</th><th>العضو</th><th>الحصص</th><th>المبلغ</th><th>التاريخ</th><th>🗑️</th></tr></thead>
        <tbody>{items.length === 0 && <Empty colSpan={7} text="لا توجد شهذاات حصص" />}
          {items.map((x, i) => (<tr key={x.id}><td>{i + 1}</td><td>{x.number || '—'}</td><td style={{ fontWeight: 700 }}>{x.member}</td><td>{x.shares}</td><td>{Number(x.amount).toFixed(2)}</td><td>{x.date || '—'}</td><td><button className="btn btn-d btn-sm" onClick={() => del(x.id)}>🗑️</button></td></tr>))}
        </tbody></table></div>
    </div>
  );
}
