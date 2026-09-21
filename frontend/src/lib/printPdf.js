/**
 * طباعة / تصدير PDF عبر نافذة الطباعة (يمكن اختيار "حفظ كـ PDF")
 * يدعم العربية والاتجاه RTL
 */

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {object} opts
 * @param {string} opts.title - عنوان المستند
 * @param {string} [opts.subtitle]
 * @param {string[][]} opts.headers - رؤوس الأعمدة
 * @param {string[][]} opts.rows - صفوف البيانات
 * @param {string} [opts.footer]
 * @param {string} [opts.coopName]
 */
export function printTablePdf({ title, subtitle, headers, rows, footer, coopName }) {
  const dateStr = new Date().toLocaleDateString('ar-MA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const name = coopName || (typeof localStorage !== 'undefined' && (() => {
    try {
      const s = JSON.parse(localStorage.getItem('ta3awonia_v2_settings') || '{}');
      return s.coopName || 'التعاونية';
    } catch { return 'التعاونية'; }
  })());

  const th = (headers || []).map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = (rows || [])
    .map(
      (r) =>
        `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, 'Arial', sans-serif;
      direction: rtl;
      margin: 24px;
      color: #1a1a1a;
      font-size: 13px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #0d5c4d;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .header h1 { margin: 0 0 4px; font-size: 20px; color: #0d5c4d; }
    .header .sub { color: #666; font-size: 12px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 12px; color: #555; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 8px 10px;
      text-align: right;
    }
    th {
      background: #0d5c4d;
      color: #fff;
      font-weight: 700;
    }
    tr:nth-child(even) { background: #f5f9f7; }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
      font-size: 11px;
      color: #666;
      text-align: center;
    }
    .stamp {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }
    .stamp div { text-align: center; min-width: 140px; }
    .stamp .line { border-top: 1px solid #333; margin-top: 48px; padding-top: 4px; }
    @media print {
      body { margin: 12px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(name)}</h1>
    <div class="sub">${escapeHtml(title)}</div>
    ${subtitle ? `<div class="sub">${escapeHtml(subtitle)}</div>` : ''}
  </div>
  <div class="meta">
    <span>تاريخ الطباعة: ${dateStr}</span>
    <span>عدد السجلات: ${(rows || []).length}</span>
  </div>
  <table>
    <thead><tr>${th}</tr></thead>
    <tbody>${body || '<tr><td colspan="99" style="text-align:center">لا توجد بيانات</td></tr>'}</tbody>
  </table>
  ${footer ? `<div class="footer">${escapeHtml(footer)}</div>` : ''}
  <div class="stamp">
    <div><div class="line">التوقيع</div></div>
    <div><div class="line">الختم</div></div>
  </div>
  <script>
    window.onload = function () {
      window.print();
    };
  </script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) {
    alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
    return;
  }
  w.document.write(html);
  w.document.close();
}

/**
 * طباعة محتوى HTML حر (فاتورة، محضر...)
 */
export function printHtmlDocument(title, bodyHtml) {
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; margin: 24px; color: #222; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  ${bodyHtml}
  <script>window.onload=function(){window.print();}</script>
</body>
</html>`;
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) {
    alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
    return;
  }
  w.document.write(html);
  w.document.close();
}
