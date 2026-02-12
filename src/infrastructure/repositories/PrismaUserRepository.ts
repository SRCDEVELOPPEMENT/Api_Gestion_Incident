import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UpdateUserDTO, CreateUserDTO } from '../../domain/entities/User';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AuthUser } from '../../domain/entities/AuthUser';

const prisma = new PrismaClient();

export class PrismaUserRepository implements IUserRepository {
  private prisma: PrismaClient;
constructor() {
    this.prisma = new PrismaClient();
  }

  async update(id: number, data: UpdateUserDTO): Promise<User> {
    const { password, roleIds, siteId, ...rest } = data;

    await prisma.$transaction(async (tx) => {
      // 🔐 HASH DU MOT DE PASSE SI FOURNI
      let passwordHash: string | undefined;

      if (password && password.trim().length > 0) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      // 1️⃣ Mise à jour des champs simples
      await tx.user.update({
        where: { id },
        data: {
          ...rest,
          ...(siteId !== undefined && { siteId }), // ✅ AJOUT
          ...(passwordHash ? { passwordHash } : {})
        }
      });

      // 2️⃣ Mise à jour des rôles (si fournis)
      if (roleIds) {
        await tx.userRole.deleteMany({
          where: { userId: id }
        });

        await tx.userRole.createMany({
          data: roleIds.map(roleId => ({
            userId: id,
            roleId
          }))
        });
      }
    });

    // 3️⃣ Recharger l’utilisateur avec ses rôles
    const userWithRoles = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } }
      }
    });

    return this.mapToUser(userWithRoles!);
  }

  async findById(id: number): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        roles: { include: { role: true } },
        site: true // ✅ AJOUT
      }
    });

    return user ? this.mapToUser(user) : null;
  }

async findAll(skip: number, take: number): Promise<User[]> {
  const users = await prisma.user.findMany({
    skip,
    take,
    where: { deletedAt: null },
    include: {
      roles: { include: { role: true } },
      site: true // 🔥 AJOUT OBLIGATOIRE
    }
  });

  return users.map(u => this.mapToUser(u));
}



  async delete(id: number): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async create(data: CreateUserDTO): Promise<User> {
    const { password, roleIds, siteId, ...rest } = data;

    const passwordHash = await bcrypt.hash(password, 10);

    // 🔐 Vérifier si ADMIN
    let isAdmin = false;

    if (roleIds?.length) {
      const roles = await prisma.role.findMany({
        where: { id: { in: roleIds } },
        select: { name: true }
      });

      isAdmin = roles.some(r => r.name === 'ADMIN');
    }

    // 🔒 RÈGLE MÉTIER
    if (!isAdmin && !siteId) {
      throw new Error("Un utilisateur non admin doit appartenir à un site");
    }

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          ...rest,
          siteId: isAdmin ? null : siteId, // 🔐 ADMIN = null
          isActive: rest.isActive ?? true,
          passwordHash
        }
      });

      if (roleIds?.length) {
        await tx.userRole.createMany({
          data: roleIds.map(roleId => ({
            userId: createdUser.id,
            roleId
          }))
        });
      }

      return createdUser;
    });

    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: { include: { role: true } },
        site: true
      }
    });

    return this.mapToUser(userWithRoles!);
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: { username, deletedAt: null },
      include: {
        roles: { include: { role: true } }
      }
    });

    return user ? this.mapToUser(user) : null;
  }

async findAuthUserByUsername(username: string): Promise<AuthUser | null> {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      passwordHash: true,
      isActive: true,
      siteId: true, // ✅ ajout essentiel
      roles: {
        select: {
          role: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });
}

  /**
   * 🔁 Mapping Prisma → User métier
   */
  private mapToUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      username: prismaUser.username,
      isActive: prismaUser.isActive,
      siteId: prismaUser.siteId ?? null, // ✅ AJOUT
      site: prismaUser.site
        ? {
            id: prismaUser.site.id,
            name: prismaUser.site.name
          }
        : null,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      deletedAt: prismaUser.deletedAt,
      roles: prismaUser.roles?.map((ur: any) => ur.role.name)
    };
  }
}
