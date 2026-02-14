import { IPersonneRepository } from '../../domain/repositories/IPersonneRepository';
import {
  Personne,
  CreatePersonneDTO,
  UpdatePersonneDTO
} from '../../domain/entities/Personne';

/* ---------------- CREATE ---------------- */

export class CreatePersonneUseCase {
  constructor(private repo: IPersonneRepository) {}

  async execute(data: CreatePersonneDTO): Promise<Personne> {

    if (!data.fullname || data.fullname.trim().length < 3) {
      throw new Error('Le nom complet doit contenir au moins 3 caractères');
    }

    return this.repo.create({
      fullname: data.fullname.trim()
    });
  }
}

/* ---------------- GET ALL ---------------- */

export class GetAllPersonnesUseCase {
  constructor(private repo: IPersonneRepository) {}

  async execute(skip = 0, take = 50): Promise<Personne[]> {
    return this.repo.findAll(skip, take);
  }
}

/* ---------------- GET BY ID ---------------- */

export class GetPersonneByIdUseCase {
  constructor(private repo: IPersonneRepository) {}

  async execute(id: string): Promise<Personne | null> {

    if (!id) {
      throw new Error('ID invalide');
    }

    return this.repo.findById(id);
  }
}

/* ---------------- UPDATE ---------------- */

export class UpdatePersonneUseCase {
  constructor(private repo: IPersonneRepository) {}

  async execute(
    id: string,
    data: UpdatePersonneDTO
  ): Promise<Personne> {

    if (!id) {
      throw new Error('ID invalide');
    }

    if (data.fullname && data.fullname.trim().length < 3) {
      throw new Error('Le nom complet est trop court');
    }

    return this.repo.update(id, {
      ...data,
      fullname: data.fullname?.trim()
    });
  }
}

/* ---------------- DELETE ---------------- */

export class DeletePersonneUseCase {
  constructor(private repo: IPersonneRepository) {}

  async execute(id: string): Promise<void> {

    if (!id) {
      throw new Error('ID invalide');
    }

    return this.repo.delete(id);
  }
}
