import { RefreshToken, CreateRefreshTokenDTO } from '../entities/RefreshToken';

export interface IRefreshTokenRepository {
  create(data: CreateRefreshTokenDTO): Promise<RefreshToken>;
  findByToken(token: string): Promise<RefreshToken | null>;
  revoke(id: number, replacedBy?: string): Promise<void>;
  revokeAllForUser(userId: number): Promise<void>;
}