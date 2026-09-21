const express = require('express');
const prisma = require('../lib/prisma');
const { serialize } = require('../utils/helpers');

const router = express.Router();

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function mapA(a) {
  return {
    id: a.id,
    type: a.type,
    date: a.date,
    place: a.place,
    attendees: a.attendees,
    agenda: a.agenda,
    decisions: a.decisions,
    notes: a.notes,
    created_at: a.createdAt,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const list = await prisma.assembly.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });
    return res.json(serialize(list.map(mapA)));
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { type, date, place, attendees, agenda, decisions, notes } = req.body || {};
    if (!date) return res.status(400).json({ error: 'التاريخ مطلوب' });

    const created = await prisma.assembly.create({
      data: {
        userId: req.user.id,
        type: type || 'ordinary',
        date: parseDate(date),
        place: place || null,
        attendees: parseInt(attendees, 10) || 0,
        agenda: agenda || null,
        decisions: decisions || null,
        notes: notes || null,
      },
    });
    return res.status(201).json(serialize(mapA(created)));
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.assembly.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'ما لقيناهش' });

    const { type, date, place, attendees, agenda, decisions, notes } = req.body || {};
    const updated = await prisma.assembly.update({
      where: { id },
      data: {
        type: type ?? existing.type,
        date: date !== undefined ? parseDate(date) : existing.date,
        place: place !== undefined ? place : existing.place,
        attendees: attendees !== undefined ? parseInt(attendees, 10) || 0 : existing.attendees,
        agenda: agenda !== undefined ? agenda : existing.agenda,
        decisions: decisions !== undefined ? decisions : existing.decisions,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });
    return res.json(serialize(mapA(updated)));
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.assembly.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'ما لقيناهش' });
    await prisma.assembly.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
