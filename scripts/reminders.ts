import { runReminderBatch } from '../src/services/reminders';
import { db } from '../src/lib/db';
let running = true;
process.on('SIGTERM', () => {
  running = false;
});
process.on('SIGINT', () => {
  running = false;
});
async function main() {
  console.log('Workify hatırlatma işçisi başladı.');
  while (running) {
    try {
      await runReminderBatch();
    } catch {
      console.error(
        'Hatırlatma turu tamamlanamadı; sonraki turda tekrar denenecek.',
      );
    }
    if (running) await new Promise((resolve) => setTimeout(resolve, 15000));
  }
  await db.$disconnect();
}
void main().catch(() => {
  console.error('Hatırlatma işçisi durdu.');
  process.exitCode = 1;
});
