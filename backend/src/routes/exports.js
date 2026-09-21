const express = require('express');
const prisma = require('../lib/prisma');
const { round } = require('../utils/helpers');

const router = express.Router();

function csv(headers, rows) {
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '\uFEFF' + [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
}

function sendCsv(res, filename, headers, rows) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csv(headers, rows));
}

router.get('/members', async (req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      where: { userId: req.user.id },
      orderBy: { id: 'asc' },
    });
    return sendCsv(res, 'members.csv',
      ['#', 'الاسم', 'CIN', 'الهاتف', 'العنوان', 'المساهمة', 'نشط'],
      members.map((m) => [m.id, m.fullName, m.cin, m.phone || '', m.address || '', round(m.shareAmount), m.isActive ? 'نعم' : 'لا'])
    );
  } catch (e) {
    next(e);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { userId: req.user.id },
      orderBy: { id: 'asc' },
    });
    return sendCsv(res, 'products.csv',
      ['#', 'المنتج', 'الفئة', 'الوحدة', 'ثمن الشراء', 'ثمن البيع', 'المخزون', 'الحد الأدنى'],
      products.map((p) => [p.id, p.name, p.category || '', p.unit, round(p.buyPrice), round(p.sellPrice), round(p.stockQuantity), round(p.minStock)])
    );
  } catch (e) {
    next(e);
  }
});

router.get('/sales', async (req, res, next) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { userId: req.user.id },
      orderBy: { id: 'asc' },
      include: { member: true },
    });
    return sendCsv(res, 'sales.csv',
      ['#', 'العضو', 'المبلغ', 'التخفيض', 'طريقة الدفع', 'التاريخ'],
      sales.map((s) => [s.id, s.member?.fullName || '', round(s.totalAmount), round(s.discount), s.paymentMethod, s.saleDate.toISOString()])
    );
  } catch (e) {
    next(e);
  }
});

router.get('/debts', async (req, res, next) => {
  try {
    const debts = await prisma.debt.findMany({
      where: { userId: req.user.id },
      orderBy: { id: 'asc' },
      include: { member: true },
    });
    return sendCsv(res, 'debts.csv',
      ['#', 'العضو', 'الدين الكلي', 'المخلص', 'الباقي', 'مسوي'],
      debts.map((d) => [d.id, d.member?.fullName || '', round(d.totalDebt), round(d.paidAmount), round(d.remaining), d.isSettled ? 'نعم' : 'لا'])
    );
  } catch (e) {
    next(e);
  }
});

module.exports = router;
