const express = require('express');
const prisma = require('../lib/prisma');
const { serialize, round, toNum } = require('../utils/helpers');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const showAll = req.query.all === 'true';
    const debts = await prisma.debt.findMany({
      where: {
        userId: req.user.id,
        ...(showAll ? {} : { isSettled: false }),
      },
      orderBy: { createdAt: 'desc' },
      include: { member: true },
    });
    return res.json(
      serialize(
        debts.map((d) => ({
          ...d,
          member_name: d.member?.fullName || '',
          total_debt: round(d.totalDebt),
          paid_amount: round(d.paidAmount),
          remaining: round(d.remaining),
        }))
      )
    );
  } catch (e) {
    next(e);
  }
});

router.post('/:id/pay', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const amount = toNum(req.body?.amount);

    const debt = await prisma.debt.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!debt) return res.status(404).json({ error: 'الدين ما لقيناهش' });
    if (amount <= 0) return res.status(400).json({ error: 'دخل المبلغ' });
    if (amount > Number(debt.remaining)) {
      return res.status(400).json({ error: 'المبلغ أكبر من الباقي' });
    }

    const newPaid = round(Number(debt.paidAmount) + amount);
    const newRemaining = round(Number(debt.remaining) - amount);

    const updated = await prisma.debt.update({
      where: { id },
      data: {
        paidAmount: newPaid,
        remaining: newRemaining <= 0 ? 0 : newRemaining,
        isSettled: newRemaining <= 0,
      },
    });

    const withMember = await prisma.debt.findUnique({
      where: { id },
      include: { member: true },
    });

    return res.json(
      serialize({
        ...withMember,
        member_name: withMember.member?.fullName || '',
        message:
          newRemaining <= 0
            ? 'تسدّد الدين كامل'
            : `تخلص ${round(amount)} د.م`,
      })
    );
  } catch (e) {
    next(e);
  }
});

module.exports = router;
