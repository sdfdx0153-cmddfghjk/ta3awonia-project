'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, removeCollection } from '@/lib/persist';
import { PageHeader, Empty, Loading } from '@/components/ui';

const COL = 'mandatory_records';

export default function MandatoryRecordsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ title: '', type: 'members', period: '', status: 'up_to_date', notes: '' });

  async function load() {
    setLoading(true);
    const { items: list, source, error } = await loadCollection(api, '/api/mandatory-records', COL);
    setItems(list);
    setLoading(false);
    if (source === 'local' && error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title.trim()) return setMsg('⚠️ دخل عنوان السجل!');
    const { item, apiError } = await addCollection(api, '/api/mandatory-records', COL, form);
    setItems((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id))]);
    setForm({ title: '', type: 'members', period: '', status: 'up_to_date', notes: '' });
    setShowForm(false);
    setMsg(apiError ? `✅ محفوظ محلياً (${apiError})` : '✅ تم الحفظ');
    setTimeout(() => setMsg(''), 4000);
  }

  async function del(id) {
    if (!confirm('هل أنت متأكد؟')) return;
    await removeCollection(api, '/api/mandatory-records', COL, id);
    setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
  }

  const typeL = {
    members: 'سجل الأعضاء',
    minutes: 'محاضر الاجتماعات',
    accounts: 'السجلات المحاسبية',
    inventory: 'سجل الجرد',
    other: 'أخرى',
  };
  const statusL = { up_to_date: '✅ محدّث', pending: '⏳ يحتاج تحديث', missing: '❌ ناقص' };

  return (
    <div>
      <PageHeader
        title="📚 السجلات الإلزامية"
        count={items.length ? `${items.length} سجل` : ''}
        actions={<button className="btn btn-p" onClick={() => setShowForm(!showForm)}><i className="fas fa-plus" /> سجل جديد</button>}
      />

      {msg && <div className={`al ${msg.startsWith('✅') ? 'al-s' : 'al-d'}`} style={{ marginBottom: 12 }}>{msg}</div>}

      {showForm && (
        <div className="wc" style={{ borderTop: '4px solid #c9a227' }}>
          <h5 style={{ marginBottom: 16, color: '#c9a227' }}>➕ سجل إلزامي</h5>
          <div className="row g-3">
            <div className="col-md-4"><div className="field"><label>العنوان *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div></div>
            <div className="col-md-3"><div className="field"><label>النوع</label>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="members">سجل الأعضاء</option>
                <option value="minutes">محاضر الاجتماعات</option>
                <option value="accounts">السجلات المحاسبية</option>
                <option value="inventory">سجل الجرد</option>
                <option value="other">أخرى</option>
              </select>
            </div></div>
            <div className="col-md-2"><div className="field"><label>الفترة</label><input className="input" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="2026" /></div></div>
            <div className="col-md-3"><div className="field"><label>الحالة</label>
              <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="up_to_date">محدّث</option>
                <option value="pending">يحتاج تحديث</option>
                <option value="missing">ناقص</option>
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
            <thead><tr><th>#</th><th>العنوان</th><th>النوع</th><th>الفترة</th><th>الحالة</th><th>ملاحظات</th><th>🗑️</th></tr></thead>
            <tbody>
              {items.length === 0 && <Empty colSpan={7} text="لا توجد سجلات إلزامية" />}
              {items.map((x, i) => (
                <tr key={x.id}>
                  <td>{i + 1}</td>
                  <td>{x.title}</td>
                  <td>{typeL[x.type] || x.type}</td>
                  <td>{x.period || '—'}</td>
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
