const express = require('express');
const prisma = require('../lib/prisma');
const { serialize } = require('../utils/helpers');
const router = express.Router();

function map(m) {
  return {
    id: m.id,
    name: m.name,
    president: m.president,
    members: m.members,
    mission: m.mission,
    created_at: m.createdAt,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const list = await prisma.committee.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(serialize(list.map(map)));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, president, members, mission } = req.body || {};
    if (!name) return res.status(400).json({ error: 'اسم اللجنة مطلوب' });
    const created = await prisma.committee.create({
      data: {
        userId: req.user.id,
        name: String(name).trim(),
        president: president || null,
        members: members || null,
        mission: mission || null,
      },
    });
    res.status(201).json(serialize(map(created)));
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.committee.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'ما لقيناهش' });
    await prisma.committee.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
