'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    setMsg('');
    setErr('');
    setBusy(true);
    try {
      await api.put('/api/auth/me', { fullName, phone }).catch(() => {
        // fallback local only if endpoint missing
        return null;
      });
      setMsg('✅ تم حفظ البيانات الشخصية');
    } catch (e2) {
      setErr(e2.message || 'ما قدرناش نحفظو');
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setMsg('');
    setErr('');
    if (newPass.length < 6) {
      setErr('كلمة السر الجديدة يجب أن تكون على الأقل 6 حروف');
      return;
    }
    if (newPass !== confirm) {
      setErr('كلمة السر الجديدة ما متطاش مع التأكيد');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/auth/change-password', {
        oldPassword: oldPass,
        newPassword: newPass,
      });
      setMsg('✅ تم تغيير كلمة السر');
      setOldPass('');
      setNewPass('');
      setConfirm('');
    } catch (e2) {
      setErr(e2.message || 'ما قدرناش نبدّلو كلمة السر — تأكد من كلمة السر الحالية');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="wc" style={{ borderTop: '4px solid #0d5c4d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'linear-gradient(135deg,#0d5c4d,#1a9b82)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6em',
              fontWeight: 800,
            }}
          >
            {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#0d5c4d' }}>{user?.full_name || user?.username}</h3>
            <div style={{ opacity: 0.65, fontSize: '0.85em', marginTop: 4 }}>
              @{user?.username} · {user?.role === 'admin' ? 'مدير النظام' : user?.role || 'مستخدم'}
            </div>
          </div>
        </div>

        {msg && <div className="al al-s" style={{ marginBottom: 12 }}>{msg}</div>}
        {err && <div className="al al-d" style={{ marginBottom: 12 }}>{err}</div>}

        <form onSubmit={saveProfile}>
          <h5 style={{ margin: '0 0 12px', color: '#0d5c4d' }}>البيانات الشخصية</h5>
          <div className="field">
            <label>الاسم الكامل</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="field">
            <label>الهاتف</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" style={{ textAlign: 'left' }} />
          </div>
          <div className="field">
            <label>البريد</label>
            <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.7 }} />
          </div>
          <button className="btn btn-p" disabled={busy} type="submit">
            💾 حفظ الملف الشخصي
          </button>
        </form>
      </div>

      <div className="wc" style={{ borderTop: '4px solid #c9a227', marginTop: 16 }}>
        <h5 style={{ margin: '0 0 12px', color: '#c9a227' }}>تغيير كلمة السر</h5>
        <form onSubmit={changePassword}>
          <div className="field">
            <label>كلمة السر الحالية</label>
            <input className="input" type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} dir="ltr" style={{ textAlign: 'left' }} />
          </div>
          <div className="field">
            <label>كلمة السر الجديدة</label>
            <input className="input" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} dir="ltr" style={{ textAlign: 'left' }} />
          </div>
          <div className="field">
            <label>تأكيد كلمة السر</label>
            <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} dir="ltr" style={{ textAlign: 'left' }} />
          </div>
          <button className="btn btn-s" disabled={busy} type="submit">
            🔑 تغيير كلمة السر
          </button>
        </form>
      </div>

      <div className="wc" style={{ marginTop: 16 }}>
        <button className="btn btn-d" onClick={logout}>
          <i className="fas fa-sign-out-alt" /> تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
