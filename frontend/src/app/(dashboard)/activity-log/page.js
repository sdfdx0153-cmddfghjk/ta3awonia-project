'use client';
import { useState, useEffect } from 'react';
import { PageHeader, Empty } from '@/components/ui';

export default function ActivityLogPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // placeholder local log — starts empty
    try {
      const raw = localStorage.getItem('coop_activity_log');
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  function clearAll() {
    if (!confirm('مسح كل السجل؟')) return;
    setItems([]);
    localStorage.removeItem('coop_activity_log');
  }

  return (
    <div>
      <PageHeader
        title="📋 سجل النشاط"
        count={items.length ? `${items.length} حدث` : ''}
        actions={<button className="btn btn-sec" onClick={clearAll}><i className="fas fa-trash" /> مسح السجل</button>}
      />
      <div className="wc" style={{ marginBottom: 16, borderTop: '4px solid #94a3b8' }}>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9em' }}>
          هذا السجل كيجمع العمليات المهمة فالنظام (إضافة / تعديل / حذف). الآن كيبان فاضي حتى تبداو تستعملو الوحدات.
        </p>
      </div>
      <div className="wc table-wrap">
        <table className="ct">
          <thead><tr><th>#</th><th>الوقت</th><th>المستخدم</th><th>العملية</th><th>التفاصيل</th></tr></thead>
          <tbody>
            {items.length === 0 && <Empty colSpan={5} text="لا يوجد نشاط مسجل بعد" />}
            {items.map((x, i) => (
              <tr key={x.id || i}>
                <td>{i + 1}</td>
                <td style={{ fontSize: '0.85em', color: '#64748b' }}>{x.time || '—'}</td>
                <td>{x.user || '—'}</td>
                <td style={{ fontWeight: 700 }}>{x.action || '—'}</td>
                <td>{x.details || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
