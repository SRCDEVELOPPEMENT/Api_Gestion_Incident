import { ISiteRepository } from '../../domain/repositories/ISiteRepository';
import { CreateSiteDTO, Site } from '../../domain/entities/Site';
// import { PrismaSiteRepository } from '../../infrastructure/repositories/PrismaSiteRepository';

export class CreateSiteUseCase {
  constructor(private siteRepository: ISiteRepository) {}

  async execute(data: CreateSiteDTO): Promise<Site> {
    // Business logic: check if name is unique, valid type, etc.
    if (!data.name) throw new Error('Site name is required');

    return this.siteRepository.create(data);
  }
}

// export class CreateSiteUseCase {
//   constructor(private repo: PrismaSiteRepository) {}

//   async execute(data: CreateSiteDTO): Promise<Site> {
//     return this.repo.create(data);
//   }
// }
