import { IIncidentRepository } from '../../domain/repositories/IIncidentRepository';
import { CreateIncidentDTO, UpdateIncidentDTO, Incident } from '../../domain/entities/Incident';
import { generateIncidentReference } from '../utils/incidentReference';

export class CreateIncidentUseCase {
  constructor(private readonly repo: IIncidentRepository) {}

  async execute(
    data: CreateIncidentDTO,
    reporterId: string,
    files?: Express.Multer.File[]
  ): Promise<Incident> {

    const reference = await generateIncidentReference();
    // 1️⃣ Sécurité
    if (!reporterId) {
      throw new Error('Utilisateur non authentifié');
    }

    // 2️⃣ Validations métier
    if (!data.siteIds || data.siteIds.length === 0) {
      throw new Error('Au moins un site est requis');
    }

    if (!data.categoryId) {
      throw new Error('Catégorie obligatoire');
    }

    if (!data.subCategoryId) {
      throw new Error('Sous-catégorie obligatoire');
    }

    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new Error('Date d’échéance invalide');
    }

    if (dueDate < new Date()) {
      throw new Error('La date d’échéance ne peut pas être dans le passé');
    }

    if (data.otherSubCategory && data.otherSubCategory.trim().length < 3) {
      throw new Error('La précision de la sous-catégorie est trop courte');
    }

    // 3️⃣ Persistance
    return this.repo.create(
      {
        ...data,
        reference,
      },
      reporterId,
      files 
    );
  }
}

/* ------------------------------------------------------------------ */

export class GetAllIncidentsUseCase {
  constructor(private repo: IIncidentRepository) {}

  async execute(params: {
    page: number;
    size: number;
    filters?: any;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Incident[]> {
    const skip = (params.page - 1) * params.size;
    const orderBy = params.sortBy
      ? { [params.sortBy]: params.sortOrder || 'desc' }
      : undefined;

    return this.repo.findAll(skip, params.size, params.filters, orderBy);
  }
}

export class GetIncidentByIdUseCase {
  constructor(private repo: IIncidentRepository) {}

  async execute(id: string): Promise<Incident | null> {
    return this.repo.findById(id);
  }
}

// export class UpdateIncidentUseCase {
//   constructor(private repo: IIncidentRepository) {}

//   async execute(id: string, data: UpdateIncidentDTO): Promise<Incident> {
//     return this.repo.update(id, data);
//   }
// }
export class UpdateIncidentUseCase {
  constructor(private readonly repo: IIncidentRepository) {}

  async execute(
    id: string,
    data: UpdateIncidentDTO,
    files?: Express.Multer.File[]
  ): Promise<Incident> {
    return this.repo.update(id, data, files);
  }
}

export class DeleteIncidentUseCase {
  constructor(private repo: IIncidentRepository) {}

  async execute(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
