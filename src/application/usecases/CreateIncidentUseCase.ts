import { Incident } from "../../domain/entities/Incident";
import { CreateIncidentDTO } from "../../domain/entities/Incident";
import { IIncidentRepository } from "../../domain/repositories/IIncidentRepository";
import { IAttachmentRepository } from "../../domain/repositories/IAttachmentRepository";
import { IFileStorageService } from "../../domain/services/FileStorageService";

export class CreateIncidentUseCase {
  constructor(
    private readonly incidentRepo: IIncidentRepository,
    private readonly attachmentRepo: IAttachmentRepository,
    private readonly fileStorage: IFileStorageService
  ) { }

  async execute(
    data: CreateIncidentDTO,
    reporterId: string,
    files?: Express.Multer.File[]
  ): Promise<Incident> {


    // =========================
    // 1️⃣ Sécurité de base
    // =========================
    if (!reporterId) {
      throw new Error('Utilisateur non authentifié');
    }

    // =========================
    // 2️⃣ Validations métier
    // =========================
    if (!data.siteIds || data.siteIds.length === 0) {
      throw new Error('Au moins un site est requis');
    }

    if (!data.categoryId) {
      throw new Error('Catégorie obligatoire');
    }

    if (!data.subCategoryId) {
      throw new Error('Sous-catégorie obligatoire');
    }

    if (!data.subProcessId) {
      throw new Error('Sous-processus obligatoire');
    }

    if (!data.description || data.description.trim().length < 5) {
      throw new Error('Description trop courte');
    }

    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new Error('Date d’échéance invalide');
    }

    if (dueDate < new Date()) {
      throw new Error('La date d’échéance ne peut pas être dans le passé');
    }

    if (
      data.otherSubCategory &&
      data.otherSubCategory.trim().length < 3
    ) {
      throw new Error('Précision de sous-catégorie trop courte');
    }

    // =========================
    // 3️⃣ Création Incident (DB)
    // =========================
    const incident = await this.incidentRepo.create(
      data,
      reporterId
    );

    // =========================
    // 4️⃣ Gestion des fichiers
    // =========================
    if (files && files.length > 0) {
      for (const file of files) {

        // Sécurité fichiers
        if (!file.originalname || !file.mimetype) {
          throw new Error('Fichier invalide');
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Fichier trop volumineux : ${file.originalname}`);
        }

        // Upload (disk / S3 / etc.)
        const url = await this.fileStorage.upload(file);

        // Persistance metadata
        await this.attachmentRepo.create({
          incidentId: incident.id,
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url
        });
      }
    }

    // =========================
    // 5️⃣ Résultat final
    // =========================
    return incident;
  }
}
