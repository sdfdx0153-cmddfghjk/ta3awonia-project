const express = require('express');
const prisma = require('../lib/prisma');
const { serialize, round, toNum } = require('../utils/helpers');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.user.id },
      orderBy: { expenseDate: 'desc' },
    });
    const items = expenses.map((e) => ({
      id: e.id,
      description: e.description,
      amount: round(e.amount),
      category: e.category,
      date: e.expenseDate,
    }));

    const byCategory = {};
    for (const e of items) {
      const cat = e.category || 'أخرى';
      byCategory[cat] = round((byCategory[cat] || 0) + e.amount);
    }

    return res.json({
      items: serialize(items),
      total: round(items.reduce((s, x) => s + x.amount, 0)),
      by_category: byCategory,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { description, amount, category, date, notes } = req.body || {};
    if (!description || !amount || toNum(amount) <= 0) {
      return res.status(400).json({ error: 'دخل الوصف والمبلغ' });
    }

    const expense = await prisma.expense.create({
      data: {
        userId: req.user.id,
        description,
        amount: toNum(amount),
        category: category || 'أخرى',
        notes: notes || '',
        expenseDate: date ? new Date(date) : new Date(),
      },
    });
    return res.status(201).json(
      serialize({
        id: expense.id,
        description: expense.description,
        amount: round(expense.amount),
        category: expense.category,
        date: expense.expenseDate,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const expense = await prisma.expense.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!expense) return res.status(404).json({ error: 'المصروف ما لقيناهش' });

    await prisma.expense.delete({ where: { id } });
    return res.json({ message: 'المصروف تمسح' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
