'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, lsGet } from '@/lib/persist';
import { StatCard, PageHeader, Loading, Empty } from '@/components/ui';
import { printTablePdf } from '@/lib/printPdf';

const COL = 'contributions';

export default function ContributionsPage() {
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ member_id: '', amount: '', type: 'monthly', notes: '' });
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    const { items: list, source, error } = await loadCollection(api, '/api/contributions', COL);
    // API may return {items, total} or array
    let arr = Array.isArray(list) ? list : (list?.items || []);
    if (!Array.isArray(list) && list?.items) {
      // was object from API stored wrong — re-fetch shape
      try {
        const c = await api.get('/api/contributions');
        arr = c.items || [];
        const { lsSet } = await import('@/lib/persist');
        lsSet(COL, arr);
      } catch {
        arr = lsGet(COL);
      }
    }
    setItems(arr);
    let m = [];
    try {
      m = await api.get('/api/members');
    } catch {
      m = lsGet('members');
    }
    setMembers(Array.isArray(m) ? m : []);
    if (!form.member_id && m?.length) setForm((f) => ({ ...f, member_id: String(m[0].id) }));
    setLoading(false);
    if (source === 'local' && error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
  }

  useEffect(() => { load(); }, []);

  const total = items.reduce((s, c) => s + Number(c.amount || 0), 0);
  const count = items.length;
  const average = count ? total / count : 0;

  async function save() {
    if (!form.member_id || !form.amount || parseFloat(form.amount) <= 0) return setMsg('⚠️ اختار العضو وأأدخل المبلغ!');
    const mem = members.find((m) => String(m.id) === String(form.member_id));
    const body = {
      member_id: Number(form.member_id),
      amount: parseFloat(form.amount),
      type: form.type,
      notes: form.notes,
      member_name: mem?.full_name || '',
      date: new Date().toISOString().slice(0, 10),
    };
    const { item, apiError } = await addCollection(api, '/api/contributions', COL, body);
    setItems((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id))]);
    setForm({ ...form, amount: '', notes: '' });
    setShowForm(false);
    setMsg(apiError ? `✅ محفوظ محلياً (${apiError})` : '✅ تمت إضافة المساهمة!');
    setTimeout(() => setMsg(''), 3500);
  }

  function printPdf() {
    printTablePdf({
      title: 'سجل المساهمات والاشتراكات',
      headers: ['#', 'العضو', 'المبلغ', 'النوع', 'التاريخ', 'ملاحظات'],
      rows: items.map((c, i) => [
        String(i + 1), c.member_name || '', String(c.amount ?? ''), c.type || '', c.date ? String(c.date).slice(0, 10) : '—', c.notes || '—',
      ]),
    });
  }

  if (loading) return <Loading />;

  const typeL = { monthly: '📅 شهرية', annual: '📆 سنوية', extra: '➕ إضافية' };

  return (
    <div>
      <PageHeader
        title="💰 المساهمات"
        count={count ? `${count} عملية` : ''}
        actions={<><button className="btn btn-sec" onClick={printPdf}><i className="fas fa-file-pdf" /> طباعة PDF</button><button className="btn btn-p" onClick={() => setShowForm(!showForm)}><i className="fas fa-plus" /> إضافة مساهمة</button></>}
      />

      {msg && <div className={`al ${msg.startsWith('✅') ? 'al-s' : 'al-d'}`} style={{ marginBottom: 12 }}>{msg}</div>}

      {showForm && (
        <div className="wc" style={{ borderTop: '4px solid #43e97b' }}>
          <h5 style={{ marginBottom: 16, color: '#43e97b' }}>➕ مساهمة جديدة</h5>
          <div className="row g-3">
            <div className="col-md-4"><div className="field"><label>العضو *</label>
              <select className="select" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })}>
                {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div></div>
            <div className="col-md-2"><div className="field"><label>المبلغ د.م *</label><input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div></div>
            <div className="col-md-3"><div className="field"><label>النوع</label>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="monthly">📅 شهرية</option>
                <option value="annual">📆 سنوية</option>
                <option value="extra">➕ إضافية</option>
              </select>
            </div></div>
            <div className="col-md-3"><div className="field"><label>ملاحظات</label><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div></div>
            <div className="col-12" style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-s" onClick={save}>💾 حفظ</button>
              <button className="btn btn-sec" onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div className="row g-3 mb-3">
        <div className="col-md-4"><StatCard color="c-teal" icon="coins" label="مجموع المساهمات د.م" value={total.toFixed(2)} /></div>
        <div className="col-md-4"><StatCard color="c-blue" icon="list" label="عدد العمليات" value={count} /></div>
        <div className="col-md-4"><StatCard color="c-purple" icon="users" label="معدل المساهمة د.م" value={average.toFixed(2)} /></div>
      </div>

      <div className="wc table-wrap">
        <table className="ct">
          <thead><tr><th>#</th><th>العضو</th><th>المبلغ</th><th>النوع</th><th>التاريخ</th><th>ملاحظات</th></tr></thead>
          <tbody>
            {items.length === 0 && <Empty colSpan={6} text="لا توجد مساهمات" />}
            {items.map((c) => (
              <tr key={c.id}>
                <td><span className="bi">{c.id}</span></td>
                <td><strong>{c.member_name}</strong></td>
                <td><strong style={{ color: '#43e97b' }}>{c.amount} د.م</strong></td>
                <td><span className="bs">{typeL[c.type] || c.type}</span></td>
                <td style={{ color: '#999', fontSize: '0.83em' }}>{c.date ? String(c.date).slice(0, 10) : '—'}</td>
                <td style={{ color: '#999', fontSize: '0.83em' }}>{c.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
