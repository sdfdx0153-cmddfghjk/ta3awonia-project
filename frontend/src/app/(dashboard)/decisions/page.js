'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, removeCollection } from '@/lib/persist';
import { PageHeader, Loading, Empty } from '@/components/ui';

const COL = 'decisions';
const statusL = { approved: 'معتمد', pending: 'قيد الدراسة', rejected: 'مرفوض' };

export default function DecisionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ number: '', title: '', date: '', status: 'approved', notes: '' });

  async function load() {
    setLoading(true);
    const { items: list, source, error } = await loadCollection(api, '/api/decisions', COL);
    setItems(list);
    setLoading(false);
    if (source === 'local' && error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title.trim() || !form.date) return setMsg('⚠️ العنوان والتاريخ مطلوبين');
    const { item, apiError } = await addCollection(api, '/api/decisions', COL, form);
    setItems((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id))]);
    setForm({ number: '', title: '', date: '', status: 'approved', notes: '' });
    setShowForm(false);
    setMsg(apiError ? `✅ محفوظ محلياً (${apiError})` : '✅ تم الحفظ');
    setTimeout(() => setMsg(''), 4000);
  }

  async function del(id) {
    if (!confirm('هل أنت متأكد؟')) return;
    await removeCollection(api, '/api/decisions', COL, id);
    setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
  }

  return (
    <div>
      <PageHeader title="🔑 سجل القرارات" count={items.length ? `${items.length} قرار` : ''} actions={<button className="btn btn-p" onClick={() => setShowForm(true)}><i className="fas fa-plus" /> قرار جديد</button>} />
      {msg && <div className={`al ${msg.startsWith('✅') ? 'al-s' : 'al-d'}`} style={{ marginBottom: 12 }}>{msg}</div>}
      {showForm && (
        <div className="wc" style={{ borderTop: '4px solid #c9a227' }}>
          <div className="row g-3">
            <div className="col-md-2"><div className="field"><label>الرقم</label><input className="input" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></div></div>
            <div className="col-md-4"><div className="field"><label>العنوان *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div></div>
            <div className="col-md-3"><div className="field"><label>التاريخ *</label><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div></div>
            <div className="col-md-3"><div className="field"><label>الحالة</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="approved">معتمد</option>
                <option value="pending">قيد الدراسة</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div></div>
            <div className="col-md-12"><div className="field"><label>ملاحظات</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div></div>
            <div className="col-md-12" style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-s" onClick={save}>💾 حفظ</button>
              <button className="btn btn-sec" onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
      {loading ? <Loading /> : (
        <div className="wc table-wrap">
          <table className="ct">
            <thead><tr><th>#</th><th>الرقم</th><th>العنوان</th><th>التاريخ</th><th>الحالة</th><th>ملاحظات</th><th>🗑️</th></tr></thead>
            <tbody>
              {items.length === 0 && <Empty colSpan={7} text="لا توجد قرارات" />}
              {items.map((x, i) => (
                <tr key={x.id}>
                  <td>{i + 1}</td>
                  <td>{x.number || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{x.title}</td>
                  <td>{x.date ? String(x.date).slice(0, 10) : '—'}</td>
                  <td>{statusL[x.status] || x.status}</td>
                  <td>{x.notes || '—'}</td>
                  <td><button className="btn btn-sec btn-sm" onClick={() => del(x.id)}>🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
