'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, removeCollection } from '@/lib/persist';
import { PageHeader, Loading, Empty, StatCard } from '@/components/ui';

const COL = 'committees';

export default function CommitteesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', president: '', members: '', mission: '' });

  async function load() {
    setLoading(true);
    const { items: list, source, error } = await loadCollection(api, '/api/committees', COL);
    setItems(list);
    setLoading(false);
    if (source === 'local' && error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.name.trim()) return setMsg('⚠️ اسم اللجنة مطلوب');
    const { item, apiError } = await addCollection(api, '/api/committees', COL, form);
    setItems((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id))]);
    setForm({ name: '', president: '', members: '', mission: '' });
    setShow(false);
    setMsg(apiError ? `✅ محفوظ محلياً (${apiError})` : '✅ تم الحفظ');
    setTimeout(() => setMsg(''), 4000);
  }

  async function del(id) {
    if (!confirm('حذف اللجنة؟')) return;
    await removeCollection(api, '/api/committees', COL, id);
    setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
  }

  return (
    <div>
      <PageHeader title="🏛️ اللجان" count={items.length ? `${items.length} لجنة` : ''} actions={<button className="btn btn-p" onClick={() => setShow(true)}><i className="fas fa-plus" /> لجنة جديدة</button>} />
      <div className="row g-3 mb-3"><div className="col-md-4"><StatCard color="c-purple" icon="sitemap" label="عدد اللجان" value={items.length} /></div></div>
      {msg && <div className={`al ${msg.startsWith('✅') ? 'al-s' : 'al-d'}`} style={{ marginBottom: 12 }}>{msg}</div>}
      {show && (
        <div className="wc" style={{ borderTop: '4px solid #667eea' }}>
          <div className="row g-3">
            <div className="col-md-4"><div className="field"><label>اسم اللجنة *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div></div>
            <div className="col-md-4"><div className="field"><label>الرئيس</label><input className="input" value={form.president} onChange={(e) => setForm({ ...form, president: e.target.value })} /></div></div>
            <div className="col-md-4"><div className="field"><label>الأعضاء</label><input className="input" value={form.members} onChange={(e) => setForm({ ...form, members: e.target.value })} /></div></div>
            <div className="col-md-12"><div className="field"><label>المهمة</label><textarea className="input" rows={2} value={form.mission} onChange={(e) => setForm({ ...form, mission: e.target.value })} /></div></div>
            <div className="col-md-12" style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-s" onClick={save}>💾 حفظ</button>
              <button className="btn btn-sec" onClick={() => setShow(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
      {loading ? <Loading /> : (
        <div className="wc table-wrap">
          <table className="ct">
            <thead><tr><th>#</th><th>اللجنة</th><th>الرئيس</th><th>الأعضاء</th><th>المهمة</th><th>🗑️</th></tr></thead>
            <tbody>
              {items.length === 0 && <Empty colSpan={6} text="لا توجد لجان" />}
              {items.map((x, i) => (
                <tr key={x.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 700 }}>{x.name}</td>
                  <td>{x.president || '—'}</td>
                  <td>{x.members || '—'}</td>
                  <td>{x.mission || '—'}</td>
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
