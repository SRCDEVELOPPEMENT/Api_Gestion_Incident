/*
  Warnings:

  - You are about to drop the column `userId` on the `Site` table. All the data in the column will be lost.
  - Added the required column `createdByUserId` to the `Site` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Site] DROP CONSTRAINT [Site_userId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Site] DROP COLUMN [userId];
ALTER TABLE [dbo].[Site] ADD [createdByUserId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[User] ADD [siteId] INT;

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_siteId_fkey] FOREIGN KEY ([siteId]) REFERENCES [dbo].[Site]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Site] ADD CONSTRAINT [Site_createdByUserId_fkey] FOREIGN KEY ([createdByUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
