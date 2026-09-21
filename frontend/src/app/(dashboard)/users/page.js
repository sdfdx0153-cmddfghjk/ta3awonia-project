'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, Loading, Empty, Badge } from '@/components/ui';

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('ar-MA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function subStatus(u) {
  if (u.subscription_expired || (u.term_end_date && Date.now() > new Date(u.term_end_date).setHours(23, 59, 59, 999))) {
    return { label: 'منتهي', variant: 'danger' };
  }
  if (u.is_active === false) return { label: 'معطل', variant: 'danger' };
  if (u.term_end_date) {
    const days = Math.ceil((new Date(u.term_end_date) - Date.now()) / 86400000);
    if (days <= 7) return { label: `ينتهي خلال ${days}ي`, variant: 'warning' };
    return { label: 'نشط', variant: 'success' };
  }
  return { label: u.is_active !== false ? 'نشط' : 'معطل', variant: u.is_active !== false ? 'success' : 'danger' };
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'user',
    subscription_months: '12',
  });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'user',
    is_active: true,
    subscription_months: '',
    term_end_date: '',
  });
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { loadCollection } = await import('@/lib/persist');
      const { items, source, error } = await loadCollection(api, '/api/users', 'users');
      setUsers(Array.isArray(items) ? items : []);
      if (source === 'local' && error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!form.username.trim() || !form.password.trim()) {
      return setMsg('⚠️ أأدخل اسم المستخدم و كلمة السر!');
    }
    if (form.password.length < 6) {
      return setMsg('⚠️ كلمة السر يجب أن تكون 6 أحرف على الأقل');
    }
    const body = {
      username: form.username.trim(),
      email: form.email.trim() || undefined,
      password: form.password,
      full_name: form.full_name.trim() || form.username.trim(),
      role: form.role,
      subscription_months: Number(form.subscription_months) || 12,
      is_active: true,
    };
    try {
      const { addCollection } = await import('@/lib/persist');
      const { item, apiError } = await addCollection(api, '/api/users', 'users', body);
      setUsers((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id) && x.username !== item.username)]);
      setMsg(apiError
        ? `✅ تمت إضافة ${form.username} محلياً (${apiError})`
        : `✅ تمت إضافة المستخدم ${form.username} باشتراك ${form.subscription_months} شهر!`);
      setForm({ username: '', email: '', password: '', full_name: '', role: 'user', subscription_months: '12' });
      setShowForm(false);
      setTimeout(() => setMsg(''), 3500);
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  }

  function openEdit(u) {
    setEditId(u.id);
    setEditForm({
      username: u.username,
      email: u.email || '',
      password: '',
      full_name: u.full_name || '',
      role: u.role || 'user',
      is_active: u.is_active !== false,
      subscription_months: '',
      term_end_date: u.term_end_date ? String(u.term_end_date).slice(0, 10) : '',
    });
  }

  async function doEdit() {
    const payload = {
      username: editForm.username.trim(),
      email: editForm.email.trim(),
      full_name: editForm.full_name.trim(),
      role: editForm.role,
      is_active: editForm.is_active,
    };
    if (editForm.password && editForm.password.length >= 6) {
      payload.password = editForm.password;
    }
    if (editForm.subscription_months) {
      payload.subscription_months = Number(editForm.subscription_months);
    } else if (editForm.term_end_date) {
      payload.term_end_date = editForm.term_end_date;
    }
    try {
      const { updateCollection } = await import('@/lib/persist');
      const { item, apiError } = await updateCollection(api, '/api/users', 'users', editId, payload);
      setUsers((prev) => prev.map((x) => (String(x.id) === String(editId) ? { ...x, ...item } : x)));
      setEditId(null);
      setMsg(apiError ? `✅ تم التعديل محلياً (${apiError})` : '✅ تم التعديل');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      alert(`❌ ${e.message}`);
    }
  }

  async function del(id) {
    if (!confirm('هل أنت متأكد تريد حذف هذا المستخدم؟')) return;
    try {
      const { removeCollection } = await import('@/lib/persist');
      await removeCollection(api, '/api/users', 'users', id);
      setUsers((prev) => prev.filter((x) => String(x.id) !== String(id)));
    } catch (e) {
      alert(`❌ ${e.message}`);
    }
  }

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
        🔒 هذا الصفحة للمدير فقط (User Admin Panel)
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="User Admin Panel"
        count={users.length ? `${users.length} مستخدم` : ''}
        actions={
          <button className="btn btn-p" onClick={() => setShowForm(true)}>
            <i className="fas fa-plus" /> أضف مستخدم
          </button>
        }
      />
      <p style={{ color: '#64748b', fontSize: '0.88em', marginTop: -8, marginBottom: 16 }}>
        إدارة حسابات الدخول + مدة الاشتراك — ملي يسالي الاشتراك الحساب كيتقفل ويطلبو يتواصلو معاك
      </p>

      {msg && (
        <div className={`al ${msg.startsWith('✅') ? 'al-s' : 'al-d'}`} style={{ marginBottom: 12 }}>
          {msg}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <div className="wc table-wrap">
          <table className="ct">
            <thead>
              <tr>
                <th>الاسم الكامل</th>
                <th>اسم المستخدم</th>
                <th>الإيميل</th>
                <th>الدور</th>
                <th>تاريخ الإنشاء</th>
                <th>نهاية الاشتراك</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && <Empty colSpan={8} text="لا يوجد مستخدمين" />}
              {users.map((u) => {
                const st = subStatus(u);
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.full_name || u.username}</td>
                    <td dir="ltr" style={{ fontFamily: 'monospace' }}>
                      {u.username}
                    </td>
                    <td dir="ltr" style={{ fontSize: '0.9em' }}>
                      {u.email || '—'}
                    </td>
                    <td>{u.role === 'admin' ? 'مدير' : 'مستخدم'}</td>
                    <td style={{ fontSize: '0.85em', whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</td>
                    <td style={{ fontSize: '0.85em', whiteSpace: 'nowrap' }}>{fmtDate(u.term_end_date)}</td>
                    <td>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </td>
                    <td>
                      <button className="btn btn-p btn-sm" onClick={() => openEdit(u)} title="تعديل">
                        ✏️
                      </button>{' '}
                      <button className="btn btn-d btn-sm" onClick={() => del(u.id)} title="حذف">
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay open" onClick={() => setShowForm(false)}>
          <div className="modal-box" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowForm(false)}
              style={{ position: 'absolute', top: 14, left: 18, background: 'none', border: 'none', fontSize: '1.3em', cursor: 'pointer', color: '#999' }}
            >
              ✕
            </button>
            <div className="modal-title">➕ مستخدم جديد + اشتراك</div>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="field">
                  <label>اسم المستخدم *</label>
                  <input className="input" dir="ltr" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="user" />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>كلمة السر *</label>
                  <input className="input" type="password" dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>الاسم الكامل</label>
                  <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>الدور</label>
                  <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="user">مستخدم</option>
                    <option value="admin">مدير</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>مدة الاشتراك *</label>
                  <select className="input" value={form.subscription_months} onChange={(e) => setForm({ ...form, subscription_months: e.target.value })}>
                    <option value="1">شهر واحد (1)</option>
                    <option value="6">6 أشهر</option>
                    <option value="12">سنة (12 شهر)</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>الإيميل (اختياري)</label>
                  <input className="input" dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="col-12" style={{ fontSize: '0.8em', color: '#5c726a', background: '#f7faf8', padding: 10, borderRadius: 10 }}>
                📅 تاريخ البداية = اليوم · النهاية تتحسب تلقائياً حسب المدة. ملي يسالي الاشتراك الحساب كيتقفل.
              </div>
              <div className="col-12" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-sec" onClick={() => setShowForm(false)}>إلغاء</button>
                <button className="btn btn-s" onClick={save}>💾 حفظ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editId && (
        <div className="modal-overlay open" onClick={() => setEditId(null)}>
          <div className="modal-box" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setEditId(null)}
              style={{ position: 'absolute', top: 14, left: 18, background: 'none', border: 'none', fontSize: '1.3em', cursor: 'pointer', color: '#999' }}
            >
              ✕
            </button>
            <div className="modal-title">✏️ تعديل المستخدم / تجديد الاشتراك</div>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="field">
                  <label>اسم المستخدم</label>
                  <input className="input" dir="ltr" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>كلمة سر جديدة (اختياري)</label>
                  <input className="input" type="password" dir="ltr" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="فارغة = بلا تغيير" />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>الاسم الكامل</label>
                  <input className="input" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>الدور</label>
                  <select className="input" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                    <option value="user">مستخدم</option>
                    <option value="admin">مدير</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>الإيميل</label>
                  <input className="input" dir="ltr" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>الحالة</label>
                  <select className="input" value={editForm.is_active ? '1' : '0'} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === '1' })}>
                    <option value="1">نشط</option>
                    <option value="0">معطل</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>تجديد الاشتراك من اليوم</label>
                  <select className="input" value={editForm.subscription_months} onChange={(e) => setEditForm({ ...editForm, subscription_months: e.target.value })}>
                    <option value="">— بلا تجديد —</option>
                    <option value="1">شهر واحد</option>
                    <option value="6">6 أشهر</option>
                    <option value="12">سنة كاملة</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>أو تاريخ نهاية يدوي</label>
                  <input className="input" type="date" value={editForm.term_end_date} onChange={(e) => setEditForm({ ...editForm, term_end_date: e.target.value, subscription_months: '' })} />
                </div>
              </div>
              <div className="col-12" style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-s" onClick={doEdit}>💾 حفظ</button>
                <button className="btn btn-sec" onClick={() => setEditId(null)}>إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
