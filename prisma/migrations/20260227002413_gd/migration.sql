/*
  Warnings:

  - You are about to drop the `site_types` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[site_types] DROP CONSTRAINT [site_types_createdByUserId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[site_types] DROP CONSTRAINT [site_types_siteId_fkey];

-- DropTable
DROP TABLE [dbo].[site_types];

-- CreateTable
CREATE TABLE [dbo].[SiteType] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [siteId] INT NOT NULL,
    [createdByUserId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [SiteType_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [SiteType_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[SiteType] ADD CONSTRAINT [SiteType_siteId_fkey] FOREIGN KEY ([siteId]) REFERENCES [dbo].[Site]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[SiteType] ADD CONSTRAINT [SiteType_createdByUserId_fkey] FOREIGN KEY ([createdByUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
