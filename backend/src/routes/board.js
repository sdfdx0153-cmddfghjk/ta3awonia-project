const express = require('express');
const prisma = require('../lib/prisma');
const { serialize } = require('../utils/helpers');

const router = express.Router();

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function addYears(date, years) {
  if (!date) return null;
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + (years || 0));
  return d;
}

function mapBoard(b) {
  return {
    id: b.id,
    member_id: b.memberId,
    position: b.position,
    appointment_date: b.appointmentDate,
    term_years: b.termYears,
    term_end_date: b.termEndDate,
    is_active: b.isActive,
    notes: b.notes,
    full_name: b.member?.fullName || '',
    phone: b.member?.phone || '',
    cin: b.member?.cin || '',
    created_at: b.createdAt,
  };
}

// قائمة أعضاء مجلس الإدارة
router.get('/', async (req, res, next) => {
  try {
    const list = await prisma.boardMember.findMany({
      where: { userId: req.user.id },
      include: { member: true },
      orderBy: { appointmentDate: 'desc' },
    });
    return res.json(serialize(list.map(mapBoard)));
  } catch (e) {
    next(e);
  }
});

// إضافة عضو مجلس إدارة (من الأعضاء الموجودين)
router.post('/', async (req, res, next) => {
  try {
    const { member_id, position, appointment_date, term_years, notes } = req.body || {};

    if (!member_id || !position || !appointment_date) {
      return res.status(400).json({ error: 'العضوة والصفة وتاريخ التعيين مطلوبين' });
    }

    const member = await prisma.member.findFirst({
      where: { id: Number(member_id), userId: req.user.id },
    });
    if (!member) return res.status(404).json({ error: 'العضو ما لقيناهش فسجل الأعضاء' });

    const exists = await prisma.boardMember.findFirst({
      where: { userId: req.user.id, memberId: Number(member_id) },
    });
    if (exists) return res.status(400).json({ error: 'هاد العضو ديجا فمجلس الإدارة' });

    const years = parseInt(term_years, 10) || 3;
    const appDate = parseDate(appointment_date);
    const endDate = addYears(appDate, years);

    const created = await prisma.boardMember.create({
      data: {
        userId: req.user.id,
        memberId: Number(member_id),
        position: String(position).trim(),
        appointmentDate: appDate,
        termYears: years,
        termEndDate: endDate,
        notes: notes || null,
        isActive: true,
      },
      include: { member: true },
    });

    return res.status(201).json(serialize(mapBoard(created)));
  } catch (e) {
    next(e);
  }
});

// تعديل
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { position, appointment_date, term_years, is_active, notes } = req.body || {};

    const existing = await prisma.boardMember.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'ما لقيناهش' });

    const years = term_years !== undefined ? parseInt(term_years, 10) || 3 : existing.termYears;
    const appDate =
      appointment_date !== undefined ? parseDate(appointment_date) : existing.appointmentDate;
    const endDate = addYears(appDate, years);

    const updated = await prisma.boardMember.update({
      where: { id },
      data: {
        position: position !== undefined ? String(position).trim() : existing.position,
        appointmentDate: appDate,
        termYears: years,
        termEndDate: endDate,
        isActive: is_active !== undefined ? Boolean(is_active) : existing.isActive,
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: { member: true },
    });

    return res.json(serialize(mapBoard(updated)));
  } catch (e) {
    next(e);
  }
});

// حذف
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.boardMember.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'ما لقيناهش' });

    await prisma.boardMember.delete({ where: { id } });
    return res.json({ ok: true, message: 'تم الحذف' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
