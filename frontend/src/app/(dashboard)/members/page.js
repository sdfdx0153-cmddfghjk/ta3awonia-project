'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, updateCollection, removeCollection } from '@/lib/persist';
import { printTablePdf } from '@/lib/printPdf';
import { PageHeader, Empty, Badge } from '@/components/ui';

const COL = 'members';

const emptyForm = {
  first_name: '',
  family_name: '',
  full_name: '',
  cin: '',
  phone: '',
  address: '',
  birth_date: '',
  join_date: '',
  shares_count: '10',
  share_amount: '100',
  payment_method: 'نقدا',
  notes: '',
};

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    const { items, source, error } = await loadCollection(api, '/api/members', COL);
    setMembers(items);
    setLoading(false);
    if (source === 'local' && error) {
      setMsg(`⚠️ الخادم: ${error} — البيانات محفوظة محلياً`);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    const name =
      form.full_name.trim() ||
      [form.first_name, form.family_name].filter(Boolean).join(' ').trim();
    if (!name || !form.cin.trim()) return setMsg('⚠️ أأدخل الاسم و رقم بطاقة التعريف الوطنية!');

    const body = {
      first_name: form.first_name.trim() || undefined,
      family_name: form.family_name.trim() || undefined,
      full_name: name,
      cin: form.cin.trim(),
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      birth_date: form.birth_date || undefined,
      join_date: form.join_date || undefined,
      shares_count: parseInt(form.shares_count, 10) || 0,
      share_amount: parseFloat(form.share_amount) || 0,
      payment_method: form.payment_method || undefined,
      notes: form.notes.trim() || undefined,
      is_active: true,
    };

    const { item, apiError } = await addCollection(api, '/api/members', COL, body);
    setMembers((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id))]);
    setForm({ ...emptyForm });
    setShowForm(false);
    setMsg(apiError ? `✅ تمت إضافة ${name} (محفوظ محلياً — ${apiError})` : `✅ تمت إضافة العضو ${name}!`);
    setTimeout(() => setMsg(''), 4000);
  }

  function openEdit(m) {
    setEditId(m.id);
    setEditForm({
      first_name: m.first_name || '',
      family_name: m.family_name || '',
      full_name: m.full_name || '',
      cin: m.cin || '',
      phone: m.phone || '',
      address: m.address || '',
      birth_date: m.birth_date ? String(m.birth_date).slice(0, 10) : '',
      join_date: m.join_date ? String(m.join_date).slice(0, 10) : '',
      shares_count: String(m.shares_count ?? 0),
      share_amount: String(m.share_amount ?? 0),
      payment_method: m.payment_method || 'نقدا',
      notes: m.notes || '',
    });
  }

  async function doEdit() {
    const name =
      editForm.full_name.trim() ||
      [editForm.first_name, editForm.family_name].filter(Boolean).join(' ').trim();
    const body = {
      first_name: editForm.first_name.trim() || undefined,
      family_name: editForm.family_name.trim() || undefined,
      full_name: name,
      phone: editForm.phone.trim() || undefined,
      address: editForm.address.trim() || undefined,
      birth_date: editForm.birth_date || undefined,
      join_date: editForm.join_date || undefined,
      shares_count: parseInt(editForm.shares_count, 10) || 0,
      share_amount: parseFloat(editForm.share_amount) || 0,
      payment_method: editForm.payment_method || undefined,
      notes: editForm.notes.trim() || undefined,
    };
    const { item, apiError } = await updateCollection(api, '/api/members', COL, editId, body);
    setMembers((prev) => prev.map((x) => (String(x.id) === String(editId) ? item : x)));
    closeEdit();
    setMsg(apiError ? `✅ تم التعديل محلياً (${apiError})` : '✅ تم التعديل');
    setTimeout(() => setMsg(''), 3000);
  }

  function closeEdit() {
    setEditId(null);
  }

  async function del(id) {
    if (!confirm('⚠️ سيتم حذف العضو. هل أنت متأكد؟')) return;
    const { apiError } = await removeCollection(api, '/api/members', COL, id);
    setMembers((prev) => prev.filter((x) => String(x.id) !== String(id)));
    if (apiError) setMsg(`⚠️ حذف محلي — الخادم: ${apiError}`);
  }

  function printPdf() {
    printTablePdf({
      title: 'قائمة أعضاء التعاونية',
      subtitle: 'سجل الأعضاء والحصص',
      headers: ['#', 'الاسم الكامل', 'رقم البطاقة', 'الهاتف', 'تاريخ الانضمام', 'عدد الحصص', 'قيمة الحصة (د.م)', 'الحالة'],
      rows: members.map((m, i) => [
        String(i + 1),
        m.full_name || '',
        m.cin || '',
        m.phone || '—',
        m.join_date ? String(m.join_date).slice(0, 10) : '—',
        String(m.shares_count ?? 0),
        String(m.share_amount ?? 0),
        m.is_active !== false ? 'نشط' : 'معطّل',
      ]),
      footer: 'وثيقة رسمية — يُرجى التحقق من البيانات قبل الاعتماد',
    });
  }

  return (
    <div>
      <PageHeader
        title="👥 الأعضاء"
        count={members.length ? `${members.length} عضو` : ''}
        actions={
          <>
            <button className="btn btn-sec" onClick={printPdf} title="طباعة / حفظ PDF">
              <i className="fas fa-file-pdf" /> طباعة PDF
            </button>
            <button className="btn btn-p" onClick={() => setShowForm(true)}>
              <i className="fas fa-plus" /> إضافة عضوة جديدة
            </button>
          </>
        }
      />

      {msg && (
        <div className={`al ${msg.startsWith('✅') ? 'al-s' : 'al-d'}`} style={{ marginBottom: 12 }}>
          {msg}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay open" onClick={() => setShowForm(false)}>
          <div className="modal-box" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
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
            <div className="modal-title" style={{ color: '#8B7355' }}>
              + إضافة عضوة جديدة
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="field">
                  <label>الاسم الشخصي</label>
                  <input
                    className="input"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="الاسم الشخصي"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>الاسم العائلي</label>
                  <input
                    className="input"
                    value={form.family_name}
                    onChange={(e) => setForm({ ...form, family_name: e.target.value })}
                    placeholder="الاسم العائلي"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>رقم بطاقة التعريف الوطنية *</label>
                  <input
                    className="input"
                    dir="ltr"
                    value={form.cin}
                    onChange={(e) => setForm({ ...form, cin: e.target.value })}
                    placeholder="مثال: JB234567"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>تاريخ الازدياد</label>
                  <input
                    className="input"
                    type="date"
                    value={form.birth_date}
                    onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>العنوان</label>
                  <input
                    className="input"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="العنوان الكامل"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>رقم الهاتف</label>
                  <input
                    className="input"
                    dir="ltr"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="06XXXXXXXX"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>تاريخ الانخراط</label>
                  <input
                    className="input"
                    type="date"
                    value={form.join_date}
                    onChange={(e) => setForm({ ...form, join_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>عدد الحصص</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={form.shares_count}
                    onChange={(e) => setForm({ ...form, shares_count: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>قيمة الحصة (د.م)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={form.share_amount}
                    onChange={(e) => setForm({ ...form, share_amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>طريقة الأداء</label>
                  <select
                    className="input"
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  >
                    <option value="نقدا">نقدا</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="شيك">شيك</option>
                  </select>
                </div>
              </div>
              <div className="col-12">
                <div className="field">
                  <label>ملاحظات</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
              </div>
              <div className="col-12" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-sec" onClick={() => setShowForm(false)}>
                  إلغاء
                </button>
                <button className="btn btn-s" onClick={save}>
                  💾 حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="wc table-wrap">
        <table className="ct">
          <thead>
            <tr>
              <th>#</th>
              <th>الاسم</th>
              <th>CIN</th>
              <th>الهاتف</th>
              <th>الانضمام</th>
              <th>الحصص</th>
              <th>المساهمة</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading && <Empty colSpan={9} text="⏳ جاري التحميل..." />}
            {!loading && members.length === 0 && <Empty colSpan={9} text="لا يوجد أعضاء" />}
            {!loading &&
              members.map((m, i) => (
                <tr key={m.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{m.full_name}</td>
                  <td>
                    <span className="bp">{m.cin}</span>
                  </td>
                  <td dir="ltr">{m.phone || '—'}</td>
                  <td style={{ color: '#999', fontSize: '0.83em' }}>
                    {m.join_date ? String(m.join_date).slice(0, 10) : '—'}
                  </td>
                  <td>{m.shares_count ?? 0}</td>
                  <td>
                    <strong style={{ color: '#43e97b' }}>{m.share_amount} د.م</strong>
                  </td>
                  <td>
                    {m.is_active !== false ? (
                      <Badge variant="success">✅ نشط</Badge>
                    ) : (
                      <Badge variant="danger">⛔ معطل</Badge>
                    )}
                  </td>
                  <td style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-p btn-sm" onClick={() => openEdit(m)}>
                      ✏️
                    </button>
                    <button className="btn btn-d btn-sm" onClick={() => del(m.id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {editId && (
        <div className="modal-overlay open" onClick={closeEdit}>
          <div className="modal-box" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={closeEdit}
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
            <div className="modal-title">✏️ تعديل العضو</div>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="field">
                  <label>الاسم الشخصي</label>
                  <input
                    className="input"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>الاسم العائلي</label>
                  <input
                    className="input"
                    value={editForm.family_name}
                    onChange={(e) => setEditForm({ ...editForm, family_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>الهاتف</label>
                  <input
                    className="input"
                    dir="ltr"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>تاريخ الازدياد</label>
                  <input
                    className="input"
                    type="date"
                    value={editForm.birth_date}
                    onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-8">
                <div className="field">
                  <label>العنوان</label>
                  <input
                    className="input"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="field">
                  <label>تاريخ الانخراط</label>
                  <input
                    className="input"
                    type="date"
                    value={editForm.join_date}
                    onChange={(e) => setEditForm({ ...editForm, join_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="field">
                  <label>عدد الحصص</label>
                  <input
                    className="input"
                    type="number"
                    value={editForm.shares_count}
                    onChange={(e) => setEditForm({ ...editForm, shares_count: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="field">
                  <label>قيمة الحصة (د.م)</label>
                  <input
                    className="input"
                    type="number"
                    value={editForm.share_amount}
                    onChange={(e) => setEditForm({ ...editForm, share_amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="field">
                  <label>طريقة الأداء</label>
                  <select
                    className="input"
                    value={editForm.payment_method}
                    onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                  >
                    <option value="نقدا">نقدا</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="شيك">شيك</option>
                  </select>
                </div>
              </div>
              <div className="col-12">
                <div className="field">
                  <label>ملاحظات</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-12" style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-s" onClick={doEdit}>
                  💾 حفظ
                </button>
                <button className="btn btn-sec" onClick={closeEdit}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
