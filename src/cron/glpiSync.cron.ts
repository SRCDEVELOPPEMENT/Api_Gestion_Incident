import cron from 'node-cron';
import { GlpiSyncService } from '../services/glpiSync.service';

let isRunning = false;

export function startGlpiSyncCron() {
  console.log('[CRON] GLPI sync cron initialized');

  cron.schedule('* * * * *', async () => {
    if (isRunning) {
      console.log('[CRON] GLPI sync skipped because previous sync is still running');
      return;
    }
    isRunning = true;
    console.log('[CRON] GLPI sync started at', new Date().toISOString());
    try {
      const service = new GlpiSyncService();
      const userResult = await service.syncUsersToLocalDb(1000);
      const ticketResult = await service.syncTicketsToLocalDb(1000);
      console.log('[CRON] GLPI user sync result:', userResult);
      console.log('[CRON] GLPI ticket sync result:', ticketResult);
    } catch (error) {
      console.error('[CRON] GLPI sync failed:', error);
    } finally {
      isRunning = false;
      console.log('[CRON] GLPI sync finished at', new Date().toISOString());
    }
  });
}
