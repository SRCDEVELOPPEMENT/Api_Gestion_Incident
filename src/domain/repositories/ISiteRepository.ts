import { PaginatedResult } from '../../shared/types/PaginatedResult';
import { Site, CreateSiteDTO } from '../entities/Site';

export interface ISiteRepository {
  create(data: CreateSiteDTO): Promise<Site>;
  findAll(page?: number, limit?: number): Promise<PaginatedResult<Site>>;
  findById(id: number): Promise<Site | null>;
  update(id: number, data: Partial<Site>): Promise<Site>;
  delete(id: number): Promise<void>;
  // ✅ NEW: Get sites by typeId (paginé)
  findByTypeId(
    typeId: number,
    page?: number,
    limit?: number
  ): Promise<{
    data: Site[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}