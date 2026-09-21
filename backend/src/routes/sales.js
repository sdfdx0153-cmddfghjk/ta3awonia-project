const express = require('express');
const prisma = require('../lib/prisma');
const { serialize, round, toNum } = require('../utils/helpers');

const router = express.Router();

function serializeSale(s) {
  return {
    ...serialize(s),
    member_name: s.member?.fullName || '',
    member_phone: s.member?.phone || '',
    items: (s.items || []).map((i) => ({
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
    const limit = Number(req.query.limit) || 50;
    const sales = await prisma.sale.findMany({
      where: { userId: req.user.id },
      orderBy: { saleDate: 'desc' },
      take: limit,
      include: { member: true, items: { include: { product: true } } },
    });
    return res.json(serialize(sales.map(serializeSale)));
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const sale = await prisma.sale.findFirst({
      where: { id, userId: req.user.id },
      include: { member: true, items: { include: { product: true } } },
    });
    if (!sale) return res.status(404).json({ error: 'البيع ما لقيناهش' });
    return res.json(serialize(serializeSale(sale)));
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { member_id, payment_method, discount, notes, items } = req.body || {};

    const member = await prisma.member.findFirst({
      where: { id: Number(member_id), userId: req.user.id },
    });
    if (!member) return res.status(400).json({ error: 'اختار عضو صالح' });

    const method = payment_method === 'credit' ? 'credit' : 'cash';
    const disc = toNum(discount);

    const itemsIn = items || [];
    if (!itemsIn.length) return res.status(400).json({ error: 'زيد منتجات للبيع' });

    const productIds = itemsIn.map((i) => Number(i.product_id));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, userId: req.user.id },
    });
    const prodMap = new Map(products.map((p) => [p.id, p]));

    for (const it of itemsIn) {
      const p = prodMap.get(Number(it.product_id));
      if (!p) return res.status(400).json({ error: 'منتج غير صالح' });
      if (Number(p.stockQuantity) < toNum(it.quantity)) {
        return res.status(400).json({ error: `المخزون ما كافيش لـ ${p.name}` });
      }
    }

    let total = 0;
    const saleItemsData = itemsIn.map((it) => {
      const p = prodMap.get(Number(it.product_id));
      const qty = toNum(it.quantity);
      const line = round(qty * Number(p.sellPrice));
      total += line;
      return {
        productId: p.id,
        quantity: qty,
        unitPrice: p.sellPrice,
        buyPrice: p.buyPrice,
        totalPrice: line,
      };
    });

    const totalAmount = round(total - disc);

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          userId: req.user.id,
          memberId: Number(member_id),
          paymentMethod: method,
          discount: disc,
          notes: notes || '',
          isPaid: method === 'cash',
          totalAmount,
          items: { create: saleItemsData },
        },
        include: { items: true },
      });

      for (const it of saleItemsData) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stockQuantity: round(Number(prodMap.get(it.productId).stockQuantity) - it.quantity) },
        });
      }

      if (method === 'credit') {
        await tx.debt.create({
          data: {
            userId: req.user.id,
            memberId: Number(member_id),
            saleId: sale.id,
            totalDebt: totalAmount,
            paidAmount: 0,
            remaining: totalAmount,
            isSettled: false,
          },
        });
      }

      return sale;
    });

    const sale = await prisma.sale.findUnique({
      where: { id: result.id },
      include: { member: true, items: { include: { product: true } } },
    });
    return res.status(201).json(serialize(serializeSale(sale)));
  } catch (e) {
    next(e);
  }
});

module.exports = router;
