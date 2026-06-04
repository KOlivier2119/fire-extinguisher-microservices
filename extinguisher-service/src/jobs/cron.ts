import cron from 'node-cron';
import { markOverdueInspections } from '../services/inspection.service';
import { syncExpiredStatus } from '../services/extinguisher.service';

export function startCronJobs() {
  cron.schedule('0 * * * *', async () => {
    console.log('Running overdue inspection check...');
    await markOverdueInspections();
    await syncExpiredStatus();
  });
  markOverdueInspections();
  syncExpiredStatus();
}
