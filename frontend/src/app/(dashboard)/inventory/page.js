'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, lsGet, lsSet } from '@/lib/persist';
import { PageHeader, Loading, Empty } from '@/components/ui';

const COL = 'inventory_checks';

export default function InventoryPage() {
  const [history, setHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counting, setCounting] = useState(false);
  const [notes, setNotes] = useState('');
  const [actuals, setActuals] = useState({});
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    const { items, source, error } = await loadCollection(api, '/api/inventory/checks', COL);
    setHistory(Array.isArray(items) ? items : []);
    let p = [];
    try {
      p = await api.get('/api/products');
    } catch {
      p = lsGet('products');
    }
    setProducts(Array.isArray(p) ? p : []);
    setLoading(false);
    if (source === 'local' && error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
  }

  useEffect(() => { load(); }, []);

  function start() {
    const map = {};
    products.forEach((p) => (map[p.id] = p.stock_quantity));
    setActuals(map);
    setNotes('');
    setCounting(true);
  }

  async function save() {
    if (!confirm('سيتم تحديث المخزون بالكميات الحقيقية. هل أنت متأكد؟')) return;
    const body = {
      notes,
      items: products.map((p) => ({ product_id: p.id, actual_quantity: parseFloat(actuals[p.id]) || 0 })),
      date: new Date().toISOString().slice(0, 10),
      items_count: products.length,
    };
    try {
      const r = await api.post('/api/inventory/check', {
        notes,
        items: body.items,
      });
      alert(`✅ ${r.message}`);
      setCounting(false);
      load();
    } catch (e) {
      // local fallback: save check + update product stock
      const checkItem = { id: Date.now(), ...body };
      const list = lsGet(COL);
      lsSet(COL, [checkItem, ...list]);
      setHistory((prev) => [checkItem, ...prev]);

      const prods = lsGet('products');
      body.items.forEach((it) => {
        const idx = prods.findIndex((p) => String(p.id) === String(it.product_id));
        if (idx >= 0) {
          prods[idx] = { ...prods[idx], stock_quantity: it.actual_quantity };
        }
      });
      lsSet('products', prods);
      setProducts(prods);
      setCounting(false);
      alert(`✅ تم الجرد محلياً!\n(الخادم: ${e.message})`);
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="📦 الجرد"
        count="عدّ المخزون الحقيقي وقارنه مع السيستم"
        actions={<button className="btn btn-p" onClick={start}><i className="fas fa-clipboard-check" /> ابدأ جرد جديد</button>}
      />

      {msg && <div className={`al al-d`} style={{ marginBottom: 12 }}>{msg}</div>}

      {counting && (
        <div className="wc">
          <div className="wc-head">
            <div className="wc-title">📋 جرد جديد - دخّل الكميات الحقيقية</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-s" onClick={save}>✅ احفظ وحدّث المخزون</button>
              <button className="btn btn-sec" onClick={() => setCounting(false)}>إلغاء</button>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">ملاحظات</label>
            <input className="input" style={{ maxWidth: 400 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="مثال: جرد شهر يونيو 2024" />
          </div>
          <div className="table-wrap">
            <table className="ct">
              <thead><tr><th>المنتج</th><th>الوحدة</th><th>كمية السيستم</th><th>الكمية الحقيقية</th><th>الفرق</th></tr></thead>
              <tbody>
                {products.map((p) => {
                  const expected = Number(p.stock_quantity);
                  const actual = parseFloat(actuals[p.id]) || 0;
                  const diff = actual - expected;
                  return (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td><span className="bp">{p.unit}</span></td>
                      <td><span className="bi">{expected}</span></td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          style={{ maxWidth: 120 }}
                          value={actuals[p.id] ?? ''}
                          min="0"
                          step="0.1"
                          onChange={(e) => setActuals({ ...actuals, [p.id]: e.target.value })}
                        />
                      </td>
                      <td style={{ fontWeight: 'bold', color: diff === 0 ? '#999' : diff > 0 ? '#43e97b' : '#f5576c' }}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="wc table-wrap">
        <div className="wc-head"><div className="wc-title">📚 سجل الجرود السابقة</div></div>
        <table className="ct">
          <thead><tr><th>#</th><th>التاريخ</th><th>عدد المنتجات</th><th>الملاحظات</th></tr></thead>
          <tbody>
            {history.length === 0 && <Empty colSpan={4} text="لا يوجد جرد سابق" />}
            {history.map((c) => (
              <tr key={c.id}>
                <td><span className="bi">{c.id}</span></td>
                <td>{c.date ? String(c.date).slice(0, 10) : '—'}</td>
                <td><span className="bs">{c.items_count || c.items?.length || 0} منتج</span></td>
                <td style={{ color: '#999' }}>{c.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
