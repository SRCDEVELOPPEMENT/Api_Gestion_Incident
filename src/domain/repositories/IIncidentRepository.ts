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
    skip?: number,
    take?: number,
    where?: any,
    orderBy?: any
  ): Promise<Incident[]>;

  update(
    id: string,
    data: UpdateIncidentDTO,
    files?: Express.Multer.File[]
  ): Promise<Incident>;

  delete(id: string): Promise<void>;

  findAllByUser(
    userId: number,
    skip: number,
    take: number,
    filters?: any,
    orderBy?: any
  ): Promise<Incident[]>;

}
