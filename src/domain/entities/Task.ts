import { Attachment, CreateAttachmentDTO } from './Attachment';

export interface Task {
  id: string;
  name: string;
  description?: string | null;
  userId: string;
  incidentId: number;
  attachments?: Attachment[];  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreateTaskDTO = {
  name: string;
  description?: string;
  incidentId: number;
  userId: number;
};
