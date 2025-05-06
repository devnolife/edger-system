const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.budgetUsageHistory.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.additionalAllocation.deleteMany();
  await prisma.budget.deleteMany();
  // Clean up existing users
  await prisma.user.deleteMany();

  // Create a budget
  const budget = await prisma.budget.create({
    data: {
      id: randomUUID(),
      name: 'Marketing Budget',
      amount: '10000.00',
      start_date: new Date('2023-01-01'),
      description: 'Initial marketing budget for Q1',
      created_by: 'admin'
    }
  });

  // Create an expense
  const expense = await prisma.expense.create({
    data: {
      id: randomUUID(),
      budget_id: budget.id,
      description: 'Facebook Ads',
      amount: '500.00',
      date: new Date('2023-01-15'),
      submitted_by: 'user1'
    }
  });

  // Create an additional allocation
  const additionalAllocation = await prisma.additionalAllocation.create({
    data: {
      id: randomUUID(),
      original_budget_id: budget.id,
      description: 'Extra Google Ads Allocation',
      reason: 'Campaign performance boost',
      amount: '1000.00',
      request_date: new Date('2023-01-20'),
      requested_by: 'user1',
      approved_by: 'admin',
      approved_at: new Date('2023-01-21'),
      related_expense_id: expense.id
    }
  });

  // Create a budget usage history entry
  await prisma.budgetUsageHistory.create({
    data: {
      budget_id: budget.id,
      expense_id: expense.id,
      amount: expense.amount.toString()
    }
  });

  // Seed users
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password: 'password123',
      role: 'ADMIN',
    }
  });
  const regularUser = await prisma.user.create({
    data: {
      username: 'user',
      password: 'password123',
      role: 'USER',
    }
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
