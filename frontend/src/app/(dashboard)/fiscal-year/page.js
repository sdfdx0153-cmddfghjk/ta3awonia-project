'use client';

import { useEffect, useState } from 'react';
import { lsGet, lsAdd, lsRemove } from '@/lib/persist';
import { PageHeader, Empty, StatCard } from '@/components/ui';

const COL = 'fiscal_years';

export default function FiscalYearPage() {
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ year: new Date().getFullYear().toString(), start: '', end: '', status: 'open', notes: '' });

  useEffect(() => {
    setItems(lsGet(COL));
  }, []);

  function save() {
    if (!form.year) return alert('⚠️ السنة مطلوبة');
    lsAdd(COL, { ...form });
    setItems(lsGet(COL));
    setForm({ year: new Date().getFullYear().toString(), start: '', end: '', status: 'open', notes: '' });
    setShow(false);
  }

  function del(id) {
    if (confirm('حذف؟')) {
      lsRemove(COL, id);
      setItems(lsGet(COL));
    }
  }

  const statusL = { open: '🟢 مفتوحة', closed: '🔒 مقفلة', draft: '📝 مسودة' };

  return (
    <div>
      <PageHeader title="📅 السنة المالية" count={items.length ? `${items.length} سنة` : ''} actions={<button className="btn btn-p" onClick={() => setShow(!show)}><i className="fas fa-plus" /> سنة جديدة</button>} />
      <div className="row g-3 mb-3"><div className="col-md-4"><StatCard color="c-blue" icon="calendar" label="السنوات المسجلة" value={items.length} /></div>
        <div className="col-md-4"><StatCard color="c-green" icon="unlock" label="مفتوحة" value={items.filter((x) => x.status === 'open').length} /></div>
        <div className="col-md-4"><StatCard color="c-dark" icon="lock" label="مقفلة" value={items.filter((x) => x.status === 'closed').length} /></div></div>
      {show && (
        <div className="wc" style={{ borderTop: '4px solid #4facfe' }}>
          <div className="row g-3">
            <div className="col-md-2"><div className="field"><label>السنة *</label><input className="input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div></div>
            <div className="col-md-3"><div className="field"><label>من</label><input className="input" type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></div></div>
            <div className="col-md-3"><div className="field"><label>إلى</label><input className="input" type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></div></div>
            <div className="col-md-2"><div className="field"><label>الحالة</label><select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="open">مفتوحة</option><option value="closed">مقفلة</option><option value="draft">مسودة</option></select></div></div>
            <div className="col-md-12"><div className="field"><label>ملاحظات</label><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div></div>
            <div className="col-md-12" style={{ display: 'flex', gap: 8 }}><button className="btn btn-s" onClick={save}>💾 حفظ</button><button className="btn btn-sec" onClick={() => setShow(false)}>إلغاء</button></div>
          </div>
        </div>
      )}
      <div className="wc table-wrap"><table className="ct"><thead><tr><th>#</th><th>السنة</th><th>من</th><th>إلى</th><th>الحالة</th><th>ملاحظات</th><th>🗑️</th></tr></thead>
        <tbody>{items.length === 0 && <Empty colSpan={7} text="لا توجد سنوات مالية" />}
          {items.map((x, i) => (<tr key={x.id}><td>{i + 1}</td><td style={{ fontWeight: 800 }}>{x.year}</td><td>{x.start || '—'}</td><td>{x.end || '—'}</td><td>{statusL[x.status] || x.status}</td><td>{x.notes || '—'}</td><td><button className="btn btn-d btn-sm" onClick={() => del(x.id)}>🗑️</button></td></tr>))}
        </tbody></table></div>
    </div>
  );
}
