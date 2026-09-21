'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, removeCollection } from '@/lib/persist';
import { PageHeader, Loading, Empty } from '@/components/ui';

const COL = 'assemblies';
const typeL = {
  ordinary: 'جمع عام عادي',
  extraordinary: 'جمع عام استثنائي',
  constitutive: 'جمع عام تأسيسي',
  meeting: 'اجتماع مجلس الإدارة',
};

export default function AssembliesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    type: 'ordinary',
    date: '',
    place: 'مقر التعاونية - دوار إيكافاين',
    attendees: '0',
    agenda: '',
    decisions: '',
    notes: '',
  });

  async function load() {
    setLoading(true);
    const { items: list, source, error } = await loadCollection(api, '/api/assemblies', COL);
    setItems(list);
    setLoading(false);
    if (source === 'local' && error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!form.date) return setMsg('⚠️ التاريخ مطلوب!');
    const body = {
      type: form.type,
      date: form.date,
      place: form.place,
      attendees: parseInt(form.attendees, 10) || 0,
      agenda: form.agenda,
      decisions: form.decisions,
      notes: form.notes,
    };
    const { item, apiError } = await addCollection(api, '/api/assemblies', COL, body);
    setItems((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id))]);
    setForm({
      type: 'ordinary',
      date: '',
      place: 'مقر التعاونية - دوار إيكافاين',
      attendees: '0',
      agenda: '',
      decisions: '',
      notes: '',
    });
    setShowForm(false);
    setMsg(apiError ? `✅ محفوظ محلياً (${apiError})` : '✅ تم حفظ المحضر');
    setTimeout(() => setMsg(''), 4000);
  }

  async function del(id) {
    if (!confirm('هل أنت متأكد؟')) return;
    await removeCollection(api, '/api/assemblies', COL, id);
    setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
  }

  return (
    <div>
      <PageHeader
        title="📅 الجموعات العامة والاجتماعات"
        count={items.length ? `${items.length} محضر` : ''}
        actions={
          <button className="btn btn-p" onClick={() => setShowForm(true)}>
            <i className="fas fa-plus" /> تسجيل جمع عام / اجتماع
          </button>
        }
      />
      {msg && (
        <div className={`al ${msg.startsWith('✅') ? 'al-s' : 'al-d'}`} style={{ marginBottom: 12 }}>
          {msg}
        </div>
      )}
      {showForm && (
        <div className="modal-overlay open" onClick={() => setShowForm(false)}>
          <div className="modal-box" style={{ maxWidth: 640, width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowForm(false)}
              style={{
                position: 'absolute',
                top: 14,
                left: 18,
                background: 'none',
                border: 'none',
                fontSize: '1.3em',
                cursor: 'pointer',
                color: '#999',
              }}
            >
              ✕
            </button>
            <div className="modal-title" style={{ color: '#8B7355', marginBottom: 18 }}>
              + تسجيل جمع عام / اجتماع
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="field">
                  <label>نوع الاجتماع</label>
                  <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="ordinary">جمع عام عادي</option>
                    <option value="extraordinary">جمع عام استثنائي</option>
                    <option value="constitutive">جمع عام تأسيسي</option>
                    <option value="meeting">اجتماع مجلس الإدارة</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>التاريخ</label>
                  <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>المكان</label>
                  <input className="input" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>عدد الحاضرات</label>
                  <input className="input" type="number" min="0" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} />
                </div>
              </div>
              <div className="col-12">
                <div className="field">
                  <label>جدول الأعمال</label>
                  <textarea className="input" rows={3} value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} />
                </div>
              </div>
              <div className="col-12">
                <div className="field">
                  <label>القرارات المتخذة</label>
                  <textarea className="input" rows={3} value={form.decisions} onChange={(e) => setForm({ ...form, decisions: e.target.value })} />
                </div>
              </div>
              <div className="col-12">
                <div className="field">
                  <label>ملاحظات</label>
                  <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="col-12" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-sec" onClick={() => setShowForm(false)}>إلغاء</button>
                <button className="btn btn-s" onClick={save}>💾 حفظ المحضر</button>
              </div>
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
                <th>النوع</th>
                <th>التاريخ</th>
                <th>المكان</th>
                <th>الحاضرات</th>
                <th>جدول الأعمال</th>
                <th>القرارات</th>
                <th>🗑️</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && <Empty colSpan={8} text="لا توجد جموعات عامة أو اجتماعات مسجلة" />}
              {items.map((x, i) => (
                <tr key={x.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{typeL[x.type] || x.type}</td>
                  <td>{x.date ? String(x.date).slice(0, 10) : '—'}</td>
                  <td style={{ fontSize: '0.9em' }}>{x.place || '—'}</td>
                  <td>{x.attendees ?? 0}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(x.agenda || '').slice(0, 40) || '—'}
                  </td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(x.decisions || '').slice(0, 40) || '—'}
                  </td>
                  <td>
                    <button className="btn btn-sec btn-sm" onClick={() => del(x.id)}>🗑️</button>
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
