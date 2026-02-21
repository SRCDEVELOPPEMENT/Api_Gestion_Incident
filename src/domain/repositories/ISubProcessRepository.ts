import { SubProcess, CreateSubProcessDTO, UpdateSubProcessDTO } from '../entities/SubProcess';

export interface ISubProcessRepository {
  create(data: CreateSubProcessDTO): Promise<SubProcess>;
  findById(id: number): Promise<SubProcess | null>;
  // findAll(skip?: number, take?: number): Promise<SubProcess[]>;
  findAll(): Promise<SubProcess[]>;
  //update(id: string, data: Partial<SubProcess>): Promise<SubProcess>;
  update(id: number, data: UpdateSubProcessDTO): Promise<SubProcess>;
  delete(id: string): Promise<void>;
}