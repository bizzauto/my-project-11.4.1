import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Create demo business
  const business = await prisma.business.upsert({
    where: { id: 'demo-business-id' },
    update: {},
    create: {
      id: 'demo-business-id',
      name: 'BizzAuto Demo',
      type: 'general',
      phone: '+91 8983027975',
      email: 'demo@bizzauto.com',
      city: 'Pune',
      state: 'Maharashtra',
      plan: 'FREE',
      planStartedAt: new Date(),
      planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      aiCreditsUsed: 0,
      aiCreditsLimit: 100,
      contactsLimit: 500,
      messagesLimit: 1000,
      usersLimit: 1,
    },
  });
  console.log('✅ Business created:', business.name);

  // 2. Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const user = await prisma.user.upsert({
    where: { id: 'demo-user-id' },
    update: {},
    create: {
      id: 'demo-user-id',
      email: 'demo@bizzauto.com',
      password: hashedPassword,
      name: 'Demo User',
      phone: '+91 8983027975',
      role: 'OWNER',
      businessId: business.id,
      emailVerified: new Date(),
    },
  });
  console.log('✅ User created:', user.email);

  // 3. Create demo contacts
  const demoContacts = [
    { name: 'Rahul Sharma', phone: '+91 9876543210', email: 'rahul@techsolutions.com', company: 'Tech Solutions Pvt Ltd', stage: 'QUALIFIED', dealValue: 85000, tags: ['Hot Lead', 'VIP'] },
    { name: 'Priya Patel', phone: '+91 8765432109', email: 'priya@digitalco.com', company: 'Digital Marketing Co', stage: 'NEW', dealValue: 45000, tags: ['New'] },
  ];

  for (const contact of demoContacts) {
    const existing = await prisma.contact.findFirst({
      where: { phone: contact.phone, businessId: business.id }
    });
    if (!existing) {
      await prisma.contact.create({
        data: {
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          company: contact.company,
          stage: contact.stage,
          dealValue: contact.dealValue,
          tags: contact.tags,
          businessId: business.id,
        },
      });
    }
  }
  console.log('✅ Demo contacts created');

  console.log('\n🎉 Database seeding complete!');
  console.log('📧 Demo login: demo@bizzauto.com / demo123');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
