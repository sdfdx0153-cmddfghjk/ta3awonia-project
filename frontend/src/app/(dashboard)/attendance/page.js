'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, removeCollection } from '@/lib/persist';
import { PageHeader, Loading, Empty } from '@/components/ui';

const COL = 'attendance';

export default function AttendancePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ event: '', date: '', present: '', absent: '', notes: '' });

  async function load() {
    setLoading(true);
    const { items: list, source, error } = await loadCollection(api, '/api/attendance', COL);
    setItems(list);
    setLoading(false);
    if (source === 'local' && error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.event.trim() || !form.date) return setMsg('⚠️ الحدث والتاريخ مطلوبين');
    const { item, apiError } = await addCollection(api, '/api/attendance', COL, form);
    setItems((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id))]);
    setForm({ event: '', date: '', present: '', absent: '', notes: '' });
    setShow(false);
    setMsg(apiError ? `✅ محفوظ محلياً (${apiError})` : '✅ تم الحفظ');
    setTimeout(() => setMsg(''), 4000);
  }

  async function del(id) {
    if (!confirm('حذف؟')) return;
    await removeCollection(api, '/api/attendance', COL, id);
    setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
  }

  return (
    <div>
      <PageHeader title="✅ سجل الحضور" count={items.length ? `${items.length} سجل` : ''} actions={<button className="btn btn-p" onClick={() => setShow(true)}><i className="fas fa-plus" /> سجل جديد</button>} />
      <div className="wc" style={{ borderTop: '4px solid #667eea', marginBottom: 14, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <i className="fas fa-qrcode" style={{ fontSize: '1.6em', color: '#667eea' }} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#667eea' }}>حضور بـ QR Code</strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.82em', opacity: 0.75 }}>
              فـ الجمعيات العامة: اطبع QR لكل عضو من صفحة الأعضاء، والعضو يسكانيه باش يتسجل حاضر.
              (يمكن ربط قارئ باركود لاحقاً)
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sec btn-sm"
            onClick={() => {
              const code = `COOP-ATTEND-${Date.now()}`;
              const w = window.open('', '_blank', 'width=360,height=420');
              w.document.write(`<!DOCTYPE html><html><head><title>QR حضور</title></head><body style="font-family:sans-serif;text-align:center;padding:24px;direction:rtl">
                <h3>رمز حضور الجمعية</h3>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}" alt="QR" />
                <p style="margin-top:12px;font-size:0.85em;color:#666">${code}</p>
                <button onclick="window.print()">طباعة</button>
              </body></html>`);
              w.document.close();
            }}
          >
            <i className="fas fa-qrcode" /> توليد QR للحضور
          </button>
        </div>
      </div>
      {msg && <div className={`al ${msg.startsWith('✅') ? 'al-s' : 'al-d'}`} style={{ marginBottom: 12 }}>{msg}</div>}
      {show && (
        <div className="wc" style={{ borderTop: '4px solid #43e97b' }}>
          <div className="row g-3">
            <div className="col-md-5"><div className="field"><label>الحدث / الاجتماع *</label><input className="input" value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} /></div></div>
            <div className="col-md-3"><div className="field"><label>التاريخ *</label><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div></div>
            <div className="col-md-6"><div className="field"><label>الحاضرون</label><textarea className="input" rows={2} value={form.present} onChange={(e) => setForm({ ...form, present: e.target.value })} /></div></div>
            <div className="col-md-6"><div className="field"><label>الغائبون</label><textarea className="input" rows={2} value={form.absent} onChange={(e) => setForm({ ...form, absent: e.target.value })} /></div></div>
            <div className="col-md-12"><div className="field"><label>ملاحظات</label><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div></div>
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
            <thead><tr><th>#</th><th>الحدث</th><th>التاريخ</th><th>الحاضرون</th><th>الغائبون</th><th>ملاحظات</th><th>🗑️</th></tr></thead>
            <tbody>
              {items.length === 0 && <Empty colSpan={7} text="لا يوجد سجل حضور" />}
              {items.map((x, i) => (
                <tr key={x.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{x.event}</td>
                  <td>{x.date ? String(x.date).slice(0, 10) : '—'}</td>
                  <td>{(x.present || '').slice(0, 40) || '—'}</td>
                  <td>{(x.absent || '').slice(0, 40) || '—'}</td>
                  <td>{x.notes || '—'}</td>
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
