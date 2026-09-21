'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Sidebar from '@/components/Sidebar';
import HeaderTools from '@/components/HeaderTools';

const TITLES = {
  dashboard: '📊 لوحة التحكم',
  board: '🏛️ مجلس الإدارة',
  users: '👤 User Admin Panel',
  assemblies: '📅 الجموعات العامة',
  minutes: '📝 محاضر الاجتماعات',
  decisions: '🔑 سجل القرارات',
  committees: '🏛️ اللجان',
  attendance: '✅ سجل الحضور',
  members: '👥 الأعضاء',
  accounting: '🧮 المحاسبة العامة',
  contributions: '💰 الحصص والاشتراكات',
  'share-certificates': '📜 شهذاات الحصص',
  treasury: '🏦 الصندوق والخزينة',
  budget: '📊 الميزانية',
  debts: '💳 الديون',
  expenses: '💸 المصاريف',
  profits: '💹 توزيع الأرباح',
  'fiscal-year': '📅 السنة المالية',
  products: '📦 المنتجات والمخزون',
  'stock-moves': '🔄 حركات المخزون',
  inventory: '📋 الجرد',
  sales: '🧾 المبيعات والفواتير',
  purchases: '🚚 المشتريات',
  suppliers: '🏭 الموردين',
  clients: '🤝 الزبناء',
  'legal-docs': '⚖️ الوثائق القانونية',
  'mandatory-records': '📚 السجلات الإلزامية',
  reports: '📈 التقارير والإحصائيات',
  export: '📤 تصدير البيانات',
  'activity-log': '📋 سجل النشاط',
  settings: '⚙️ الإعدادات',
  profile: '👤 الملف الشخصي',
  calendar: '📅 التقويم',
  'market-search': '🔍 بحث السوق والتعاونيات',
};

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const theme = useTheme();
  const dark = theme?.dark;
  const router = useRouter();
  const pathname = usePathname();
  const [dateStr, setDateStr] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const page = (pathname || '/').split('/').filter(Boolean)[0] || 'dashboard';

  useEffect(() => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
    const n = new Date();
    setDateStr(`📅 ${days[n.getDay()]} ${n.getDate()} ${months[n.getMonth()]} ${n.getFullYear()}`);
  }, []);

  // إغلاق القائمة عند تغيير الصفحة
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // منع السكرول فالجسم ملي القائمة مفتوحة على الموبايل
  useEffect(() => {
    if (menuOpen && typeof window !== 'undefined' && window.innerWidth < 992) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        ⏳ جاري التحميل...
      </div>
    );
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  return (
    <div style={{ minHeight: '100vh' }} className={dark ? 'dark-app' : ''}>
      {/* Overlay للموبايل */}
      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="main-content">
        <div
          className="top-bar"
          style={{
            background: dark ? 'rgba(26,46,40,0.95)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 1px 0 rgba(15,23,42,0.06)',
            borderBottom: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(15,23,42,0.04)',
            color: dark ? '#e8f0ec' : undefined,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="القائمة"
            >
              <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`} />
            </button>
            <h5
              style={{
                margin: 0,
                fontWeight: 'bold',
                color: dark ? '#e8c547' : '#2d3748',
                fontSize: 'clamp(0.95rem, 3.5vw, 1.15rem)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {TITLES[page] || page}
            </h5>
            <span
              className="date-chip"
              style={{
                background: dark ? 'rgba(255,255,255,0.08)' : '#f0f2f5',
                padding: '5px 11px',
                borderRadius: 20,
                fontSize: '0.75em',
                color: dark ? '#a8c5b8' : '#666',
                whiteSpace: 'nowrap',
              }}
            >
              {dateStr}
            </span>
          </div>
          <HeaderTools />
        </div>
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}
