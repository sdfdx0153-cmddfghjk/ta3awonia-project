'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loading } from '@/components/ui';

export default function SalesPage() {
  const [members, setMembers] = useState([]);
  const [products, setProducts] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [prodId, setProdId] = useState('');
  const [qty, setQty] = useState('1');
  const [discount, setDiscount] = useState('0');
  const [cart, setCart] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      let m = [], p = [];
      try { m = await api.get('/api/members'); } catch { try { const { lsGet } = await import('@/lib/persist'); m = lsGet('members'); } catch {} }
      try { p = await api.get('/api/products'); } catch { try { const { lsGet } = await import('@/lib/persist'); p = lsGet('products'); } catch {} }
      setMembers(Array.isArray(m) ? m : []);
      setProducts(Array.isArray(p) ? p : []);
      if (m?.length) setMemberId(String(m[0].id));
      if (p?.length) setProdId(String(p[0].id));
      setReady(true);
    })();
  }, []);

  const selectedProduct = products.find((p) => String(p.id) === prodId);

  function addToCart() {
    const pid = Number(prodId);
    const q = parseFloat(qty);
    if (!pid || isNaN(q) || q <= 0) return alert('⚠️ اختر منتجاً وكمية!');
    const prod = products.find((p) => p.id === pid);
    if (!prod) return alert('المنتج غير موجود!');
    if (Number(prod.stock_quantity) < q) return alert(`⚠️ ${prod.name}: غير ${prod.stock_quantity} ${prod.unit} باقي!`);

    setCart((prev) => {
      const existing = prev.find((c) => c.product_id === pid);
      if (existing) {
        return prev.map((c) =>
          c.product_id === pid
            ? { ...c, quantity: c.quantity + q, total: (c.quantity + q) * c.price }
            : c
        );
      }
      return [...prev, { product_id: pid, name: prod.name, price: Number(prod.sell_price), quantity: q, total: Number(prod.sell_price) * q }];
    });
  }

  function removeFromCart(i) {
    setCart((prev) => prev.filter((_, idx) => idx !== i));
  }

  function clearCart() {
    if (cart.length && confirm('هل تريد إفراغ السلة؟')) setCart([]);
  }

  const sub = cart.reduce((s, c) => s + c.total, 0);
  const disc = parseFloat(discount) || 0;
  const total = sub - disc;

  async function completeSale() {
    if (!cart.length) return alert('⚠️ السلة فارغة!');
    if (!memberId) return alert('⚠️ اختار العضو!');
    const body = {
      member_id: Number(memberId),
      payment_method: payMethod,
      discount: disc,
      items: cart.map((c) => ({ product_id: c.product_id, quantity: c.quantity })),
      total_amount: total,
    };
    try {
      const r = await api.post('/api/sales', body);
      alert(`✅ تمت عملية البيع بنجاح\n💰 المجموع: ${Number(r.total_amount).toFixed(2)} د.م`);
      setCart([]);
      setDiscount('0');
      try {
        const p = await api.get('/api/products');
        setProducts(p);
      } catch {}
    } catch (e) {
      // حفظ محلي للبيع + تحديث المخزون محلياً
      try {
        const { lsGet, lsSet, lsAdd } = await import('@/lib/persist');
        lsAdd('sales', { ...body, id: Date.now(), created_at: new Date().toISOString() });
        const prods = lsGet('products');
        cart.forEach((c) => {
          const idx = prods.findIndex((p) => String(p.id) === String(c.product_id));
          if (idx >= 0) {
            prods[idx] = {
              ...prods[idx],
              stock_quantity: Math.max(0, Number(prods[idx].stock_quantity || 0) - c.quantity),
            };
          }
        });
        lsSet('products', prods);
        setProducts(prods);
        alert(`✅ تمت عملية البيع محلياً!\n💰 المجموع: ${total.toFixed(2)} د.م\n(الخادم: ${e.message})`);
        setCart([]);
        setDiscount('0');
      } catch {
        alert(`❌ ${e.message}`);
      }
    }
  }

  if (!ready) return <Loading />;

  return (
    <div>
      <h4 style={{ marginBottom: 18, fontWeight: 'bold' }}>🛒 نقطة البيع</h4>
      <div className="row g-4">
        <div className="col-md-8">
          <div className="wc">
            <div className="wc-head"><div className="wc-title">📋 معلومات البيع</div></div>
            <div className="row g-3 mb-3">
              <div className="col-md-6"><div className="field"><label>👤 العضو</label>
                <select className="select" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div></div>
              <div className="col-md-6"><div className="field"><label>💳 طريقة الدفع</label>
                <select className="select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  <option value="cash">💵 نقدا - Cash</option>
                  <option value="credit">📝 بالدين - Crédit</option>
                </select>
              </div></div>
            </div>

            <hr style={{ borderColor: '#f0f2f5', marginBottom: 16 }} />

            <div className="row g-2 align-items-end mb-3">
              <div className="col-md-5"><div className="field"><label>المنتج</label>
                <select className="select" value={prodId} onChange={(e) => setProdId(e.target.value)}>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} | {p.sell_price} د.م | مخزون: {p.stock_quantity} {p.unit}</option>
                  ))}
                </select>
              </div></div>
              <div className="col-md-2"><div className="field"><label>الثمن</label><input className="input" readOnly style={{ background: '#f8f9ff' }} value={selectedProduct ? selectedProduct.sell_price : ''} /></div></div>
              <div className="col-md-2"><div className="field"><label>الكمية</label><input className="input" type="number" value={qty} min="0.1" step="0.1" onChange={(e) => setQty(e.target.value)} /></div></div>
              <div className="col-md-3" style={{ paddingBottom: 12 }}><button className="btn btn-p w-100" onClick={addToCart}><i className="fas fa-plus" /> أضف للسلة</button></div>
            </div>

            <div className="table-wrap">
              <table className="ct">
                <thead><tr><th>المنتج</th><th>الثمن</th><th>الكمية</th><th>المجموع</th><th>🗑️</th></tr></thead>
                <tbody>
                  {cart.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 22, color: '#999' }}>🛒 السلة فارغة</td></tr>
                  )}
                  {cart.map((c, i) => (
                    <tr key={i}>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.price} د.م</td>
                      <td>{c.quantity}</td>
                      <td><strong style={{ color: '#43e97b' }}>{c.total.toFixed(2)} د.م</strong></td>
                      <td><button className="btn btn-d btn-sm" onClick={() => removeFromCart(i)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63)', color: 'white', borderRadius: 16, padding: 22, position: 'sticky', top: 80 }}>
            <h5 style={{ textAlign: 'center', marginBottom: 16 }}>🧾 الفاتورة</h5>
            <hr style={{ borderColor: '#ffffff22' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
              <span style={{ opacity: 0.8 }}>المجموع:</span>
              <span id="inv-sub" style={{ fontWeight: 'bold' }}>{sub.toFixed(2)} د.م</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
              <span style={{ opacity: 0.8 }}>التخفيض:</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                style={{ width: 100, textAlign: 'center', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 8, padding: 5 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ opacity: 0.8 }}>الأصناف:</span><span>{cart.length} صنف</span>
            </div>
            <hr style={{ borderColor: '#ffffff22' }} />
            <div style={{ fontSize: '1.9em', fontWeight: 'bold', color: '#43e97b', textAlign: 'center' }}>{total.toFixed(2)} د.م</div>
            <div style={{ textAlign: 'center', opacity: 0.6, fontSize: '0.8em', marginBottom: 16 }}>المبلغ الإجمالي</div>
            <button className="btn btn-s w-100" style={{ padding: 12, fontSize: '1em' }} onClick={completeSale}>✅ تأكيد البيع</button>
            <button className="btn btn-sec w-100" style={{ marginTop: 7 }} onClick={clearCart}>🗑️ إفراغ السلة</button>
          </div>
        </div>
      </div>
    </div>
  );
}
