const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { requireAuth } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const memberRoutes = require('./routes/members');
const productRoutes = require('./routes/products');
const saleRoutes = require('./routes/sales');
const debtRoutes = require('./routes/debts');
const contributionRoutes = require('./routes/contributions');
const expenseRoutes = require('./routes/expenses');
const accountingRoutes = require('./routes/accounting');
const supplierRoutes = require('./routes/suppliers');
const purchaseOrderRoutes = require('./routes/purchaseOrders');
const inventoryRoutes = require('./routes/inventory');
const profitRoutes = require('./routes/profits');
const reportRoutes = require('./routes/reports');
const exportRoutes = require('./routes/exports');
const userRoutes = require('./routes/users');
const boardRoutes = require('./routes/board');
const assemblyRoutes = require('./routes/assemblies');
const minutesRoutes = require('./routes/minutes');
const decisionRoutes = require('./routes/decisions');
const committeeRoutes = require('./routes/committees');
const attendanceRoutes = require('./routes/attendance');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Auth (بدون حماية)
app.use('/api/auth', authRoutes);

// إدارة المستخدمين (الحماية داخل الراوت)
app.use('/api/users', userRoutes);
app.use('/api/board', requireAuth, boardRoutes);
app.use('/api/assemblies', requireAuth, assemblyRoutes);
app.use('/api/minutes', requireAuth, minutesRoutes);
app.use('/api/decisions', requireAuth, decisionRoutes);
app.use('/api/committees', requireAuth, committeeRoutes);
app.use('/api/attendance', requireAuth, attendanceRoutes);

// كل الباقي محمي بـ JWT
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/members', requireAuth, memberRoutes);
app.use('/api/products', requireAuth, productRoutes);
app.use('/api/sales', requireAuth, saleRoutes);
app.use('/api/debts', requireAuth, debtRoutes);
app.use('/api/contributions', requireAuth, contributionRoutes);
app.use('/api/expenses', requireAuth, expenseRoutes);
app.use('/api/accounting', requireAuth, accountingRoutes);
app.use('/api/suppliers', requireAuth, supplierRoutes);
app.use('/api/purchase-orders', requireAuth, purchaseOrderRoutes);
app.use('/api/inventory', requireAuth, inventoryRoutes);
app.use('/api/profit-distributions', requireAuth, profitRoutes);
app.use('/api/reports', requireAuth, reportRoutes);
app.use('/api/export', requireAuth, exportRoutes);

// 404
app.use('/api', (req, res) => res.status(404).json({ error: 'الطريق ما موجودش' }));

// Error handler مركزي
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') return res.status(400).json({ error: 'هاد البيانات موجودة من قبل' });
    if (err.code === 'P2025') return res.status(404).json({ error: 'العنصر ما لقيناهش' });
    if (err.code === 'P2021' || err.code === 'P2010') {
      return res.status(500).json({ error: 'جدول ناقص فقاعدة البيانات — شغّل: npx prisma migrate deploy' });
    }
  }
  if (err.message && /boardMember|Assembly|does not exist|Unknown model/i.test(err.message)) {
    return res.status(500).json({
      error: 'الـ Prisma Client قديم أو الجدول ناقص. شغّل: npx prisma generate && npx prisma db push',
    });
  }
  const msg = err.message && process.env.NODE_ENV !== 'production' ? err.message : 'مشكل فالسيرفر';
  return res.status(500).json({ error: msg });
});

module.exports = app;
