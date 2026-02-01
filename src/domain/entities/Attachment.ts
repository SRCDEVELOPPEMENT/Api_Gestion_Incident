export interface Attachment {
  id: string;
  fileName: string;
  size: number;
  mimeType: string;
  url: string;
  incidentId?: string;
  taskId?: string;
  uploadedAt: Date;
}

// export type CreateAttachmentDTO = Pick<Attachment, 'fileName' | 'url'>;
export type CreateAttachmentDTO = {
  incidentId?: string;
  taskId?: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
};