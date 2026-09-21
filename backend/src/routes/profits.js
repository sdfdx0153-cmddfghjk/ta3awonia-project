const express = require('express');
const prisma = require('../lib/prisma');
const { serialize, round, toNum } = require('../utils/helpers');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const distributions = await prisma.profitDistribution.findMany({
      where: { userId: req.user.id },
      orderBy: { distributionDate: 'desc' },
      include: { shares: { include: { member: true } } },
    });
    return res.json(
      serialize(
        distributions.map((d) => ({
          id: d.id,
          date: d.distributionDate,
          total_profit: round(d.totalProfit),
          total_members: d.totalMembers,
          notes: d.notes,
          shares: d.shares.map((s) => ({
            id: s.id,
            member_id: s.memberId,
            member_name: s.member?.fullName || '',
            share_percent: round(s.sharePercent),
            profit_amount: round(s.profitAmount),
          })),
        }))
      )
    );
  } catch (e) {
    next(e);
  }
});

// حساب التوزيع حسب المساهمات
router.post('/calculate', async (req, res, next) => {
  try {
    const totalProfit = toNum(req.body?.total_profit);
    if (totalProfit <= 0) return res.status(400).json({ error: 'دخل المبلغ' });

    const members = await prisma.member.findMany({
      where: { userId: req.user.id, isActive: true },
    });
    const totalShares = members.reduce((s, m) => s + Number(m.shareAmount), 0);

    if (totalShares <= 0) return res.status(400).json({ error: 'ما كاينين مساهمات' });

    const shares = members.map((m) => {
      const percent = (Number(m.shareAmount) / totalShares) * 100;
      return {
        member_id: m.id,
        member_name: m.fullName,
        share_amount: round(m.shareAmount),
        share_percent: round(percent, 2),
        profit_amount: round((percent / 100) * totalProfit),
      };
    });

    return res.json(
      serialize({
        total_profit: round(totalProfit),
        members_count: members.length,
        total_shares: round(totalShares),
        shares,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { total_profit, notes, shares } = req.body || {};

    // تأكد أن الأعضاء تابعين للمستخدم
    const memberIds = (shares || []).map((s) => Number(s.member_id));
    if (memberIds.length) {
      const valid = await prisma.member.count({
        where: { id: { in: memberIds }, userId: req.user.id },
      });
      if (valid !== memberIds.length) {
        return res.status(400).json({ error: 'عضو غير صالح' });
      }
    }

    const distribution = await prisma.profitDistribution.create({
      data: {
        userId: req.user.id,
        totalProfit: toNum(total_profit),
        totalMembers: (shares || []).length,
        notes: notes || '',
        shares: {
          create: (shares || []).map((s) => ({
            memberId: Number(s.member_id),
            sharePercent: toNum(s.share_percent),
            profitAmount: toNum(s.profit_amount),
          })),
        },
      },
      include: { shares: { include: { member: true } } },
    });

    return res.status(201).json(
      serialize({
        id: distribution.id,
        date: distribution.distributionDate,
        total_profit: round(distribution.totalProfit),
        total_members: distribution.totalMembers,
        notes: distribution.notes,
        shares: distribution.shares.map((s) => ({
          id: s.id,
          member_id: s.memberId,
          member_name: s.member?.fullName || '',
          share_percent: round(s.sharePercent),
          profit_amount: round(s.profitAmount),
        })),
      })
    );
  } catch (e) {
    next(e);
  }
});

module.exports = router;
