import { Personne, CreatePersonneDTO, UpdatePersonneDTO } from '../entities/Personne';

export interface IPersonneRepository {
  create(data: CreatePersonneDTO): Promise<Personne>;

  findAll(skip?: number, take?: number): Promise<Personne[]>;

  findById(id: string): Promise<Personne | null>;

  update(id: string, data: UpdatePersonneDTO): Promise<Personne>;

  delete(id: string): Promise<void>;
}
