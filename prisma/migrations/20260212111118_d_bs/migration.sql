BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Attachment] DROP CONSTRAINT [Attachment_incidentId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Incident] ALTER COLUMN [subProcessId] INT NULL;
ALTER TABLE [dbo].[Incident] ALTER COLUMN [subCategoryId] INT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[Attachment] ADD CONSTRAINT [Attachment_incidentId_fkey] FOREIGN KEY ([incidentId]) REFERENCES [dbo].[Incident]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
