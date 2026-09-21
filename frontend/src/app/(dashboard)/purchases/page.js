'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, lsGet, lsSet } from '@/lib/persist';
import { PageHeader, Loading, Empty } from '@/components/ui';

const COL = 'purchase_orders';

const STATUS = {
  pending: <span className="bw">⏳ في الانتظار</span>,
  received: <span className="bs">✅ تستلم</span>,
  cancelled: <span className="bd">❌ ملغي</span>,
};

export default function PurchasesPage() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [prodId, setProdId] = useState('');
  const [qty, setQty] = useState('10');
  const [price, setPrice] = useState('');
  const [cart, setCart] = useState([]);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    const { items, source, error } = await loadCollection(api, '/api/purchase-orders', COL);
    setOrders(Array.isArray(items) ? items : []);
    let s = [], p = [];
    try { s = await api.get('/api/suppliers'); } catch { s = lsGet('suppliers'); }
    try { p = await api.get('/api/products'); } catch { p = lsGet('products'); }
    setSuppliers(Array.isArray(s) ? s : []);
    setProducts(Array.isArray(p) ? p : []);
    if (!supplierId && s?.length) setSupplierId(String(s[0].id));
    if (!prodId && p?.length) setProdId(String(p[0].id));
    setLoading(false);
    if (source === 'local' && error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const sel = products.find((x) => String(x.id) === prodId);
    if (sel && !price) setPrice(String(sel.buy_price));
  }, [prodId, products, price]);

  function addToPO() {
    const pid = Number(prodId);
    const q = parseFloat(qty);
    const p = parseFloat(price);
    if (!pid || q <= 0 || p <= 0) return alert('⚠️ اختر منتجاً وكمية وثمن!');
    const name = products.find((x) => x.id === pid)?.name || '';

    setCart((prev) => {
      const existing = prev.find((c) => c.product_id === pid);
      if (existing) {
        return prev.map((c) =>
          c.product_id === pid ? { ...c, quantity: c.quantity + q, total: (c.quantity + q) * c.unit_price } : c
        );
      }
      return [...prev, { product_id: pid, name, quantity: q, unit_price: p, total: q * p }];
    });
  }

  async function saveOrder() {
    if (!cart.length) return alert('⚠️ أضف منتجات!');
    if (!supplierId) return alert('⚠️ اختار المورد!');
    const sup = suppliers.find((x) => String(x.id) === String(supplierId));
    const total_amount = cart.reduce((s, c) => s + c.total, 0);
    const body = {
      supplier_id: Number(supplierId),
      notes,
      items: cart.map((c) => ({ product_id: c.product_id, quantity: c.quantity, unit_price: c.unit_price, product_name: c.name })),
      supplier_name: sup?.name,
      supplier_phone: sup?.phone,
      total_amount,
      status: 'pending',
      order_date: new Date().toISOString(),
    };
    const { item, apiError } = await addCollection(api, '/api/purchase-orders', COL, body);
    setOrders((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id))]);
    alert(apiError ? `✅ محفوظ محلياً!\n💰 الإجمالي: ${total_amount} د.م` : `✅ تمت إضافة أمر الشراء!\n💰 الإجمالي: ${(item.total_amount || total_amount)} د.م`);
    setCart([]);
    setShowForm(false);
  }

  async function receive(id) {
    if (!confirm('هل استلمت هذه الطلبية؟ غادي يتمت إضافة المخزون تلقائياً!')) return;
    try {
      const r = await api.post(`/api/purchase-orders/${id}/receive`);
      alert(`✅ ${r.message}`);
      load();
    } catch (e) {
      const list = lsGet(COL);
      const idx = list.findIndex((x) => String(x.id) === String(id));
      if (idx >= 0) {
        const order = list[idx];
        list[idx] = { ...order, status: 'received' };
        lsSet(COL, list);
        setOrders(list);
        // update product stock locally
        const prods = lsGet('products');
        (order.items || []).forEach((it) => {
          const pi = prods.findIndex((p) => String(p.id) === String(it.product_id));
          if (pi >= 0) {
            prods[pi] = { ...prods[pi], stock_quantity: Number(prods[pi].stock_quantity || 0) + Number(it.quantity || 0) };
          }
        });
        lsSet('products', prods);
        setProducts(prods);
        alert(`✅ تم الاستلام محلياً!\n(الخادم: ${e.message})`);
      } else {
        alert(`❌ ${e.message}`);
      }
    }
  }

  async function cancel(id) {
    if (!confirm('هل تريد إلغاء؟')) return;
    try {
      await api.post(`/api/purchase-orders/${id}/cancel`);
      load();
    } catch (e) {
      const list = lsGet(COL);
      const idx = list.findIndex((x) => String(x.id) === String(id));
      if (idx >= 0) {
        list[idx] = { ...list[idx], status: 'cancelled' };
        lsSet(COL, list);
        setOrders(list);
      } else {
        alert(`❌ ${e.message}`);
      }
    }
  }

  if (loading) return <Loading />;

  const cartTotal = cart.reduce((s, c) => s + c.total, 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div>
      <PageHeader
        title="📋 أوامر الشراء"
        count={`${orders.length} أمر${pendingCount ? ` • ${pendingCount} معلق` : ''}`}
        actions={<button className="btn btn-p" onClick={() => setShowForm(!showForm)}><i className="fas fa-plus" /> أمر شراء جديد</button>}
      />

      {showForm && (
        <div className="wc" style={{ borderTop: '4px solid #667eea' }}>
          <h5 style={{ marginBottom: 16, color: '#667eea' }}>➕ أمر شراء جديد</h5>
          <div className="row g-3 mb-3">
            <div className="col-md-4"><div className="field"><label>المورد *</label>
              <select className="select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div></div>
            <div className="col-md-8"><div className="field"><label>ملاحظات</label><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></div></div>
          </div>
          <hr style={{ borderColor: '#f0f2f5', marginBottom: 15 }} />
          <div className="row g-2 align-items-end mb-3">
            <div className="col-md-4"><div className="field"><label>المنتج</label>
              <select className="select" value={prodId} onChange={(e) => { setProdId(e.target.value); setPrice(''); }}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (مخزون: {p.stock_quantity})</option>
                ))}
              </select>
            </div></div>
            <div className="col-md-2"><div className="field"><label>الكمية</label><input className="input" type="number" value={qty} min="1" onChange={(e) => setQty(e.target.value)} /></div></div>
            <div className="col-md-2"><div className="field"><label>ثمن الشراء</label><input className="input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div></div>
            <div className="col-md-2" style={{ paddingBottom: 12 }}><button className="btn btn-p w-100" onClick={addToPO}><i className="fas fa-plus" /> زيد</button></div>
          </div>
          <div className="table-wrap">
            <table className="ct">
              <thead><tr><th>المنتج</th><th>الكمية</th><th>الثمن</th><th>المجموع</th><th>🗑️</th></tr></thead>
              <tbody>
                {cart.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 18, color: '#999' }}>أضف منتجات...</td></tr>}
                {cart.map((c, i) => (
                  <tr key={i}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.quantity}</td>
                    <td>{c.unit_price} د.م</td>
                    <td><strong style={{ color: '#4facfe' }}>{c.total.toFixed(2)} د.م</strong></td>
                    <td><button className="btn btn-d btn-sm" onClick={() => setCart(cart.filter((_, idx) => idx !== i))}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <strong>الإجمالي: <span style={{ color: '#4facfe' }}>{cartTotal.toFixed(2)} د.م</span></strong>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-s" onClick={saveOrder}>💾 حفظ الأمر</button>
              <button className="btn btn-sec" onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div className="wc table-wrap">
        <table className="ct">
          <thead><tr><th>#</th><th>المورد</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th><th>المنتجات</th><th>إجراءات</th></tr></thead>
          <tbody>
            {orders.length === 0 && <Empty colSpan={7} text="لا توجد أوامر شراء" />}
            {orders.map((o) => (
              <tr key={o.id}>
                <td><span className="bi">#{o.id}</span></td>
                <td><strong>{o.supplier_name}</strong><br /><small style={{ color: '#999' }}>{o.supplier_phone}</small></td>
                <td><strong style={{ color: '#4facfe' }}>{Number(o.total_amount).toFixed(2)} د.م</strong></td>
                <td>{STATUS[o.status] || o.status}</td>
                <td style={{ color: '#999', fontSize: '0.82em' }}>{new Date(o.order_date).toLocaleDateString('fr-MA')}</td>
                <td style={{ fontSize: '0.82em', color: '#666' }}>{(o.items || []).map((i) => i.product_name).join('، ')}</td>
                <td style={{ display: 'flex', gap: 4 }}>
                  {o.status === 'pending' && (
                    <>
                      <button className="btn btn-s btn-sm" onClick={() => receive(o.id)}>📦 استلمت</button>
                      <button className="btn btn-d btn-sm" onClick={() => cancel(o.id)}>❌</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
