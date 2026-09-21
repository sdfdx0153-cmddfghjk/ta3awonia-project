'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, removeCollection } from '@/lib/persist';
import { StatCard, PageHeader, Loading, Empty } from '@/components/ui';
import { printTablePdf } from '@/lib/printPdf';

const COL = 'expenses';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'rent' });
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const d = await api.get('/api/expenses');
      const list = d.items || (Array.isArray(d) ? d : []);
      setExpenses(list);
      const { lsSet } = await import('@/lib/persist');
      lsSet(COL, list);
    } catch (e) {
      const { items, error } = await loadCollection(api, '/api/expenses', COL);
      // if API returns object shape stored as items wrongly
      const list = Array.isArray(items) ? items : [];
      setExpenses(list);
      if (error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const cats = expenses.reduce((acc, e) => {
    const c = e.category || 'other';
    acc[c] = (acc[c] || 0) + Number(e.amount || 0);
    return acc;
  }, {});

  async function save() {
    if (!form.description.trim() || !form.amount || parseFloat(form.amount) <= 0) return alert('⚠️ أأدخل الوصف والمبلغ!');
    const body = {
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      date: new Date().toISOString().slice(0, 10),
    };
    const { item, apiError } = await addCollection(api, '/api/expenses', COL, body);
    setExpenses((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id))]);
    setForm({ description: '', amount: '', category: 'rent' });
    setShowForm(false);
    setMsg(apiError ? `✅ محفوظ محلياً (${apiError})` : '✅ تم الحفظ');
    setTimeout(() => setMsg(''), 3000);
  }

  async function del(id) {
    if (!confirm('هل أنت متأكد؟')) return;
    await removeCollection(api, '/api/expenses', COL, id);
    setExpenses((prev) => prev.filter((x) => String(x.id) !== String(id)));
  }

  function printPdf() {
    printTablePdf({
      title: 'سجل المصاريف',
      headers: ['#', 'الوصف', 'المبلغ', 'الفئة', 'التاريخ'],
      rows: expenses.map((e, i) => [
        String(i + 1), e.description || '', String(e.amount ?? ''), e.category || '', e.date ? String(e.date).slice(0, 10) : '—',
      ]),
    });
  }

  if (loading) return <Loading />;

  const catL = { rent: '🏠 الكراء', utilities: '💡 الكهرباء/الماء', transport: '🚗 التنقل', maintenance: '🔧 الصيانة', salary: '👤 الأجور', other: '📦 أخرى' };
  const catLabel = (c) => catL[c] || c;

  return (
    <div>
      <PageHeader
        title="💸 المصاريف"
        count={expenses.length ? `${expenses.length} مصروف` : ''}
        actions={<><button className="btn btn-sec" onClick={printPdf}><i className="fas fa-file-pdf" /> طباعة PDF</button><button className="btn btn-p" onClick={() => setShowForm(!showForm)}><i className="fas fa-plus" /> إضافة مصروف</button></>}
      />

      {msg && <div className={`al ${msg.startsWith('✅') ? 'al-s' : 'al-d'}`} style={{ marginBottom: 12 }}>{msg}</div>}

      {showForm && (
        <div className="wc" style={{ borderTop: '4px solid #f5576c' }}>
          <h5 style={{ marginBottom: 16, color: '#f5576c' }}>➕ مصروف جديد</h5>
          <div className="row g-3">
            <div className="col-md-4"><div className="field"><label>الوصف *</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="كراء المحل" /></div></div>
            <div className="col-md-2"><div className="field"><label>المبلغ *</label><input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div></div>
            <div className="col-md-3"><div className="field"><label>الفئة</label>
              <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="rent">🏠 الكراء</option>
                <option value="utilities">💡 الكهرباء/الماء</option>
                <option value="transport">🚗 التنقل</option>
                <option value="maintenance">🔧 الصيانة</option>
                <option value="salary">👤 الأجور</option>
                <option value="other">📦 أخرى</option>
              </select>
            </div></div>
            <div className="col-md-3" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 12 }}>
              <button className="btn btn-s" onClick={save}>💾 حفظ</button>
              <button className="btn btn-sec" onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div className="row g-3 mb-3">
        <div className="col-md-3"><StatCard color="c-red" icon="wallet" label="المجموع د.م" value={total.toFixed(2)} /></div>
        <div className="col-md-3"><StatCard color="c-orange" icon="house" label="الكراء د.م" value={(cats.rent || 0).toFixed(2)} /></div>
        <div className="col-md-3"><StatCard color="c-purple" icon="bolt" label="كهرباء/ماء د.م" value={(cats.utilities || 0).toFixed(2)} /></div>
        <div className="col-md-3"><StatCard color="c-dark" icon="box" label="أخرى د.م" value={(cats.other || 0).toFixed(2)} /></div>
      </div>

      <div className="wc table-wrap">
        <table className="ct">
          <thead><tr><th>#</th><th>الوصف</th><th>المبلغ</th><th>الفئة</th><th>التاريخ</th><th>🗑️</th></tr></thead>
          <tbody>
            {expenses.length === 0 && <Empty colSpan={6} text="لا توجد مصاريف" />}
            {expenses.map((e) => (
              <tr key={e.id}>
                <td><span className="bi">{e.id}</span></td>
                <td><strong>{e.description}</strong></td>
                <td><strong style={{ color: '#f5576c' }}>{e.amount} د.م</strong></td>
                <td><span className="bw">{catLabel(e.category)}</span></td>
                <td style={{ color: '#999', fontSize: '0.83em' }}>{e.date ? String(e.date).slice(0, 10) : '—'}</td>
                <td><button className="btn btn-d btn-sm" onClick={() => del(e.id)}>🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
