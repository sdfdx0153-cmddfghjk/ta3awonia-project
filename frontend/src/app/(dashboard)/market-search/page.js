'use client';

import { useState } from 'react';

const QUICK = [
  {
    cat: 'تعاونيات ناشطة',
    color: '#0d5c4d',
    items: [
      { label: 'تعاونيات فلاحية في المغرب', q: 'تعاونيات فلاحية نشطة في المغرب 2024 2025' },
      { label: 'تعاونيات نسائية ناجحة', q: 'تعاونيات نسوية ناجحة المغرب منتجات' },
      { label: 'تعاونيات الصناعة التقليدية', q: 'تعاونيات الصناعة التقليدية المغرب' },
      { label: 'تعاونيات الحليب والألبان', q: 'تعاونيات الحليب المغرب' },
      { label: 'تعاونيات الزيتون والزيت', q: 'تعاونيات زيت الزيتون المغرب تصدير' },
      { label: 'تعاونيات العسل', q: 'تعاونيات تربية النحل والعسل المغرب' },
    ],
  },
  {
    cat: 'منتوجات السوق',
    color: '#c9a227',
    items: [
      { label: 'أسعار المنتوجات الفلاحية', q: 'أسعار المنتوجات الفلاحية اليوم المغرب' },
      { label: 'منتوجات التعاونيات المطلوبة', q: 'أفضل منتجات التعاونيات مبيعا في المغرب' },
      { label: 'سوق الأركان والكوسكوس', q: 'سوق زيت الأركان والكوسكوس تعاونيات' },
      { label: 'التصدير والمنتوجات المحلية', q: 'تصدير منتجات التعاونيات المغربية أوروبا' },
      { label: 'علامات الجودة (IGP / Bio)', q: 'منتجات بيولوجية و IGP تعاونيات المغرب' },
      { label: 'معارض ومنصات البيع', q: 'معارض منتجات التعاونيات المغرب منصات بيع' },
    ],
  },
  {
    cat: 'قوانين ودعم',
    color: '#667eea',
    items: [
      { label: 'قانون التعاونيات المغربي', q: 'القانون 112.12 المتعلق بالتعاونيات المغرب' },
      { label: 'مكتب تنمية التعاون (ODCO)', q: 'مكتب تنمية التعاون ODCO خدمات' },
      { label: 'تمويل ودعم التعاونيات', q: 'دعم وتمويل التعاونيات المغرب وزارة' },
      { label: 'الضم الضريبي للتعاونيات', q: 'النظام الضريبي للتعاونيات في المغرب' },
      { label: 'الجمعيات العامة والوثائق', q: 'محاضر الجمعيات العامة تعاونية نموذج' },
      { label: 'شهذاات الحصص والنظام الأساسي', q: 'نموذج النظام الأساسي لتعاونية المغرب' },
    ],
  },
  {
    cat: 'فرص السوق',
    color: '#0f766e',
    items: [
      { label: 'اتجاهات الاستهلاك 2025', q: 'اتجاهات سوق الغذاء والمنتجات المحلية المغرب 2025' },
      { label: 'التجارة الإلكترونية للتعاونيات', q: 'بيع منتجات التعاونيات أونلاين المغرب' },
      { label: 'شراكات مع السوبرماركت', q: 'توريد منتجات تعاونيات لسلاسل التوزيع المغرب' },
      { label: 'الزراعة التعاقدية', q: 'الزراعة التعاقدية تعاونيات المغرب' },
    ],
  },
];

function googleUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=ar&gl=ma`;
}

function googleNewsUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=nws&hl=ar&gl=ma`;
}

function googleShoppingUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop&hl=ar&gl=ma`;
}

export default function MarketSearchPage() {
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('');

  function buildQuery(base) {
    let full = base.trim();
    if (region.trim()) full += ` ${region.trim()}`;
    return full;
  }

  function search(type = 'web') {
    const query = buildQuery(q || 'تعاونيات المغرب منتجات السوق');
    const url =
      type === 'news' ? googleNewsUrl(query) : type === 'shop' ? googleShoppingUrl(query) : googleUrl(query);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div>
      <div className="wc" style={{ borderTop: '4px solid #0d5c4d' }}>
        <h4 style={{ margin: '0 0 6px', color: '#0d5c4d' }}>🔍 بحث السوق والتعاونيات</h4>
        <p style={{ margin: '0 0 16px', fontSize: '0.88em', color: '#5c726a', lineHeight: 1.55 }}>
          ابحث فـ Google على التعاونيات النشيطة، المنتوجات المطلوبة فـ السوق، القوانين، والدعم —
          باش تعاونيتك تبقى على اطلاع بالسوق والمنافسين.
        </p>

        <div className="row g-3" style={{ marginBottom: 8 }}>
          <div className="col-md-6">
            <div className="field">
              <label>شنو تريد تقلّب؟</label>
              <input
                className="input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search('web')}
                placeholder="مثال: تعاونيات الكسكس سوس، أسعار العسل…"
              />
            </div>
          </div>
          <div className="col-md-3">
            <div className="field">
              <label>الجهة / المدينة (اختياري)</label>
              <input
                className="input"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="سوس، فاس، الدار البيضاء…"
              />
            </div>
          </div>
          <div className="col-md-3" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 14, flexWrap: 'wrap' }}>
            <button className="btn btn-p" type="button" onClick={() => search('web')}>
              🔎 Google
            </button>
            <button className="btn btn-sec btn-sm" type="button" onClick={() => search('news')}>
              📰 أخبار
            </button>
            <button className="btn btn-sec btn-sm" type="button" onClick={() => search('shop')}>
              🛒 تسوق
            </button>
          </div>
        </div>
      </div>

      {QUICK.map((sec) => (
        <div key={sec.cat} className="wc" style={{ borderTop: `4px solid ${sec.color}` }}>
          <h5 style={{ margin: '0 0 12px', color: sec.color }}>{sec.cat}</h5>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 10,
            }}
          >
            {sec.items.map((it) => (
              <button
                key={it.label}
                type="button"
                onClick={() => {
                  const full = buildQuery(it.q);
                  window.open(googleUrl(full), '_blank', 'noopener,noreferrer');
                }}
                style={{
                  textAlign: 'right',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid #e0ebe6',
                  background: 'linear-gradient(180deg,#fff,#f7faf8)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.84em',
                  color: '#1a2e28',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = sec.color;
                  e.currentTarget.style.boxShadow = `0 4px 14px ${sec.color}33`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e0ebe6';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ marginLeft: 6 }}>🔗</span>
                {it.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="wc" style={{ borderTop: '4px solid #b91c1c' }}>
        <h5 style={{ margin: '0 0 8px', color: '#b91c1c' }}>⚠️ ملاحظة</h5>
        <p style={{ margin: 0, fontSize: '0.85em', color: '#5c726a', lineHeight: 1.55 }}>
          البحث كيفتح نتائج Google الحقيقية فـ نافذة جديدة. المعلومات من الإنترنت تتبدّل باستمرار —
          تحقق دائماً من المصادر الرسمية (ODCO، الوزارات، الجريدة الرسمية) قبل أي قرار.
        </p>
      </div>
    </div>
  );
}
