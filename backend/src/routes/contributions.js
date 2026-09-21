const express = require('express');
const prisma = require('../lib/prisma');
const { serialize, round, toNum } = require('../utils/helpers');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const contributions = await prisma.contribution.findMany({
      where: { userId: req.user.id },
      orderBy: { contributionDate: 'desc' },
      include: { member: true },
    });
    const items = contributions.map((c) => ({
      id: c.id,
      member_id: c.memberId,
      member_name: c.member?.fullName || '',
      amount: round(c.amount),
      date: c.contributionDate,
      type: c.type,
      notes: c.notes,
    }));
    const total = items.reduce((s, c) => s + c.amount, 0);
    return res.json({
      items: serialize(items),
      total: round(total),
      count: items.length,
      average: items.length ? round(total / items.length) : 0,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { member_id, amount, type, notes, date } = req.body || {};
    if (!member_id || !amount || toNum(amount) <= 0) {
      return res.status(400).json({ error: 'اختار العضو ودخل المبلغ' });
    }

    const member = await prisma.member.findFirst({
      where: { id: Number(member_id), userId: req.user.id },
    });
    if (!member) return res.status(400).json({ error: 'العضو ما لقيناهش' });

    const contribution = await prisma.contribution.create({
      data: {
        userId: req.user.id,
        memberId: Number(member_id),
        amount: toNum(amount),
        type: type || 'monthly',
        notes: notes || '',
        contributionDate: date ? new Date(date) : new Date(),
      },
      include: { member: true },
    });

    return res.status(201).json(
      serialize({
        id: contribution.id,
        member_id: contribution.memberId,
        member_name: contribution.member?.fullName || '',
        amount: round(contribution.amount),
        date: contribution.contributionDate,
        type: contribution.type,
        notes: contribution.notes,
      })
    );
  } catch (e) {
    next(e);
  }
});

module.exports = router;
