BEGIN TRY

BEGIN TRAN;

-- AlterTable : horodatages de cycle de vie de l'incident
ALTER TABLE [dbo].[Incident] ADD [takenInChargeAt] DATETIME2,
[resolvedAt] DATETIME2;

-- Backfill (résolution uniquement) : pour les incidents déjà clôturés, on approxime
-- la date de résolution par la dernière modification connue. Aucun backfill de
-- [takenInChargeAt] : aucun signal historique fiable (assignedAt vaut souvent createdAt).
-- NB : SQL Server compile tout le batch d'un coup ; on diffère donc la résolution du
-- nom de colonne nouvellement ajoutée via EXEC (sinon erreur 207 "Invalid column name").
EXEC('UPDATE [dbo].[Incident] SET [resolvedAt] = [updatedAt] WHERE [status] = ''CLOSED'' AND [resolvedAt] IS NULL;');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
