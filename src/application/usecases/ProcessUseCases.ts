import { IProcessRepository } from '../../domain/repositories/IProcessRepository';
import { Process, CreateProcessDTO } from '../../domain/entities/Process';

export class CreateProcessUseCase {
  constructor(private repo: IProcessRepository) {}
  async execute(data: CreateProcessDTO): Promise<Process> {
    return this.repo.create(data);
  }
}

// export class GetAllProcessesUseCase {
//   constructor(private repo: IProcessRepository) {}
//   async execute(skip: number, take: number): Promise<Process[]> {
//     return this.repo.findAll(skip, take);
//   }
// }

export class GetAllProcessesUseCase {
  constructor(private repo: IProcessRepository) {}

  async execute(): Promise<Process[]> {
    return this.repo.findAll();
  }
}

export class GetProcessByIdUseCase {
  constructor(private repo: IProcessRepository) {}
  async execute(id: string): Promise<Process | null> {
    return this.repo.findById(Number(id));
  }
}

export class UpdateProcessUseCase {
  constructor(private repo: IProcessRepository) {}
  async execute(id: string, data: Partial<Process>): Promise<Process> {
    return this.repo.update(id, data);
  }
}

export class DeleteProcessUseCase {
  constructor(private repo: IProcessRepository) {}
  async execute(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}