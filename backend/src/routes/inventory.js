const express = require('express');
const prisma = require('../lib/prisma');
const { serialize, round, toNum } = require('../utils/helpers');

const router = express.Router();

router.get('/checks', async (req, res, next) => {
  try {
    const checks = await prisma.inventoryCheck.findMany({
      where: { userId: req.user.id },
      orderBy: { checkDate: 'desc' },
      include: { items: true },
    });
    return res.json(
      serialize(
        checks.map((c) => ({
          id: c.id,
          date: c.checkDate,
          notes: c.notes,
          items_count: c.items.length,
        }))
      )
    );
  } catch (e) {
    next(e);
  }
});

router.post('/check', async (req, res, next) => {
  try {
    const { notes, items } = req.body || {};

    const result = await prisma.$transaction(async (tx) => {
      const check = await tx.inventoryCheck.create({
        data: {
          userId: req.user.id,
          notes: notes || '',
        },
      });

      const checkItems = [];
      for (const it of items || []) {
        const product = await tx.product.findFirst({
          where: { id: Number(it.product_id), userId: req.user.id },
        });
        if (!product) continue;

        const expected = Number(product.stockQuantity);
        const actual = toNum(it.actual_quantity);
        const difference = round(actual - expected);

        checkItems.push({
          checkId: check.id,
          productId: product.id,
          expectedQuantity: expected,
          actualQuantity: actual,
          difference,
        });

        await tx.product.update({ where: { id: product.id }, data: { stockQuantity: actual } });
      }

      if (checkItems.length) {
        await tx.inventoryCheckItem.createMany({ data: checkItems });
      }

      return tx.inventoryCheck.findUnique({ where: { id: check.id }, include: { items: true } });
    });

    return res.status(201).json(
      serialize({
        ...result,
        message: 'تسجّل الجرد وتحدّث المخزون',
        items_count: result.items.length,
      })
    );
  } catch (e) {
    next(e);
  }
});

module.exports = router;
