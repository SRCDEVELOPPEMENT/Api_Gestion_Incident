import fs from 'fs';
import path from 'path';
import { IFileStorageService } from './FileStorageService';

export class LocalFileStorageService implements IFileStorageService {

  private uploadDir = path.resolve(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Express.Multer.File): Promise<string> {
    const filePath = path.join(this.uploadDir, file.filename);
    return `/uploads/${file.filename}`;
  }

  async delete(fileUrl: string): Promise<void> {
    const filePath = path.join(process.cwd(), fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
