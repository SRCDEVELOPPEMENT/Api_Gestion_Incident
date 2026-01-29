import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_PERMISSIONS = [
  'INCIDENT_CREATE',
  'INCIDENT_READ',
  'INCIDENT_UPDATE',
  'INCIDENT_DELETE',
  'USER_MANAGE',
  'ROLE_MANAGE',
];

export async function bootstrapAuth() {
  if (process.env.BOOTSTRAP_ENABLED !== 'true') {
    return;
  }

  const adminUsername = process.env.BOOTSTRAP_ADMIN_USERNAME;
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    throw new Error('Bootstrap admin credentials are missing');
  }

  // 1) Permissions
  for (const code of BASE_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }

  // 2) Role SUPER_ADMIN
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { name: 'SUPER_ADMIN' },
  });

  // 3) Lier rôle ↔ permissions
  const permissions = await prisma.permission.findMany({
    where: { code: { in: BASE_PERMISSIONS } },
  });

  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // 4) Créer l’utilisateur admin si absent
  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    const hash = await bcrypt.hash(adminPassword, 12);

    const adminUser = await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash: hash,
        isActive: true,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    });

    console.log('✅ Bootstrap: SUPER_ADMIN created');
  } else {
    console.log('ℹ️ Bootstrap: admin already exists, nothing to do');
  }
}
