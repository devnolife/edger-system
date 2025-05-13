const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create supervisor user
  const supervisorPassword = await hash('supervisor123', 12);
  await prisma.user.upsert({
    where: { username: 'supervisor' },
    update: {},
    create: {
      username: 'supervisor',
      password: supervisorPassword,
      role: 'SUPERVISOR',
      is_active: true,
    },
  });

  // Create operator user
  const operatorPassword = await hash('operator123', 12);
  await prisma.user.upsert({
    where: { username: 'operator' },
    update: {},
    create: {
      username: 'operator',
      password: operatorPassword,
      role: 'OPERATOR',
      is_active: true,
    },
  });

  console.log('Database has been seeded. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
