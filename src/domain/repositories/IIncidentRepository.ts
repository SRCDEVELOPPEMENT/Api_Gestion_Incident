import { PaginatedResult } from '../../shared/types/PaginatedResult';
import { Incident, CreateIncidentDTO, UpdateIncidentDTO } from '../entities/Incident';

export interface IIncidentRepository {
  create(
    data: CreateIncidentDTO,
    reporterId: string,
    files?: Express.Multer.File[]
  ): Promise<Incident>;

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

findAllByUser(
  userId: number,
  isAdmin: boolean, // ✅ ADMIN ou MANAGER => voit tout
  skip?: number,
  take?: number,
  where?: any,
  orderBy?: any
): Promise<PaginatedResult<Incident>>;

/**
   * 🔒 Clôture un incident
   * - Change le statut en CLOSED
   * - Enregistre la date de clôture
   * - Enregistre l'utilisateur qui clôture
   * - Enregistre le commentaire de clôture
   */
close(
  id: string,
  userId: number,
  isAdmin: boolean,
  comment: string
): Promise<Incident>;

  /**
   * 🔓 Rouvre un incident
   * - Change le statut en OPEN
   * - Enregistre la date de réouverture
   * - Enregistre l'utilisateur qui rouvre
   */
  reopen(
    id: string,
    userId: number,
    isAdmin: boolean
  ): Promise<Incident>;
}
