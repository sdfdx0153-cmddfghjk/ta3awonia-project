const express = require('express');
const prisma = require('../lib/prisma');
const { serialize, round } = require('../utils/helpers');

const router = express.Router();

const DAY_NAMES = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

router.get('/sales-last-7-days', async (req, res, next) => {
  try {
    const uid = req.user.id;
    const results = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const agg = await prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: { userId: uid, saleDate: { gte: start, lt: end } },
      });

      results.push({
        date: start.toISOString().slice(0, 10),
        day_name: DAY_NAMES[start.getDay()],
        total: round(agg._sum.totalAmount),
      });
    }
    return res.json(serialize(results));
  } catch (e) {
    next(e);
  }
});

router.get('/products-by-category', async (req, res, next) => {
  try {
    const uid = req.user.id;
    const products = await prisma.product.findMany({
      where: { userId: uid },
      select: { id: true, category: true, stockQuantity: true, sellPrice: true },
    });
    const byCat = new Map();
    for (const p of products) {
      const key = p.category || 'بدون فئة';
      if (!byCat.has(key)) byCat.set(key, { count: 0, value: 0 });
      const cur = byCat.get(key);
      cur.count += 1;
      cur.value += Number(p.stockQuantity) * Number(p.sellPrice);
    }

    return res.json(
      serialize(
        Array.from(byCat.entries()).map(([category, v]) => ({
          category,
          count: v.count,
          value: round(v.value),
        }))
      )
    );
  } catch (e) {
    next(e);
  }
});

router.get('/member/:memberId', async (req, res, next) => {
  try {
    const memberId = Number(req.params.memberId);
    const member = await prisma.member.findFirst({
      where: { id: memberId, userId: req.user.id },
    });
    if (!member) return res.status(404).json({ error: 'العضو ما لقيناهش' });

    const [sales, debts, contributions] = await Promise.all([
      prisma.sale.findMany({
        where: { memberId, userId: req.user.id },
        orderBy: { saleDate: 'desc' },
        include: { items: true },
      }),
      prisma.debt.findMany({ where: { memberId, userId: req.user.id } }),
      prisma.contribution.findMany({ where: { memberId, userId: req.user.id } }),
    ]);

    const totalPurchases = round(sales.reduce((s, x) => s + Number(x.totalAmount), 0));
    const outstanding = round(
      debts.filter((d) => !d.isSettled).reduce((s, d) => s + Number(d.remaining), 0)
    );
    const totalContributions = round(contributions.reduce((s, c) => s + Number(c.amount), 0));

    return res.json(
      serialize({
        member: { ...member, isActive: member.isActive },
        total_purchases: totalPurchases,
        total_debts: outstanding,
        total_contributions: totalContributions,
        total_transactions: sales.length,
        outstanding_debts: outstanding,
        sales_count: sales.length,
        recent_sales: sales.slice(0, 10).map((s) => ({
          id: s.id,
          sale_date: s.saleDate,
          total_amount: round(s.totalAmount),
          payment_method: s.paymentMethod,
        })),
      })
    );
  } catch (e) {
    next(e);
  }
});

module.exports = router;
