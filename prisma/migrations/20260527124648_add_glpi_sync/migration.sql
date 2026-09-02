BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[GLPIUser] (
    [id] INT NOT NULL IDENTITY(1,1),
    [glpiId] INT NOT NULL,
    [login] NVARCHAR(255),
    [email] NVARCHAR(255),
    [firstName] NVARCHAR(4000),
    [lastName] NVARCHAR(4000),
    [fullName] NVARCHAR(4000),
    [phone] NVARCHAR(255),
    [status] NVARCHAR(100) NOT NULL CONSTRAINT [GLPIUser_status_df] DEFAULT 'ACTIVE',
    [isDeletedInSource] BIT NOT NULL CONSTRAINT [GLPIUser_isDeletedInSource_df] DEFAULT 0,
    [sourceUpdatedAt] DATETIME2,
    [lastSyncedAt] DATETIME2,
    [syncStatus] NVARCHAR(100) NOT NULL CONSTRAINT [GLPIUser_syncStatus_df] DEFAULT 'SYNCED',
    [rawPayload] NVARCHAR(4000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [GLPIUser_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [GLPIUser_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [GLPIUser_glpiId_key] UNIQUE NONCLUSTERED ([glpiId])
);

-- CreateTable
CREATE TABLE [dbo].[GLPITicket] (
    [id] INT NOT NULL IDENTITY(1,1),
    [glpiId] INT NOT NULL,
    [ticketNumber] NVARCHAR(255),
    [title] NVARCHAR(4000) NOT NULL,
    [description] NVARCHAR(4000),
    [ticketType] NVARCHAR(100),
    [status] NVARCHAR(100) NOT NULL CONSTRAINT [GLPITicket_status_df] DEFAULT 'OPEN',
    [priority] NVARCHAR(100),
    [urgency] NVARCHAR(100),
    [impact] NVARCHAR(100),
    [categoryName] NVARCHAR(4000),
    [entityName] NVARCHAR(4000),
    [locationName] NVARCHAR(4000),
    [openedAt] DATETIME2,
    [dueAt] DATETIME2,
    [resolvedAt] DATETIME2,
    [closedAt] DATETIME2,
    [sourceUpdatedAt] DATETIME2,
    [lastSyncedAt] DATETIME2,
    [syncStatus] NVARCHAR(100) NOT NULL CONSTRAINT [GLPITicket_syncStatus_df] DEFAULT 'SYNCED',
    [rawPayload] NVARCHAR(4000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [GLPITicket_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [GLPITicket_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [GLPITicket_glpiId_key] UNIQUE NONCLUSTERED ([glpiId])
);

-- CreateTable
CREATE TABLE [dbo].[IncidentGLPIUser] (
    [incidentId] INT NOT NULL,
    [glpiUserId] INT NOT NULL,
    [assignedAt] DATETIME2 NOT NULL CONSTRAINT [IncidentGLPIUser_assignedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [IncidentGLPIUser_pkey] PRIMARY KEY CLUSTERED ([incidentId],[glpiUserId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GLPIUser_email_idx] ON [dbo].[GLPIUser]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GLPIUser_login_idx] ON [dbo].[GLPIUser]([login]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GLPIUser_status_idx] ON [dbo].[GLPIUser]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GLPITicket_ticketNumber_idx] ON [dbo].[GLPITicket]([ticketNumber]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GLPITicket_status_idx] ON [dbo].[GLPITicket]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IncidentGLPIUser_glpiUserId_idx] ON [dbo].[IncidentGLPIUser]([glpiUserId]);

-- AddForeignKey
ALTER TABLE [dbo].[IncidentGLPIUser] ADD CONSTRAINT [IncidentGLPIUser_incidentId_fkey] FOREIGN KEY ([incidentId]) REFERENCES [dbo].[Incident]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[IncidentGLPIUser] ADD CONSTRAINT [IncidentGLPIUser_glpiUserId_fkey] FOREIGN KEY ([glpiUserId]) REFERENCES [dbo].[GLPIUser]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
