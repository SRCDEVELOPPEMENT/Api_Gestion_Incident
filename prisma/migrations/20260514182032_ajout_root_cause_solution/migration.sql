BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Incident] ALTER COLUMN [description] NVARCHAR(max) NOT NULL;
ALTER TABLE [dbo].[Incident] ADD [proposedSolution] NVARCHAR(max),
[rootCause] NVARCHAR(max);

-- AlterTable
ALTER TABLE [dbo].[User] ADD [email] NVARCHAR(4000),
[firstName] NVARCHAR(4000),
[lastName] NVARCHAR(4000),
[matricule] NVARCHAR(4000),
[resetPasswordExpires] DATETIME2,
[resetPasswordToken] NVARCHAR(4000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
