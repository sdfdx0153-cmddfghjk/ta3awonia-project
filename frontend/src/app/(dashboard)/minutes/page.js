'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, removeCollection } from '@/lib/persist';
import { PageHeader, Loading, Empty } from '@/components/ui';

const COL = 'minutes';

export default function MinutesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ title: '', date: '', secretary: '', summary: '', decisions: '' });

  async function load() {
    setLoading(true);
    const { items: list, source, error } = await loadCollection(api, '/api/minutes', COL);
    setItems(list);
    setLoading(false);
    if (source === 'local' && error) {
      setMsg(`⚠️ الخادم: ${error} — البيانات محفوظة محلياً`);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!form.title.trim() || !form.date) return setMsg('⚠️ العنوان والتاريخ مطلوبين');
    const { item, apiError } = await addCollection(api, '/api/minutes', COL, {
      title: form.title.trim(),
      date: form.date,
      secretary: form.secretary.trim() || null,
      summary: form.summary.trim() || null,
      decisions: form.decisions.trim() || null,
    });
    setItems((prev) => {
      const next = [item, ...prev.filter((x) => String(x.id) !== String(item.id))];
      return next;
    });
    setForm({ title: '', date: '', secretary: '', summary: '', decisions: '' });
    setShow(false);
    if (apiError) {
      setMsg(`✅ محفوظ محلياً (الخادم: ${apiError}) — ما غاديش يمشي مع refresh`);
    } else {
      setMsg('✅ تم حفظ المحضر فقاعدة البيانات');
    }
    setTimeout(() => setMsg(''), 4000);
  }

  async function del(id) {
    if (!confirm('حذف المحضر؟')) return;
    await removeCollection(api, '/api/minutes', COL, id);
    setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
  }

  return (
    <div>
      <PageHeader
        title="📝 محاضر الاجتماعات"
        count={items.length ? `${items.length} محضر` : ''}
        actions={
          <button className="btn btn-p" onClick={() => setShow(true)}>
            <i className="fas fa-plus" /> محضر جديد
          </button>
        }
      />
      {msg && (
        <div className={`al ${msg.startsWith('✅') ? 'al-s' : msg.startsWith('⚠️') ? 'al-d' : 'al-d'}`} style={{ marginBottom: 12 }}>
          {msg}
        </div>
      )}
      {show && (
        <div className="wc" style={{ borderTop: '4px solid #667eea' }}>
          <h5 style={{ color: '#667eea', marginBottom: 14 }}>➕ محضر اجتماع</h5>
          <div className="row g-3">
            <div className="col-md-5">
              <div className="field">
                <label>العنوان *</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
            </div>
            <div className="col-md-3">
              <div className="field">
                <label>التاريخ *</label>
                <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="col-md-4">
              <div className="field">
                <label>الكاتب</label>
                <input className="input" value={form.secretary} onChange={(e) => setForm({ ...form, secretary: e.target.value })} />
              </div>
            </div>
            <div className="col-md-6">
              <div className="field">
                <label>ملخص النقاش</label>
                <textarea className="input" rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
              </div>
            </div>
            <div className="col-md-6">
              <div className="field">
                <label>القرارات المتخذة</label>
                <textarea className="input" rows={3} value={form.decisions} onChange={(e) => setForm({ ...form, decisions: e.target.value })} />
              </div>
            </div>
            <div className="col-md-12" style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-s" onClick={save}>💾 حفظ</button>
              <button className="btn btn-sec" onClick={() => setShow(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <Loading />
      ) : (
        <div className="wc table-wrap">
          <table className="ct">
            <thead>
              <tr>
                <th>#</th>
                <th>العنوان</th>
                <th>التاريخ</th>
                <th>الكاتب</th>
                <th>ملخص</th>
                <th>🗑️</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && <Empty colSpan={6} text="لا توجد محاضر — أضف بيانات جديدة من الزر فوق" />}
              {items.map((x, i) => (
                <tr key={x.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 700 }}>{x.title}</td>
                  <td>{x.date ? String(x.date).slice(0, 10) : '—'}</td>
                  <td>{x.secretary || '—'}</td>
                  <td>{(x.summary || '').slice(0, 60) || '—'}</td>
                  <td>
                    <button className="btn btn-d btn-sm" onClick={() => del(x.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
