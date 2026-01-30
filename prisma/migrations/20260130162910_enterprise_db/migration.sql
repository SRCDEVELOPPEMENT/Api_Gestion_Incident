/*
  Warnings:

  - You are about to drop the column `replacedByToken` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Site` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Site` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[RefreshToken] DROP CONSTRAINT [RefreshToken_userId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[RolePermission] DROP CONSTRAINT [RolePermission_permissionId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[RolePermission] DROP CONSTRAINT [RolePermission_roleId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Site] DROP CONSTRAINT [Site_user_id_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[UserRole] DROP CONSTRAINT [UserRole_roleId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[UserRole] DROP CONSTRAINT [UserRole_userId_fkey];

-- DropIndex
ALTER TABLE [dbo].[RefreshToken] DROP CONSTRAINT [RefreshToken_tokenHash_key];

-- AlterTable
ALTER TABLE [dbo].[RefreshToken] ALTER COLUMN [tokenHash] NVARCHAR(1000) NOT NULL;
ALTER TABLE [dbo].[RefreshToken] DROP COLUMN [replacedByToken];

-- AlterTable
ALTER TABLE [dbo].[Site] DROP COLUMN [user_id];
ALTER TABLE [dbo].[Site] ADD [userId] INT NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Category_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Category_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SubCategory] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [categoryId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [SubCategory_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [SubCategory_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Process] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Process_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Process_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SubProcess] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [processId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [SubProcess_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [SubProcess_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Incident] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Incident_status_df] DEFAULT 'OPEN',
    [userId] INT NOT NULL,
    [reporterId] INT NOT NULL,
    [subProcessId] NVARCHAR(1000) NOT NULL,
    [subCategoryId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Incident_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Incident_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Task] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [userId] INT NOT NULL,
    [incidentId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Task_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Task_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Attachment] (
    [id] NVARCHAR(1000) NOT NULL,
    [fileName] NVARCHAR(1000) NOT NULL,
    [url] NVARCHAR(1000) NOT NULL,
    [incidentId] NVARCHAR(1000),
    [taskId] NVARCHAR(1000),
    [uploadedAt] DATETIME2 NOT NULL CONSTRAINT [Attachment_uploadedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Attachment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[_IncidentSites] (
    [A] NVARCHAR(1000) NOT NULL,
    [B] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [_IncidentSites_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateTable
CREATE TABLE [dbo].[_IncidentAssignedUsers] (
    [A] NVARCHAR(1000) NOT NULL,
    [B] INT NOT NULL,
    CONSTRAINT [_IncidentAssignedUsers_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateIndex
ALTER TABLE [dbo].[RefreshToken] ADD CONSTRAINT [RefreshToken_tokenHash_key] UNIQUE NONCLUSTERED ([tokenHash]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SubCategory_categoryId_idx] ON [dbo].[SubCategory]([categoryId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SubProcess_processId_idx] ON [dbo].[SubProcess]([processId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Incident_userId_idx] ON [dbo].[Incident]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Incident_reporterId_idx] ON [dbo].[Incident]([reporterId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Incident_subProcessId_idx] ON [dbo].[Incident]([subProcessId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Incident_subCategoryId_idx] ON [dbo].[Incident]([subCategoryId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_userId_idx] ON [dbo].[Task]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_incidentId_idx] ON [dbo].[Task]([incidentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Attachment_incidentId_idx] ON [dbo].[Attachment]([incidentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Attachment_taskId_idx] ON [dbo].[Attachment]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_IncidentSites_B_index] ON [dbo].[_IncidentSites]([B]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_IncidentAssignedUsers_B_index] ON [dbo].[_IncidentAssignedUsers]([B]);

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RolePermission] ADD CONSTRAINT [RolePermission_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RolePermission] ADD CONSTRAINT [RolePermission_permissionId_fkey] FOREIGN KEY ([permissionId]) REFERENCES [dbo].[Permission]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RefreshToken] ADD CONSTRAINT [RefreshToken_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Site] ADD CONSTRAINT [Site_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Category] ADD CONSTRAINT [Category_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SubCategory] ADD CONSTRAINT [SubCategory_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Process] ADD CONSTRAINT [Process_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SubProcess] ADD CONSTRAINT [SubProcess_processId_fkey] FOREIGN KEY ([processId]) REFERENCES [dbo].[Process]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Incident] ADD CONSTRAINT [Incident_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Incident] ADD CONSTRAINT [Incident_reporterId_fkey] FOREIGN KEY ([reporterId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Incident] ADD CONSTRAINT [Incident_subProcessId_fkey] FOREIGN KEY ([subProcessId]) REFERENCES [dbo].[SubProcess]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Incident] ADD CONSTRAINT [Incident_subCategoryId_fkey] FOREIGN KEY ([subCategoryId]) REFERENCES [dbo].[SubCategory]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Task] ADD CONSTRAINT [Task_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Task] ADD CONSTRAINT [Task_incidentId_fkey] FOREIGN KEY ([incidentId]) REFERENCES [dbo].[Incident]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Attachment] ADD CONSTRAINT [Attachment_incidentId_fkey] FOREIGN KEY ([incidentId]) REFERENCES [dbo].[Incident]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Attachment] ADD CONSTRAINT [Attachment_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[_IncidentSites] ADD CONSTRAINT [_IncidentSites_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[Incident]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_IncidentSites] ADD CONSTRAINT [_IncidentSites_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[Site]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_IncidentAssignedUsers] ADD CONSTRAINT [_IncidentAssignedUsers_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[Incident]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_IncidentAssignedUsers] ADD CONSTRAINT [_IncidentAssignedUsers_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
