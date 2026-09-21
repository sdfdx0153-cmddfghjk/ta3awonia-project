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
    title: m.title,
    date: m.date,
    secretary: m.secretary,
    summary: m.summary,
    decisions: m.decisions,
    created_at: m.createdAt,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const list = await prisma.minute.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });
    res.json(serialize(list.map(map)));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, date, secretary, summary, decisions } = req.body || {};
    if (!title || !date) return res.status(400).json({ error: 'العنوان والتاريخ مطلوبين' });
    const created = await prisma.minute.create({
      data: {
        userId: req.user.id,
        title: String(title).trim(),
        date: parseDate(date),
        secretary: secretary || null,
        summary: summary || null,
        decisions: decisions || null,
      },
    });
    res.status(201).json(serialize(map(created)));
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.minute.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'ما لقيناهش' });
    const { title, date, secretary, summary, decisions } = req.body || {};
    const updated = await prisma.minute.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : existing.title,
        date: date !== undefined ? parseDate(date) : existing.date,
        secretary: secretary !== undefined ? secretary : existing.secretary,
        summary: summary !== undefined ? summary : existing.summary,
        decisions: decisions !== undefined ? decisions : existing.decisions,
      },
    });
    res.json(serialize(map(updated)));
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.minute.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'ما لقيناهش' });
    await prisma.minute.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
