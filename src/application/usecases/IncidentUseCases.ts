import { IIncidentRepository } from '../../domain/repositories/IIncidentRepository';
import { CreateIncidentDTO, UpdateIncidentDTO, Incident } from '../../domain/entities/Incident';
import { generateIncidentReference } from '../utils/incidentReference';
import { PaginatedResult } from '../../shared/types/PaginatedResult';
import { BadRequestError } from '../../domain/errors/AppError';

export class CreateIncidentUseCase {
  constructor(private readonly repo: IIncidentRepository) { }

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

    // 🔴 RÈGLE MÉTIER CENTRALE
    // if (!data.subCategoryId && !data.otherSubCategory) {
    //   throw new Error('Sous-catégorie ou précision obligatoire');
    // }

    if (data.subCategoryId && data.otherSubCategory) {
      throw new BadRequestError(
        'subCategoryId et otherSubCategory sont mutuellement exclusifs'
      );
    }

    if (data.otherSubCategory) {
      const trimmed = data.otherSubCategory.trim();

      if (trimmed.length < 3) {
        throw new Error('La précision de la sous-catégorie est trop courte');
      }

      // Normalisation
      data.otherSubCategory = trimmed;
      data.subCategoryId = undefined;
    }

    // const dueDate = new Date(data.dueDate);
    // if (isNaN(dueDate.getTime())) {
    //   throw new Error('Date d’échéance invalide');
    // }

    // if (dueDate < new Date()) {
    //   throw new Error('La date d’échéance ne peut pas être dans le passé');
    // }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(data.dueDate);
    due.setHours(0, 0, 0, 0);

    if (due.getTime() < today.getTime()) {
      throw new Error("La date d’échéance ne peut pas être dans le passé");
    }

    const personneIds = Array.isArray(data.personneIds)
      ? data.personneIds
      : data.personneIds
        ? [data.personneIds]
        : [];

    const impactedSiteIds = Array.isArray(data.impactedSiteIds)
      ? data.impactedSiteIds
      : data.impactedSiteIds
        ? [data.impactedSiteIds]
        : [];

    // 3️⃣ Persistance
    return this.repo.create(
      {
        ...data,
        impactedSiteIds,
        personneIds,
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
    userId: number;
    role: string;
    filters?: any;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResult<Incident>> {
    const skip = (params.page - 1) * params.size;

    const orderBy = params.sortBy
      ? { [params.sortBy]: params.sortOrder || 'desc' }
      : undefined;

    // 👑 ADMIN / MANAGER → tout voir
    if (params.role === 'ADMIN' || params.role === 'MANAGER') {
      return this.repo.findAll(
        skip,
        params.size,
        params.filters,
        orderBy
      );
    }

    // 👤 USER → uniquement SES incidents
    return this.repo.findAllByUser(
      params.userId,
      skip,
      params.size,
      params.filters,
      orderBy
    );
  }
}


export class GetIncidentByIdUseCase {
  constructor(private repo: IIncidentRepository) {}

  async execute(
    id: string,
    userId: number,
    isAdmin: boolean
  ): Promise<Incident | null> {
    return this.repo.findById(id, userId, isAdmin);
  }
}

export class UpdateIncidentUseCase {
  constructor(private readonly repo: IIncidentRepository) { }

  async execute(
    id: string,
    data: UpdateIncidentDTO,
    files?: Express.Multer.File[]
  ): Promise<Incident> {
    return this.repo.update(id, data, files);
  }
}

export class DeleteIncidentUseCase {
  constructor(private repo: IIncidentRepository) { }

  async execute(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
