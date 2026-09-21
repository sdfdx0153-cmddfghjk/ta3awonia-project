const express = require('express');
const prisma = require('../lib/prisma');
const { serialize, round, todayDate, monthStart } = require('../utils/helpers');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const uid = req.user.id;
    const today = todayDate();
    const ms = monthStart();

    const totalMembers = await prisma.member.count({ where: { userId: uid, isActive: true } });
    const totalProducts = await prisma.product.count({ where: { userId: uid } });

    const [salesToday, salesMonth, totalDebts, totalContributions] = await Promise.all([
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: { userId: uid, saleDate: { gte: today } },
      }),
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: { userId: uid, saleDate: { gte: ms } },
      }),
      prisma.debt.aggregate({
        _sum: { remaining: true },
        where: { userId: uid, isSettled: false },
      }),
      prisma.contribution.aggregate({
        _sum: { amount: true },
        where: { userId: uid },
      }),
    ]);

    const lowStockCount = await prisma.product.count({
      where: {
        userId: uid,
        stockQuantity: { lte: prisma.product.fields.minStock },
      },
    });
    const pendingOrders = await prisma.purchaseOrder.count({
      where: { userId: uid, status: 'pending' },
    });

    const [totalSales, totalExpenses, saleItems] = await Promise.all([
      prisma.sale.aggregate({ _sum: { totalAmount: true }, where: { userId: uid } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { userId: uid } }),
      prisma.saleItem.findMany({
        where: { sale: { userId: uid } },
        select: { buyPrice: true, quantity: true },
      }),
    ]);

    const totalSalesNum = round(totalSales._sum.totalAmount);
    const totalExpensesNum = round(totalExpenses._sum.amount);
    let cogs = 0;
    for (const it of saleItems) {
      cogs += Number(it.buyPrice || 0) * Number(it.quantity || 0);
    }
    cogs = round(cogs);

    return res.json(serialize({
      total_members: totalMembers,
      total_products: totalProducts,
      sales_today: round(salesToday._sum.totalAmount),
      sales_month: round(salesMonth._sum.totalAmount),
      today_sales: round(salesToday._sum.totalAmount),
      month_sales: round(salesMonth._sum.totalAmount),
      total_debts: round(totalDebts._sum.remaining),
      total_contributions: round(totalContributions._sum.amount),
      low_stock: lowStockCount,
      low_stock_count: lowStockCount,
      pending_orders: pendingOrders,
      net_profit: round(totalSalesNum - cogs - totalExpensesNum),
    }));
  } catch (e) {
    next(e);
  }
});

router.get('/alerts', async (req, res, next) => {
  try {
    const uid = req.user.id;
    const alerts = [];

    const lowProducts = await prisma.product.findMany({
      where: {
        userId: uid,
        stockQuantity: { lte: prisma.product.fields.minStock },
      },
    });
    for (const p of lowProducts) {
      alerts.push({
        type: 'stock',
        level: 'danger',
        message: `⚠️ المخزون ناقص: ${p.name} (${p.stockQuantity} ${p.unit})`,
      });
    }

    const bigDebts = await prisma.debt.findMany({
      where: { userId: uid, isSettled: false, remaining: { gt: 500 } },
      include: { member: true },
    });
    for (const d of bigDebts) {
      alerts.push({
        type: 'debt',
        level: 'warning',
        message: `💳 دين كبير: ${d.member.fullName} - ${round(d.remaining)} د.م`,
      });
    }

    return res.json(serialize(alerts));
  } catch (e) {
    next(e);
  }
});

module.exports = router;
