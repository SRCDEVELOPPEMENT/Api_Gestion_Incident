import crypto from 'crypto';
import prisma from '../database/prisma';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { RefreshToken, CreateRefreshTokenDTO } from '../../domain/entities/RefreshToken';

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {

  async create(data: CreateRefreshTokenDTO): Promise<RefreshToken> {
    // 🔐 HASH DU REFRESH TOKEN
    const tokenHash = crypto
      .createHash('sha256')
      .update(data.token)
      .digest('hex');

    const token = await prisma.refreshToken.upsert({
      where: {
        tokenHash, // ⚠️ doit être @unique dans schema.prisma
      },
      update: {
        expiresAt: data.expiresAt,
        revoked: false,
      },
      create: {
        tokenHash,
        userId: data.userId,
        expiresAt: data.expiresAt,
        revoked: false,
      },
    });

    return token; // ✅ correspond EXACTEMENT à RefreshToken
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const found = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    return found; // ✅ aucun cast nécessaire
  }

  async revoke(id: number): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: { revoked: true },
    });
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }
}
