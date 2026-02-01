import { IIncidentRepository } from '../../domain/repositories/IIncidentRepository';
import { CreateIncidentDTO, UpdateIncidentDTO, Incident } from '../../domain/entities/Incident';

export class CreateIncidentUseCase {
  constructor(private readonly repo: IIncidentRepository) {}

  async execute(
validatedData: { siteIds: string[]; description: string; subCategoryId: string; categoryId: string; dueDate: string; urgency: "Faible" | "Moyenne" | "Haute" | "Immédiate"; criticality: "Faible" | "Moyenne" | "Haute" | "Critique"; subProcessId?: string | undefined; assignedUserIds?: string[] | undefined; otherSubCategory?: string | undefined; processDomainId?: string | undefined; }, data: CreateIncidentDTO, files: Express.Multer.File[] | undefined, reporterId: string  ): Promise<Incident> {

    // -----------------------------
    // 1️⃣ Sécurité minimale
    // -----------------------------
    if (!reporterId) {
      throw new Error('Utilisateur non authentifié');
    }

    // -----------------------------
    // 2️⃣ Validations métier
    // -----------------------------

    if (!data.siteIds || data.siteIds.length === 0) {
      throw new Error('Au moins un site est requis');
    }

    if (!data.categoryId) {
      throw new Error('Catégorie obligatoire');
    }

    if (!data.subCategoryId) {
      throw new Error('Sous-catégorie obligatoire');
    }

    if (!data.subProcessId) {
      throw new Error('Sous-processus obligatoire');
    }

    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new Error('Date d’échéance invalide');
    }

    if (dueDate < new Date()) {
      throw new Error('La date d’échéance ne peut pas être dans le passé');
    }

    // Cas "Autre sous-catégorie"
    if (data.otherSubCategory && data.otherSubCategory.trim().length < 3) {
      throw new Error('La précision de la sous-catégorie est trop courte');
    }

    // -----------------------------
    // 3️⃣ Normalisation des données
    // -----------------------------

    const normalizedData: CreateIncidentDTO & {
      reporterId: string;
    } = {
      ...data,
      reporterId
    };

    // -----------------------------
    // 4️⃣ Persistance
    // -----------------------------

    return this.repo.create(normalizedData);
  }
}

export class GetAllIncidentsUseCase {
  constructor(private repo: IIncidentRepository) {}
  async execute(params: { page: number; size: number; filters?: any; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<Incident[]> {
    const skip = (params.page - 1) * params.size;
    const orderBy = params.sortBy ? { [params.sortBy]: params.sortOrder || 'desc' } : undefined;
    return this.repo.findAll(skip, params.size, params.filters, orderBy);
  }
}

export class GetIncidentByIdUseCase {
  constructor(private repo: IIncidentRepository) {}
  async execute(id: string): Promise<Incident | null> {
    return this.repo.findById(id);
  }
}

export class UpdateIncidentUseCase {
  constructor(private repo: IIncidentRepository) {}
  async execute(id: string, data: UpdateIncidentDTO): Promise<Incident> {
    return this.repo.update(id, data);
  }
}

export class DeleteIncidentUseCase {
  constructor(private repo: IIncidentRepository) {}
  async execute(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}