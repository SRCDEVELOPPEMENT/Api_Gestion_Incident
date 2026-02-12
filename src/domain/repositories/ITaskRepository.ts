import { Task, CreateTaskDTO } from '../entities/Task';
import { CreateAttachmentDTO } from '../entities/Attachment';

export interface ITaskRepository {
  //create(data: CreateTaskDTO): Promise<Task>;
  create(
    data: CreateTaskDTO,
    files?: Express.Multer.File[]
  ): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findAll(skip?: number, take?: number): Promise<Task[]>;
  update(id: string, data: Omit<Partial<Task>, 'attachments'> & { attachments?: CreateAttachmentDTO[] }): Promise<Task>;
  delete(id: number): Promise<void>;
  findAllByUser(
    userId: number,
    skip?: number,
    take?: number
  ): Promise<Task[]>;

deleteAllAttachments(taskId: number): Promise<void>;

}