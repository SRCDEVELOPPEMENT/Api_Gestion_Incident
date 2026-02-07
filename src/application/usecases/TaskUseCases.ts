import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { Task, CreateTaskDTO } from '../../domain/entities/Task';
import { CreateAttachmentDTO } from '../../domain/entities/Attachment';
import { PrismaTaskRepository } from '../../infrastructure/repositories/PrismaTaskRepository';

// export class CreateTaskUseCase {
//   constructor(private repo: ITaskRepository) {}
//   async execute(data: CreateTaskDTO): Promise<Task> {
//     return this.repo.create(data);
//   }
// }
export class CreateTaskUseCase {
  constructor(private repo: ITaskRepository) {}

  async execute(
    data: CreateTaskDTO,
    files?: Express.Multer.File[]
  ): Promise<Task> {
    return this.repo.create(data, files);
  }
}


export class GetAllTasksUseCase {
  constructor(private repo: ITaskRepository) {}
  async execute(skip: number, take: number): Promise<Task[]> {
    return this.repo.findAll(skip, take);
  }
}

export class GetTaskByIdUseCase {
  constructor(private repo: ITaskRepository) {}
  async execute(id: string): Promise<Task | null> {
    return this.repo.findById(id);
  }
}

export class UpdateTaskUseCase {
  constructor(private repo: ITaskRepository) {}
  async execute(id: string, data: Omit<Partial<Task>, 'attachments'> & { attachments?: CreateAttachmentDTO[] }): Promise<Task> {
    return this.repo.update(id, data);
  }
}

export class DeleteTaskUseCase {
  constructor(private repo: ITaskRepository) {}

  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}

export class GetTasksByIncidentUseCase {
  constructor(private taskRepository: PrismaTaskRepository) {}

  async execute(incidentId: number) {
    return this.taskRepository.findByIncident(incidentId);
  }
}
