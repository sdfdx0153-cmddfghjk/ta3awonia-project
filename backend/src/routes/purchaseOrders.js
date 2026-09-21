const express = require('express');
const prisma = require('../lib/prisma');
const { serialize, round, toNum } = require('../utils/helpers');

const router = express.Router();

function serializeOrder(o) {
  return {
    ...serialize(o),
    supplier_name: o.supplier?.name || '',
    supplier_phone: o.supplier?.phone || '',
    items: (o.items || []).map((i) => ({
      id: i.id,
      product_id: i.productId,
      product_name: i.product?.name || '',
      unit: i.product?.unit || '',
      quantity: round(i.quantity),
      unit_price: round(i.unitPrice),
      total_price: round(i.totalPrice),
    })),
  };
}

router.get('/', async (req, res, next) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      where: { userId: req.user.id },
      orderBy: { orderDate: 'desc' },
      include: { supplier: true, items: { include: { product: true } } },
    });
    return res.json(serialize(orders.map(serializeOrder)));
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { supplier_id, notes, items } = req.body || {};

    const supplier = await prisma.supplier.findFirst({
      where: { id: Number(supplier_id), userId: req.user.id },
    });
    if (!supplier) return res.status(400).json({ error: 'اختار مورد صالح' });

    const itemsIn = items || [];
    if (!itemsIn.length) return res.status(400).json({ error: 'زيد منتجات للأمر' });

    // تأكد أن المنتجات تابعة للمستخدم
    const productIds = itemsIn.map((i) => Number(i.product_id));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, userId: req.user.id },
    });
    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'منتج غير صالح' });
    }

    let total = 0;
    const orderItems = itemsIn.map((it) => {
      const qty = toNum(it.quantity);
      const price = toNum(it.unit_price);
      const line = round(qty * price);
      total += line;
      return { productId: Number(it.product_id), quantity: qty, unitPrice: price, totalPrice: line };
    });

    const order = await prisma.purchaseOrder.create({
      data: {
        userId: req.user.id,
        supplierId: Number(supplier_id),
        notes: notes || '',
        status: 'pending',
        totalAmount: round(total),
        items: { create: orderItems },
      },
      include: { supplier: true, items: { include: { product: true } } },
    });
    return res.status(201).json(serialize(serializeOrder(order)));
  } catch (e) {
    next(e);
  }
});

// استلام الطلبية -> تزاد للمخزون
router.post('/:id/receive', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const order = await prisma.purchaseOrder.findFirst({
      where: { id, userId: req.user.id },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ error: 'الأمر ما لقيناهش' });
    if (order.status === 'received') return res.status(400).json({ error: 'الأمر ديجا توفق' });

    const result = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, userId: req.user.id },
        });
        if (product) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: round(Number(product.stockQuantity) + Number(item.quantity)) },
          });
        }
      }
      return tx.purchaseOrder.update({
        where: { id },
        data: { status: 'received', receivedDate: new Date() },
        include: { supplier: true, items: { include: { product: true } } },
      });
    });

    return res.json({ ...serialize(serializeOrder(result)), message: 'تستلم الطلبية والمخزون تزاد' });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/cancel', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const order = await prisma.purchaseOrder.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!order) return res.status(404).json({ error: 'الأمر ما لقيناهش' });

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'cancelled' },
      include: { supplier: true, items: { include: { product: true } } },
    });
    return res.json(serialize(serializeOrder(updated)));
  } catch (e) {
    next(e);
  }
});

module.exports = router;
