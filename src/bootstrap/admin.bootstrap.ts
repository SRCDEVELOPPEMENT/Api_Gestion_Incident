import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function bootstrapAdmin() {
  if (process.env.BOOTSTRAP_ENABLED !== 'true') {
    return;
  }

  const username = process.env.BOOTSTRAP_ADMIN_USERNAME;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!username || !password) {
    console.warn('[BOOTSTRAP] Admin credentials missing');
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    console.log('[BOOTSTRAP] Admin already exists');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      username,
      passwordHash,
      isActive: true,
    },
  });

  console.log('[BOOTSTRAP] Admin user created:', username);
}
