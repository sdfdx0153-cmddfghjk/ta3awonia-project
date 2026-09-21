require('dotenv').config({ path: `${__dirname}/../.env` });
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

let adminToken;
let memberId;
let productId;
let saleId;
let debtId;

const unique = Date.now();

beforeAll(async () => {
  // إنشاء مستخدم اختبار
  const username = `admin_${unique}`;
  const password = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: { username, email: `${username}@test.ma`, password, role: 'admin' },
  });

  const login = await request(app).post('/api/auth/login').send({ username, password: 'admin123' });
  adminToken = login.body.token;
  expect(adminToken).toBeDefined();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Auth', () => {
  test('يرفض بدون توكن', async () => {
    const res = await request(app).get('/api/members');
    expect(res.status).toBe(401);
  });

  test('خطأ في كلمة السر', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: `admin_${unique}`, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('يرجع المستخدم الحالي', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(`admin_${unique}`);
  });
});

describe('Members', () => {
  test('يزيد عضو', async () => {
    const res = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ full_name: `عضو اختبار ${unique}`, cin: `XX${unique}`, phone: '0600000000', share_amount: 500 });
    expect(res.status).toBe(201);
    memberId = res.body.id;
  });

  test('يرفض CIN مكرر', async () => {
    const res = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ full_name: 'عضو مكرر', cin: `XX${unique}` });
    expect(res.status).toBe(400);
  });
});

describe('Products', () => {
  test('يزيد منتج', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `منتج اختبار ${unique}`, buy_price: 50, sell_price: 80, stock_quantity: 100, min_stock: 10 });
    expect(res.status).toBe(201);
    productId = res.body.id;
  });

  test('يجدد المخزون', async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 20 });
    expect(res.status).toBe(200);
    expect(res.body.new_stock).toBe(120);
  });
});

describe('Sales & Debts', () => {
  test('بيع نقدي ينقص المخزون', async () => {
    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ member_id: memberId, payment_method: 'cash', items: [{ product_id: productId, quantity: 10 }] });
    expect(res.status).toBe(201);
    expect(res.body.total_amount).toBe(800);
    saleId = res.body.id;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(Number(product.stockQuantity)).toBe(110);
  });

  test('بيع بالدين يزيد دين مربوط بالبيع', async () => {
    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ member_id: memberId, payment_method: 'credit', items: [{ product_id: productId, quantity: 5 }] });
    expect(res.status).toBe(201);

    const debts = await prisma.debt.findMany({
      where: { memberId, isSettled: false },
      include: { sale: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(debts.length).toBeGreaterThan(0);
    debtId = debts[0].id;
    expect(debts[0].saleId).toBe(res.body.id); // ✅ مربوط مباشرة بالبيع
  });

  test('يرفض بيع يفوق المخزون', async () => {
    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ member_id: memberId, payment_method: 'cash', items: [{ product_id: productId, quantity: 99999 }] });
    expect(res.status).toBe(400);
  });
});

describe('Debts', () => {
  test('يخلص دين جزئياً', async () => {
    const res = await request(app)
      .post(`/api/debts/${debtId}/pay`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 200 });
    expect(res.status).toBe(200);
    expect(Number(res.body.remaining)).toBe(200);
  });

  test('يرفض دفع أكثر من الباقي', async () => {
    const res = await request(app)
      .post(`/api/debts/${debtId}/pay`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 5000 });
    expect(res.status).toBe(400);
  });
});

describe('Reports & Accounting', () => {
  test('لوحة التحكم', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total_products).toBeGreaterThan(0);
  });

  test('الحسابات', async () => {
    const res = await request(app).get('/api/accounting').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total_sales).toBeGreaterThan(0);
  });

  test('تقرير آخر 7 أيام', async () => {
    const res = await request(app).get('/api/reports/sales-last-7-days').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(7);
  });

  test('تقرير العضو', async () => {
    const res = await request(app).get(`/api/reports/member/${memberId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total_transactions).toBe(2);
  });

  test('تصدير CSV', async () => {
    const res = await request(app).get('/api/export/members').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });
});
