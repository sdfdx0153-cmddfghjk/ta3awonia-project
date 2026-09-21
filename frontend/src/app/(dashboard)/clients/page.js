'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, removeCollection } from '@/lib/persist';
import { PageHeader, StatCard, Empty, Loading } from '@/components/ui';

const COL = 'clients';

export default function ClientsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });

  async function load() {
    setLoading(true);
    const { items: list, source, error } = await loadCollection(api, '/api/clients', COL);
    setItems(list);
    setLoading(false);
    if (source === 'local' && error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.name.trim()) return setMsg('⚠️ أأدخل اسم الزبون!');
    const { item, apiError } = await addCollection(api, '/api/clients', COL, form);
    setItems((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id))]);
    setForm({ name: '', phone: '', address: '', notes: '' });
    setShowForm(false);
    setMsg(apiError ? `✅ محفوظ محلياً (${apiError})` : '✅ تم الحفظ');
    setTimeout(() => setMsg(''), 4000);
  }

  async function del(id) {
    if (!confirm('هل أنت متأكد؟')) return;
    await removeCollection(api, '/api/clients', COL, id);
    setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
  }

  return (
    <div>
      <PageHeader
        title="🤝 الزبناء"
        count={items.length ? `${items.length} زبون` : ''}
        actions={<button className="btn btn-p" onClick={() => setShowForm(!showForm)}><i className="fas fa-plus" /> زبون جديد</button>}
      />

      <div className="row g-3 mb-3">
        <div className="col-md-4"><StatCard color="c-blue" icon="handshake" label="عدد الزبناء" value={items.length} /></div>
        <div className="col-md-4"><StatCard color="c-green" icon="phone" label="عندهم هاتف" value={items.filter((x) => x.phone).length} /></div>
        <div className="col-md-4"><StatCard color="c-purple" icon="map-marker-alt" label="عندهم عنوان" value={items.filter((x) => x.address).length} /></div>
      </div>

      {msg && <div className={`al ${msg.startsWith('✅') ? 'al-s' : 'al-d'}`} style={{ marginBottom: 12 }}>{msg}</div>}

      {showForm && (
        <div className="wc" style={{ borderTop: '4px solid #4facfe' }}>
          <h5 style={{ marginBottom: 16, color: '#4facfe' }}>➕ زبون جديد</h5>
          <div className="row g-3">
            <div className="col-md-4"><div className="field"><label>الاسم *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم الزبون" /></div></div>
            <div className="col-md-3"><div className="field"><label>الهاتف</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="06xxxxxxxx" dir="ltr" /></div></div>
            <div className="col-md-5"><div className="field"><label>العنوان</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div></div>
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
            <thead><tr><th>#</th><th>الاسم</th><th>الهاتف</th><th>العنوان</th><th>ملاحظات</th><th>🗑️</th></tr></thead>
            <tbody>
              {items.length === 0 && <Empty colSpan={6} text="لا يوجد زبناء مسجلين" />}
              {items.map((x, i) => (
                <tr key={x.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{x.name}</td>
                  <td dir="ltr">{x.phone || '—'}</td>
                  <td>{x.address || '—'}</td>
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
