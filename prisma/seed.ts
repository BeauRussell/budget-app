import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default account categories
  const accountCategories = [
    { name: 'Bank', isDefault: true, type: 'ASSET' },
    { name: 'Investment', isDefault: true, type: 'ASSET' },
    { name: 'Property', isDefault: true, type: 'ASSET' },
    { name: 'Credit Card', isDefault: true, type: 'DEBT' },
    { name: 'Loan', isDefault: true, type: 'DEBT' },
    { name: 'Mortgage', isDefault: true, type: 'DEBT' },
  ]

  for (const category of accountCategories) {
    await prisma.accountCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  // Create default budget categories
  const budgetCategories = [
    { name: 'Baby Care', sortOrder: 1 },
    { name: 'Car Care', sortOrder: 2 },
    { name: 'Debt', sortOrder: 3 },
    { name: 'Eating Out', sortOrder: 4 },
    { name: 'Entertainment', sortOrder: 5 },
    { name: 'Gas', sortOrder: 6 },
    { name: 'Groceries', sortOrder: 7 },
    { name: 'House Care', sortOrder: 8 },
    { name: 'Miscellaneous', sortOrder: 9 },
    { name: 'Mortgage', sortOrder: 10 },
    { name: 'Self Care', sortOrder: 11 },
    { name: 'Streaming Services', sortOrder: 12 },
    { name: 'Utilities', sortOrder: 13 },
  ]

  for (const category of budgetCategories) {
    await prisma.budgetCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })