/*
  Warnings:

  - You are about to drop the `SiteType` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[SiteType] DROP CONSTRAINT [SiteType_createdByUserId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[SiteType] DROP CONSTRAINT [SiteType_siteId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Site] ADD [typeId] INT;

-- DropTable
DROP TABLE [dbo].[SiteType];

-- CreateTable
CREATE TABLE [dbo].[Type] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [createdByUserId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Type_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Type_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Site_typeId_idx] ON [dbo].[Site]([typeId]);

-- AddForeignKey
ALTER TABLE [dbo].[Site] ADD CONSTRAINT [Site_typeId_fkey] FOREIGN KEY ([typeId]) REFERENCES [dbo].[Type]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Type] ADD CONSTRAINT [Type_createdByUserId_fkey] FOREIGN KEY ([createdByUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
