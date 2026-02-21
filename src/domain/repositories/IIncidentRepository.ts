import { PaginatedResult } from '../../shared/types/PaginatedResult';
import { Incident, CreateIncidentDTO, UpdateIncidentDTO } from '../entities/Incident';

export interface IIncidentRepository {
  create(
    data: CreateIncidentDTO,
    reporterId: string,
    files?: Express.Multer.File[]
  ): Promise<Incident>;

  //findById(id: string, userId: number, isAdmin: boolean): Promise<Incident | null>;
  findById(
    id: string,
    userId: number,
    isAdmin: boolean
  ): Promise<Incident | null>;

  findAll(
    userId: number,
    isAdmin: boolean,
    skip?: number,
    take?: number,
    where?: any,
    orderBy?: any
  ): Promise<PaginatedResult<Incident>>;

  update(
    id: string,
    data: UpdateIncidentDTO,
    files?: Express.Multer.File[]
  ): Promise<Incident>;

  delete(id: string): Promise<void>;

  // findAllByUser(
  //   userId: number,
  //   skip?: number,
  //   take?: number,
  //   where?: any,
  //   orderBy?: any
  // ): Promise<PaginatedResult<Incident>>;


findAllByUser(
  userId: number,
  isAdmin: boolean, // ✅ ADMIN ou MANAGER => voit tout
  skip?: number,
  take?: number,
  where?: any,
  orderBy?: any
): Promise<PaginatedResult<Incident>>;

}
