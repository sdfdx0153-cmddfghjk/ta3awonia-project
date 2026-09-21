'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Loading } from '@/components/ui';
import Link from 'next/link';

const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { lsGet } = await import('@/lib/persist');
        let assemblies = [], committees = [];
        try { assemblies = await api.get('/api/assemblies'); } catch { assemblies = lsGet('assemblies'); }
        try { committees = await api.get('/api/committees'); } catch { committees = lsGet('committees'); }
        if (cancelled) return;
        const list = [];
        (Array.isArray(assemblies) ? assemblies : assemblies?.items || []).forEach((a) => {
          const d = a.date || a.assembly_date;
          if (d) {
            list.push({
              id: `a-${a.id}`,
              date: new Date(d),
              title: a.title || a.name || a.type || 'جمعية عامة',
              type: 'assembly',
              href: '/assemblies',
            });
          }
        });
        (Array.isArray(committees) ? committees : committees?.items || []).forEach((c) => {
          const d = c.meeting_date || c.next_meeting || c.date;
          if (d) {
            list.push({
              id: `c-${c.id}`,
              date: new Date(d),
              title: c.name || 'اجتماع لجنة',
              type: 'committee',
              href: '/committees',
            });
          }
        });
        setEvents(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();

  const byDay = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      if (e.date.getFullYear() === year && e.date.getMonth() === month) {
        const d = e.date.getDate();
        if (!map[d]) map[d] = [];
        map[d].push(e);
      }
    });
    return map;
  }, [events, year, month]);

  const monthName = cursor.toLocaleDateString('ar-MA', { month: 'long', year: 'numeric' });

  if (loading) return <Loading />;

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="wc" style={{ borderTop: '4px solid #0d5c4d' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h4 style={{ margin: 0, color: '#0d5c4d' }}>📅 تقويم الاجتماعات</h4>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-sec btn-sm"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
            >
              ▶ الشهر السابق
            </button>
            <strong style={{ minWidth: 140, textAlign: 'center' }}>{monthName}</strong>
            <button
              className="btn btn-sec btn-sm"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
            >
              الشهر التالي ◀
            </button>
            <button className="btn btn-p btn-sm" onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
              اليوم
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 6,
            marginBottom: 8,
          }}
        >
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75em', color: '#5c726a', padding: 6 }}>
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            const today = new Date();
            const isToday =
              d &&
              today.getDate() === d &&
              today.getMonth() === month &&
              today.getFullYear() === year;
            const dayEvents = d ? byDay[d] || [] : [];
            return (
              <div
                key={i}
                style={{
                  minHeight: 88,
                  background: d ? (isToday ? 'rgba(201,162,39,0.12)' : '#f7faf8') : 'transparent',
                  borderRadius: 12,
                  border: d ? (isToday ? '2px solid #c9a227' : '1px solid #e0ebe6') : 'none',
                  padding: d ? 8 : 0,
                }}
              >
                {d && (
                  <>
                    <div style={{ fontWeight: 800, fontSize: '0.85em', color: isToday ? '#c9a227' : '#0d5c4d' }}>{d}</div>
                    {dayEvents.slice(0, 3).map((ev) => (
                      <Link
                        key={ev.id}
                        href={ev.href}
                        style={{
                          display: 'block',
                          marginTop: 4,
                          fontSize: '0.68em',
                          background: ev.type === 'assembly' ? '#0d5c4d' : '#667eea',
                          color: '#fff',
                          borderRadius: 6,
                          padding: '2px 6px',
                          textDecoration: 'none',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ev.title}
                      </Link>
                    ))}
                    {dayEvents.length > 3 && (
                      <div style={{ fontSize: '0.65em', opacity: 0.6, marginTop: 2 }}>+{dayEvents.length - 3}</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: '0.8em' }}>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 4, background: '#0d5c4d', marginLeft: 6 }} /> جمعيات عامة</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 4, background: '#667eea', marginLeft: 6 }} /> لجان</span>
        </div>
      </div>

      <div className="wc">
        <h5 style={{ marginBottom: 12 }}>الاجتماعات القادمة</h5>
        {events
          .filter((e) => e.date >= new Date(new Date().setHours(0, 0, 0, 0)))
          .sort((a, b) => a.date - b.date)
          .slice(0, 10)
          .map((e) => (
            <div key={e.id} className="acc-row">
              <div>
                <strong>{e.title}</strong>
                <div style={{ fontSize: '0.8em', opacity: 0.65 }}>
                  {e.date.toLocaleDateString('ar-MA', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
              <Link href={e.href} className="btn btn-sec btn-sm">
                فتح
              </Link>
            </div>
          ))}
        {events.filter((e) => e.date >= new Date(new Date().setHours(0, 0, 0, 0))).length === 0 && (
          <p style={{ opacity: 0.6 }}>ما كاين حتى اجتماع مبرمج</p>
        )}
      </div>
    </div>
  );
}
