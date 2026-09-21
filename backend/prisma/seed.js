const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 إعداد / تحديث المستخدم...');

  const password = await bcrypt.hash('akram123', 10);

  // إنشاء أو تحديث حساب akram
  await prisma.user.upsert({
    where: { username: 'akram' },
    update: {
      password,
      email: 'akram@taawniya.ma',
      fullName: 'أكرام',
      role: 'admin',
      isActive: true,
    },
    create: {
      username: 'akram',
      email: 'akram@taawniya.ma',
      password,
      fullName: 'أكرام',
      role: 'admin',
      isActive: true,
    },
  });

  // تحديث باسوورد admin القديم إلا كان موجود
  await prisma.user.updateMany({
    where: { username: 'admin' },
    data: { password, isActive: true },
  });

  console.log('✅ المستخدم جاهز:');
  console.log('   Username: akram');
  console.log('   Password: akram123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());