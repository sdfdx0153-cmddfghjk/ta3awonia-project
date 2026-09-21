'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, removeCollection } from '@/lib/persist';
import { PageHeader, Loading, Empty } from '@/components/ui';

const COL = 'suppliers';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', category: '' });
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    const { items, source, error } = await loadCollection(api, '/api/suppliers', COL);
    setSuppliers(items);
    setLoading(false);
    if (source === 'local' && error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.name.trim()) return alert('⚠️ أأدخل اسم المورد!');
    const { item, apiError } = await addCollection(api, '/api/suppliers', COL, {
      ...form,
      total_orders: 0,
      total_amount: 0,
    });
    setSuppliers((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id))]);
    setForm({ name: '', phone: '', address: '', category: '' });
    setShowForm(false);
    setMsg(apiError ? `✅ محفوظ محلياً (${apiError})` : '✅ تم الحفظ');
    setTimeout(() => setMsg(''), 3000);
  }

  async function del(id) {
    if (!confirm('هل أنت متأكد؟')) return;
    await removeCollection(api, '/api/suppliers', COL, id);
    setSuppliers((prev) => prev.filter((x) => String(x.id) !== String(id)));
  }

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="🏭 الموردين"
        count={suppliers.length ? `${suppliers.length} مورد` : ''}
        actions={<button className="btn btn-p" onClick={() => setShowForm(!showForm)}><i className="fas fa-plus" /> أضف مورد</button>}
      />

      {msg && (
        <div className={`al ${msg.startsWith('✅') ? 'al-s' : 'al-d'}`} style={{ marginBottom: 12 }}>
          {msg}
        </div>
      )}

      {showForm && (
        <div className="wc" style={{ borderTop: '4px solid #fa8231' }}>
          <h5 style={{ marginBottom: 16, color: '#fa8231' }}>➕ مورد جديد</h5>
          <div className="row g-3">
            <div className="col-md-3"><div className="field"><label>اسم المورد *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="محمد الغزالي" /></div></div>
            <div className="col-md-2"><div className="field"><label>الهاتف</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div></div>
            <div className="col-md-3"><div className="field"><label>العنوان</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div></div>
            <div className="col-md-2"><div className="field"><label>نوع البضاعة</label><input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div></div>
            <div className="col-md-2" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 12 }}>
              <button className="btn btn-s" onClick={save}>💾 حفظ</button>
              <button className="btn btn-sec" onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div className="wc table-wrap">
        <table className="ct">
          <thead><tr><th>#</th><th>المورد</th><th>الهاتف</th><th>العنوان</th><th>نوع البضاعة</th><th>الطلبيات</th><th>الإجمالي</th><th>🗑️</th></tr></thead>
          <tbody>
            {suppliers.length === 0 && <Empty colSpan={8} text="لا يوجد موردين" />}
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td><span className="bi">{s.id}</span></td>
                <td><strong>{s.name}</strong></td>
                <td>{s.phone || '-'}</td>
                <td>{s.address || '-'}</td>
                <td><span className="bp">{s.category || '-'}</span></td>
                <td><span className="bi">{s.total_orders} طلبية</span></td>
                <td><strong style={{ color: '#4facfe' }}>{Number(s.total_amount).toFixed(2)} د.م</strong></td>
                <td><button className="btn btn-d btn-sm" onClick={() => del(s.id)}>🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
