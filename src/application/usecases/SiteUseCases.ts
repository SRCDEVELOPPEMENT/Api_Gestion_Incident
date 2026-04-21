import { ISiteRepository } from '../../domain/repositories/ISiteRepository';
import { Site, CreateSiteDTO } from '../../domain/entities/Site';
import { PaginatedResult } from '../../shared/types/PaginatedResult';

export class CreateSiteUseCase {
  constructor(private repo: ISiteRepository) {}
  async execute(data: CreateSiteDTO): Promise<Site> {
    return this.repo.create(data);
  }
}

  export class GetAllSitesUseCase {
    constructor(private repo: ISiteRepository) {}

    async execute(
      skip: number,
      take: number
    ): Promise<PaginatedResult<Site>> {
      return this.repo.findAll(skip, take);
    }
  }


export class GetSiteByIdUseCase {
  constructor(private repo: ISiteRepository) {}
  async execute(id: number): Promise<Site | null> {
    return this.repo.findById(id);
  }
}

export class UpdateSiteUseCase {
  constructor(private repo: ISiteRepository) {}
  async execute(id: number, data: Partial<Site>): Promise<Site> {
    return this.repo.update(id, data);
  }
}

export class DeleteSiteUseCase {
  constructor(private repo: ISiteRepository) {}
  async execute(id: number): Promise<void> {
    return this.repo.delete(id);
  }
}

export class GetSitesByTypeIdUseCase {
  constructor(private repo: ISiteRepository) {}

  async execute(typeId: number, page = 1, limit = 10) {
    if (!Number.isInteger(typeId) || typeId <= 0) {
      throw new Error("typeId invalide");
    }
    if (!Number.isInteger(page) || page <= 0) page = 1;
    if (!Number.isInteger(limit) || limit <= 0) limit = 10;

    return this.repo.findByTypeId(typeId, page, limit);
  }
}