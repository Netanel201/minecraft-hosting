import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a test user
  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@playhost.local',
      password: await bcrypt.hash('password123', 10),
    },
  })

  console.log('✅ Database seeded')
  console.log('User:', user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
