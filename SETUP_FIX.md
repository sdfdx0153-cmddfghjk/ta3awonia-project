# إصلاح الأخطاء بعد التحديث — Dual Persist

## 1) حدّث قاعدة البيانات والـ Prisma Client (مهم جداً)

```bash
cd backend
npx prisma generate
npx prisma db push
# أو: npx prisma migrate deploy
```

إلا ما درتيش هاد الخطوتين، غادي يطلع:
- `مشكل فالسيرفر`
- `Unknown model BoardMember / Assembly / Minute / Decision...`
- `table does not exist`

## 2) أعد تشغيل السيرفر

```bash
# backend
cd backend && npm run dev

# frontend (طرفية أخرى)
cd frontend && npm run dev
```

## 3) شنو كيتحفظ فقاعدة البيانات + محلياً (dual persist)

| الصفحة | API (DB) | localStorage (إلا فشل السيرفر) |
|--------|----------|--------------------------------|
| الأعضاء | ✅ | ✅ |
| مجلس الإدارة | ✅ | ✅ |
| User Admin Panel | ✅ | ✅ |
| الجموعات العامة | ✅ | ✅ |
| المحاضر | ✅ | ✅ |
| سجل القرارات | ✅ | ✅ |
| اللجان | ✅ | ✅ |
| سجل الحضور | ✅ | ✅ |
| المنتجات / المبيعات / الديون... | ✅ | ✅ |

المفتاح المحلي مربوط بـ **username** (ما كيتبدّلش مع كل login)، باش من بعد ما تدخل من جديد البيانات تبقى ظاهرة.

## 4) دخول

- حساب افتراضي بعد seed: `admin` / `admin123`
- من صفحة `/login`

## 5) إلا بقي خطأ

- افتح Console المتصفح (F12) وشوف Network → الرد ديال `/api/...`
- شوف terminal ديال backend — الخطأ كيطبع تما
- تأكد أن جداول `minutes`, `decisions`, `committees`, `attendances` موجودة بعد `prisma db push`
