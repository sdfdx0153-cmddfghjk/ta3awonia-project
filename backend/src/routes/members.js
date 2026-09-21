const express = require('express');
const prisma = require('../lib/prisma');
const { serialize, toNum } = require('../utils/helpers');

const router = express.Router();

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function mapMember(m) {
  return {
    id: m.id,
    full_name: m.fullName,
    first_name: m.firstName,
    family_name: m.familyName,
    cin: m.cin,
    phone: m.phone,
    address: m.address,
    birth_date: m.birthDate,
    join_date: m.joinDate,
    share_amount: m.shareAmount,
    shares_count: m.sharesCount,
    payment_method: m.paymentMethod,
    notes: m.notes,
    is_active: m.isActive,
    created_at: m.createdAt,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(serialize(members.map(mapMember)));
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      full_name,
      first_name,
      family_name,
      cin,
      phone,
      address,
      birth_date,
      join_date,
      share_amount,
      shares_count,
      payment_method,
      notes,
    } = req.body || {};

    const name =
      full_name ||
      [first_name, family_name].filter(Boolean).join(' ').trim() ||
      null;
    if (!name || !cin) return res.status(400).json({ error: 'الاسم و CIN مطلوبين' });

    const exists = await prisma.member.findFirst({
      where: { userId: req.user.id, cin },
    });
    if (exists) return res.status(400).json({ error: 'هاد الـ CIN موجود من قبل' });

    const member = await prisma.member.create({
      data: {
        userId: req.user.id,
        fullName: name,
        firstName: first_name || null,
        familyName: family_name || null,
        cin,
        phone: phone || '',
        address: address || '',
        birthDate: parseDate(birth_date),
        joinDate: parseDate(join_date) || new Date(),
        shareAmount: toNum(share_amount),
        sharesCount: parseInt(shares_count, 10) || 0,
        paymentMethod: payment_method || null,
        notes: notes || null,
      },
    });
    return res.status(201).json(serialize(mapMember(member)));
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const {
      full_name,
      first_name,
      family_name,
      phone,
      address,
      birth_date,
      join_date,
      share_amount,
      shares_count,
      payment_method,
      notes,
      is_active,
    } = req.body || {};

    const member = await prisma.member.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!member) return res.status(404).json({ error: 'العضو ما لقيناهش' });

    const name =
      full_name ||
      [first_name, family_name].filter(Boolean).join(' ').trim() ||
      member.fullName;

    const updated = await prisma.member.update({
      where: { id },
      data: {
        fullName: name,
        firstName: first_name !== undefined ? first_name || null : member.firstName,
        familyName: family_name !== undefined ? family_name || null : member.familyName,
        phone: phone !== undefined ? phone : member.phone,
        address: address !== undefined ? address : member.address,
        birthDate: birth_date !== undefined ? parseDate(birth_date) : member.birthDate,
        joinDate: join_date !== undefined ? parseDate(join_date) || member.joinDate : member.joinDate,
        shareAmount: share_amount !== undefined ? toNum(share_amount) : member.shareAmount,
        sharesCount:
          shares_count !== undefined ? parseInt(shares_count, 10) || 0 : member.sharesCount,
        paymentMethod:
          payment_method !== undefined ? payment_method || null : member.paymentMethod,
        notes: notes !== undefined ? notes || null : member.notes,
        isActive: is_active !== undefined ? is_active : member.isActive,
      },
    });
    return res.json(serialize(mapMember(updated)));
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const member = await prisma.member.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!member) return res.status(404).json({ error: 'العضو ما لقيناهش' });

    await prisma.member.delete({ where: { id } });
    return res.json({ ok: true, message: 'تم حذف العضو نهائياً' });
  } catch (e) {
    if (e.code === 'P2003') {
      try {
        await prisma.member.update({
          where: { id: Number(req.params.id) },
          data: { isActive: false },
        });
        return res.json({
          ok: true,
          message: 'العضو مرتبط ببيانات أخرى — تم تعطيله بدل الحذف',
        });
      } catch (e2) {
        return next(e2);
      }
    }
    next(e);
  }
});

module.exports = router;
