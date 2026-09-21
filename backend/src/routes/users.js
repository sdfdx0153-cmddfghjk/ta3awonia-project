const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { serialize } = require('../utils/helpers');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
  const termEnd = u.termEndDate || null;
  const expired = termEnd ? Date.now() > new Date(termEnd).setHours(23, 59, 59, 999) : false;
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    full_name: u.fullName,
    role: u.role,
    is_active: u.isActive,
    phone: u.phone || null,
    board_position: u.boardPosition || null,
    appointment_date: u.appointmentDate || null,
    term_end_date: termEnd,
    created_at: u.createdAt,
    subscription_expired: expired,
  };
}

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/** يحسب تاريخ نهاية الاشتراك من عدد الأشهر */
function endFromMonths(months, fromDate) {
  const m = Number(months);
  if (![1, 6, 12].includes(m)) return null;
  const base = fromDate ? new Date(fromDate) : new Date();
  const end = new Date(base);
  end.setMonth(end.getMonth() + m);
  return end;
}

router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    // تحديث الحظر لمن انتهى اشتراكه
    const now = Date.now();
    for (const u of users) {
      if (u.termEndDate && now > new Date(u.termEndDate).setHours(23, 59, 59, 999) && u.isActive) {
        await prisma.user.update({ where: { id: u.id }, data: { isActive: false } });
        u.isActive = false;
      }
    }
    return res.json(serialize(users.map(publicUser)));
  } catch (e) {
    next(e);
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      full_name,
      role,
      phone,
      board_position,
      appointment_date,
      term_end_date,
      subscription_months,
    } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'اسم المستخدم وكلمة السر مطلوبين' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'كلمة السر خاصها تكون 6 حروف على الأقل' });
    }

    const exists = await prisma.user.findFirst({
      where: {
        OR: [{ username }, ...(email ? [{ email }] : [])],
      },
    });
    if (exists) {
      return res.status(400).json({ error: 'اسم المستخدم أو الإيميل موجود من قبل' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const backendRole =
      role === 'admin' || board_position === 'رئيسة' || board_position === 'president'
        ? 'admin'
        : role === 'user'
          ? 'user'
          : role || 'user';

    let termEnd = parseDate(term_end_date);
    if (!termEnd && subscription_months) {
      termEnd = endFromMonths(subscription_months);
    }

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: (email || `${username.trim()}@taawniya.local`).trim(),
        password: hashed,
        fullName: full_name || username.trim(),
        role: backendRole === 'admin' ? 'admin' : 'user',
        isActive: true,
        phone: phone || null,
        boardPosition: board_position || null,
        appointmentDate: parseDate(appointment_date) || new Date(),
        termEndDate: termEnd,
      },
    });

    return res.status(201).json(serialize(publicUser(user)));
  } catch (e) {
    next(e);
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const {
      username,
      email,
      password,
      full_name,
      role,
      phone,
      board_position,
      appointment_date,
      term_end_date,
      is_active,
      subscription_months,
    } = req.body || {};

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'المستخدم ما لقيناهش' });

    if (id === req.user.id && is_active === false) {
      return res.status(400).json({ error: 'ما تقدرش تعطّل حسابك أنت' });
    }

    const data = {};
    if (username !== undefined) data.username = username.trim();
    if (email !== undefined) data.email = email.trim();
    if (full_name !== undefined) data.fullName = full_name;
    if (phone !== undefined) data.phone = phone || null;
    if (board_position !== undefined) data.boardPosition = board_position || null;
    if (appointment_date !== undefined) data.appointmentDate = parseDate(appointment_date);
    if (is_active !== undefined) data.isActive = Boolean(is_active);

    if (subscription_months) {
      // تجديد من اليوم
      data.termEndDate = endFromMonths(subscription_months);
      if (data.isActive === undefined) data.isActive = true;
    } else if (term_end_date !== undefined) {
      data.termEndDate = parseDate(term_end_date);
    }

    if (role !== undefined || board_position !== undefined) {
      const pos = board_position !== undefined ? board_position : existing.boardPosition;
      const r = role !== undefined ? role : existing.role;
      data.role =
        r === 'admin' || pos === 'رئيسة' || pos === 'president' ? 'admin' : 'user';
    }

    if (password && password.length >= 6) {
      data.password = await bcrypt.hash(password, 10);
    }

    if (data.username || data.email) {
      const conflict = await prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(data.username ? [{ username: data.username }] : []),
            ...(data.email ? [{ email: data.email }] : []),
          ],
        },
      });
      if (conflict) {
        return res.status(400).json({ error: 'اسم المستخدم أو الإيميل مستعمل من قبل' });
      }
    }

    const updated = await prisma.user.update({ where: { id }, data });
    return res.json(serialize(publicUser(updated)));
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id) {
      return res.status(400).json({ error: 'ما تقدرش تحذف حسابك أنت' });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'المستخدم ما لقيناهش' });

    await prisma.user.delete({ where: { id } });
    return res.json({ ok: true, message: 'تم الحذف' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
