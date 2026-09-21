const express = require('express');
const prisma = require('../lib/prisma');
const { serialize } = require('../utils/helpers');
const router = express.Router();

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function map(m) {
  return {
    id: m.id,
    number: m.number,
    title: m.title,
    date: m.date,
    status: m.status,
    notes: m.notes,
    created_at: m.createdAt,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const list = await prisma.decision.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });
    res.json(serialize(list.map(map)));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { number, title, date, status, notes } = req.body || {};
    if (!title || !date) return res.status(400).json({ error: 'العنوان والتاريخ مطلوبين' });
    const created = await prisma.decision.create({
      data: {
        userId: req.user.id,
        number: number || null,
        title: String(title).trim(),
        date: parseDate(date),
        status: status || 'approved',
        notes: notes || null,
      },
    });
    res.status(201).json(serialize(map(created)));
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.decision.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'ما لقيناهش' });
    await prisma.decision.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
