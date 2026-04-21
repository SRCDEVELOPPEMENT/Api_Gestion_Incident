import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { RegisterUserDTO, User } from '../../domain/entities/User';

export class RegisterUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: RegisterUserDTO): Promise<User> {
    const [existingUsername, existingEmail, existingMatricule] = await Promise.all([
      this.userRepository.findByUsername(data.username),
      this.userRepository.findByEmail(data.email),
      this.userRepository.findByMatricule(data.matricule),
    ]);

    // Utilise BadRequestError pour des messages explicites et exploitables côté front
    if (existingUsername) {
      // Message explicite pour le front
      const { BadRequestError } = await import('../../domain/errors/AppError');
      throw new BadRequestError("Ce nom d'utilisateur existe déjà. Veuillez en choisir un autre.", "USERNAME_EXISTS");
    }

    if (existingEmail) {
      const { BadRequestError } = await import('../../domain/errors/AppError');
      throw new BadRequestError("Cet email est déjà utilisé. Veuillez en saisir un autre.", "EMAIL_EXISTS");
    }

    if (existingMatricule) {
      const { BadRequestError } = await import('../../domain/errors/AppError');
      throw new BadRequestError("Ce matricule existe déjà. Veuillez en saisir un autre ou contacter l'administrateur.", "MATRICULE_EXISTS");
    }

    return this.userRepository.create({
      matricule: data.matricule,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      isActive: true,
    });
  }
}
