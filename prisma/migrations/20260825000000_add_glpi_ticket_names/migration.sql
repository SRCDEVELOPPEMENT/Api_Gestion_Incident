BEGIN TRY

BEGIN TRAN;

-- AlterTable: enrichir GLPITicket pour la page "Ticket GLPI"
ALTER TABLE [dbo].[GLPITicket] ADD
    [requesterName] NVARCHAR(4000),
    [assigneeName] NVARCHAR(4000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
