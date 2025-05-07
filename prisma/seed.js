const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Clean up existing users
  await prisma.user.deleteMany();

  // Hash passwords
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('password123', saltRounds);
  const userPasswordHash = await bcrypt.hash('password123', saltRounds);

  // Seed users for login
  await prisma.user.create({
    data: { username: 'admin', password: adminPasswordHash, role: 'ADMIN' }
  });
  await prisma.user.create({
    data: { username: 'user', password: userPasswordHash, role: 'USER' }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
