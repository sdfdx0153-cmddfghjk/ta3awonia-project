const express = require('express');
const prisma = require('../lib/prisma');
const { serialize, round, monthStart } = require('../utils/helpers');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const uid = req.user.id;
    const ms = monthStart();

    const [
      totalSalesAgg,
      totalContribAgg,
      totalExpensesAgg,
      inventoryAgg,
      debtsAgg,
      sharesAgg,
      monthSalesAgg,
      monthExpensesAgg,
      saleItems,
    ] = await Promise.all([
      prisma.sale.aggregate({ _sum: { totalAmount: true }, where: { userId: uid } }),
      prisma.contribution.aggregate({ _sum: { amount: true }, where: { userId: uid } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { userId: uid } }),
      prisma.product.aggregate({
        _sum: { stockQuantity: true, buyPrice: true },
        where: { userId: uid },
      }),
      prisma.debt.aggregate({
        _sum: { remaining: true },
        where: { userId: uid, isSettled: false },
      }),
      prisma.member.aggregate({
        _sum: { shareAmount: true },
        where: { userId: uid, isActive: true },
      }),
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: { userId: uid, saleDate: { gte: ms } },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { userId: uid, expenseDate: { gte: ms } },
      }),
      prisma.saleItem.findMany({
        where: { sale: { userId: uid } },
        select: { buyPrice: true, quantity: true },
      }),
    ]);

    const totalSales = round(totalSalesAgg._sum.totalAmount);
    const totalContributions = round(totalContribAgg._sum.amount);
    const totalExpenses = round(totalExpensesAgg._sum.amount);

    let cogs = 0;
    for (const it of saleItems) {
      cogs += Number(it.buyPrice || 0) * Number(it.quantity || 0);
    }
    cogs = round(cogs);

    const grossProfit = round(totalSales - cogs);
    const netProfit = round(grossProfit - totalExpenses);
    const inventoryValue = round(
      Number(inventoryAgg._sum.stockQuantity || 0) * Number(inventoryAgg._sum.buyPrice || 0)
    );
    const totalDebts = round(debtsAgg._sum.remaining);
    const totalShares = round(sharesAgg._sum.shareAmount);

    const grossMargin = totalSales > 0 ? round((grossProfit / totalSales) * 100, 1) : 0;
    const expenseRatio = totalSales > 0 ? round((totalExpenses / totalSales) * 100, 1) : 0;

    const totalAssets = round(inventoryValue + totalDebts + totalShares);
    const netAssets = round(totalAssets - totalExpenses);

    return res.json(
      serialize({
        total_sales: totalSales,
        total_cogs: cogs,
        total_contributions: totalContributions,
        total_expenses: totalExpenses,
        gross_profit: grossProfit,
        net_profit: netProfit,
        profit_margin: grossMargin,
        stock_value: inventoryValue,
        total_debts: totalDebts,
        total_shares: totalShares,
        total_assets: totalAssets,
        net_assets: netAssets,
        month_sales: round(monthSalesAgg._sum.totalAmount),
        month_expenses: round(monthExpensesAgg._sum.amount),
        indicators: {
          gross_margin: grossMargin,
          expense_ratio: expenseRatio,
          debt_collection: 0,
        },
        revenue: { total_sales: totalSales, total_contributions: totalContributions },
        costs: { cogs, expenses: totalExpenses },
        profits: { gross_profit: grossProfit, net_profit: netProfit },
        balance: {
          inventory_value: inventoryValue,
          debts: totalDebts,
          shares: totalShares,
          total_assets: totalAssets,
          total_liabilities: totalExpenses,
          net_assets: netAssets,
        },
        month: {
          sales: round(monthSalesAgg._sum.totalAmount),
          expenses: round(monthExpensesAgg._sum.amount),
          inventory_value: inventoryValue,
          pending_debts: totalDebts,
        },
      })
    );
  } catch (e) {
    next(e);
  }
});

module.exports = router;
