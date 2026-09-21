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
    event: m.event,
    date: m.date,
    present: m.present,
    absent: m.absent,
    notes: m.notes,
    created_at: m.createdAt,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const list = await prisma.attendance.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });
    res.json(serialize(list.map(map)));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { event, date, present, absent, notes } = req.body || {};
    if (!event || !date) return res.status(400).json({ error: 'الحدث والتاريخ مطلوبين' });
    const created = await prisma.attendance.create({
      data: {
        userId: req.user.id,
        event: String(event).trim(),
        date: parseDate(date),
        present: present || null,
        absent: absent || null,
        notes: notes || null,
      },
    });
    res.status(201).json(serialize(map(created)));
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.attendance.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'ما لقيناهش' });
    await prisma.attendance.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
