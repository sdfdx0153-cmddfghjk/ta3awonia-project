'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const FEATURES = [
  { icon: 'fa-users', label: 'الأعضاء والحصص' },
  { icon: 'fa-landmark', label: 'مجلس الإدارة' },
  { icon: 'fa-calculator', label: 'المحاسبة والخزينة' },
  { icon: 'fa-boxes-stacked', label: 'المخزون والتجارة' },
  { icon: 'fa-chart-line', label: 'التقارير والإحصائيات' },
  { icon: 'fa-file-alt', label: 'المحاضر والقرارات' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || 'مشكلة في تسجيل الدخول');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #0a3d34 0%, #0d5c4d 45%, #147a66 100%)',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', background: 'rgba(201,162,39,0.12)', top: -90, right: -70, filter: 'blur(50px)' }} />
      <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', bottom: -50, left: -40, filter: 'blur(40px)' }} />

      <div
        style={{
          background: 'rgba(255,255,255,0.98)',
          borderRadius: 24,
          padding: '36px 32px 28px',
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 25px 70px rgba(0,0,0,0.35)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          border: '1px solid rgba(201,162,39,0.25)',
        }}
      >
        {/* Logo Smart Conseil */}
        <div
          style={{
            width: 88,
            height: 88,
            margin: '0 auto 14px',
            borderRadius: 22,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 28px rgba(13,92,77,0.18)',
            overflow: 'hidden',
            padding: 8,
            border: '1px solid rgba(13,92,77,0.08)',
          }}
        >
          <img
            src="/smart-conseil-logo.jpg"
            alt="Smart Conseil"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <h2 style={{ margin: '6px 0 4px', color: '#0d5c4d', fontWeight: 800, fontSize: '1.45em' }}>
          نظام التعاونية
        </h2>
        <p style={{ margin: '0 0 6px', color: '#c9a227', fontSize: '0.88em', fontWeight: 700 }}>
          Smart Conseil · Coopérative Manager
        </p>
        <p style={{ margin: '0 0 18px', color: '#5c726a', fontSize: '0.82em', lineHeight: 1.55 }}>
          منصة متكاملة لإدارة التعاونيات: الأعضاء، الحصص، المحاسبة،
          المخزون، المبيعات، الجموعات، والتقارير — كلشي فمكان واحد.
        </p>

        {/* زر معرفة المأضف */}
        <button
          type="button"
          onClick={() => setShowAbout((v) => !v)}
          style={{
            background: showAbout ? 'linear-gradient(135deg,#0d5c4d,#147a66)' : 'linear-gradient(135deg,#f7faf8,#eef5f2)',
            color: showAbout ? '#fff' : '#0d5c4d',
            border: '1px solid #c5ddd4',
            borderRadius: 12,
            padding: '9px 16px',
            fontSize: '0.82em',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 16,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
          }}
        >
          <i className={`fas ${showAbout ? 'fa-chevron-up' : 'fa-info-circle'}`} />
          {showAbout ? 'إخفاء التفاصيل' : 'شنو كيدير هذا النظام؟'}
        </button>

        {showAbout && (
          <div
            style={{
              textAlign: 'right',
              background: 'linear-gradient(180deg,#f7faf8,#eef5f2)',
              borderRadius: 16,
              padding: '16px 14px',
              marginBottom: 18,
              border: '1px solid #d8e5df',
            }}
          >
            <p style={{ margin: '0 0 12px', fontSize: '0.8em', color: '#3d5c52', lineHeight: 1.6 }}>
              نظام مصمم خصيصاً للتعاونيات المغربية باش يسهّل التسيير اليومي
              والقانوني والمالي، مع واجهة عربية سهلة.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {FEATURES.map((f) => (
                <div
                  key={f.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.78em',
                    color: '#0d5c4d',
                    fontWeight: 600,
                    background: '#fff',
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid #e0ebe6',
                  }}
                >
                  <i className={`fas ${f.icon}`} style={{ color: '#c9a227', width: 16, textAlign: 'center' }} />
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="al al-d" style={{ marginBottom: 14, justifyContent: 'center', borderRadius: 12 }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ textAlign: 'right' }}>
            <label>اسم المستخدم</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
              dir="ltr"
              style={{ textAlign: 'left' }}
            />
          </div>
          <div className="field" style={{ textAlign: 'right' }}>
            <label>كلمة السر</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              style={{ textAlign: 'left' }}
            />
          </div>
          <button
            className="btn btn-p w-100"
            style={{ width: '100%', padding: '13px 16px', fontSize: '1em', marginTop: 8, borderRadius: 12 }}
            disabled={busy}
          >
            {busy ? '⏳ جاري الدخول...' : '🔐 دخول إلى التعاونية'}
          </button>
        </form>

        {/* تواصل معنا */}
        <div
          style={{
            marginTop: 22,
            padding: '14px 12px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(13,92,77,0.06), rgba(201,162,39,0.08))',
            border: '1px solid rgba(13,92,77,0.12)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.78em', color: '#5c726a', marginBottom: 6, fontWeight: 600 }}>
            <i className="fas fa-headset" style={{ marginLeft: 6, color: '#0d5c4d' }} />
            تواصل معنا — Smart Conseil
          </div>
          <a
            href="tel:+212600000000"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: '#0d5c4d',
              fontWeight: 800,
              fontSize: '1.05em',
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
            dir="ltr"
          >
            <i className="fas fa-phone-alt" style={{ color: '#c9a227' }} />
            +212 6XX-XXX-XXX
          </a>
          <div style={{ fontSize: '0.7em', color: '#7a948a', marginTop: 4 }}>
            دعم فني · استشارات · تدريب
          </div>
        </div>
      </div>
    </div>
  );
}
