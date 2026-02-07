export interface RefreshToken {
  id: number;
  tokenHash: string;
  userId: number;
  revoked: boolean;
  expiresAt: Date;
  replacedByToken?: string | null;
  createdAt: Date;
}

export type CreateRefreshTokenDTO = {
  token: string;              // ✅ token brut (temporaire)
  userId: number;
  expiresAt: Date;
};

// export type CreateRefreshTokenDTO = Pick<RefreshToken, 'token' | 'userId' | 'expiresAt'>;