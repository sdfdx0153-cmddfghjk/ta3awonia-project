const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { signToken, requireAuth } = require('../middleware/auth');
const { serialize } = require('../utils/helpers');

const router = express.Router();

function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    full_name: u.fullName,
    role: u.role,
    is_active: u.isActive,
    term_end_date: u.termEndDate || null,
    created_at: u.createdAt || null,
  };
}

function isExpired(termEndDate) {
  if (!termEndDate) return false;
  const end = new Date(termEndDate);
  end.setHours(23, 59, 59, 999);
  return Date.now() > end.getTime();
}

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'دخل اسم المستخدم وكلمة السر' });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: username }] },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة السر خاطئة' });
    }

    // اشتراك منتهي → حظر + رسالة تواصل
    if (isExpired(user.termEndDate)) {
      if (user.isActive) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isActive: false },
        });
      }
      return res.status(403).json({
        error:
          'انتهت مدة الاشتراك ديالك. الحساب محظور. تواصل معنا باش تجدّد: +212 6XX-XXX-XXX · Smart Conseil',
        code: 'SUBSCRIPTION_EXPIRED',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'الحساب معطّل. تواصل معنا باش نفعّلوه: +212 6XX-XXX-XXX',
        code: 'ACCOUNT_DISABLED',
      });
    }

    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'المستخدم ما لقيناهش' });

    if (isExpired(user.termEndDate)) {
      if (user.isActive) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isActive: false },
        });
      }
      return res.status(403).json({
        error:
          'انتهت مدة الاشتراك ديالك. تواصل معنا باش تجدّد: +212 6XX-XXX-XXX',
        code: 'SUBSCRIPTION_EXPIRED',
      });
    }

    return res.json(serialize(publicUser(user)));
  } catch (e) {
    next(e);
  }
});

module.exports = router;
