'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, removeCollection } from '@/lib/persist';
import { PageHeader, Empty, StatCard, Loading } from '@/components/ui';

const COL = 'stock_moves';

export default function StockMovesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ product: '', type: 'in', qty: '', reason: '', date: '' });

  async function load() {
    setLoading(true);
    const { items: list, source, error } = await loadCollection(api, '/api/stock-moves', COL);
    setItems(list);
    setLoading(false);
    if (source === 'local' && error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.product.trim() || !form.qty) return setMsg('⚠️ المنتج والكمية مطلوبين');
    const body = { ...form, qty: Number(form.qty) };
    const { item, apiError } = await addCollection(api, '/api/stock-moves', COL, body);
    setItems((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id))]);
    setForm({ product: '', type: 'in', qty: '', reason: '', date: '' });
    setShow(false);
    setMsg(apiError ? `✅ محفوظ محلياً (${apiError})` : '✅ تم الحفظ');
    setTimeout(() => setMsg(''), 4000);
  }

  async function del(id) {
    if (!confirm('حذف الحركة؟')) return;
    await removeCollection(api, '/api/stock-moves', COL, id);
    setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
  }

  const ins = items.filter((x) => x.type === 'in').reduce((s, x) => s + Number(x.qty || 0), 0);
  const outs = items.filter((x) => x.type === 'out').reduce((s, x) => s + Number(x.qty || 0), 0);

  return (
    <div>
      <PageHeader
        title="🔄 حركات المخزون"
        count={items.length ? `${items.length} حركة` : ''}
        actions={<button className="btn btn-p" onClick={() => setShow(!show)}><i className="fas fa-plus" /> حركة جديدة</button>}
      />
      <div className="row g-3 mb-3">
        <div className="col-md-4"><StatCard color="c-green" icon="arrow-down" label="دخول" value={ins} /></div>
        <div className="col-md-4"><StatCard color="c-red" icon="arrow-up" label="خروج" value={outs} /></div>
        <div className="col-md-4"><StatCard color="c-blue" icon="exchange-alt" label="صافي" value={ins - outs} /></div>
      </div>

      {msg && <div className={`al ${msg.startsWith('✅') ? 'al-s' : 'al-d'}`} style={{ marginBottom: 12 }}>{msg}</div>}

      {show && (
        <div className="wc" style={{ borderTop: '4px solid #4facfe' }}>
          <div className="row g-3">
            <div className="col-md-3"><div className="field"><label>المنتج *</label><input className="input" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} /></div></div>
            <div className="col-md-2"><div className="field"><label>النوع</label><select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="in">دخول</option><option value="out">خروج</option><option value="adjust">تسوية</option></select></div></div>
            <div className="col-md-2"><div className="field"><label>الكمية *</label><input className="input" type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div></div>
            <div className="col-md-3"><div className="field"><label>السبب</label><input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="شراء / بيع / تلف..." /></div></div>
            <div className="col-md-2"><div className="field"><label>التاريخ</label><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div></div>
            <div className="col-md-12" style={{ display: 'flex', gap: 8 }}><button className="btn btn-s" onClick={save}>💾 حفظ</button><button className="btn btn-sec" onClick={() => setShow(false)}>إلغاء</button></div>
          </div>
        </div>
      )}

      {loading ? <Loading /> : (
        <div className="wc table-wrap">
          <table className="ct">
            <thead><tr><th>#</th><th>المنتج</th><th>النوع</th><th>الكمية</th><th>السبب</th><th>التاريخ</th><th>🗑️</th></tr></thead>
            <tbody>
              {items.length === 0 && <Empty colSpan={7} text="لا توجد حركات مخزون" />}
              {items.map((x, i) => (
                <tr key={x.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 700 }}>{x.product}</td>
                  <td>{x.type === 'in' ? '⬇️ دخول' : x.type === 'out' ? '⬆️ خروج' : '🔧 تسوية'}</td>
                  <td>{x.qty}</td>
                  <td>{x.reason || '—'}</td>
                  <td>{x.date || '—'}</td>
                  <td><button className="btn btn-d btn-sm" onClick={() => del(x.id)}>🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
