import { Attachment, CreateAttachmentDTO } from '../entities/Attachment';

export interface IAttachmentRepository {
    create(data: CreateAttachmentDTO): Promise<Attachment>;

    findByIncidentId(incidentId: string): Promise<Attachment[]>;

    deleteById(id: string): Promise<void>;
}
