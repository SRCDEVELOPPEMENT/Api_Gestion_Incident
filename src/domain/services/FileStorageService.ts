export interface IFileStorageService {
  upload(file: Express.Multer.File): Promise<string>;
  delete(fileUrl: string): Promise<void>;
}
