'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, removeCollection } from '@/lib/persist';
import { PageHeader, Empty, Loading } from '@/components/ui';

const COL = 'legal_docs';

export default function LegalDocsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ title: '', type: 'statute', date: '', reference: '', notes: '' });

  async function load() {
    setLoading(true);
    const { items: list, source, error } = await loadCollection(api, '/api/legal-docs', COL);
    setItems(list);
    setLoading(false);
    if (source === 'local' && error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title.trim()) return setMsg('⚠️ دخل عنوان الوثيقة!');
    const { item, apiError } = await addCollection(api, '/api/legal-docs', COL, form);
    setItems((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id))]);
    setForm({ title: '', type: 'statute', date: '', reference: '', notes: '' });
    setShowForm(false);
    setMsg(apiError ? `✅ محفوظ محلياً (${apiError})` : '✅ تم الحفظ');
    setTimeout(() => setMsg(''), 4000);
  }

  async function del(id) {
    if (!confirm('هل أنت متأكد؟')) return;
    await removeCollection(api, '/api/legal-docs', COL, id);
    setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
  }

  const typeL = {
    statute: 'النظام الأساسي',
    regulation: 'النظام الداخلي',
    contract: 'عقد',
    license: 'رخصة',
    other: 'أخرى',
  };

  return (
    <div>
      <PageHeader
        title="⚖️ الوثائق القانونية"
        count={items.length ? `${items.length} وثيقة` : ''}
        actions={<button className="btn btn-p" onClick={() => setShowForm(!showForm)}><i className="fas fa-plus" /> وثيقة جديدة</button>}
      />

      {msg && <div className={`al ${msg.startsWith('✅') ? 'al-s' : 'al-d'}`} style={{ marginBottom: 12 }}>{msg}</div>}

      {showForm && (
        <div className="wc" style={{ borderTop: '4px solid #c9a227' }}>
          <h5 style={{ marginBottom: 16, color: '#c9a227' }}>➕ وثيقة قانونية</h5>
          <div className="row g-3">
            <div className="col-md-4"><div className="field"><label>العنوان *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div></div>
            <div className="col-md-3"><div className="field"><label>النوع</label>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="statute">النظام الأساسي</option>
                <option value="regulation">النظام الداخلي</option>
                <option value="contract">عقد</option>
                <option value="license">رخصة</option>
                <option value="other">أخرى</option>
              </select>
            </div></div>
            <div className="col-md-2"><div className="field"><label>التاريخ</label><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div></div>
            <div className="col-md-3"><div className="field"><label>المرجع</label><input className="input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div></div>
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
            <thead><tr><th>#</th><th>العنوان</th><th>النوع</th><th>التاريخ</th><th>المرجع</th><th>ملاحظات</th><th>🗑️</th></tr></thead>
            <tbody>
              {items.length === 0 && <Empty colSpan={7} text="لا توجد وثائق قانونية" />}
              {items.map((x, i) => (
                <tr key={x.id}>
                  <td>{i + 1}</td>
                  <td>{x.title}</td>
                  <td>{typeL[x.type] || x.type}</td>
                  <td>{x.date || '—'}</td>
                  <td>{x.reference || '—'}</td>
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
