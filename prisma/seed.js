const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Clean up existing users
  await prisma.user.deleteMany();

  // Hash passwords
  const saltRounds = 10;
  const operatorPasswordHash = await bcrypt.hash('password123', saltRounds);
  const supervisorPasswordHash = await bcrypt.hash('password123', saltRounds);

  // Seed users for login
  await prisma.user.create({
    data: {
      username: 'operator',
      password: operatorPasswordHash,
      role: 'OPERATOR'
    }
  });

  await prisma.user.create({
    data: {
      username: 'supervisor',
      password: supervisorPasswordHash,
      role: 'SUPERVISOR',
    }
  });

  console.log('Seed completed: Created operator and supervisor users');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
