import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { LoginUserDTO } from '../../domain/entities/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET || 'access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

export class LoginUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private refreshTokenRepository: IRefreshTokenRepository
  ) { }

  async execute(
    data: LoginUserDTO
  ): Promise<{ accessToken: string; refreshToken: string }> {

    const user = await this.userRepository.findByUsername(data.username);

    // 1. User existence
    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    // 2. User active check
    if (!user.isActive) {
      throw new Error('Account is inactive or locked');
    }

    // 3. Password check (FIX ICI)
    const valid = await bcrypt.compare(
      data.password,
      user.passwordHash
    );

    if (!valid) {
      throw new Error('Invalid credentials');
    }

    // 4. JWT payload
    const payload = {
      id: user.id,
      username: user.username,
      roles: user.roles || [],
    };

    // 5. Tokens
    const accessToken = jwt.sign(payload, ACCESS_SECRET, {
      expiresIn: '2h',
    });

    const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
      expiresIn: '7d',
    });

    // 6. Persist refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}
