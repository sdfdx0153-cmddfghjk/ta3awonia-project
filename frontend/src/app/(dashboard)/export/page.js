'use client';

import { useEffect, useState } from 'react';
import { api, downloadCsv } from '@/lib/api';
import { lsGet } from '@/lib/persist';
import { printTablePdf } from '@/lib/printPdf';
import { Loading } from '@/components/ui';

const EXPORTS = [
  { key: 'members', icon: '👥', title: 'الأعضاء', desc: 'تصدير قائمة جميع الأعضاء', file: 'members.csv' },
  { key: 'products', icon: '📦', title: 'المنتجات', desc: 'تصدير المنتجات والمخزون', file: 'products.csv' },
  { key: 'sales', icon: '🧾', title: 'المبيعات', desc: 'تصدير جميع عمليات البيع', file: 'sales.csv' },
  { key: 'debts', icon: '💳', title: 'الديون', desc: 'تصدير قائمة الديون', file: 'debts.csv' },
];

export default function ExportPage() {
  const [sales, setSales] = useState([]);
  const [saleId, setSaleId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/sales?limit=200')
      .then((s) => {
        const list = Array.isArray(s) ? s : [];
        setSales(list);
        if (list.length) setSaleId(String(list[0].id));
      })
      .catch(() => {
        const local = lsGet('sales');
        setSales(local);
        if (local.length) setSaleId(String(local[0].id));
      })
      .finally(() => setLoading(false));
  }, []);

  async function doExport(key, file) {
    try {
      await downloadCsv(`/api/export/${key}`, file);
    } catch (e) {
      alert(`تعذّر التصدير: ${e.message}`);
    }
  }

  function printLocal(col, title, headers, rowFn) {
    const items = lsGet(col);
    if (!items.length) {
      alert('لا توجد بيانات محلية لهذه القائمة. افتح الصفحة المعنية أولاً ثم أعد المحاولة.');
      return;
    }
    printTablePdf({
      title,
      headers,
      rows: items.map(rowFn),
      footer: 'وثيقة رسمية صادرة عن نظام إدارة التعاونية',
    });
  }

  function printMembers() {
    printLocal('members', 'قائمة أعضاء التعاونية', ['#', 'الاسم', 'رقم البطاقة', 'الهاتف', 'الحصص', 'المساهمة'], (m, i) => [
      String(i + 1), m.full_name || '', m.cin || '', m.phone || '—', String(m.shares_count ?? 0), String(m.share_amount ?? 0),
    ]);
  }

  function printProducts() {
    printLocal('products', 'قائمة المنتجات والمخزون', ['#', 'المنتج', 'الفئة', 'الشراء', 'البيع', 'المخزون'], (p, i) => [
      String(i + 1), p.name || '', p.category || '—', String(p.buy_price ?? ''), String(p.sell_price ?? ''), String(p.stock_quantity ?? 0),
    ]);
  }

  function printDebts() {
    printLocal('debts', 'قائمة الديون', ['#', 'العضو', 'الدين', 'المدفوع', 'المتبقي'], (d, i) => [
      String(i + 1), d.member_name || '', String(d.total_debt ?? ''), String(d.paid_amount ?? ''), String(d.remaining ?? ''),
    ]);
  }

  function printExpenses() {
    printLocal('expenses', 'سجل المصاريف', ['#', 'الوصف', 'المبلغ', 'الفئة', 'التاريخ'], (e, i) => [
      String(i + 1), e.description || '', String(e.amount ?? ''), e.category || '', e.date ? String(e.date).slice(0, 10) : '—',
    ]);
  }

  function printInvoice() {
    if (!saleId) return alert('يرجى اختيار فاتورة!');
    api
      .get(`/api/sales/${saleId}`)
      .then((s) => {
        const dt = new Date(s.sale_date || Date.now());
        const dateStr = dt.toLocaleDateString('ar-MA') + ' - ' + dt.toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' });
        const itemsHtml = (s.items || [])
          .map(
            (it) =>
              `<tr style="border-bottom:1px solid #eee"><td style="padding:7px">${it.product_name || ''}</td><td style="padding:7px;text-align:center">${it.quantity} ${it.unit || ''}</td><td style="padding:7px;text-align:center">${it.unit_price} د.م</td><td style="padding:7px;text-align:left;font-weight:bold">${Number(it.total_price || 0).toFixed(2)} د.م</td></tr>`
          )
          .join('');
        const payLabel = s.payment_method === 'cash' ? 'نقداً' : 'آجل / بالدين';
        const content = `
          <div style="max-width:700px;margin:0 auto;font-family:Tahoma,Arial,sans-serif;direction:rtl">
            <div style="text-align:center;border-bottom:3px solid #0d5c4d;padding-bottom:12px;margin-bottom:16px">
              <h1 style="margin:0;color:#0d5c4d">فاتورة بيع</h1>
              <div style="color:#666">رقم الفاتورة: #${s.id}</div>
              <div style="color:#666">${dateStr}</div>
            </div>
            <p><strong>العضو / الزبون:</strong> ${s.member_name || s.member_id || '—'}</p>
            <p><strong>طريقة الدفع:</strong> ${payLabel}</p>
            <table style="width:100%;border-collapse:collapse;margin-top:12px">
              <thead>
                <tr style="background:#0d5c4d;color:#fff">
                  <th style="padding:8px;text-align:right">المنتج</th>
                  <th style="padding:8px">الكمية</th>
                  <th style="padding:8px">سعر الوحدة</th>
                  <th style="padding:8px">المجموع</th>
                </tr>
              </thead>
              <tbody>${itemsHtml || '<tr><td colspan="4" style="text-align:center;padding:12px">لا توجد بنود</td></tr>'}</tbody>
            </table>
            <div style="margin-top:16px;text-align:left;font-size:1.1em">
              <strong>الإجمالي: ${Number(s.total_amount || 0).toFixed(2)} د.م</strong>
            </div>
            <div style="margin-top:48px;display:flex;justify-content:space-between">
              <div style="text-align:center;min-width:140px;border-top:1px solid #333;padding-top:4px">التوقيع</div>
              <div style="text-align:center;min-width:140px;border-top:1px solid #333;padding-top:4px">الختم</div>
            </div>
          </div>`;
        const w = window.open('', '_blank', 'width=800,height=700');
        if (!w) return alert('يرجى السماح بالنوافذ المنبثقة');
        w.document.write(
          '<html lang="ar" dir="rtl"><head><title>فاتورة #' +
            s.id +
            '</title></head><body>' +
            content +
            '<script>window.onload=function(){window.print()}<\/script></body></html>'
        );
        w.document.close();
      })
      .catch((e) => alert('تعذّر تحميل الفاتورة: ' + e.message));
  }

  if (loading) return <Loading />;

  return (
    <div>
      <h4 style={{ marginBottom: 18, fontWeight: 'bold' }}>التصدير والطباعة</h4>

      <div className="wc" style={{ borderTop: '4px solid #0d5c4d', marginBottom: 20 }}>
        <h5 style={{ marginBottom: 14, color: '#0d5c4d' }}>طباعة PDF</h5>
        <p style={{ color: '#666', fontSize: '0.9em', marginBottom: 14 }}>
          اضغط على الزر ثم اختر «حفظ كـ PDF» من نافذة الطباعة في المتصفح.
        </p>
        <div className="row g-2">
          <div className="col-md-3"><button className="btn btn-sec w-100" onClick={printMembers}>قائمة الأعضاء</button></div>
          <div className="col-md-3"><button className="btn btn-sec w-100" onClick={printProducts}>المنتجات</button></div>
          <div className="col-md-3"><button className="btn btn-sec w-100" onClick={printDebts}>الديون</button></div>
          <div className="col-md-3"><button className="btn btn-sec w-100" onClick={printExpenses}>المصاريف</button></div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {EXPORTS.map((ex) => (
          <div className="col-md-3" key={ex.key}>
            <div className="wc" style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: '2em', marginBottom: 8 }}>{ex.icon}</div>
              <h6 style={{ marginBottom: 6 }}>{ex.title}</h6>
              <p style={{ color: '#888', fontSize: '0.85em', marginBottom: 12 }}>{ex.desc}</p>
              <button className="btn btn-p btn-sm" onClick={() => doExport(ex.key, ex.file)}>
                تصدير CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="wc" style={{ borderTop: '4px solid #4facfe' }}>
        <h5 style={{ marginBottom: 16, color: '#4facfe' }}>طباعة فاتورة بيع</h5>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="field">
              <label>اختر الفاتورة</label>
              <select className="select" value={saleId} onChange={(e) => setSaleId(e.target.value)}>
                {sales.length === 0 && <option value="">لا توجد مبيعات</option>}
                {sales.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} — {s.member_name || '—'} — {Number(s.total_amount || 0).toFixed(2)} د.م
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-3" style={{ paddingBottom: 12 }}>
            <button className="btn btn-p w-100" onClick={printInvoice}>
              طباعة الفاتورة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
