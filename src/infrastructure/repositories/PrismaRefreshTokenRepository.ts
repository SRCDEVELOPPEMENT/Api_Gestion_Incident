import crypto from 'crypto';
import prisma from '../database/prisma';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { RefreshToken, CreateRefreshTokenDTO } from '../../domain/entities/RefreshToken';

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {

  async create(data: CreateRefreshTokenDTO): Promise<RefreshToken> {
    // 🔐 HASH DU REFRESH TOKEN (OBLIGATOIRE POUR SQL SERVER)
    const tokenHash = crypto
      .createHash('sha256')
      .update(data.token)
      .digest('hex');

    const token = await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: data.userId,
        expiresAt: data.expiresAt,
        revoked: false,
      },
    });

    return token as RefreshToken;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const found = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    return found as RefreshToken | null;
  }

  async revoke(id: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: { revoked: true },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }
}
