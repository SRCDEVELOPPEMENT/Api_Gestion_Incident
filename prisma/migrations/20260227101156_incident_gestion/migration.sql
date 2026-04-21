BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[IncidentComment] (
    [id] INT NOT NULL IDENTITY(1,1),
    [incidentId] INT NOT NULL,
    [userId] INT NOT NULL,
    [content] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [IncidentComment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [IncidentComment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[IncidentComment] ADD CONSTRAINT [IncidentComment_incidentId_fkey] FOREIGN KEY ([incidentId]) REFERENCES [dbo].[Incident]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[IncidentComment] ADD CONSTRAINT [IncidentComment_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
