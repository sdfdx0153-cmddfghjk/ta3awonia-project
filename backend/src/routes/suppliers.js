const express = require('express');
const prisma = require('../lib/prisma');
const { serialize, round } = require('../utils/helpers');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { userId: req.user.id, isActive: true },
      include: { orders: true },
    });
    return res.json(
      serialize(
        suppliers.map((s) => ({
          ...s,
          total_orders: s.orders.length,
          total_amount: round(s.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0)),
        }))
      )
    );
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, phone, address, category, email, notes } = req.body || {};
    if (!name) return res.status(400).json({ error: 'دخل اسم المورد' });

    const supplier = await prisma.supplier.create({
      data: {
        userId: req.user.id,
        name,
        phone: phone || '',
        address: address || '',
        category: category || '',
        email: email || '',
        notes: notes || '',
      },
    });
    return res.status(201).json(serialize({ ...supplier, total_orders: 0, total_amount: 0 }));
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, phone, address, category, email, notes } = req.body || {};

    const supplier = await prisma.supplier.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!supplier) return res.status(404).json({ error: 'المورد ما لقيناهش' });

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name: name ?? supplier.name,
        phone: phone ?? supplier.phone,
        address: address ?? supplier.address,
        category: category ?? supplier.category,
        email: email ?? supplier.email,
        notes: notes ?? supplier.notes,
      },
      include: { orders: true },
    });
    return res.json(
      serialize({
        ...updated,
        total_orders: updated.orders.length,
        total_amount: round(updated.orders.reduce((s, o) => s + Number(o.totalAmount), 0)),
      })
    );
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const supplier = await prisma.supplier.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!supplier) return res.status(404).json({ error: 'المورد ما لقيناهش' });

    await prisma.supplier.update({ where: { id }, data: { isActive: false } });
    return res.json({ message: 'المورد تعطّل' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
