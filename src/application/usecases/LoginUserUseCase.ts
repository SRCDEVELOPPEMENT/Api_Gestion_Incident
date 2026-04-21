import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { LoginUserDTO } from '../../domain/entities/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET || 'access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

export class LoginUserUseCase {
  constructor(
    private userRepository: IUserRepository) { }

  async execute(data: LoginUserDTO): Promise<{
    accessToken: string;
    refreshToken: string;
    roles: string[];
  }> {

    if (!data.username || !data.password) {
      throw new Error('Username and password are required');
    }

    const user = await this.userRepository.findAuthUserByUsername(data.username);

    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is inactive');
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    // ✅ Extraction des rôles
    const roles =
      user.roles?.map(ur => ur.role.name) ?? [];

    // ✅ JWT minimal (id seulement)
    const payload = { id: user.id };

    const accessToken = jwt.sign(payload, ACCESS_SECRET, {
      expiresIn: '2h'
    });

    const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
      expiresIn: '7d'
    });

    return {
      accessToken,
      refreshToken,
      roles
    };
  }

}
