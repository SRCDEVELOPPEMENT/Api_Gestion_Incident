import { Site, CreateSiteDTO } from '../entities/Site';

export interface ISiteRepository {
  create(data: CreateSiteDTO): Promise<Site>;
  findAll(skip?: number, take?: number): Promise<Site[]>;
  findById(id: number): Promise<Site | null>;
  update(id: number, data: Partial<Site>): Promise<Site>;
  delete(id: number): Promise<void>;
}