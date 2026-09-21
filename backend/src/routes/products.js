const express = require('express');
const prisma = require('../lib/prisma');
const { serialize, round, toNum } = require('../utils/helpers');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { userId: req.user.id },
      orderBy: { name: 'asc' },
    });
    return res.json(
      serialize(
        products.map((p) => ({
          ...p,
          low_stock: p.stockQuantity <= p.minStock,
        }))
      )
    );
  } catch (e) {
    next(e);
  }
});

router.get('/low-stock', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        userId: req.user.id,
        stockQuantity: { lte: prisma.product.fields.minStock },
      },
      orderBy: { stockQuantity: 'asc' },
    });
    return res.json(serialize(products));
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description, category, unit, buy_price, sell_price, stock_quantity, min_stock } =
      req.body || {};
    if (!name || buy_price === undefined || sell_price === undefined) {
      return res.status(400).json({ error: 'الاسم وثمن الشراء والبيع مطلوبين' });
    }

    const product = await prisma.product.create({
      data: {
        userId: req.user.id,
        name,
        description: description || '',
        category: category || '',
        unit: unit || 'قطعة',
        buyPrice: toNum(buy_price),
        sellPrice: toNum(sell_price),
        stockQuantity: toNum(stock_quantity),
        minStock: toNum(min_stock || 5),
      },
    });
    return res.status(201).json(serialize(product));
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, category, buy_price, sell_price, min_stock, description, unit } = req.body || {};

    const product = await prisma.product.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!product) return res.status(404).json({ error: 'المنتج ما لقيناهش' });

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name ?? product.name,
        category: category ?? product.category,
        description: description ?? product.description,
        unit: unit ?? product.unit,
        buyPrice: buy_price !== undefined ? toNum(buy_price) : product.buyPrice,
        sellPrice: sell_price !== undefined ? toNum(sell_price) : product.sellPrice,
        minStock: min_stock !== undefined ? toNum(min_stock) : product.minStock,
      },
    });
    return res.json(serialize(updated));
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!product) return res.status(404).json({ error: 'المنتج ما لقيناهش' });

    await prisma.product.delete({ where: { id } });
    return res.json({ message: 'المنتج تمسح' });
  } catch (e) {
    next(e);
  }
});

// تجديد المخزون
router.post('/:id/restock', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { quantity, new_buy_price } = req.body || {};

    const product = await prisma.product.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!product) return res.status(404).json({ error: 'المنتج ما لقيناهش' });
    if (!quantity || toNum(quantity) <= 0) {
      return res.status(400).json({ error: 'دخل الكمية' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        stockQuantity: round(Number(product.stockQuantity) + toNum(quantity)),
        buyPrice: new_buy_price !== undefined && toNum(new_buy_price) > 0 ? toNum(new_buy_price) : product.buyPrice,
      },
    });
    return res.json(serialize({ ...updated, new_stock: round(updated.stockQuantity) }));
  } catch (e) {
    next(e);
  }
});

module.exports = router;
