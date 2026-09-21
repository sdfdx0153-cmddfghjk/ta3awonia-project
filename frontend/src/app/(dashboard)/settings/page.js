'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/ui';

const SETTINGS_KEY = 'ta3awonia_v2_settings';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({
    coopName: 'نظام التعاونية',
    address: '',
    phone: '',
    email: '',
    fiscalYear: new Date().getFullYear().toString(),
    currency: 'د.م',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setForm((f) => ({ ...f, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  function save() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(form));
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>
      <PageHeader title="⚙️ الإعدادات" />

      <div className="wc" style={{ maxWidth: 640, borderTop: '4px solid #4facfe', marginBottom: 20 }}>
        <h5 style={{ marginBottom: 20, color: '#4facfe' }}>إعدادات التعاونية</h5>
        <div className="row g-3">
          <div className="col-md-12"><div className="field"><label>اسم التعاونية</label><input className="input" value={form.coopName} onChange={(e) => setForm({ ...form, coopName: e.target.value })} /></div></div>
          <div className="col-md-12"><div className="field"><label>العنوان</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div></div>
          <div className="col-md-6"><div className="field"><label>الهاتف</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div></div>
          <div className="col-md-6"><div className="field"><label>البريد الإلكتروني</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div></div>
          <div className="col-md-6"><div className="field"><label>السنة المالية</label><input className="input" value={form.fiscalYear} onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })} /></div></div>
          <div className="col-md-6"><div className="field"><label>العملة</label><input className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div></div>
          <div className="col-md-12" style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <button className="btn btn-s" onClick={save}>💾 حفظ الإعدادات</button>
            {saved && <span style={{ color: '#43e97b', fontWeight: 'bold' }}>✅ تم الحفظ</span>}
          </div>
        </div>
      </div>

      {/* صلاحيات مقترحة */}
      <div className="wc" style={{ maxWidth: 640, borderTop: '4px solid #c9a227', marginBottom: 20 }}>
        <h5 style={{ marginBottom: 12, color: '#c9a227' }}>🔐 أدوار وصلاحيات مقترحة</h5>
        <p style={{ opacity: 0.75, marginBottom: 14, fontSize: '0.88em' }}>
          عند إنشاء مستخدمين جداد، استعمل هذا الأدوار:
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            { role: 'admin', title: 'مدير النظام', desc: 'كل الصلاحيات — إدارة المستخدمين والإعدادات' },
            { role: 'treasurer', title: 'أمين المال', desc: 'الخزينة، الديون، المصاريف، المحاسبة' },
            { role: 'secretary', title: 'الكاتب العام', desc: 'المحاضر، القرارات، الجموعات، الحضور' },
            { role: 'accountant', title: 'محاسب', desc: 'المحاسبة، التقارير، التصدير' },
            { role: 'storekeeper', title: 'أمين المخزن', desc: 'المنتجات، المخزون، الجرد، المشتريات' },
            { role: 'user', title: 'مستخدم عادي', desc: 'عرض محدود حسب ما يحدده المدير' },
          ].map((r) => (
            <div key={r.role} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: '#f7faf8', borderRadius: 10, border: '1px solid #e0ebe6' }}>
              <code style={{ fontWeight: 800, color: '#0d5c4d', minWidth: 100 }}>{r.role}</code>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88em' }}>{r.title}</div>
                <div style={{ fontSize: '0.78em', opacity: 0.7 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="wc" style={{ maxWidth: 640, borderTop: '4px solid #667eea' }}>
          <h5 style={{ marginBottom: 12, color: '#667eea' }}>👥 إدارة المستخدمين</h5>
          <p style={{ opacity: 0.75, marginBottom: 16, fontSize: '0.9em' }}>
            تقدر تزيد مستخدمين جداد، تعدّل الصلاحيات، أو تحذف حسابات.
          </p>
          <button className="btn btn-p" onClick={() => router.push('/users')}>
            <i className="fas fa-users-cog" /> فتح إدارة المستخدمين
          </button>
        </div>
      )}
    </div>
  );
}
